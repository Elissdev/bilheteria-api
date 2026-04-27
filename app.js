const express = require('express');
const db = require('./db'); // Importando o cabo de conexão

const app = express();
app.use(express.json());

// Rota para criar um novo evento 
app.post('/eventos', async (req, res) => {
    const { nome, ingressos_disponiveis } = req.body;

    // Regra de Negócio Básica: Precisa ter nome e ingressos
    if (!nome || ingressos_disponiveis === undefined) {
        return res.status(400).json({ erro: 'Dados incompletos para criar o evento.' });
    }

    try {
        // Inserindo o evento no banco de dados e pedindo para retornar o ID gerado
        const [novoEvento] = await db('eventos')
            .insert({ nome, ingressos_disponiveis })
            .returning('*'); // Retorna os dados que acabaram de ser salvos

        return res.status(201).json(novoEvento); // 201 Created
    } catch (erro) {
        return res.status(500).json({ erro: 'Falha ao salvar no banco de dados.' });
    }
});

module.exports = app;