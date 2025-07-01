// static/backup-ui.js

// Botão de backup e form de restauração
document.addEventListener('DOMContentLoaded', () => {
  const backupBtn = document.getElementById('backupBtn');
  const restoreForm = document.getElementById('restoreForm');
  const restoreFile = document.getElementById('restoreFile');
  const backupMsg = document.getElementById('backupMsg');

  if (backupBtn) {
    backupBtn.onclick = async () => {
      backupMsg.textContent = 'Gerando backup...';
      try {
        const res = await fetch('/backup');
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        // Extrai nome sugerido
        const disp = res.headers.get('Content-Disposition') || '';
        let filename = disp.match(/filename="?([^"]+)"?/)?.[1] || 'backup.sql';

        // Baixar arquivo
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        backupMsg.textContent = 'Backup realizado com sucesso!';
      } catch (err) {
        backupMsg.textContent = 'Erro ao gerar backup: ' + err.message;
      }
    };
  }

  if (restoreForm && restoreFile) {
    restoreForm.onsubmit = async (e) => {
      e.preventDefault();
      if (!restoreFile.files[0]) {
        backupMsg.textContent = 'Selecione um arquivo de backup para restaurar.';
        return;
      }
      backupMsg.textContent = 'Restaurando backup...';
      try {
        const formData = new FormData();
        formData.append('file', restoreFile.files[0]);
        const res = await fetch('/backup/restore', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error(await res.text());
        backupMsg.textContent = 'Backup restaurado com sucesso!';
        restoreFile.value = '';
      } catch (err) {
        backupMsg.textContent = 'Erro ao restaurar backup: ' + err.message;
      }
    };
  }
});
