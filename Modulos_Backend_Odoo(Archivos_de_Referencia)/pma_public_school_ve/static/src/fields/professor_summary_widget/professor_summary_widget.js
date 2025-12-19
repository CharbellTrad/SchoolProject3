/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, useState } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

/**
 * Widget: Professor Summary Widget
 * 
 * Displays a sortable table of professors with their academic load
 * including sections, subjects, and evaluations count.
 */
export class ProfessorSummaryWidget extends Component {
    static template = "school.ProfessorSummaryWidget";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name];

        this.state = useState({
            sortField: 'evaluations_count',
            sortOrder: 'desc',
            searchQuery: ''
        });
    }

    get professors() {
        return this.data?.professors || [];
    }

    get totalProfessors() {
        return this.data?.total || 0;
    }

    get hasData() {
        return this.professors.length > 0;
    }

    /**
     * Get filtered and sorted professors
     */
    get filteredProfessors() {
        let result = [...this.professors];

        // Filter by search query
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            result = result.filter(p =>
                p.professor_name.toLowerCase().includes(query)
            );
        }

        // Sort
        const field = this.state.sortField;
        const order = this.state.sortOrder === 'asc' ? 1 : -1;

        result.sort((a, b) => {
            if (field === 'professor_name') {
                return order * a.professor_name.localeCompare(b.professor_name);
            }
            return order * ((a[field] || 0) - (b[field] || 0));
        });

        return result;
    }

    /**
     * Handle column header click for sorting
     */
    onSort(field) {
        if (this.state.sortField === field) {
            this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortField = field;
            this.state.sortOrder = 'desc';
        }
    }

    /**
     * Get sort icon class
     */
    getSortIcon(field) {
        if (this.state.sortField !== field) {
            return 'fa-sort text-muted';
        }
        return this.state.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
    }

    /**
     * Handle search input
     */
    onSearch(event) {
        this.state.searchQuery = event.target.value;
    }

    /**
     * Handle click on professor row
     */
    onProfessorClick(professorId) {
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'hr.employee',
            res_id: professorId,
            views: [[false, 'form']],
            target: 'current',
        });
    }

    /**
     * Get workload badge class
     */
    getWorkloadClass(evaluationsCount) {
        if (evaluationsCount >= 20) return 'bg-danger';
        if (evaluationsCount >= 10) return 'bg-warning text-dark';
        return 'bg-success';
    }

    /**
     * Get initials for avatar
     */
    getInitials(name) {
        if (!name) return '?';
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    }

    /**
     * Get avatar color from name
     */
    getAvatarColor(name) {
        const colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
            '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
}

registry.category("fields").add("professor_summary_widget", {
    component: ProfessorSummaryWidget,
    supportedTypes: ["json"],
});
