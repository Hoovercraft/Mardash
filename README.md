# Mardash

Lokaler Fork von MARDASH als Basis fuer den Umbau auf deinen Betrieb.

## Lokaler Start mit Docker Compose

```yaml
services:
  mardash:
    build:
      context: .
      dockerfile: Dockerfile
    image: mardash:local
    container_name: mardash
    ports:
      - "8282:8282"
    volumes:
      - ${HOME}/Projekte/Mardash-data:/data
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      SECRET_KEY: ${MARDASH_SECRET_KEY}
      SECURE_COOKIES: "false"
      LOG_LEVEL: ${MARDASH_LOG_LEVEL:-info}
    restart: unless-stopped
```

## Hinweise

- Daten liegen ausserhalb des Repos in `~/Projekte/Mardash-data`
- Start per `~/Projekte/_scripts_mardash/run.sh`
- Ziel: lokaler Betrieb, anschliessend Reduktion von Auth- und User-Logik
