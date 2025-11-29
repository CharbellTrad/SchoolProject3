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

export class TopStudentsGraphField extends Component {
    static template = "school.TopStudentsGraphField";
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
     * Renderiza el gráfico de barras horizontales con los top 5 estudiantes
     */
    renderChart() {
        if (this.chart) {
            this.chart.destroy();
        }

        if (!this.data.top_students || this.data.top_students.length === 0) {
            return;
        }

        const config = this.getBarChartConfig();
        this.chart = new Chart(this.canvasRef.el, config);
    }

    getBarChartConfig() {
        const labels = [];
        const data = [];
        const backgroundColor = [];
        const studentIds = [];

        const colorApprove = getColor(10, cookie.get("color_scheme"), "odoo"); // Verde
        const colorFailed = getColor(1, cookie.get("color_scheme"), "odoo"); // Rojo

        this.data.top_students.forEach((student) => {
            labels.push(student.student_name);
            data.push(student.average);
            studentIds.push(student.student_id);
            
            // Color según el estado
            if (student.state === 'approve') {
                backgroundColor.push(colorApprove);
            } else {
                backgroundColor.push(colorFailed);
            }
        });

        const self = this;
        const maxValue = this.data.evaluation_type === '20' ? 20 : 100;

        return {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        backgroundColor,
                        data,
                        label: "Promedio",
                        borderWidth: 2,
                        borderColor: backgroundColor.map(color => color),
                    },
                ],
            },
            options: {
                indexAxis: 'y', // Gráfico horizontal
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const studentId = studentIds[index];
                        self.onBarClick(studentId);
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
                                const student = self.data.top_students[context.dataIndex];
                                let avgDisplay = '';
                                if (student.use_literal && student.literal_average) {
                                    avgDisplay = student.literal_average;
                                } else {
                                    const evaluationType = self.data.evaluation_type === '20' ? '/20' : '/100';
                                    avgDisplay = `${student.average}${evaluationType}`;
                                }
                                const state = student.state === 'approve' ? 'Aprobado' : 'Reprobado';
                                return [
                                    `Promedio: ${avgDisplay}`,
                                    `Estado: ${state}`
                                ];
                            }
                        }
                    },
                },
                scales: {
                    x: {
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
                            text: `Promedio (Base ${self.data.evaluation_type})`,
                            color: GRAPH_LABEL_COLOR,
                        }
                    },
                    y: {
                        grid: {
                            color: GRAPH_GRID_COLOR,
                        },
                        ticks: {
                            color: GRAPH_LABEL_COLOR,
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
     * Maneja el clic en una barra del gráfico
     */
    onBarClick(studentId) {
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            name: 'Ficha del Estudiante',
            res_model: 'res.partner',
            views: [[false, 'form']],
            res_id: studentId,
            target: 'current',
        });
    }
}

export const topStudentsGraphField = {
    component: TopStudentsGraphField,
    supportedTypes: ["json"],
};

registry.category("fields").add("top_students_graph", topStudentsGraphField);

