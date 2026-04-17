const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.set('trust proxy', 1);

console.log('🚀 Starting Monorepo Gateway...');

// Start Main Backend
const mainBackend = spawn('node', ['server.js'], { 
  cwd: path.join(__dirname, 'backend'),
  env: Object.assign({}, process.env, { PORT: '8001' }),
  stdio: 'inherit'
});

// Start Admin Backend
const adminBackend = spawn('node', ['server.js'], { 
  cwd: path.join(__dirname, 'admin/backend'),
  env: Object.assign({}, process.env, { PORT: '3025' }),
  stdio: 'inherit'
});

// 1. Serve Main Frontend Static Files (HIGHEST PRIORITY)
const mainFrontendPath = path.join(__dirname, 'frontend/dist');
console.log(`🔍 Checking for main frontend at: ${mainFrontendPath}`);

if (fs.existsSync(mainFrontendPath) && fs.existsSync(path.join(mainFrontendPath, 'index.html'))) {
  console.log('✅ Main frontend found, serving static files.');
  app.use(express.static(mainFrontendPath));
} else {
  console.log('⚠️ Main frontend NOT found or index.html missing.');
}

// Log directory structure for debugging
console.log('📂 Current Directory:', __dirname);
console.log('📂 Contents:', fs.readdirSync(__dirname));
if (fs.existsSync(path.join(__dirname, 'frontend'))) {
  console.log('📂 Frontend Contents:', fs.readdirSync(path.join(__dirname, 'frontend')));
}

// 2. Proxy API routes (Use specific matching)
app.use('/admin/api', createProxyMiddleware({ 
  target: 'http://localhost:3025', 
  pathRewrite: { '^/': '/api/' },
  changeOrigin: true,
  logLevel: 'debug',
  proxyTimeout: 60000,
  timeout: 60000
}));

app.use('/api', createProxyMiddleware({ 
  target: 'http://localhost:8001', 
  pathRewrite: { '^/': '/api/' },
  changeOrigin: true,
  logLevel: 'debug',
  proxyTimeout: 60000,
  timeout: 60000
}));

// 3. Serve Uploads
app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));

// 4. Serve Admin Frontend
const adminFrontendPath = path.join(__dirname, 'admin/frontend/dist');
if (fs.existsSync(adminFrontendPath)) {
  app.use('/admin-portal', express.static(adminFrontendPath));
  app.get('/admin-portal/*', (req, res) => {
    res.sendFile(path.join(adminFrontendPath, 'index.html'));
  });
}

// 5. Fallback for Main SPA (must be after /api and static)
if (fs.existsSync(mainFrontendPath)) {
  console.log('✅ SPA Fallback enabled');
  app.get('/*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/admin/api') || req.url.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(mainFrontendPath, 'index.html'));
  });
} else {
  console.log('⚠️ SPA Fallback disabled - frontend/dist not found');
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: sans-serif; padding: 2rem; text-align: center;">
        <h1 style="color: #2563eb;">🚀 Bill Easy Monorepo Gateway is ACTIVE</h1>
        <p>This is the gateway server. The main frontend (React) build was not found in <code>frontend/dist</code>.</p>
        <div style="margin-top: 2rem; padding: 1rem; background: #f3f4f6; border-radius: 8px; display: inline-block;">
          <strong>API Status:</strong> <a href="/api">Main API</a> | <a href="/admin/api">Admin API</a> | <a href="/health">Health Check</a>
        </div>
      </div>
    `);
  });
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'gateway-ok' });
});

app.listen(PORT, () => {
  console.log(`✅ Monorepo Gateway running on port ${PORT}`);
  console.log(`🔗 Main API: /api`);
  console.log(`🔗 Admin API: /admin/api`);
  console.log(`🔗 Admin Portal: /admin-portal`);
  console.log(`🔗 Uploads: /uploads`);
});
