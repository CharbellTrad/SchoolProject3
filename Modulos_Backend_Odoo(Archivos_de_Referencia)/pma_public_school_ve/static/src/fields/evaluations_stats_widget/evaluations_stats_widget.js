/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, onMounted, onWillUnmount, useRef, useState } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { loadBundle } from "@web/core/assets";

/**
 * Widget: Evaluations Stats Widget
 * Displays evaluation statistics with KPI counters and distribution chart by level
 * Design matches students_distribution_chart for consistency
 */
export class EvaluationsStatsWidget extends Component {
    static template = "school.EvaluationsStatsWidget";
    static props = { ...standardFieldProps };

    setup() {
        this.chart = null;
        this.chartRendered = false;
        this.canvasRef = useRef("canvas");
        this.data = this.props.record.data[this.props.name];
        this.resizeObserver = null;

        this.state = useState({
            animatedTotal: 0,
            animatedQualified: 0,
            animatedPartial: 0,
            animatedDraft: 0
        });

        // Colors and icons matching students_distribution_chart
        this.levelColors = {
            'pre': '#FFB300',
            'primary': '#43A047',
            'secundary': '#1E88E5',
            'tecnico': '#8E24AA'
        };

        this.levelIcons = {
            'pre': 'fa-child',
            'primary': 'fa-book',
            'secundary': 'fa-graduation-cap',
            'tecnico': 'fa-cogs'
        };

        this.levelLabels = {
            'pre': 'Preescolar',
            'primary': 'Primaria',
            'secundary': 'Media General',
            'tecnico': 'Técnico Medio'
        };

        onWillStart(async () => await loadBundle("web.chartjs_lib"));

        onMounted(() => {
            this.animateCounters();
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

    get hasData() { return this.data && this.data.total > 0; }
    get total() { return this.data?.total || 0; }
    get qualified() { return this.data?.qualified || 0; }
    get partial() { return this.data?.partial || 0; }
    get draft() { return this.data?.draft || 0; }
    get byType() { return this.data?.by_type || {}; }

    get completionRate() {
        if (this.total === 0) return 0;
        return Math.round((this.qualified / this.total) * 100);
    }

    // Chart data for legend - similar to students_distribution_chart
    get chartData() {
        const levels = ['pre', 'primary', 'secundary', 'tecnico'];
        return levels.map(level => ({
            level,
            label: this.levelLabels[level],
            value: this.byType[level] || 0,
            color: this.levelColors[level],
            icon: this.levelIcons[level],
            percentage: this.total > 0 ? Math.round(((this.byType[level] || 0) / this.total) * 100) : 0
        })).filter(item => item.value > 0); // Only show levels with data
    }

    animateCounters() {
        const duration = 1200;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);

            this.state.animatedTotal = Math.round(this.total * easeOut);
            this.state.animatedQualified = Math.round(this.qualified * easeOut);
            this.state.animatedPartial = Math.round(this.partial * easeOut);
            this.state.animatedDraft = Math.round(this.draft * easeOut);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }

    renderChart() {
        if (this.chartRendered) return;
        if (!this.hasData || !this.canvasRef.el) return;

        this.chartRendered = true;

        const levels = ['pre', 'primary', 'secundary', 'tecnico'];
        const data = levels.map(l => this.byType[l] || 0);
        const colors = levels.map(l => this.levelColors[l]);
        const labels = levels.map(l => this.levelLabels[l]);

        this.chart = new Chart(this.canvasRef.el, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
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
                                const pct = ((ctx.parsed / this.total) * 100).toFixed(0);
                                return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    getCompletionClass() {
        const rate = this.completionRate;
        if (rate >= 80) return 'text-success';
        if (rate >= 50) return 'text-warning';
        return 'text-danger';
    }

    getCompletionBgClass() {
        const rate = this.completionRate;
        if (rate >= 80) return 'bg-success';
        if (rate >= 50) return 'bg-warning';
        return 'bg-danger';
    }
}

registry.category("fields").add("evaluations_stats_widget", {
    component: EvaluationsStatsWidget,
    supportedTypes: ["json"],
});

/**
 * Widget: Evaluations Distribution Widget
 * Displays the distribution chart with legend
 */
export class EvaluationsDistributionWidget extends Component {
    static template = "school.EvaluationsDistributionWidget";
    static props = { ...standardFieldProps };

    setup() {
        this.chart = null;
        this.chartRendered = false;
        this.canvasRef = useRef("canvas");
        this.data = this.props.record.data[this.props.name];
        this.resizeObserver = null;

        this.state = useState({
            animatedTotal: 0
        });

        // Colors and icons matching students_distribution_chart
        this.levelColors = {
            'pre': '#FFB300',
            'primary': '#43A047',
            'secundary': '#1E88E5',
            'tecnico': '#8E24AA'
        };

        this.levelIcons = {
            'pre': 'fa-child',
            'primary': 'fa-book',
            'secundary': 'fa-graduation-cap',
            'tecnico': 'fa-cogs'
        };

        this.levelLabels = {
            'pre': 'Preescolar',
            'primary': 'Primaria',
            'secundary': 'Media General',
            'tecnico': 'Técnico Medio'
        };

        onWillStart(async () => await loadBundle("web.chartjs_lib"));

        onMounted(() => {
            this.animateTotal();
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

    get hasData() { return this.data && this.data.total > 0; }
    get total() { return this.data?.total || 0; }
    get byType() { return this.data?.by_type || {}; }

    // Chart data for legend
    get chartData() {
        const levels = ['pre', 'primary', 'secundary', 'tecnico'];
        return levels.map(level => ({
            level,
            label: this.levelLabels[level],
            value: this.byType[level] || 0,
            color: this.levelColors[level],
            icon: this.levelIcons[level],
            percentage: this.total > 0 ? Math.round(((this.byType[level] || 0) / this.total) * 100) : 0
        })).filter(item => item.value > 0);
    }

    animateTotal() {
        const duration = 1200;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);

            this.state.animatedTotal = Math.round(this.total * easeOut);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }

    renderChart() {
        if (this.chartRendered) return;
        if (!this.hasData || !this.canvasRef.el) return;

        this.chartRendered = true;

        const levels = ['pre', 'primary', 'secundary', 'tecnico'];
        const data = levels.map(l => this.byType[l] || 0);
        const colors = levels.map(l => this.levelColors[l]);
        const labels = levels.map(l => this.levelLabels[l]);

        this.chart = new Chart(this.canvasRef.el, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
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
                                const pct = ((ctx.parsed / this.total) * 100).toFixed(0);
                                return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

registry.category("fields").add("evaluations_distribution_widget", {
    component: EvaluationsDistributionWidget,
    supportedTypes: ["json"],
});
