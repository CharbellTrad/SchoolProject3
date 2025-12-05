import { loadBundle } from "@web/core/assets";
import { registry } from "@web/core/registry";
import { getColor, getCustomColor } from "@web/core/colors/colors";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

import { Component, onWillStart, useEffect, useRef } from "@odoo/owl";
import { cookie } from "@web/core/browser/cookie";

export class SubjectsAverageGraphField extends Component {
    static template = "school.SubjectsAverageGraphField";
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
     * Renderiza el gráfico de barras con los promedios por materia
     */
    renderChart() {
        if (this.chart) {
            this.chart.destroy();
        }

        if (!this.data?.subjects?.length) {
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

        const colorApprove = getColor(10, this.colorScheme, "odoo");
        const colorFailed = getColor(1, this.colorScheme, "odoo");
        const minScore = this.data.evaluation_type === '20' ? 10 : 50;

        this.data.subjects.forEach((subject) => {
            labels.push(subject.subject_name);
            data.push(subject.average);
            subjectIds.push(subject.subject_id);
            backgroundColor.push(subject.average >= minScore ? colorApprove : colorFailed);
        });

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
                        borderColor: backgroundColor,
                    },
                ],
            },
            options: {
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        this.onBarClick(subjectIds[index]);
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
                                const subject = this.data.subjects[context.dataIndex];
                                const evaluationType = this.data.evaluation_type === '20' ? '/20' : '/100';
                                return [
                                    `Promedio: ${subject.average}${evaluationType}`,
                                    `Estudiantes: ${subject.total_students}`,
                                    `Aprobados: ${subject.approved_students}`,
                                    `Reprobados: ${subject.failed_students}`
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
    onBarClick(subjectId) {
        const sectionId = this.props.record.evalContext.id;
        const yearId = this.props.record.data.year_id.id;

        this.actionService.doAction({
            type: 'ir.actions.act_window',
            name: 'Evaluaciones de la Materia',
            res_model: 'school.evaluation.score',
            views: [[false, 'list']],
            domain: [
                ['section_id', '=', sectionId],
                ['subject_id', '=', subjectId],
                ['year_id', '=', yearId],
            ],
            context: {
                default_section_id: sectionId,
                default_subject_id: subjectId,
            },
            target: 'current',
        });
    }
}

export const subjectsAverageGraphField = {
    component: SubjectsAverageGraphField,
    supportedTypes: ["json"],
};

registry.category("fields").add("subjects_average_graph", subjectsAverageGraphField);
