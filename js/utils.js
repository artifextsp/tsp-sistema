// ===================================================
// TSP SISTEMA - UTILITIES
// Funciones de utilidad globales
// ===================================================

// Utilidades de tiempo
const TimeUtils = {
    // Formatear segundos a MM:SS
    formatTime(seconds) {
        if (!seconds || seconds < 0) return '00:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    // Formatear segundos a formato legible
    formatDuration(seconds) {
        if (!seconds || seconds < 0) return '0 segundos';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        let parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
        
        return parts.join(' ');
    },

    // Obtener timestamp actual
    now() {
        return Math.floor(Date.now() / 1000);
    },

    // Calcular diferencia en segundos
    diffSeconds(start, end = null) {
        const endTime = end || Date.now();
        return Math.floor((endTime - start) / 1000);
    }
};

// Utilidades de validación
const ValidationUtils = {
    // Validar email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validar código de estudiante (formato: AB1234)
    isValidStudentCode(code) {
        if (!code || typeof code !== 'string') return false;
        
        const cleanCode = code.trim().toUpperCase();
        const codeRegex = /^[A-Z]{2}\d{4}$/;
        return codeRegex.test(cleanCode);
    },

    // Validar que un número esté en un rango
    isInRange(value, min, max) {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
    },

    // Validar que una cadena no esté vacía
    isNotEmpty(str) {
        return str && typeof str === 'string' && str.trim().length > 0;
    },

    // Validar grado escolar
    isValidGrade(grade) {
        return this.isInRange(grade, 1, 11);
    },

    // Validar porcentaje
    isValidPercentage(percentage) {
        return this.isInRange(percentage, 0, 100);
    }
};

// Utilidades de formato
const FormatUtils = {
    // Capitalizar primera letra
    capitalize(str) {
        if (!str || typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    // Capitalizar cada palabra
    titleCase(str) {
        if (!str || typeof str !== 'string') return '';
        return str.split(' ')
            .map(word => this.capitalize(word))
            .join(' ');
    },

    // Limpiar texto (remover espacios extra, caracteres especiales, etc.)
    cleanText(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text
            .trim()
            .replace(/\s+/g, ' ')  // Múltiples espacios a uno solo
            .replace(/[""]/g, '"') // Comillas tipográficas a normales
            .replace(/['']/g, "'") // Apostrofes tipográficos a normales
            .replace(/…/g, '...')  // Elipsis a tres puntos
            .normalize('NFC');     // Normalizar Unicode
    },

    // Truncar texto con elipsis
    truncate(text, maxLength, suffix = '...') {
        if (!text || typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        
        return text.substring(0, maxLength - suffix.length) + suffix;
    },

    // Formatear número con separadores de miles
    formatNumber(num) {
        if (isNaN(num)) return '0';
        return Number(num).toLocaleString('es-ES');
    },

    // Formatear porcentaje
    formatPercentage(value, decimals = 1) {
        if (isNaN(value)) return '0%';
        return `${Number(value).toFixed(decimals)}%`;
    }
};

// Utilidades de DOM
const DOMUtils = {
    // Mostrar/ocultar elemento
    toggle(elementId, show = null) {
        const element = document.getElementById(elementId);
        if (!element) return false;
        
        if (show === null) {
            // Toggle automático
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        } else {
            element.style.display = show ? 'block' : 'none';
        }
        
        return true;
    },

    // Agregar clase CSS
    addClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add(className);
            return true;
        }
        return false;
    },

    // Remover clase CSS
    removeClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove(className);
            return true;
        }
        return false;
    },

    // Toggle clase CSS
    toggleClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle(className);
            return true;
        }
        return false;
    },

    // Actualizar contenido de texto
    updateText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
            return true;
        }
        return false;
    },

    // Actualizar contenido HTML
    updateHTML(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
            return true;
        }
        return false;
    },

    // Deshabilitar/habilitar elemento
    setDisabled(elementId, disabled = true) {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = disabled;
            return true;
        }
        return false;
    },

    // Crear elemento con atributos
    createElement(tag, attributes = {}, text = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(attr => {
            element.setAttribute(attr, attributes[attr]);
        });
        
        if (text) {
            element.textContent = text;
        }
        
        return element;
    },

    // Scroll suave a elemento
    scrollToElement(elementId, offset = 0) {
        const element = document.getElementById(elementId);
        if (element) {
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
                top: elementPosition - offset,
                behavior: 'smooth'
            });
            return true;
        }
        return false;
    }
};

// Utilidades de almacenamiento local
const StorageUtils = {
    // Guardar en localStorage con manejo de errores
    set(key, value, prefix = 'tsp_') {
        try {
            const prefixedKey = prefix + key;
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(prefixedKey, serializedValue);
            return true;
        } catch (error) {
            console.warn('Error guardando en localStorage:', error);
            return false;
        }
    },

    // Obtener de localStorage con manejo de errores
    get(key, defaultValue = null, prefix = 'tsp_') {
        try {
            const prefixedKey = prefix + key;
            const item = localStorage.getItem(prefixedKey);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Error leyendo de localStorage:', error);
            return defaultValue;
        }
    },

    // Remover de localStorage
    remove(key, prefix = 'tsp_') {
        try {
            const prefixedKey = prefix + key;
            localStorage.removeItem(prefixedKey);
            return true;
        } catch (error) {
            console.warn('Error removiendo de localStorage:', error);
            return false;
        }
    },

    // Limpiar todo el almacenamiento del prefijo
    clear(prefix = 'tsp_') {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.warn('Error limpiando localStorage:', error);
            return false;
        }
    },

    // Verificar si localStorage está disponible
    isAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, 'test');
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }
};

// Utilidades de conexión y red
const NetworkUtils = {
    // Verificar si hay conexión a internet
    async isOnline() {
        if (!navigator.onLine) return false;
        
        try {
            const response = await fetch(window.location.origin, {
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch {
            return false;
        }
    },

    // Esperar a que haya conexión
    async waitForConnection(maxWaitTime = 30000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            if (await this.isOnline()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return false;
    },

    // Retry de función con backoff exponencial
    async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxRetries) throw error;
                
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
};

// Utilidades de debugging
const DebugUtils = {
    // Log con timestamp
    log(message, data = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] TSP:`, message, data || '');
    },

    // Log de error con contexto
    error(message, error = null, context = null) {
        const timestamp = new Date().toISOString();
        console.group(`❌ [${timestamp}] TSP Error: ${message}`);
        if (error) console.error('Error:', error);
        if (context) console.error('Context:', context);
        console.groupEnd();
    },

    // Medir tiempo de ejecución
    async measureTime(label, fn) {
        const start = performance.now();
        try {
            const result = await fn();
            const end = performance.now();
            console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
            return result;
        } catch (error) {
            const end = performance.now();
            console.error(`⏱️ ${label} (failed): ${(end - start).toFixed(2)}ms`, error);
            throw error;
        }
    },

    // Dump del estado actual del sistema
    dumpState() {
        const state = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            localStorage: StorageUtils.get('debug_state', {}),
            sessionStorage: {},
            currentUser: window.AuthManager ? 'AuthManager available' : 'AuthManager not available',
            supabaseClient: window.supabaseClient ? 'supabaseClient available' : 'supabaseClient not available'
        };

        // Obtener datos de sessionStorage
        try {
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('tsp_')) {
                    state.sessionStorage[key] = sessionStorage.getItem(key);
                }
            }
        } catch (error) {
            state.sessionStorage = { error: error.message };
        }

        console.group('🔍 TSP System State Dump');
        console.table(state);
        console.groupEnd();

        return state;
    }
};

// Hacer utilidades disponibles globalmente
window.TimeUtils = TimeUtils;
window.ValidationUtils = ValidationUtils;
window.FormatUtils = FormatUtils;
window.DOMUtils = DOMUtils;
window.StorageUtils = StorageUtils;
window.NetworkUtils = NetworkUtils;
window.DebugUtils = DebugUtils;

// Funciones de conveniencia globales
window.formatTime = TimeUtils.formatTime;
window.formatPercentage = FormatUtils.formatPercentage;
window.cleanText = FormatUtils.cleanText;

// Función global para mostrar loading
window.showLoading = function(message = 'Cargando...') {
    // Implementación básica - puede ser mejorada
    console.log('🔄 Loading:', message);
};

window.hideLoading = function() {
    console.log('✅ Loading finished');
};

// Función global para mostrar confirmación
window.mostrarConfirmacion = function(titulo, mensaje, callback) {
    if (confirm(`${titulo}\n\n${mensaje}`)) {
        callback();
    }
};

// Función global para mostrar alerta
window.mostrarAlerta = function(mensaje) {
    alert(mensaje);
};

// Función global para mostrar error
window.mostrarError = function(mensaje) {
    console.error('❌', mensaje);
    if (window.ErrorHandler) {
        ErrorHandler.show(mensaje);
    } else {
        alert('Error: ' + mensaje);
    }
};

// Log de inicialización
console.log('🛠️ Utilidades TSP cargadas correctamente');

// Exportar para uso en módulos (si es necesario)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TimeUtils,
        ValidationUtils,
        FormatUtils,
        DOMUtils,
        StorageUtils,
        NetworkUtils,
        DebugUtils
    };
}