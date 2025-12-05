/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

export class EvaluationsTimeline extends Component {
    static template = "school.EvaluationsTimeline";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name];
    }

    get evaluations() {
        return this.data?.evaluations || [];
    }

    getStateClass(state) {
        const classes = {
            'all': 'badge bg-success',
            'partial': 'badge bg-warning',
            'draft': 'badge bg-secondary'
        };
        return classes[state] || 'badge bg-secondary';
    }

    getStateLabel(state) {
        const labels = {
            'all': 'Calificada',
            'partial': 'Parcial',
            'draft': 'Borrador'
        };
        return labels[state] || state;
    }

    formatDate(dateStr) {
        if (!dateStr) return 'Sin fecha';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    onEvaluationClick(evalId) {
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'school.evaluation',
            res_id: evalId,
            views: [[false, 'form']],
            target: 'current',
        });
    }
}

registry.category("fields").add("evaluations_timeline", {
    component: EvaluationsTimeline,
    supportedTypes: ["json"],
});
