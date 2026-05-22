package main

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/oschwald/geoip2-golang"
)

type GeoResponse struct {
	IP        string  `json:"ip,omitempty"`
	Country   string  `json:"country,omitempty"`
	Region    string  `json:"region,omitempty"`
	City      string  `json:"city,omitempty"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

func main() {
	dbPath := os.Getenv("GEOIP_DB_PATH")
	if dbPath == "" {
		dbPath = "./GeoLite2-City.mmdb"
	}

	db, err := geoip2.Open(dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	mux.HandleFunc("/geo/me", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		ipStr := getClientIP(r)

		ip := net.ParseIP(ipStr)
		if ip == nil {
			http.Error(w, "invalid ip", http.StatusBadRequest)
			return
		}

		record, err := db.City(ip)
		if err != nil {
			http.Error(w, "geo lookup failed", http.StatusInternalServerError)
			return
		}

		region := ""
		if len(record.Subdivisions) > 0 {
			region = record.Subdivisions[0].Names["en"]
		}
		
		resp := GeoResponse{
			IP:        anonymizeIP(ipStr),
			Country:   record.Country.IsoCode,
			Region:    region,
			City:      record.City.Names["en"],
			Latitude:  record.Location.Latitude,
			Longitude: record.Location.Longitude,
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	handler := withCORS(mux)

	log.Println("geo-service started on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func withCORS(next http.Handler) http.Handler {
	allowedOrigins := parseAllowedOrigins(os.Getenv("ALLOWED_ORIGINS"))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if origin != "" && isAllowedOrigin(origin, allowedOrigins) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Max-Age", "86400")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func parseAllowedOrigins(value string) map[string]bool {
	origins := make(map[string]bool)

	for _, origin := range strings.Split(value, ",") {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			origins[origin] = true
		}
	}

	return origins
}

func isAllowedOrigin(origin string, allowedOrigins map[string]bool) bool {
	return allowedOrigins[origin]
}

func getClientIP(r *http.Request) string {
	if ip := r.Header.Get("CF-Connecting-IP"); ip != "" {
		return strings.TrimSpace(ip)
	}

	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return strings.TrimSpace(ip)
	}

	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		parts := strings.Split(forwarded, ",")
		return strings.TrimSpace(parts[0])
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}

	return host
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