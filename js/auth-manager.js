// ===================================================
// TSP SISTEMA - AUTH MANAGER
// Gestión de autenticación y usuarios
// ===================================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'tsp_current_user';
    }

    // Verificar si hay un usuario logueado
    static async getCurrentUser() {
        try {
            // Intentar obtener de sessionStorage primero
            const storedUser = sessionStorage.getItem('tsp_current_user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                
                // Verificar que el usuario sigue siendo válido en la base de datos
                const { data, error } = await supabaseClient
                    .from('usuarios')
                    .select('*')
                    .eq('id', userData.id)
                    .eq('estado', 'ACTIVO')
                    .single();

                if (error || !data) {
                    // Usuario no válido, limpiar sesión
                    AuthManager.logout();
                    return null;
                }

                return data;
            }

            return null;
        } catch (error) {
            console.error('Error verificando usuario actual:', error);
            AuthManager.logout();
            return null;
        }
    }

    // Login con código de estudiante
    static async loginWithCode(codigo) {
        try {
            // Limpiar y validar código
            const codigoLimpio = codigo.trim().toUpperCase();
            
            if (codigoLimpio.length < 4) {
                throw new Error('El código debe tener al menos 4 caracteres');
            }

            // Buscar usuario en la base de datos
            const { data: usuario, error } = await supabaseClient
                .from('usuarios')
                .select('*')
                .eq('codigo_acceso', codigoLimpio)
                .eq('estado', 'ACTIVO')
                .single();

            if (error || !usuario) {
                throw new Error('Código no válido o usuario inactivo');
            }

            // Guardar usuario en sesión
            sessionStorage.setItem('tsp_current_user', JSON.stringify(usuario));
            
            console.log('✅ Login exitoso:', usuario.nombre_completo);
            return usuario;

        } catch (error) {
            console.error('❌ Error en login:', error);
            throw error;
        }
    }

    // Cerrar sesión
    static logout() {
        sessionStorage.removeItem('tsp_current_user');
        localStorage.removeItem('tsp_current_user'); // Por si acaso
        console.log('🚪 Sesión cerrada');
    }

    // Verificar si el usuario tiene acceso a un módulo específico
    static async canAccessModule(moduleName) {
        const user = await AuthManager.getCurrentUser();
        if (!user) return false;

        // Por ahora todos los usuarios activos pueden acceder a MLC
        // En el futuro se pueden agregar restricciones por grado, ciclo, etc.
        switch (moduleName) {
            case 'MLC':
                return true;
            case 'MDC':
                return user.grado >= 3; // Ejemplo: solo grado 3 en adelante
            case 'MED':
                return user.grado >= 4; // Ejemplo: solo grado 4 en adelante
            default:
                return false;
        }
    }

    // Obtener información del grado y ciclo actual
    static async getUserContext() {
        const user = await AuthManager.getCurrentUser();
        if (!user) return null;

        try {
            // Obtener información del ciclo actual
            const { data: ciclo, error } = await supabaseClient
                .from('ciclos')
                .select('*')
                .eq('grado', user.grado)
                .eq('numero_ciclo', user.ciclo_actual)
                .eq('estado', 'ACTIVO')
                .single();

            return {
                usuario: user,
                ciclo: ciclo,
                grado: user.grado,
                cicloActual: user.ciclo_actual
            };

        } catch (error) {
            console.error('Error obteniendo contexto del usuario:', error);
            return {
                usuario: user,
                ciclo: null,
                grado: user.grado,
                cicloActual: user.ciclo_actual
            };
        }
    }

    // Actualizar última actividad del usuario
    static async updateLastActivity() {
        const user = await AuthManager.getCurrentUser();
        if (!user) return;

        try {
            await supabaseClient
                .from('usuarios')
                .update({ 
                    fecha_actualizacion: new Date().toISOString() 
                })
                .eq('id', user.id);
        } catch (error) {
            // Silencioso - no es crítico si falla
            console.warn('No se pudo actualizar última actividad:', error);
        }
    }

    // Verificar permisos para una lectura específica
    static async canAccessLectura(lecturaId) {
        const context = await AuthManager.getUserContext();
        if (!context) return false;

        try {
            const { data: lectura, error } = await supabaseClient
                .from('lecturas')
                .select('grado, ciclo, estado')
                .eq('id', lecturaId)
                .single();

            if (error || !lectura) return false;

            // Verificar que la lectura sea para el grado y ciclo del usuario
            return lectura.grado === context.grado && 
                   lectura.ciclo === context.cicloActual &&
                   lectura.estado === 'ACTIVA';

        } catch (error) {
            console.error('Error verificando acceso a lectura:', error);
            return false;
        }
    }
}

// Hacer disponible globalmente
window.AuthManager = AuthManager;