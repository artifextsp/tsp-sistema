// ===================================================
// DASHBOARD.JS - Lógica del Dashboard del Estudiante
// Sistema TSP - Thinking Skills Program
// ===================================================

// ===== VARIABLES GLOBALES =====
let usuarioActual = null;
let datosProgreso = null;
let notificaciones = [];
let intervalos = {};

// ===== CONFIGURACIÓN =====
const CONFIG = {
    actualizacionProgreso: 30000, // 30 segundos
    animacionDuracion: 300,
    coloresModulos: {
        MLC: '#10b981',
        MDC: '#f59e0b', 
        MED: '#3b82f6'
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Dashboard TSP - Iniciando...');
    
    // Verificar autenticación
    verificarAutenticacion();
    
    // Cargar datos del usuario
    cargarDatosUsuario();
    
    // Inicializar componentes
    inicializarDashboard();
    
    // Configurar eventos
    configurarEventos();
    
    // Iniciar actualizaciones automáticas
    iniciarActualizacionesAutomaticas();
    
    console.log('✅ Dashboard inicializado correctamente');
});

// ===== VERIFICACIÓN DE AUTENTICACIÓN =====
async function verificarAutenticacion() {
    console.log('🔍 Verificando autenticación...');
    
    try {
        // PRIORIDAD 1: Verificar sessionStorage directamente
        const sesionLocal = sessionStorage.getItem('tsp_current_user');
        
        if (sesionLocal) {
            try {
                usuarioActual = JSON.parse(sesionLocal);
                console.log('✅ Usuario recuperado de sessionStorage:', usuarioActual.nombre_completo);
                return; // SALIR AQUÍ - no hacer más verificaciones
            } catch (parseError) {
                console.warn('⚠️ Error parseando sesión local:', parseError);
                sessionStorage.removeItem('tsp_current_user'); // Limpiar sesión corrupta
            }
        }
        
        // PRIORIDAD 2: Solo si no hay sessionStorage, intentar AuthManager
        if (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser) {
            try {
                usuarioActual = await AuthManager.getCurrentUser();
                
                if (usuarioActual) {
                    console.log('✅ Usuario recuperado de AuthManager:', usuarioActual.nombre_completo);
                    // Guardar en sessionStorage para próxima vez
                    sessionStorage.setItem('tsp_current_user', JSON.stringify(usuarioActual));
                    return;
                }
            } catch (authError) {
                console.warn('⚠️ Error en AuthManager:', authError);
            }
        }
        
        // PRIORIDAD 3: Si llegamos aquí, usar datos de ejemplo para debugging
        console.warn('⚠️ No se encontró usuario, usando datos de ejemplo');
        usuarioActual = {
            id: 'user-001',
            nombre_completo: 'María García López',
            grado: 3,
            ciclo_actual: 1,
            codigo: 'AB1234'
        };
        
        // Guardar datos de ejemplo en sessionStorage
        sessionStorage.setItem('tsp_current_user', JSON.stringify(usuarioActual));
        
    } catch (error) {
        console.error('❌ Error crítico en verificación:', error);
        
        // En caso de error crítico, usar datos de ejemplo
        usuarioActual = {
            id: 'user-001',
            nombre_completo: 'María García López',
            grado: 3,
            ciclo_actual: 1,
            codigo: 'AB1234'
        };
        
        sessionStorage.setItem('tsp_current_user', JSON.stringify(usuarioActual));
    }
}

// ===== CARGA DE DATOS DEL USUARIO =====
async function cargarDatosUsuario() {
    if (!usuarioActual) return;
    
    try {
        console.log('📊 Cargando datos del usuario...');
        
        // Actualizar información en la interfaz
        actualizarInfoUsuario();
        
        // Cargar progreso desde Supabase
        await cargarProgresoDesdeSupabase();
        
        // Cargar notificaciones
        await cargarNotificaciones();
        
        // Actualizar estadísticas
        actualizarEstadisticas();
        
        console.log('✅ Datos del usuario cargados');
        
    } catch (error) {
        console.error('❌ Error cargando datos del usuario:', error);
        // Usar datos de ejemplo si falla la carga
        usarDatosEjemplo();
    }
}

// ===== ACTUALIZAR INFORMACIÓN DEL USUARIO =====
function actualizarInfoUsuario() {
    if (!usuarioActual) return;
    
    // Actualizar nombre en el header
    const nombreElementos = document.querySelectorAll('#userName, #welcomeName');
    nombreElementos.forEach(el => {
        if (el.id === 'userName') {
            el.textContent = usuarioActual.nombre_completo;
        } else {
            el.textContent = usuarioActual.nombre_completo.split(' ')[0];
        }
    });
    
    // Actualizar grado y ciclo
    const gradeElement = document.getElementById('userGrade');
    if (gradeElement) {
        gradeElement.textContent = `Grado ${usuarioActual.grado}° • Ciclo ${usuarioActual.ciclo_actual}`;
    }
    
    console.log('👤 Información de usuario actualizada');
}

// ===== CARGAR PROGRESO DESDE SUPABASE =====
async function cargarProgresoDesdeSupabase() {
    try {
        // Cargar sesiones MLC
        const { data: sesiones_mlc, error: errorMLC } = await supabaseClient
            .from('sesiones_mlc')
            .select('*')
            .eq('usuario_id', usuarioActual.id);
            
        if (errorMLC) throw errorMLC;
        
        // Cargar sesiones MDC
        const { data: sesiones_mdc, error: errorMDC } = await supabaseClient
            .from('sesiones_mdc')
            .select('*')
            .eq('usuario_id', usuarioActual.id);
            
        if (errorMDC) throw errorMDC;
        
        // Cargar sesiones MED
        const { data: sesiones_med, error: errorMED } = await supabaseClient
            .from('sesiones_med')
            .select('*')
            .eq('usuario_id', usuarioActual.id);
            
        if (errorMED) throw errorMED;
        
        // Procesar datos
        datosProgreso = {
            mlc: sesiones_mlc || [],
            mdc: sesiones_mdc || [],
            med: sesiones_med || [],
            total_sesiones: (sesiones_mlc?.length || 0) + (sesiones_mdc?.length || 0) + (sesiones_med?.length || 0)
        };
        
        console.log('📊 Progreso cargado desde Supabase:', datosProgreso);
        
    } catch (error) {
        console.warn('⚠️ Error cargando progreso de Supabase:', error);
        // Usar datos de ejemplo
        usarDatosEjemplo();
    }
}

// ===== USAR DATOS DE EJEMPLO =====
function usarDatosEjemplo() {
    console.log('📋 Usando datos de ejemplo para demostración');
    
    datosProgreso = {
        mlc: Array(8).fill(null).map((_, i) => ({
            velocidad_simple: 160 + Math.random() * 40,
            porcentaje_comprension: 75 + Math.random() * 20,
            fecha_sesion: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
        })),
        mdc: Array(2).fill(null).map((_, i) => ({
            porcentaje_acierto: 80 + Math.random() * 15,
            fecha_sesion: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
        })),
        med: Array(47).fill(null).map((_, i) => ({
            porcentaje_acierto: 70 + Math.random() * 25,
            fecha_sesion: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
        })),
        total_sesiones: 57
    };
}

// ===== CARGAR NOTIFICACIONES =====
async function cargarNotificaciones() {
    try {
        // En una implementación real, estas vendrían de Supabase
        notificaciones = [
            {
                id: 1,
                tipo: 'logro',
                titulo: '¡Nuevo logro desbloqueado!',
                mensaje: 'Has alcanzado el logro "Lector Veloz"',
                fecha: new Date(Date.now() - 2 * 60 * 60 * 1000),
                leida: false,
                icono: 'fas fa-trophy',
                color: 'success'
            },
            {
                id: 2,
                tipo: 'contenido',
                titulo: 'Nueva lectura disponible',
                mensaje: '"La Liebre y la Tortuga" está lista para ti',
                fecha: new Date(Date.now() - 24 * 60 * 60 * 1000),
                leida: false,
                icono: 'fas fa-book',
                color: 'info'
            },
            {
                id: 3,
                tipo: 'recordatorio',
                titulo: 'Recordatorio de práctica',
                mensaje: 'No olvides practicar hoy tus ejercicios',
                fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                leida: true,
                icono: 'fas fa-clock',
                color: 'warning'
            }
        ];
        
        // Actualizar badge de notificaciones
        actualizarBadgeNotificaciones();
        
    } catch (error) {
        console.error('❌ Error cargando notificaciones:', error);
    }
}

// ===== ACTUALIZAR BADGE DE NOTIFICACIONES =====
function actualizarBadgeNotificaciones() {
    const badge = document.querySelector('.notification-badge');
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    
    if (badge) {
        badge.textContent = noLeidas;
        badge.style.display = noLeidas > 0 ? 'flex' : 'none';
    }
}

// ===== ACTUALIZAR ESTADÍSTICAS =====
function actualizarEstadisticas() {
    if (!datosProgreso) {
        console.warn('⚠️ No hay datos de progreso disponibles');
        return;
    }
    
    try {
        console.log('📊 Actualizando estadísticas del dashboard...');
        
        // ===== ESTADÍSTICAS PRINCIPALES =====
        
        // Total de sesiones
        const totalSesiones = datosProgreso.total_sesiones || 0;
        const elementoSesiones = document.getElementById('totalSessions');
        if (elementoSesiones) {
            elementoSesiones.textContent = totalSesiones;
        }
        
        // Tiempo total (estimado en base a sesiones)
        const tiempoTotalMinutos = Math.floor(totalSesiones * 12.5); // promedio 12.5 min por sesión
        const horas = Math.floor(tiempoTotalMinutos / 60);
        const minutos = tiempoTotalMinutos % 60;
        const tiempoFormateado = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
        
        const elementoTiempo = document.getElementById('totalTime');
        if (elementoTiempo) {
            elementoTiempo.textContent = tiempoFormateado;
        }
        
        // Ranking simulado (en implementación real vendría de Supabase)
        const ranking = Math.floor(Math.random() * 5) + 1;
        const elementoRanking = document.getElementById('currentRank');
        if (elementoRanking) {
            elementoRanking.textContent = `#${ranking}`;
        }
        
        // ===== PROGRESO GENERAL =====
        
        // Calcular progreso general basado en sesiones completadas (máximo 120 sesiones)
        const progresoGeneral = Math.min(Math.floor((totalSesiones / 120) * 100), 100);
        actualizarProgresoCircular(progresoGeneral);
        
        // ===== PROGRESO DE MÓDULOS =====
        actualizarProgresoModulos();
        
        console.log('✅ Estadísticas actualizadas correctamente');
        console.log(`📈 Resumen: ${totalSesiones} sesiones, ${tiempoFormateado}, ranking #${ranking}, progreso ${progresoGeneral}%`);
        
    } catch (error) {
        console.error('❌ Error actualizando estadísticas:', error);
        
        // Valores por defecto en caso de error
        const elementosDefault = [
            { id: 'totalSessions', valor: '0' },
            { id: 'totalTime', valor: '0m' },
            { id: 'currentRank', valor: '#-' },
            { id: 'overallProgress', valor: '0%' }
        ];
        
        elementosDefault.forEach(({ id, valor }) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor;
            }
        });
    }
}

// ===== ACTUALIZAR PROGRESO CIRCULAR =====
function actualizarProgresoCircular(porcentaje) {
    try {
        const progressCircle = document.getElementById('progressCircle');
        const progressText = document.getElementById('overallProgress');
        
        if (progressCircle && progressText) {
            // Calcular stroke-dasharray para el círculo
            const radio = 52; // radio del círculo en el SVG
            const circumference = 2 * Math.PI * radio; // circunferencia total
            const strokeDasharray = `${(porcentaje / 100) * circumference} ${circumference}`;
            
            // Aplicar la animación del progreso
            progressCircle.style.strokeDasharray = strokeDasharray;
            progressCircle.style.transition = 'stroke-dasharray 0.8s ease-in-out';
            
            // Actualizar texto del porcentaje
            progressText.textContent = `${porcentaje}%`;
            
            console.log(`🔄 Progreso circular actualizado: ${porcentaje}%`);
        }
    } catch (error) {
        console.error('❌ Error actualizando progreso circular:', error);
    }
}

// ===== ACTUALIZAR PROGRESO DE MÓDULOS =====


// ===== ACTUALIZAR PROGRESO CIRCULAR =====
function actualizarProgresoCircular(porcentaje) {
    const progressCircle = document.getElementById('progressCircle');
    const progressText = document.getElementById('overallProgress');
    
    if (progressCircle && progressText) {
        const circumference = 2 * Math.PI * 52; // radio = 52
        const strokeDasharray = `${(porcentaje / 100) * circumference} ${circumference}`;
        
        progressCircle.style.strokeDasharray = strokeDasharray;
        progressText.textContent = `${porcentaje}%`;
    }
}

// ===== ACTUALIZAR PROGRESO DE MÓDULOS (VERSIÓN CORREGIDA) =====
function actualizarProgresoModulos() {
    if (!datosProgreso) {
        console.warn('⚠️ No hay datos de progreso disponibles');
        return;
    }
    
    try {
        console.log('📚 Actualizando progreso de módulos...');
        
        // ===== MÓDULO MLC (LECTURA CRÍTICA) =====
        const mlcCard = document.querySelector('.mlc-card');
        if (mlcCard) {
            const lecturas = datosProgreso.mlc ? datosProgreso.mlc.length : 0;
            const metaLecturas = 12; // meta de lecturas por ciclo
            const progresoMLC = Math.min((lecturas / metaLecturas) * 100, 100);
            
            // Actualizar barra de progreso
            const progressBarMLC = mlcCard.querySelector('.progress-bar');
            if (progressBarMLC) {
                progressBarMLC.style.width = `${progresoMLC}%`;
                progressBarMLC.style.transition = 'width 0.5s ease';
            }
            
            // Actualizar texto de progreso
            const progressTextMLC = mlcCard.querySelector('.progress-text');
            if (progressTextMLC) {
                progressTextMLC.textContent = `${lecturas}/${metaLecturas} lecturas`;
            }
            
            // Actualizar estadísticas específicas del MLC usando IDs únicos
            const velocidadStat = mlcCard.querySelector('.stat-velocidad span');
            const comprensionStat = mlcCard.querySelector('.stat-comprension span');
            
            if (datosProgreso.mlc && datosProgreso.mlc.length > 0) {
                // Calcular velocidad promedio
                const velocidadPromedio = Math.round(
                    datosProgreso.mlc.reduce((sum, sesion) => sum + (sesion.velocidad_simple || 0), 0) / datosProgreso.mlc.length
                );
                
                // Calcular comprensión promedio
                const comprensionPromedio = Math.round(
                    datosProgreso.mlc.reduce((sum, sesion) => sum + (sesion.porcentaje_comprension || 0), 0) / datosProgreso.mlc.length
                );
                
                if (velocidadStat) velocidadStat.textContent = `${velocidadPromedio} ppm`;
                if (comprensionStat) comprensionStat.textContent = `${comprensionPromedio}%`;
            } else {
                // Valores por defecto si no hay datos
                if (velocidadStat) velocidadStat.textContent = '0 ppm';
                if (comprensionStat) comprensionStat.textContent = '0%';
            }
        }
        
        // ===== MÓDULO MDC (DESARROLLO CREATIVIDAD) =====
        const mdcCard = document.querySelector('.mdc-card');
        if (mdcCard) {
            const desafios = datosProgreso.mdc ? datosProgreso.mdc.length : 0;
            const metaDesafios = 5; // meta de desafíos por ciclo
            const progresoMDC = Math.min((desafios / metaDesafios) * 100, 100);
            
            // Actualizar barra de progreso
            const progressBarMDC = mdcCard.querySelector('.progress-bar');
            if (progressBarMDC) {
                progressBarMDC.style.width = `${progresoMDC}%`;
                progressBarMDC.style.transition = 'width 0.5s ease';
            }
            
            // Actualizar texto de progreso
            const progressTextMDC = mdcCard.querySelector('.progress-text');
            if (progressTextMDC) {
                progressTextMDC.textContent = `${desafios}/${metaDesafios} desafíos`;
            }
            
            // Actualizar estadísticas específicas del MDC usando IDs únicos
            const puntajeStat = mdcCard.querySelector('.stat-puntaje span');
            const nivelStat = mdcCard.querySelector('.stat-nivel span');
            
            if (datosProgreso.mdc && datosProgreso.mdc.length > 0) {
                // Calcular puntaje promedio
                const puntajePromedio = Math.round(
                    datosProgreso.mdc.reduce((sum, sesion) => sum + (sesion.porcentaje_acierto || 0), 0) / datosProgreso.mdc.length
                );
                
                // Determinar nivel basado en puntaje
                let nivel = 'Inicial';
                if (puntajePromedio >= 90) nivel = 'Experto';
                else if (puntajePromedio >= 75) nivel = 'Avanzado';
                else if (puntajePromedio >= 60) nivel = 'Intermedio';
                else if (puntajePromedio >= 40) nivel = 'Básico';
                
                if (puntajeStat) puntajeStat.textContent = `${puntajePromedio}/100`;
                if (nivelStat) nivelStat.textContent = nivel;
            } else {
                // Valores por defecto si no hay datos
                if (puntajeStat) puntajeStat.textContent = '0/100';
                if (nivelStat) nivelStat.textContent = 'Inicial';
            }
        }
        
        // ===== MÓDULO MED (EJERCICIOS DIGITALES) =====
        const medCard = document.querySelector('.med-card');
        if (medCard) {
            const ejercicios = datosProgreso.med ? datosProgreso.med.length : 0;
            const metaEjercicios = 100; // meta de ejercicios
            const progresoMED = Math.min((ejercicios / metaEjercicios) * 100, 100);
            
            // Actualizar barra de progreso
            const progressBarMED = medCard.querySelector('.progress-bar');
            if (progressBarMED) {
                progressBarMED.style.width = `${progresoMED}%`;
                progressBarMED.style.transition = 'width 0.5s ease';
            }
            
            // Actualizar texto de progreso
            const progressTextMED = medCard.querySelector('.progress-text');
            if (progressTextMED) {
                progressTextMED.textContent = `${ejercicios} ejercicios`;
            }
            
            // Actualizar estadísticas específicas del MED usando IDs únicos
            const rachaStat = medCard.querySelector('.stat-racha span');
            const nivelMEDStat = medCard.querySelector('.stat-nivel-med span');
            
            // Simular racha de días (en implementación real vendría de la base de datos)
            const racha = Math.min(Math.floor(ejercicios / 7) + 1, 30); // máximo 30 días
            
            // Determinar nivel basado en ejercicios completados
            let nivelMED = 'Principiante';
            if (ejercicios >= 80) nivelMED = 'Experto';
            else if (ejercicios >= 60) nivelMED = 'Avanzado';
            else if (ejercicios >= 30) nivelMED = 'Intermedio';
            else if (ejercicios >= 10) nivelMED = 'Básico';
            
            if (rachaStat) rachaStat.textContent = `${racha} días`;
            if (nivelMEDStat) nivelMEDStat.textContent = nivelMED;
        }
        
        console.log('✅ Progreso de módulos actualizado correctamente');
        
    } catch (error) {
        console.error('❌ Error actualizando progreso de módulos:', error);
        
        // Aplicar valores por defecto en caso de error
        aplicarValoresPorDefecto();
    }
}

// ===== FUNCIÓN AUXILIAR PARA VALORES POR DEFECTO =====
function aplicarValoresPorDefecto() {
    console.log('🔧 Aplicando valores por defecto...');
    
    // Valores por defecto para MLC
    const mlcCard = document.querySelector('.mlc-card');
    if (mlcCard) {
        const velocidadStat = mlcCard.querySelector('.stat-velocidad span');
        const comprensionStat = mlcCard.querySelector('.stat-comprension span');
        
        if (velocidadStat) velocidadStat.textContent = '0 ppm';
        if (comprensionStat) comprensionStat.textContent = '0%';
    }
    
    // Valores por defecto para MDC
    const mdcCard = document.querySelector('.mdc-card');
    if (mdcCard) {
        const puntajeStat = mdcCard.querySelector('.stat-puntaje span');
        const nivelStat = mdcCard.querySelector('.stat-nivel span');
        
        if (puntajeStat) puntajeStat.textContent = '0/100';
        if (nivelStat) nivelStat.textContent = 'Inicial';
    }
    
    // Valores por defecto para MED
    const medCard = document.querySelector('.med-card');
    if (medCard) {
        const rachaStat = medCard.querySelector('.stat-racha span');
        const nivelMEDStat = medCard.querySelector('.stat-nivel-med span');
        
        if (rachaStat) rachaStat.textContent = '0 días';
        if (nivelMEDStat) nivelMEDStat.textContent = 'Principiante';
    }
}

// ===== INICIALIZAR DASHBOARD =====
function inicializarDashboard() {
    console.log('🚀 Inicializando componentes del dashboard...');
    
    // Inicializar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Configurar dropdowns
    const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
    dropdownElementList.map(function (dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl);
    });
    
    // Añadir efectos de hover a las cards
    añadirEfectosHover();
    
    console.log('✅ Componentes inicializados');
}

// ===== AÑADIR EFECTOS DE HOVER =====
function añadirEfectosHover() {
    const cards = document.querySelectorAll('.module-card, .quick-action-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// ===== CONFIGURAR EVENTOS =====
function configurarEventos() {
    console.log('⚙️ Configurando eventos...');
    
    // Eventos de teclado
    document.addEventListener('keydown', manejarTeclado);
    
    // Eventos de visibilidad de página
    document.addEventListener('visibilitychange', manejarVisibilidadPagina);
    
    // Eventos de redimensionamiento
    window.addEventListener('resize', manejarRedimensionamiento);
    
    console.log('✅ Eventos configurados');
}

// ===== MANEJO DE EVENTOS DE TECLADO =====
function manejarTeclado(event) {
    // Atajos de teclado
    if (event.ctrlKey || event.metaKey) {
        switch(event.key) {
            case '1':
                event.preventDefault();
                abrirModulo('MLC');
                break;
            case '2':
                event.preventDefault();
                abrirModulo('MDC');
                break;
            case '3':
                event.preventDefault();
                abrirModulo('MED');
                break;
            case 'n':
                event.preventDefault();
                toggleNotifications();
                break;
        }
    }
    
    // ESC para cerrar modales
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) modalInstance.hide();
        });
    }
}

// ===== MANEJO DE VISIBILIDAD DE PÁGINA =====
function manejarVisibilidadPagina() {
    if (document.hidden) {
        // Pausar actualizaciones cuando la página no es visible
        console.log('📱 Página no visible - pausando actualizaciones');
        detenerActualizacionesAutomaticas();
    } else {
        // Reanudar actualizaciones cuando la página vuelve a ser visible
        console.log('📱 Página visible - reanudando actualizaciones');
        iniciarActualizacionesAutomaticas();
        // Actualizar datos inmediatamente
        cargarDatosUsuario();
    }
}

// ===== MANEJO DE REDIMENSIONAMIENTO =====
function manejarRedimensionamiento() {
    // Reajustar elementos que dependan del tamaño de pantalla
    console.log('📱 Redimensionamiento detectado');
}

// ===== FUNCIONES DE NAVEGACIÓN =====

// Abrir módulo específico
function abrirModulo(modulo) {
    console.log(`🎯 Abriendo módulo: ${modulo}`);
    
    // Verificar que el usuario puede acceder al módulo
    if (!AuthManager.canAccessModule(modulo)) {
        mostrarError(`No tienes acceso al módulo ${modulo}. Contacta a tu administrador.`);
        return;
    }
    
    // Guardar última actividad
    AuthManager.updateLastActivity();
    
    // Navegar al módulo
    switch(modulo) {
        case 'MLC':
            window.location.href = 'mlc.html';
            break;
        case 'MDC':
            window.location.href = 'mdc.html';
            break;
        case 'MED':
            window.location.href = 'med.html';
            break;
        default:
            mostrarError(`Módulo ${modulo} no encontrado`);
    }
}

// Ver progreso detallado
function verProgreso() {
    console.log('📊 Abriendo vista de progreso detallado');
    // En implementación real, abrir modal o página de progreso
    window.location.href = 'progress.html';
}

// Ver ranking
function verRanking() {
    console.log('🏆 Abriendo ranking');
    mostrarInfo('Funcionalidad de ranking en desarrollo');
}

// Configurar metas
function configurarMetas() {
    console.log('🎯 Abriendo configuración de metas');
    mostrarInfo('Funcionalidad de metas en desarrollo');
}

// Obtener ayuda
function obtenerAyuda() {
    console.log('❓ Abriendo ayuda');
    window.open('https://docs.tsp-sistema.edu', '_blank');
}

// Ver historial completo
function verHistorialCompleto() {
    console.log('📋 Abriendo historial completo');
    mostrarInfo('Funcionalidad de historial en desarrollo');
}

// ===== FUNCIONES DE PERFIL Y CONFIGURACIÓN =====

// Ver perfil
function verPerfil() {
    console.log('👤 Abriendo perfil');
    mostrarInfo('Funcionalidad de perfil en desarrollo');
}

// Configuración
function configuracion() {
    console.log('⚙️ Abriendo configuración');
    mostrarInfo('Funcionalidad de configuración en desarrollo');
}

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        console.log('🚪 Cerrando sesión...');
        
        // Limpiar datos locales
        detenerActualizacionesAutomaticas();
        
        // Cerrar sesión en AuthManager
        AuthManager.logout();
        
        // Redirigir al login
        window.location.href = '../index.html';
    }
}

// ===== FUNCIONES DE NOTIFICACIONES =====

// Toggle notificaciones
function toggleNotifications() {
    const modal = new bootstrap.Modal(document.getElementById('notificationsModal'));
    modal.show();
    
    // Actualizar lista de notificaciones
    actualizarListaNotificaciones();
}

// Actualizar lista de notificaciones
function actualizarListaNotificaciones() {
    const lista = document.querySelector('.notification-list');
    if (!lista) return;
    
    lista.innerHTML = notificaciones.map(notif => `
        <div class="notification-item ${!notif.leida ? 'unread' : ''}">
            <div class="notification-icon ${notif.color}">
                <i class="${notif.icono}"></i>
            </div>
            <div class="notification-content">
                <h6>${notif.titulo}</h6>
                <p>${notif.mensaje}</p>
                <small>${formatearFecha(notif.fecha)}</small>
            </div>
        </div>
    `).join('');
}

// Marcar todas como leídas
function marcarTodasLeidas() {
    notificaciones.forEach(notif => notif.leida = true);
    actualizarBadgeNotificaciones();
    actualizarListaNotificaciones();
    
    console.log('📧 Todas las notificaciones marcadas como leídas');
}

// ===== ACTUALIZACIONES AUTOMÁTICAS =====

// Iniciar actualizaciones automáticas
function iniciarActualizacionesAutomaticas() {
    // Detener intervalos existentes
    detenerActualizacionesAutomaticas();
    
    // Actualizar progreso cada 30 segundos
    intervalos.progreso = setInterval(() => {
        console.log('🔄 Actualizando progreso automáticamente...');
        cargarProgresoDesdeSupabase();
    }, CONFIG.actualizacionProgreso);
    
    // Verificar notificaciones cada 2 minutos
    intervalos.notificaciones = setInterval(() => {
        console.log('🔔 Verificando nuevas notificaciones...');
        cargarNotificaciones();
    }, 120000);
    
    console.log('⏰ Actualizaciones automáticas iniciadas');
}

// Detener actualizaciones automáticas
function detenerActualizacionesAutomaticas() {
    Object.values(intervalos).forEach(clearInterval);
    intervalos = {};
    console.log('⏹️ Actualizaciones automáticas detenidas');
}

// ===== FUNCIONES DE UTILIDAD =====

// Formatear fecha
function formatearFecha(fecha) {
    const ahora = new Date();
    const fechaObj = new Date(fecha);
    const diferencia = ahora - fechaObj;
    
    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) {
        return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
        return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    } else if (minutos > 0) {
        return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    } else {
        return 'Hace un momento';
    }
}

// Mostrar mensaje de éxito
function mostrarExito(mensaje) {
    mostrarToast(mensaje, 'success');
}

// Mostrar mensaje de información
function mostrarInfo(mensaje) {
    mostrarToast(mensaje, 'info');
}

// Mostrar mensaje de advertencia
function mostrarAdvertencia(mensaje) {
    mostrarToast(mensaje, 'warning');
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    mostrarToast(mensaje, 'error');
    console.error('❌ Error:', mensaje);
}

// Mostrar toast
function mostrarToast(mensaje, tipo = 'info') {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${tipo === 'success' ? 'success' : tipo === 'error' ? 'danger' : tipo === 'warning' ? 'warning' : 'primary'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-triangle' : tipo === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle'} me-2"></i>
                ${mensaje}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    // Agregar al DOM
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    
    // Mostrar toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: tipo === 'error' ? 5000 : 3000
    });
    bsToast.show();
    
    // Remover del DOM después de ocultar
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// ===== GESTIÓN DE ERRORES GLOBALES =====
window.addEventListener('error', function(event) {
    console.error('❌ Error global capturado:', event.error);
    
    // En modo debug, mostrar el error
    if (window.TSP_CONFIG?.debug) {
        mostrarError(`Error: ${event.error?.message || 'Error desconocido'}`);
    }
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Promesa rechazada:', event.reason);
    
    // En modo debug, mostrar el error
    if (window.TSP_CONFIG?.debug) {
        mostrarError(`Error de promesa: ${event.reason?.message || 'Error desconocido'}`);
    }
});

// ===== CLEANUP AL SALIR =====
window.addEventListener('beforeunload', function() {
    console.log('🧹 Limpiando recursos del dashboard...');
    detenerActualizacionesAutomaticas();
    
    // Guardar estado si es necesario
    if (usuarioActual) {
        AuthManager.updateLastActivity();
    }
});

// ===== FUNCIONES GLOBALES PARA HTML =====
window.abrirModulo = abrirModulo;
window.verProgreso = verProgreso;
window.verRanking = verRanking;
window.configurarMetas = configurarMetas;
window.obtenerAyuda = obtenerAyuda;
window.verHistorialCompleto = verHistorialCompleto;
window.verPerfil = verPerfil;
window.configuracion = configuracion;
window.cerrarSesion = cerrarSesion;
window.toggleNotifications = toggleNotifications;
window.marcarTodasLeidas = marcarTodasLeidas;

// ===== LOG FINAL =====
console.log('✅ Dashboard.js cargado correctamente');
console.log('🎯 Sistema TSP Dashboard v2.0 - Listo para uso');

// Exportar para uso en otros módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        usuarioActual,
        datosProgreso,
        cargarDatosUsuario,
        actualizarEstadisticas,
        mostrarExito,
        mostrarError,
        mostrarInfo,
        mostrarAdvertencia
    };
}