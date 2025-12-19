/** @odoo-module **/

import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";
import { Component } from "@odoo/owl";

/**
 * Widget: Mentions Tags
 * 
 * FIX: Este widget muestra los nombres de menciones como badges SIN:
 * - El año escolar (redundante en el contexto del dashboard del año)
 * - Truncamiento (nombres completos visibles)
 * 
 * Reemplaza many2many_tags para el campo mentions_ids que usaba display_name
 * con formato "Mención - 2024-2025" causando truncamiento y redundancia.
 */
export class MentionsTagsWidget extends Component {
    static template = "school.MentionsTagsWidget";
    static props = { ...standardFieldProps };

    setup() {
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name];
    }

    get hasMentions() {
        return this.mentions && this.mentions.length > 0;
    }

    get mentions() {
        return this.data?.mentions || [];
    }

    onMentionClick(mention) {
        if (!mention.id) return;
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'school.mention.section',
            res_id: mention.id,
            views: [[false, 'form']],
            target: 'current'
        });
    }
}

registry.category("fields").add("mentions_tags_widget", {
    component: MentionsTagsWidget,
    supportedTypes: ["json"],
});
