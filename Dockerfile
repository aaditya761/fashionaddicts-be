FROM node:slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY ./package*.json ./
RUN npm install

# Copy rest of the application code
COPY . .

# Build the NestJS app
RUN yarn build

# Expose port
EXPOSE 3000

# Start the production server
CMD ["node", "dist/main.js"]
