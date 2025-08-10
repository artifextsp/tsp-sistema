// ===================================================
// TSP SISTEMA - SUPABASE CLIENT
// Cliente para conexión con base de datos Supabase
// ===================================================

// Configuración de Supabase
const SUPABASE_URL = 'https://kryqjsncqsopjuwymhqd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeXFqc25jcXNvcGp1d3ltaHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjM3MDEsImV4cCI6MjA2ODg5OTcwMX0.w5HiaFiqlFJ_3QbcprUrufsOXTDWFg1zUMl2J7kWD6Y';

// Cliente Supabase simplificado
class SupabaseClient {
    constructor() {
        this.url = SUPABASE_URL;
        this.headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    }

    // Constructor de consultas
    from(table) {
        return new QueryBuilder(table, this);
    }

    // RPC (Remote Procedure Call) para funciones SQL
    async rpc(functionName, params = {}) {
        try {
            const url = `${this.url}/rest/v1/rpc/${functionName}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                throw new Error(`RPC Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return { data, error: null };

        } catch (error) {
            console.error(`Error en RPC ${functionName}:`, error);
            return { data: null, error };
        }
    }

    // Storage para archivos
    storage = {
        from: (bucket) => new StorageClient(bucket, this)
    };
}

// Constructor de consultas
class QueryBuilder {
    constructor(table, client) {
        this.table = table;
        this.client = client;
        this.query = {
            select: '*',
            filters: [],
            order: null,
            limit: null,
            single: false
        };
    }

    // Seleccionar columnas
    select(columns = '*') {
        this.query.select = columns;
        return this;
    }

    // Filtros
    eq(column, value) {
        this.query.filters.push(`${column}=eq.${encodeURIComponent(value)}`);
        return this;
    }

    neq(column, value) {
        this.query.filters.push(`${column}=neq.${encodeURIComponent(value)}`);
        return this;
    }

    gt(column, value) {
        this.query.filters.push(`${column}=gt.${encodeURIComponent(value)}`);
        return this;
    }

    gte(column, value) {
        this.query.filters.push(`${column}=gte.${encodeURIComponent(value)}`);
        return this;
    }

    lt(column, value) {
        this.query.filters.push(`${column}=lt.${encodeURIComponent(value)}`);
        return this;
    }

    lte(column, value) {
        this.query.filters.push(`${column}=lte.${encodeURIComponent(value)}`);
        return this;
    }

    like(column, pattern) {
        this.query.filters.push(`${column}=like.${encodeURIComponent(pattern)}`);
        return this;
    }

    in(column, values) {
        const valueString = values.map(v => encodeURIComponent(v)).join(',');
        this.query.filters.push(`${column}=in.(${valueString})`);
        return this;
    }

    // Ordenamiento
    order(column, options = {}) {
        const ascending = options.ascending !== false;
        this.query.order = `${column}.${ascending ? 'asc' : 'desc'}`;
        return this;
    }

    // Límite
    limit(count) {
        this.query.limit = count;
        return this;
    }

    // Resultado único
    single() {
        this.query.single = true;
        return this;
    }

    // Ejecutar consulta SELECT
    async execute() {
        try {
            let url = `${this.client.url}/rest/v1/${this.table}`;
            const params = new URLSearchParams();

            // Select
            params.append('select', this.query.select);

            // Filtros
            this.query.filters.forEach(filter => {
                const [column, condition] = filter.split('=', 2);
                params.append(column, condition);
            });

            // Ordenamiento
            if (this.query.order) {
                params.append('order', this.query.order);
            }

            // Límite
            if (this.query.limit) {
                params.append('limit', this.query.limit);
            }

            // Construir URL final
            url += '?' + params.toString();

            const response = await fetch(url, {
                method: 'GET',
                headers: this.client.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            let data = await response.json();

            // Si es single, devolver solo el primer elemento
            if (this.query.single) {
                data = data.length > 0 ? data[0] : null;
            }

            return { data, error: null };

        } catch (error) {
            console.error(`Error en consulta ${this.table}:`, error);
            return { data: null, error };
        }
    }

    // Insertar datos
    async insert(data) {
        try {
            const url = `${this.client.url}/rest/v1/${this.table}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: this.client.headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Insert Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return { data: result, error: null };

        } catch (error) {
            console.error(`Error insertando en ${this.table}:`, error);
            return { data: null, error };
        }
    }

    // Actualizar datos
    async update(data) {
        try {
            let url = `${this.client.url}/rest/v1/${this.table}`;
            const params = new URLSearchParams();

            // Agregar filtros para el update
            this.query.filters.forEach(filter => {
                const [column, condition] = filter.split('=', 2);
                params.append(column, condition);
            });

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url, {
                method: 'PATCH',
                headers: this.client.headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Update Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return { data: result, error: null };

        } catch (error) {
            console.error(`Error actualizando ${this.table}:`, error);
            return { data: null, error };
        }
    }

    // Eliminar datos
    async delete() {
        try {
            let url = `${this.client.url}/rest/v1/${this.table}`;
            const params = new URLSearchParams();

            // Agregar filtros para el delete
            this.query.filters.forEach(filter => {
                const [column, condition] = filter.split('=', 2);
                params.append(column, condition);
            });

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.client.headers
            });

            if (!response.ok) {
                throw new Error(`Delete Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return { data: result, error: null };

        } catch (error) {
            console.error(`Error eliminando de ${this.table}:`, error);
            return { data: null, error };
        }
    }
}

// Cliente de Storage simplificado
class StorageClient {
    constructor(bucket, client) {
        this.bucket = bucket;
        this.client = client;
    }

    // Obtener URL pública de un archivo
    getPublicUrl(path) {
        return {
            data: {
                publicUrl: `${this.client.url}/storage/v1/object/public/${this.bucket}/${path}`
            }
        };
    }

    // Subir archivo
    async upload(path, file, options = {}) {
        try {
            const url = `${this.client.url}/storage/v1/object/${this.bucket}/${path}`;
            
            const formData = new FormData();
            formData.append('file', file);

            const headers = {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            };

            if (options.upsert) {
                headers['x-upsert'] = 'true';
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Storage Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return { data: result, error: null };

        } catch (error) {
            console.error(`Error subiendo archivo:`, error);
            return { data: null, error };
        }
    }

    // Listar archivos
    async list(path = '', options = {}) {
        try {
            const url = `${this.client.url}/storage/v1/object/list/${this.bucket}`;
            
            const params = new URLSearchParams();
            if (path) params.append('prefix', path);
            if (options.limit) params.append('limit', options.limit);
            if (options.offset) params.append('offset', options.offset);

            const response = await fetch(url + '?' + params.toString(), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Storage List Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return { data: result, error: null };

        } catch (error) {
            console.error(`Error listando archivos:`, error);
            return { data: null, error };
        }
    }
}

// Crear instancia global del cliente
const supabaseClient = new SupabaseClient();

// Hacer disponible globalmente
window.supabaseClient = supabaseClient;

// Función de utilidad para testing de conexión
async function testSupabaseConnection() {
    try {
        console.log('🧪 Probando conexión a Supabase...');
        
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Error de conexión:', error);
            return false;
        }

        console.log('✅ Conexión a Supabase exitosa');
        return true;

    } catch (error) {
        console.error('❌ Error probando conexión:', error);
        return false;
    }
}

// Función de utilidad para verificar salud de la base de datos
async function checkDatabaseHealth() {
    try {
        const checks = {
            usuarios: false,
            lecturas: false,
            vocabulario: false,
            preguntas_vocabulario: false,
            preguntas_lectura: false
        };

        for (const table of Object.keys(checks)) {
            try {
                const { data, error } = await supabaseClient
                    .from(table)
                    .select('count')
                    .limit(1);
                
                checks[table] = !error;
            } catch (e) {
                checks[table] = false;
            }
        }

        console.log('🏥 Estado de la base de datos:', checks);
        return checks;

    } catch (error) {
        console.error('Error verificando salud de la base de datos:', error);
        return null;
    }
}

// Hacer funciones de utilidad disponibles globalmente
window.testSupabaseConnection = testSupabaseConnection;
window.checkDatabaseHealth = checkDatabaseHealth;