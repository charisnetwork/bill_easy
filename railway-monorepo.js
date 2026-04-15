const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8000;

// Internal ports for backends
const MAIN_BACKEND_PORT = 8001;
const ADMIN_BACKEND_PORT = 3025;

console.log('Starting Monorepo Gateway...');

// Start Main Backend
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

// Start Admin Backend
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

// Proxy /api requests to Main Backend
app.use('/api', createProxyMiddleware({
  target: `http://127.0.0.1:${MAIN_BACKEND_PORT}`,
  changeOrigin: true,
}));

// Proxy /admin/api requests to Admin Backend
app.use('/admin/api', createProxyMiddleware({
  target: `http://127.0.0.1:${ADMIN_BACKEND_PORT}`,
  changeOrigin: true,
}));

// Serve uploads from both backends if needed, or unify them
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
      res.status(404).send('Frontend build not found. Please run build first.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Monorepo Gateway running on port ${PORT}`);
  console.log(`Main Backend Port: ${MAIN_BACKEND_PORT}`);
  console.log(`Admin Backend Port: ${ADMIN_BACKEND_PORT}`);
});

// Handle termination
process.on('SIGTERM', () => {
  mainBackend.kill();
  adminBackend.kill();
  process.exit(0);
});
