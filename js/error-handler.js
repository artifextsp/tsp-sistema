// ===================================================
// TSP SISTEMA - ERROR HANDLER
// Sistema centralizado de manejo de errores
// ===================================================

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.setupGlobalHandlers();
    }

    // Configurar manejadores globales de errores
    setupGlobalHandlers() {
        // Errores JavaScript no capturados
        window.addEventListener('error', (event) => {
            this.log(event.error, 'Error JavaScript Global', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Promesas rechazadas no manejadas
        window.addEventListener('unhandledrejection', (event) => {
            this.log(event.reason, 'Promesa Rechazada', {
                promise: event.promise
            });
        });
    }

    // Registrar error en el log
    static log(error, context = 'Sin contexto', additionalInfo = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            context,
            message: error?.message || String(error),
            stack: error?.stack || null,
            additionalInfo,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Agregar al log interno
        if (!window.errorHandler) {
            window.errorHandler = new ErrorHandler();
        }
        
        window.errorHandler.errorLog.push(errorEntry);

        // Mantener tamaño del log controlado
        if (window.errorHandler.errorLog.length > window.errorHandler.maxLogSize) {
            window.errorHandler.errorLog.shift();
        }

        // Log a consola con formato
        console.group(`🚨 Error: ${context}`);
        console.error('Mensaje:', errorEntry.message);
        console.error('Timestamp:', errorEntry.timestamp);
        if (errorEntry.stack) {
            console.error('Stack:', errorEntry.stack);
        }
        if (Object.keys(additionalInfo).length > 0) {
            console.error('Info adicional:', additionalInfo);
        }
        console.groupEnd();

        // En producción, aquí se podría enviar a un servicio de monitoreo
        // this.sendToMonitoringService(errorEntry);
    }

    // Mostrar error al usuario de manera amigable
    static show(message, error = null, options = {}) {
        const {
            type = 'error',
            duration = 5000,
            allowClose = true,
            showRetry = false,
            retryCallback = null
        } = options;

        // Log del error
        if (error) {
            ErrorHandler.log(error, `Error mostrado al usuario: ${message}`);
        }

        // Crear elemento de notificación
        const notification = ErrorHandler.createNotification(message, type, {
            duration,
            allowClose,
            showRetry,
            retryCallback
        });

        // Agregar al DOM
        document.body.appendChild(notification);

        // Auto-remover después del tiempo especificado
        if (duration > 0) {
            setTimeout(() => {
                ErrorHandler.removeNotification(notification);
            }, duration);
        }

        return notification;
    }

    // Crear elemento de notificación
    static createNotification(message, type, options) {
        const notification = document.createElement('div');
        notification.className = `error-notification error-notification--${type}`;
        
        const icons = {
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            success: '✅'
        };

        notification.innerHTML = `
            <div class="error-notification__content">
                <span class="error-notification__icon">${icons[type] || '❌'}</span>
                <span class="error-notification__message">${message}</span>
            </div>
            <div class="error-notification__actions">
                ${options.showRetry ? '<button class="error-notification__retry">🔄 Reintentar</button>' : ''}
                ${options.allowClose ? '<button class="error-notification__close">&times;</button>' : ''}
            </div>
        `;

        // Estilos inline para evitar dependencias CSS
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        `;

        // Event listeners
        const closeBtn = notification.querySelector('.error-notification__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                ErrorHandler.removeNotification(notification);
            });
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0 0 0 10px;
            `;
        }

        const retryBtn = notification.querySelector('.error-notification__retry');
        if (retryBtn && options.retryCallback) {
            retryBtn.addEventListener('click', () => {
                ErrorHandler.removeNotification(notification);
                options.retryCallback();
            });
            retryBtn.style.cssText = `
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 10px;
                font-size: 12px;
            `;
        }

        // Estilos para el contenido
        const content = notification.querySelector('.error-notification__content');
        content.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        `;

        const icon = notification.querySelector('.error-notification__icon');
        icon.style.cssText = `
            margin-right: 10px;
            font-size: 16px;
        `;

        const actions = notification.querySelector('.error-notification__actions');
        actions.style.cssText = `
            display: flex;
            justify-content: flex-end;
            align-items: center;
        `;

        return notification;
    }

    // Remover notificación
    static removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    // Mostrar mensaje de éxito
    static showSuccess(message, options = {}) {
        return ErrorHandler.show(message, null, { 
            type: 'success', 
            duration: 3000,
            ...options 
        });
    }

    // Mostrar advertencia
    static showWarning(message, options = {}) {
        return ErrorHandler.show(message, null, { 
            type: 'warning', 
            duration: 4000,
            ...options 
        });
    }

    // Mostrar información
    static showInfo(message, options = {}) {
        return ErrorHandler.show(message, null, { 
            type: 'info', 
            duration: 3000,
            ...options 
        });
    }

    // Wrapper para operaciones con manejo automático de errores
    static async withErrorHandling(operation, context = 'Operación', options = {}) {
        const {
            showLoading = false,
            loadingMessage = 'Procesando...',
            successMessage = null,
            showErrors = true,
            retryable = false,
            maxRetries = 2
        } = options;

        let loadingNotification = null;

        try {
            // Mostrar loading si es necesario
            if (showLoading) {
                loadingNotification = ErrorHandler.showInfo(loadingMessage, { 
                    duration: 0, 
                    allowClose: false 
                });
            }

            // Ejecutar operación con retry automático
            let result;
            let attempt = 1;
            
            while (attempt <= (retryable ? maxRetries + 1 : 1)) {
                try {
                    result = await operation();
                    break;
                } catch (error) {
                    if (attempt <= maxRetries && retryable) {
                        console.warn(`Intento ${attempt} falló, reintentando...`);
                        attempt++;
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    } else {
                        throw error;
                    }
                }
            }

            // Remover loading
            if (loadingNotification) {
                ErrorHandler.removeNotification(loadingNotification);
            }

            // Mostrar mensaje de éxito si aplica
            if (successMessage) {
                ErrorHandler.showSuccess(successMessage);
            }

            return result;

        } catch (error) {
            // Remover loading
            if (loadingNotification) {
                ErrorHandler.removeNotification(loadingNotification);
            }

            // Log del error
            ErrorHandler.log(error, context);

            // Mostrar error al usuario si está habilitado
            if (showErrors) {
                const retryCallback = retryable ? 
                    () => ErrorHandler.withErrorHandling(operation, context, options) : 
                    null;

                ErrorHandler.show(
                    `Error en ${context}: ${error.message || 'Error desconocido'}`,
                    error,
                    { showRetry: retryable, retryCallback }
                );
            }

            throw error;
        }
    }

    // Obtener log de errores
    static getErrorLog() {
        return window.errorHandler?.errorLog || [];
    }

    // Limpiar log de errores
    static clearErrorLog() {
        if (window.errorHandler) {
            window.errorHandler.errorLog = [];
        }
    }

    // Exportar log de errores para soporte técnico
    static exportErrorLog() {
        const log = ErrorHandler.getErrorLog();
        const exportData = {
            exportDate: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            errors: log
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tsp-error-log-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Validar conexión de red
    static async checkConnection() {
        try {
            const response = await fetch(window.location.origin, { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Mostrar estado de conexión
    static async showConnectionStatus() {
        const isOnline = await ErrorHandler.checkConnection();
        
        if (isOnline) {
            ErrorHandler.showSuccess('Conexión restaurada');
        } else {
            ErrorHandler.show('Sin conexión a internet', null, {
                type: 'warning',
                duration: 0,
                showRetry: true,
                retryCallback: () => ErrorHandler.showConnectionStatus()
            });
        }

        return isOnline;
    }
}

// Agregar estilos de animación al head si no existen
if (!document.querySelector('#error-handler-styles')) {
    const styles = document.createElement('style');
    styles.id = 'error-handler-styles';
    styles.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(styles);
}

// Crear instancia global
window.errorHandler = new ErrorHandler();

// Hacer clase disponible globalmente
window.ErrorHandler = ErrorHandler;