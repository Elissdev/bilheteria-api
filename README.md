# 🎟️ Bilheteria API

[![CI](https://github.com/Elissdev/bilheteria-api/actions/workflows/ci.yml/badge.svg)](https://github.com/Elissdev/bilheteria-api/actions/workflows/ci.yml)
[![Uptime](https://img.shields.io/uptimerobot/status/m804193217-e7bd676597b193950077b311)](https://bilheteria-api-uc0j.onrender.com/health)
[![Uptime 7 dias](https://img.shields.io/uptimerobot/ratio/7/m804193217-e7bd676597b193950077b311)](https://bilheteria-api-uc0j.onrender.com/health)

> API REST de bilheteria construída em **Node.js + Express + PostgreSQL**, com documentação interativa (Swagger), vitrine própria consumindo a API e **100% de cobertura de testes**.

## 🔗 Demo ao vivo

- **Aplicação (vitrine):** https://bilheteria-api-uc0j.onrender.com
- **Documentação (Swagger UI):** https://bilheteria-api-uc0j.onrender.com/docs
- **Healthcheck:** https://bilheteria-api-uc0j.onrender.com/health

> O plano gratuito do Render "dorme" o serviço após alguns minutos sem acesso; a primeira requisição pode levar ~30s para acordar.

## ✨ Sobre o projeto

A API gerencia eventos e a venda de ingressos. O foco do projeto é **qualidade de software**: regras de negócio bem definidas, tratamento explícito de erros, testes automatizados e uma esteira de integração contínua que roda a cada push.

Além dos testes com dublês (mocks) do banco, o projeto inclui uma busca real por performance: o endpoint de eventos foi validado com **Autocannon** a ~1.7k requisições/segundo.

## 🧱 Stack

- **Backend:** Node.js, Express 5
- **Banco de dados:** PostgreSQL, Knex.js
- **Documentação:** OpenAPI 3 + Swagger UI
- **Testes:** Jest, Supertest
- **Performance:** Autocannon
- **Infra:** Docker, Docker Compose, GitHub Actions, Render + Neon

## 🔌 Endpoints

| Método | Rota | Descrição | Sucessos | Erros |
| --- | --- | --- | --- | --- |
| GET | `/health` | Saúde do serviço | 200 | — |
| GET | `/eventos` | Lista os eventos | 200 | 500 |
| GET | `/eventos/:id` | Busca um evento pelo id | 200 | 404, 500 |
| POST | `/eventos` | Cria um evento | 201 | 400, 500 |
| PUT | `/eventos/:id` | Atualiza um evento | 200 | 400, 404, 500 |
| DELETE | `/eventos/:id` | Remove um evento | 204 | 404, 500 |
| POST | `/eventos/:id/comprar` | Compra ingressos | 200 | 400, 404, 409, 500 |

Exemplo de criação de evento:

```bash
curl -X POST http://localhost:3000/eventos \
  -H "Content-Type: application/json" \
  -d '{"nome": "Show de Rock", "ingressos_disponiveis": 500}'
```

Exemplo de compra:

```bash
curl -X POST http://localhost:3000/eventos/1/comprar \
  -H "Content-Type: application/json" \
  -d '{"quantidade": 2}'
```

### Regra de negócio: controle de estoque

A compra usa um `UPDATE ... WHERE ingressos_disponiveis >= quantidade` atômico: o próprio banco garante que **nunca se vende mais do que existe**, mesmo com compras simultâneas. Quando os ingressos acabam, a API responde **409 Conflict**.

## ✅ Qualidade e testes

- **33 testes automatizados** cobrindo todos os endpoints e fluxos de erro.
- **100% de cobertura** (statements, branches, functions e lines) na camada de rotas — garantida por um `coverageThreshold` no Jest que **quebra a esteira** se cair.
- **Mocks do banco de dados:** os testes rodam em milissegundos e sem depender de infraestrutura.
- **CI no GitHub Actions:** instala, testa e publica o relatório de cobertura a cada push e pull request.

Rodar a suíte:

```bash
npm test
```

## 🚀 Como rodar localmente

Pré-requisitos: Node.js 22+ e Docker.

```bash
# 1. Suba o PostgreSQL
docker compose up -d

# 2. Instale as dependências
npm install

# 3. Prepare o banco (cria a tabela e popula eventos de exemplo)
npm run seed

# 4. Suba a API
npm start
```

- Vitrine: http://localhost:3000
- Swagger: http://localhost:3000/docs

Variáveis de ambiente (veja `.env.example`):

| Variável | Descrição | Padrão local |
| --- | --- | --- |
| `DATABASE_URL` | String de conexão do Postgres | `postgres://user_bilheteria:senha_secreta@127.0.0.1:5432/bilheteria_db` |
| `PORT` | Porta do servidor | `3000` |

## ☁️ Deploy

O deploy usa **Render** (Web Service via `render.yaml`) e **Neon** (PostgreSQL serverless). Basta definir a variável `DATABASE_URL` no Render apontando para o Neon — o schema é criado e os dados de exemplo são semeados automaticamente no boot.

Também é possível subir via Docker:

```bash
docker build -t bilheteria-api .
docker run -p 3000:3000 -e DATABASE_URL="postgres://..." bilheteria-api
```

> **Keep-alive:** no plano free o Render hiberna após ~15 min sem acesso. Um monitor externo
> (ex.: [UptimeRobot](https://uptimerobot.com), grátis) pingando o `/health` a cada 5 minutos mantém o serviço acordado.

## 📁 Estrutura

```
.
├── app.js              # Rotas, validações e regra de negócio
├── app.test.js         # Suíte de testes (Jest + Supertest + mocks)
├── db.js               # Conexão com o Postgres, schema e seed
├── server.js           # Bootstrap do servidor
├── swagger.js          # Especificação OpenAPI 3
├── scripts/seed.js     # Prepara o banco pela linha de comando
├── public/index.html   # Vitrine que consome a API
├── Dockerfile
├── docker-compose.yml
└── render.yaml
```
