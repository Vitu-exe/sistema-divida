const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Rotas (agora usando o prefixo /api)
router.get('/status', (req, res) => {
  res.json({ status: 'Online', message: 'API rodando no Netlify!' });
});

router.get('/dividas/:cliente_nome', async (req, res) => {
  const { cliente_nome } = req.params;
  try {
    const contratoQuery = await pool.query(
      'SELECT * FROM contratos WHERE cliente_nome ILIKE $1',
      [cliente_nome]
    );
    if (contratoQuery.rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
    const contrato = contratoQuery.rows[0];
    const parcelasQuery = await pool.query(
      'SELECT * FROM parcelas WHERE contrato_id = $1 ORDER BY data_vencimento ASC',
      [contrato.id]
    );
    res.json({ contrato, parcelas: parcelasQuery.rows });
  } catch (error) {
    res.status(500).json({ error: 'Erro no banco' });
  }
});

router.post('/pagamentos/manual', async (req, res) => {
  const { parcela_id, data_pagamento } = req.body;
  try {
    await pool.query(
      'UPDATE parcelas SET status = \'pago\', data_pagamento = $1 WHERE id = $2',
      [data_pagamento, parcela_id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

app.use('/api', router);

module.exports.handler = serverless(app);
