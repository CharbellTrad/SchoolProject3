/** @odoo-module **/

import { Component, useState, useRef, onMounted } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";

export class BodyMeasurementsWidget extends Component {
    static template = "body_measurements.BodyMeasurementsWidget";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.state = useState({
            height: this.props.record.data[this.props.name]?.height || 0.0,
            weight: this.props.record.data[this.props.name]?.weight || 0.0,
            size_shirt: this.props.record.data[this.props.name]?.size_shirt || false,
            size_pants: this.props.record.data[this.props.name]?.size_pants || 0.0,
            size_shoes: this.props.record.data[this.props.name]?.size_shoes || 0.0,
        });
        this.canva = useRef('person')
        onMounted(() => {
            const canvas = this.canva.el
            const ctx = canvas.getContext('2d');
            if (ctx) {
                /**
                 * Dibuja una figura de persona con bordes redondeados en el canvas.
                 * @param {CanvasRenderingContext2D} ctx - El contexto de renderizado 2D del canvas.
                 * @param {number} x - La coordenada x del centro de la figura.
                 * @param {number} y - La coordenada y de la parte superior de la figura.
                 * @param {number} ancho - El ancho total de la figura.
                 * @param {number} alto - El alto total de la figura.
                 */
                function dibujarPersona(ctx, x, y, ancho, alto) {
                            // Calcular dimensiones relativas
                            const radioCabeza = ancho * 0.2;
                            const cuerpoAncho = ancho * 0.5;
                            const cuerpoAlto = alto * 0.35;
                            const extremidadAncho = ancho * 0.2;
                            const extremidadAlto = alto * 0.4;
                            const espacioEntrePiernas = extremidadAncho * 0.4;
                            const radioBorde = 5;

                            // Limpiar el área antes de dibujar
                            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                            // Configurar el estilo de trazo (sin relleno)
                            ctx.strokeStyle = 'black';
                            ctx.lineWidth = 2;
                            ctx.lineJoin = 'round';
                            ctx.lineCap = 'round';

                            // 1. DIBUJAR LA CABEZA (círculo)
                            ctx.beginPath();
                            ctx.arc(x, y + radioCabeza, radioCabeza, 0, 2 * Math.PI);
                            ctx.stroke();

                            // 2. DIBUJAR EL CUERPO (rectángulo redondeado)
                            const cuerpoY = y + radioCabeza * 2;
                            const cuerpoX = x - cuerpoAncho / 2;
                            ctx.beginPath();
                            ctx.roundRect(cuerpoX, cuerpoY, cuerpoAncho, cuerpoAlto, radioBorde);
                            ctx.stroke();

                            // 3. DIBUJAR LOS BRAZOS
                            const brazoAncho = extremidadAncho;
                            const brazoXIzquierdo = x - cuerpoAncho / 2 - brazoAncho;
                            const brazoY = cuerpoY;
                            ctx.beginPath();
                            ctx.roundRect(brazoXIzquierdo, brazoY, brazoAncho, extremidadAlto * 0.75, radioBorde);
                            ctx.stroke();
                            
                            const brazoXDerecho = x + cuerpoAncho / 2;
                            ctx.beginPath();
                            ctx.roundRect(brazoXDerecho, brazoY, brazoAncho, extremidadAlto * 0.75, radioBorde);
                            ctx.stroke();

                            // 4. DIBUJAR LAS PIERNAS
                            const piernasY = cuerpoY + cuerpoAlto - 6;
                            
                            const piernaXIzquierda = x - espacioEntrePiernas / 2 - extremidadAncho;
                            ctx.beginPath();
                            ctx.roundRect(piernaXIzquierda, piernasY, extremidadAncho, extremidadAlto, radioBorde);
                            ctx.stroke();

                            const piernaXDerecha = x + espacioEntrePiernas / 2;
                            ctx.beginPath();
                            ctx.roundRect(piernaXDerecha, piernasY, extremidadAncho, extremidadAlto, radioBorde);
                            ctx.stroke();
                }
                const centroX = canvas.width / 2;
                const parteSuperiorY = 20;
                const anchoPersona = 120;
                const altoPersona = 340;
                dibujarPersona(ctx, centroX, parteSuperiorY, anchoPersona, altoPersona);
            } else {
                console.error("El navegador no soporta el elemento canvas.");
            }
                        
        })



    }

    onInputChange(field, ev) {
        const value = ev.target.value;
        this.state[field] = field === 'size' ? value : parseFloat(value) || 0;
        this.updateField();
    }

    updateField() {
        const jsonValue = {
            height: this.state.height,
            weight: this.state.weight,
            size_shirt: this.state.size_shirt,
            size_pants: this.state.size_pants,
            size_shoes: this.state.size_shoes,
        };
        this.props.record.update({
            [this.props.name]: jsonValue,
        });
    }
}
export const body_measurements = {
    component: BodyMeasurementsWidget,
    displayName: "Medidas del estudiante",
    supportedTypes: ["json"],
    extractProps: ({ attrs }) => ({
        name: attrs.name,
    })
}

registry.category("fields").add("body_measurements", body_measurements);