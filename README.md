# 🧬 BacteriasDB - MySQL & PostgreSQL

API Express.js que executa consultas SQL em bancos de dados **MySQL** e **PostgreSQL** dinamicamente

O objetivo deste projeto é desenvolver um sistema de banco de dados relacional voltado para a organização e gerenciamento de dados microbiológicos experimentais, com foco em amostras isoladas, consórcios microbianos, características genômicas e resultados de ensaios laboratoriais

## 📁 Estrutura do Projeto

```
bacteriadb
├── index.js              # Servidor principal (Node.js) - inicialização, middleware e comentários
├── db.js                 # Módulo de conexões MySQL e PostgreSQL, helpers de conexão
├── routes/
│   └── query.js          # Rotas de consulta SQL (API), todas comentadas e isoladas
├── pages/
│   └── index.html        # Interface web responsiva (CRUD, JOIN, SQL manual)
├── static/
│   ├── app.js            # Inicialização da UI e helpers globais
│   ├── db-schema.json    # Esquema das tabelas do banco de dados (gerado/exportado)
│   ├── delete-form.js    # Formulário modular de deleção (CRUD Delete)
│   ├── insert-form.js    # Formulário modular de inserção (CRUD Insert)
│   ├── relation-form.js  # Consulta relacional visual (JOIN por FK)
│   ├── select-form.js    # Formulário modular de consulta/filtro (CRUD Select)
│   ├── style.css         # Estilos responsivos, layout e tema visual
│   ├── ui.js             # Componentes UI extras (modais, feedback)
│   ├── update-form.js    # Formulário modular de atualização (CRUD Update)
├── .env                  # Configurações de ambiente
├── .gitignore           
├── package.json         
├── package-lock.json     
└── README.md             

```

## 📦 Instalação e Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env` para configurar o tipo de banco e credenciais:

```env
# Tipo de banco: 'mysql' ou 'postgres'
DB_TYPE=mysql

# Configurações do Banco
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=bacteriadb
DB_PORT=3306

# Porta do Servidor
PORT=3010
```

### 3. Configurações por Tipo de Banco

#### Para MySQL:
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=senha123
DB_NAME=bacteriadb
DB_PORT=3306
```

#### Para PostgreSQL:
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=senha123
DB_NAME=bacteriadb
DB_PORT=5432
```

### 4. Iniciar o Servidor
```bash
npm start
```

A API estará disponível em `http://localhost:3010`

## 🔄 Como Alternar Entre Bancos

1. **Pare o servidor** (Ctrl+C)
2. **Edite o arquivo `.env`** e altere `DB_TYPE`:
   - Para MySQL: `DB_TYPE=mysql`
   - Para PostgreSQL: `DB_TYPE=postgres`
3. **Ajuste as credenciais** conforme necessário
4. **Reinicie o servidor**: `npm start`

## 📡 Endpoints da API

### POST /query
Executa qualquer consulta SQL no banco configurado.

**Requisição:**
```json
{
  "query": "SELECT * FROM usuario LIMIT 5;"
}
```

**Resposta (Sucesso):**
```json
{
  "success": true,
  "query": "SELECT * FROM usuario LIMIT 5;",
  "database": {
    "type": "mysql",
    "host": "localhost",
    "port": "3306",
    "database": "bacteriadb",
    "user": "root"
  },
  "rowCount": 5,
  "data": [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com"
    }
  ],
  "fields": [
    {"name": "id", "type": 3},
    {"name": "nome", "type": 253}
  ],
  "limited": false,
  "executedAt": "2025-01-27T10:30:00.000Z"
}
```

### GET /query/test
Testa a conexão com o banco configurado.

**Resposta:**
```json
{
  "success": true,
  "message": "Conexão com MYSQL funcionando corretamente",
  "database": {
    "type": "mysql",
    "host": "localhost",
    "port": "3306",
    "database": "bacteriadb"
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### GET /query/info
Obtém informações sobre o banco configurado.

**Resposta:**
```json
{
  "success": true,
  "database": {
    "type": "postgres",
    "host": "localhost",
    "port": "5432",
    "database": "bacteriadb",
    "user": "postgres"
  },
  "message": "Conectado ao POSTGRESQL",
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### GET /health
Verificação de saúde da API.

**Resposta:**
```json
{
  "status": "OK",
  "service": "API Executor SQL Multiplataforma",
  "version": "2.0.0",
  "supportedDatabases": ["MySQL", "PostgreSQL"],
  "currentDatabase": "mysql",
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

## 💻 Interface Web

Acesse `http://localhost:3010` para usar a interface web que inclui:

- ✅ **Execução de consultas** com editor SQL
- ✅ **Teste de conectividade** com o banco atual
- ✅ **Informações do banco** (tipo, host, porta, etc.)
- ✅ **Resultados formatados** em tabelas responsivas
- ✅ **Indicador visual** do tipo de banco conectado

## 📥 Exemplos de Uso

### Usando cURL (MySQL):
```bash
curl -X POST http://localhost:3010/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) as total_usuarios FROM usuario;"}'
```

### Usando cURL (PostgreSQL):
```bash
curl -X POST http://localhost:3010/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT version();"}'
```

## 🔧 Dependências Instaladas

### Principais:
- **express**: Framework web para Node.js
- **mysql2**: Driver MySQL com suporte a Promises
- **pg**: Driver PostgreSQL nativo
- **dotenv**: Gerenciamento de variáveis de ambiente
- **cors**: Middleware para requisições cross-origin

### Instalação manual (se necessário):
```bash
npm install express mysql2 pg dotenv cors
```

## 🛠️ Solução de Problemas

### Problemas Comuns

#### 1. Falha na Conexão com Banco
```bash
❌ Falha na conexão com MYSQL: connect ECONNREFUSED
```
**Solução:**
- Verifique se o MySQL/PostgreSQL está rodando
- Confirme credenciais no `.env`
- Teste conexão manual: `mysql -u root -p` ou `psql -U postgres`

#### 2. Banco de Dados Não Existe
```bash
❌ Database 'bacteriadb' doesn't exist
```
**Solução:**
```sql
-- MySQL
CREATE DATABASE bacteriadb;

-- PostgreSQL
CREATE DATABASE bacteriadb;
```

#### 3. Porta em Uso
```bash
Error: listen EADDRINUSE :::3010
```
**Solução:**
- Altere `PORT` no `.env`
- Mate processos: `lsof -ti:3010 | xargs kill`

#### 4. Timeout de Consulta
**Solução:**
- Otimize consultas lentas
- Adicione índices no banco
- Aumente timeout em `db.js`

### Modo Debug
Ative logs detalhados:
```env
NODE_ENV=development
DEBUG=true
```
