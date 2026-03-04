FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
# Use legacy-peer-deps to fix React 19/Next 15 conflict
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
RUN npm run build

# Start
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
CMD ["npm", "start"]
