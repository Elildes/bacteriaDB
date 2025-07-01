// static/api.js

export async function executeQuery(query) {
  const response = await fetch('/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  return response.json();
}

export async function testConnection() {
  const response = await fetch('/query/test');
  return response.json();
}

export async function getDatabaseInfo() {
  const response = await fetch('/query/info');
  return response.json();
}
