// static/select-form.js

let dbSchema = {};

// Carrega o esquema do banco de dados
async function loadSchema() {
  const res = await fetch('/static/db-schema.json');
  dbSchema = await res.json();
}

// Cria input dinâmico para cada campo
function createFieldInput(field) {
  const label = document.createElement('label');
  label.textContent = field.name;
  label.setAttribute('for', `select-field-${field.name}`);

  let input;
  switch (field.type) {
    case 'int':
    case 'float':
      input = document.createElement('input');
      input.type = 'number';
      if (field.type === 'float') input.step = 'any';
      break;
    case 'date':
      input = document.createElement('input');
      input.type = 'date';
      break;
    case 'boolean':
      input = document.createElement('select');
      input.innerHTML = `<option value="">Qualquer</option>
                         <option value="1">Sim</option>
                         <option value="0">Não</option>`;
      break;
    default:
      input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Contém...';
  }
  input.name = field.name;
  input.id = `select-field-${field.name}`;

  const div = document.createElement('div');
  div.className = 'form-group';
  div.appendChild(label);
  div.appendChild(input);
  return div;
}

// Cria formulário de consulta SELECT dinâmico
function createSelectForm(tableName, schema) {
  const form = document.createElement('form');
  form.id = 'select-form';
  form.autocomplete = 'off';

  schema.fields.forEach(field => {
    form.appendChild(createFieldInput(field));
  });

  // Preview SQL
  const sqlPreview = document.createElement('pre');
  sqlPreview.id = 'select-sql-preview';
  sqlPreview.className = 'sql-preview';

  // Feedback/result
  const resultDiv = document.createElement('div');
  resultDiv.id = 'select-result';

  // Botão submit
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Consultar';

  form.appendChild(btn);
  form.appendChild(sqlPreview);
  form.appendChild(resultDiv);

  // Atualiza preview ao alterar qualquer campo
  form.addEventListener('input', () => {
    const formData = getFormData(form, schema);
    const sql = buildSelectSQL(tableName, schema, formData);
    sqlPreview.textContent = sql;
  });

  // Envia formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = getFormData(form, schema);
    const sql = buildSelectSQL(tableName, schema, formData);

    const res = await fetch('/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql })
    });
    const data = await res.json();
    if (data.success) {
      resultDiv.innerHTML = `<span class="success">✅ ${data.rowCount} registro(s) encontrados.</span>`;
      // Exibe resultado em tabela, se houver dados
      if (Array.isArray(data.data) && data.data.length > 0) {
        resultDiv.innerHTML += renderTable(data.data);
      }
    } else {
      resultDiv.innerHTML = `<span class="error">❌ Erro: ${data.error}</span>`;
    }
  });

  // Inicializa preview
  sqlPreview.textContent = buildSelectSQL(tableName, schema, {});
  return form;
}

// Coleta valores preenchidos
function getFormData(form, schema) {
  const data = {};
  schema.fields.forEach(field => {
    let value = form.elements[field.name]?.value;
    if (value === '') value = null;
    data[field.name] = value;
  });
  return data;
}

// Monta SQL SELECT com WHERE dinâmico
function buildSelectSQL(tableName, schema, data) {
  const filters = [];
  schema.fields.forEach(field => {
    const val = data && data[field.name];
    if (val !== null && val !== '' && typeof val !== 'undefined') {
      if (field.type === 'int' || field.type === 'float') {
        filters.push(`${field.name} = ${val}`);
      } else if (field.type === 'boolean') {
        filters.push(`${field.name} = ${val}`);
      } else if (field.type === 'date') {
        filters.push(`${field.name} = '${val}'`);
      } else {
        // LIKE para strings
        filters.push(`${field.name} LIKE '%${val.replace(/'/g, "''")}%'`);
      }
    }
  });
  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
  return `SELECT * FROM ${tableName} ${whereClause};`;
}

// Exibe resultado em tabela HTML simples
function renderTable(data) {
  let html = '<div class="table-container"><table class="results-table"><thead><tr>';
  Object.keys(data[0]).forEach(k => html += `<th>${k}</th>`);
  html += '</tr></thead><tbody>';
  data.forEach(row => {
    html += '<tr>';
    Object.values(row).forEach(val => {
      html += `<td>${val !== null ? val : '<span class="null">NULL</span>'}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}


// Seleção de tabelas e init
async function initSelectForm() {
  await loadSchema();
  const root = document.getElementById('crud-select-root');
  if (!root) return;

  // Select de tabelas
  const select = document.createElement('select');
  select.id = 'tabela-select-select';
  select.innerHTML = '<option value="">Selecione uma tabela</option>';
  Object.keys(dbSchema).forEach(tbl => {
    select.innerHTML += `<option value="${tbl}">${tbl}</option>`;
  });
  root.appendChild(select);

  const formContainer = document.createElement('div');
  formContainer.id = 'select-form-container';
  root.appendChild(formContainer);

  select.addEventListener('change', () => {
    formContainer.innerHTML = '';
    if (select.value && dbSchema[select.value]) {
      formContainer.appendChild(createSelectForm(select.value, dbSchema[select.value]));
    }
  });
}

window.addEventListener('DOMContentLoaded', initSelectForm);
