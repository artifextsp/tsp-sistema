# 🛠️ PROBLEMAS SOLUCIONADOS - TSP Sistema

## Índice

- [Problemas de Autenticación](#problemas-de-autenticación)
- [Problemas con PDFs](#problemas-con-pdfs)
- [Problemas de Base de Datos](#problemas-de-base-de-datos)
- [Problemas de Cronómetro](#problemas-de-cronómetro)
- [Problemas de Navegación](#problemas-de-navegación)
- [Problemas de Responsive Design](#problemas-de-responsive-design)
- [Problemas de Performance](#problemas-de-performance)
- [Mejores Prácticas Implementadas](#mejores-prácticas-implementadas)

---

## Problemas de Autenticación

### ❌ **Problema**: Pérdida de sesión al recargar página

**Síntomas**: Usuario logueado pierde sesión al refresh
**Causa**: No persistencia en localStorage
**Solución**:

```javascript
// En cada carga de página
const currentUser = JSON.parse(
  localStorage.getItem("tsp_current_user") || "null"
);
if (!currentUser) {
  window.location.href = "../index.html";
  return;
}
```

**Archivos afectados**: `mlc-module.js`, `dashboard.js`
**Fecha resuelto**: Durante desarrollo inicial

### ❌ **Problema**: Códigos de acceso duplicados

**Síntomas**: Conflictos al generar códigos aleatorios
**Causa**: Función de generación sin verificación de unicidad
**Solución**:

```sql
-- Función SQL para generar códigos únicos
CREATE OR REPLACE FUNCTION generar_codigo_estudiante()
RETURNS VARCHAR(10) AS $$
DECLARE
    codigo VARCHAR(10);
    existe BOOLEAN;
BEGIN
    LOOP
        codigo := (
            chr(65 + floor(random() * 26)::int) ||
            chr(65 + floor(random() * 26)::int) ||
            lpad(floor(random() * 10000)::text, 4, '0')
        );
        SELECT EXISTS(SELECT 1 FROM usuarios WHERE codigo_acceso = codigo) INTO existe;
        IF NOT existe THEN EXIT; END IF;
    END LOOP;
    RETURN codigo;
END;
$$ LANGUAGE plpgsql;
```

**Archivos afectados**: `base_datos.sql`
**Fecha resuelto**: Durante setup de BD

---

## Problemas con PDFs

### ❌ **Problema**: PDFs no cargan en algunos navegadores

**Síntomas**: Iframe vacío o error de carga
**Causa**: Falta de soporte nativo PDF o CORS
**Solución**:

```javascript
// Sistema de fallback en pdf-manager.js
verificarCargaIframe(iframe) {
    setTimeout(() => {
        try {
            if (!iframe.contentDocument) {
                // PDF probablemente cargó (cross-origin es normal)
                this.mostrarEstadoExito();
                return;
            }
        } catch (error) {
            // Error cross-origin esperado, PDF cargó
            this.mostrarEstadoExito();
        }
    }, 3000);
}

mostrarFallbackPdf() {
    const iframe = document.getElementById('pdf-iframe');
    const fallback = document.getElementById('pdf-fallback');

    if (iframe) iframe.style.display = 'none';
    if (fallback) fallback.style.display = 'block';
}
```

**Archivos afectados**: `pdf-manager.js`
**Fecha resuelto**: Durante desarrollo MLC

### ❌ **Problema**: PDFs muy lentos en carga inicial

**Síntomas**: Timeout o experiencia lenta
**Causa**: URLs directas sin optimización
**Solución**:

- Usar `loading="lazy"` en iframes
- Implementar preload de PDFs críticos
- Mostrar indicadores de carga

```javascript
<iframe
  src="${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1"
  loading="lazy"
  title="Lectura: ${lecturaData.titulo}"
></iframe>
```

**Archivos afectados**: `pdf-manager.js`
**Fecha resuelto**: Durante optimización

### ❌ **Problema**: Pantalla completa no funciona en móviles

**Síntomas**: Botón de pantalla completa sin efecto
**Causa**: Restricciones de navegadores móviles
**Solución**:

```javascript
abrirPantallaCompleta(pdfUrl) {
    // Detección de dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        // En móviles, abrir en nueva pestaña
        window.open(pdfUrl, '_blank');
    } else {
        // En desktop, usar fullscreen API
        window.open(pdfUrl, '_blank', 'fullscreen=yes,scrollbars=yes');
    }
}
```

**Archivos afectados**: `pdf-manager.js`
**Fecha resuelto**: Durante testing móvil

---

## Problemas de Base de Datos

### ❌ **Problema**: Errores de conexión intermitentes

**Síntomas**: Fallos aleatorios en queries
**Causa**: Límites de rate limiting o conexión inestable
**Solución**:

```javascript
// Sistema de reintentos automáticos
window.safeAsync = async function (
  asyncFunction,
  fallback = null,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFunction();
    } catch (error) {
      if (attempt === maxRetries) {
        window.errorHandler.handleSupabaseError(error);
        return fallback;
      }
      // Esperar antes del siguiente intento
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
};
```

**Archivos afectados**: `error-handler.js`
**Fecha resuelto**: Durante desarrollo módulos

### ❌ **Problema**: Queries lentas con muchos datos

**Síntomas**: Timeouts en consultas complejas
**Causa**: Falta de índices apropiados
**Solución**:

```sql
-- Índices críticos para performance
CREATE INDEX idx_sesiones_mlc_usuario_fecha ON sesiones_mlc(usuario_id, fecha_sesion);
CREATE INDEX idx_lecturas_grado_ciclo_estado ON lecturas(grado, ciclo, estado);
CREATE INDEX idx_usuarios_codigo_estado ON usuarios(codigo_acceso, estado);
```

**Archivos afectados**: `base_datos.sql`
**Fecha resuelto**: Durante optimización BD

### ❌ **Problema**: Pérdida de datos en transacciones

**Síntomas**: Datos parcialmente guardados
**Causa**: Errores no manejados en inserts múltiples
**Solución**:

```javascript
// Transacciones explícitas para datos críticos
async guardarSesionCompleta(sesionData) {
    const { data, error } = await this.supabase.rpc('guardar_sesion_transaccion', {
        p_sesion_data: sesionData,
        p_respuestas_data: respuestasData
    });

    if (error) throw error;
    return data;
}
```

**Archivos afectados**: `mlc-module.js`
**Fecha resuelto**: Durante desarrollo evaluaciones

---

## Problemas de Cronómetro

### ❌ **Problema**: Cronómetro se resetea al cambiar de pestaña

**Síntomas**: Pérdida de tiempo registrado
**Causa**: Page visibility events no manejados
**Solución**:

```javascript
// Detección automática de cambios de pestaña
initializeVisibilityDetection() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.isRunning && !this.isPaused) {
            this.autoPause('tab_hidden');
        } else if (!document.hidden && this.isPaused && this.pauseReason === 'tab_hidden') {
            this.autoResume();
        }
    });
}
```

**Archivos afectados**: `reading-timer.js`
**Fecha resuelto**: Durante desarrollo cronómetro

### ❌ **Problema**: Tiempo impreciso en sesiones largas

**Síntomas**: Drift en cronómetro JavaScript
**Causa**: setInterval no es preciso a largo plazo
**Solución**:

```javascript
// Usar timestamps reales en lugar de contadores
getCurrentTime() {
    if (!this.isRunning) return null;

    const now = Date.now();
    let totalTime = now - this.startTime;
    let pausedTime = this.pausedTime;

    if (this.isPaused) {
        pausedTime += now - this.pauseStart;
    }

    const activeTime = totalTime - pausedTime;
    return {
        activeTimeMs: activeTime,
        totalTimeSeconds: Math.round(activeTime / 1000)
    };
}
```

**Archivos afectados**: `reading-timer.js`
**Fecha resuelto**: Durante testing precisión

### ❌ **Problema**: Estado del cronómetro se pierde al recargar

**Síntomas**: Cronómetro vuelve a cero
**Causa**: No persistencia en localStorage
**Solución**:

```javascript
// Auto-save del estado del cronómetro
saveToStorage() {
    try {
        const state = {
            startTime: this.startTime,
            pausedTime: this.pausedTime,
            isRunning: this.isRunning,
            isPaused: this.isPaused
        };
        localStorage.setItem('tsp_reading_timer', JSON.stringify(state));
    } catch (error) {
        console.warn('No se pudo guardar estado del timer:', error);
    }
}
```

**Archivos afectados**: `reading-timer.js`
**Fecha resuelto**: Durante testing recuperación

---

## Problemas de Navegación

### ❌ **Problema**: Navegación entre preguntas pierde respuestas

**Síntomas**: Respuestas desaparecen al navegar
**Causa**: Estado no persistido entre cambios
**Solución**:

```javascript
// Persistir respuestas antes de cambiar pregunta
navegarVocabulario(direccion) {
    // Guardar respuesta actual
    const respuestaActual = document.querySelector('input[name="vocab-answer"]:checked')?.value;
    if (respuestaActual) {
        this.respuestasVocabulario[this.currentVocabIndex] = respuestaActual;
    }

    // Cambiar índice
    const nuevoIndex = this.currentVocabIndex + direccion;
    if (nuevoIndex >= 0 && nuevoIndex < this.preguntasVocabulario.length) {
        this.currentVocabIndex = nuevoIndex;
        this.mostrarPreguntaVocabulario();
    }
}
```

**Archivos afectados**: `mlc-module.js`
**Fecha resuelto**: Durante desarrollo evaluaciones

### ❌ **Problema**: Botones de navegación en estado inconsistente

**Síntomas**: Botones habilitados cuando no deberían
**Causa**: Lógica de validación incompleta
**Solución**:

```javascript
// Validación completa del estado de navegación
actualizarNavegacionVocabulario() {
    const btnAnterior = document.getElementById('btn-anterior-vocab');
    const btnSiguiente = document.getElementById('btn-siguiente-vocab');
    const btnTerminar = document.getElementById('btn-terminar-vocab');

    btnAnterior.disabled = this.currentVocabIndex === 0;

    const tieneRespuesta = this.respuestasVocabulario[this.currentVocabIndex];
    const esUltima = this.currentVocabIndex === this.preguntasVocabulario.length - 1;

    if (esUltima) {
        btnSiguiente.style.display = 'none';
        btnTerminar.style.display = tieneRespuesta ? 'inline-block' : 'none';
    } else {
        btnSiguiente.style.display = 'inline-block';
        btnSiguiente.disabled = !tieneRespuesta;
        btnTerminar.style.display = 'none';
    }
}
```

**Archivos afectados**: `mlc-module.js`
**Fecha resuelto**: Durante testing UX

---

## Problemas de Responsive Design

### ❌ **Problema**: Interfaz rota en pantallas pequeñas

**Síntomas**: Elementos superpuestos en móviles
**Causa**: Grid layouts rígidos
**Solución**:

```css
/* Grid responsive mejorado */
.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .metadata-grid {
    grid-template-columns: 1fr;
  }

  .phase-header {
    flex-direction: column;
    text-align: center;
  }
}
```

**Archivos afectados**: `mlc-module.css`
**Fecha resuelto**: Durante desarrollo CSS

### ❌ **Problema**: Cronómetro no visible en móviles

**Síntomas**: Timer cortado o superpuesto
**Causa**: Fixed positioning problemático
**Solución**:

```css
/* Timer responsive */
.timer-container {
  min-width: 200px;
}

@media (max-width: 768px) {
  .timer-container {
    min-width: auto;
    width: 100%;
  }

  .timer-display {
    justify-content: center;
  }
}
```

**Archivos afectados**: `mlc-module.css`
**Fecha resuelto**: Durante testing móvil

### ❌ **Problema**: Modales no adaptan a pantalla móvil

**Síntomas**: Modales cortados o muy pequeños
**Causa**: Tamaños fijos en CSS
**Solución**:

```css
/* Modales responsive */
.modal-content {
  max-width: 90vw;
  max-height: 90vh;
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 95vw;
    margin: 1rem;
  }
}
```

**Archivos afectados**: `mlc-module.css`
**Fecha resuelto**: Durante testing dispositivos

---

## Problemas de Performance

### ❌ **Problema**: Carga lenta inicial del módulo

**Síntomas**: Demora en mostrar contenido
**Causa**: Múltiples queries síncronas
**Solución**:

```javascript
// Carga paralela de datos
async cargarDatosIniciales() {
    try {
        const [lectura, vocabulario, preguntas] = await Promise.all([
            this.pdfManager.obtenerLecturaAsignada(this.user.id),
            this.cargarVocabulario(),
            this.cargarPreguntas()
        ]);

        this.procesarDatosCargados(lectura, vocabulario, preguntas);
    } catch (error) {
        this.manejarErrorCarga(error);
    }
}
```

**Archivos afectados**: `mlc-module.js`
**Fecha resuelto**: Durante optimización

### ❌ **Problema**: Memoria consumida por PDFs múltiples

**Síntomas**: Navegador lento con uso prolongado
**Causa**: Referencias a iframes no liberadas
**Solución**:

```javascript
// Limpieza explícita de recursos
destroy() {
    if (this.currentPdfViewer && this.currentPdfViewer.container) {
        this.currentPdfViewer.container.innerHTML = '';
    }
    this.currentPdfViewer = null;
    this.loadingStates.clear();

    // Limpiar event listeners
    document.removeEventListener('visibilitychange', this.visibilityHandler);
}
```

**Archivos afectados**: `pdf-manager.js`
**Fecha resuelto**: Durante testing extenso

---

## Mejores Prácticas Implementadas

### ✅ **Gestión de Estados**

```javascript
// Estado centralizado por módulo
class MLCModule {
  constructor(currentUser) {
    this.state = {
      currentPhase: "info",
      lectura: null,
      timer: null,
      respuestas: {},
      progress: 0,
    };
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.persistState();
  }
}
```

### ✅ **Manejo de Errores Gracioso**

```javascript
// Wrapper para operaciones críticas
window.safeAsync = async function (asyncFunction, fallback = null) {
  try {
    return await asyncFunction();
  } catch (error) {
    window.errorHandler.handleSupabaseError(error);
    return fallback;
  }
};
```

### ✅ **Validación de Datos Defensiva**

```javascript
// Validación robusta de respuestas
function validarRespuesta(respuesta, pregunta) {
  if (!respuesta || typeof respuesta !== "string") {
    throw new Error("Respuesta inválida");
  }

  if (!["A", "B", "C", "D"].includes(respuesta.toUpperCase())) {
    throw new Error("Opción de respuesta inválida");
  }

  return respuesta.toUpperCase();
}
```

### ✅ **Logging Comprensivo**

```javascript
// Sistema de logs para debugging
class Logger {
  static log(level, module, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
    };

    console[level](entry);

    // En producción, enviar a sistema de monitoreo
    if (window.location.hostname !== "localhost") {
      this.sendToMonitoring(entry);
    }
  }
}
```

### ✅ **Componentización**

```javascript
// Componentes reutilizables
class UIComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.state = {};
    this.events = {};
  }

  render() {
    this.container.innerHTML = this.template();
    this.bindEvents();
  }

  template() {
    // Override en clases hijas
    return "";
  }
}
```

### ✅ **Optimización de Consultas**

```sql
-- Queries optimizadas con índices
EXPLAIN ANALYZE
SELECT l.*, COUNT(pv.id) as total_vocab
FROM lecturas l
LEFT JOIN vocabulario pv ON l.id = pv.lectura_id
WHERE l.grado = $1 AND l.ciclo = $2 AND l.estado = 'ACTIVA'
GROUP BY l.id
ORDER BY l.orden_en_ciclo;
```

---

## 📋 Checklist de Problemas Comunes

### Antes de reportar un bug:

- [ ] ¿Se reproduce en múltiples navegadores?
- [ ] ¿Hay errores en la consola del navegador?
- [ ] ¿Está la conexión a internet estable?
- [ ] ¿Se probó en modo incógnito?
- [ ] ¿Los datos en Supabase están correctos?

### Información a incluir en reporte:

- Navegador y versión
- Dispositivo (móvil/desktop)
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots o videos si es posible
- Logs de la consola del navegador

---

## 🔄 Proceso de Actualización del Documento

1. **Al resolver un nuevo problema**: Agregar entrada con formato estándar
2. **Incluir**: Síntomas, causa, solución, archivos afectados, fecha
3. **Categorizar** apropiadamente
4. **Actualizar índice** si es necesario
5. **Revisar** mensualmente para consolidar entradas similares

---

_Última actualización: [Fecha de desarrollo]_
_Mantenido por: Equipo de desarrollo TSP_
