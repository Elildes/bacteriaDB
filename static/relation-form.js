// static/relation-form.js

let dbSchema = {};

async function loadSchema() {
  const res = await fetch('/static/db-schema.json');
  dbSchema = await res.json();
}

// Busca relações de FKs OUT (da tabela principal para outras) e IN (de outras para ela)
function getRelationsForTable(tableName) {
  if (!dbSchema[tableName]) return { fkOut: [], fkIn: [] };

  // OUT: FKs desta tabela apontando para outras
  const fkOut = dbSchema[tableName].fields
    .filter(f => f.fk)
    .map(f => ({
      fromTable: tableName,
      fromField: f.name,
      toTable: f.fk.tabela,
      toField: f.fk.campo,
      direction: "out"
    }));

  // IN: FKs de outras tabelas apontando para esta
  const fkIn = [];
  for (const [tbl, schema] of Object.entries(dbSchema)) {
    schema.fields.forEach(f => {
      if (f.fk && f.fk.tabela === tableName) {
        fkIn.push({
          fromTable: tbl,
          fromField: f.name,
          toTable: tableName,
          toField: f.fk.campo,
          direction: "in"
        });
      }
    });
  }
  return { fkOut, fkIn };
}

// Cria input dinâmico para cada campo
function createRelationForm() {
  const form = document.createElement('form');
  form.id = 'relation-form';
  form.className = 'relation-form';
  form.autocomplete = 'off';

  // Tabela principal
  const table1Group = document.createElement('div');
  table1Group.className = 'form-group';
  table1Group.innerHTML = `
    <label for="table1">Tabela principal</label>
    <select id="table1" name="table1" required>
      <option value="">Selecione</option>
      ${Object.keys(dbSchema).map(t => `<option value="${t}">${t}</option>`).join('')}
    </select>
  `;
  form.appendChild(table1Group);

  // Relacionamentos
  const relationGroup = document.createElement('div');
  relationGroup.className = 'form-group';
  relationGroup.innerHTML = `
    <label for="relationType">Relacionamento</label>
    <select id="relationType" name="relationType" disabled>
      <option value="">Selecione a tabela principal</option>
    </select>
  `;
  form.appendChild(relationGroup);

  // Colunas a mostrar (checkboxes)
  const columnsGroup = document.createElement('div');
  columnsGroup.className = 'form-group';
  columnsGroup.id = 'columns-group';
  form.appendChild(columnsGroup);

  // Preview SQL
  const sqlPreview = document.createElement('pre');
  sqlPreview.id = 'relation-sql-preview';
  sqlPreview.className = 'sql-preview';
  form.appendChild(sqlPreview);

  // Resultado
  const resultDiv = document.createElement('div');
  resultDiv.id = 'relation-result';
  form.appendChild(resultDiv);

  // Botão submit
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Consultar Relacionamento';
  form.appendChild(btn);

  // EVENTOS

  // Seleção da tabela principal
  form.table1.addEventListener('change', () => {
    columnsGroup.innerHTML = '';
    sqlPreview.textContent = '';
    resultDiv.innerHTML = '';
    form.relationType.innerHTML = '';
    form.relationType.disabled = true;

    const { fkOut, fkIn } = getRelationsForTable(form.table1.value);

    let options = [];
    if (fkOut.length) {
      options.push(
        `<optgroup label="FKs desta tabela (OUT)">` +
        fkOut.map(r => `<option value="out|${r.fromTable}|${r.fromField}|${r.toTable}|${r.toField}">
          ${r.toTable} (JOIN: ${r.fromTable}.${r.fromField} → ${r.toTable}.${r.toField})
        </option>`).join('') +
        `</optgroup>`
      );
    }
    if (fkIn.length) {
      options.push(
        `<optgroup label="FKs de outras tabelas (IN)">` +
        fkIn.map(r => `<option value="in|${r.fromTable}|${r.fromField}|${r.toTable}|${r.toField}">
          ${r.fromTable} (JOIN: ${r.fromTable}.${r.fromField} → ${r.toTable}.${r.toField})
        </option>`).join('') +
        `</optgroup>`
      );
    }
    if (!options.length) {
      options.push('<option value="">Sem relacionamentos encontrados</option>');
    } else {
      options.unshift('<option value="">Selecione o relacionamento...</option>');
      form.relationType.disabled = false;
    }
    form.relationType.innerHTML = options.join('');

    // Colunas da tabela principal
    if (dbSchema[form.table1.value]) {
      columnsGroup.innerHTML = `
        <label>Colunas a mostrar (${form.table1.value})</label>
        <div class="relation-columns-group">
          ${dbSchema[form.table1.value].fields.map(f =>
            `<label><input type="checkbox" name="columns1" value="${f.name}" checked> ${f.name}</label>`
          ).join('')}
        </div>
      `;
    }
    // Remove possíveis colunas secundárias antigas
    const oldCols = columnsGroup.querySelector('.columns2-checkboxes');
    if (oldCols) oldCols.remove();
  });

  // Seleção do relacionamento
  form.relationType.addEventListener('change', () => {
    // Remove colunas secundárias antigas
    const oldCols = columnsGroup.querySelector('.columns2-checkboxes');
    if (oldCols) oldCols.remove();

    sqlPreview.textContent = '';
    resultDiv.innerHTML = '';

    const val = form.relationType.value;
    if (!val) return;
    const [dir, fromTable, fromField, toTable, toField] = val.split('|');
    const secondaryTable = dir === "out" ? toTable : fromTable;

    // Colunas da tabela secundária
    if (dbSchema[secondaryTable]) {
      const div = document.createElement('div');
      div.className = 'columns2-checkboxes';
      div.innerHTML =
        `<label>Colunas a mostrar (${secondaryTable})</label>
        <div class="relation-columns-group">
          ${dbSchema[secondaryTable].fields.map(f =>
            `<label><input type="checkbox" name="columns2" value="${f.name}" checked> ${f.name}</label>`
          ).join('')}
        </div>`;
      columnsGroup.appendChild(div);
    }
  });

  // Preview SQL dinâmico
  form.addEventListener('input', () => {
    const sql = buildRelationSQL(form);
    sqlPreview.textContent = sql;
  });

  // Submissão
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sql = buildRelationSQL(form);
    sqlPreview.textContent = sql;
    resultDiv.innerHTML = '<span class="info">Consultando...</span>';

    const res = await fetch('/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql })
    });
    const data = await res.json();
    if (data.success && data.data && data.data.length) {
      resultDiv.innerHTML =
        `<div class="table-container">${renderTable(data.data)}</div>`;
    } else if (data.success) {
      resultDiv.innerHTML = '<span class="no-results">Nenhum resultado encontrado.</span>';
    } else {
      resultDiv.innerHTML = `<span class="error">❌ Erro: ${data.error}</span>`;
    }
  });

  return form;
}

// Gera o SQL JOIN correto
function buildRelationSQL(form) {
  const table1 = form.table1.value;
  const relVal = form.relationType.value;
  if (!table1 || !relVal) return '-- Selecione a tabela e o relacionamento.';

  const [dir, fromTable, fromField, toTable, toField] = relVal.split('|');

  // Colunas
  const columns1 = [...form.querySelectorAll('input[name="columns1"]:checked')].map(c => `${table1}.${c.value}`);
  // coluna da secundária sempre da tabela correta
  const columns2 = [...form.querySelectorAll('input[name="columns2"]:checked')].map(c =>
    `${(dir === "out" ? toTable : fromTable)}.${c.value}`
  );
  const allColumns = [...columns1, ...columns2];

  if (!fromField || !toField) return '-- Relacionamento inválido.';

  let joinSql = '';
  if (dir === 'out') {
    joinSql = `FROM ${table1} JOIN ${toTable} ON ${table1}.${fromField} = ${toTable}.${toField}`;
  } else { // 'in'
    joinSql = `FROM ${table1} JOIN ${fromTable} ON ${fromTable}.${fromField} = ${table1}.${toField}`;
  }
  return `
SELECT ${allColumns.join(', ')}
${joinSql};
`.trim();
}

// Renderiza resultado em tabela HTML
function renderTable(data) {
  let html = '<table class="results-table"><thead><tr>';
  Object.keys(data[0]).forEach(k => html += `<th>${k}</th>`);
  html += '</tr></thead><tbody>';
  data.forEach(row => {
    html += '<tr>';
    Object.values(row).forEach(val => {
      html += `<td>${val !== null ? val : '<span class="null">NULL</span>'}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

// Inicializa tudo
async function initRelationForm() {
  await loadSchema();
  const root = document.getElementById('crud-relation-root');
  if (!root) return;
  root.innerHTML = '';
  root.appendChild(createRelationForm());
}
window.addEventListener('DOMContentLoaded', initRelationForm);
