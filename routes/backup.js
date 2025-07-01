// routes/backup.js
const express = require('express');
const { getDatabaseInfo } = require('../db');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const multer = require('multer');
const router = express.Router();

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'app.log');
const upload = multer({ dest: path.join(BACKUP_DIR, 'tmp/') });

// Helper para log simples em arquivo
function logBackup(msg) {
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
}

// GET /backup - Realiza dump e envia arquivo
router.get('/', async (req, res) => {
  const dbInfo = getDatabaseInfo();
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const filename = `backup-${dbInfo.type}-${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  await fs.ensureDir(BACKUP_DIR);

  let dumpCmd;
  if (dbInfo.type === 'mysql') {
    let passwordPart = '';
    if (typeof dbInfo.password === 'string' && dbInfo.password.length > 0) {
      passwordPart = `-p${dbInfo.password}`;
    }
    dumpCmd = `mysqldump -u${dbInfo.user} ${passwordPart} ${dbInfo.database} > "${filepath}"`;
    dumpCmd = dumpCmd.replace(/\s{2,}/g, ' ');
    console.log('[DEBUG mysqldump cmd]:', dumpCmd);
  } else if (dbInfo.type === 'postgres') {
    dumpCmd = `PGPASSWORD="${dbInfo.password}" pg_dump -U ${dbInfo.user} -h ${dbInfo.host} -F p ${dbInfo.database} > "${filepath}"`;
    console.log('[DEBUG pg_dump cmd]:', dumpCmd);
  } else {
    logBackup(`Backup FAIL: Tipo de banco não suportado (${dbInfo.type})`);
    return res.status(400).send('Tipo de banco não suportado.');
  }

  exec(dumpCmd, (error, stdout, stderr) => {
    if (error) {
      logBackup(`Backup FAIL: ${filename} | ${error.message} | stderr: ${stderr}`);
      return res.status(500).send('Erro ao gerar backup: ' + error.message);
    }
    logBackup(`Backup OK: ${filename}`);
    res.download(filepath, filename, (err) => {
      if (err) logBackup(`Backup download error: ${err.message}`);
    });
  });
});

// POST /backup/restore - Restaura backup do arquivo enviado
router.post('/restore', upload.single('file'), async (req, res) => {
  const dbInfo = getDatabaseInfo();
  if (!req.file) return res.status(400).json({ success: false, message: 'Arquivo não enviado.' });
  const filePath = req.file.path;

  // Mensagem imediata de upload realizado
  logBackup(`Backup upload: ${req.file.originalname}`);

  let restoreCmd;
  if (dbInfo.type === 'mysql') {
    let passwordPart = '';
    if (typeof dbInfo.password === 'string' && dbInfo.password.length > 0) {
      passwordPart = `-p${dbInfo.password}`;
    }
    restoreCmd = `mysql -u${dbInfo.user} ${passwordPart} ${dbInfo.database} < "${filePath}"`;
    restoreCmd = restoreCmd.replace(/\s{2,}/g, ' ');
    console.log('[DEBUG mysql restore cmd]:', restoreCmd);
  } else if (dbInfo.type === 'postgres') {
    restoreCmd = `PGPASSWORD="${dbInfo.password}" psql -U ${dbInfo.user} -h ${dbInfo.host} -d ${dbInfo.database} -f "${filePath}"`;
    console.log('[DEBUG psql restore cmd]:', restoreCmd);
  } else {
    logBackup(`Restore FAIL: Tipo de banco não suportado (${dbInfo.type})`);
    return res.status(400).json({ success: false, message: 'Tipo de banco não suportado.' });
  }

  exec(restoreCmd, (error, stdout, stderr) => {
    fs.remove(filePath); // Sempre remover arquivo temporário
    if (error) {
      logBackup(`Restore FAIL: ${req.file.originalname} | ${error.message} | stderr: ${stderr}`);
      return res.status(500).json({
        success: false,
        upload: true,
        message: 'Arquivo enviado, mas erro ao restaurar backup.',
        error: error.message
      });
    }
    logBackup(`Restore OK: ${req.file.originalname}`);
    res.json({
      success: true,
      upload: true,
      message: 'Upload realizado e backup restaurado com sucesso!'
    });
  });
});

module.exports = router;
