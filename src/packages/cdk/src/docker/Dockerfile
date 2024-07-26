# Use the official Node.js image as the base
FROM node:20

# Set the working directory within the container
WORKDIR /usr/src/app

# Copy the application code from the specified directory
COPY ./dist/backend/ ./

# Expose the port your app will run on (e.g., 3000)
EXPOSE 3000

# Run the application (replace with your actual command)
CMD ["node", "index.js"] 