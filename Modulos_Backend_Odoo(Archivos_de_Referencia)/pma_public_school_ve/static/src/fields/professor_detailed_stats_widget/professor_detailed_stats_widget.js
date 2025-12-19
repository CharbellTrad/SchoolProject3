/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

/**
 * Widget: Professor Detailed Stats Widget
 * 
 * Displays professors with their statistics grouped by student type
 * (Pre, Primary, Media General, Técnico Medio).
 */
export class ProfessorDetailedStatsWidget extends Component {
    static template = "school.ProfessorDetailedStatsWidget";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name];
    }

    get professors() {
        return this.data?.professors || [];
    }

    get hasData() {
        return this.professors.length > 0;
    }

    /**
     * Get student types with labels
     */
    get studentTypes() {
        return [
            { key: 'pre', name: 'Preescolar', icon: 'fa-child', color: '#FFC107' },
            { key: 'primary', name: 'Primaria', icon: 'fa-book', color: '#4CAF50' },
            { key: 'secundary_general', name: 'Media General', icon: 'fa-graduation-cap', color: '#2196F3' },
            { key: 'secundary_tecnico', name: 'Técnico Medio', icon: 'fa-cogs', color: '#9C27B0' }
        ];
    }

    /**
     * Get stats for a professor by student type
     */
    getProfStats(professor, typeKey) {
        const stats = professor.stats_by_type?.[typeKey];
        if (!stats) return null;
        return stats;
    }

    /**
     * Get average color class
     */
    getAverageClass(average) {
        if (average >= 15) return 'text-success';
        if (average >= 10) return 'text-warning';
        return 'text-danger';
    }

    /**
     * Check if professor has any stats
     */
    hasStats(professor) {
        const stats = professor.stats_by_type;
        if (!stats) return false;
        return Object.values(stats).some(s => s.count > 0);
    }

    /**
     * Get initials for avatar
     */
    getInitials(name) {
        if (!name) return '?';
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    }

    /**
     * Get avatar color
     */
    getAvatarColor(name) {
        const colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
            '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    /**
     * Handle click on professor
     */
    onProfessorClick(professorId) {
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'hr.employee',
            res_id: professorId,
            views: [[false, 'form']],
            target: 'current',
        });
    }
}

registry.category("fields").add("professor_detailed_stats_widget", {
    component: ProfessorDetailedStatsWidget,
    supportedTypes: ["json"],
});
