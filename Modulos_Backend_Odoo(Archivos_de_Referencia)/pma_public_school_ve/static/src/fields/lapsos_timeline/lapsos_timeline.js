/** @odoo-module **/

import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { Component } from "@odoo/owl";

/**
 * Widget: Lapsos Timeline
 * Displays a visual timeline of the 3 lapsos with current lapso highlighted
 */
export class LapsosTimeline extends Component {
    static template = "school.LapsosTimeline";
    static props = { ...standardFieldProps };

    setup() {
        this.lapsos = [
            { number: 1, name: 'Primer Lapso' },
            { number: 2, name: 'Segundo Lapso' },
            { number: 3, name: 'Tercer Lapso' }
        ];
    }

    get currentLapso() {
        const value = this.props.record.data[this.props.name];
        return parseInt(value) || 1;
    }

    get state() {
        return this.props.record.data.state || 'draft';
    }

    getLapsoStatus(lapsoNumber) {
        if (this.state === 'draft') return 'pending';
        if (this.state === 'finished') return 'completed';
        if (lapsoNumber < this.currentLapso) return 'completed';
        if (lapsoNumber === this.currentLapso) return 'current';
        return 'pending';
    }

    getLapsoIcon(lapsoNumber) {
        const status = this.getLapsoStatus(lapsoNumber);
        if (status === 'completed') return 'fa-check';
        if (status === 'current') return 'fa-circle';
        return 'fa-circle-o';
    }
}

registry.category("fields").add("lapsos_timeline", {
    component: LapsosTimeline,
    supportedTypes: ["selection", "char"],
});
