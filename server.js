const app = require('./app');
const PORTA = 3000;

app.listen(PORTA, () => {
    console.log(`Servidor da Bilheteria ligado e aguardando a multidão na porta ${PORTA}!`);
});