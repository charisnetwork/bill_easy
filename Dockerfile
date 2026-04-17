# Use Node 22 LTS for compatibility with Vite 6+ and React Router 7
FROM node:22-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy root package files
COPY package.json package-lock.json ./

# Install root dependencies
RUN npm install --omit=dev

# Copy backend package files
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy admin backend package files
COPY admin/backend/package.json admin/backend/package-lock.json ./admin/backend/
RUN cd admin/backend && npm install --omit=dev

# Copy frontend package files (need devDeps for building)
COPY frontend/package.json ./frontend/
# Note: package-lock.json might not exist in frontend if it uses yarn, 
# but we'll try to copy it if it exists
COPY frontend/package-lock.json* ./frontend/
RUN cd frontend && npm install --legacy-peer-deps

# Copy admin frontend package files
COPY admin/frontend/package.json ./admin/frontend/
COPY admin/frontend/package-lock.json* ./admin/frontend/
RUN cd admin/frontend && npm install --legacy-peer-deps

# Copy the rest of the source code
COPY . .

# Run the build process
RUN npm run build

# Cleanup devDependencies from frontend/admin-frontend after build
RUN rm -rf frontend/node_modules admin/frontend/node_modules

EXPOSE 8080

CMD ["node", "railway-monorepo.js"]
