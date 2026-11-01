const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || '1.0.0';

app.set('json spaces', 2);

app.get('/', (req, res) => {
  res.json({
    mensaje: '¡Aplicación desplegada con Dokploy!',
    aplicacion: process.env.APP_NAME || 'UniQuindio WebApp',
    institucion: 'Universidad del Quindío',
    programa: 'Ingeniería de Sistemas y Computación',
    curso: 'Administración de Infraestructura TI',
    autor: 'Eyner Andrés Díaz Díaz',
    plataforma: 'Dokploy PaaS',
    version: VERSION,
    fecha: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    estado: 'saludable',
    uptime: process.uptime(),
    version: VERSION,
    plataforma: 'Dokploy'
  });
});

app.get('/info', (req, res) => {
  res.json({
    node_version: process.version,
    plataforma: os.platform(),
    arquitectura: os.arch(),
    memoria_total_mb: Math.round(os.totalmem() / 1024 / 1024),
    memoria_libre_mb: Math.round(os.freemem() / 1024 / 1024)
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Aplicación iniciada en el puerto ${PORT}`);
});
