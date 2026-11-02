const express = require('express');
const { createClient } = require('redis');

const router = express.Router();

router.get('/', async (req, res) => {
  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT || 6379),
      connectTimeout: 5000,
      reconnectStrategy: false
    },
    password: process.env.REDIS_PASSWORD,
    disableOfflineQueue: true
  });

  client.on('error', (error) => {
    console.error('Error Redis:', error.code);
  });

  try {
    await client.connect();
    const respuesta = await client.ping();
    const clave = 'practica:uq:comprobacion';
    await client.set(clave, 'Cache funcionando', { EX: 60 });
    const valor = await client.get(clave);

    res.json({
      estado: 'conectado',
      motor: 'Redis',
      respuesta,
      valor_leido: valor,
      prueba: respuesta === 'PONG' && valor === 'Cache funcionando'
    });
  } catch (error) {
    res.status(503).json({
      estado: 'error',
      motor: 'Redis',
      codigo: error.code || 'ERROR_CONEXION'
    });
  } finally {
    if (client.isOpen) client.destroy();
  }
});

module.exports = router;
