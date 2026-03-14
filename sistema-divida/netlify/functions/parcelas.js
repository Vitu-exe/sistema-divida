const { Client } = require('pg');

exports.handler = async (event, context) => {
    // Puxa a string de conexão das variáveis de ambiente do Netlify
    const client = new Client({
        connectionString: process.env.DATABASE_URL, 
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Rota GET: Buscar todas as parcelas
        if (event.httpMethod === 'GET') {
            const res = await client.query('SELECT * FROM parcelas ORDER BY numero ASC');
            return {
                statusCode: 200,
                body: JSON.stringify(res.rows),
            };
        }

        // Rota PUT: Atualizar pagamento de uma parcela
        if (event.httpMethod === 'PUT') {
            const data = JSON.parse(event.body);
            
            // Removida a permissão para alterar o 'valor_esperado'.
            // Agora o cliente só consegue alterar os dados do pagamento em si.
            const query = `
                UPDATE parcelas 
                SET pago = $1, data_pagamento = $2, valor_pago = $3
                WHERE id = $4 RETURNING *
            `;
            const values = [data.pago, data.dataPagamento, data.valorPago, data.id];
            
            const res = await client.query(query, values);
            
            return {
                statusCode: 200,
                body: JSON.stringify(res.rows[0]),
            };
        }

        return { statusCode: 405, body: 'Method Not Allowed' };

    } catch (error) {
        console.error('Database error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    } finally {
        await client.end();
    }
};
