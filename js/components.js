// ===================================================
// TSP SISTEMA - COMPONENTS
// Componentes UI reutilizables
// ===================================================

// Componente de Progress Bar
class ProgressBar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            showPercentage: true,
            showCounter: true,
            animated: true,
            color: '#4682B4',
            ...options
        };
        
        this.currentValue = 0;
        this.maxValue = 100;
        this.render();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="tsp-progress-container">
                <div class="tsp-progress-bar">
                    <div class="tsp-progress-fill" id="${this.container.id}-fill"></div>
                </div>
                ${this.options.showCounter ? 
                    `<div class="tsp-progress-text" id="${this.container.id}-text"></div>` : 
                    ''
                }
            </div>
        `;

        this.applyStyles();
        this.update(0);
    }

    applyStyles() {
        if (document.querySelector('#tsp-progress-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'tsp-progress-styles';
        styles.textContent = `
            .tsp-progress-container {
                width: 100%;
                margin: 10px 0;
            }

            .tsp-progress-bar {
                background: #f0f0f0;
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
                position: relative;
            }

            .tsp-progress-fill {
                height: 100%;
                border-radius: 4px;
                transition: width 0.5s ease;
                background: linear-gradient(90deg, ${this.options.color}, ${this.options.color}cc);
                position: relative;
            }

            .tsp-progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255,255,255,0.3),
                    transparent
                );
                animation: ${this.options.animated ? 'progressShine 2s infinite' : 'none'};
            }

            @keyframes progressShine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
            }

            .tsp-progress-text {
                font-size: 0.9rem;
                color: #666;
                text-align: center;
                font-weight: 500;
            }
        `;
        document.head.appendChild(styles);
    }

    update(current, max = null) {
        if (max !== null) this.maxValue = max;
        this.currentValue = current;

        const percentage = this.maxValue > 0 ? (current / this.maxValue) * 100 : 0;
        
        const fillElement = document.getElementById(`${this.container.id}-fill`);
        if (fillElement) {
            fillElement.style.width = `${percentage}%`;
        }

        if (this.options.showCounter) {
            const textElement = document.getElementById(`${this.container.id}-text`);
            if (textElement) {
                textElement.textContent = `${current} de ${this.maxValue}`;
            }
        }
    }

    setColor(color) {
        this.options.color = color;
        const fillElement = document.getElementById(`${this.container.id}-fill`);
        if (fillElement) {
            fillElement.style.background = `linear-gradient(90deg, ${color}, ${color}cc)`;
        }
    }
}

// Componente de Modal/Panel Flotante
class FloatingPanel {
    constructor(options = {}) {
        this.options = {
            title: 'Panel',
            closeButton: true,
            overlay: true,
            size: 'medium', // small, medium, large, fullscreen
            position: 'center', // center, top, bottom
            ...options
        };
        
        this.isOpen = false;
        this.element = null;
        this.overlayElement = null;
        
        this.create();
    }

    create() {
        // Crear overlay si es necesario
        if (this.options.overlay) {
            this.overlayElement = document.createElement('div');
            this.overlayElement.className = 'tsp-panel-overlay';
            this.overlayElement.style.display = 'none';
            
            this.overlayElement.addEventListener('click', () => {
                if (this.options.closeOnOverlayClick !== false) {
                    this.close();
                }
            });
        }

        // Crear panel principal
        this.element = document.createElement('div');
        this.element.className = `tsp-floating-panel tsp-panel-${this.options.size} tsp-panel-${this.options.position}`;
        this.element.style.display = 'none';

        this.element.innerHTML = `
            <div class="tsp-panel-header">
                <h3 class="tsp-panel-title">${this.options.title}</h3>
                ${this.options.closeButton ? 
                    '<button class="tsp-panel-close">&times;</button>' : 
                    ''
                }
            </div>
            <div class="tsp-panel-content" id="tsp-panel-content-${Date.now()}">
                <!-- Contenido dinámico -->
            </div>
        `;

        // Event listeners
        if (this.options.closeButton) {
            const closeBtn = this.element.querySelector('.tsp-panel-close');
            closeBtn.addEventListener('click', () => this.close());
        }

        // Agregar estilos
        this.applyStyles();

        // Agregar al DOM
        document.body.appendChild(this.element);
        if (this.overlayElement) {
            document.body.appendChild(this.overlayElement);
        }
    }

    applyStyles() {
        if (document.querySelector('#tsp-panel-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'tsp-panel-styles';
        styles.textContent = `
            .tsp-panel-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
                backdrop-filter: blur(2px);
            }

            .tsp-floating-panel {
                position: fixed;
                background: white;
                border-radius: 15px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                z-index: 10000;
                overflow: hidden;
                border: 2px solid #4682B4;
                transform: scale(0.9);
                opacity: 0;
                transition: all 0.3s ease;
            }

            .tsp-floating-panel.open {
                transform: scale(1);
                opacity: 1;
            }

            /* Tamaños */
            .tsp-panel-small { width: 300px; max-height: 400px; }
            .tsp-panel-medium { width: 500px; max-height: 600px; }
            .tsp-panel-large { width: 800px; max-height: 80vh; }
            .tsp-panel-fullscreen { 
                width: 95vw; 
                height: 95vh; 
                max-width: none; 
                max-height: none; 
            }

            /* Posiciones */
            .tsp-panel-center {
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
            }

            .tsp-panel-center.open {
                transform: translate(-50%, -50%) scale(1);
            }

            .tsp-panel-top {
                top: 5%;
                left: 50%;
                transform: translate(-50%, 0) scale(0.9);
            }

            .tsp-panel-top.open {
                transform: translate(-50%, 0) scale(1);
            }

            .tsp-panel-header {
                background: linear-gradient(135deg, #4682B4 0%, #5F9EA0 100%);
                color: white;
                padding: 20px 25px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .tsp-panel-title {
                margin: 0;
                font-size: 1.3rem;
                font-weight: 500;
            }

            .tsp-panel-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.3s ease;
            }

            .tsp-panel-close:hover {
                background: rgba(255,255,255,0.2);
            }

            .tsp-panel-content {
                padding: 25px;
                max-height: 60vh;
                overflow-y: auto;
            }

            @media (max-width: 768px) {
                .tsp-panel-medium,
                .tsp-panel-large {
                    width: 95vw;
                    max-height: 90vh;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    open() {
        if (this.isOpen) return;

        if (this.overlayElement) {
            this.overlayElement.style.display = 'block';
        }
        
        this.element.style.display = 'block';
        
        // Forzar reflow y luego agregar clase open
        this.element.offsetHeight;
        this.element.classList.add('open');
        
        this.isOpen = true;

        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (!this.isOpen) return;

        this.element.classList.remove('open');
        
        setTimeout(() => {
            this.element.style.display = 'none';
            if (this.overlayElement) {
                this.overlayElement.style.display = 'none';
            }
        }, 300);

        this.isOpen = false;

        // Restaurar scroll del body
        document.body.style.overflow = '';
    }

    setContent(content) {
        const contentElement = this.element.querySelector('.tsp-panel-content');
        if (contentElement) {
            contentElement.innerHTML = content;
        }
    }

    setTitle(title) {
        const titleElement = this.element.querySelector('.tsp-panel-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    destroy() {
        this.close();
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            if (this.overlayElement && this.overlayElement.parentNode) {
                this.overlayElement.parentNode.removeChild(this.overlayElement);
            }
        }, 400);
    }
}

// Componente de Botón con Loading
class LoadingButton {
    constructor(buttonId, options = {}) {
        this.button = document.getElementById(buttonId);
        this.options = {
            loadingText: 'Cargando...',
            spinnerIcon: '🔄',
            ...options
        };
        
        this.originalText = '';
        this.isLoading = false;
        
        this.init();
    }

    init() {
        if (!this.button) return;
        
        this.originalText = this.button.textContent || this.button.innerHTML;
        this.applyStyles();
    }

    applyStyles() {
        if (document.querySelector('#tsp-loading-button-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'tsp-loading-button-styles';
        styles.textContent = `
            .tsp-btn-loading {
                position: relative;
                pointer-events: none;
                opacity: 0.7;
            }

            .tsp-btn-loading .tsp-btn-spinner {
                display: inline-block;
                animation: tsp-spin 1s linear infinite;
                margin-right: 8px;
            }

            @keyframes tsp-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styles);
    }

    startLoading() {
        if (this.isLoading || !this.button) return;

        this.isLoading = true;
        this.button.classList.add('tsp-btn-loading');
        this.button.disabled = true;
        
        this.button.innerHTML = `
            <span class="tsp-btn-spinner">${this.options.spinnerIcon}</span>
            ${this.options.loadingText}
        `;
    }

    stopLoading() {
        if (!this.isLoading || !this.button) return;

        this.isLoading = false;
        this.button.classList.remove('tsp-btn-loading');
        this.button.disabled = false;
        this.button.innerHTML = this.originalText;
    }

    async executeWithLoading(asyncFunction) {
        try {
            this.startLoading();
            const result = await asyncFunction();
            return result;
        } finally {
            this.stopLoading();
        }
    }
}

// Componente de Toast/Notificación
class Toast {
    static show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `tsp-toast tsp-toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="tsp-toast-content">
                <span class="tsp-toast-icon">${icons[type] || icons.info}</span>
                <span class="tsp-toast-message">${message}</span>
            </div>
        `;

        // Aplicar estilos
        Toast.applyStyles();

        // Agregar al DOM
        document.body.appendChild(toast);

        // Mostrar con animación
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto-remover
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, duration);
        }

        return toast;
    }

    static applyStyles() {
        if (document.querySelector('#tsp-toast-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'tsp-toast-styles';
        styles.textContent = `
            .tsp-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10001;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
                max-width: 350px;
                border-left: 4px solid #4682B4;
            }

            .tsp-toast.show {
                transform: translateX(0);
                opacity: 1;
            }

            .tsp-toast-success { border-left-color: #28a745; }
            .tsp-toast-error { border-left-color: #dc3545; }
            .tsp-toast-warning { border-left-color: #ffc107; }
            .tsp-toast-info { border-left-color: #17a2b8; }

            .tsp-toast-content {
                display: flex;
                align-items: center;
                padding: 15px 20px;
            }

            .tsp-toast-icon {
                margin-right: 10px;
                font-size: 16px;
            }

            .tsp-toast-message {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
                color: #333;
            }
        `;
        document.head.appendChild(styles);
    }

    static success(message, duration = 3000) {
        return Toast.show(message, 'success', duration);
    }

    static error(message, duration = 5000) {
        return Toast.show(message, 'error', duration);
    }

    static warning(message, duration = 4000) {
        return Toast.show(message, 'warning', duration);
    }

    static info(message, duration = 3000) {
        return Toast.show(message, 'info', duration);
    }
}

// Componente de Cronómetro Visual
class VisualTimer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            format: 'mm:ss',
            autoStart: false,
            showMilliseconds: false,
            ...options
        };
        
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.interval = null;
        
        this.render();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="tsp-timer-display" id="${this.container.id}-display">00:00</div>
            <div class="tsp-timer-status" id="${this.container.id}-status">Listo para iniciar</div>
        `;

        this.applyStyles();
    }

    applyStyles() {
        if (document.querySelector('#tsp-timer-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'tsp-timer-styles';
        styles.textContent = `
            .tsp-timer-display {
                font-size: 2.5rem;
                font-weight: 300;
                font-family: 'Courier New', monospace;
                margin-bottom: 5px;
                color: #2F4F4F;
            }

            .tsp-timer-status {
                font-size: 0.9rem;
                opacity: 0.8;
                color: #666;
            }

            .tsp-timer-running .tsp-timer-display {
                color: #28a745;
            }

            .tsp-timer-paused .tsp-timer-display {
                color: #ffc107;
            }
        `;
        document.head.appendChild(styles);
    }

    start() {
        if (this.isRunning) return;

        this.startTime = Date.now() - this.elapsedTime;
        this.isRunning = true;
        
        this.interval = setInterval(() => {
            this.elapsedTime = Date.now() - this.startTime;
            this.updateDisplay();
        }, this.options.showMilliseconds ? 10 : 1000);

        this.updateStatus('En marcha');
        this.container.classList.add('tsp-timer-running');
        this.container.classList.remove('tsp-timer-paused');
    }

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.updateStatus('Pausado');
        this.container.classList.add('tsp-timer-paused');
        this.container.classList.remove('tsp-timer-running');
    }

    stop() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.updateStatus('Detenido');
        this.container.classList.remove('tsp-timer-running', 'tsp-timer-paused');
        
        return Math.floor(this.elapsedTime / 1000); // Retornar segundos
    }

    reset() {
        this.stop();
        this.elapsedTime = 0;
        this.updateDisplay();
        this.updateStatus('Listo para iniciar');
    }

    updateDisplay() {
        const displayElement = document.getElementById(`${this.container.id}-display`);
        if (!displayElement) return;

        const totalSeconds = Math.floor(this.elapsedTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let timeString;
        if (this.options.format === 'hh:mm:ss' || hours > 0) {
            timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        displayElement.textContent = timeString;
    }

    updateStatus(status) {
        const statusElement = document.getElementById(`${this.container.id}-status`);
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    getElapsedSeconds() {
        return Math.floor(this.elapsedTime / 1000);
    }
}

// Hacer componentes disponibles globalmente
window.ProgressBar = ProgressBar;
window.FloatingPanel = FloatingPanel;
window.LoadingButton = LoadingButton;
window.Toast = Toast;
window.VisualTimer = VisualTimer;

// Funciones de utilidad para componentes
window.Components = {
    createProgressBar: (containerId, options) => new ProgressBar(containerId, options),
    createPanel: (options) => new FloatingPanel(options),
    createLoadingButton: (buttonId, options) => new LoadingButton(buttonId, options),
    showToast: (message, type, duration) => Toast.show(message, type, duration),
    createTimer: (containerId, options) => new VisualTimer(containerId, options)
};

console.log('🧩 Componentes TSP cargados correctamente');