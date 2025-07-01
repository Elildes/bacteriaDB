// static/ui.js

// Exporta uma função para atualizar informações do banco de dados
export function updateDatabaseInfo(database, dbInfoElem) {
  const dbType = database.type.toUpperCase();
  dbInfoElem.innerHTML = `
    <strong>${dbType}</strong> - ${database.host}:${database.port}/${database.database}
  `;
  dbInfoElem.className = `db-info ${database.type}`;
}

// Exporta uma função para exibir resultados de consultas SQL
export function showResults(data, resultsElem, resultCountElem) {
  const dbType = data.database.type.toUpperCase();
  resultCountElem.innerHTML = `
    ${data.rowCount} linhas retornadas do <strong>${dbType}</strong>
  `;

  if (!data.data || data.data.length === 0) {
    resultsElem.innerHTML = '<p class="no-results">Nenhum resultado encontrado</p>';
    return;
  }

  // Tabela
  let html = '<div class="table-container"><table class="results-table">';
  if (data.fields && data.fields.length > 0) {
    html += '<thead><tr>';
    data.fields.forEach(field => {
      html += `<th>${field.name}</th>`;
    });
    html += '</tr></thead>';
  } else if (data.data.length > 0) {
    html += '<thead><tr>';
    Object.keys(data.data[0]).forEach(key => {
      html += `<th>${key}</th>`;
    });
    html += '</tr></thead>';
  }

  html += '<tbody>';
  data.data.forEach(row => {
    html += '<tr>';
    Object.values(row).forEach(value => {
      html += `<td>${value !== null ? value : '<span class="null">NULL</span>'}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';

  if (data.limited) {
    html += '<p class="warning">⚠️ Resultados limitados a 1000 linhas</p>';
  }

  resultsElem.innerHTML = html;
}

// Exporta uma função para exibir detalhes do banco de dados
export function showDatabaseDetails(database, resultsElem, resultCountElem) {
  const dbType = database.type.toUpperCase();
  resultsElem.innerHTML = `
    <div class="database-details">
      <h4>📊 Informações do Banco de Dados</h4>
      <div class="detail-grid">
        <div class="detail-item"><strong>Tipo:</strong> ${dbType}</div>
        <div class="detail-item"><strong>Host:</strong> ${database.host}</div>
        <div class="detail-item"><strong>Porta:</strong> ${database.port}</div>
        <div class="detail-item"><strong>Banco:</strong> ${database.database}</div>
        <div class="detail-item"><strong>Usuário:</strong> ${database.user}</div>
      </div>
    </div>
  `;
  resultCountElem.textContent = '';
}

// Exporta uma função para exibir mensagens de erro
export function showError(message, resultsElem, resultCountElem) {
  resultsElem.innerHTML = `<div class="error">❌ Erro: ${message}</div>`;
  resultCountElem.textContent = '';
}

// Exporta uma função para exibir mensagens de sucesso
export function showSuccess(message, resultsElem, resultCountElem) {
  resultsElem.innerHTML = `<div class="success">✅ ${message}</div>`;
  resultCountElem.textContent = '';
}
