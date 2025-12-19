/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, useEffect, useRef } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { loadBundle } from "@web/core/assets";

/**
 * Widget: Difficult Subjects Chart
 * 
 * Displays a horizontal bar chart of the top 10 most difficult subjects
 * (highest failure rates).
 */
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

    get hasData() {
        return this.subjects.length > 0;
    }

    /**
     * Get gradient color based on failure rate (higher = more red)
     */
    getFailureColor(rate) {
        // Gradient from orange (low failure) to red (high failure)
        const r = 220 + Math.min(35, rate * 0.35);
        const g = Math.max(60, 180 - rate * 1.8);
        const b = 60;
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }

    /**
     * Render horizontal bar chart
     */
    renderChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        if (!this.hasData || !this.canvasRef.el) {
            return;
        }

        const labels = this.subjects.map(s => s.subject_name);
        const data = this.subjects.map(s => s.failure_rate);
        const colors = this.subjects.map(s => this.getFailureColor(s.failure_rate));

        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tasa de Reprobación (%)',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 4,
                    barThickness: 20
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const subject = this.subjects[context.dataIndex];
                                return [
                                    `Reprobación: ${subject.failure_rate}%`,
                                    `Reprobados: ${subject.failed_students} de ${subject.total_students}`,
                                    `Promedio: ${subject.average}/20`
                                ];
                            }
                        }
                    }
                }
            }
        };

        this.chart = new Chart(this.canvasRef.el, config);
    }

    /**
     * Get difficulty level label
     */
    getDifficultyLabel(rate) {
        if (rate >= 50) return 'Muy Difícil';
        if (rate >= 30) return 'Difícil';
        if (rate >= 15) return 'Moderada';
        return 'Normal';
    }

    /**
     * Get difficulty badge class
     */
    getDifficultyClass(rate) {
        if (rate >= 50) return 'bg-danger';
        if (rate >= 30) return 'bg-warning text-dark';
        if (rate >= 15) return 'bg-info';
        return 'bg-success';
    }
}

registry.category("fields").add("difficult_subjects_chart", {
    component: DifficultSubjectsChart,
    supportedTypes: ["json"],
});
