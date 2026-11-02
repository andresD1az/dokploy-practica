const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  max: 3,
  connectionTimeoutMillis: 5000,
  statement_timeout: 5000
});

pool.on('error', (error) => {
  console.error('Error del pool PostgreSQL:', error.code);
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS base_de_datos, current_setting('server_version') AS version_postgres, 1 AS prueba"
    );

    res.json({
      estado: 'conectado',
      motor: 'PostgreSQL',
      ...result.rows[0]
    });
  } catch (error) {
    console.error('Error PostgreSQL:', error.code);
    res.status(503).json({
      estado: 'error',
      motor: 'PostgreSQL',
      codigo: error.code || 'ERROR_CONEXION'
    });
  }
});

module.exports = router;
