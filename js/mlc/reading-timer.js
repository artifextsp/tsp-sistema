// ===================================================
// TSP SISTEMA - READING TIMER (BÁSICO)
// Cronómetro de lectura - versión temporal
// ===================================================

class ReadingTimer {
    constructor() {
        this.startTime = null;
        this.endTime = null;
        this.isRunning = false;
        this.interval = null;
        this.displayElement = null;
        this.statusElement = null;
        
        this.findDisplayElements();
    }

    // Encontrar elementos de display en el DOM
    findDisplayElements() {
        this.displayElement = document.getElementById('cronometro-display');
        this.statusElement = document.getElementById('cronometro-estado');
    }

    // Iniciar cronómetro
    start() {
        if (this.isRunning) return;

        this.startTime = Date.now();
        this.isRunning = true;
        
        this.updateStatus('⏱️ Midiendo tu tiempo de lectura...');
        
        // Actualizar display cada segundo
        this.interval = setInterval(() => {
            this.updateDisplay();
        }, 1000);

        console.log('⏱️ Cronómetro iniciado');
        Toast.success('Cronómetro iniciado');
    }

    // Pausar cronómetro
    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.updateStatus('⏸️ Cronómetro pausado');
        console.log('⏸️ Cronómetro pausado');
    }

    // Reanudar cronómetro
    resume() {
        if (this.isRunning) return;

        this.isRunning = true;
        
        this.interval = setInterval(() => {
            this.updateDisplay();
        }, 1000);

        this.updateStatus('⏱️ Cronómetro reanudado');
        console.log('▶️ Cronómetro reanudado');
    }

    // Detener cronómetro
    stop() {
        if (!this.startTime) return 0;

        this.endTime = Date.now();
        this.isRunning = false;
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        const totalSeconds = this.getTotalSeconds();
        this.updateStatus(`✅ Tiempo total: ${this.formatTime(totalSeconds)}`);
        
        console.log(`⏹️ Cronómetro detenido. Tiempo total: ${totalSeconds} segundos`);
        
        return totalSeconds;
    }

    // Obtener tiempo total en segundos
    getTotalSeconds() {
        if (!this.startTime) return 0;
        
        const endTime = this.endTime || Date.now();
        return Math.floor((endTime - this.startTime) / 1000);
    }

    // Formatear tiempo a MM:SS
    formatTime(seconds) {
        if (!seconds || seconds < 0) return '00:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Actualizar display visual
    updateDisplay() {
        if (!this.displayElement) return;

        const currentSeconds = this.getTotalSeconds();
        this.displayElement.textContent = this.formatTime(currentSeconds);
    }

    // Actualizar estado visual
    updateStatus(status) {
        if (this.statusElement) {
            this.statusElement.textContent = status;
        }
    }

    // Verificar si está corriendo
    isActive() {
        return this.isRunning;
    }

    // Reset completo
    reset() {
        this.stop();
        this.startTime = null;
        this.endTime = null;
        
        if (this.displayElement) {
            this.displayElement.textContent = '00:00';
        }
        
        this.updateStatus('Listo para iniciar');
        console.log('🔄 Cronómetro reiniciado');
    }
}

// Hacer disponible globalmente
window.ReadingTimer = ReadingTimer;