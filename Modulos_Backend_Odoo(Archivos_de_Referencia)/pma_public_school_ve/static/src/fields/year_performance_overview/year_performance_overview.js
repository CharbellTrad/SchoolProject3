/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

/**
 * Widget: Year Performance Overview
 * Displays performance metrics for each education level
 */
export class YearPerformanceOverview extends Component {
    static template = "school.YearPerformanceOverview";
    static props = { ...standardFieldProps };

    setup() {
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name];
    }

    get hasData() { return this.levelsData && this.levelsData.length > 0; }
    get levelsData() { return this.data?.levels || []; }

    getLevelClass(type) {
        return { 'pre': 'level-pre', 'primary': 'level-primary', 'secundary': 'level-secundary', 'tecnico': 'level-tecnico' }[type] || '';
    }

    getLevelIcon(type) {
        return { 'pre': 'fa-child', 'primary': 'fa-book', 'secundary': 'fa-graduation-cap', 'tecnico': 'fa-cogs' }[type] || 'fa-users';
    }

    getLevelIconBg(type) {
        return { 'pre': 'bg-warning', 'primary': 'bg-success', 'secundary': 'bg-primary', 'tecnico': 'bg-purple' }[type] || 'bg-secondary';
    }

    getLevelIconColor(type) {
        return { 'pre': 'text-warning', 'primary': 'text-success', 'secundary': 'text-primary', 'tecnico': 'text-purple' }[type] || 'text-muted';
    }

    getLiteralBadgeClass(literal) {
        return { 'A': 'bg-success', 'B': 'bg-info', 'C': 'bg-warning text-dark', 'D': 'bg-orange', 'E': 'bg-danger' }[literal] || 'bg-secondary';
    }

    getLiteralDescription(literal) {
        return { 'A': 'Excelente', 'B': 'Muy Bueno', 'C': 'Bueno', 'D': 'Regular', 'E': 'Necesita Mejorar' }[literal] || '';
    }

    // Convert numeric average to literal for Primaria
    // Primaria doesn't use numeric averages (average will be 0), default to 'A' for all approved
    getLiteralFromAverage(average) {
        if (average === undefined || average === null) return 'A';
        if (average === 0) return 'A'; // Primaria: all students use observation/literal, assume approved
        if (average >= 18) return 'A';
        if (average >= 15) return 'B';
        if (average >= 12) return 'C';
        if (average >= 10) return 'D';
        return 'E';
    }

    isApproved(level) { return level.average >= 10; }

    getApprovalRateClass(rate) {
        if (rate >= 80) return 'bg-success';
        if (rate >= 60) return 'bg-warning';
        return 'bg-danger';
    }

    onLevelClick(type) {
        const yearId = this.props.record.data.id;
        const studentType = type === 'tecnico' ? 'secundary' : type;
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            name: 'Estudiantes',
            res_model: 'school.student',
            views: [[false, 'list'], [false, 'form']],
            domain: [['year_id', '=', yearId], ['type', '=', studentType], ['state', '=', 'done']],
            target: 'current',
        });
    }
}

registry.category("fields").add("year_performance_overview", {
    component: YearPerformanceOverview,
    supportedTypes: ["json"],
});
