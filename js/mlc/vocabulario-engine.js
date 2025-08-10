// ===================================================
// TSP SISTEMA - VOCABULARIO ENGINE (BÁSICO)
// Motor de vocabulario - versión temporal
// ===================================================

class VocabularioEngine {
    constructor(lecturaId) {
        this.lecturaId = lecturaId;
        this.vocabulario = [];
        this.currentIndex = 0;
        this.viewedTerms = new Set();
    }

    // Cargar vocabulario desde la base de datos
    async loadVocabulario() {
        try {
            console.log('📝 Cargando vocabulario...');

            const { data, error } = await supabaseClient
                .from('vocabulario')
                .select('*')
                .eq('lectura_id', this.lecturaId)
                .order('orden');

            if (error) throw error;

            this.vocabulario = data || [];
            console.log(`✅ Vocabulario cargado: ${this.vocabulario.length} términos`);
            
            return this.vocabulario;

        } catch (error) {
            console.error('❌ Error cargando vocabulario:', error);
            ErrorHandler.show('Error cargando vocabulario', error);
            throw error;
        }
    }

    // Mostrar vocabulario en la interfaz
    displayVocabulario(containerId = 'vocabulario-lista') {
        const container = document.getElementById(containerId);
        if (!container || !this.vocabulario.length) return;

        container.innerHTML = this.vocabulario.map((item, index) => `
            <div class="vocabulario-item" data-index="${index}">
                <div class="vocabulario-palabra">${item.palabra}</div>
                <div class="vocabulario-definicion">${item.definicion}</div>
            </div>
        `).join('');

        // Agregar click listeners para tracking
        container.addEventListener('click', (e) => {
            const item = e.target.closest('.vocabulario-item');
            if (item) {
                const index = parseInt(item.dataset.index);
                this.markAsViewed(index);
            }
        });

        this.updateProgress();
    }

    // Marcar término como visto
    markAsViewed(index) {
        if (index >= 0 && index < this.vocabulario.length) {
            this.viewedTerms.add(index);
            this.updateProgress();
        }
    }

    // Actualizar progreso visual
    updateProgress() {
        const progressElement = document.getElementById('vocabulario-progress');
        const counterElement = document.getElementById('vocabulario-counter');
        
        const viewedCount = this.viewedTerms.size;
        const totalCount = this.vocabulario.length;
        const percentage = totalCount > 0 ? (viewedCount / totalCount) * 100 : 0;

        if (progressElement) {
            progressElement.style.width = `${percentage}%`;
        }

        if (counterElement) {
            counterElement.textContent = `${viewedCount} de ${totalCount} términos revisados`;
        }
    }

    // Verificar si todos los términos han sido vistos
    allTermsViewed() {
        return this.viewedTerms.size >= this.vocabulario.length;
    }

    // Obtener término específico
    getTerm(index) {
        return this.vocabulario[index] || null;
    }

    // Obtener todos los términos
    getAllTerms() {
        return this.vocabulario;
    }

    // Preparar para evaluación (marcar todos como vistos)
    prepareForEvaluation() {
        for (let i = 0; i < this.vocabulario.length; i++) {
            this.markAsViewed(i);
        }
        console.log('📝 Vocabulario preparado para evaluación');
    }
}

// Hacer disponible globalmente
window.VocabularioEngine = VocabularioEngine;