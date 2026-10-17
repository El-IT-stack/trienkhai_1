FROM nginx:1.25-alpine

# Install openssl for dynamic self-signed certificate generation
RUN apk add --no-cache openssl

# Copy custom configurations
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

# Create log and cert directories
RUN mkdir -p /var/log/nginx /etc/nginx/certs

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
