FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o geo-service main.go

FROM alpine:3.20

WORKDIR /app

COPY --from=builder /app/geo-service /app/geo-service
COPY GeoLite2-City.mmdb /app/GeoLite2-City.mmdb

ENV PORT=8080
ENV GEOIP_DB_PATH=/app/GeoLite2-City.mmdb

EXPOSE 8080

CMD ["/app/geo-service"]