FROM node:16.20.2-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json .

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY public/ ./public/
COPY src/ ./src/

EXPOSE 3000

CMD ["npm", "start"]