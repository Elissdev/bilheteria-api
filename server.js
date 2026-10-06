const app = require('./app');
const db = require('./db');

const PORTA = process.env.PORT || 3000;

async function iniciar() {
    try {
        await db.garantirSchema();
        await db.semear();
    } catch (erro) {
        console.error('Aviso: não foi possível preparar o banco de dados.', erro.message);
    }

    app.listen(PORTA, () => {
        console.log(`Bilheteria no ar na porta ${PORTA}. Docs em /docs`);
    });
}

iniciar();
