# Bilheteria API

> Sistema CRUD de Bilheteria construído do zero com foco na aplicação de técnicas avançadas de Engenharia de Qualidade (White-Box Testing, Mocks, Coverage e Stress Testing).

## Sobre o Projeto
Este laboratório vai além do teste de interface e foca na infraestrutura e resiliência de um backend construído em Node.js com banco de dados relacional (PostgreSQL).

O objetivo principal foi pensar como uma pessoa desenvolvedora na construção do software e, em seguida, aplicar o rigor de testes para garantir 100% de cobertura de código e alta performance.

## Stack Tecnológica
* **Backend:** Node.js, Express
* **Banco de Dados:** PostgreSQL (via Docker), Knex.js
* **Testes & Dublês:** Jest, Supertest, Jest Mocks
* **Testes de Performance:** Autocannon

## Práticas de Qualidade Aplicadas

1. **Mocks de Banco de Dados:** Isolamento da infraestrutura externa usando `jest.mock`, permitindo que os testes rodem em milissegundos sem sujar o banco de dados real.
2. **Coverage (100%):** Mapeamento de todas as ramificações e tratativas de erro (incluindo simulação de queda do banco `Status 500`).
3. **Stress Testing:** Validação de resiliência e gargalos com o Autocannon, simulando 100 conexões simultâneas e atingindo picos de ~1.7k requests/sec com latência abaixo de 60ms.

## Como executar o ambiente

1. Clone o repositório e instale as dependências:
   ```bash
   npm install

2. Suba o banco de dados isolado via Docker:
   ```bash
   docker-compose up -d

3. Execute a suíte completa de testes com relatório de cobertura:
   ```bash
    npx jest --coverage

4. Para realizar o teste de carga na sua máquina local:
   ```bash      
   node server.js
npx autocannon -m POST -H "Content-Type: application/json" -b '{"nome":"Show de Rock", "ingressos_disponiveis":100}' -c 100 -d 10 http://localhost:3000/eventos