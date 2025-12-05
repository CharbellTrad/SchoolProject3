/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

export class TopStudentsList extends Component {
    static template = "school.TopStudentsList";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name];
    }

    get topStudents() {
        return this.data?.top_students || [];
    }

    getMedalIcon(index) {
        const medals = {
            0: '🥇',
            1: '🥈',
            2: '🥉'
        };
        return medals[index] || `${index + 1}°`;
    }

    getMedalClass(index) {
        const classes = {
            0: 'text-warning',
            1: 'text-secondary',
            2: 'text-brown'
        };
        return classes[index] || '';
    }

    getStateClass(state) {
        return state === 'approve' ? 'badge bg-success' : 'badge bg-danger';
    }

    getStateLabel(state) {
        return state === 'approve' ? 'Aprobado' : 'Reprobado';
    }

    onStudentClick(studentId) {
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'res.partner',
            res_id: studentId,
            views: [[false, 'form']],
            target: 'current',
        });
    }
}

registry.category("fields").add("top_students_list", {
    component: TopStudentsList,
    supportedTypes: ["json"],
});
