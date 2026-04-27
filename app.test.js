const request = require('supertest');
const app = require('./app');
const db = require('./db');

// Aviso ao Jest para interceptar qualquer chamada para o banco de dados.
jest.mock('./db', () => {
    return jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
            { id: 1, nome: 'Show de Rock', ingressos_disponiveis: 500 }
        ]) // O dublê sempre vai fingir que salvou e devolver esse resultado falso
    });
});

describe('Módulo Avançado: API de Bilheteria (Testes com Mock)', () => {
    
    it('Deve criar um evento com sucesso sem tocar no banco de dados real', async () => {
        const resposta = await request(app)
            .post('/eventos')
            .send({ nome: 'Show de Rock', ingressos_disponiveis: 500 });

        expect(resposta.status).toBe(201); // 201 Created
        expect(resposta.body.id).toBe(1);
    });

    it('Deve retornar erro 400 se tentar criar evento sem quantidade de ingressos', async () => {
        const resposta = await request(app)
            .post('/eventos')
            .send({ nome: 'Show Incompleto' }); 

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toBe('Dados incompletos para criar o evento.');
    });

    it('Deve retornar erro 500 se o banco de dados falhar', async () => {
        
        db.mockImplementationOnce(() => {
            return {
                insert: jest.fn().mockReturnThis(),
                returning: jest.fn().mockRejectedValueOnce(new Error('Simulação de queda do banco'))
            };
        });

        const resposta = await request(app)
            .post('/eventos')
            .send({ nome: 'Show com Falha', ingressos_disponiveis: 50 });

        expect(resposta.status).toBe(500);
        expect(resposta.body.erro).toBe('Falha ao salvar no banco de dados.');
    });

});