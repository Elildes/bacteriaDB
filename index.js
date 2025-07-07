// Servidor principal - API Executor de SQL Multiplataforma com Backup/Restore
const express = require('express');
const cors = require('cors');
const { resolve } = require('path');
const { testConnection, closeConnections } = require('./db');
const queryRoutes = require('./routes/query');
const backupRoutes = require('./routes/backup'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3010;

// Middleware de configuração
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve arquivos estáticos em /static 
app.use('/static', express.static(resolve(__dirname, 'static')));

// Serve arquivos estáticos em /pages
app.use('/pages', express.static(resolve(__dirname, 'pages')));

// Rotas de operações SQL e backup/restore
app.use('/query', queryRoutes);
app.use('/backup', backupRoutes); 

// Servir página principal
app.get('/', (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/index.html'));
});

// Endpoint de verificação de saúde
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'API Executor SQL Multiplataforma',
    version: '2.0.0',
    supportedDatabases: ['MySQL', 'PostgreSQL'],
    currentDatabase: process.env.DB_TYPE || 'mysql',
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Handler para rotas não encontradas (404)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    availableEndpoints: [
      'POST /query - Executar consulta SQL',
      'GET /query/test - Testar conexão com banco',
      'GET /query/info - Informações do banco configurado',
      'GET /health - Verificação de saúde da API',
      'GET /backup - Gerar backup do banco de dados',
      'POST /backup/restore - Restaurar backup',
      'GET / - Interface web'
    ]
  });
});

// Função para iniciar o servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando API Executor SQL Multiplataforma...');
    console.log(`📊 Tipo de banco configurado: ${process.env.DB_TYPE || 'mysql'}`);
    
    // Testar conexão com banco antes de iniciar servidor
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Servidor iniciando sem conexão com banco. Verifique suas configurações no .env');
    }

    // Iniciar servidor HTTP
    const server = app.listen(port, () => {
      console.log(`🌐 API rodando em http://localhost:${port}`);
      console.log(`📡 Endpoint de consultas: POST http://localhost:${port}/query`);
      console.log(`🗄️  Backup do banco: GET http://localhost:${port}/backup`);
      console.log(`♻️  Restaurar backup: POST http://localhost:${port}/backup/restore`);
      console.log(`🔍 Teste de conexão: GET http://localhost:${port}/query/test`);
      console.log(`💻 Interface web: http://localhost:${port}`);
      console.log('✅ Servidor iniciado com sucesso!');
    });

    // Shutdown - fechar conexões ao encerrar aplicação
    process.on('SIGTERM', async () => {
      console.log('🔄 Recebido SIGTERM, encerrando servidor...');
      server.close(async () => {
        await closeConnections();
        console.log('👋 Servidor encerrado com sucesso');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('🔄 Recebido SIGINT, encerrando servidor...');
      server.close(async () => {
        await closeConnections();
        console.log('👋 Servidor encerrado com sucesso');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar aplicação
startServer();
