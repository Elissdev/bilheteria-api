const request = require('supertest');
const app = require('./app');
const db = require('./db');

// Substitui o módulo de banco de dados por um dublê controlado pelos testes.
jest.mock('./db', () => {
    const mock = jest.fn();
    mock.garantirSchema = jest.fn();
    mock.semear = jest.fn();
    return mock;
});

// Cria uma "cadeia" que imita o query builder do Knex: todos os métodos
// encadeáveis devolvem a própria cadeia, e a cadeia é um thenable que resolve
// para `valor`. Assim `await db('eventos').where(...).first()` funciona em
// qualquer ponto da cadeia e podemos definir o resultado de cada consulta.
function cadeia(valor) {
    const produzir = typeof valor === 'function' ? valor : () => valor;
    const chain = {
        then: (ok, erro) => Promise.resolve().then(produzir).then(ok, erro),
        catch: (erro) => Promise.resolve().then(produzir).catch(erro),
    };
    ['select', 'orderBy', 'where', 'andWhere', 'insert', 'update', 'decrement', 'returning', 'first', 'del', 'count']
        .forEach((metodo) => {
            chain[metodo] = jest.fn(() => chain);
        });
    return chain;
}

// Enfileira respostas para chamadas consecutivas ao banco dentro de um teste.
function bancoResponde(...valores) {
    valores.forEach((valor) => db.mockImplementationOnce(() => cadeia(valor)));
}

// Simula uma queda do banco na próxima consulta.
function bancoFalha() {
    db.mockImplementationOnce(() => cadeia(() => Promise.reject(new Error('queda simulada do banco'))));
}

beforeEach(() => {
    db.mockReset();
});

describe('GET /health', () => {
    it('responde 200 com status ok', async () => {
        const resposta = await request(app).get('/health');

        expect(resposta.status).toBe(200);
        expect(resposta.body.status).toBe('ok');
        expect(resposta.body.servico).toBe('bilheteria-api');
    });
});

describe('GET /docs', () => {
    it('serve a documentação do Swagger', async () => {
        const resposta = await request(app).get('/docs/');

        expect(resposta.status).toBe(200);
    });
});

describe('GET /eventos', () => {
    it('lista os eventos cadastrados', async () => {
        bancoResponde([{ id: 1, nome: 'Show de Rock', ingressos_disponiveis: 10 }]);

        const resposta = await request(app).get('/eventos');

        expect(resposta.status).toBe(200);
        expect(resposta.body).toHaveLength(1);
        expect(resposta.body[0].nome).toBe('Show de Rock');
    });

    it('retorna 500 quando o banco falha', async () => {
        bancoFalha();

        const resposta = await request(app).get('/eventos');

        expect(resposta.status).toBe(500);
        expect(resposta.body.erro).toBe('Falha ao listar os eventos.');
    });
});

describe('GET /eventos/:id', () => {
    it('busca um evento existente', async () => {
        bancoResponde({ id: 7, nome: 'Peça de Teatro', ingressos_disponiveis: 3 });

        const resposta = await request(app).get('/eventos/7');

        expect(resposta.status).toBe(200);
        expect(resposta.body.id).toBe(7);
    });

    it('retorna 404 quando o evento não existe', async () => {
        bancoResponde(undefined);

        const resposta = await request(app).get('/eventos/999');

        expect(resposta.status).toBe(404);
        expect(resposta.body.erro).toBe('Evento não encontrado.');
    });

    it('retorna 500 quando o banco falha', async () => {
        bancoFalha();

        const resposta = await request(app).get('/eventos/1');

        expect(resposta.status).toBe(500);
        expect(resposta.body.erro).toBe('Falha ao buscar o evento.');
    });
});

describe('POST /eventos', () => {
    it('cria um evento com sucesso', async () => {
        bancoResponde([{ id: 1, nome: 'Show de Rock', ingressos_disponiveis: 500 }]);

        const resposta = await request(app)
            .post('/eventos')
            .send({ nome: 'Show de Rock', ingressos_disponiveis: 500 });

        expect(resposta.status).toBe(201);
        expect(resposta.body.id).toBe(1);
    });

    it('retorna 400 quando o nome não é informado', async () => {
        const resposta = await request(app).post('/eventos').send({ ingressos_disponiveis: 10 });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe('Informe o nome do evento.');
    });

    it('retorna 400 quando o nome não é texto', async () => {
        const resposta = await request(app).post('/eventos').send({ nome: 123, ingressos_disponiveis: 10 });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe('Informe o nome do evento.');
    });

    it('retorna 400 quando o nome é só espaços em branco', async () => {
        const resposta = await request(app).post('/eventos').send({ nome: '   ', ingressos_disponiveis: 10 });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe('Informe o nome do evento.');
    });

    it('retorna 400 quando a quantidade de ingressos não é informada', async () => {
        const resposta = await request(app).post('/eventos').send({ nome: 'Show Incompleto' });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe('Informe a quantidade de ingressos disponíveis.');
    });

    it('retorna 400 quando a quantidade de ingressos é nula', async () => {
        const resposta = await request(app)
            .post('/eventos')
            .send({ nome: 'Show', ingressos_disponiveis: null });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe('Informe a quantidade de ingressos disponíveis.');
    });

    it('retorna 400 quando a quantidade de ingressos não é inteira', async () => {
        const resposta = await request(app)
            .post('/eventos')
            .send({ nome: 'Show', ingressos_disponiveis: 1.5 });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe('A quantidade de ingressos deve ser um número inteiro maior ou igual a zero.');
    });

    it('retorna 400 quando a quantidade de ingressos é negativa', async () => {
        const resposta = await request(app)
            .post('/eventos')
            .send({ nome: 'Show', ingressos_disponiveis: -1 });

        expect(resposta.status).toBe(400);
    });

    it('retorna 400 quando nenhum corpo é enviado', async () => {
        const resposta = await request(app).post('/eventos');

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe('Informe o nome do evento.');
    });

    it('retorna 500 quando o banco falha', async () => {
        bancoFalha();

        const resposta = await request(app)
            .post('/eventos')
            .send({ nome: 'Show com Falha', ingressos_disponiveis: 50 });

        expect(resposta.status).toBe(500);
        expect(resposta.body.erro).toBe('Falha ao salvar no banco de dados.');
    });
});

describe('PUT /eventos/:id', () => {
    it('atualiza um evento existente', async () => {
        bancoResponde([{ id: 1, nome: 'Show Editado', ingressos_disponiveis: 99 }]);

        const resposta = await request(app)
            .put('/eventos/1')
            .send({ nome: 'Show Editado', ingressos_disponiveis: 99 });

        expect(resposta.status).toBe(200);
        expect(resposta.body.nome).toBe('Show Editado');
    });

    it('retorna 400 com dados inválidos', async () => {
        const resposta = await request(app).put('/eventos/1').send({ nome: '', ingressos_disponiveis: 1 });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe('Informe o nome do evento.');
    });

    it('retorna 400 quando nenhum corpo é enviado', async () => {
        const resposta = await request(app).put('/eventos/1');

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe('Informe o nome do evento.');
    });

    it('retorna 404 quando o evento não existe', async () => {
        bancoResponde([]);

        const resposta = await request(app)
            .put('/eventos/404')
            .send({ nome: 'Fantasma', ingressos_disponiveis: 1 });

        expect(resposta.status).toBe(404);
        expect(resposta.body.erro).toBe('Evento não encontrado.');
    });

    it('retorna 500 quando o banco falha', async () => {
        bancoFalha();

        const resposta = await request(app)
            .put('/eventos/1')
            .send({ nome: 'Show', ingressos_disponiveis: 1 });

        expect(resposta.status).toBe(500);
        expect(resposta.body.erro).toBe('Falha ao atualizar o evento.');
    });
});

describe('POST /eventos/:id/comprar', () => {
    it('debita uma unidade do estoque', async () => {
        bancoResponde([{ id: 1, nome: 'Show de Rock', ingressos_disponiveis: 9 }]);

        const resposta = await request(app).post('/eventos/1/comprar');

        expect(resposta.status).toBe(200);
        expect(resposta.body.ingressos_disponiveis).toBe(9);
    });

    it('usa quantidade 1 quando o corpo não é enviado', async () => {
        bancoResponde([{ id: 1, nome: 'Show de Rock', ingressos_disponiveis: 4 }]);

        const resposta = await request(app).post('/eventos/1/comprar').send();

        expect(resposta.status).toBe(200);
    });

    it('aceita compra de várias unidades', async () => {
        bancoResponde([{ id: 1, nome: 'Show de Rock', ingressos_disponiveis: 7 }]);

        const resposta = await request(app).post('/eventos/1/comprar').send({ quantidade: 3 });

        expect(resposta.status).toBe(200);
    });

    it('retorna 400 quando a quantidade é zero', async () => {
        const resposta = await request(app).post('/eventos/1/comprar').send({ quantidade: 0 });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe('A quantidade deve ser um número inteiro maior que zero.');
    });

    it('retorna 400 quando a quantidade não é inteira', async () => {
        const resposta = await request(app).post('/eventos/1/comprar').send({ quantidade: 2.5 });

        expect(resposta.status).toBe(400);
    });

    it('retorna 404 quando o evento não existe', async () => {
        bancoResponde([], undefined);

        const resposta = await request(app).post('/eventos/999/comprar');

        expect(resposta.status).toBe(404);
        expect(resposta.body.erro).toBe('Evento não encontrado.');
    });

    it('retorna 409 quando os ingressos estão esgotados', async () => {
        bancoResponde([], { id: 1, nome: 'Esgotado', ingressos_disponiveis: 0 });

        const resposta = await request(app).post('/eventos/1/comprar');

        expect(resposta.status).toBe(409);
        expect(resposta.body.erro).toBe('Ingressos esgotados para este evento.');
    });

    it('retorna 500 quando o banco falha', async () => {
        bancoFalha();

        const resposta = await request(app).post('/eventos/1/comprar');

        expect(resposta.status).toBe(500);
        expect(resposta.body.erro).toBe('Falha ao registrar a compra.');
    });
});

describe('DELETE /eventos/:id', () => {
    it('remove um evento existente', async () => {
        bancoResponde(1);

        const resposta = await request(app).delete('/eventos/1');

        expect(resposta.status).toBe(204);
    });

    it('retorna 404 quando o evento não existe', async () => {
        bancoResponde(0);

        const resposta = await request(app).delete('/eventos/999');

        expect(resposta.status).toBe(404);
        expect(resposta.body.erro).toBe('Evento não encontrado.');
    });

    it('retorna 500 quando o banco falha', async () => {
        bancoFalha();

        const resposta = await request(app).delete('/eventos/1');

        expect(resposta.status).toBe(500);
        expect(resposta.body.erro).toBe('Falha ao remover o evento.');
    });
});
