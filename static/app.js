// static/app.js

import { executeQuery, testConnection, getDatabaseInfo } from './api.js';
import { 
  showResults, 
  showError, 
  showSuccess, 
  showDatabaseDetails, 
  updateDatabaseInfo 
} from './ui.js';

// Função para construir a consulta SQL de inserção
document.addEventListener('DOMContentLoaded', () => {
  const sqlQuery = document.getElementById('sqlQuery');
  const executeBtn = document.getElementById('executeBtn');
  const testBtn = document.getElementById('testBtn');
  const infoBtn = document.getElementById('infoBtn');
  const clearBtn = document.getElementById('clearBtn');
  const results = document.getElementById('results');
  const resultCount = document.getElementById('resultCount');
  const dbInfo = document.getElementById('dbInfo');

  // Inicializar informações do banco
  loadDatabaseInfo();

  executeBtn.addEventListener('click', async () => {
    const query = sqlQuery.value.trim();
    if (!query) {
      showError('Por favor, digite uma consulta SQL', results, resultCount);
      return;
    }
    executeBtn.disabled = true;
    executeBtn.textContent = 'Executando...';

    try {
      const data = await executeQuery(query);
      if (data.success) {
        showResults(data, results, resultCount);
      } else {
        showError(data.error || 'Falha na execução da consulta', results, resultCount);
      }
    } catch (error) {
      showError('Erro de rede: ' + error.message, results, resultCount);
    } finally {
      executeBtn.disabled = false;
      executeBtn.textContent = 'Executar Consulta';
    }
  });

  testBtn.addEventListener('click', async () => {
    testBtn.disabled = true;
    testBtn.textContent = 'Testando...';
    try {
      const data = await testConnection();
      if (data.success) {
        showSuccess(data.message, results, resultCount);
        updateDatabaseInfo(data.database, dbInfo);
      } else {
        showError('Falha na conexão: ' + data.error, results, resultCount);
      }
    } catch (error) {
      showError('Teste de conexão falhou: ' + error.message, results, resultCount);
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Testar Conexão';
    }
  });

  infoBtn.addEventListener('click', async () => {
    infoBtn.disabled = true;
    infoBtn.textContent = 'Carregando...';
    try {
      const data = await getDatabaseInfo();
      if (data.success) {
        showDatabaseDetails(data.database, results, resultCount);
        updateDatabaseInfo(data.database, dbInfo);
      } else {
        showError('Falha ao obter informações: ' + data.error, results, resultCount);
      }
    } catch (error) {
      showError('Erro ao carregar informações: ' + error.message, results, resultCount);
    } finally {
      infoBtn.disabled = false;
      infoBtn.textContent = 'Info do Banco';
    }
  });

  clearBtn.addEventListener('click', () => {
    sqlQuery.value = '';
    results.innerHTML = '<p class="placeholder">Digite uma consulta SQL e clique em "Executar Consulta" para ver os resultados</p>';
    resultCount.textContent = '';
  });

  sqlQuery.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      executeBtn.click();
    }
  });

  async function loadDatabaseInfo() {
    try {
      const data = await getDatabaseInfo();
      if (data.success) {
        updateDatabaseInfo(data.database, dbInfo);
      }
    } catch (error) {
      dbInfo.textContent = 'Erro ao carregar informações do banco';
      dbInfo.className = 'db-info error';
    }
  }
});

// Servir arquivos estáticos da pasta pages
const path = require('path');
app.use('/pages', express.static(path.join(__dirname, 'pages')));
