// ===================================================
// TSP SISTEMA - CUESTIONARIO ENGINE
// Motor completo para el cuestionario de comprensión lectora
// ===================================================

class CuestionarioEngine {
    constructor(lecturaId) {
        this.lecturaId = lecturaId;
        this.preguntas = [];
        this.preguntaActual = 0;
        this.respuestas = {};
        this.tiempoInicio = null;
        this.tiemposPorPregunta = {};
        this.tiempoInicioPregunta = null;
        this.initialized = false;
        
        this.initializeElements();
        this.bindEvents();
    }

    // Inicializar referencias a elementos DOM
    initializeElements() {
        this.elements = {
            container: document.getElementById('pregunta-lectura-container'),
            progress: document.getElementById('cuestionario-progress'),
            counter: document.getElementById('cuestionario-counter'),
            btnAnterior: document.getElementById('btn-anterior-lectura'),
            btnSiguiente: document.getElementById('btn-siguiente-lectura'),
            btnVerTexto: document.getElementById('btn-ver-texto'),
            btnVerVocabulario: document.getElementById('btn-ver-vocabulario-cuestionario')
        };
    }

    // Configurar event listeners
    bindEvents() {
        // Navegación
        if (this.elements.btnAnterior) {
            this.elements.btnAnterior.addEventListener('click', () => {
                this.anteriorPregunta();
            });
        }

        if (this.elements.btnSiguiente) {
            this.elements.btnSiguiente.addEventListener('click', () => {
                this.siguientePregunta();
            });
        }

        // Botones de ayuda
        if (this.elements.btnVerTexto) {
            this.elements.btnVerTexto.addEventListener('click', () => {
                this.mostrarTextoFlotante();
            });
        }

        if (this.elements.btnVerVocabulario) {
            this.elements.btnVerVocabulario.addEventListener('click', () => {
                this.mostrarVocabularioFlotante();
            });
        }

        // Event delegation para opciones de respuesta
        if (this.elements.container) {
            this.elements.container.addEventListener('click', (e) => {
                this.handleContainerClick(e);
            });
        }
    }

    // Manejar clicks en el container
    handleContainerClick(e) {
        // Selección de opción
        const optionCard = e.target.closest('.option-card');
        if (optionCard) {
            this.seleccionarOpcion(optionCard);
            return;
        }

        // Botón de orientación
        if (e.target.id === 'btn-orientacion' || e.target.closest('#btn-orientacion')) {
            this.mostrarOrientacion();
            return;
        }
    }

    // Cargar preguntas del cuestionario
    async loadPreguntas() {
        try {
            console.log('📋 Cargando preguntas del cuestionario...');

            const { data, error } = await supabaseClient
                .from('preguntas_lectura')
                .select('*')
                .eq('lectura_id', this.lecturaId)
                .order('orden');

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error('No hay preguntas de comprensión disponibles para esta lectura');
            }

            this.preguntas = data;
            console.log(`✅ Preguntas cargadas: ${this.preguntas.length} preguntas`);
            
            this.initializeCuestionario();
            return this.preguntas;

        } catch (error) {
            console.error('❌ Error cargando preguntas:', error);
            ErrorHandler.show('Error cargando las preguntas del cuestionario', error);
            throw error;
        }
    }

    // Inicializar cuestionario
    initializeCuestionario() {
        this.tiempoInicio = Date.now();
        this.preguntaActual = 0;
        
        // Restaurar progreso si existe
        this.restaurarProgreso();
        
        // Mostrar primera pregunta
        this.mostrarPregunta(0);
        this.actualizarProgreso();
        this.actualizarNavegacion();
        
        this.initialized = true;
        console.log('🚀 Cuestionario inicializado');
    }

    // Mostrar pregunta específica
    mostrarPregunta(index) {
        if (index < 0 || index >= this.preguntas.length) return;
        
        // Registrar tiempo de la pregunta anterior
        if (this.preguntaActual !== index && this.tiempoInicioPregunta) {
            this.registrarTiempoPregunta(this.preguntaActual);
        }
        
        this.preguntaActual = index;
        this.tiempoInicioPregunta = Date.now();
        
        const pregunta = this.preguntas[index];
        
        if (this.elements.container) {
            this.elements.container.innerHTML = this.generarHTMLPregunta(pregunta, index);
        }
        
        // Restaurar respuesta si existe
        this.restaurarRespuesta(index);
        
        // Actualizar interfaz
        this.actualizarProgreso();
        this.actualizarNavegacion();
        
        // Auto-guardado
        this.guardarProgreso();
    }

    // Generar HTML para una pregunta
    generarHTMLPregunta(pregunta, index) {
        const respuestaGuardada = this.respuestas[pregunta.id];
        
        return `
            <div class="question-header">
                <span class="question-number">Pregunta ${index + 1} de ${this.preguntas.length}</span>
                ${pregunta.orientacion ? 
                    `<button id="btn-orientacion" class="btn btn-info btn-sm">
                        💡 Ver Orientación
                    </button>` : ''
                }
            </div>
            
            <div class="question-text">
                ${pregunta.pregunta}
            </div>
            
            <div class="question-options">
                ${this.generarOpciones(pregunta, respuestaGuardada)}
            </div>
        `;
    }

    // Generar opciones de respuesta
    generarOpciones(pregunta, respuestaSeleccionada) {
        const opciones = [
            { letra: 'A', texto: pregunta.opcion_a },
            { letra: 'B', texto: pregunta.opcion_b },
            { letra: 'C', texto: pregunta.opcion_c },
            { letra: 'D', texto: pregunta.opcion_d }
        ];

        return opciones.map(opcion => `
            <div class="option-card ${respuestaSeleccionada === opcion.letra ? 'selected' : ''}" 
                 data-option="${opcion.letra}"
                 data-pregunta-id="${pregunta.id}">
                <div class="option-letter">${opcion.letra}</div>
                <div class="option-text">${opcion.texto}</div>
            </div>
        `).join('');
    }

    // Seleccionar opción de respuesta
    seleccionarOpcion(optionCard) {
        const preguntaId = optionCard.dataset.preguntaId;
        const opcionSeleccionada = optionCard.dataset.option;
        
        // Remover selección anterior de esta pregunta
        const todasOpciones = this.elements.container.querySelectorAll(`[data-pregunta-id="${preguntaId}"]`);
        todasOpciones.forEach(card => card.classList.remove('selected'));
        
        // Agregar nueva selección
        optionCard.classList.add('selected');
        
        // Guardar respuesta
        this.respuestas[preguntaId] = opcionSeleccionada;
        
        // Auto-guardado
        this.guardarProgreso();
        
        // Feedback visual
        Toast.info(`Respuesta ${opcionSeleccionada} seleccionada`);
        
        console.log(`✅ Respuesta registrada: Pregunta ${preguntaId} = ${opcionSeleccionada}`);
    }

    // Restaurar respuesta guardada
    restaurarRespuesta(index) {
        const pregunta = this.preguntas[index];
        const respuestaGuardada = this.respuestas[pregunta.id];
        
        if (respuestaGuardada) {
            const optionCard = this.elements.container.querySelector(`[data-option="${respuestaGuardada}"]`);
            if (optionCard) {
                optionCard.classList.add('selected');
            }
        }
    }

    // Ir a pregunta anterior
    anteriorPregunta() {
        if (this.preguntaActual > 0) {
            this.mostrarPregunta(this.preguntaActual - 1);
        }
    }

    // Ir a siguiente pregunta
    siguientePregunta() {
        if (this.preguntaActual < this.preguntas.length - 1) {
            this.mostrarPregunta(this.preguntaActual + 1);
        } else {
            // Es la última pregunta, verificar si finalizar
            this.verificarFinalizacion();
        }
    }

    // Verificar si se puede finalizar el cuestionario
    verificarFinalizacion() {
        const preguntasSinResponder = this.preguntas.filter(p => !this.respuestas[p.id]);
        
        if (preguntasSinResponder.length > 0) {
            const mensaje = `Te faltan ${preguntasSinResponder.length} preguntas por responder. ¿Quieres revisarlas o finalizar de todas formas?`;
            
            mostrarConfirmacion(
                'Cuestionario Incompleto',
                mensaje,
                () => this.finalizarCuestionario()
            );
        } else {
            mostrarConfirmacion(
                '¿Finalizar Cuestionario?',
                'Has respondido todas las preguntas. ¿Estás seguro de que quieres finalizar?',
                () => this.finalizarCuestionario()
            );
        }
    }

    // Finalizar cuestionario
    async finalizarCuestionario() {
        try {
            console.log('🏁 Finalizando cuestionario...');
            
            // Registrar tiempo de la última pregunta
            this.registrarTiempoPregunta(this.preguntaActual);
            
            // Calcular resultados
            const resultados = this.calcularResultados();
            
            // Emitir evento personalizado con los resultados
            const evento = new CustomEvent('cuestionarioCompletado', {
                detail: resultados
            });
            document.dispatchEvent(evento);
            
            console.log('✅ Cuestionario finalizado:', resultados);
            return resultados;
            
        } catch (error) {
            console.error('❌ Error finalizando cuestionario:', error);
            ErrorHandler.show('Error al finalizar el cuestionario', error);
            throw error;
        }
    }

    // Calcular resultados del cuestionario
    calcularResultados() {
        let aciertosComprension = 0;
        const totalComprension = this.preguntas.length;
        const detalleRespuestas = [];

        this.preguntas.forEach((pregunta, index) => {
            const respuestaEstudiante = this.respuestas[pregunta.id];
            const esCorrecta = respuestaEstudiante === pregunta.respuesta_correcta;
            
            if (esCorrecta) aciertosComprension++;

            detalleRespuestas.push({
                pregunta_id: pregunta.id,
                pregunta_numero: index + 1,
                pregunta_texto: pregunta.pregunta,
                respuesta_estudiante: respuestaEstudiante || null,
                respuesta_correcta: pregunta.respuesta_correcta,
                es_correcta: esCorrecta,
                tiempo_respuesta_segundos: Math.round((this.tiemposPorPregunta[index] || 0) / 1000),
                retroalimentacion: pregunta.retroalimentacion
            });
        });

        const porcentajeComprension = totalComprension > 0 ? (aciertosComprension / totalComprension) * 100 : 0;
        const tiempoTotal = Date.now() - this.tiempoInicio;

        return {
            aciertosComprension,
            totalComprension,
            porcentajeComprension: porcentajeComprension.toFixed(1),
            tiempoTotalSegundos: Math.round(tiempoTotal / 1000),
            detalleRespuestas,
            preguntasRespondidas: Object.keys(this.respuestas).length
        };
    }

    // Registrar tiempo de pregunta
    registrarTiempoPregunta(index) {
        if (this.tiempoInicioPregunta && index >= 0 && index < this.preguntas.length) {
            const tiempoTranscurrido = Date.now() - this.tiempoInicioPregunta;
            this.tiemposPorPregunta[index] = (this.tiemposPorPregunta[index] || 0) + tiempoTranscurrido;
        }
    }

    // Actualizar barra de progreso
    actualizarProgreso() {
        const respondidas = Object.keys(this.respuestas).length;
        const total = this.preguntas.length;
        const porcentaje = total > 0 ? (respondidas / total) * 100 : 0;

        if (this.elements.progress) {
            this.elements.progress.style.width = `${porcentaje}%`;
        }

        if (this.elements.counter) {
            this.elements.counter.textContent = `Pregunta ${this.preguntaActual + 1} de ${total} (${respondidas} respondidas)`;
        }
    }

    // Actualizar botones de navegación
    actualizarNavegacion() {
        if (this.elements.btnAnterior) {
            this.elements.btnAnterior.disabled = this.preguntaActual === 0;
        }

        if (this.elements.btnSiguiente) {
            const esUltimaPregunta = this.preguntaActual === this.preguntas.length - 1;
            this.elements.btnSiguiente.textContent = esUltimaPregunta ? '🏁 Finalizar' : '➡️ Siguiente';
        }
    }

    // Mostrar orientación de la pregunta actual
    mostrarOrientacion() {
        const pregunta = this.preguntas[this.preguntaActual];
        if (!pregunta || !pregunta.orientacion) return;

        const panel = document.getElementById('panel-orientacion');
        const contenido = document.getElementById('orientacion-contenido');

        if (panel && contenido) {
            contenido.innerHTML = `
                <div class="orientacion-content">
                    <h4>💡 Orientación para la Pregunta ${this.preguntaActual + 1}</h4>
                    <p>${pregunta.orientacion}</p>
                </div>
            `;
            
            // Usar función global para mostrar panel
            if (window.showPanel) {
                window.showPanel('panel-orientacion');
            } else {
                panel.style.display = 'block';
                document.getElementById('overlay').style.display = 'block';
            }
        }
    }

    // Mostrar texto flotante
    mostrarTextoFlotante() {
        const panel = document.getElementById('panel-texto');
        const viewer = document.getElementById('texto-flotante-viewer');

        if (panel && viewer) {
            // Obtener URL del PDF de la lectura actual
            const mlcModule = window.mlcModule || window.currentMLCModule;
            if (mlcModule && mlcModule.currentLectura) {
                viewer.src = mlcModule.currentLectura.archivo_pdf_url;
            }
            
            if (window.showPanel) {
                window.showPanel('panel-texto');
            } else {
                panel.style.display = 'block';
                document.getElementById('overlay').style.display = 'block';
            }
        }
    }

    // Mostrar vocabulario flotante
    async mostrarVocabularioFlotante() {
        try {
            const panel = document.getElementById('panel-vocabulario');
            const lista = document.getElementById('vocabulario-flotante-lista');

            if (!panel || !lista) return;

            // Cargar vocabulario si no está cargado
            const { data: vocabulario, error } = await supabaseClient
                .from('vocabulario')
                .select('*')
                .eq('lectura_id', this.lecturaId)
                .order('orden');

            if (error) throw error;

            // Mostrar vocabulario
            lista.innerHTML = vocabulario.map(item => `
                <div class="vocabulario-item">
                    <div class="vocabulario-palabra">${item.palabra}</div>
                    <div class="vocabulario-definicion">${item.definicion}</div>
                </div>
            `).join('');

            if (window.showPanel) {
                window.showPanel('panel-vocabulario');
            } else {
                panel.style.display = 'block';
                document.getElementById('overlay').style.display = 'block';
            }

        } catch (error) {
            console.error('❌ Error mostrando vocabulario:', error);
            ErrorHandler.show('Error cargando vocabulario', error);
        }
    }

    // Guardar progreso en localStorage
    guardarProgreso() {
        try {
            const progreso = {
                lecturaId: this.lecturaId,
                preguntaActual: this.preguntaActual,
                respuestas: this.respuestas,
                tiemposPorPregunta: this.tiemposPorPregunta,
                tiempoInicio: this.tiempoInicio,
                timestamp: Date.now()
            };

            StorageUtils.set(`cuestionario_${this.lecturaId}`, progreso);
            
        } catch (error) {
            console.warn('No se pudo guardar el progreso:', error);
        }
    }

    // Restaurar progreso guardado
    restaurarProgreso() {
        try {
            const progreso = StorageUtils.get(`cuestionario_${this.lecturaId}`);
            
            if (progreso && progreso.respuestas) {
                this.respuestas = progreso.respuestas;
                this.tiemposPorPregunta = progreso.tiemposPorPregunta || {};
                
                console.log('📚 Progreso restaurado:', Object.keys(this.respuestas).length, 'respuestas');
            }
        } catch (error) {
            console.warn('No se pudo restaurar el progreso:', error);
        }
    }

    // Limpiar progreso guardado
    limpiarProgreso() {
        StorageUtils.remove(`cuestionario_${this.lecturaId}`);
    }

    // Obtener estadísticas del cuestionario
    getEstadisticas() {
        return {
            preguntaActual: this.preguntaActual + 1,
            totalPreguntas: this.preguntas.length,
            preguntasRespondidas: Object.keys(this.respuestas).length,
            porcentajeCompletado: ((Object.keys(this.respuestas).length / this.preguntas.length) * 100).toFixed(1),
            tiempoTranscurrido: this.tiempoInicio ? Math.round((Date.now() - this.tiempoInicio) / 1000) : 0
        };
    }
}

// Hacer disponible globalmente
window.CuestionarioEngine = CuestionarioEngine;