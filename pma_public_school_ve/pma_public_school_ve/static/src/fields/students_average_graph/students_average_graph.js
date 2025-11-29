import { loadBundle } from "@web/core/assets";
import { registry } from "@web/core/registry";
import { getColor, getCustomColor } from "@web/core/colors/colors";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

import { Component, onWillStart, useEffect, useRef } from "@odoo/owl";
import { cookie } from "@web/core/browser/cookie";

export class StudentsAverageGraphField extends Component {
    static template = "school.StudentsAverageGraphField";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.chart = null;
        this.canvasRef = useRef("canvas");
        this.actionService = useService("action");

        this.data = this.props.record.data[this.props.name];

        // Cache color scheme
        this.colorScheme = cookie.get("color_scheme");
        this.GRAPH_GRID_COLOR = getCustomColor(this.colorScheme, "#d8dadd", "#3C3E4B");
        this.GRAPH_LABEL_COLOR = getCustomColor(this.colorScheme, "#111827", "#E4E4E4");

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
     * Renderiza el gráfico de barras con los promedios de estudiantes
     */
    renderChart() {
        if (this.chart) {
            this.chart.destroy();
        }

        if (!this.data?.students?.length) {
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

        const colorApprove = getColor(10, this.colorScheme, "odoo");
        const colorFailed = getColor(1, this.colorScheme, "odoo");

        this.data.students.forEach((student) => {
            labels.push(student.student_name);
            data.push(student.average);
            studentIds.push(student.student_id);
            backgroundColor.push(student.state === 'approve' ? colorApprove : colorFailed);
        });

        const maxValue = this.data.evaluation_type === '20' ? 20 : 100;

        return {
            type: "horizontalBar",
            data: {
                labels,
                datasets: [
                    {
                        backgroundColor,
                        data,
                        label: "Promedio",
                        borderWidth: 2,
                        borderColor: backgroundColor,
                    },
                ],
            },
            options: {
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        this.onBarClick(studentIds[index]);
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
                            label: (context) => {
                                const student = this.data.students[context.dataIndex];
                                const evaluationType = this.data.evaluation_type === '20' ? '/20' : '/100';
                                const state = student.state === 'approve' ? 'Aprobado' : 'Reprobado';
                                return [
                                    `Promedio: ${student.average}${evaluationType}`,
                                    `Estado: ${state}`
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
                            color: this.GRAPH_GRID_COLOR,
                        },
                        ticks: {
                            color: this.GRAPH_LABEL_COLOR,
                        },
                        border: {
                            color: this.GRAPH_GRID_COLOR,
                        },
                        title: {
                            display: true,
                            text: `Promedio (Base ${this.data.evaluation_type})`,
                            color: this.GRAPH_LABEL_COLOR,
                        }
                    },
                    x: {
                        grid: {
                            color: this.GRAPH_GRID_COLOR,
                        },
                        ticks: {
                            color: this.GRAPH_LABEL_COLOR,
                            maxRotation: 45,
                            minRotation: 45,
                        },
                        border: {
                            color: this.GRAPH_GRID_COLOR,
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

export const studentsAverageGraphField = {
    component: StudentsAverageGraphField,
    supportedTypes: ["json"],
};

registry.category("fields").add("students_average_graph", studentsAverageGraphField);
