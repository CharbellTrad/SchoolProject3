/** @odoo-module **/

import { Component, useState, onWillStart, onWillUpdateProps } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

class FilePreviewWidget extends Component {
    static template = "file_preview.FilePreviewWidget";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.notification = useService("notification");
        
        this.state = useState({
            fileData: null,
            fileName: null,
            fileType: null,
            previewUrl: null,
            isLoading: false,
        });

        onWillStart(async () => {
            this.loadFileData();
        });

        onWillUpdateProps(async (nextProps) => {
            this.loadFileData(nextProps);
        });
    }

    loadFileData(props = this.props) {
        const record = props.record;
        const fieldName = props.name;
        const fileData = record.data[fieldName];
        
        console.log(fieldName)
        console.log(fileData)

        // Obtener el nombre del archivo si existe un campo relacionado
        const fileNameField = `${fieldName}_filename`;
        const fileName = record.data[fileNameField] || 'archivo';
        
        if (fileData) {
            this.state.fileData = fileData;
            this.state.fileName = fileName;
            this.state.fileType = this.getFileType(fileName);
            this.generatePreview(fileData, this.state.fileType);
        } else {
            this.clearState();
        }
    }

    getFileType(fileName) {
        if (!fileName) return null;
        const extension = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png'].includes(extension)) {
            return 'image';
        } else if (extension === 'pdf') {
            return 'pdf';
        }
        return null;
    }

    async generatePreview(fileData, fileType) {
        if (!fileData || !fileType) {
            this.state.previewUrl = null;
            return;
        }

        if (fileType === 'image') {
            this.state.previewUrl = `data:image/*;base64,${fileData}`;
        } else if (fileType === 'pdf') {
            // Para PDF, generamos una URL de datos
            this.state.previewUrl = `data:application/pdf;base64,${fileData}`;
            // Intentar cargar la primera página usando PDF.js si está disponible
            this.loadPdfPreview(fileData);
        }
    }

    async loadPdfPreview(fileData) {
        // Verificar si PDF.js está disponible
        if (typeof pdfjsLib === 'undefined') {
            console.warn('PDF.js no está disponible');
            return;
        }

        try {
            const pdfData = atob(fileData);
            const loadingTask = pdfjsLib.getDocument({ data: pdfData });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            
            const scale = 1.5;
            const viewport = page.getViewport({ scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            this.state.previewUrl = canvas.toDataURL();
        } catch (error) {
            console.error('Error al cargar PDF:', error);
        }
    }

    onFileChange(ev) {
        const file = ev.target.files[0];
        if (!file) return;

        // Validar el tipo de archivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            this.notification.add(
                'Solo se permiten archivos PNG, JPG y PDF',
                { type: 'warning' }
            );
            ev.target.value = '';
            return;
        }

        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.notification.add(
                'El archivo es demasiado grande. Máximo 10MB',
                { type: 'warning' }
            );
            ev.target.value = '';
            return;
        }

        this.state.isLoading = true;

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result.split(',')[1];
            this.updateField(base64, file.name);
            this.state.isLoading = false;
            ev.target.value = '';
        };
        reader.onerror = () => {
            this.notification.add(
                'Error al cargar el archivo',
                { type: 'danger' }
            );
            this.state.isLoading = false;
            ev.target.value = '';
        };
        reader.readAsDataURL(file);
    }

    updateField(base64Data, fileName) {
        const fieldName = this.props.name;
        const fileNameField = `${fieldName}_filename`;
        
        const updates = {
            [fieldName]: base64Data,
        };
        
        // Solo actualizar el nombre si el campo existe
        if (fileNameField in this.props.record.data) {
            updates[fileNameField] = fileName;
        }
        
        this.props.record.update(updates);
    }

    onClearFile() {
        if (this.props.readonly) return;
        
        const fieldName = this.props.name;
        const fileNameField = `${fieldName}_filename`;
        
        const updates = {
            [fieldName]: false,
        };
        
        if (fileNameField in this.props.record.data) {
            updates[fileNameField] = false;
        }
        
        this.props.record.update(updates);
        this.clearState();
    }

    clearState() {
        this.state.fileData = null;
        this.state.fileName = null;
        this.state.fileType = null;
        this.state.previewUrl = null;
    }

    onDownloadFile() {
        if (!this.state.fileData) return;

        const linkSource = this.state.fileType === 'image' 
            ? `data:image/*;base64,${this.state.fileData}`
            : `data:application/pdf;base64,${this.state.fileData}`;
        
        const downloadLink = document.createElement('a');
        downloadLink.href = linkSource;
        downloadLink.download = this.state.fileName || 'archivo';
        downloadLink.click();
    }

    triggerFileInput() {
        if (this.props.readonly) return;
        const fileInput = document.querySelector(`#file-input-${this.props.id}`);
        if (fileInput) {
            fileInput.click();
        }
    }
}

registry.category("fields").add("file_preview", {
    component: FilePreviewWidget,
    displayName: "Preview de pdf/imagen",
    supportedTypes: ["binary"],
    extractProps: ({ attrs }) => ({
        name: attrs.name,
    })
});