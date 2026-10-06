// Especificação OpenAPI 3 usada pelo Swagger UI em /docs.
const evento = {
    type: 'object',
    properties: {
        id: { type: 'integer', example: 1 },
        nome: { type: 'string', example: 'Show de Rock' },
        ingressos_disponiveis: { type: 'integer', example: 500 },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
    },
};

const erro = {
    type: 'object',
    properties: { erro: { type: 'string', example: 'Evento não encontrado.' } },
};

const idParam = {
    name: 'id',
    in: 'path',
    required: true,
    description: 'ID do evento',
    schema: { type: 'integer', example: 1 },
};

const corpoEvento = {
    required: true,
    content: {
        'application/json': {
            schema: {
                type: 'object',
                required: ['nome', 'ingressos_disponiveis'],
                properties: {
                    nome: { type: 'string', example: 'Show de Rock' },
                    ingressos_disponiveis: { type: 'integer', minimum: 0, example: 500 },
                },
            },
        },
    },
};

module.exports = {
    openapi: '3.0.3',
    info: {
        title: 'Bilheteria API',
        version: '2.0.0',
        description:
            'API REST para gerenciamento de eventos e venda de ingressos, construída com Node.js, ' +
            'Express e PostgreSQL. Documentação interativa gerada a partir da especificação OpenAPI.',
    },
    servers: [{ url: '/', description: 'Servidor atual' }],
    tags: [
        { name: 'Sistema', description: 'Saúde do serviço' },
        { name: 'Eventos', description: 'Gerenciamento de eventos' },
        { name: 'Ingressos', description: 'Compra de ingressos' },
    ],
    paths: {
        '/health': {
            get: {
                tags: ['Sistema'],
                summary: 'Verifica se o serviço está no ar',
                responses: {
                    200: {
                        description: 'Serviço saudável',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'ok' },
                                        servico: { type: 'string', example: 'bilheteria-api' },
                                        versao: { type: 'string', example: '2.0.0' },
                                        uptime: { type: 'integer', example: 42 },
                                        timestamp: { type: 'string', format: 'date-time' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/eventos': {
            get: {
                tags: ['Eventos'],
                summary: 'Lista todos os eventos',
                responses: {
                    200: {
                        description: 'Lista de eventos',
                        content: {
                            'application/json': { schema: { type: 'array', items: evento } },
                        },
                    },
                    500: { description: 'Erro interno', content: { 'application/json': { schema: erro } } },
                },
            },
            post: {
                tags: ['Eventos'],
                summary: 'Cria um novo evento',
                requestBody: corpoEvento,
                responses: {
                    201: { description: 'Evento criado', content: { 'application/json': { schema: evento } } },
                    400: { description: 'Dados inválidos', content: { 'application/json': { schema: erro } } },
                    500: { description: 'Erro interno', content: { 'application/json': { schema: erro } } },
                },
            },
        },
        '/eventos/{id}': {
            get: {
                tags: ['Eventos'],
                summary: 'Busca um evento pelo id',
                parameters: [idParam],
                responses: {
                    200: { description: 'Evento encontrado', content: { 'application/json': { schema: evento } } },
                    404: { description: 'Não encontrado', content: { 'application/json': { schema: erro } } },
                    500: { description: 'Erro interno', content: { 'application/json': { schema: erro } } },
                },
            },
            put: {
                tags: ['Eventos'],
                summary: 'Atualiza um evento',
                parameters: [idParam],
                requestBody: corpoEvento,
                responses: {
                    200: { description: 'Evento atualizado', content: { 'application/json': { schema: evento } } },
                    400: { description: 'Dados inválidos', content: { 'application/json': { schema: erro } } },
                    404: { description: 'Não encontrado', content: { 'application/json': { schema: erro } } },
                    500: { description: 'Erro interno', content: { 'application/json': { schema: erro } } },
                },
            },
            delete: {
                tags: ['Eventos'],
                summary: 'Remove um evento',
                parameters: [idParam],
                responses: {
                    204: { description: 'Removido com sucesso' },
                    404: { description: 'Não encontrado', content: { 'application/json': { schema: erro } } },
                    500: { description: 'Erro interno', content: { 'application/json': { schema: erro } } },
                },
            },
        },
        '/eventos/{id}/comprar': {
            post: {
                tags: ['Ingressos'],
                summary: 'Compra ingressos de um evento',
                description: 'Debita a quantidade comprada do estoque. Retorna 409 quando os ingressos acabam.',
                parameters: [idParam],
                requestBody: {
                    required: false,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: { quantidade: { type: 'integer', minimum: 1, default: 1, example: 1 } },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Compra registrada', content: { 'application/json': { schema: evento } } },
                    400: { description: 'Quantidade inválida', content: { 'application/json': { schema: erro } } },
                    404: { description: 'Evento não encontrado', content: { 'application/json': { schema: erro } } },
                    409: { description: 'Ingressos esgotados', content: { 'application/json': { schema: erro } } },
                    500: { description: 'Erro interno', content: { 'application/json': { schema: erro } } },
                },
            },
        },
    },
};
