FROM node:20-slim AS base

# Create app directory
WORKDIR /app

# Copy both the app and the local library into the container
COPY ./package.json ./package-lock.json ./
COPY ../package.json ../package-lock.json ../tsconfig.json ../dist ../

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Build the app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3030

# Start the app
CMD ["npm", "run", "start"] 