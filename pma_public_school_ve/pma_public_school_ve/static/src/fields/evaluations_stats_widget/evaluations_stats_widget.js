/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";

export class EvaluationsStatsWidget extends Component {
    static template = "school.EvaluationsStatsWidget";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.data = this.props.record.data[this.props.name];
    }

    get stats() {
        return this.data || {};
    }

    getPercentage(value, total) {
        if (!total || total === 0) return 0;
        return Math.round((value / total) * 100);
    }
}

registry.category("fields").add("evaluations_stats_widget", {
    component: EvaluationsStatsWidget,
    supportedTypes: ["json"],
});
