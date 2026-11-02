const express = require('express');
const mysql = require('mysql2/promise');

const router = express.Router();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 3,
  connectTimeout: 5000
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query({
      sql: 'SELECT DATABASE() AS base_de_datos, VERSION() AS version_mysql, 1 AS prueba',
      timeout: 5000
    });

    res.json({
      estado: 'conectado',
      motor: 'MySQL',
      ...rows[0]
    });
  } catch (error) {
    console.error('Error MySQL:', error.code);
    res.status(503).json({
      estado: 'error',
      motor: 'MySQL',
      codigo: error.code || 'ERROR_CONEXION'
    });
  }
});

module.exports = router;
