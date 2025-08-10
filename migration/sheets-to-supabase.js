// =========================================================
// SHEETS-TO-SUPABASE.JS - Script de migración de datos
// Migra lecturas desde Google Sheets al formato Supabase
// =========================================================

/**
 * CONFIGURACIÓN DE MIGRACIÓN
 * 
 * Google Sheets ID: 15ZkG8e6h7sBbS4CIZXVMOpVAEJ_aJfu6NkiCerFbjXU
 * 
 * Estructura por columna (cada lectura en una columna):
 * - Filas 1-6: Metadatos básicos
 * - Filas 7-26: Vocabulario (término/definición alternados)
 * - Filas 27-86: 10 preguntas vocabulario (6 filas cada una)
 * - Fila 87+: Preguntas cuestionario (6 filas cada una, número variable)
 */

class SheetsToSupabaseMigrator {
    constructor(supabaseClient, sheetsApiKey) {
        this.supabase = supabaseClient;
        this.sheetsApiKey = sheetsApiKey;
        this.spreadsheetId = '15ZkG8e6h7sBbS4CIZXVMOpVAEJ_aJfu6NkiCerFbjXU';
        
        // Configuración de estructura
        this.estructura = {
            metadatos: { inicio: 1, fin: 6 },
            vocabulario: { inicio: 7, fin: 26 },
            preguntasVocab: { inicio: 27, fin: 86 },
            preguntasCuestionario: { inicio: 87 }
        };
        
        this.grados = ['PCL1', 'PCL2', 'PCL3', 'PCL4', 'PCL5', 'PCL6', 'PCL7', 'PCL8', 'PCL9', 'PCL10', 'PCL11'];
        this.columnas = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'];
        
        this.migrationLog = [];
        this.errores = [];
    }

    /**
     * Ejecuta la migración completa
     */
    async ejecutarMigracion() {
        console.log('🚀 Iniciando migración desde Google Sheets a Supabase...');
        
        try {
            // Verificar conexión a Supabase
            await this.verificarConexionSupabase();
            
            // Migrar por grado
            for (const grado of this.grados) {
                console.log(`📚 Procesando ${grado}...`);
                await this.migrarGrado(grado);
            }
            
            // Mostrar resumen
            this.mostrarResumenMigracion();
            
            return {
                exito: true,
                lecturasMigradas: this.migrationLog.length,
                errores: this.errores.length,
                log: this.migrationLog
            };
            
        } catch (error) {
            console.error('❌ Error en migración:', error);
            return {
                exito: false,
                error: error.message,
                errores: this.errores
            };
        }
    }

    /**
     * Verifica la conexión a Supabase
     */
    async verificarConexionSupabase() {
        try {
            const { data, error } = await this.supabase
                .from('usuarios')
                .select('count')
                .limit(1);
                
            if (error) throw error;
            console.log('✅ Conexión a Supabase verificada');
            
        } catch (error) {
            throw new Error(`Error conectando a Supabase: ${error.message}`);
        }
    }

    /**
     * Migra todas las lecturas de un grado específico
     */
    async migrarGrado(pestanaGrado) {
        try {
            const numeroGrado = parseInt(pestanaGrado.replace('PCL', ''));
            
            // Obtener datos de la pestaña
            const datosGrado = await this.obtenerDatosSheet(pestanaGrado);
            
            if (!datosGrado || datosGrado.length === 0) {
                console.log(`⚠️ No hay datos en ${pestanaGrado}`);
                return;
            }
            
            // Procesar cada columna (cada lectura)
            for (let colIndex = 0; colIndex < this.columnas.length; colIndex++) {
                const columna = this.columnas[colIndex];
                console.log(`   📖 Procesando lectura ${colIndex + 1} (Columna ${columna})`);
                
                try {
                    await this.procesarLectura(datosGrado, numeroGrado, colIndex, columna);
                } catch (error) {
                    console.error(`   ❌ Error en lectura ${colIndex + 1}:`, error.message);
                    this.errores.push({
                        grado: numeroGrado,
                        lectura: colIndex + 1,
                        columna: columna,
                        error: error.message
                    });
                }
            }
            
        } catch (error) {
            console.error(`❌ Error procesando grado ${pestanaGrado}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene datos de una pestaña específica
     */
    async obtenerDatosSheet(pestana) {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${pestana}!A1:U200?key=${this.sheetsApiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            return data.values || [];
            
        } catch (error) {
            throw new Error(`Error obteniendo datos de ${pestana}: ${error.message}`);
        }
    }

    /**
     * Procesa una lectura individual
     */
    async procesarLectura(datosGrado, numeroGrado, lecturaIndex, columna) {
        // Extraer columna específica
        const columnaData = this.extraerColumna(datosGrado, lecturaIndex);
        
        if (!columnaData || columnaData.length < 10 || !columnaData[0]) {
            console.log(`   ⏭️ Columna ${columna} vacía, omitiendo...`);
            return;
        }
        
        // Extraer metadatos
        const metadatos = this.extraerMetadatos(columnaData);
        
        // Verificar si la lectura tiene contenido válido
        if (!metadatos.titulo || metadatos.titulo.trim() === '') {
            console.log(`   ⏭️ Lectura sin título en columna ${columna}, omitiendo...`);
            return;
        }
        
        // Insertar lectura en Supabase
        const lecturaId = await this.insertarLectura(metadatos, numeroGrado, lecturaIndex + 1);
        
        // Extraer y insertar vocabulario
        const vocabulario = this.extraerVocabulario(columnaData);
        await this.insertarVocabulario(lecturaId, vocabulario);
        
        // Extraer e insertar preguntas de vocabulario
        const preguntasVocab = this.extraerPreguntasVocabulario(columnaData);
        await this.insertarPreguntasVocabulario(lecturaId, preguntasVocab);
        
        // Extraer e insertar preguntas de comprensión
        const preguntasComp = this.extraerPreguntasComprension(columnaData, metadatos.numPreguntasComp);
        await this.insertarPreguntasComprension(lecturaId, preguntasComp);
        
        // Log exitoso
        this.migrationLog.push({
            grado: numeroGrado,
            lectura: lecturaIndex + 1,
            columna: columna,
            titulo: metadatos.titulo,
            vocabulario: vocabulario.length,
            preguntasVocab: preguntasVocab.length,
            preguntasComp: preguntasComp.length,
            id: lecturaId
        });
        
        console.log(`   ✅ Lectura "${metadatos.titulo}" migrada exitosamente`);
    }

    /**
     * Extrae una columna específica de los datos
     */
    extraerColumna(datosGrado, columnaIndex) {
        const columna = [];
        
        for (let fila of datosGrado) {
            columna.push(fila[columnaIndex] || '');
        }
        
        return columna;
    }

    /**
     * Extrae metadatos de la lectura (filas 1-6)
     */
    extraerMetadatos(columnaData) {
        return {
            titulo: (columnaData[0] || '').trim(),
            autor: (columnaData[1] || '').trim(),
            anio: (columnaData[2] || '').trim(),
            totalPalabras: parseInt(columnaData[3] || '0') || 0,
            gradoObjetivo: (columnaData[4] || '').trim(),
            numPreguntasComp: parseInt(columnaData[5] || '10') || 10,
            contexto: this.generarContextoIntroduccion(columnaData[0], columnaData[1])
        };
    }

    /**
     * Genera un contexto de introducción básico
     */
    generarContextoIntroduccion(titulo, autor) {
        if (!titulo) return '';
        
        return `Te presentamos la lectura "${titulo}"${autor ? ` del autor ${autor}` : ''}. Lee con atención y concentración, ya que después responderás preguntas sobre su contenido. Toma tu tiempo para comprender bien el texto.`;
    }

    /**
     * Extrae vocabulario (filas 7-26, alternando término/definición)
     */
    extraerVocabulario(columnaData) {
        const vocabulario = [];
        
        for (let i = 6; i < 26; i += 2) { // Filas 7-26 (índices 6-25)
            const termino = (columnaData[i] || '').trim();
            const definicion = (columnaData[i + 1] || '').trim();
            
            if (termino && definicion) {
                vocabulario.push({
                    palabra: termino,
                    definicion: definicion,
                    orden: Math.floor((i - 6) / 2) + 1
                });
            }
        }
        
        return vocabulario;
    }

    /**
     * Extrae preguntas de vocabulario (filas 27-86, 6 filas por pregunta)
     */
    extraerPreguntasVocabulario(columnaData) {
        const preguntas = [];
        
        for (let i = 26; i < 86; i += 6) { // Filas 27-86 (índices 26-85)
            const pregunta = (columnaData[i] || '').trim();
            const opcionA = (columnaData[i + 1] || '').trim();
            const opcionB = (columnaData[i + 2] || '').trim();
            const opcionC = (columnaData[i + 3] || '').trim();
            const opcionD = (columnaData[i + 4] || '').trim();
            const respuestaCorrecta = (columnaData[i + 5] || '').trim().toUpperCase();
            
            if (pregunta && opcionA && opcionB && opcionC && opcionD && respuestaCorrecta) {
                preguntas.push({
                    pregunta: pregunta,
                    opcion_a: opcionA,
                    opcion_b: opcionB,
                    opcion_c: opcionC,
                    opcion_d: opcionD,
                    respuesta_correcta: respuestaCorrecta,
                    retroalimentacion: null,
                    orden: Math.floor((i - 26) / 6) + 1
                });
            }
        }
        
        return preguntas;
    }

    /**
     * Extrae preguntas de comprensión (fila 87+, 6 filas por pregunta)
     */
    extraerPreguntasComprension(columnaData, numPreguntas) {
        const preguntas = [];
        const inicioIndice = 86; // Fila 87 (índice 86)
        
        for (let p = 0; p < numPreguntas; p++) {
            const i = inicioIndice + (p * 6);
            
            if (i + 5 >= columnaData.length) break;
            
            const pregunta = (columnaData[i] || '').trim();
            const opcionA = (columnaData[i + 1] || '').trim();
            const opcionB = (columnaData[i + 2] || '').trim();
            const opcionC = (columnaData[i + 3] || '').trim();
            const opcionD = (columnaData[i + 4] || '').trim();
            const respuestaCorrecta = (columnaData[i + 5] || '').trim().toUpperCase();
            
            if (pregunta && opcionA && opcionB && opcionC && opcionD && respuestaCorrecta) {
                preguntas.push({
                    pregunta: pregunta,
                    opcion_a: opcionA,
                    opcion_b: opcionB,
                    opcion_c: opcionC,
                    opcion_d: opcionD,
                    respuesta_correcta: respuestaCorrecta,
                    orientacion: 'Lee cuidadosamente la pregunta y todas las opciones antes de responder.',
                    retroalimentacion: 'Revisa el texto para confirmar tu respuesta.',
                    orden: p + 1
                });
            }
        }
        
        return preguntas;
    }

    /**
     * Inserta una lectura en Supabase
     */
    async insertarLectura(metadatos, grado, ordenLectura) {
        try {
            const { data, error } = await this.supabase
                .from('lecturas')
                .insert({
                    grado: grado,
                    ciclo: 1, // Por ahora, todas van al ciclo 1
                    titulo: metadatos.titulo,
                    autor: metadatos.autor || null,
                    anio: metadatos.anio || null,
                    total_palabras: metadatos.totalPalabras,
                    archivo_pdf_url: `grado-${grado}/ciclo-1/lectura-${ordenLectura}-${this.generarNombreArchivo(metadatos.titulo)}.pdf`,
                    contexto_introduccion: metadatos.contexto,
                    estado: 'ACTIVA',
                    orden_en_ciclo: ordenLectura
                })
                .select('id')
                .single();
                
            if (error) throw error;
            
            return data.id;
            
        } catch (error) {
            throw new Error(`Error insertando lectura: ${error.message}`);
        }
    }

    /**
     * Genera nombre de archivo PDF basado en el título
     */
    generarNombreArchivo(titulo) {
        return titulo
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
    }

    /**
     * Inserta vocabulario en Supabase
     */
    async insertarVocabulario(lecturaId, vocabulario) {
        if (vocabulario.length === 0) return;
        
        try {
            const datosVocabulario = vocabulario.map(item => ({
                lectura_id: lecturaId,
                palabra: item.palabra,
                definicion: item.definicion,
                orden: item.orden
            }));
            
            const { error } = await this.supabase
                .from('vocabulario')
                .insert(datosVocabulario);
                
            if (error) throw error;
            
        } catch (error) {
            throw new Error(`Error insertando vocabulario: ${error.message}`);
        }
    }

    /**
     * Inserta preguntas de vocabulario en Supabase
     */
    async insertarPreguntasVocabulario(lecturaId, preguntas) {
        if (preguntas.length === 0) return;
        
        try {
            const datosPreguntas = preguntas.map(pregunta => ({
                lectura_id: lecturaId,
                pregunta: pregunta.pregunta,
                opcion_a: pregunta.opcion_a,
                opcion_b: pregunta.opcion_b,
                opcion_c: pregunta.opcion_c,
                opcion_d: pregunta.opcion_d,
                respuesta_correcta: pregunta.respuesta_correcta,
                retroalimentacion: pregunta.retroalimentacion,
                orden: pregunta.orden
            }));
            
            const { error } = await this.supabase
                .from('preguntas_vocabulario')
                .insert(datosPreguntas);
                
            if (error) throw error;
            
        } catch (error) {
            throw new Error(`Error insertando preguntas de vocabulario: ${error.message}`);
        }
    }

    /**
     * Inserta preguntas de comprensión en Supabase
     */
    async insertarPreguntasComprension(lecturaId, preguntas) {
        if (preguntas.length === 0) return;
        
        try {
            const datosPreguntas = preguntas.map(pregunta => ({
                lectura_id: lecturaId,
                pregunta: pregunta.pregunta,
                opcion_a: pregunta.opcion_a,
                opcion_b: pregunta.opcion_b,
                opcion_c: pregunta.opcion_c,
                opcion_d: pregunta.opcion_d,
                respuesta_correcta: pregunta.respuesta_correcta,
                orientacion: pregunta.orientacion,
                retroalimentacion: pregunta.retroalimentacion,
                orden: pregunta.orden
            }));
            
            const { error } = await this.supabase
                .from('preguntas_lectura')
                .insert(datosPreguntas);
                
            if (error) throw error;
            
        } catch (error) {
            throw new Error(`Error insertando preguntas de comprensión: ${error.message}`);
        }
    }

    /**
     * Muestra resumen de la migración
     */
    mostrarResumenMigracion() {
        console.log('\n📊 RESUMEN DE MIGRACIÓN');
        console.log('=======================');
        console.log(`✅ Lecturas migradas: ${this.migrationLog.length}`);
        console.log(`❌ Errores: ${this.errores.length}`);
        
        if (this.migrationLog.length > 0) {
            console.log('\n📚 Lecturas migradas por grado:');
            const porGrado = this.migrationLog.reduce((acc, item) => {
                acc[item.grado] = (acc[item.grado] || 0) + 1;
                return acc;
            }, {});
            
            Object.entries(porGrado).forEach(([grado, cantidad]) => {
                console.log(`   Grado ${grado}°: ${cantidad} lecturas`);
            });
        }
        
        if (this.errores.length > 0) {
            console.log('\n❌ Errores encontrados:');
            this.errores.forEach(error => {
                console.log(`   Grado ${error.grado}°, Lectura ${error.lectura}: ${error.error}`);
            });
        }
        
        console.log('\n🎉 Migración completada!');
    }

    /**
     * Limpia y resetea la base de datos (CUIDADO: BORRA TODO)
     */
    async limpiarBaseDatos() {
        console.log('⚠️ LIMPIANDO BASE DE DATOS...');
        
        try {
            // Borrar en orden inverso por dependencias
            await this.supabase.from('respuestas_detalle').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await this.supabase.from('sesiones_mlc').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await this.supabase.from('preguntas_lectura').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await this.supabase.from('preguntas_vocabulario').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await this.supabase.from('vocabulario').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await this.supabase.from('lecturas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            
            console.log('✅ Base de datos limpiada');
            
        } catch (error) {
            console.error('❌ Error limpiando base de datos:', error);
            throw error;
        }
    }
}

// =========================================================
// SCRIPT DE EJECUCIÓN
// =========================================================

/**
 * Función principal para ejecutar la migración
 */
async function ejecutarMigracion() {
    // Configurar Supabase
    const supabaseUrl = 'https://kryqjsncqsopjuwymhqd.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeXFqc25jcXNvcGp1d3ltaHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjM3MDEsImV4cCI6MjA2ODg5OTcwMX0.w5HiaFiqlFJ_3QbcprUrufsOXTDWFg1zUMl2J7kWD6Y';
    
    // IMPORTANTE: Necesitas una API Key de Google Sheets
    const sheetsApiKey = 'TU_GOOGLE_SHEETS_API_KEY'; // Reemplazar con tu API Key
    
    const supabase = window.supabase?.createClient(supabaseUrl, supabaseKey);
    
    if (!supabase) {
        console.error('❌ Supabase no está disponible');
        return;
    }
    
    if (sheetsApiKey === 'TU_GOOGLE_SHEETS_API_KEY') {
        console.error('❌ Debes configurar tu Google Sheets API Key');
        return;
    }
    
    // Crear migrador
    const migrador = new SheetsToSupabaseMigrator(supabase, sheetsApiKey);
    
    // Confirmar antes de limpiar (opcional)
    const limpiar = confirm('¿Quieres limpiar la base de datos antes de migrar? (CUIDADO: Esto borrará todos los datos existentes)');
    
    if (limpiar) {
        await migrador.limpiarBaseDatos();
    }
    
    // Ejecutar migración
    const resultado = await migrador.ejecutarMigracion();
    
    if (resultado.exito) {
        console.log('🎉 Migración completada exitosamente!');
        console.log(`📊 ${resultado.lecturasMigradas} lecturas migradas`);
        if (resultado.errores > 0) {
            console.log(`⚠️ ${resultado.errores} errores encontrados`);
        }
    } else {
        console.error('❌ Migración falló:', resultado.error);
    }
    
    return resultado;
}

// Exportar para uso
window.SheetsToSupabaseMigrator = SheetsToSupabaseMigrator;
window.ejecutarMigracion = ejecutarMigracion;

// =========================================================
// INSTRUCCIONES DE USO
// =========================================================

/*
PASOS PARA USAR ESTE SCRIPT:

1. Obtener Google Sheets API Key:
   - Ir a https://console.developers.google.com/
   - Crear nuevo proyecto o seleccionar existente
   - Habilitar "Google Sheets API"
   - Crear credenciales (API Key)
   - Copiar la API Key y reemplazar en el script

2. Configurar permisos del Google Sheet:
   - El sheet debe ser público o compartido con el proyecto de Google Cloud

3. Ejecutar migración:
   - Abrir consola del navegador en tu sitio
   - Ejecutar: ejecutarMigracion()
   - Confirmar o denegar el limpiado de base de datos
   - Esperar a que complete

4. Verificar resultados:
   - Revisar la consola para ver el progreso
   - Verificar en Supabase que los datos se insertaron correctamente

ESTRUCTURA ESPERADA EN GOOGLE SHEETS:
- Cada grado en su propia pestaña (PCL1, PCL2, etc.)
- Cada lectura en una columna (B, C, D, etc.)
- Filas 1-6: Metadatos
- Filas 7-26: Vocabulario
- Filas 27-86: Preguntas vocabulario
- Fila 87+: Preguntas comprensión

NOTAS IMPORTANTES:
- El script maneja errores graciosamente
- Lecturas vacías se omiten automáticamente
- Se genera log completo de la migración
- Los PDFs deben subirse manualmente a Supabase Storage después
*/