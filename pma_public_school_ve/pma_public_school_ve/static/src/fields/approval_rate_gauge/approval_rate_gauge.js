/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";

export class ApprovalRateGauge extends Component {
    static template = "school.ApprovalRateGauge";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.data = this.props.record.data[this.props.name];
    }

    get gaugeClass() {
        const rate = this.data?.rate || 0;
        if (rate >= 80) return 'text-success';
        if (rate >= 60) return 'text-warning';
        return 'text-danger';
    }

    get gaugeProgressClass() {
        const rate = this.data?.rate || 0;
        if (rate >= 80) return 'bg-success';
        if (rate >= 60) return 'bg-warning';
        return 'bg-danger';
    }
}

registry.category("fields").add("approval_rate_gauge", {
    component: ApprovalRateGauge,
    supportedTypes: ["json"],
});
