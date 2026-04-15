const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8000;

// Internal ports for backends
const MAIN_BACKEND_PORT = 8001;
const ADMIN_BACKEND_PORT = 3025;

console.log('🚀 Starting Bill Easy Monorepo Gateway...');
console.log(`📡 External Port: ${PORT}`);

// Health check endpoint for Railway
app.get('/health', async (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'monorepo-gateway',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Start Main Backend
console.log('[Gateway] Starting Main Backend...');
const mainBackend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  env: { ...process.env, PORT: MAIN_BACKEND_PORT }
});

mainBackend.stdout.on('data', (data) => {
  process.stdout.write(`[Main Backend]: ${data}`);
});

mainBackend.stderr.on('data', (data) => {
  process.stderr.write(`[Main Backend Error]: ${data}`);
});

mainBackend.on('close', (code) => {
  console.log(`[Main Backend] Process exited with code ${code}`);
});

// Start Admin Backend
console.log('[Gateway] Starting Admin Backend...');
const adminBackend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'admin/backend'),
  env: { ...process.env, PORT: ADMIN_BACKEND_PORT }
});

adminBackend.stdout.on('data', (data) => {
  process.stdout.write(`[Admin Backend]: ${data}`);
});

adminBackend.stderr.on('data', (data) => {
  process.stderr.write(`[Admin Backend Error]: ${data}`);
});

adminBackend.on('close', (code) => {
  console.log(`[Admin Backend] Process exited with code ${code}`);
});

// Wait a bit for backends to start, then setup proxy
setTimeout(() => {
  // Proxy /api requests to Main Backend
  app.use('/api', createProxyMiddleware({
    target: `http://127.0.0.1:${MAIN_BACKEND_PORT}`,
    changeOrigin: true,
    ws: true,
    onError: (err, req, res) => {
      console.error('[Proxy Error] Main Backend:', err.message);
      res.status(503).json({ error: 'Backend service temporarily unavailable' });
    }
  }));

  // Proxy /admin/api requests to Admin Backend
  app.use('/admin/api', createProxyMiddleware({
    target: `http://127.0.0.1:${ADMIN_BACKEND_PORT}`,
    changeOrigin: true,
    onError: (err, req, res) => {
      console.error('[Proxy Error] Admin Backend:', err.message);
      res.status(503).json({ error: 'Admin backend service temporarily unavailable' });
    }
  }));

  // Serve uploads from backend
  app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));
  app.use('/admin/uploads', express.static(path.join(__dirname, 'admin/backend/uploads')));

  // Serve Frontend static files
  const frontendDistPath = path.join(__dirname, 'frontend/dist');
  app.use(express.static(frontendDistPath));

  // Handle Frontend routing (SPA fallback)
  app.get('*', (req, res) => {
    // If request is for an API that doesn't exist, don't serve index.html
    if (req.url.startsWith('/api/') || req.url.startsWith('/admin/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
      if (err) {
        console.error('[Frontend] Error serving index.html:', err.message);
        res.status(404).send('Frontend build not found. Please run build first.');
      }
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('[Gateway Error]:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log(`✅ Monorepo Gateway running on port ${PORT}`);
    console.log(`🔗 Main Backend: http://localhost:${MAIN_BACKEND_PORT}`);
    console.log(`🔗 Admin Backend: http://localhost:${ADMIN_BACKEND_PORT}`);
    console.log(`🌐 Frontend: ${frontendDistPath}`);
    console.log('========================================');
  });

}, 5000); // Wait 5 seconds for backends to initialize

// Handle termination gracefully
process.on('SIGTERM', () => {
  console.log('[Gateway] SIGTERM received, shutting down...');
  mainBackend.kill();
  adminBackend.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Gateway] SIGINT received, shutting down...');
  mainBackend.kill();
  adminBackend.kill();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('[Gateway] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Gateway] Unhandled Rejection:', reason);
});
