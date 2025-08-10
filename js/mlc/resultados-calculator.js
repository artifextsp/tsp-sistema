// ===================================================
// TSP SISTEMA - RESULTADOS CALCULATOR (BÁSICO)
// Calculadora de resultados - versión temporal
// ===================================================

class ResultadosCalculator {
    constructor(sesionData) {
        this.sesionData = sesionData;
        this.metricas = {};
        this.rankings = {};
    }

    // Calcular métricas completas de la sesión
    async calcularMetricasCompletas() {
        try {
            console.log('📊 Calculando métricas completas...');

            // Métricas básicas
            this.metricas = {
                velocidadSimple: this.sesionData.velocidadSimple || 0,
                porcentajeComprension: this.sesionData.porcentajeComprension || 0,
                velocidadEfectiva: this.calcularVelocidadEfectiva(),
                tiempoLectura: this.sesionData.tiempoLectura || 0,
                aciertosVocabulario: this.sesionData.aciertosVocabulario || 0,
                totalVocabulario: this.sesionData.totalVocabulario || 10,
                aciertosComprension: this.sesionData.aciertosComprension || 0,
                totalComprension: this.sesionData.totalComprension || 0
            };

            // Calcular rankings si hay usuario
            if (this.sesionData.usuario_id) {
                await this.calcularRankings();
            }

            console.log('✅ Métricas calculadas:', this.metricas);
            return this.metricas;

        } catch (error) {
            console.error('❌ Error calculando métricas:', error);
            ErrorHandler.show('Error calculando resultados', error);
            throw error;
        }
    }

    // Calcular velocidad efectiva
    calcularVelocidadEfectiva() {
        const velocidad = this.sesionData.velocidadSimple || 0;
        const comprension = this.sesionData.porcentajeComprension || 0;
        
        return velocidad * (comprension / 100);
    }

    // Calcular rankings (implementación básica)
    async calcularRankings() {
        try {
            // Por ahora, rankings simplificados
            // En el futuro usaremos la función SQL obtener_ranking_mlc
            
            this.rankings = {
                posicion: 1,
                total_estudiantes: 1,
                percentil: 100
            };

            console.log('📈 Rankings calculados (básico):', this.rankings);

        } catch (error) {
            console.warn('No se pudieron calcular rankings:', error);
            this.rankings = {
                posicion: 0,
                total_estudiantes: 0,
                percentil: 0
            };
        }
    }

    // Generar HTML de resultados
    generarHTMLResultados() {
        const metricas = this.metricas;
        
        return `
            <div class="metricas-grid">
                <div class="metrica-card velocidad">
                    <div class="metrica-icon">🏃‍♂️</div>
                    <div class="metrica-info">
                        <h3>Velocidad Simple</h3>
                        <div class="metrica-valor">${metricas.velocidadSimple.toFixed(1)}</div>
                        <div class="metrica-unidad">palabras por minuto</div>
                    </div>
                </div>

                <div class="metrica-card comprension">
                    <div class="metrica-icon">🎯</div>
                    <div class="metrica-info">
                        <h3>Comprensión Lectora</h3>
                        <div class="metrica-valor">${metricas.porcentajeComprension.toFixed(1)}%</div>
                        <div class="metrica-unidad">respuestas correctas</div>
                    </div>
                </div>

                <div class="metrica-card efectiva">
                    <div class="metrica-icon">⚡</div>
                    <div class="metrica-info">
                        <h3>Velocidad Efectiva</h3>
                        <div class="metrica-valor">${metricas.velocidadEfectiva.toFixed(1)}</div>
                        <div class="metrica-unidad">ppm × comprensión</div>
                    </div>
                </div>

                <div class="metrica-card tiempo">
                    <div class="metrica-icon">⏱️</div>
                    <div class="metrica-info">
                        <h3>Tiempo Total</h3>
                        <div class="metrica-valor">${this.formatearTiempo(metricas.tiempoLectura)}</div>
                        <div class="metrica-unidad">minutos de lectura</div>
                    </div>
                </div>

                <div class="metrica-card vocabulario">
                    <div class="metrica-icon">📝</div>
                    <div class="metrica-info">
                        <h3>Vocabulario</h3>
                        <div class="metrica-valor">${metricas.aciertosVocabulario}/${metricas.totalVocabulario}</div>
                        <div class="metrica-unidad">${((metricas.aciertosVocabulario/metricas.totalVocabulario)*100).toFixed(1)}% correcto</div>
                    </div>
                </div>

                <div class="metrica-card comprension-detalle">
                    <div class="metrica-icon">📋</div>
                    <div class="metrica-info">
                        <h3>Cuestionario</h3>
                        <div class="metrica-valor">${metricas.aciertosComprension}/${metricas.totalComprension}</div>
                        <div class="metrica-unidad">preguntas correctas</div>
                    </div>
                </div>
            </div>

            <div class="ranking-section">
                <h3>🏆 Tu Posición</h3>
                <div class="ranking-display">
                    <div class="ranking-position">#${this.rankings.posicion}</div>
                    <div class="ranking-details">
                        <p>de ${this.rankings.total_estudiantes} estudiantes</p>
                        <p>Percentil ${this.rankings.percentil}%</p>
                    </div>
                </div>
            </div>

            <div class="recomendaciones-section">
                <h3>💡 Recomendaciones</h3>
                <div class="recomendaciones-list">
                    ${this.generarRecomendaciones()}
                </div>
            </div>
        `;
    }

    // Generar recomendaciones personalizadas
    generarRecomendaciones() {
        const recomendaciones = [];
        const metricas = this.metricas;

        // Recomendaciones basadas en velocidad
        if (metricas.velocidadSimple < 150) {
            recomendaciones.push({
                icon: '🚀',
                titulo: 'Mejora tu Velocidad',
                texto: 'Practica lectura diaria para aumentar tu velocidad. Meta: 200+ ppm.'
            });
        }

        // Recomendaciones basadas en comprensión
        if (metricas.porcentajeComprension < 80) {
            recomendaciones.push({
                icon: '🎯',
                titulo: 'Fortalece tu Comprensión',
                texto: 'Tómate más tiempo para analizar el texto. Relee partes importantes.'
            });
        }

        // Recomendaciones basadas en vocabulario
        const porcentajeVocab = (metricas.aciertosVocabulario / metricas.totalVocabulario) * 100;
        if (porcentajeVocab < 80) {
            recomendaciones.push({
                icon: '📚',
                titulo: 'Amplía tu Vocabulario',
                texto: 'Dedica tiempo extra a estudiar nuevas palabras y sus significados.'
            });
        }

        // Recomendación por buen desempeño
        if (metricas.velocidadEfectiva > 150 && metricas.porcentajeComprension > 85) {
            recomendaciones.push({
                icon: '🌟',
                titulo: '¡Excelente Trabajo!',
                texto: 'Tu rendimiento es muy bueno. Sigue practicando para mantener este nivel.'
            });
        }

        // Si no hay recomendaciones específicas, agregar una general
        if (recomendaciones.length === 0) {
            recomendaciones.push({
                icon: '💪',
                titulo: 'Sigue Mejorando',
                texto: 'Cada sesión de lectura te ayuda a desarrollar mejores habilidades.'
            });
        }

        return recomendaciones.map(rec => `
            <div class="recomendacion-item">
                <div class="recomendacion-icon">${rec.icon}</div>
                <div class="recomendacion-content">
                    <h4>${rec.titulo}</h4>
                    <p>${rec.texto}</p>
                </div>
            </div>
        `).join('');
    }

    // Formatear tiempo en minutos y segundos
    formatearTiempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        
        if (minutos > 0) {
            return `${minutos}:${segs.toString().padStart(2, '0')}`;
        } else {
            return `${segs}s`;
        }
    }

    // Generar análisis detallado
    generarAnalisisDetallado() {
        const metricas = this.metricas;
        
        return `
            <div class="analisis-detallado">
                <h4>📊 Análisis Detallado de tu Sesión</h4>
                
                <div class="analisis-seccion">
                    <h5>📖 Análisis de Lectura</h5>
                    <ul>
                        <li><strong>Tiempo de lectura:</strong> ${this.formatearTiempo(metricas.tiempoLectura)}</li>
                        <li><strong>Velocidad simple:</strong> ${metricas.velocidadSimple.toFixed(1)} ppm</li>
                        <li><strong>Nivel de velocidad:</strong> ${this.evaluarVelocidad(metricas.velocidadSimple)}</li>
                    </ul>
                </div>

                <div class="analisis-seccion">
                    <h5>🎯 Análisis de Comprensión</h5>
                    <ul>
                        <li><strong>Comprensión general:</strong> ${metricas.porcentajeComprension.toFixed(1)}%</li>
                        <li><strong>Velocidad efectiva:</strong> ${metricas.velocidadEfectiva.toFixed(1)} ppm</li>
                        <li><strong>Nivel de comprensión:</strong> ${this.evaluarComprension(metricas.porcentajeComprension)}</li>
                    </ul>
                </div>

                <div class="analisis-seccion">
                    <h5>📝 Análisis de Vocabulario</h5>
                    <ul>
                        <li><strong>Aciertos:</strong> ${metricas.aciertosVocabulario} de ${metricas.totalVocabulario}</li>
                        <li><strong>Porcentaje:</strong> ${((metricas.aciertosVocabulario/metricas.totalVocabulario)*100).toFixed(1)}%</li>
                        <li><strong>Nivel:</strong> ${this.evaluarVocabulario(metricas.aciertosVocabulario, metricas.totalVocabulario)}</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // Evaluar nivel de velocidad
    evaluarVelocidad(velocidad) {
        if (velocidad >= 250) return 'Excelente';
        if (velocidad >= 200) return 'Muy bueno';
        if (velocidad >= 150) return 'Bueno';
        if (velocidad >= 100) return 'Regular';
        return 'Necesita mejorar';
    }

    // Evaluar nivel de comprensión
    evaluarComprension(porcentaje) {
        if (porcentaje >= 90) return 'Excelente';
        if (porcentaje >= 80) return 'Muy bueno';
        if (porcentaje >= 70) return 'Bueno';
        if (porcentaje >= 60) return 'Regular';
        return 'Necesita mejorar';
    }

    // Evaluar nivel de vocabulario
    evaluarVocabulario(aciertos, total) {
        const porcentaje = (aciertos / total) * 100;
        return this.evaluarComprension(porcentaje);
    }

    // Obtener datos para exportar
    getDataForExport() {
        return {
            timestamp: new Date().toISOString(),
            metricas: this.metricas,
            rankings: this.rankings,
            sesionData: this.sesionData
        };
    }
}

// Hacer disponible globalmente
window.ResultadosCalculator = ResultadosCalculator;