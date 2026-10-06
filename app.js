const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const db = require('./db');
const openapi = require('./swagger');

const app = express();
app.use(express.json());

// Documentação interativa (Swagger UI) em /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// Vitrine: página única que consome a própria API em /
app.use(express.static(path.join(__dirname, 'public')));

// Valida o payload de criação/atualização de evento.
// Retorna uma mensagem de erro ou null quando o payload é válido.
function validarEvento(nome, ingressos_disponiveis) {
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
        return 'Informe o nome do evento.';
    }
    if (ingressos_disponiveis === undefined || ingressos_disponiveis === null) {
        return 'Informe a quantidade de ingressos disponíveis.';
    }
    if (!Number.isInteger(ingressos_disponiveis) || ingressos_disponiveis < 0) {
        return 'A quantidade de ingressos deve ser um número inteiro maior ou igual a zero.';
    }
    return null;
}

// Healthcheck (usado pelo Render para saber se o serviço está no ar).
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        servico: 'bilheteria-api',
        versao: '2.0.0',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

// READ: lista todos os eventos.
app.get('/eventos', async (req, res) => {
    try {
        const eventos = await db('eventos').select('*').orderBy('id', 'asc');
        return res.json(eventos);
    } catch (erro) {
        return res.status(500).json({ erro: 'Falha ao listar os eventos.' });
    }
});

// READ: busca um evento pelo id.
app.get('/eventos/:id', async (req, res) => {
    try {
        const evento = await db('eventos').where({ id: req.params.id }).first();

        if (!evento) {
            return res.status(404).json({ erro: 'Evento não encontrado.' });
        }
        return res.json(evento);
    } catch (erro) {
        return res.status(500).json({ erro: 'Falha ao buscar o evento.' });
    }
});

// CREATE: cria um evento.
app.post('/eventos', async (req, res) => {
    const { nome, ingressos_disponiveis } = req.body ?? {};
    const erroValidacao = validarEvento(nome, ingressos_disponiveis);

    if (erroValidacao) {
        return res.status(400).json({ erro: erroValidacao });
    }

    try {
        const [novoEvento] = await db('eventos')
            .insert({ nome: nome.trim(), ingressos_disponiveis })
            .returning('*');

        return res.status(201).json(novoEvento);
    } catch (erro) {
        return res.status(500).json({ erro: 'Falha ao salvar no banco de dados.' });
    }
});

// UPDATE: atualiza um evento existente.
app.put('/eventos/:id', async (req, res) => {
    const { nome, ingressos_disponiveis } = req.body ?? {};
    const erroValidacao = validarEvento(nome, ingressos_disponiveis);

    if (erroValidacao) {
        return res.status(400).json({ erro: erroValidacao });
    }

    try {
        const [atualizado] = await db('eventos')
            .where({ id: req.params.id })
            .update({ nome: nome.trim(), ingressos_disponiveis })
            .returning('*');

        if (!atualizado) {
            return res.status(404).json({ erro: 'Evento não encontrado.' });
        }
        return res.json(atualizado);
    } catch (erro) {
        return res.status(500).json({ erro: 'Falha ao atualizar o evento.' });
    }
});

// Regra de negócio: compra de ingressos com controle de estoque atômico.
// O próprio banco garante que não vendemos mais ingressos do que existem.
app.post('/eventos/:id/comprar', async (req, res) => {
    const quantidade = req.body?.quantidade ?? 1;

    if (!Number.isInteger(quantidade) || quantidade < 1) {
        return res.status(400).json({ erro: 'A quantidade deve ser um número inteiro maior que zero.' });
    }

    try {
        const atualizados = await db('eventos')
            .where({ id: req.params.id })
            .andWhere('ingressos_disponiveis', '>=', quantidade)
            .decrement('ingressos_disponiveis', quantidade)
            .returning('*');

        if (atualizados.length > 0) {
            return res.json(atualizados[0]);
        }

        const existe = await db('eventos').where({ id: req.params.id }).first();

        if (!existe) {
            return res.status(404).json({ erro: 'Evento não encontrado.' });
        }
        return res.status(409).json({ erro: 'Ingressos esgotados para este evento.' });
    } catch (erro) {
        return res.status(500).json({ erro: 'Falha ao registrar a compra.' });
    }
});

// DELETE: remove um evento.
app.delete('/eventos/:id', async (req, res) => {
    try {
        const removidos = await db('eventos').where({ id: req.params.id }).del();

        if (removidos === 0) {
            return res.status(404).json({ erro: 'Evento não encontrado.' });
        }
        return res.status(204).send();
    } catch (erro) {
        return res.status(500).json({ erro: 'Falha ao remover o evento.' });
    }
});

module.exports = app;
