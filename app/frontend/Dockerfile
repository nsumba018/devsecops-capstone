FROM nginx:1.27-alpine

# Replace the default server block with our own (listens on 8080).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static site.
COPY index.html app.js styles.css /usr/share/nginx/html/

EXPOSE 8080
