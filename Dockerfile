# Use the official Node.js 14 image as the base image
FROM node:14

# Install OpenJDK 11
RUN apt-get update && \
    apt-get install -y openjdk-11-jdk

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Create the directories for the Java code and output
RUN mkdir java-code
RUN mkdir output

# Set environment variable for limiting CPU speed (Optional)
ENV CPU_LIMIT=100000

# Expose the port your app runs on
EXPOSE 3000

# Set the command to run your API
CMD ["node", "server.js"]
