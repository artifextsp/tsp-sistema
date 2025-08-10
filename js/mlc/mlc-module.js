// ===================================================
// TSP SISTEMA - MLC MODULE
// Módulo principal de Lectura Crítica
// ===================================================

class MLCModule {
    constructor() {
        this.currentUser = null;
        this.currentLectura = null;
        this.currentSection = 'seleccion-lectura';
        this.sessionData = {
            tiempoLectura: 0,
            aciertosVocabulario: 0,
            aciertosComprension: 0,
            respuestasVocabulario: {},
            respuestasComprension: {},
            startTime: null
        };
        
        this.initialized = false;
    }

    // Inicializar módulo
    async initialize() {
        try {
            console.log('🚀 Inicializando MLCModule...');

            // Verificar usuario autenticado
            this.currentUser = await AuthManager.getCurrentUser();
            if (!this.currentUser) {
                throw new Error('Usuario no autenticado');
            }

            console.log('✅ Usuario autenticado:', this.currentUser.nombre_completo);

            // Verificar acceso al módulo MLC
            const canAccess = await AuthManager.canAccessModule('MLC');
            if (!canAccess) {
                throw new Error('El usuario no tiene acceso al módulo MLC');
            }

            // Obtener lectura asignada
            await this.loadLecturaAsignada();

            // Configurar interfaz
            this.setupEventListeners();
            this.updateBreadcrumb();

            // Mostrar sección inicial
            this.showSection('seleccion-lectura');

            this.initialized = true;
            console.log('✅ MLCModule inicializado correctamente');

        } catch (error) {
            console.error('❌ Error inicializando MLCModule:', error);
            ErrorHandler.show('Error inicializando el módulo de lectura crítica', error);
            throw error;
        }
    }

    // Cargar lectura asignada para el usuario
    async loadLecturaAsignada() {
        try {
            console.log('📚 Cargando lectura asignada...');

            const { data: lecturas, error } = await supabaseClient
                .from('lecturas')
                .select('*')
                .eq('grado', this.currentUser.grado)
                .eq('ciclo', this.currentUser.ciclo_actual)
                .eq('estado', 'ACTIVA')
                .order('orden_en_ciclo')
                .limit(1);

            if (error) {
                throw new Error(`Error cargando lecturas: ${error.message}`);
            }

            if (!lecturas || lecturas.length === 0) {
                throw new Error(`No hay lecturas disponibles para grado ${this.currentUser.grado}, ciclo ${this.currentUser.ciclo_actual}`);
            }

            this.currentLectura = lecturas[0];
            console.log('✅ Lectura cargada:', this.currentLectura.titulo);

            // Actualizar interfaz con información de la lectura
            this.updateLecturaInfo();

        } catch (error) {
            console.error('❌ Error cargando lectura:', error);
            ErrorHandler.show('Error cargando la lectura asignada', error);
            throw error;
        }
    }

    // Actualizar información de la lectura en la interfaz
    updateLecturaInfo() {
        const lecturaInfoContainer = document.getElementById('lectura-info');
        if (!lecturaInfoContainer || !this.currentLectura) return;

        lecturaInfoContainer.innerHTML = `
            <div class="lectura-card">
                <div class="lectura-header">
                    <h3>📖 ${this.currentLectura.titulo}</h3>
                    <div class="lectura-meta">
                        <span class="meta-item">✍️ ${this.currentLectura.autor || 'Autor no especificado'}</span>
                        <span class="meta-item">📊 ${this.currentLectura.total_palabras} palabras</span>
                        <span class="meta-item">🎯 Grado ${this.currentLectura.grado}° - Ciclo ${this.currentLectura.ciclo}</span>
                    </div>
                </div>
                <div class="lectura-description">
                    <p>${this.currentLectura.contexto_introduccion}</p>
                </div>
            </div>
        `;

        // Habilitar botón de iniciar lectura
        const btnIniciar = document.getElementById('btn-iniciar-lectura');
        if (btnIniciar) {
            btnIniciar.disabled = false;
        }

        // Aplicar estilos dinámicos
        this.addLecturaCardStyles();
    }

    // Agregar estilos para la tarjeta de lectura
    addLecturaCardStyles() {
        if (document.querySelector('#lectura-card-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'lectura-card-styles';
        styles.textContent = `
            .lectura-card {
                background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
                border: 2px solid #4682B4;
                border-radius: 12px;
                padding: 25px;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(70, 130, 180, 0.2);
            }

            .lectura-header h3 {
                color: #2F4F4F;
                margin: 0 0 15px 0;
                font-size: 1.5rem;
                font-weight: 600;
            }

            .lectura-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin-bottom: 15px;
            }

            .meta-item {
                background: rgba(70, 130, 180, 0.1);
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 0.9rem;
                color: #2F4F4F;
                border: 1px solid rgba(70, 130, 180, 0.2);
            }

            .lectura-description {
                background: white;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #4682B4;
                margin-top: 15px;
            }

            .lectura-description p {
                margin: 0;
                line-height: 1.6;
                color: #2F4F4F;
            }

            @media (max-width: 768px) {
                .lectura-meta {
                    flex-direction: column;
                }
                
                .meta-item {
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botón volver al dashboard
        const btnVolverDashboard = document.getElementById('btn-volver-dashboard');
        if (btnVolverDashboard) {
            btnVolverDashboard.addEventListener('click', () => {
                window.location.href = '../pages/dashboard.html';
            });
        }

        // Botón iniciar lectura
        const btnIniciarLectura = document.getElementById('btn-iniciar-lectura');
        if (btnIniciarLectura) {
            btnIniciarLectura.addEventListener('click', () => {
                this.iniciarLectura();
            });
        }

        // Navegación entre secciones - configuración básica
        this.setupBasicNavigation();
    }

    // Configurar navegación básica entre secciones
    setupBasicNavigation() {
        // Por ahora solo implementamos la navegación esencial
        // Los engines específicos manejarán su propia navegación

        const btnTermineLeer = document.getElementById('btn-termine-leer');
        if (btnTermineLeer) {
            btnTermineLeer.addEventListener('click', () => {
                this.terminarLectura();
            });
        }

        // Cerrar paneles flotantes
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-btn') || e.target.id === 'overlay') {
                this.closeAllPanels();
            }
        });
    }

    // Iniciar proceso de lectura
    async iniciarLectura() {
        try {
            if (!this.currentLectura) {
                throw new Error('No hay lectura seleccionada');
            }

            console.log('📖 Iniciando lectura:', this.currentLectura.titulo);

            // Registrar inicio de sesión
            this.sessionData.startTime = Date.now();

            // Cargar PDF en el visor
            await this.loadPDFViewer();

            // Actualizar información de la lectura en la sección de lectura
            this.updateLecturaDisplay();

            // Cambiar a sección de lectura
            this.showSection('lectura-texto');
            this.updateBreadcrumb('Leyendo Texto');

            // Inicializar cronómetro (si existe)
            if (window.ReadingTimer) {
                this.readingTimer = new ReadingTimer();
                this.readingTimer.start();
            }

        } catch (error) {
            console.error('❌ Error iniciando lectura:', error);
            ErrorHandler.show('Error al iniciar la lectura', error);
        }
    }

    // Cargar PDF en el visor
    async loadPDFViewer() {
        try {
            if (!this.currentLectura.archivo_pdf_url) {
                throw new Error('URL del PDF no disponible');
            }

            const pdfViewer = document.getElementById('pdf-viewer');
            if (pdfViewer) {
                pdfViewer.src = this.currentLectura.archivo_pdf_url;
            }

        } catch (error) {
            console.error('❌ Error cargando PDF:', error);
            ErrorHandler.show('Error cargando el documento PDF', error);
        }
    }

    // Actualizar información de lectura en la sección de texto
    updateLecturaDisplay() {
        const tituloElement = document.getElementById('titulo-lectura');
        const autorElement = document.getElementById('autor-lectura');

        if (tituloElement) {
            tituloElement.textContent = this.currentLectura.titulo;
        }

        if (autorElement) {
            autorElement.textContent = this.currentLectura.autor || 'Autor no especificado';
        }
    }

    // Terminar lectura y continuar al vocabulario
    async terminarLectura() {
        try {
            // Calcular tiempo de lectura
            if (this.sessionData.startTime) {
                this.sessionData.tiempoLectura = Math.round((Date.now() - this.sessionData.startTime) / 1000);
            }

            console.log(`📊 Lectura terminada en ${this.sessionData.tiempoLectura} segundos`);

            // Detener cronómetro si existe
            if (this.readingTimer) {
                this.readingTimer.stop();
            }

            // Cargar vocabulario
            await this.loadVocabulario();

            // Cambiar a sección de vocabulario
            this.showSection('vocabulario-estudio');
            this.updateBreadcrumb('Estudiando Vocabulario');

        } catch (error) {
            console.error('❌ Error terminando lectura:', error);
            ErrorHandler.show('Error al procesar el final de la lectura', error);
        }
    }

    // Cargar vocabulario de la lectura
    async loadVocabulario() {
        try {
            console.log('📝 Cargando vocabulario...');

            const { data: vocabulario, error } = await supabaseClient
                .from('vocabulario')
                .select('*')
                .eq('lectura_id', this.currentLectura.id)
                .order('orden');

            if (error) {
                throw new Error(`Error cargando vocabulario: ${error.message}`);
            }

            if (!vocabulario || vocabulario.length === 0) {
                throw new Error('No hay vocabulario disponible para esta lectura');
            }

            // Mostrar vocabulario en la interfaz
            this.displayVocabulario(vocabulario);

            console.log(`✅ Vocabulario cargado: ${vocabulario.length} términos`);

        } catch (error) {
            console.error('❌ Error cargando vocabulario:', error);
            ErrorHandler.show('Error cargando el vocabulario', error);
            throw error;
        }
    }

    // Mostrar vocabulario en la interfaz
    displayVocabulario(vocabulario) {
        const vocabularioLista = document.getElementById('vocabulario-lista');
        if (!vocabularioLista) return;

        vocabularioLista.innerHTML = vocabulario.map(item => `
            <div class="vocabulario-item">
                <div class="vocabulario-palabra">${item.palabra}</div>
                <div class="vocabulario-definicion">${item.definicion}</div>
            </div>
        `).join('');

        // Actualizar contador de progreso
        const counter = document.getElementById('vocabulario-counter');
        if (counter) {
            counter.textContent = `${vocabulario.length} términos para estudiar`;
        }
    }

    // Mostrar sección específica
    showSection(sectionId) {
        // Ocultar todas las secciones
        document.querySelectorAll('.mlc-section').forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Mostrar sección específica
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            this.currentSection = sectionId;
        }

        // Scroll al top
        window.scrollTo(0, 0);
    }

    // Actualizar breadcrumb
    updateBreadcrumb(currentText = null) {
        const breadcrumbCurrent = document.getElementById('breadcrumb-current');
        if (breadcrumbCurrent && currentText) {
            breadcrumbCurrent.textContent = currentText;
        }
    }

    // Cerrar todos los paneles flotantes
    closeAllPanels() {
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }

        document.querySelectorAll('.floating-panel').forEach(panel => {
            panel.style.display = 'none';
        });
    }

    // Mostrar panel flotante
    showPanel(panelId) {
        const overlay = document.getElementById('overlay');
        const panel = document.getElementById(panelId);

        if (overlay && panel) {
            overlay.style.display = 'block';
            panel.style.display = 'block';
        }
    }

    // Calcular velocidad de lectura simple
    calcularVelocidadSimple() {
        if (!this.sessionData.tiempoLectura || !this.currentLectura.total_palabras) {
            return 0;
        }

        const tiempoMinutos = this.sessionData.tiempoLectura / 60;
        return Math.round(this.currentLectura.total_palabras / tiempoMinutos);
    }

    // Obtener datos de la sesión actual
    getSessionData() {
        return {
            ...this.sessionData,
            usuario_id: this.currentUser?.id,
            lectura_id: this.currentLectura?.id,
            velocidad_simple: this.calcularVelocidadSimple()
        };
    }

    // Limpiar datos de sesión
    clearSession() {
        this.sessionData = {
            tiempoLectura: 0,
            aciertosVocabulario: 0,
            aciertosComprension: 0,
            respuestasVocabulario: {},
            respuestasComprension: {},
            startTime: null
        };
    }

    // Método de utilidad para debugging
    getDebugInfo() {
        return {
            initialized: this.initialized,
            currentUser: this.currentUser?.nombre_completo,
            currentLectura: this.currentLectura?.titulo,
            currentSection: this.currentSection,
            sessionData: this.sessionData
        };
    }
}

// Hacer clase disponible globalmente
window.MLCModule = MLCModule;