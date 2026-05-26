FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o geo-service .


FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY --from=builder /app/geo-service ./geo-service
COPY GeoLite2-City.mmdb ./GeoLite2-City.mmdb

ENV GEOIP_DB_PATH=/app/GeoLite2-City.mmdb

CMD ["./geo-service"]