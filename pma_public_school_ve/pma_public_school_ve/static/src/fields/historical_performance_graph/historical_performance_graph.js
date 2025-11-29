import { loadBundle } from "@web/core/assets";
import { registry } from "@web/core/registry";
import { getColor, hexToRGBA, getCustomColor } from "@web/core/colors/colors";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

import { Component, onWillStart, useEffect, useRef } from "@odoo/owl";
import { cookie } from "@web/core/browser/cookie";

const colorScheme = cookie.get("color_scheme");
const GRAPH_GRID_COLOR = getCustomColor(colorScheme, "#d8dadd", "#3C3E4B");
const GRAPH_LABEL_COLOR = getCustomColor(colorScheme, "#111827", "#E4E4E4");

export class HistoricalPerformanceGraphField extends Component {
    static template = "school.HistoricalPerformanceGraphField";
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
     * Renderiza el gráfico de línea con el rendimiento histórico
     */
    renderChart() {
        if (this.chart) {
            this.chart.destroy();
        }

        if (!this.data.years || this.data.years.length === 0) {
            return;
        }

        const config = this.getLineChartConfig();
        this.chart = new Chart(this.canvasRef.el, config);
    }

    getLineChartConfig() {
        const labels = [];
        const data = [];
        const backgroundColor = [];
        const yearIds = [];
        const sectionIds = [];

        const colorApprove = getColor(10, cookie.get("color_scheme"), "odoo"); // Verde
        const colorFailed = getColor(1, cookie.get("color_scheme"), "odoo"); // Rojo

        this.data.years.forEach((year) => {
            labels.push(`${year.year_name} - ${year.section_name}`);
            data.push(year.average);
            yearIds.push(year.year_id);
            sectionIds.push(year.section_id);
            
            // Color según el estado
            if (year.state === 'approve') {
                backgroundColor.push(colorApprove);
            } else {
                backgroundColor.push(colorFailed);
            }
        });

        const self = this;
        const maxValue = 20; // Usamos 20 como máximo para el gráfico histórico

        return {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Promedio",
                        data,
                        borderColor: getColor(0, cookie.get("color_scheme"), "odoo"),
                        backgroundColor: hexToRGBA(getColor(0, cookie.get("color_scheme"), "odoo"), 0.1),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: backgroundColor,
                        pointBorderColor: backgroundColor,
                        pointBorderWidth: 2,
                    },
                ],
            },
            options: {
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const yearId = yearIds[index];
                        const sectionId = sectionIds[index];
                        self.onPointClick(yearId, sectionId);
                    }
                },
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        enabled: true,
                        intersect: false,
                        position: "nearest",
                        caretSize: 5,
                        callbacks: {
                            label: function(context) {
                                const year = self.data.years[context.dataIndex];
                                return [
                                    `Año: ${year.year_name}`,
                                    `Sección: ${year.section_name}`,
                                    `Promedio: ${year.average_display}`,
                                    `Estado: ${year.state === 'approve' ? 'Aprobado' : 'Reprobado'}`,
                                    `Materias: ${year.total_subjects} (${year.subjects_approved} aprobadas, ${year.subjects_failed} reprobadas)`
                                ];
                            }
                        }
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: maxValue,
                        grid: {
                            color: GRAPH_GRID_COLOR,
                        },
                        ticks: {
                            color: GRAPH_LABEL_COLOR,
                        },
                        border: {
                            color: GRAPH_GRID_COLOR,
                        },
                        title: {
                            display: true,
                            text: "Promedio",
                            color: GRAPH_LABEL_COLOR,
                        }
                    },
                    x: {
                        grid: {
                            color: GRAPH_GRID_COLOR,
                        },
                        ticks: {
                            color: GRAPH_LABEL_COLOR,
                            maxRotation: 45,
                            minRotation: 45,
                        },
                        border: {
                            color: GRAPH_GRID_COLOR,
                        },
                    },
                },
                maintainAspectRatio: false,
                responsive: true,
            },
        };
    }

    /**
     * Maneja el clic en un punto del gráfico
     */
    onPointClick(yearId, sectionId) {
        const studentId = this.props.record.evalContext.id;
        
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            name: 'Evaluaciones del Año',
            res_model: 'school.evaluation.score',
            views: [[false, 'list']],
            domain: [
                ['student_id.student_id', '=', studentId],
                ['year_id', '=', yearId],
                ['section_id', '=', sectionId],
            ],
            context: {
                default_student_id: studentId,
            },
            target: 'current',
        });
    }
}

export const historicalPerformanceGraphField = {
    component: HistoricalPerformanceGraphField,
    supportedTypes: ["json"],
};

registry.category("fields").add("historical_performance_graph", historicalPerformanceGraphField);

