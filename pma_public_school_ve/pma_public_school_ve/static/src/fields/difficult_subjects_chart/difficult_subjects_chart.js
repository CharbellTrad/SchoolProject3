/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, useEffect, useRef } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { loadBundle } from "@web/core/assets";
import { getColor } from "@web/core/colors/colors";
import { cookie } from "@web/core/browser/cookie";

export class DifficultSubjectsChart extends Component {
    static template = "school.DifficultSubjectsChart";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.chart = null;
        this.canvasRef = useRef("canvas");
        this.data = this.props.record.data[this.props.name];

        onWillStart(async () => {
            await loadBundle("web.chartjs_lib");
        });

        useEffect(() => {
            this.renderChart();
            return () => {
                if (this.chart) {
                    this.chart.destroy();
                }
            };
        });
    }

    get subjects() {
        return this.data?.subjects || [];
    }

    renderChart() {
        if (this.chart) {
            this.chart.destroy();
        }

        if (!this.subjects || this.subjects.length === 0) {
            return;
        }

        const colorScheme = cookie.get("color_scheme");
        const labels = this.subjects.map(s => s.subject_name);
        const failureRates = this.subjects.map(s => s.failure_rate);
        const averages = this.subjects.map(s => s.average);

        // Colores degradados según tasa de reprobación
        const backgroundColors = failureRates.map(rate => {
            if (rate >= 50) return 'rgba(220, 53, 69, 0.7)';  // Rojo
            if (rate >= 30) return 'rgba(255, 193, 7, 0.7)';  // Amarillo
            return 'rgba(40, 167, 69, 0.7)';  // Verde
        });

        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tasa de Reprobación (%)',
                    data: failureRates,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(c => c.replace('0.7', '1')),
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                const index = context.dataIndex;
                                const subject = this.subjects[index];
                                return [
                                    `Promedio: ${subject.average}`,
                                    `Total estudiantes: ${subject.total_students}`,
                                    `Reprobados: ${subject.failed_students}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Tasa de Reprobación (%)'
                        }
                    }
                }
            }
        };

        this.chart = new Chart(this.canvasRef.el, config);
    }
}

registry.category("fields").add("difficult_subjects_chart", {
    component: DifficultSubjectsChart,
    supportedTypes: ["json"],
});
