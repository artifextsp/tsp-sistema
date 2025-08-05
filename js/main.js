// ====================================================
// MAIN.JS - LÓGICA PRINCIPAL CON SUPABASE
// Archivo: js/main.js
// ====================================================

// ===== VARIABLES GLOBALES =====
let usuarioActual = null;
let cargandoLogin = false;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 TSP Sistema iniciado');
    
    // Verificar si hay sesión guardada
    verificarSesionExistente();
    
    // Configurar eventos
    configurarEventos();
    
    // Verificar conexión después de un momento
    setTimeout(verificarConexionInicial, 1000);
});

// ===== VERIFICACIÓN DE SESIÓN EXISTENTE =====
function verificarSesionExistente() {
    const sesionLocal = window.TSP?.obtenerSesionLocal();
    
    if (sesionLocal) {
        console.log('💾 Sesión existente encontrada:', sesionLocal.nombre);
        
        // Mostrar mensaje de sesión existente
        mostrarMensaje(`Sesión activa: ${sesionLocal.nombre}`, 'info');
        
        // Agregar botón para continuar o nueva sesión
        agregarOpcionesSesion(sesionLocal);
    }
}

function agregarOpcionesSesion(sesion) {
    const container = document.querySelector('.login-form');
    
    // Crear div para opciones de sesión
    const sessionDiv = document.createElement('div');
    sessionDiv.className = 'session-options';
    sessionDiv.innerHTML = `
        <div class="session-info">
            <p><strong>Sesión activa:</strong></p>
            <p>${sesion.nombre} - Grado ${sesion.grado}°</p>
        </div>
        <div class="session-buttons">
            <button type="button" onclick="continuarSesion()" class="btn-secondary">
                Continuar Sesión
            </button>
            <button type="button" onclick="nuevaSesion()" class="btn-outline">
                Nueva Sesión
            </button>
        </div>
        <hr style="margin: 20px 0;">
    `;
    
    // Insertar antes del formulario de login
    container.insertBefore(sessionDiv, container.firstChild);
}

function continuarSesion() {
    const sesion = window.TSP.obtenerSesionLocal();
    if (sesion) {
        usuarioActual = sesion;
        mostrarDashboard();
    }
}

function nuevaSesion() {
    window.TSP.cerrarSesion();
    location.reload();
}

// ===== CONFIGURACIÓN DE EVENTOS =====
function configurarEventos() {
    // Enter en campo de código
    const codigoInput = document.getElementById('codigo');
    if (codigoInput) {
        codigoInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter' && !cargandoLogin) {
                iniciarSesion();
            }
        });
        
        // Limpiar mensajes al escribir
        codigoInput.addEventListener('input', function() {
            limpiarMensajes();
        });
        
        // Convertir a mayúsculas automáticamente
        codigoInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }
}

// ===== FUNCIÓN PRINCIPAL DE LOGIN =====
async function iniciarSesion() {
    const codigoInput = document.getElementById('codigo');
    const codigo = codigoInput.value.trim();
    
    // Validaciones básicas
    if (!codigo) {
        mostrarMensaje('Por favor ingresa tu código', 'warning');
        codigoInput.focus();
        return;
    }
    
    if (codigo.length < 4) {
        mostrarMensaje('El código debe tener al menos 4 caracteres', 'warning');
        codigoInput.focus();
        return;
    }
    
    // Verificar que TSP esté disponible
    if (!window.TSP) {
        mostrarMensaje('Error: Sistema no inicializado. Por favor recarga la página.', 'error');
        return;
    }
    
    // Prevenir múltiples clics
    if (cargandoLogin) {
        return;
    }
    
    cargandoLogin = true;
    mostrarCargando(true);
    
    try {
        console.log(`🔐 Intentando login con código: ${codigo}`);
        
        // Validar con Supabase
        const resultado = await window.TSP.validarEstudiante(codigo);
        
        if (resultado.success) {
            // Login exitoso
            usuarioActual = resultado.user;
            
            // Guardar sesión localmente
            window.TSP.guardarSesionLocal(usuarioActual);
            
            // Mostrar mensaje de bienvenida
            mostrarMensaje(resultado.message, 'success');
            
            // Pequeña pausa para mostrar el mensaje
            setTimeout(() => {
                mostrarDashboard();
            }, 1500);
            
        } else {
            // Login fallido
            mostrarMensaje(resultado.message, 'error');
            codigoInput.focus();
            codigoInput.select();
        }
        
    } catch (error) {
        console.error('❌ Error inesperado en login:', error);
        mostrarMensaje('Error de conexión. Verifica tu internet e intenta de nuevo.', 'error');
        
    } finally {
        cargandoLogin = false;
        mostrarCargando(false);
    }
}

// ===== DASHBOARD DEL ESTUDIANTE =====
function mostrarDashboard() {
    if (!usuarioActual) {
        console.error('❌ No hay usuario actual para mostrar dashboard');
        return;
    }
    
    console.log('📊 Mostrando dashboard para:', usuarioActual.nombre_completo);
    
    // Crear HTML del dashboard
    const dashboardHTML = `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <h1>🎯 TSP - Entrenamiento Cognitivo</h1>
                <div class="user-info">
                    <span class="user-name">${usuarioActual.nombre_completo}</span>
                    <span class="user-details">Grado ${usuarioActual.grado}° • Ciclo ${usuarioActual.ciclo_actual}</span>
                </div>
            </div>
            
            <div class="modules-grid">
                <div class="module-card mlc" onclick="abrirModulo('MLC')">
                    <div class="module-icon">📚</div>
                    <h3>Lectura Crítica</h3>
                    <p>Mejora tu velocidad y comprensión lectora</p>
                    <div class="module-status" id="status-mlc">Cargando...</div>
                </div>
                
                <div class="module-card mdc" onclick="abrirModulo('MDC')">
                    <div class="module-icon">🧠</div>
                    <h3>Desafíos Creativos</h3>
                    <p>Desarrolla tu pensamiento creativo</p>
                    <div class="module-status" id="status-mdc">Cargando...</div>
                </div>
                
                <div class="module-card med" onclick="abrirModulo('MED')">
                    <div class="module-icon">🎮</div>
                    <h3>Ejercicios Digitales</h3>
                    <p>Entrena tus habilidades mentales</p>
                    <div class="module-status" id="status-med">Cargando...</div>
                </div>
            </div>
            
            <div class="dashboard-actions">
                <button onclick="verProgreso()" class="btn-outline">
                    📊 Ver Mi Progreso
                </button>
                <button onclick="cerrarSesionUsuario()" class="btn-secondary">
                    🚪 Cerrar Sesión
                </button>
            </div>
        </div>
    `;
    
    // Reemplazar contenido de la página
    document.body.innerHTML = dashboardHTML;
    
    // Agregar estilos específicos del dashboard
    agregarEstilosDashboard();
    
    // Cargar estado de módulos
    cargarEstadoModulos();
}

// ===== CARGAR ESTADO DE MÓDULOS =====
async function cargarEstadoModulos() {
    try {
        // Cargar lecturas disponibles
        const lecturas = await window.TSP.obtenerLecturas(usuarioActual.grado, usuarioActual.ciclo_actual);
        document.getElementById('status-mlc').textContent = 
            lecturas.length > 0 ? `${lecturas.length} lectura(s) disponible(s)` : 'Sin lecturas asignadas';
        
        // Cargar desafíos disponibles
        const desafios = await window.TSP.obtenerDesafios(usuarioActual.grado, usuarioActual.ciclo_actual);
        document.getElementById('status-mdc').textContent = 
            desafios.length > 0 ? `${desafios.length} desafío(s) disponible(s)` : 'Sin desafíos asignados';
        
        // Cargar ejercicios disponibles
        const ejercicios = await window.TSP.obtenerEjercicios(usuarioActual.grado);
        document.getElementById('status-med').textContent = 
            ejercicios.length > 0 ? `${ejercicios.length} ejercicio(s) disponible(s)` : 'Sin ejercicios disponibles';
            
    } catch (error) {
        console.error('❌ Error cargando estado de módulos:', error);
        document.getElementById('status-mlc').textContent = 'Error cargando';
        document.getElementById('status-mdc').textContent = 'Error cargando';
        document.getElementById('status-med').textContent = 'Error cargando';
    }
}

// ===== FUNCIONES DE MÓDULOS =====
function abrirModulo(modulo) {
    console.log(`🔄 Abriendo módulo: ${modulo}`);
    
    switch(modulo) {
        case 'MLC':
            window.location.href = 'pages/mlc.html';
            break;
        case 'MDC':
            window.location.href = 'pages/mdc.html';
            break;
        case 'MED':
            window.location.href = 'pages/med.html';
            break;
        default:
            mostrarMensaje('Módulo en desarrollo', 'info');
    }
}

function verProgreso() {
    mostrarMensaje('Panel de progreso en desarrollo', 'info');
    // TODO: Implementar vista de progreso
}

function cerrarSesionUsuario() {
    if (confirm('¿Estás seguro de cerrar la sesión?')) {
        window.TSP.cerrarSesion();
    }
}

// ===== FUNCIONES DE UI =====
function mostrarCargando(mostrar) {
    const boton = document.querySelector('button[onclick="iniciarSesion()"]') || 
                  document.querySelector('.login-button');
    if (!boton) return;
    
    if (mostrar) {
        boton.disabled = true;
        boton.innerHTML = '⏳ Validando...';
    } else {
        boton.disabled = false;
        boton.innerHTML = '🔐 Entrar al Sistema';
    }
}

function mostrarMensaje(mensaje, tipo = 'info') {
    // Limpiar mensajes anteriores
    limpiarMensajes();
    
    // Crear elemento de mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${tipo}`;
    messageDiv.innerHTML = `
        <span class="message-icon">
            ${tipo === 'success' ? '✅' : 
              tipo === 'error' ? '❌' : 
              tipo === 'warning' ? '⚠️' : 'ℹ️'}
        </span>
        <span class="message-text">${mensaje}</span>
    `;
    
    // Insertar después del formulario
    const form = document.querySelector('.login-form');
    if (form) {
        form.appendChild(messageDiv);
        
        // Auto-remover mensajes de éxito después de 3 segundos
        if (tipo === 'success') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 3000);
        }
    }
}

function limpiarMensajes() {
    const mensajes = document.querySelectorAll('.message');
    mensajes.forEach(msg => msg.remove());
}

function verificarConexionInicial() {
    if (window.TSP) {
        window.TSP.probarConexion().then(conectado => {
            if (!conectado) {
                mostrarMensaje('Sin conexión a la base de datos. Verifica tu internet.', 'warning');
            }
        });
    } else {
        mostrarMensaje('Error: No se pudo cargar el sistema. Recarga la página.', 'error');
    }
}

// ===== ESTILOS ESPECÍFICOS DEL DASHBOARD =====
function agregarEstilosDashboard() {
    if (document.getElementById('dashboard-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'dashboard-styles';
    style.textContent = `
        .dashboard-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .dashboard-header {
            text-align: center;
            margin-bottom: 40px;
            color: white;
        }
        
        .dashboard-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .user-info {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px 25px;
            border-radius: 25px;
            display: inline-block;
        }
        
        .user-name {
            font-size: 1.2em;
            font-weight: bold;
            display: block;
        }
        
        .user-details {
            opacity: 0.9;
            font-size: 0.9em;
        }
        
        .modules-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .module-card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .module-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        
        .module-icon {
            font-size: 4em;
            margin-bottom: 20px;
        }
        
        .module-card h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        
        .module-card p {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .module-status {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 10px;
            font-size: 0.9em;
            color: #495057;
            font-weight: 500;
        }
        
        .dashboard-actions {
            text-align: center;
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn-outline {
            background: transparent;
            border: 2px solid white;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s ease;
        }
        
        .btn-outline:hover {
            background: white;
            color: #667eea;
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s ease;
        }
        
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        @media (max-width: 768px) {
            .dashboard-container {
                padding: 15px;
            }
            
            .modules-grid {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .dashboard-actions {
                flex-direction: column;
                align-items: center;
            }
            
            .dashboard-actions button {
                width: 80%;
                max-width: 300px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// ===== FUNCIONES GLOBALES =====
window.iniciarSesion = iniciarSesion;
window.continuarSesion = continuarSesion;
window.nuevaSesion = nuevaSesion;
window.abrirModulo = abrirModulo;
window.verProgreso = verProgreso;
window.cerrarSesionUsuario = cerrarSesionUsuario;

console.log('✅ Main.js cargado - Funciones globales disponibles');