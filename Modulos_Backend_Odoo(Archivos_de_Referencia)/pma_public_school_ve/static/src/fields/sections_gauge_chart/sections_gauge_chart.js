/** @odoo-module **/

import { loadBundle } from "@web/core/assets";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { Component, onWillStart, onMounted, onWillUnmount, useRef } from "@odoo/owl";

/**
 * Widget: Sections Polar Area Chart
 * Polar area chart showing section distribution by level
 */
export class SectionsPolarChart extends Component {
    static template = "school.SectionsPolarChart";
    static props = { ...standardFieldProps };

    setup() {
        this.chart = null;
        this.canvasRef = useRef("canvas");
        this.data = this.props.record.data[this.props.name];

        this.levelColors = ['#FFB300', '#43A047', '#1E88E5'];
        this.levelIcons = ['fa-child', 'fa-book', 'fa-graduation-cap'];
        this.levelKeys = ['pre', 'primary', 'secundary'];

        onWillStart(async () => await loadBundle("web.chartjs_lib"));

        onMounted(() => this.renderChart());

        onWillUnmount(() => {
            if (this.chart) { this.chart.destroy(); this.chart = null; }
        });
    }

    get labels() { return this.data?.labels || []; }
    get values() { return this.data?.data || []; }
    get total() { return this.data?.total || this.values.reduce((a, b) => a + b, 0); }
    get hasData() { return this.values.length > 0 && this.values.some(v => v > 0); }

    get chartData() {
        return this.labels.map((label, i) => ({
            label,
            value: this.values[i] || 0,
            color: this.levelColors[i] || '#6b7280',
            icon: this.levelIcons[i] || 'fa-folder',
            level: this.levelKeys[i] || 'other',
            percentage: this.total > 0 ? Math.round((this.values[i] / this.total) * 100) : 0
        }));
    }

    renderChart() {
        if (this.chart) { this.chart.destroy(); this.chart = null; }
        if (!this.hasData || !this.canvasRef.el) return;

        const colors = this.levelColors;

        this.chart = new Chart(this.canvasRef.el, {
            type: 'polarArea',
            data: {
                labels: this.labels,
                datasets: [{
                    data: this.values,
                    backgroundColor: colors.map(c => c + 'CC'),
                    borderColor: colors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${ctx.raw} secciones`
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: { display: false },
                        grid: { color: 'rgba(0, 0, 0, 0.1)' }
                    }
                },
                animation: { duration: 800 }
            }
        });
    }
}

registry.category("fields").add("sections_gauge_chart", {
    component: SectionsPolarChart,
    supportedTypes: ["json"],
});
