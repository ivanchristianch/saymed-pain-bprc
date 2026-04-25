FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000

# Development: uses tsx (no build step needed).
# For production, run: npm run build && node dist/index.js
CMD ["npm", "run", "dev"]
