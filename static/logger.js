// static/logger.js
// Sistema de log integrado para o componente de busca relacional

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.logLevel = 'info'; // 'debug', 'info', 'warn', 'error'
  }

  // Adiciona uma entrada de log
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      id: Date.now() + Math.random()
    };

    this.logs.unshift(logEntry);
    
    // Limitar número de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log no console para debug
    if (this.shouldLog(level)) {
      const consoleMethod = this.getConsoleMethod(level);
      consoleMethod(`[${level.toUpperCase()}] ${message}`, data || '');
    }

    // Enviar para servidor se for erro crítico
    if (level === 'error') {
      this.sendToServer(logEntry);
    }

    // Mostrar notificação na UI se necessário
    if (level === 'error' || level === 'warn') {
      this.showNotification(logEntry);
    }
  }

  // Métodos de conveniência
  debug(message, data) { this.log('debug', message, data); }
  info(message, data) { this.log('info', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  error(message, data) { this.log('error', message, data); }

  // Verifica se deve logar baseado no nível
  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  // Obtém o método do console apropriado
  getConsoleMethod(level) {
    switch (level) {
      case 'debug': return console.debug;
      case 'info': return console.info;
      case 'warn': return console.warn;
      case 'error': return console.error;
      default: return console.log;
    }
  }

  // Envia logs críticos para o servidor
  async sendToServer(logEntry) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Falha ao enviar log para servidor:', error);
    }
  }

  // Mostra notificação na interface
  showNotification(logEntry) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${logEntry.level}`;
    
    notification.innerHTML = `
      <div class="notification-header">
        <span class="notification-icon">${this.getIcon(logEntry.level)}</span>
        <span class="notification-title">${this.getTitle(logEntry.level)}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="notification-message">${logEntry.message}</div>
      ${logEntry.data ? `<div class="notification-data">${JSON.stringify(logEntry.data, null, 2)}</div>` : ''}
    `;

    document.body.appendChild(notification);

    // Auto-remover após 5 segundos para warnings, 10 para erros
    const timeout = logEntry.level === 'error' ? 10000 : 5000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, timeout);
  }

  // Obtém ícone baseado no nível
  getIcon(level) {
    switch (level) {
      case 'debug': return '🔍';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  }

  // Obtém título baseado no nível
  getTitle(level) {
    switch (level) {
      case 'debug': return 'Debug';
      case 'info': return 'Informação';
      case 'warn': return 'Aviso';
      case 'error': return 'Erro';
      default: return 'Log';
    }
  }

  // Obtém logs filtrados
  getLogs(level = null, limit = 50) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(0, limit);
  }

  // Limpa logs
  clear() {
    this.logs = [];
    this.info('Logs limpos');
  }

  // Exporta logs como JSON
  export() {
    const data = {
      timestamp: new Date().toISOString(),
      logs: this.logs,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.info('Logs exportados');
  }
}

// Classe para tratamento de erros específicos
class ErrorHandler {
  constructor(logger) {
    this.logger = logger;
    this.setupGlobalHandlers();
  }

  // Configura handlers globais
 /* setupGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.logger.error('Erro JavaScript não tratado', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      }); 
    });*/

    window.addEventListener('unhandledrejection', (event) => {
      this.logger.error('Promise rejeitada não tratada', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  // Trata erros de API
  handleApiError(error, context = '') {
    const errorData = {
      context,
      status: error.status || 'unknown',
      message: error.message || 'Erro desconhecido',
      response: error.response || null
    };

    this.logger.error(`Erro de API: ${context}`, errorData);
    
    // Retorna mensagem amigável para o usuário
    return this.getFriendlyMessage(error);
  }

  // Trata erros de validação
  handleValidationError(field, value, rule) {
    const errorData = { field, value, rule };
    this.logger.warn(`Erro de validação: ${field}`, errorData);
    
    return `Valor inválido para ${field}: ${this.getValidationMessage(rule)}`;
  }

  // Trata erros de SQL
  handleSqlError(error, sql) {
    const errorData = {
      sql,
      error: error.message || error,
      code: error.code || 'unknown'
    };

    this.logger.error('Erro SQL', errorData);
    
    return this.getSqlErrorMessage(error);
  }

  // Mensagens amigáveis para erros de API
  getFriendlyMessage(error) {
    if (error.status === 404) {
      return 'Recurso não encontrado';
    } else if (error.status === 500) {
      return 'Erro interno do servidor';
    } else if (error.status === 403) {
      return 'Acesso negado';
    } else if (error.status === 400) {
      return 'Dados inválidos enviados';
    } else {
      return 'Erro de conexão com o servidor';
    }
  }

  // Mensagens de validação
  getValidationMessage(rule) {
    switch (rule) {
      case 'required': return 'Campo obrigatório';
      case 'email': return 'Email inválido';
      case 'min': return 'Valor muito pequeno';
      case 'max': return 'Valor muito grande';
      default: return 'Formato inválido';
    }
  }

  // Mensagens de erro SQL
  getSqlErrorMessage(error) {
    if (error.message?.includes('syntax error')) {
      return 'Erro de sintaxe SQL';
    } else if (error.message?.includes('connection')) {
      return 'Erro de conexão com banco de dados';
    } else if (error.message?.includes('permission')) {
      return 'Permissão negada no banco de dados';
    } else {
      return 'Erro ao executar consulta SQL';
    }
  }
}

// Instância global
const logger = new Logger();
const errorHandler = new ErrorHandler(logger);

// Exportar para uso global
window.logger = logger;
window.errorHandler = errorHandler;
