/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, useState, onMounted } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

/**
 * Widget: Professor Dashboard
 * Shows KPI cards, top 5 professors, and distribution chart for professors
 * Mode: 'full' (default), 'kpi_only', 'ranking_only'
 */
export class ProfessorDashboard extends Component {
    static template = "school.ProfessorDashboard";
    static props = { ...standardFieldProps, mode: { type: String, optional: true } };

    setup() {
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name];
        this.mode = this.props.mode || 'full';
        this.state = useState({
            animatedProfessors: 0,
            animatedSubjects: 0,
            animatedEvaluations: 0,
            animatedAverage: 0
        });
        onMounted(() => this.animateCounters());
    }

    animateCounters() {
        const targets = {
            animatedProfessors: this.totalProfessors,
            animatedSubjects: this.totalSubjects,
            animatedEvaluations: this.totalEvaluations,
            animatedAverage: this.generalAverage
        };
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);

            this.state.animatedProfessors = Math.round(targets.animatedProfessors * easeOut);
            this.state.animatedSubjects = Math.round(targets.animatedSubjects * easeOut);
            this.state.animatedEvaluations = Math.round(targets.animatedEvaluations * easeOut);
            this.state.animatedAverage = (targets.animatedAverage * easeOut).toFixed(1);

            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    get hasData() { return this.data && this.totalProfessors > 0; }
    get totalProfessors() { return this.data?.total_professors || 0; }
    get totalSubjects() { return this.data?.total_subjects || 0; }
    get totalEvaluations() { return this.data?.total_evaluations || 0; }
    get generalAverage() { return this.data?.general_average || 0; }
    get topProfessors() { return this.data?.top_professors || []; }
    get distributionByLevel() { return this.data?.distribution_by_level || {}; }

    // Mode-based visibility
    get showKpis() { return this.mode === 'full' || this.mode === 'kpi_only'; }
    get showRanking() { return this.mode === 'full' || this.mode === 'ranking_only'; }
    get showDistribution() { return this.mode === 'full' || this.mode === 'ranking_only' || this.mode === 'distribution_only'; }
    get showDistributionOnly() { return this.mode === 'distribution_only'; }

    getAverageClass() {
        const avg = this.generalAverage;
        if (avg >= 15) return 'bg-success';
        if (avg >= 10) return 'bg-warning';
        return 'bg-danger';
    }

    getMedalIcon(index) {
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        return medals[index] || `${index + 1}.`;
    }

    getInitials(name) {
        if (!name) return '?';
        const parts = name.split(' ').filter(Boolean);
        return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
    }

    getAvatarColor(name) {
        const colors = ['#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#16A34A', '#0891B2', '#2563EB'];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    onProfessorClick(professorId) {
        if (!professorId) return;
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'res.partner',
            res_id: professorId,
            views: [[false, 'form']],
            target: 'current'
        });
    }
}

// Full dashboard (default)
registry.category("fields").add("professor_dashboard", {
    component: ProfessorDashboard,
    supportedTypes: ["json"],
});

// KPI cards + progress bar only
class ProfessorDashboardKpi extends ProfessorDashboard {
    setup() {
        super.setup();
        this.mode = 'kpi_only';
    }
}
registry.category("fields").add("professor_dashboard_kpi", {
    component: ProfessorDashboardKpi,
    supportedTypes: ["json"],
});

// Top 5 + Distribution only
class ProfessorDashboardRanking extends ProfessorDashboard {
    setup() {
        super.setup();
        this.mode = 'ranking_only';
    }
}
registry.category("fields").add("professor_dashboard_ranking", {
    component: ProfessorDashboardRanking,
    supportedTypes: ["json"],
});

// Distribution only (for Dashboard General)
class ProfessorDashboardDistribution extends ProfessorDashboard {
    setup() {
        super.setup();
        this.mode = 'distribution_only';
    }
}
registry.category("fields").add("professor_dashboard_distribution", {
    component: ProfessorDashboardDistribution,
    supportedTypes: ["json"],
});
