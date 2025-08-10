class ResultadosEngine {
    constructor(sesionData) {
        this.sesionData = sesionData;
        this.metricas = {};
        this.rankings = {};
    }

    async calcularMetricasCompletas() {
        // Obtener datos de la sesión MLC completa
        const velocidadSimple = this.sesionData.velocidadSimple;
        const porcentajeComprension = this.sesionData.porcentajeComprension;
        const velocidadEfectiva = velocidadSimple * (porcentajeComprension / 100);

        this.metricas = {
            velocidadSimple,
            porcentajeComprension,
            velocidadEfectiva,
            tiempoLectura: this.sesionData.tiempoLectura,
            aciertosVocabulario: this.sesionData.aciertosVocabulario,
            aciertosComprension: this.sesionData.aciertosComprension
        };

        // Calcular rankings
        await this.calcularRankings();
        
        return this.metricas;
    }

    async calcularRankings() {
        const usuario = await obtenerUsuarioActual();
        
        // Usar la función SQL existente para rankings
        const { data: rankingData } = await supabaseClient
            .rpc('obtener_ranking_mlc', {
                p_usuario_id: usuario.id,
                p_grado: usuario.grado,
                p_ciclo: usuario.ciclo_actual,
                p_metrica: 'velocidad_efectiva'
            });

        this.rankings = rankingData[0] || { posicion: 0, total_estudiantes: 0, percentil: 0 };
    }

    generarHTMLResultados() {
        return `
            <div class="resultados-header">
                <h2>🎉 ¡Felicitaciones! Sesión Completada</h2>
                <p>Has terminado exitosamente toda la actividad de lectura crítica</p>
            </div>

            <div class="metricas-grid">
                <div class="metrica-card velocidad">
                    <div class="metrica-icon">🏃‍♂️</div>
                    <div class="metrica-info">
                        <h3>Velocidad Simple</h3>
                        <div class="metrica-valor">${this.metricas.velocidadSimple.toFixed(1)}</div>
                        <div class="metrica-unidad">palabras por minuto</div>
                    </div>
                </div>

                <div class="metrica-card comprension">
                    <div class="metrica-icon">🎯</div>
                    <div class="metrica-info">
                        <h3>Comprensión</h3>
                        <div class="metrica-valor">${this.metricas.porcentajeComprension.toFixed(1)}%</div>
                        <div class="metrica-unidad">respuestas correctas</div>
                    </div>
                </div>

                <div class="metrica-card efectiva">
                    <div class="metrica-icon">⚡</div>
                    <div class="metrica-info">
                        <h3>Velocidad Efectiva</h3>
                        <div class="metrica-valor">${this.metricas.velocidadEfectiva.toFixed(1)}</div>
                        <div class="metrica-unidad">ppm × comprensión</div>
                    </div>
                </div>
            </div>

            <div class="ranking-section">
                <h3>🏆 Tu Posición en el Grado</h3>
                <div class="ranking-display">
                    <div class="ranking-position">#${this.rankings.posicion}</div>
                    <div class="ranking-details">
                        <p>de ${this.rankings.total_estudiantes} estudiantes</p>
                        <p>Percentil ${this.rankings.percentil}%</p>
                    </div>
                </div>
            </div>

            <div class="acciones-finales">
                <button id="btn-ver-detalle" class="btn btn-outline">
                    📊 Ver Análisis Detallado
                </button>
                <button id="btn-nueva-sesion" class="btn btn-primary">
                    🔄 Nueva Sesión
                </button>
                <button id="btn-dashboard" class="btn btn-secondary">
                    🏠 Ir al Dashboard
                </button>
            </div>
        `;
    }
}