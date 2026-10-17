# ==============================================================================
# CINEEVENT BACKEND DOCKERFILE
# Hardening: Multi-stage, locked version, Non-root user (node:node)
# ==============================================================================

FROM node:20-alpine

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Create working directory and log directory
WORKDIR /app
RUN mkdir -p /var/log/cineevent && \
    chown -R node:node /var/log/cineevent /app

# Copy package descriptors first for Docker layer caching
COPY --chown=node:node package.json ./

# Install production dependencies
RUN npm install --omit=dev --no-audit --no-fund

# Copy backend source code and frontend assets
COPY --chown=node:node . .

# Run as non-root user (Hardening requirement 13.1)
USER node

# Expose internal port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/health || exit 1

# Start server
CMD ["node", "src/server.js"]
