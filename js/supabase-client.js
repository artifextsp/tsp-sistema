// ====================================================
// SUPABASE CLIENT - CONEXIÓN Y FUNCIONES BÁSICAS
// Archivo: js/supabase-client.js
// ====================================================

// ===== CONFIGURACIÓN SUPABASE =====
const SUPABASE_URL = 'https://kryqjsncqsopjuwymhqd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeXFqc25jcXNvcGp1d3ltaHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjM3MDEsImV4cCI6MjA2ODg5OTcwMX0.w5HiaFiqlFJ_3QbcprUrufsOXTDWFg1zUMl2J7kWD6Y';

// ===== CLASE SUPABASE CLIENT =====
class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.headers = {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    }

    // Función genérica para hacer requests
    async request(endpoint, options = {}) {
        const url = `${this.url}/rest/v1/${endpoint}`;
        
        const config = {
            headers: this.headers,
            ...options
        };

        try {
            console.log(`🔗 Request: ${options.method || 'GET'} ${endpoint}`);
            
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log(`✅ Response:`, data);
            
            return { data, error: null };

        } catch (error) {
            console.error(`❌ Error en ${endpoint}:`, error);
            return { data: null, error: error.message };
        }
    }

    // GET - Obtener datos
    async select(table, query = '') {
        return await this.request(`${table}${query ? '?' + query : ''}`, {
            method: 'GET'
        });
    }

    // POST - Insertar datos
    async insert(table, data) {
        return await this.request(table, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PATCH - Actualizar datos
    async update(table, data, query) {
        return await this.request(`${table}?${query}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // DELETE - Eliminar datos
    async delete(table, query) {
        return await this.request(`${table}?${query}`, {
            method: 'DELETE'
        });
    }
}

// ===== INSTANCIA GLOBAL =====
const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== FUNCIONES DE AUTENTICACIÓN =====

/**
 * Validar código de estudiante
 * @param {string} codigo - Código del estudiante (ej: "AB1234")
 * @returns {Promise<Object>} - {success: boolean, user: object, message: string}
 */
async function validarEstudiante(codigo) {
    try {
        console.log(`🔍 Validando código: ${codigo}`);

        // Buscar usuario por código
        const { data, error } = await supabase.select(
            'usuarios', 
            `codigo_acceso=eq.${codigo}&estado=eq.ACTIVO`
        );

        if (error) {
            return {
                success: false,
                user: null,
                message: 'Error de conexión con la base de datos'
            };
        }

        if (!data || data.length === 0) {
            return {
                success: false,
                user: null,
                message: 'Código no válido o estudiante inactivo'
            };
        }

        const usuario = data[0];
        
        console.log(`✅ Usuario encontrado: ${usuario.nombre_completo}`);
        
        return {
            success: true,
            user: usuario,
            message: `¡Bienvenido ${usuario.nombre_completo}!`
        };

    } catch (error) {
        console.error('❌ Error validando estudiante:', error);
        return {
            success: false,
            user: null,
            message: 'Error inesperado del sistema'
        };
    }
}

/**
 * Obtener lecturas disponibles para un estudiante
 * @param {number} grado - Grado del estudiante
 * @param {number} ciclo - Ciclo actual
 * @returns {Promise<Array>} - Lista de lecturas
 */
async function obtenerLecturas(grado, ciclo) {
    try {
        console.log(`📚 Obteniendo lecturas para grado ${grado}, ciclo ${ciclo}`);

        const { data, error } = await supabase.select(
            'lecturas',
            `grado=eq.${grado}&ciclo=eq.${ciclo}&estado=eq.ACTIVA&order=orden_en_ciclo.asc`
        );

        if (error) {
            console.error('❌ Error obteniendo lecturas:', error);
            return [];
        }

        console.log(`✅ ${data.length} lecturas encontradas`);
        return data || [];

    } catch (error) {
        console.error('❌ Error inesperado obteniendo lecturas:', error);
        return [];
    }
}

/**
 * Obtener desafíos de creatividad para un estudiante
 * @param {number} grado - Grado del estudiante
 * @param {number} ciclo - Ciclo actual
 * @returns {Promise<Array>} - Lista de desafíos
 */
async function obtenerDesafios(grado, ciclo) {
    try {
        console.log(`🧠 Obteniendo desafíos para grado ${grado}, ciclo ${ciclo}`);

        const { data, error } = await supabase.select(
            'desafios_creatividad',
            `grado=eq.${grado}&ciclo=eq.${ciclo}&estado=eq.ACTIVO&order=orden_en_ciclo.asc`
        );

        if (error) {
            console.error('❌ Error obteniendo desafíos:', error);
            return [];
        }

        console.log(`✅ ${data.length} desafíos encontrados`);
        return data || [];

    } catch (error) {
        console.error('❌ Error inesperado obteniendo desafíos:', error);
        return [];
    }
}

/**
 * Obtener ejercicios digitales disponibles para un grado
 * @param {number} grado - Grado del estudiante
 * @returns {Promise<Array>} - Lista de ejercicios
 */
async function obtenerEjercicios(grado) {
    try {
        console.log(`🎮 Obteniendo ejercicios para grado ${grado}`);

        const { data, error } = await supabase.select(
            'ejercicios_digitales',
            `grados_aplicables=cs.{${grado}}&estado=eq.ACTIVO&order=orden_sugerido.asc`
        );

        if (error) {
            console.error('❌ Error obteniendo ejercicios:', error);
            return [];
        }

        console.log(`✅ ${data.length} ejercicios encontrados`);
        return data || [];

    } catch (error) {
        console.error('❌ Error inesperado obteniendo ejercicios:', error);
        return [];
    }
}

/**
 * Registrar sesión MLC (Lectura Crítica)
 * @param {Object} datosSession - Datos de la sesión de lectura
 * @returns {Promise<Object>} - Resultado del registro
 */
async function registrarSesionMLC(datosSession) {
    try {
        console.log('💾 Registrando sesión MLC');

        const sessionData = {
            usuario_id: datosSession.usuario_id,
            lectura_id: datosSession.lectura_id,
            tiempo_lectura_segundos: datosSession.tiempo_lectura_segundos,
            velocidad_simple: datosSession.velocidad_simple,
            aciertos_vocabulario: datosSession.aciertos_vocabulario,
            total_vocabulario: datosSession.total_vocabulario,
            aciertos_comprension: datosSession.aciertos_comprension,
            total_comprension: datosSession.total_comprension,
            porcentaje_comprension: datosSession.porcentaje_comprension,
            velocidad_efectiva: datosSession.velocidad_efectiva
        };

        const { data, error } = await supabase.insert('sesiones_mlc', sessionData);

        if (error) {
            return { success: false, message: 'Error guardando sesión' };
        }

        console.log('✅ Sesión MLC registrada exitosamente');
        return { success: true, data: data[0] };

    } catch (error) {
        console.error('❌ Error registrando sesión MLC:', error);
        return { success: false, message: 'Error inesperado' };
    }
}

/**
 * Función de prueba de conexión
 * @returns {Promise<boolean>} - True si la conexión funciona
 */
async function probarConexion() {
    try {
        console.log('🔧 Probando conexión con Supabase...');
        
        const { data, error } = await supabase.select('usuarios', 'limit=1');
        
        if (error) {
            console.error('❌ Error de conexión:', error);
            return false;
        }
        
        console.log('✅ Conexión exitosa con Supabase');
        return true;
        
    } catch (error) {
        console.error('❌ Error probando conexión:', error);
        return false;
    }
}

// ===== UTILIDADES =====

/**
 * Mostrar estado de conexión en la página
 * @param {boolean} conectado - Estado de conexión
 */
function mostrarEstadoConexion(conectado) {
    const statusDiv = document.getElementById('connection-status') || crearDivStatus();
    
    if (conectado) {
        statusDiv.innerHTML = '🟢 Conectado a la base de datos';
        statusDiv.className = 'status connected';
    } else {
        statusDiv.innerHTML = '🔴 Sin conexión a la base de datos';
        statusDiv.className = 'status disconnected';
    }
}

function crearDivStatus() {
    const div = document.createElement('div');
    div.id = 'connection-status';
    div.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 1000;
    `;
    
    // Agregar estilos
    const style = document.createElement('style');
    style.textContent = `
        .status.connected { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status.disconnected { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(div);
    
    return div;
}

/**
 * Guardar sesión de usuario en localStorage
 * @param {Object} usuario - Datos del usuario
 */
function guardarSesionLocal(usuario) {
    try {
        localStorage.setItem('tsp_user', JSON.stringify({
            id: usuario.id,
            codigo: usuario.codigo_acceso,
            nombre: usuario.nombre_completo,
            grado: usuario.grado,
            ciclo: usuario.ciclo_actual,
            timestamp: Date.now()
        }));
        console.log('💾 Sesión guardada localmente');
    } catch (error) {
        console.error('❌ Error guardando sesión local:', error);
    }
}

/**
 * Obtener sesión de usuario desde localStorage
 * @returns {Object|null} - Datos del usuario o null
 */
function obtenerSesionLocal() {
    try {
        const sessionData = localStorage.getItem('tsp_user');
        if (!sessionData) return null;
        
        const session = JSON.parse(sessionData);
        
        // Verificar que no haya expirado (24 horas)
        const horasExpiracion = 24;
        const tiempoExpiracion = horasExpiracion * 60 * 60 * 1000;
        
        if (Date.now() - session.timestamp > tiempoExpiracion) {
            localStorage.removeItem('tsp_user');
            return null;
        }
        
        return session;
    } catch (error) {
        console.error('❌ Error obteniendo sesión local:', error);
        localStorage.removeItem('tsp_user');
        return null;
    }
}

/**
 * Cerrar sesión del usuario
 */
function cerrarSesion() {
    try {
        localStorage.removeItem('tsp_user');
        console.log('🚪 Sesión cerrada');
        
        // Redirigir al login
        window.location.href = 'index.html';
    } catch (error) {
        console.error('❌ Error cerrando sesión:', error);
    }
}

// ===== INICIALIZACIÓN =====

// Probar conexión cuando se carga el archivo
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Supabase Client iniciado');
    
    const conectado = await probarConexion();
    mostrarEstadoConexion(conectado);
    
    if (!conectado) {
        console.warn('⚠️ Verificar configuración de Supabase');
    }
});

// ===== EXPORTAR FUNCIONES GLOBALES =====
window.TSP = {
    // Funciones de autenticación
    validarEstudiante,
    guardarSesionLocal,
    obtenerSesionLocal,
    cerrarSesion,
    
    // Funciones de datos
    obtenerLecturas,
    obtenerDesafios,
    obtenerEjercicios,
    registrarSesionMLC,
    
    // Utilidades
    probarConexion,
    mostrarEstadoConexion,
    
    // Cliente directo
    supabase
};

console.log('✅ TSP Supabase Client cargado - Funciones disponibles en window.TSP');