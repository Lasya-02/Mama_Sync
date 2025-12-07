# -------------------------
# ✅ Build Stage
# -------------------------
FROM node:20 AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files
COPY . .

# -------------------------
# ✅ Build-time Arguments
# -------------------------
# Accept API URL and Google Maps API Key from GitHub Actions
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

ARG REACT_APP_GOOGLE_MAPS_API_KEY
ENV REACT_APP_GOOGLE_MAPS_API_KEY=$REACT_APP_GOOGLE_MAPS_API_KEY

# Build React app with production env variables
RUN npm run build

# -------------------------
# ✅ Production Stage (Nginx)
# -------------------------
FROM nginx:alpine

# Remove default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy your custom configuration file to Nginx's configuration directory
COPY nginx.conf /etc/nginx/nginx.conf

# Copy React build output from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
