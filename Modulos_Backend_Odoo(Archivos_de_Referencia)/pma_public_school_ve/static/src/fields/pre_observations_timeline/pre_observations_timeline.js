/** @odoo-module **/

import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { Component } from "@odoo/owl";

/**
 * Widget: Preschool Observations Timeline
 * Displays a timeline of recent observations for preschool students
 */
export class PreObservationsTimeline extends Component {
    static template = "school.PreObservationsTimeline";
    static props = { ...standardFieldProps };

    setup() {
        this.data = this.props.record.data[this.props.name];
    }

    get hasData() { return this.data && this.data.timeline && this.data.timeline.length > 0; }
    get total() { return this.data?.total || 0; }
    get timeline() { return this.data?.timeline || []; }
}

registry.category("fields").add("pre_observations_timeline", {
    component: PreObservationsTimeline,
    supportedTypes: ["json"],
});
