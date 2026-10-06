const knex = require('knex');

// Em produção (Render + Neon) a conexão vem de DATABASE_URL.
// Localmente, cai no Postgres do docker-compose.
function montarConexao() {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    return {
        host: process.env.PGHOST || '127.0.0.1',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'user_bilheteria',
        password: process.env.PGPASSWORD || 'senha_secreta',
        database: process.env.PGDATABASE || 'bilheteria_db',
    };
}

const db = knex({
    client: 'pg',
    connection: montarConexao(),
    pool: { min: 0, max: 5 },
});

// Cria a tabela de eventos caso ainda não exista (idempotente).
async function garantirSchema() {
    const existe = await db.schema.hasTable('eventos');

    if (!existe) {
        await db.schema.createTable('eventos', (tabela) => {
            tabela.increments('id').primary();
            tabela.string('nome').notNullable();
            tabela.integer('ingressos_disponiveis').notNullable().defaultTo(0);
            tabela.timestamps(true, true);
        });
    }
}

const EVENTOS_EXEMPLO = [
    { nome: 'Show de Rock', ingressos_disponiveis: 500 },
    { nome: 'Peça de Teatro', ingressos_disponiveis: 120 },
    { nome: 'Final do Campeonato', ingressos_disponiveis: 80 },
];

// Popula a base com eventos de exemplo apenas se ela estiver vazia.
async function semear() {
    const linha = await db('eventos').count('* as total').first();

    if (Number(linha.total) === 0) {
        await db('eventos').insert(EVENTOS_EXEMPLO);
    }
}

module.exports = db;
module.exports.garantirSchema = garantirSchema;
module.exports.semear = semear;
