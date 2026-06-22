# Small, security-friendly base. Pinning a digest in production is even better.
FROM node:20-alpine

# Create an unprivileged user so the container does not run as root
# (Trivy & Semgrep both flag root containers).
WORKDIR /app

# Install dependencies first to leverage Docker layer caching.
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy the application source.
COPY server.js ./

# Drop privileges.
USER node

EXPOSE 3000
CMD ["node", "server.js"]
