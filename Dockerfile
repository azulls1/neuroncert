# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Adjust permissions so non-root user can write to nginx cache, logs, and pid
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /var/run && \
    chown -R appuser:appgroup /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown appuser:appgroup /var/run/nginx.pid

COPY --from=build /app/dist/simulador-examen-csa/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ensure html directory is readable by non-root user
RUN chown -R appuser:appgroup /usr/share/nginx/html

USER appuser

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
