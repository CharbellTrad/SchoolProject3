/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, useEffect, useRef } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { loadBundle } from "@web/core/assets";
import { getColor } from "@web/core/colors/colors";
import { cookie } from "@web/core/browser/cookie";

export class StudentsDistributionChart extends Component {
    static template = "school.StudentsDistributionChart";
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

    renderChart() {
        if (this.chart) {
            this.chart.destroy();
        }

        if (!this.data || !this.data.data || this.data.total === 0) {
            return;
        }

        const colorScheme = cookie.get("color_scheme");
        const colors = [
            getColor(8, colorScheme),  // Azul para Preescolar
            getColor(10, colorScheme), // Verde para Primaria
            getColor(3, colorScheme)   // Naranja para Media General
        ];

        const config = {
            type: 'doughnut',
            data: {
                labels: this.data.labels,
                datasets: [{
                    data: this.data.data,
                    backgroundColor: colors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const percentage = ((value / this.data.total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        this.chart = new Chart(this.canvasRef.el, config);
    }
}

registry.category("fields").add("students_distribution_chart", {
    component: StudentsDistributionChart,
    supportedTypes: ["json"],
});
