/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

export class ProfessorSummaryWidget extends Component {
    static template = "school.ProfessorSummaryWidget";
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

    get totalProfessors() {
        return this.data?.total || 0;
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

registry.category("fields").add("professor_summary_widget", {
    component: ProfessorSummaryWidget,
    supportedTypes: ["json"],
});
