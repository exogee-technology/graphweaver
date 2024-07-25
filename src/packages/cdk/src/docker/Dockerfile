# Use the official Node.js image as the base
FROM node:20

# Set the working directory within the container
WORKDIR /usr/src/app

# Define the build-time argument for the application directory
ARG APP_DIR=./

# Copy package.json and package-lock.json (if available) first for caching
COPY ${APP_DIR}/package*.json ./

# Install dependencies, including esbuild
RUN pnpm i

# Copy the application code from the specified directory
COPY ${APP_DIR} ./

# Build the application with esbuild (replace with your actual command)
RUN pnpm build

# Expose the port your app will run on (e.g., 3000)
EXPOSE 3000

# Run the application (replace with your actual command)
CMD ["node", "dist/backend/index.js"] 