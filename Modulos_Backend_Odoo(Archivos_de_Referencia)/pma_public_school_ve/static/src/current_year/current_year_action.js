/** @odoo-module **/

import { Component, onWillStart } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

export class CurrentSchoolYearAction extends Component {
    static template = "pma_public_school_ve.CurrentSchoolYearAction";
    static props = {};

    setup() {
        this.orm = useService("orm");
        this.action = useService("action");

        onWillStart(async () => {
            await this.openCurrentYear();
        });
    }

    async openCurrentYear() {
        try {
            // Buscar el año escolar actual
            const currentYears = await this.orm.searchRead(
                "school.year",
                [["current", "=", true]],
                ["id"],
                { limit: 1 }
            );

            if (currentYears.length > 0) {
                // Abrir el año actual en vista formulario
                this.action.doAction({
                    type: "ir.actions.act_window",
                    name: "Año Escolar Actual",
                    res_model: "school.year",
                    res_id: currentYears[0].id,
                    views: [[false, "form"]],
                    view_mode: "form",
                    target: "current",
                });
            } else {
                // Si no hay año actual, abrir la vista de lista
                this.action.doAction({
                    type: "ir.actions.act_window",
                    name: "Años Escolares",
                    res_model: "school.year",
                    views: [[false, "list"], [false, "form"]],
                    view_mode: "list,form",
                    target: "current",
                });
            }
        } catch (error) {
            console.error("Error opening current school year:", error);
            // En caso de error, abrir la vista de lista
            this.action.doAction({
                type: "ir.actions.act_window",
                name: "Años Escolares",
                res_model: "school.year",
                views: [[false, "list"], [false, "form"]],
                view_mode: "list,form",
                target: "current",
            });
        }
    }
}

registry.category("actions").add("current_school_year_action", CurrentSchoolYearAction);
