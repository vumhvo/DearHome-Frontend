#!/usr/bin/env node

/**
 * This script helps resolve CORS issues by setting up a local 
 * server for 3D models during development.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3031;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  exposedHeaders: ['Content-Disposition', 'Content-Length'],
  maxAge: 86400
}));

// Serve models from public/models
const modelsDir = path.join(__dirname, 'public', 'models');

app.get('/', (req, res) => {
  res.send(`
    <h1>3D Model Server for DearHome</h1>
    <p>This server provides CORS-friendly access to 3D models.</p>
    <h2>Available Models:</h2>
    <ul>
      ${fs.readdirSync(modelsDir)
        .filter(file => !fs.statSync(path.join(modelsDir, file)).isDirectory())
        .map(file => `<li><a href="/models/${file}">${file}</a></li>`)
        .join('')
      }
    </ul>
  `);
});

// Serve static models
app.use('/models', express.static(modelsDir, {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
    res.set('Content-Type', 'model/gltf-binary');
  }
}));

// Start the server
app.listen(PORT, () => {
  console.log(`3D Model server running at http://localhost:${PORT}`);
  console.log(`Models available at http://localhost:${PORT}/models/`);
  console.log(`Use these URLs in your app to avoid CORS issues`);
});
