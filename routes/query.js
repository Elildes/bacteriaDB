// routes/query.js
const express = require('express');
const { executeQuery, getDatabaseInfo } = require('../db');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Pasta e arquivo de log
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

// Funções utilitárias para logs
function appendLog(entry) {
  const line = typeof entry === 'string' ? entry : JSON.stringify(entry);
  fs.appendFile(LOG_FILE, line + '\n', err => {
    if (err) console.error('Erro ao gravar log:', err);
  });
}
function logAudit({ usuario_id = null, operacao, tabela, registro_id = null, sql, status, detalhes_erro = null }) {
  appendLog({
    tipo: 'AUDITORIA',
    usuario_id,
    operacao,
    tabela,
    registro_id,
    sql,
    status,
    detalhes_erro,
    data_hora: new Date().toISOString()
  });
}
function logError(error, context = {}) {
  appendLog({
    tipo: 'ERRO',
    error: error.message || String(error),
    stack: error.stack,
    context,
    data_hora: new Date().toISOString()
  });
}

// Validação básica de query
function validateQuery(query) {
  if (!query || typeof query !== 'string') {
    return { valid: false, message: 'A consulta deve ser uma string não vazia' };
  }
  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) {
    return { valid: false, message: 'A consulta não pode estar vazia' };
  }
  if (trimmedQuery.length > 10000) {
    return { valid: false, message: 'Consulta muito longa (máximo 10.000 caracteres)' };
  }
  return { valid: true };
}

// POST /query - Executar consulta SQL
router.post('/', async (req, res) => {
  try {
    const { query, usuario_id } = req.body;

    // Validar entrada
    const validation = validateQuery(query);
    if (!validation.valid) {
      appendLog({
        tipo: 'VALIDACAO',
        sql: query,
        status: 'erro',
        detalhes_erro: validation.message,
        data_hora: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        error: validation.message
      });
    }

    const dbInfo = getDatabaseInfo();
    console.log(`🔍 Executando query no ${dbInfo.type.toUpperCase()}: ${query.substring(0, 100)}...`);

    // Executar consulta
    const result = await executeQuery(query);

    // Tenta extrair tabela e operação principal para log
    const match = query.match(/^(insert|update|delete|select)\s+(?:into|from|)\s*([^\s;]+)/i);
    const operacao = match ? match[1].toUpperCase() : 'QUERY';
    const tabela = match ? match[2] : '';
    const registro_id = null; // Pode melhorar para extrair do WHERE se quiser depois

    if (result.success) {
      // Loga auditoria apenas se for INSERT, UPDATE ou DELETE
      if (/^(insert|update|delete)/i.test(query.trim())) {
        logAudit({
          usuario_id,
          operacao,
          tabela,
          registro_id,
          sql: query,
          status: 'sucesso'
        });
      }

      // Limitar resultados grandes (máximo 1000 linhas)
      const limitedData = Array.isArray(result.data) && result.data.length > 1000
        ? result.data.slice(0, 1000)
        : result.data;

      res.json({
        success: true,
        query: query,
        database: dbInfo,
        rowCount: result.rowCount,
        data: limitedData,
        fields: result.fields,
        limited: Array.isArray(result.data) && result.data.length > 1000,
        executedAt: new Date().toISOString()
      });
    } else {
      // Loga erro de auditoria se for DML
      if (/^(insert|update|delete)/i.test(query.trim())) {
        logAudit({
          usuario_id,
          operacao,
          tabela,
          registro_id,
          sql: query,
          status: 'erro',
          detalhes_erro: result.error
        });
      }
      appendLog({
        tipo: 'QUERY_ERROR',
        sql: query,
        error: result.error,
        data_hora: new Date().toISOString()
      });
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code,
        query: query,
        database: dbInfo
      });
    }
  } catch (error) {
    logError(error, { endpoint: '/query' });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// GET /query/test - Testar conexão com banco de dados
router.get('/test', async (req, res) => {
  try {
    const dbInfo = getDatabaseInfo();
    // Log simples do acesso ao teste
    appendLog({
      tipo: 'INFO',
      endpoint: '/query/test',
      data_hora: new Date().toISOString()
    });

    // Executar query de teste simples
    const testQuery = 'SELECT 1 as test_connection';
    const testResult = await executeQuery(testQuery);

    if (testResult.success) {
      res.json({
        success: true,
        message: `Conexão com ${dbInfo.type.toUpperCase()} funcionando corretamente`,
        database: dbInfo,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Falha na conexão com ${dbInfo.type.toUpperCase()}`,
        details: testResult.error,
        database: dbInfo
      });
    }
  } catch (error) {
    logError(error, { endpoint: '/query/test' });
    res.status(500).json({
      success: false,
      error: 'Falha no teste de conexão',
      message: error.message
    });
  }
});

// GET /query/info - Obter informações sobre o banco configurado
router.get('/info', (req, res) => {
  const dbInfo = getDatabaseInfo();
  appendLog({
    tipo: 'INFO',
    endpoint: '/query/info',
    data_hora: new Date().toISOString()
  });
  res.json({
    success: true,
    database: dbInfo,
    message: `Conectado ao ${dbInfo.type.toUpperCase()}`,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
