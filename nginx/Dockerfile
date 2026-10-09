FROM nginx:alpine

RUN apk add --no-cache openssl

# Self-signed cert — good enough for local learning
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/key.pem \
      -out    /etc/nginx/ssl/cert.pem \
      -subj "/C=US/ST=Local/L=Local/O=Learning/CN=localhost"

COPY nginx.conf /etc/nginx/nginx.conf
COPY html/      /usr/share/nginx/html/
