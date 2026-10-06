const db = require('./db');

// Garante o schema e popula os eventos de exemplo. Usado por `npm run seed`.
async function executar() {
    await db.garantirSchema();
    await db.semear();
    console.log('Banco preparado e populado com sucesso.');
    await db.destroy();
}

executar().catch((erro) => {
    console.error('Falha ao preparar o banco:', erro.message);
    process.exit(1);
});
