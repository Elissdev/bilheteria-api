const knex = require('knex');

// Configurando a conexão com o banco que subiu no Docker
const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'user_bilheteria',
    password: 'senha_secreta',
    database: 'bilheteria_db'
  }
});

// Criando a Tabela de eventos automaticamente se ela não existir
db.schema.hasTable('eventos').then((existe) => {
  if (!existe) {
    return db.schema.createTable('eventos', (tabela) => {
      tabela.increments('id').primary(); // ID único do evento
      tabela.string('nome').notNullable(); // Nome do evento 
      tabela.integer('ingressos_disponiveis').notNullable(); // Quantidade de ingressos
    });
  }
});

module.exports = db;