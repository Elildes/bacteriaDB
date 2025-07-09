// static/advanced-relation-form.js
// Componente avançado para busca relacional com múltiplos joins

let dbSchema = {};
let selectedTables = new Set();
let joinPaths = [];
let relationshipGraph = new Map();

// Função para logging seguro
function safeLog(level, message, data) {
  if (window.logger) {
    window.logger[level](message, data);
  } else {
    console[level](`[${level.toUpperCase()}] ${message}`, data || '');
  }
}

async function loadSchema() {
  try {
    safeLog('info', 'Carregando schema do banco de dados');
    const res = await fetch('/static/db-schema.json');
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    dbSchema = await res.json();
    buildRelationshipGraph();
    safeLog('info', 'Schema carregado com sucesso', { tables: Object.keys(dbSchema).length });
  } catch (error) {
    safeLog('error', 'Falha ao carregar schema', error);
    throw error;
  }
}

// Constrói um grafo de relacionamentos para encontrar caminhos entre tabelas
function buildRelationshipGraph() {
  try {
    safeLog('debug', 'Construindo grafo de relacionamentos');
    relationshipGraph.clear();
    
    for (const [tableName, tableInfo] of Object.entries(dbSchema)) {
      if (!relationshipGraph.has(tableName)) {
        relationshipGraph.set(tableName, new Set());
      }
      
      // Adiciona relacionamentos diretos (FKs out)
      tableInfo.fields.forEach(field => {
        if (field.fk) {
          relationshipGraph.get(tableName).add({
            table: field.fk.tabela,
            type: 'fk_out',
            fromField: field.name,
            toField: field.fk.campo,
            relationship: `${tableName}.${field.name} → ${field.fk.tabela}.${field.fk.campo}`
          });
          
          // Adiciona relacionamento inverso (FKs in)
          if (!relationshipGraph.has(field.fk.tabela)) {
            relationshipGraph.set(field.fk.tabela, new Set());
          }
          relationshipGraph.get(field.fk.tabela).add({
            table: tableName,
            type: 'fk_in',
            fromField: field.fk.campo,
            toField: field.name,
            relationship: `${field.fk.tabela}.${field.fk.campo} ← ${tableName}.${field.name}`
          });
        }
      });
    }
    
    safeLog('debug', 'Grafo de relacionamentos construído', { 
      tables: relationshipGraph.size,
      relationships: Array.from(relationshipGraph.values()).reduce((acc, set) => acc + set.size, 0)
    });
  } catch (error) {
    safeLog('error', 'Erro ao construir grafo de relacionamentos', error);
    throw error;
  }
}

// Encontra todos os caminhos possíveis entre duas tabelas (BFS)
function findAllPaths(startTable, endTable, maxDepth = 3) {
  if (startTable === endTable) return [[]];
  
  const paths = [];
  const queue = [[startTable, []]];
  const visited = new Set();
  
  while (queue.length > 0) {
    const [currentTable, path] = queue.shift();
    
    if (path.length >= maxDepth) continue;
    
    const relations = relationshipGraph.get(currentTable) || new Set();
    
    for (const relation of relations) {
      if (relation.table === endTable) {
        paths.push([...path, relation]);
      } else if (!path.some(p => p.table === relation.table)) {
        queue.push([relation.table, [...path, relation]]);
      }
    }
  }
  
  return paths;
}

// Encontra tabelas conectadas diretamente ou indiretamente
function getConnectedTables(tableName, maxDepth = 2) {
  const connected = new Map();
  
  for (const [otherTable] of Object.entries(dbSchema)) {
    if (otherTable !== tableName) {
      const paths = findAllPaths(tableName, otherTable, maxDepth);
      if (paths.length > 0) {
        connected.set(otherTable, paths);
      }
    }
  }
  
  return connected;
}

// Cria o formulário avançado de relações
function createAdvancedRelationForm() {
  const form = document.createElement('form');
  form.id = 'advanced-relation-form';
  form.className = 'advanced-relation-form';
  form.autocomplete = 'off';

  // Cabeçalho
  const header = document.createElement('div');
  header.className = 'form-header';
  header.innerHTML = `
    <p>Explore relacionamentos entre múltiplas</p>
  `;
  form.appendChild(header);

  // Container principal
  const mainContainer = document.createElement('div');
  mainContainer.className = 'main-container';
  form.appendChild(mainContainer);

  // Seção de consultas salvas
  const savedSection = document.createElement('div');
  savedSection.className = 'saved-section';
  savedSection.innerHTML = `
    <div class="section-header">
      <h4>💾 Consultas Salvas</h4>
      <button type="button" class="btn-secondary" id="loadSaved">Carregar Salvas</button>
    </div>
    <div id="savedList" class="saved-list"></div>
  `;
  mainContainer.appendChild(savedSection);

  // Seção de consultas pré-definidas
  const presetsSection = document.createElement('div');
  presetsSection.className = 'presets-section';
  presetsSection.innerHTML = `
    <div class="section-header">
      <h4>💡 Consultas Pré-definidas</h4>
      <button type="button" class="btn-secondary" id="loadPresets">Carregar Exemplos</button>
    </div>
    <div id="presetsList" class="presets-list"></div>
  `;
  mainContainer.appendChild(presetsSection);

  // Seção de seleção de tabelas
  const tablesSection = document.createElement('div');
  tablesSection.className = 'tables-section';
  tablesSection.innerHTML = `
    <div class="section-header">
      <h4>📊 Tabelas</h4>
      <button type="button" class="btn-secondary" id="clearTables">Limpar Seleção</button>
    </div>
    <div class="table-selector">
      <select id="tableSelector">
        <option value="">Selecione uma tabela para adicionar...</option>
        ${Object.keys(dbSchema).map(t => `<option value="${t}">${t}</option>`).join('')}
      </select>
      <button type="button" class="btn-add" id="addTable">Adicionar</button>
    </div>
    <div id="selectedTables" class="selected-tables"></div>
  `;
  mainContainer.appendChild(tablesSection);

  // Seção de relacionamentos
  const relationSection = document.createElement('div');
  relationSection.className = 'relation-section';
  relationSection.innerHTML = `
    <div class="section-header">
      <h4>🔗 Relacionamentos</h4>
      <div class="relation-controls">
        <button type="button" class="btn-secondary" id="autoDetectRelations">Selecione os Relacionamentos</button>
        <button type="button" class="btn-secondary" id="clearRelations">Limpar</button>
      </div>
    </div>
    <div id="relationshipList" class="relationship-list"></div>
  `;
  mainContainer.appendChild(relationSection);

  // Seção de colunas
  const columnsSection = document.createElement('div');
  columnsSection.className = 'columns-section';
  columnsSection.innerHTML = `
    <div class="section-header">
      <h4>📋 Colunas</h4>
      <div class="column-controls">
        <button type="button" class="btn-secondary" id="selectAllColumns">Selecionar Todas</button>
        <button type="button" class="btn-secondary" id="clearColumns">Limpar</button>
      </div>
    </div>
    <div id="columnsList" class="columns-list"></div>
  `;
  mainContainer.appendChild(columnsSection);

  // Preview SQL
  const sqlPreview = document.createElement('div');
  sqlPreview.className = 'sql-preview-section';
  sqlPreview.innerHTML = `
    <div class="section-header">
      <h4>📝 SQL Gerado</h4>
      <div class="sql-controls">
        <button type="button" class="btn-secondary" id="viewSQL">Ver Comando</button>
        <button type="button" class="btn-secondary" id="copySQL" style="display: none;">Copiar SQL</button>
      </div>
    </div>
    <pre id="advancedSqlPreview" class="sql-preview" style="display: none;"></pre>
  `;
  mainContainer.appendChild(sqlPreview);

  // Botões de ação
  const actionButtons = document.createElement('div');
  actionButtons.className = 'action-buttons';
  actionButtons.innerHTML = `
    <button type="submit" class="btn-primary" id="executeQuery">
      🚀 Executar Consulta
    </button>
    <button type="button" class="btn-secondary" id="saveQuery">
      💾 Salvar Consulta
    </button>
    <button type="button" class="btn-secondary" id="resetForm">
      🔄 Resetar
    </button>
    <button type="button" class="btn-secondary" id="debugPanel" title="Painel de Debug">
      🐛 Debug
    </button>
  `;
  mainContainer.appendChild(actionButtons);

  // Painel de debug (oculto por padrão)
  const debugSection = document.createElement('div');
  debugSection.className = 'debug-section';
  debugSection.style.display = 'none';
  debugSection.innerHTML = `
    <div class="section-header">
      <h4>🐛 Painel de Debug</h4>
      <button type="button" class="btn-secondary" id="closeDebug">Fechar</button>
    </div>
    <div class="debug-content">
      <div class="debug-item">
        <h5>Tabelas Selecionadas:</h5>
        <pre id="debugTables"></pre>
      </div>
      <div class="debug-item">
        <h5>Caminhos de Join:</h5>
        <pre id="debugJoins"></pre>
      </div>
      <div class="debug-item">
        <h5>Grafo de Relacionamentos:</h5>
        <pre id="debugGraph"></pre>
      </div>
      <div class="debug-actions">
        <button type="button" class="btn-secondary" id="exportLogs">Exportar Logs</button>
        <button type="button" class="btn-secondary" id="clearLogs">Limpar Logs</button>
      </div>
    </div>
  `;
  mainContainer.appendChild(debugSection);

  // Resultados
  const resultsSection = document.createElement('div');
  resultsSection.className = 'results-section';
  resultsSection.innerHTML = `
    <div class="section-header">
      <h4>📊 Resultados</h4>
      <span id="resultCount" class="result-count"></span>
    </div>
    <div id="advancedResults" class="results-container"></div>
  `;
  mainContainer.appendChild(resultsSection);

  // Configurar event listeners
  setupEventListeners(form);

  return form;
}

// Configura todos os event listeners
function setupEventListeners(form) {
  const tableSelector = form.querySelector('#tableSelector');
  const addTableBtn = form.querySelector('#addTable');
  const clearTablesBtn = form.querySelector('#clearTables');
  const autoDetectBtn = form.querySelector('#autoDetectRelations');
  const clearRelationsBtn = form.querySelector('#clearRelations');
  const selectAllColumnsBtn = form.querySelector('#selectAllColumns');
  const clearColumnsBtn = form.querySelector('#clearColumns');
  const copySQLBtn = form.querySelector('#copySQL');
  const viewSQLBtn = form.querySelector('#viewSQL');
  const executeBtn = form.querySelector('#executeQuery');
  const saveQueryBtn = form.querySelector('#saveQuery');
  const resetFormBtn = form.querySelector('#resetForm');
  const loadPresetsBtn = form.querySelector('#loadPresets');
  const loadSavedBtn = form.querySelector('#loadSaved');
  const debugPanelBtn = form.querySelector('#debugPanel');
  const closeDebugBtn = form.querySelector('#closeDebug');
  const exportLogsBtn = form.querySelector('#exportLogs');
  const clearLogsBtn = form.querySelector('#clearLogs');

  // Debug panel
  debugPanelBtn.addEventListener('click', () => {
    const debugSection = form.querySelector('.debug-section');
    debugSection.style.display = debugSection.style.display === 'none' ? 'block' : 'none';
    updateDebugInfo(form);
  });

  closeDebugBtn.addEventListener('click', () => {
    form.querySelector('.debug-section').style.display = 'none';
  });

  exportLogsBtn.addEventListener('click', () => {
    if (window.logger) {
      window.logger.export();
    }
  });

  clearLogsBtn.addEventListener('click', () => {
    if (window.logger) {
      window.logger.clear();
      updateDebugInfo(form);
    }
  });

  // Ver SQL
  viewSQLBtn.addEventListener('click', () => {
    const sqlPreview = form.querySelector('#advancedSqlPreview');
    const copyBtn = form.querySelector('#copySQL');
    
    if (sqlPreview.style.display === 'none') {
      const sql = generateAdvancedSQL(form);
      sqlPreview.textContent = sql;
      sqlPreview.style.display = 'block';
      copyBtn.style.display = 'inline-block';
      viewSQLBtn.textContent = 'Ocultar Comando';
    } else {
      sqlPreview.style.display = 'none';
      copyBtn.style.display = 'none';
      viewSQLBtn.textContent = 'Ver Comando';
    }
  });

  // Carregar consultas salvas
  loadSavedBtn.addEventListener('click', () => {
    loadSavedQueries(form);
  });

  // Carregar consultas pré-definidas
  loadPresetsBtn.addEventListener('click', async () => {
    await loadPresetQueries(form);
  });

  // Adicionar tabela
  addTableBtn.addEventListener('click', () => {
    const tableName = tableSelector.value;
    if (tableName && !selectedTables.has(tableName)) {
      selectedTables.add(tableName);
      updateSelectedTables(form);
      updateColumns(form);
      updatePreview(form);
    }
  });

  // Limpar tabelas selecionadas
  clearTablesBtn.addEventListener('click', () => {
    selectedTables.clear();
    joinPaths = [];
    updateSelectedTables(form);
    updateRelationships(form);
    updateColumns(form);
    updatePreview(form);
  });

  // Auto-detectar relacionamentos
  autoDetectBtn.addEventListener('click', () => {
    autoDetectRelationships(form);
  });

  // Limpar relacionamentos
  clearRelationsBtn.addEventListener('click', () => {
    joinPaths = [];
    updateRelationships(form);
    updatePreview(form);
  });

  // Selecionar todas as colunas
  selectAllColumnsBtn.addEventListener('click', () => {
    const checkboxes = form.querySelectorAll('.columns-list input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    updatePreview(form);
  });

  // Limpar colunas
  clearColumnsBtn.addEventListener('click', () => {
    const checkboxes = form.querySelectorAll('.columns-list input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    updatePreview(form);
  });

  // Copiar SQL
  copySQLBtn.addEventListener('click', () => {
    const sql = form.querySelector('#advancedSqlPreview').textContent;
    navigator.clipboard.writeText(sql);
    showNotification('SQL copiado para a área de transferência!');
  });

  // Executar consulta
  executeBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await executeAdvancedQuery(form);
  });

  // Salvar consulta
  saveQueryBtn.addEventListener('click', () => {
    saveQueryToLocalStorage(form);
  });

  // Resetar formulário
  resetFormBtn.addEventListener('click', () => {
    resetForm(form);
  });

  // Atualizar preview quando SQL está visível
  form.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox' && e.target.name === 'columns') {
      const sqlPreview = form.querySelector('#advancedSqlPreview');
      if (sqlPreview.style.display !== 'none') {
        // Debounce para evitar múltiplas atualizações
        clearTimeout(form._updateTimeout);
        form._updateTimeout = setTimeout(() => {
          updatePreview(form);
        }, 100);
      }
    }
  });
}

// Atualiza a exibição das tabelas selecionadas
function updateSelectedTables(form) {
  const container = form.querySelector('#selectedTables');
  
  if (selectedTables.size === 0) {
    container.innerHTML = '<p class="empty-state">Nenhuma tabela selecionada</p>';
    return;
  }

  const html = Array.from(selectedTables).map(table => `
    <div class="table-chip" data-table="${table}">
      <span class="table-name">${table}</span>
      <button type="button" class="remove-table" data-table="${table}">×</button>
    </div>
  `).join('');

  container.innerHTML = html;

  // Adicionar listeners para remover tabelas
  container.querySelectorAll('.remove-table').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const table = e.target.dataset.table;
      selectedTables.delete(table);
      // Remove joins que envolvem essa tabela
      joinPaths = joinPaths.filter(path => 
        !path.some(relation => relation.table === table)
      );
      updateSelectedTables(form);
      updateRelationships(form);
      updateColumns(form);
      updatePreview(form);
    });
  });
}

// Auto-detecta relacionamentos entre tabelas selecionadas
function autoDetectRelationships(form) {
  try {
    if (selectedTables.size < 2) {
      safeLog('warn', 'Tentativa de auto-detectar relacionamentos com menos de 2 tabelas');
      showNotification('Selecione pelo menos 2 tabelas para detectar relacionamentos');
      return;
    }

    const tables = Array.from(selectedTables);
    safeLog('info', 'Auto-detectando relacionamentos', { tables });
    
    joinPaths = [];

    // Encontra o melhor caminho entre todas as tabelas
    const connectedPaths = findOptimalJoinPaths(tables);
    joinPaths = connectedPaths;

    updateRelationships(form);
    updatePreview(form);
    
    if (joinPaths.length > 0) {
      safeLog('info', 'Relacionamentos detectados com sucesso', { 
        paths: joinPaths.length,
        tables: tables.length
      });
      showNotification(`${joinPaths.length} relacionamento(s) detectado(s)`);
    } else {
      safeLog('warn', 'Nenhum relacionamento encontrado entre as tabelas', { tables });
      showNotification('Nenhum relacionamento encontrado entre as tabelas selecionadas');
    }
  } catch (error) {
    safeLog('error', 'Erro ao detectar relacionamentos', error);
    showNotification('Erro ao detectar relacionamentos');
  }
}

// Encontra o caminho ótimo de joins entre múltiplas tabelas
function findOptimalJoinPaths(tables) {
  if (tables.length < 2) return [];
  
  const paths = [];
  const visited = new Set();
  
  // Usar primeira tabela como ponto de partida
  const startTable = tables[0];
  const queue = [{ table: startTable, path: [], depth: 0 }];
  visited.add(startTable);
  
  while (queue.length > 0) {
    const { table: currentTable, path, depth } = queue.shift();
    
    // Parar se chegamos muito fundo
    if (depth > 2) continue;
    
    const relations = relationshipGraph.get(currentTable) || new Set();
    
    for (const relation of relations) {
      // Se a tabela de destino está na nossa lista de tabelas selecionadas
      if (tables.includes(relation.table) && !visited.has(relation.table)) {
        const newPath = [...path, relation];
        paths.push(newPath);
        visited.add(relation.table);
        
        // Continuar explorando a partir desta nova tabela
        queue.push({ 
          table: relation.table, 
          path: newPath, 
          depth: depth + 1 
        });
      }
    }
  }
  
  // Se não conseguimos conectar todas as tabelas, tentar conexões especiais
  const connectedTables = new Set([startTable]);
  paths.forEach(path => {
    path.forEach(relation => {
      connectedTables.add(relation.table);
    });
  });
  
  // Para tabelas não conectadas, tentar encontrar conexões através de tabelas intermediárias
  const unconnectedTables = tables.filter(t => !connectedTables.has(t));
  
  for (const unconnectedTable of unconnectedTables) {
    // Tentar encontrar um caminho através de tabelas intermediárias
    const intermediatePaths = findPathThroughIntermediate(
      Array.from(connectedTables)[0], 
      unconnectedTable, 
      2
    );
    
    if (intermediatePaths.length > 0) {
      paths.push(...intermediatePaths);
    }
  }
  
  return paths;
}

// Encontra caminhos através de tabelas intermediárias
function findPathThroughIntermediate(startTable, endTable, maxDepth) {
  const paths = [];
  const queue = [{ table: startTable, path: [], depth: 0 }];
  const visited = new Set();
  
  while (queue.length > 0) {
    const { table: currentTable, path, depth } = queue.shift();
    
    if (depth >= maxDepth) continue;
    
    const relations = relationshipGraph.get(currentTable) || new Set();
    
    for (const relation of relations) {
      if (relation.table === endTable) {
        paths.push([...path, relation]);
      } else if (!visited.has(relation.table)) {
        visited.add(relation.table);
        queue.push({
          table: relation.table,
          path: [...path, relation],
          depth: depth + 1
        });
      }
    }
  }
  
  return paths;
}

// Atualiza a exibição dos relacionamentos
function updateRelationships(form) {
  const container = form.querySelector('#relationshipList');
  
  if (joinPaths.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhum relacionamento definido</p>';
    return;
  }

  const html = joinPaths.map((path, index) => `
    <div class="relationship-item">
      <div class="relationship-path">
        ${path.map(relation => `
          <span class="relation-step">${relation.relationship}</span>
        `).join(' → ')}
      </div>
      <button type="button" class="remove-relationship" data-index="${index}">×</button>
    </div>
  `).join('');

  container.innerHTML = html;

  // Adicionar listeners para remover relacionamentos
  container.querySelectorAll('.remove-relationship').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      joinPaths.splice(index, 1);
      updateRelationships(form);
      updatePreview(form);
    });
  });
}

// Atualiza a exibição das colunas disponíveis
function updateColumns(form) {
  const container = form.querySelector('#columnsList');
  
  if (selectedTables.size === 0) {
    container.innerHTML = '<p class="empty-state">Selecione tabelas para ver as colunas</p>';
    return;
  }

  const html = Array.from(selectedTables).map(table => `
    <div class="table-columns">
      <div class="table-header">
        <h5 class="table-title">${table}</h5>
        <div class="table-controls">
          <button type="button" class="btn-toggle-all" data-table="${table}">
            <span class="toggle-icon">✓</span>
            <span class="toggle-text">Todas</span>
          </button>
        </div>
      </div>
      <div class="column-checkboxes" data-table="${table}">
        ${dbSchema[table].fields.map(field => `
          <div class="column-item">
            <button type="button" class="column-toggle" data-value="${table}.${field.name}">
              <span class="toggle-indicator"></span>
              <div class="column-info">
                <span class="column-name">${field.name}</span>
                <span class="column-type">${field.type}</span>
              </div>
              <div class="column-badges">
                ${field.pk ? '<span class="column-badge pk">PK</span>' : ''}
                ${field.fk ? '<span class="column-badge fk">FK</span>' : ''}
              </div>
            </button>
            <input type="checkbox" name="columns" value="${table}.${field.name}" checked style="display: none;">
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
  
  // Adicionar event listeners para os botões toggle
  container.querySelectorAll('.column-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const checkbox = btn.parentElement.querySelector('input[type="checkbox"]');
      const indicator = btn.querySelector('.toggle-indicator');
      
      checkbox.checked = !checkbox.checked;
      btn.classList.toggle('active', checkbox.checked);
      
      // Atualizar visualização se SQL está visível
      const sqlPreview = form.querySelector('#advancedSqlPreview');
      if (sqlPreview.style.display !== 'none') {
        updatePreview(form);
      }
    });
  });
  
  // Event listeners para "Todas" de cada tabela
  container.querySelectorAll('.btn-toggle-all').forEach(btn => {
    btn.addEventListener('click', () => {
      const table = btn.dataset.table;
      const checkboxes = container.querySelectorAll(`[data-table="${table}"] input[type="checkbox"]`);
      const toggleButtons = container.querySelectorAll(`[data-table="${table}"] .column-toggle`);
      
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      const newState = !allChecked;
      
      checkboxes.forEach(checkbox => {
        checkbox.checked = newState;
      });
      
      toggleButtons.forEach(toggle => {
        toggle.classList.toggle('active', newState);
      });
      
      // Atualizar texto do botão
      const toggleText = btn.querySelector('.toggle-text');
      toggleText.textContent = newState ? 'Nenhuma' : 'Todas';
      
      // Atualizar visualização se SQL está visível
      const sqlPreview = form.querySelector('#advancedSqlPreview');
      if (sqlPreview.style.display !== 'none') {
        updatePreview(form);
      }
    });
  });
  
  // Inicializar estado visual dos botões
  container.querySelectorAll('.column-toggle').forEach(btn => {
    const checkbox = btn.parentElement.querySelector('input[type="checkbox"]');
    btn.classList.toggle('active', checkbox.checked);
  });
}

// Gera o SQL final com base nas seleções
function generateAdvancedSQL(form) {
  if (selectedTables.size === 0) {
    return '-- Selecione pelo menos uma tabela';
  }

  const selectedColumns = Array.from(form.querySelectorAll('input[name="columns"]:checked'))
    .map(cb => cb.value);

  if (selectedColumns.length === 0) {
    return '-- Selecione pelo menos uma coluna';
  }

  // Tratar colunas duplicadas com aliases
  const columnAliases = new Map();
  const columnCounts = new Map();
  
  // Contar ocorrências de cada nome de coluna
  selectedColumns.forEach(column => {
    const columnName = column.split('.')[1];
    columnCounts.set(columnName, (columnCounts.get(columnName) || 0) + 1);
  });
  
  // Gerar SQL com aliases para colunas duplicadas
  const sqlColumns = selectedColumns.map(column => {
    const [table, columnName] = column.split('.');
    const count = columnCounts.get(columnName);
    
    if (count > 1) {
      // Se há múltiplas colunas com o mesmo nome, adicionar alias
      const alias = `${table}_${columnName}`;
      return `${column} AS ${alias}`;
    } else {
      return column;
    }
  });

  const tables = Array.from(selectedTables);
  let sql = `SELECT\n  ${sqlColumns.join(',\n  ')}\n`;

  if (tables.length === 1) {
    sql += `FROM ${tables[0]}`;
  } else if (joinPaths.length === 0) {
    sql += `FROM ${tables[0]}`;
    sql += `\n-- AVISO: Múltiplas tabelas selecionadas mas sem relacionamentos definidos`;
    sql += `\n-- Use "Auto-detectar" para encontrar relacionamentos automaticamente`;
  } else {
    // Construir joins baseado nos caminhos encontrados
    const [firstTable] = tables;
    sql += `FROM ${firstTable}\n`;

    const joinedTables = new Set([firstTable]);
    const processedJoins = new Set();
    
    for (const path of joinPaths) {
      for (const relation of path) {
        const joinKey = `${relation.table}-${relation.fromField}-${relation.toField}`;
        
        if (!processedJoins.has(joinKey) && !joinedTables.has(relation.table)) {
          let sourceTable = null;
          
          // Encontrar a tabela de origem que já está no join
          for (const joinedTable of joinedTables) {
            if (relation.type === 'fk_out') {
              // Para FK OUT, a tabela de origem é uma das tabelas já joinadas
              const sourceRelation = relationshipGraph.get(joinedTable);
              if (sourceRelation) {
                for (const rel of sourceRelation) {
                  if (rel.table === relation.table) {
                    sourceTable = joinedTable;
                    break;
                  }
                }
              }
            } else {
              // Para FK IN, a tabela de destino é uma das tabelas já joinadas
              if (relationshipGraph.has(relation.table)) {
                const targetRelations = relationshipGraph.get(relation.table);
                for (const rel of targetRelations) {
                  if (rel.table === joinedTable) {
                    sourceTable = joinedTable;
                    break;
                  }
                }
              }
            }
            if (sourceTable) break;
          }
          
          if (!sourceTable) {
            sourceTable = firstTable;
          }
          
          sql += `JOIN ${relation.table} ON `;
          
          if (relation.type === 'fk_out') {
            sql += `${sourceTable}.${relation.fromField} = ${relation.table}.${relation.toField}\n`;
          } else {
            sql += `${relation.table}.${relation.toField} = ${sourceTable}.${relation.fromField}\n`;
          }
          
          joinedTables.add(relation.table);
          processedJoins.add(joinKey);
        }
      }
    }
  }

  sql += '\nLIMIT 100;';
  return sql;
}

// Atualiza o preview do SQL
function updatePreview(form) {
  const sql = generateAdvancedSQL(form);
  form.querySelector('#advancedSqlPreview').textContent = sql;
}

// Executa a consulta avançada
async function executeAdvancedQuery(form) {
  const sql = generateAdvancedSQL(form);
  const resultsContainer = form.querySelector('#advancedResults');
  const resultCount = form.querySelector('#resultCount');
  
  safeLog('info', 'Executando consulta avançada', { sql });
  resultsContainer.innerHTML = '<div class="loading">🔄 Executando consulta...</div>';
  
  try {
    const response = await fetch('/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data && data.data.length > 0) {
      resultCount.textContent = `${data.data.length} resultado(s)`;
      resultsContainer.innerHTML = `
        <div class="table-container">
          ${renderAdvancedTable(data.data)}
        </div>
      `;
      safeLog('info', 'Consulta executada com sucesso', { rows: data.data.length });
    } else if (data.success) {
      resultCount.textContent = '0 resultados';
      resultsContainer.innerHTML = '<div class="no-results">Nenhum resultado encontrado</div>';
      safeLog('info', 'Consulta executada sem resultados');
    } else {
      const errorMessage = window.errorHandler ? 
        window.errorHandler.handleSqlError(data, sql) : 
        `Erro: ${data.error}`;
      
      resultCount.textContent = '';
      resultsContainer.innerHTML = `<div class="error">❌ ${errorMessage}</div>`;
      safeLog('error', 'Erro na consulta SQL', { error: data.error, sql });
    }
  } catch (error) {
    const errorMessage = window.errorHandler ? 
      window.errorHandler.handleApiError(error, 'Executar consulta avançada') : 
      `Erro de conexão: ${error.message}`;
    
    resultCount.textContent = '';
    resultsContainer.innerHTML = `<div class="error">❌ ${errorMessage}</div>`;
    safeLog('error', 'Erro ao executar consulta', error);
  }
}

// Renderiza tabela de resultados com funcionalidades avançadas
function renderAdvancedTable(data) {
  const headers = Object.keys(data[0]);
  const tableId = `table-${Date.now()}`;
  
  let html = `
    <div class="table-controls">
      <div class="search-container">
        <input type="text" id="tableSearch-${tableId}" placeholder="🔍 Buscar nos resultados..." class="table-search">
        <span class="search-info" id="searchInfo-${tableId}"></span>
      </div>
      <div class="table-actions">
        <button type="button" class="btn-secondary" id="clearSearch-${tableId}">Limpar Busca</button>
      </div>
    </div>
    <div class="table-wrapper">
      <table class="advanced-results-table" id="${tableId}" data-original='${JSON.stringify(data)}'>
        <thead>
          <tr>
            ${headers.map((h, index) => `
              <th class="sortable" data-column="${index}" data-sort-direction="none">
                ${h} 
                <span class="sort-indicator">⚭</span>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${renderTableRows(data, headers)}
        </tbody>
      </table>
    </div>
  `;
  
  // Configurar funcionalidades após inserir o HTML
  setTimeout(() => {
    setupTableFunctionalities(tableId, data, headers);
  }, 100);
  
  return html;
}

// Renderiza as linhas da tabela
function renderTableRows(data, headers) {
  return data.map(row => `
    <tr>
      ${headers.map(h => `
        <td data-value="${row[h] || ''}">${row[h] !== null ? row[h] : '<span class="null">NULL</span>'}</td>
      `).join('')}
    </tr>
  `).join('');
}

// Configura todas as funcionalidades da tabela (ordenação, busca, exportação)
function setupTableFunctionalities(tableId, originalData, headers) {
  const table = document.getElementById(tableId);
  const searchInput = document.getElementById(`tableSearch-${tableId}`);
  const searchInfo = document.getElementById(`searchInfo-${tableId}`);
  const clearSearchBtn = document.getElementById(`clearSearch-${tableId}`);
  const exportBtn = document.getElementById(`exportTable-${tableId}`);
  
  if (!table || !searchInput) return;
  
  let currentData = [...originalData];
  let currentSortColumn = null;
  let currentSortDirection = 'none';
  
  // Configurar ordenação por clique nos cabeçalhos
  table.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const columnIndex = parseInt(th.dataset.column);
      const currentDirection = th.dataset.sortDirection;
      
      // Limpar indicadores de outras colunas
      table.querySelectorAll('th.sortable').forEach(header => {
        header.dataset.sortDirection = 'none';
        header.querySelector('.sort-indicator').textContent = '⚭';
      });
      
      // Determinar nova direção
      let newDirection = 'asc';
      if (currentDirection === 'asc') {
        newDirection = 'desc';
      } else if (currentDirection === 'desc') {
        newDirection = 'none';
      }
      
      th.dataset.sortDirection = newDirection;
      currentSortColumn = columnIndex;
      currentSortDirection = newDirection;
      
      // Atualizar indicador visual
      const indicator = th.querySelector('.sort-indicator');
      if (newDirection === 'asc') {
        indicator.textContent = '▲';
      } else if (newDirection === 'desc') {
        indicator.textContent = '▼';
      } else {
        indicator.textContent = '⚭';
      }
      
      // Aplicar ordenação
      sortTable(columnIndex, newDirection);
    });
  });
  
  // Configurar busca em tempo real
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    filterTable(searchTerm);
  });
  
  // Configurar botão limpar busca
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterTable('');
  });
  
  // Configurar exportação CSV
  exportBtn.addEventListener('click', () => {
    exportTableToCSV();
  });
  
  // Função para ordenar a tabela
  function sortTable(columnIndex, direction) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    if (direction === 'none') {
      // Restaurar ordem original
      const filteredData = currentData.filter(row => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (!searchTerm) return true;
        return headers.some(header => {
          const value = row[header];
          return value && value.toString().toLowerCase().includes(searchTerm);
        });
      });
      tbody.innerHTML = renderTableRows(filteredData, headers);
      return;
    }
    
    rows.sort((a, b) => {
      const aValue = a.children[columnIndex].dataset.value;
      const bValue = b.children[columnIndex].dataset.value;
      
      // Tratar valores nulos
      if (!aValue && !bValue) return 0;
      if (!aValue) return direction === 'asc' ? -1 : 1;
      if (!bValue) return direction === 'asc' ? 1 : -1;
      
      // Detectar se é número
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        // Comparação numérica
        return direction === 'asc' ? aNum - bNum : bNum - aNum;
      } else {
        // Comparação de string
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return direction === 'asc' ? comparison : -comparison;
      }
    });
    
    // Recriar tbody com linhas ordenadas
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
  }
  
  // Função para filtrar a tabela
  function filterTable(searchTerm) {
    const tbody = table.querySelector('tbody');
    
    if (!searchTerm) {
      // Mostrar todos os dados
      const dataToShow = currentSortDirection === 'none' ? 
        currentData : 
        [...currentData]; // Será ordenado pelo sortTable se necessário
      
      tbody.innerHTML = renderTableRows(dataToShow, headers);
      searchInfo.textContent = '';
      
      // Re-aplicar ordenação se houver
      if (currentSortDirection !== 'none') {
        setTimeout(() => sortTable(currentSortColumn, currentSortDirection), 10);
      }
      return;
    }
    
    // Filtrar dados
    const filteredData = currentData.filter(row => {
      return headers.some(header => {
        const value = row[header];
        return value && value.toString().toLowerCase().includes(searchTerm);
      });
    });
    
    tbody.innerHTML = renderTableRows(filteredData, headers);
    searchInfo.textContent = `${filteredData.length} de ${currentData.length} resultados`;
    
    // Re-aplicar ordenação nos dados filtrados
    if (currentSortDirection !== 'none') {
      setTimeout(() => sortTable(currentSortColumn, currentSortDirection), 10);
    }
  }
  
  // Função para exportar para CSV
  function exportTableToCSV() {
    const rows = table.querySelectorAll('tbody tr');
    const visibleData = Array.from(rows).map(row => {
      const cells = row.querySelectorAll('td');
      return Array.from(cells).map(cell => {
        const value = cell.dataset.value;
        return value === '' ? 'NULL' : value;
      });
    });
    
    // Criar CSV
    const csvContent = [
      headers.join(','), // Cabeçalhos
      ...visibleData.map(row => row.map(value => `"${value}"`).join(','))
    ].join('\n');
    
    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `resultados-${new Date().toISOString().slice(0,10)}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Tabela exportada para CSV!', 'info');
  }
}

// Funções auxiliares
// Funções auxiliares
async function loadPresetQueries(form) {
  try {
    safeLog('info', 'Carregando consultas pré-definidas');
    const response = await fetch('/static/query-examples.json');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const presetsList = form.querySelector('#presetsList');
    const html = data.predefinedQueries.map((query, index) => `
      <div class="preset-item">
        <div class="preset-info">
          <h5 class="preset-name">${query.name}</h5>
          <p class="preset-description">${query.description}</p>
          <div class="preset-tables">
            <span class="preset-label">Tabelas:</span>
            ${query.tables.map(table => `<span class="preset-table">${table}</span>`).join('')}
          </div>
        </div>
        <button type="button" class="btn-preset" data-index="${index}">Aplicar</button>
      </div>
    `).join('');
    
    presetsList.innerHTML = html;
    
    // Adicionar listeners para aplicar presets
    presetsList.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        applyPresetQuery(form, data.predefinedQueries[index]);
      });
    });
    
    safeLog('info', 'Consultas pré-definidas carregadas', { count: data.predefinedQueries.length });
    showNotification('Consultas pré-definidas carregadas!');
  } catch (error) {
    safeLog('error', 'Erro ao carregar consultas pré-definidas', error);
    showNotification('Erro ao carregar consultas pré-definidas');
  }
}

function applyPresetQuery(form, query) {
  try {
    safeLog('info', 'Aplicando consulta pré-definida', { name: query.name });
    
    // Limpar seleções atuais
    selectedTables.clear();
    joinPaths = [];
    
    // Adicionar tabelas
    query.tables.forEach(table => {
      selectedTables.add(table);
    });
    
    // Simular joins baseados no preset
    joinPaths = query.joins || [];
    
    // Atualizar interface
    updateSelectedTables(form);
    updateRelationships(form);
    updateColumns(form);
    
    // Aplicar seleção de colunas com delay maior e múltiplas verificações
    setTimeout(() => {
      try {
        const columnCheckboxes = form.querySelectorAll('input[name="columns"]');
        const columnToggles = form.querySelectorAll('.column-toggle');
        
        safeLog('debug', 'Aplicando seleção de colunas', {
          checkboxes: columnCheckboxes.length,
          toggles: columnToggles.length,
          queryColumns: query.columns.length
        });
        
        if (columnCheckboxes.length === 0) {
          // Se não há checkboxes, tentar novamente após mais tempo
          setTimeout(() => {
            const retryCheckboxes = form.querySelectorAll('input[name="columns"]');
            const retryToggles = form.querySelectorAll('.column-toggle');
            
            retryCheckboxes.forEach(checkbox => {
              checkbox.checked = query.columns.includes(checkbox.value);
            });
            
            retryToggles.forEach(toggle => {
              const checkbox = toggle.parentElement.querySelector('input[type="checkbox"]');
              if (checkbox) {
                toggle.classList.toggle('active', checkbox.checked);
              }
            });
            
            updatePreviewIfVisible(form);
          }, 500);
          return;
        }
        
        columnCheckboxes.forEach(checkbox => {
          checkbox.checked = query.columns.includes(checkbox.value);
        });
        
        columnToggles.forEach(toggle => {
          const checkbox = toggle.parentElement.querySelector('input[type="checkbox"]');
          if (checkbox) {
            toggle.classList.toggle('active', checkbox.checked);
          }
        });
        
        updatePreviewIfVisible(form);
        
        safeLog('info', 'Consulta pré-definida aplicada com sucesso', { 
          name: query.name,
          tables: query.tables.length,
          columns: query.columns.length,
          selectedColumns: form.querySelectorAll('input[name="columns"]:checked').length
        });
        
      } catch (error) {
        safeLog('error', 'Erro ao aplicar seleção de colunas', error);
        showNotification('Erro ao aplicar seleção de colunas: ' + error.message, 'error');
      }
    }, 600);
    
    showNotification(`Consulta "${query.name}" aplicada!`);
  } catch (error) {
    safeLog('error', 'Erro ao aplicar consulta pré-definida', error);
    showNotification('Erro ao aplicar consulta pré-definida: ' + error.message, 'error');
  }
}

function updatePreviewIfVisible(form) {
  try {
    const sqlPreview = form.querySelector('#advancedSqlPreview');
    if (sqlPreview && sqlPreview.style.display !== 'none') {
      updatePreview(form);
    }
  } catch (error) {
    safeLog('error', 'Erro ao atualizar preview', error);
  }
}

function showNotification(message, type = 'info') {
  try {
    // Usar sistema de log se disponível
    if (window.logger) {
      window.logger[type](message);
    } else {
      // Fallback para notificação simples
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        background: ${type === 'error' ? '#fef2f2' : '#f0f9ff'};
        border: 1px solid ${type === 'error' ? '#fecaca' : '#bae6fd'};
        border-radius: 6px;
        color: ${type === 'error' ? '#dc2626' : '#0369a1'};
        z-index: 1000;
        max-width: 400px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      `;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 5000);
    }
  } catch (error) {
    console.error('Erro ao mostrar notificação:', error);
    console.log('Mensagem original:', message);
  }
}

function saveQueryToLocalStorage(form) {
  const queryName = prompt('Nome da consulta:');
  if (!queryName) return;
  
  const query = {
    name: queryName,
    tables: Array.from(selectedTables),
    joins: joinPaths,
    columns: Array.from(form.querySelectorAll('input[name="columns"]:checked')).map(cb => cb.value),
    sql: generateAdvancedSQL(form),
    timestamp: new Date().toISOString()
  };
  
  const saved = JSON.parse(localStorage.getItem('savedQueries') || '[]');
  saved.push(query);
  localStorage.setItem('savedQueries', JSON.stringify(saved));
  
  showNotification('Consulta salva com sucesso!');
}

function loadSavedQueries(form) {
  const saved = JSON.parse(localStorage.getItem('savedQueries') || '[]');
  const savedList = form.querySelector('#savedList');
  
  if (saved.length === 0) {
    savedList.innerHTML = '<p class="empty-state">Nenhuma consulta salva</p>';
    return;
  }
  
  const html = saved.map((query, index) => `
    <div class="saved-item">
      <div class="saved-info">
        <h5 class="saved-name">${query.name}</h5>
        <p class="saved-date">${new Date(query.timestamp).toLocaleDateString('pt-BR')}</p>
        <div class="saved-tables">
          <span class="preset-label">Tabelas:</span>
          ${query.tables.map(table => `<span class="preset-table">${table}</span>`).join('')}
        </div>
      </div>
      <div class="saved-actions">
        <button type="button" class="btn-preset" data-index="${index}">Aplicar</button>
        <button type="button" class="btn-danger" data-index="${index}">Excluir</button>
      </div>
    </div>
  `).join('');
  
  savedList.innerHTML = html;
  
  // Aplicar consulta salva
  savedList.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      applySavedQuery(form, saved[index]);
    });
  });
  
  // Excluir consulta salva
  savedList.querySelectorAll('.btn-danger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      if (confirm('Tem certeza que deseja excluir esta consulta?')) {
        saved.splice(index, 1);
        localStorage.setItem('savedQueries', JSON.stringify(saved));
        loadSavedQueries(form);
        showNotification('Consulta excluída!');
      }
    });
  });
}

function applySavedQuery(form, query) {
  // Limpar seleções atuais
  selectedTables.clear();
  joinPaths = [];
  
  // Aplicar dados salvos
  query.tables.forEach(table => {
    selectedTables.add(table);
  });
  
  joinPaths = query.joins || [];
  
  // Atualizar interface
  updateSelectedTables(form);
  updateRelationships(form);
  updateColumns(form);
  
  // Aplicar seleção de colunas
  setTimeout(() => {
    const columnCheckboxes = form.querySelectorAll('input[name="columns"]');
    columnCheckboxes.forEach(checkbox => {
      checkbox.checked = query.columns.includes(checkbox.value);
    });
    updatePreview(form);
  }, 100);
  
  showNotification(`Consulta "${query.name}" aplicada!`);
}

function resetForm(form) {
  selectedTables.clear();
  joinPaths = [];
  updateSelectedTables(form);
  updateRelationships(form);
  updateColumns(form);
  updatePreview(form);
  form.querySelector('#advancedResults').innerHTML = '';
  form.querySelector('#resultCount').textContent = '';
}

// Atualiza informações de debug
function updateDebugInfo(form) {
  try {
    const debugTables = form.querySelector('#debugTables');
    const debugJoins = form.querySelector('#debugJoins');
    const debugGraph = form.querySelector('#debugGraph');

    if (debugTables) {
      debugTables.textContent = JSON.stringify(Array.from(selectedTables), null, 2);
    }

    if (debugJoins) {
      debugJoins.textContent = JSON.stringify(joinPaths, null, 2);
    }

    if (debugGraph) {
      const graphData = {};
      relationshipGraph.forEach((value, key) => {
        graphData[key] = Array.from(value);
      });
      debugGraph.textContent = JSON.stringify(graphData, null, 2);
    }
  } catch (error) {
    safeLog('error', 'Erro ao atualizar informações de debug', error);
  }
}

// Inicialização
async function initAdvancedRelationForm() {
  try {
    safeLog('info', 'Inicializando componente de busca relacional avançada');
    
    const root = document.getElementById('advanced-relation-root');
    if (!root) {
      safeLog('warn', 'Elemento advanced-relation-root não encontrado');
      return;
    }
    
    await loadSchema();
    
    root.innerHTML = '';
    root.appendChild(createAdvancedRelationForm());
    
    safeLog('info', 'Componente de busca relacional avançada inicializado com sucesso');
  } catch (error) {
    safeLog('error', 'Falha ao inicializar componente de busca relacional avançada', error);
    
    const root = document.getElementById('advanced-relation-root');
    if (root) {
      root.innerHTML = `
        <div class="error-container">
          <h3>❌ Erro ao Carregar Componente</h3>
          <p>Não foi possível inicializar a busca relacional avançada.</p>
          <details>
            <summary>Detalhes do erro</summary>
            <pre>${error.message}</pre>
          </details>
          <button onclick="initAdvancedRelationForm()" class="btn-secondary">
            🔄 Tentar Novamente
          </button>
        </div>
      `;
    }
  }
}

// Garantir que a função seja executada quando o DOM estiver carregado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdvancedRelationForm);
} else {
  initAdvancedRelationForm();
}

// Exportar função para uso global
window.initAdvancedRelationForm = initAdvancedRelationForm;
