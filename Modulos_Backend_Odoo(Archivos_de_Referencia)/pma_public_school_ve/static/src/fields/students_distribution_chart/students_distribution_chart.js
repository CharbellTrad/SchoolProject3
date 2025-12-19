/** @odoo-module **/

import { loadBundle } from "@web/core/assets";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";
import { Component, onWillStart, onMounted, onWillUnmount, useRef } from "@odoo/owl";

/**
 * Widget: Students Distribution Chart
 * Displays a doughnut chart showing student counts per education level.
 */
export class StudentsDistributionChart extends Component {
    static template = "school.StudentsDistributionChart";
    static props = { ...standardFieldProps };

    setup() {
        this.chart = null;
        this.canvasRef = useRef("canvas");
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name];
        this.resizeObserver = null;

        this.levelColors = ['#FFB300', '#43A047', '#1E88E5', '#8E24AA'];
        this.levelIcons = ['fa-child', 'fa-book', 'fa-graduation-cap', 'fa-cogs'];
        this.levelKeys = ['pre', 'primary', 'secundary', 'tecnico'];

        onWillStart(async () => await loadBundle("web.chartjs_lib"));

        onMounted(() => {
            this.renderChart();
            // Handle resize
            this.resizeObserver = new ResizeObserver(() => {
                if (this.chart) {
                    this.chart.resize();
                }
            });
            if (this.canvasRef.el?.parentElement) {
                this.resizeObserver.observe(this.canvasRef.el.parentElement);
            }
        });

        onWillUnmount(() => {
            if (this.chart) { this.chart.destroy(); this.chart = null; }
            if (this.resizeObserver) { this.resizeObserver.disconnect(); }
        });
    }

    get labels() { return this.data?.labels || []; }
    get values() { return this.data?.data || []; }
    get totalStudents() { return this.data?.total || this.values.reduce((a, b) => a + b, 0); }
    get hasData() { return this.values.length > 0 && this.values.some(v => v > 0); }

    get chartData() {
        return this.labels.map((label, i) => ({
            label,
            value: this.values[i] || 0,
            level: this.levelKeys[i] || 'other',
            color: this.levelColors[i] || '#6b7280',
            icon: this.levelIcons[i] || 'fa-users',
            percentage: this.totalStudents > 0 ? Math.round((this.values[i] / this.totalStudents) * 100) : 0
        }));
    }

    renderChart() {
        if (this.chart) { this.chart.destroy(); this.chart = null; }
        if (!this.hasData || !this.canvasRef.el) return;

        this.chart = new Chart(this.canvasRef.el, {
            type: 'doughnut',
            data: {
                labels: this.labels,
                datasets: [{
                    data: this.values,
                    backgroundColor: this.levelColors.slice(0, this.values.length),
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                animation: { duration: 800 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const pct = ((ctx.parsed / this.totalStudents) * 100).toFixed(0);
                                return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    getLevelIcon(level) {
        return { 'pre': 'fa-child', 'primary': 'fa-book', 'secundary': 'fa-graduation-cap', 'tecnico': 'fa-cogs' }[level] || 'fa-users';
    }

    getLevelIconClass(level) {
        return { 'pre': 'icon-pre', 'primary': 'icon-primary', 'secundary': 'icon-secundary', 'tecnico': 'icon-tecnico' }[level] || 'icon-other';
    }

    onLevelClick(level) {
        const yearId = this.props.record.data.id;
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            name: 'Estudiantes',
            res_model: 'school.student',
            views: [[false, 'list'], [false, 'form']],
            domain: [['year_id', '=', yearId], ['type', '=', level], ['state', '=', 'done']],
            target: 'current',
        });
    }
}

registry.category("fields").add("students_distribution_chart", {
    component: StudentsDistributionChart,
    supportedTypes: ["json"],
});

// Sections distribution - reuses same widget but for sections data
class SectionsDistributionChart extends StudentsDistributionChart {
    get totalStudents() {
        return this.data?.total || this.values.reduce((a, b) => a + b, 0);
    }
}

registry.category("fields").add("sections_distribution_chart", {
    component: SectionsDistributionChart,
    supportedTypes: ["json"],
});

// Professors distribution - for professors by level
class ProfessorsDistributionChart extends StudentsDistributionChart {
    get totalStudents() {
        return this.data?.total || this.values.reduce((a, b) => a + b, 0);
    }
}

registry.category("fields").add("professors_distribution_chart", {
    component: ProfessorsDistributionChart,
    supportedTypes: ["json"],
});
