import { loadBundle } from "@web/core/assets";
import { registry } from "@web/core/registry";
import { getColor, hexToRGBA, getCustomColor } from "@web/core/colors/colors";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

import { Component, onWillStart, useEffect, useRef } from "@odoo/owl";
import { cookie } from "@web/core/browser/cookie";

const colorScheme = cookie.get("color_scheme");

export class GeneralPerformanceGraphField extends Component {
    static template = "school.GeneralPerformanceGraphField";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.chart = null;
        this.canvasRef = useRef("canvas");
        this.actionService = useService("action");
        
        this.data = this.props.record.data[this.props.name];

        onWillStart(async () => await loadBundle("web.chartjs_lib"));

        useEffect(() => {
            this.renderChart();
            return () => {
                if (this.chart) {
                    this.chart.destroy();
                }
            };
        });
    }

    /**
     * Renderiza el gráfico de torta con el rendimiento general
     */
    renderChart() {
        if (this.chart) {
            this.chart.destroy();
        }

        if (!this.data.total_subjects || this.data.total_subjects === 0) {
            return;
        }

        const config = this.getPieChartConfig();
        this.chart = new Chart(this.canvasRef.el, config);
    }

    getPieChartConfig() {
        const colorApprove = getColor(10, cookie.get("color_scheme"), "odoo"); // Verde
        const colorFailed = getColor(1, cookie.get("color_scheme"), "odoo"); // Rojo

        const data = {
            labels: ['Aprobadas', 'Reprobadas'],
            datasets: [{
                data: [this.data.subjects_approved, this.data.subjects_failed],
                backgroundColor: [colorApprove, colorFailed],
                borderColor: [colorApprove, colorFailed],
                borderWidth: 2,
            }]
        };

        return {
            type: 'pie',
            data: data,
            options: {
                onClick: () => this.onChartClick(),
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 13,
                            },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: `${label}: ${data.datasets[0].data[i]} materias`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i
                                }));
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = this.data.total_subjects;
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };
    }

    onChartClick() {
        const studentId = this.props.record.evalContext.id;
        const yearId = this.props.record.data.year_id.id;
        
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            name: 'Notas de la Materias',
            res_model: 'school.evaluation.score',
            views: [[false, 'list']],
            domain: [
                ['student_id', '=', studentId],
                ['year_id', '=', yearId],
            ],
            context: {
                default_student_id: studentId,
                group_by: 'subject_id'
            },
            target: 'current',
        });
    }

    /**
     * Obtiene la información del rendimiento para mostrar
     */
    get performanceInfo() {
        if (!this.data.total_subjects || this.data.total_subjects === 0) {
            return null;
        }

        let average = '';
        let averageLabel = '';
        
        if (this.data.use_literal) {
            average = this.data.literal_average || 'N/A';
            averageLabel = 'Literal Promedio';
        } else {
            const suffix = this.data.evaluation_type === '20' ? '/20' : '/100';
            average = `${this.data.general_average}${suffix}`;
            averageLabel = 'Promedio General';
        }

        return {
            average: average,
            averageLabel: averageLabel,
            state: this.data.general_state === 'approve' ? 'Aprobado' : 'Reprobado',
            stateClass: this.data.general_state === 'approve' ? 'text-success' : 'text-danger',
            stateBadgeClass: this.data.general_state === 'approve' ? 'bg-success' : 'bg-danger',
            totalSubjects: this.data.total_subjects,
            approvalPercentage: this.data.approval_percentage || 0,
            subjectsApproved: this.data.subjects_approved || 0,
            subjectsFailed: this.data.subjects_failed || 0,
        };
    }

    /**
     * Obtiene el color del indicador de promedio
     */
    get averageColor() {
        if (this.data.use_literal) {
            const literal = this.data.literal_average;
            if (literal === 'A') return '#28a745'; // Verde oscuro
            if (literal === 'B') return '#5cb85c'; // Verde claro
            if (literal === 'C') return '#f0ad4e'; // Amarillo
            if (literal === 'D') return '#ff9800'; // Naranja
            return '#dc3545'; // Rojo
        } else {
            const avg = this.data.general_average;
            const max = this.data.evaluation_type === '20' ? 20 : 100;
            const min = this.data.evaluation_type === '20' ? 10 : 50;
            
            if (avg >= min) return '#28a745'; // Verde
            return '#dc3545'; // Rojo
        }
    }
}

export const generalPerformanceGraphField = {
    component: GeneralPerformanceGraphField,
    supportedTypes: ["json"],
};

registry.category("fields").add("general_performance_graph", generalPerformanceGraphField);