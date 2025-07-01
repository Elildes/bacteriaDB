// static/update-form.js

let dbSchema = {};

async function loadSchema() {
  const res = await fetch('/static/db-schema.json');
  dbSchema = await res.json();
}

// Utilitário: Exibe resultado em tabela com overflow
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

// Cria input dinâmico para cada campo
function createFieldInput(field, prefix = '') {
  const label = document.createElement('label');
  label.textContent = field.name;
  label.setAttribute('for', `${prefix}-field-${field.name}`);

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
      input.placeholder = 'Novo valor...';
  }
  input.name = field.name;
  input.id = `${prefix}-field-${field.name}`;

  const div = document.createElement('div');
  div.className = 'form-group';
  div.appendChild(label);
  div.appendChild(input);
  return div;
}

// Cria o formulário de UPDATE
function createUpdateForm(tableName, schema) {
  // Dois conjuntos de campos: SET (novos valores) e WHERE (restrição)
  const form = document.createElement('form');
  form.id = 'update-form';
  form.autocomplete = 'off';

  // SET
  const setBox = document.createElement('fieldset');
  setBox.className = 'form-subgroup';
  setBox.innerHTML = `<legend>Campos a Atualizar (SET)</legend>`;
  schema.fields.forEach(field => setBox.appendChild(createFieldInput(field, 'set')));
  form.appendChild(setBox);

  // WHERE
  const whereBox = document.createElement('fieldset');
  whereBox.className = 'form-subgroup';
  whereBox.innerHTML = `<legend>Filtro (WHERE)</legend>`;
  schema.fields.forEach(field => whereBox.appendChild(createFieldInput(field, 'where')));
  form.appendChild(whereBox);

  // Preview SQL
  const sqlPreview = document.createElement('pre');
  sqlPreview.id = 'update-sql-preview';
  sqlPreview.className = 'sql-preview';

  // Resultado
  const resultDiv = document.createElement('div');
  resultDiv.id = 'update-result';

  // Botão submit
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Atualizar';

  form.appendChild(btn);
  form.appendChild(sqlPreview);
  form.appendChild(resultDiv);

  // Atualiza preview ao alterar qualquer campo
  form.addEventListener('input', () => {
    const { set, where } = getUpdateFormData(form, schema);
    const sql = buildUpdateSQL(tableName, schema, set, where);
    sqlPreview.textContent = sql;
  });

  // Envia formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { set, where } = getUpdateFormData(form, schema);
    const sql = buildUpdateSQL(tableName, schema, set, where);

    if (Object.keys(set).length === 0) {
      resultDiv.innerHTML = `<span class="error">❌ Preencha pelo menos um campo para atualizar.</span>`;
      return;
    }
    if (Object.keys(where).length === 0) {
      resultDiv.innerHTML = `<span class="error">❌ Recomendado preencher ao menos um campo no filtro (WHERE)!</span>`;
      // Pode permitir update global
    }

    const res = await fetch('/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql })
    });
    const data = await res.json();
    if (data.success) {
      resultDiv.innerHTML = `<span class="success">✅ ${data.rowCount || 0} registro(s) atualizado(s).</span>`;
      // Se o backend retornar data com linhas alteradas:
      if (Array.isArray(data.data) && data.data.length > 0) {
        resultDiv.innerHTML += renderTable(data.data);
      }
    } else {
      resultDiv.innerHTML = `<span class="error">❌ Erro: ${data.error}</span>`;
    }
  });

  // Inicializa preview
  sqlPreview.textContent = buildUpdateSQL(tableName, schema, {}, {});
  return form;
}

// Coleta dados SET e WHERE do form
function getUpdateFormData(form, schema) {
  const set = {}, where = {};
  schema.fields.forEach(field => {
    const setVal = form.elements[`set-field-${field.name}`]?.value;
    if (setVal !== '') set[field.name] = setVal;
    const whereVal = form.elements[`where-field-${field.name}`]?.value;
    if (whereVal !== '') where[field.name] = whereVal;
  });
  return { set, where };
}

// Monta SQL UPDATE dinâmico
function buildUpdateSQL(tableName, schema, setData, whereData) {
  const sets = [];
  Object.entries(setData).forEach(([name, val]) => {
    const field = schema.fields.find(f => f.name === name);
    if (!field) return;
    if (field.type === 'int' || field.type === 'float' || field.type === 'boolean') {
      sets.push(`${name} = ${val}`);
    } else if (field.type === 'date') {
      sets.push(`${name} = '${val}'`);
    } else {
      sets.push(`${name} = '${val.replace(/'/g, "''")}'`);
    }
  });

  const filters = [];
  Object.entries(whereData).forEach(([name, val]) => {
    const field = schema.fields.find(f => f.name === name);
    if (!field) return;
    if (field.type === 'int' || field.type === 'float' || field.type === 'boolean') {
      filters.push(`${name} = ${val}`);
    } else if (field.type === 'date') {
      filters.push(`${name} = '${val}'`);
    } else {
      filters.push(`${name} LIKE '%${val.replace(/'/g, "''")}%'`);
    }
  });

  const setClause = sets.length > 0 ? `SET ${sets.join(', ')}` : 'SET ...';
  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
  return `UPDATE ${tableName} ${setClause} ${whereClause};`;
}

// Seleção de tabela e init
async function initUpdateForm() {
  await loadSchema();
  const root = document.getElementById('crud-update-root');
  if (!root) return;

  // Select de tabelas
  const select = document.createElement('select');
  select.id = 'tabela-update-select';
  select.innerHTML = '<option value="">Selecione uma tabela</option>';
  Object.keys(dbSchema).forEach(tbl => {
    select.innerHTML += `<option value="${tbl}">${tbl}</option>`;
  });
  root.appendChild(select);

  const formContainer = document.createElement('div');
  formContainer.id = 'update-form-container';
  root.appendChild(formContainer);

  select.addEventListener('change', () => {
    formContainer.innerHTML = '';
    if (select.value && dbSchema[select.value]) {
      formContainer.appendChild(createUpdateForm(select.value, dbSchema[select.value]));
    }
  });
}

window.addEventListener('DOMContentLoaded', initUpdateForm);
