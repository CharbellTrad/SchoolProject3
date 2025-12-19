/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, useState, onMounted } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

/**
 * Widget: Level Dashboard
 * Shows KPIs and top students for a specific education level
 * Backend returns: { total_students, approved_count, failed_count, approval_rate, 
 *                   top_students_by_section: [{section_id, section_name, top_3: [...]}],
 *                   evaluation_type, use_literal }
 */
export class LevelDashboard extends Component {
    static template = "school.LevelDashboard";
    static props = { ...standardFieldProps };

    setup() {
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name];
        // Mode comes from extractProps: 'kpi_only', 'students_only', or 'full' (default)
        this.mode = this.props.mode || 'full';
        console.log('LevelDashboard mode:', this.mode);
        this.state = useState({
            animatedTotal: 0,
            animatedApproved: 0,
            animatedFailed: 0,
            animatedSections: 0
        });
        onMounted(() => this.animateCounters());
    }

    animateCounters() {
        const targets = {
            animatedTotal: this.totalStudents,
            animatedApproved: this.approvedCount,
            animatedFailed: this.failedCount,
            animatedSections: this.sectionsCount
        };
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);

            this.state.animatedTotal = Math.round(targets.animatedTotal * easeOut);
            this.state.animatedApproved = Math.round(targets.animatedApproved * easeOut);
            this.state.animatedFailed = Math.round(targets.animatedFailed * easeOut);
            this.state.animatedSections = Math.round(targets.animatedSections * easeOut);

            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    // Mode-based visibility
    get showKpis() { return this.mode === 'kpi_only' || this.mode === 'full'; }
    get showStudents() { return this.mode === 'students_only' || this.mode === 'full'; }

    get hasData() { return this.data && this.totalStudents > 0; }
    get totalStudents() { return this.data?.total_students || 0; }
    get approvedCount() { return this.data?.approved_count || 0; }
    get failedCount() { return this.data?.failed_count || 0; }
    get sectionsCount() { return this.data?.sections_count || this.topStudentsBySection.length || 0; }
    get sectionsLabel() {
        // Use 'Menciones' for tecnico, 'Secciones' for others
        return this.data?.level_type === 'secundary_tecnico' ? 'Menciones' : 'Secciones';
    }
    get approvalRate() { return this.data?.approval_rate || 0; }
    get evaluationType() { return this.data?.evaluation_type || '20'; }
    get useLiteral() { return this.data?.use_literal || false; }
    get topStudentsBySection() { return this.data?.top_students_by_section || []; }

    getApprovalRateClass() {
        const rate = this.data?.approval_rate || 0;
        if (rate >= 80) return 'bg-success';
        if (rate >= 60) return 'bg-warning';
        return 'bg-danger';
    }

    getInitials(name) {
        if (!name) return '?';
        const parts = name.split(' ').filter(Boolean);
        return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
    }

    getAvatarColor(name) {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

    getMedalIcon(index) {
        return ['🥇', '🥈', '🥉'][index] || `${index + 1}°`;
    }

    getDisplayValue(student) {
        // Check student-level use_literal first, then widget-level
        if (student.use_literal || this.useLiteral) {
            // For literal: average contains the letter (A, B, C, D, E)
            return student.average || student.literal_average || 'A';
        }
        return student.average || 0;
    }

    onStudentClick(studentId) {
        if (!studentId) return;
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'res.partner',
            res_id: studentId,
            views: [[false, 'form']],
            target: 'current'
        });
    }
}

// Add mode to static props for component
LevelDashboard.props = {
    ...standardFieldProps,
    mode: { type: String, optional: true },
};

// Create mode-specific wrappers
class LevelDashboardKpi extends LevelDashboard {
    setup() {
        super.setup();
        this.mode = 'kpi_only';
    }
}
LevelDashboardKpi.props = LevelDashboard.props;
LevelDashboardKpi.template = LevelDashboard.template;

class LevelDashboardStudents extends LevelDashboard {
    setup() {
        super.setup();
        this.mode = 'students_only';
    }
}
LevelDashboardStudents.props = LevelDashboard.props;
LevelDashboardStudents.template = LevelDashboard.template;

// Register all 3 widgets
registry.category("fields").add("level_dashboard", {
    component: LevelDashboard,
    supportedTypes: ["json"],
});

registry.category("fields").add("level_dashboard_kpi", {
    component: LevelDashboardKpi,
    supportedTypes: ["json"],
});

registry.category("fields").add("level_dashboard_students", {
    component: LevelDashboardStudents,
    supportedTypes: ["json"],
});
