// static/insert-form.js

let dbSchema = {};

async function loadSchema() {
  const res = await fetch('/static/db-schema.json');
  dbSchema = await res.json();
}

// Utilitário: renderiza tabela 
function renderTable(data) {
  if (!Array.isArray(data) || data.length === 0) return '';
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

// Cria input dinâmico para cada campo do formulário
function createFieldInput(field) {
  const label = document.createElement('label');
  label.textContent = field.name + (field.required ? '*' : '');
  label.setAttribute('for', `field-${field.name}`);

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
      input.innerHTML = `<option value="">Selecione</option>
                         <option value="1">Sim</option>
                         <option value="0">Não</option>`;
      break;
    default:
      input = document.createElement('input');
      input.type = 'text';
  }
  input.name = field.name;
  input.id = `field-${field.name}`;
  if (field.required) input.required = true;

  const div = document.createElement('div');
  div.className = 'form-group';
  div.appendChild(label);
  div.appendChild(input);
  return div;
}

// Cria o formulário de inserção dinâmico
function createInsertForm(tableName, schema) {
  const form = document.createElement('form');
  form.id = 'insert-form';
  form.autocomplete = 'off';

  schema.fields.forEach(field => {
    form.appendChild(createFieldInput(field));
  });

  // Preview SQL
  const sqlPreview = document.createElement('pre');
  sqlPreview.id = 'sql-preview';
  sqlPreview.className = 'sql-preview';

  // Feedback/result
  const resultDiv = document.createElement('div');
  resultDiv.id = 'insert-result';

  // Botão submit
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Inserir Registro';

  form.appendChild(btn);
  form.appendChild(sqlPreview);
  form.appendChild(resultDiv);

  // Atualiza preview ao alterar qualquer campo
  form.addEventListener('input', () => {
    const formData = getFormData(form, schema);
    const sql = buildInsertSQL(tableName, schema, formData);
    sqlPreview.textContent = sql;
  });

  // Envia formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = getFormData(form, schema);
    const sql = buildInsertSQL(tableName, schema, formData);

    const res = await fetch('/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql })
    });
    const data = await res.json();
    if (data.success) {
      resultDiv.innerHTML = '<span class="success">✅ Registro inserido com sucesso!</span>';
      form.reset();
      sqlPreview.textContent = buildInsertSQL(tableName, schema, {}); // Limpa preview
    } else {
      resultDiv.innerHTML = `<span class="error">❌ Erro: ${data.error}</span>`;
    }
  });

  // Inicializa preview vazio
  sqlPreview.textContent = buildInsertSQL(tableName, schema, {});
  return form;
}

// Coleta os valores do formulário, convertendo tipos
function getFormData(form, schema) {
  const data = {};
  schema.fields.forEach(field => {
    let value = form.elements[field.name]?.value;
    if (value === '') value = null;
    if (field.type === 'int' && value !== null) value = parseInt(value, 10);
    if (field.type === 'float' && value !== null) value = parseFloat(value);
    if (field.type === 'boolean' && value !== null) value = value === '1' ? 1 : 0;
    data[field.name] = value;
  });
  return data;
}

// Monta o SQL INSERT a partir dos dados e schema
function buildInsertSQL(tableName, schema, data) {
  const fields = [];
  const values = [];
  schema.fields.forEach(field => {
    if (data && data[field.name] !== undefined && data[field.name] !== null && data[field.name] !== '') {
      fields.push(field.name);
      if (field.type === 'int' || field.type === 'float' || field.type === 'boolean') {
        values.push(data[field.name]);
      } else if (field.type === 'date') {
        values.push(data[field.name] ? `'${data[field.name]}'` : 'NULL');
      } else {
        // string e outros
        values.push(`'${data[field.name].replace(/'/g, "''")}'`);
      }
    }
  });
  if (fields.length === 0) {
    // Gera preview vazio
    return `INSERT INTO ${tableName} (...) VALUES (...);`;
  }
  return `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${values.join(', ')});`;
}

// Monta a seleção de tabelas e inicializa o formulário
async function initInsertForm() {
  await loadSchema();
  const root = document.getElementById('crud-root');
  if (!root) return;

  // Select de tabelas
  const select = document.createElement('select');
  select.id = 'tabela-select';
  select.innerHTML = '<option value="">Selecione uma tabela</option>';
  Object.keys(dbSchema).forEach(tbl => {
    select.innerHTML += `<option value="${tbl}">${tbl}</option>`;
  });
  root.appendChild(select);

  const formContainer = document.createElement('div');
  formContainer.id = 'insert-form-container';
  root.appendChild(formContainer);

  select.addEventListener('change', () => {
    formContainer.innerHTML = '';
    if (select.value && dbSchema[select.value]) {
      formContainer.appendChild(createInsertForm(select.value, dbSchema[select.value]));
    }
  });
}

window.addEventListener('DOMContentLoaded', initInsertForm);
