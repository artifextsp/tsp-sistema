// ===================================================
// TSP SISTEMA - PDF MANAGER (BÁSICO)
// Gestión básica de PDFs - versión temporal
// ===================================================

class PDFManager {
    constructor() {
        this.currentPDF = null;
        this.zoomLevel = 1;
    }

    // Cargar PDF en el visor
    loadPDF(url, viewerId = 'pdf-viewer') {
        try {
            const viewer = document.getElementById(viewerId);
            if (!viewer) {
                throw new Error(`Visor PDF ${viewerId} no encontrado`);
            }

            viewer.src = url;
            this.currentPDF = url;
            
            console.log('✅ PDF cargado:', url);
            return true;

        } catch (error) {
            console.error('❌ Error cargando PDF:', error);
            ErrorHandler.show('Error cargando el documento PDF', error);
            return false;
        }
    }

    // Zoom in
    zoomIn() {
        // Implementación básica - puede mejorarse
        console.log('🔍 Zoom in solicitado');
        Toast.info('Usa Ctrl + Plus para hacer zoom');
    }

    // Zoom out
    zoomOut() {
        // Implementación básica - puede mejorarse
        console.log('🔍 Zoom out solicitado');
        Toast.info('Usa Ctrl + Minus para reducir zoom');
    }

    // Verificar si PDF está cargado
    isLoaded() {
        return this.currentPDF !== null;
    }
}

// Hacer disponible globalmente
window.PDFManager = PDFManager;