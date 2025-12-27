/** @odoo-module **/

import { loadBundle } from "@web/core/assets";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { Component, onWillStart, onMounted, onWillUnmount, useRef, useState } from "@odoo/owl";

// ============================================
// BASE CLASS: Common functionality for all widgets
// ============================================
class StudentsTabBase extends Component {
    static props = { ...standardFieldProps };

    setup() {
        this.data = this.props.record.data[this.props.name];
    }

    get hasData() { return this.data && this.data.total > 0; }
    get total() { return this.data?.total || 0; }
    get byGender() { return this.data?.by_gender || { M: 0, F: 0 }; }
    get byApproval() { return this.data?.by_approval || { approved: 0, failed: 0 }; }
    get byState() { return this.data?.by_state || { done: 0, draft: 0, cancel: 0 }; }
    get byLevel() { return this.data?.by_level || []; }
    get topPerformers() { return this.data?.top_performers || []; }
    get atRisk() { return this.data?.at_risk || []; }

    // Computed percentages for Gender
    get genderTotal() { return (this.byGender.M || 0) + (this.byGender.F || 0); }
    get malePercent() { return this.genderTotal > 0 ? Math.round((this.byGender.M / this.genderTotal) * 100) : 0; }
    get femalePercent() { return this.genderTotal > 0 ? Math.round((this.byGender.F / this.genderTotal) * 100) : 0; }

    // Computed percentages for State
    get stateTotal() { return (this.byState.done || 0) + (this.byState.draft || 0) + (this.byState.cancel || 0); }
    get donePercent() { return this.stateTotal > 0 ? Math.round((this.byState.done / this.stateTotal) * 100) : 0; }
    get draftPercent() { return this.stateTotal > 0 ? Math.round((this.byState.draft / this.stateTotal) * 100) : 0; }
    get cancelPercent() { return this.stateTotal > 0 ? Math.round((this.byState.cancel / this.stateTotal) * 100) : 0; }

    // Computed percentages for Approval
    get approvalTotal() { return (this.byApproval.approved || 0) + (this.byApproval.failed || 0); }
    get approvalRate() { return this.approvalTotal > 0 ? ((this.byApproval.approved / this.approvalTotal) * 100).toFixed(2) : '0.00'; }

    getLevelIcon(level) {
        const icons = { 'pre': 'fa-child', 'primary': 'fa-book', 'secundary': 'fa-graduation-cap' };
        return icons[level] || 'fa-user';
    }

    getLevelColor(level) {
        const colors = { 'pre': '#FFB300', 'primary': '#43A047', 'secundary': '#1E88E5' };
        return colors[level] || '#6B7280';
    }
}

// ============================================
// Widget 0: KPI Stats Cards (like professors tab)
// ============================================
export class StudentsKPIStats extends StudentsTabBase {
    static template = "school.StudentsKPIStats";

    setup() {
        super.setup();
        this.state = useState({
            animatedTotal: 0,
            animatedEnrolled: 0,
            animatedApproved: 0,
            animatedFailed: 0
        });

        onMounted(() => this.animateCounters());
    }

    get enrolled() { return this.byState.done || 0; }
    get approved() { return this.byApproval.approved || 0; }
    get failed() { return this.byApproval.failed || 0; }

    animateCounters() {
        const duration = 1200;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);

            this.state.animatedTotal = Math.round(this.total * easeOut);
            this.state.animatedEnrolled = Math.round(this.enrolled * easeOut);
            this.state.animatedApproved = Math.round(this.approved * easeOut);
            this.state.animatedFailed = Math.round(this.failed * easeOut);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }
}

// ============================================
// Widget 1: Gender & State Distribution (Progress Bars - No Chart)
// ============================================
export class StudentsDistributionStats extends StudentsTabBase {
    static template = "school.StudentsDistributionStats";
}

// ============================================
// Widget 2: Approval Gauge & Level Progress Bars
// ============================================
export class StudentsApprovalStats extends StudentsTabBase {
    static template = "school.StudentsApprovalStats";

    setup() {
        super.setup();
        this.gaugeRef = useRef("approvalGauge");
        this.gaugeChart = null;

        onWillStart(async () => await loadBundle("web.chartjs_lib"));
        onMounted(() => this.renderGauge());
        onWillUnmount(() => this.destroyCharts());
    }

    destroyCharts() {
        if (this.gaugeChart) this.gaugeChart.destroy();
    }

    renderGauge() {
        if (!this.gaugeRef.el || !this.hasData) return;
        if (this.gaugeChart) this.gaugeChart.destroy();

        const rate = this.approvalRate;
        const remaining = 100 - rate;

        this.gaugeChart = new Chart(this.gaugeRef.el, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [rate, remaining],
                    backgroundColor: [
                        rate >= 70 ? '#22C55E' : rate >= 50 ? '#F59E0B' : '#EF4444',
                        '#E5E7EB'
                    ],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }
}

// ============================================
// Widget 3: Top Performers Table
// ============================================
export class StudentsTopPerformers extends StudentsTabBase {
    static template = "school.StudentsTopPerformers";
}

// ============================================
// Widget 4: At Risk Students Table
// ============================================
export class StudentsAtRisk extends StudentsTabBase {
    static template = "school.StudentsAtRisk";
}

// ============================================
// REGISTRY: Register all widgets
// ============================================
registry.category("fields").add("students_kpi_stats", {
    component: StudentsKPIStats,
    supportedTypes: ["json"],
});

registry.category("fields").add("students_distribution_stats", {
    component: StudentsDistributionStats,
    supportedTypes: ["json"],
});

registry.category("fields").add("students_approval_stats", {
    component: StudentsApprovalStats,
    supportedTypes: ["json"],
});

registry.category("fields").add("students_top_performers", {
    component: StudentsTopPerformers,
    supportedTypes: ["json"],
});

registry.category("fields").add("students_at_risk", {
    component: StudentsAtRisk,
    supportedTypes: ["json"],
});
