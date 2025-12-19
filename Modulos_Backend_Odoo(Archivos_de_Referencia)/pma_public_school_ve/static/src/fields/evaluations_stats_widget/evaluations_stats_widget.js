/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, onMounted, useRef, useState } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { loadBundle } from "@web/core/assets";

/**
 * Widget: Evaluations Stats Widget
 * Displays evaluation statistics with KPI counters and distribution chart
 */
export class EvaluationsStatsWidget extends Component {
    static template = "school.EvaluationsStatsWidget";
    static props = { ...standardFieldProps };

    setup() {
        this.chart = null;
        this.chartRendered = false;
        this.canvasRef = useRef("canvas");
        this.data = this.props.record.data[this.props.name];

        this.state = useState({
            animatedTotal: 0,
            animatedQualified: 0,
            animatedPartial: 0,
            animatedDraft: 0
        });

        this.typeColors = {
            'secundary': '#1E88E5',
            'primary': '#43A047',
            'pre': '#FFB300'
        };

        onWillStart(async () => await loadBundle("web.chartjs_lib"));

        onMounted(() => {
            this.animateCounters();
            // Render chart only once on mount
            this.renderChart();
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

        const byType = this.byType;
        const labels = ['Media General', 'Primaria', 'Preescolar'];
        const data = [byType.secundary || 0, byType.primary || 0, byType.pre || 0];
        const colors = [this.typeColors.secundary, this.typeColors.primary, this.typeColors.pre];

        this.chart = new Chart(this.canvasRef.el, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data, backgroundColor: colors, borderColor: '#fff', borderWidth: 2 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
