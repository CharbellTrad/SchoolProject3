/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, useEffect, useRef } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { loadBundle } from "@web/core/assets";

export class YearPerformanceOverview extends Component {
    static template = "school.YearPerformanceOverview";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.data = this.props.record.data[this.props.name];
    }

    get levelsData() {
        return this.data?.levels || [];
    }

    getLevelClass(type) {
        const classes = {
            'pre': 'info',
            'primary': 'success',
            'secundary': 'warning'
        };
        return classes[type] || 'secondary';
    }

    getLevelIcon(type) {
        const icons = {
            'pre': 'fa-child',
            'primary': 'fa-graduation-cap',
            'secundary': 'fa-university'
        };
        return icons[type] || 'fa-school';
    }
}

registry.category("fields").add("year_performance_overview", {
    component: YearPerformanceOverview,
    supportedTypes: ["json"],
});
