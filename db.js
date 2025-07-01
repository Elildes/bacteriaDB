// Módulo de conexão com banco de dados - Suporte MySQL e PostgreSQL
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

// Variáveis de configuração do banco
const DB_TYPE = process.env.DB_TYPE || 'mysql';
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

// Pools de conexão para cada tipo de banco
let mysqlPool = null;
let postgresPool = null;

// Inicializar pool MySQL
function initMySQLPool() {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000
    });
    console.log('🔧 Pool de conexões MySQL inicializado');
  }
  return mysqlPool;
}

// Inicializar pool PostgreSQL
function initPostgreSQLPool() {
  if (!postgresPool) {
    postgresPool = new Pool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port,
      max: 10, // máximo de 10 conexões no pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 60000,
    });
    console.log('🔧 Pool de conexões PostgreSQL inicializado');
  }
  return postgresPool;
}

// Obter o pool correto baseado no tipo de banco configurado
function getPool() {
  if (DB_TYPE === 'postgres') {
    return initPostgreSQLPool();
  } else {
    return initMySQLPool();
  }
}

// Testar conexão com o banco de dados
async function testConnection() {
  try {
    if (DB_TYPE === 'postgres') {
      // Teste de conexão PostgreSQL
      const pool = getPool();
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ Conectado ao PostgreSQL com sucesso');
    } else {
      // Teste de conexão MySQL
      const pool = getPool();
      const connection = await pool.getConnection();
      await connection.execute('SELECT 1');
      connection.release();
      console.log('✅ Conectado ao MySQL com sucesso');
    }
    return true;
  } catch (error) {
    console.error(`❌ Falha na conexão com ${DB_TYPE.toUpperCase()}:`, error.message);
    return false;
  }
}

// Executar consulta SQL - Compatível com MySQL e PostgreSQL
async function executeQuery(query) {
  try {
    const pool = getPool();
    
    if (DB_TYPE === 'postgres') {
      // Execução para PostgreSQL
      const client = await pool.connect();
      try {
        const result = await client.query(query);
        client.release();
        
        return {
          success: true,
          data: result.rows,
          rowCount: result.rowCount || result.rows.length,
          fields: result.fields ? result.fields.map(field => ({
            name: field.name,
            type: field.dataTypeID
          })) : []
        };
      } catch (queryError) {
        client.release();
        throw queryError;
      }
    } else {
      // Execução para MySQL
      const [rows, fields] = await pool.execute(query);
      return {
        success: true,
        data: rows,
        rowCount: Array.isArray(rows) ? rows.length : 0,
        fields: fields ? fields.map(field => ({
          name: field.name,
          type: field.type
        })) : []
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

// Obter informações sobre o tipo de banco atual
function getDatabaseInfo() {
  return {
    type: process.env.DB_TYPE || 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || '3306',
    database: process.env.DB_NAME || 'bacteriadb',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''  
  };
}

// Fechar todas as conexões
async function closeConnections() {
  try {
    if (mysqlPool) {
      await mysqlPool.end();
      console.log('🔒 Pool MySQL fechado');
    }
    if (postgresPool) {
      await postgresPool.end();
      console.log('🔒 Pool PostgreSQL fechado');
    }
  } catch (error) {
    console.error('Erro ao fechar conexões:', error.message);
  }
}

module.exports = {
  testConnection,
  executeQuery,
  getDatabaseInfo,
  closeConnections
};
