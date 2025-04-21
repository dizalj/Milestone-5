# Use Node.js image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of code
COPY . .

# Expose the port
EXPOSE 5000

# Start your server
CMD ["node", "app.js"]
