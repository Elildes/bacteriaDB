// static/delete-form.js
let dbSchema = {};

async function loadSchema() {
  const res = await fetch('/static/db-schema.json');
  dbSchema = await res.json();
}

// Cria select de tabelas dinâmico
function createTableSelect() {
  const select = document.createElement('select');
  select.id = 'tabela-delete-select';
  select.name = 'tabela';
  select.required = true;
  select.innerHTML = '<option value="">Selecione a tabela</option>' +
    Object.keys(dbSchema).map(tab =>
      `<option value="${tab}">${tab}</option>`
    ).join('');
  return select;
}

// Cria input para cada PK
function createPKInput(field) {
  const label = document.createElement('label');
  label.textContent = field.name + (field.required ? ' *' : '');
  label.setAttribute('for', `delete_${field.name}`);

  const input = document.createElement('input');
  input.id = `delete_${field.name}`;
  input.name = field.name;
  input.placeholder = field.type;
  input.type = 'text';
  if (field.required) input.required = true;

  const div = document.createElement('div');
  div.className = 'form-group';
  div.appendChild(label);
  div.appendChild(input);
  return div;
}

// Cria o formulário de DELETE
function createDeleteForm(tableName, schema) {
  const pkFields = schema.fields.filter(f => f.pk);

  const form = document.createElement('form');
  form.id = 'delete-form';
  form.autocomplete = 'off';

  pkFields.forEach(field => form.appendChild(createPKInput(field)));

  // Botão submit
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Deletar';

  // Preview SQL
  const sqlPreview = document.createElement('pre');
  sqlPreview.id = 'delete-sql-preview';
  sqlPreview.className = 'sql-preview';

  // Feedback/result
  const resultDiv = document.createElement('div');
  resultDiv.id = 'delete-feedback';

  form.appendChild(btn);
  form.appendChild(sqlPreview);
  form.appendChild(resultDiv);

  // Atualiza preview ao alterar qualquer PK
  form.addEventListener('input', () => {
    const data = Object.fromEntries(new FormData(form));
    sqlPreview.textContent = buildDeleteSQL(tableName, data, pkFields);
  });

  // Envia form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const sql = buildDeleteSQL(tableName, data, pkFields);
    sqlPreview.textContent = sql;

    resultDiv.textContent = 'Enviando...';
    resultDiv.className = '';

    try {
      const resp = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql })
      });
      const res = await resp.json();
      if (res.success) {
        resultDiv.textContent = "✅ Deletado com sucesso!";
        resultDiv.className = 'success';
        form.reset();
        sqlPreview.textContent = buildDeleteSQL(tableName, {}, pkFields); // Limpa preview
      } else {
        resultDiv.textContent = "❌ Erro: " + (res.error || "Falha na deleção");
        resultDiv.className = 'error';
      }
    } catch (err) {
      resultDiv.textContent = "❌ Erro de rede: " + err.message;
      resultDiv.className = 'error';
    }
  });

  // Inicializa preview vazio
  sqlPreview.textContent = buildDeleteSQL(tableName, {}, pkFields);
  return form;
}

// Monta o SQL DELETE
function buildDeleteSQL(tableName, data, pkFields) {
  if (!tableName || pkFields.some(f => !data[f.name])) return '';
  const where = pkFields.map(f => {
    const value = data[f.name];
    return `${f.name} = ${isNaN(Number(value)) ? `'${value}'` : value}`;
  }).join(' AND ');
  return `DELETE FROM ${tableName} WHERE ${where};`;
}

// Monta tudo e inicializa
async function initDeleteForm() {
  await loadSchema();
  const root = document.getElementById('crud-delete-root');
  if (!root) return;

  // Select de tabelas
  const select = createTableSelect();
  root.appendChild(select);

  const formContainer = document.createElement('div');
  formContainer.id = 'delete-form-container';
  root.appendChild(formContainer);

  select.addEventListener('change', () => {
    formContainer.innerHTML = '';
    if (select.value && dbSchema[select.value]) {
      formContainer.appendChild(createDeleteForm(select.value, dbSchema[select.value]));
    }
  });
}

window.addEventListener('DOMContentLoaded', initDeleteForm);
