/** @odoo-module **/

import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";
import { Component } from "@odoo/owl";

/**
 * Widget: Sections Comparison Chart
 * Shows best performing section per education level as cards
 */
export class SectionsComparisonChart extends Component {
    static template = "school.SectionsComparisonChart";
    static props = { ...standardFieldProps };

    setup() {
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name];
    }

    get hasData() { return this.sections && this.sections.length > 0; }
    get sections() { return this.data?.sections || []; }

    getLevelBorderClass(type) {
        return { 'primary': 'border-success', 'secundary': 'border-primary', 'tecnico': 'border-purple' }[type] || 'border-secondary';
    }

    getLevelBadgeClass(type) {
        return { 'primary': 'bg-success', 'secundary': 'bg-primary', 'tecnico': 'bg-purple' }[type] || 'bg-secondary';
    }

    getLiteralFromAverage(average) {
        if (!average || average === 0) return 'A';
        if (average >= 18) return 'A';
        if (average >= 15) return 'B';
        if (average >= 12) return 'C';
        if (average >= 10) return 'D';
        return 'E';
    }

    getLiteralBadgeClass(literal) {
        return { 'A': 'bg-success', 'B': 'bg-info', 'C': 'bg-warning text-dark', 'D': 'bg-orange', 'E': 'bg-danger' }[literal] || 'bg-secondary';
    }

    onSectionClick(section) {
        if (!section.section_id) return;
        const model = section.type === 'tecnico' ? 'school.mention.section' : 'school.section';
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: model,
            res_id: section.section_id,
            views: [[false, 'form']],
            target: 'current'
        });
    }
}

registry.category("fields").add("sections_comparison_chart", {
    component: SectionsComparisonChart,
    supportedTypes: ["json"],
});
