/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

export class ProfessorDetailedStatsWidget extends Component {
    static template = "school.ProfessorDetailedStatsWidget";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name] || {};
    }

    get professors() {
        return this.data?.professors || [];
    }

    get hasData() {
        return this.professors.length > 0;
    }

    get totalProfessors() {
        return this.data?.total || 0;
    }

    getTypeLabel(type) {
        const labels = {
            'pre': 'Preescolar',
            'primary': 'Primaria',
            'secundary_general': 'Media General',
            'secundary_tecnico': 'Técnico Medio'
        };
        return labels[type] || type;
    }

    getTypeClass(type) {
        const classes = {
            'pre': 'bg-info',
            'primary': 'bg-success',
            'secundary_general': 'bg-primary',
            'secundary_tecnico': 'bg-warning'
        };
        return classes[type] || 'bg-secondary';
    }

    formatAverage(avg) {
        if (typeof avg === 'number') {
            return avg > 0 ? avg.toFixed(2) : '-';
        }
        return '-';
    }

    getAverageClass(avg) {
        if (avg >= 15) return 'text-success fw-bold';
        if (avg >= 10) return 'text-warning';
        return 'text-danger';
    }

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
