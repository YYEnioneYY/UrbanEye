package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/oschwald/geoip2-golang"
	"github.com/twmb/franz-go/pkg/kgo"
)

const (
	headerCorrelationID  = "kafka_correlationId"
	headerReplyTopic     = "kafka_replyTopic"
	headerReplyPartition = "kafka_replyPartition"
)

type App struct {
	db          *geoip2.Reader
	kafkaClient *kgo.Client
}

type GeoRequest struct {
	IP string `json:"ip"`
}

type GeoResponse struct {
	IP        string  `json:"ip,omitempty"`
	Country   string  `json:"country,omitempty"`
	Region    string  `json:"region,omitempty"`
	City      string  `json:"city,omitempty"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type NestKafkaSuccessResponse struct {
	Response   GeoResponse `json:"response"`
	IsDisposed bool        `json:"isDisposed"`
}

type NestKafkaErrorResponse struct {
	Err        KafkaError `json:"err"`
	IsDisposed bool      `json:"isDisposed"`
}

type KafkaError struct {
	StatusCode int    `json:"statusCode"`
	Code       string `json:"code"`
	Message    string `json:"message"`
}

func main() {
	dbPath := getEnv("GEOIP_DB_PATH", "./GeoLite2-City.mmdb")

	db, err := geoip2.Open(dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	brokers := splitEnv(getEnv("KAFKA_BROKERS", "localhost:9092"))
	groupID := getEnv("KAFKA_GROUP_ID", "geo-service-consumer")
	requestTopic := getEnv("KAFKA_REQUEST_TOPIC", "geo.me")

	kafkaClient, err := kgo.NewClient(
		kgo.SeedBrokers(brokers...),
		kgo.ConsumerGroup(groupID),
		kgo.ConsumeTopics(requestTopic),
	)
	if err != nil {
		log.Fatal(err)
	}
	defer kafkaClient.Close()

	app := &App{
		db:          db,
		kafkaClient: kafkaClient,
	}

	ctx, cancel := signal.NotifyContext(
		context.Background(),
		os.Interrupt,
		syscall.SIGTERM,
	)
	defer cancel()

	log.Println("geo-service started in Kafka-only mode")
	log.Println("kafka brokers:", strings.Join(brokers, ","))
	log.Println("kafka request topic:", requestTopic)
	log.Println("kafka group id:", groupID)

	app.consumeKafka(ctx)
}

func (a *App) consumeKafka(ctx context.Context) {
	for {
		fetches := a.kafkaClient.PollFetches(ctx)

		if ctx.Err() != nil {
			log.Println("geo-service stopped")
			return
		}

		if errs := fetches.Errors(); len(errs) > 0 {
			for _, err := range errs {
				log.Printf(
					"kafka fetch error: topic=%s partition=%d err=%v",
					err.Topic,
					err.Partition,
					err.Err,
				)
			}

			continue
		}

		fetches.EachRecord(func(record *kgo.Record) {
			a.handleKafkaRecord(ctx, record)
		})
	}
}

func (a *App) handleKafkaRecord(ctx context.Context, record *kgo.Record) {
	var req GeoRequest

	if err := json.Unmarshal(record.Value, &req); err != nil {
		a.replyKafkaError(ctx, record, 400, "INVALID_PAYLOAD", "Invalid geo request payload")
		return
	}

	if strings.TrimSpace(req.IP) == "" {
		a.replyKafkaError(ctx, record, 400, "IP_REQUIRED", "IP is required")
		return
	}

	resp, err := a.lookupIP(req.IP)
	if err != nil {
		a.replyKafkaError(ctx, record, 400, "GEO_LOOKUP_FAILED", err.Error())
		return
	}

	a.replyKafkaSuccess(ctx, record, resp)
}

func (a *App) lookupIP(ipStr string) (GeoResponse, error) {
	ipStr = normalizeIPString(ipStr)

	ip := net.ParseIP(ipStr)
	if ip == nil {
		return GeoResponse{}, errors.New("invalid ip")
	}

	record, err := a.db.City(ip)
	if err != nil {
		return GeoResponse{}, errors.New("geo lookup failed")
	}

	region := ""
	if len(record.Subdivisions) > 0 {
		region = record.Subdivisions[0].Names["en"]
	}

	return GeoResponse{
		IP:        anonymizeIP(ipStr),
		Country:   record.Country.IsoCode,
		Region:    region,
		City:      record.City.Names["en"],
		Latitude:  record.Location.Latitude,
		Longitude: record.Location.Longitude,
	}, nil
}

func (a *App) replyKafkaSuccess(
	ctx context.Context,
	requestRecord *kgo.Record,
	response GeoResponse,
) {
	replyTopic := string(getKafkaHeader(requestRecord, headerReplyTopic))
	correlationID := getKafkaHeader(requestRecord, headerCorrelationID)
	replyPartition := parseReplyPartition(
		getKafkaHeader(requestRecord, headerReplyPartition),
	)

	if replyTopic == "" || len(correlationID) == 0 {
		log.Println("kafka reply headers are missing")
		return
	}

	body, err := json.Marshal(NestKafkaSuccessResponse{
		Response:   response,
		IsDisposed: true,
	})
	if err != nil {
		log.Println("failed to marshal kafka success response:", err)
		return
	}

	a.produceReply(ctx, replyTopic, replyPartition, requestRecord.Key, correlationID, body)
}

func (a *App) replyKafkaError(
	ctx context.Context,
	requestRecord *kgo.Record,
	statusCode int,
	code string,
	message string,
) {
	replyTopic := string(getKafkaHeader(requestRecord, headerReplyTopic))
	correlationID := getKafkaHeader(requestRecord, headerCorrelationID)
	replyPartition := parseReplyPartition(
		getKafkaHeader(requestRecord, headerReplyPartition),
	)

	if replyTopic == "" || len(correlationID) == 0 {
		log.Println("kafka reply headers are missing")
		return
	}

	body, err := json.Marshal(NestKafkaErrorResponse{
		Err: KafkaError{
			StatusCode: statusCode,
			Code:       code,
			Message:    message,
		},
		IsDisposed: true,
	})
	if err != nil {
		log.Println("failed to marshal kafka error response:", err)
		return
	}

	a.produceReply(ctx, replyTopic, replyPartition, requestRecord.Key, correlationID, body)
}

func (a *App) produceReply(
	ctx context.Context,
	replyTopic string,
	replyPartition int32,
	key []byte,
	correlationID []byte,
	value []byte,
) {
	done := make(chan error, 1)

	a.kafkaClient.Produce(ctx, &kgo.Record{
		Topic:     replyTopic,
		Partition: replyPartition,
		Key:       key,
		Value:     value,
		Headers: []kgo.RecordHeader{
			{
				Key:   headerCorrelationID,
				Value: correlationID,
			},
		},
	}, func(_ *kgo.Record, err error) {
		done <- err
	})

	select {
	case err := <-done:
		if err != nil {
			log.Println("failed to produce kafka reply:", err)
		}
	case <-time.After(5 * time.Second):
		log.Println("kafka reply timeout")
	}
}

func getKafkaHeader(record *kgo.Record, key string) []byte {
	for _, header := range record.Headers {
		if header.Key == key {
			return header.Value
		}
	}

	return nil
}

func parseReplyPartition(value []byte) int32 {
	if len(value) == 0 {
		return 0
	}

	partition, err := strconv.Atoi(string(value))
	if err != nil {
		return 0
	}

	return int32(partition)
}

func normalizeIPString(ip string) string {
	ip = strings.TrimSpace(ip)

	if strings.HasPrefix(ip, "::ffff:") {
		return strings.TrimPrefix(ip, "::ffff:")
	}

	if ip == "::1" {
		return "127.0.0.1"
	}

	return ip
}

func anonymizeIP(ip string) string {
	parsed := net.ParseIP(ip)
	if parsed == nil {
		return ""
	}

	if v4 := parsed.To4(); v4 != nil {
		return net.IPv4(v4[0], v4[1], v4[2], 0).String()
	}

	return ip
}

func splitEnv(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))

	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			result = append(result, part)
		}
	}

	return result
}

func getEnv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	return value
}