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

export class StudentScoresGraphField extends Component {
    static template = "school.StudentScoresGraphField";
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
     * Renderiza el gráfico de barras con los promedios por materia
     */
    renderChart() {
        if (this.chart) {
            this.chart.destroy();
        }

        if (!this.data.subjects || this.data.subjects.length === 0) {
            return;
        }

        const config = this.getBarChartConfig();
        this.chart = new Chart(this.canvasRef.el, config);
    }

    getBarChartConfig() {
        const labels = [];
        const data = [];
        const backgroundColor = [];
        const subjectIds = [];

        const colorApprove = getColor(10, cookie.get("color_scheme"), "odoo"); // Verde
        const colorFailed = getColor(1, cookie.get("color_scheme"), "odoo"); // Rojo

        this.data.subjects.forEach((subject) => {
            labels.push(subject.subject_name);
            data.push(subject.average);
            subjectIds.push(subject.subject_id);
            
            // Color según el estado
            if (subject.state === 'approve') {
                backgroundColor.push(colorApprove);
            } else {
                backgroundColor.push(colorFailed);
            }
        });

        const self = this;

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
                onClick: (event, elements) => {
                    console.log(elements);
                    console.log(event);
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        console.log("Index clicked:", index);
                        const subjectId = subjectIds[index];
                        console.log("Index clicked:", subjectId);
                        self.onBarClick(subjectId);
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
                                const subject = self.data.subjects[context.dataIndex];
                                const evaluationType = self.data.evaluation_type === '20' ? '/20' : '/100';
                                const state = subject.state === 'approve' ? 'Aprobado' : 'Desaprobado';
                                return [
                                    `Promedio: ${subject.average}${evaluationType}`,
                                    `Estado: ${state}`,
                                    `Evaluaciones: ${subject.num_evaluations}`
                                ];
                            }
                        }
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: this.data.evaluation_type === '20' ? 20 : 100,
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
                            text: `Promedio (Base ${this.data.evaluation_type})`,
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
     * Maneja el clic en una barra del gráfico
     * Abre una vista con las notas de la materia seleccionada
     */
    onBarClick(subjectId) {
        const studentId = this.props.record.evalContext.id;
        const yearId = this.props.record.data.year_id.id;
        
        console.log("Subject ID clicked:", subjectId);
        console.log("studentId ID clicked:", studentId);

        console.log("yearId ID clicked:", yearId);

        this.actionService.doAction({
            type: 'ir.actions.act_window',
            name: 'Notas de la Materia',
            res_model: 'school.evaluation.score',
            views: [[false, 'list']],
            domain: [
                ['student_id', '=', studentId],
                ['subject_id', '=', subjectId],
                ['year_id', '=', yearId],
            ],
            context: {
                default_student_id: studentId,
                default_subject_id: subjectId,
            },
            target: 'current',
        });
    }
}

export const studentScoresGraphField = {
    component: StudentScoresGraphField,
    supportedTypes: ["json"],
};

registry.category("fields").add("student_scores_graph", studentScoresGraphField);