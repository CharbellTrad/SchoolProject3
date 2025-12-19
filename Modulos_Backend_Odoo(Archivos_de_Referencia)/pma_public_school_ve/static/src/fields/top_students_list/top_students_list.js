/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

/**
 * Widget: Top Students List
 * Displays top 3 students per education level (Primary, Media General, Técnico)
 * Backend returns: { top_primary: [], top_secundary: [], top_tecnico: [] }
 */
export class TopStudentsList extends Component {
    static template = "school.TopStudentsList";
    static props = { ...standardFieldProps };

    setup() {
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name];
    }

    get hasData() {
        return this.levelGroups && this.levelGroups.length > 0;
    }

    get levelGroups() {
        if (!this.data) return [];

        const groups = [];

        if (this.data.top_primary && this.data.top_primary.length > 0) {
            groups.push({
                level: 'primary',
                name: 'Primaria',
                icon: 'fa-book',
                colorClass: 'text-success',
                students: this.data.top_primary
            });
        }

        if (this.data.top_secundary && this.data.top_secundary.length > 0) {
            groups.push({
                level: 'secundary',
                name: 'Media General',
                icon: 'fa-graduation-cap',
                colorClass: 'text-primary',
                students: this.data.top_secundary
            });
        }

        if (this.data.top_tecnico && this.data.top_tecnico.length > 0) {
            groups.push({
                level: 'tecnico',
                name: 'Medio Técnico',
                icon: 'fa-cogs',
                colorClass: 'text-purple',
                students: this.data.top_tecnico
            });
        }

        return groups;
    }

    getMedalIcon(index) {
        return ['🥇', '🥈', '🥉'][index] || `${index + 1}°`;
    }

    getPositionClass(index) {
        return ['position-gold', 'position-silver', 'position-bronze'][index] || '';
    }

    getAvatarClass(index) {
        return ['avatar-gold', 'avatar-silver', 'avatar-bronze'][index] || '';
    }

    getInitials(name) {
        if (!name) return '?';
        const parts = name.split(' ').filter(Boolean);
        return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
    }

    getAvatarColor(name) {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

    getStarCount(student) {
        if (student.use_literal) {
            const map = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
            return map[student.literal_average] || 3;
        }
        const avg = student.average || 0;
        if (avg >= 18) return 5;
        if (avg >= 16) return 4;
        if (avg >= 14) return 3;
        if (avg >= 10) return 2;
        return 1;
    }

    getGradeBadgeClass(average) {
        if (average >= 18) return 'grade-excellent';
        if (average >= 15) return 'grade-good';
        if (average >= 10) return 'grade-average';
        return 'grade-poor';
    }

    getDisplayValue(student) {
        if (student.use_literal) {
            return student.literal_average || 'N/A';
        }
        return student.average || 0;
    }

    onStudentClick(studentId) {
        if (!studentId) return;
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'res.partner',
            res_id: studentId,
            views: [[false, 'form']],
            target: 'current'
        });
    }
}

registry.category("fields").add("top_students_list", {
    component: TopStudentsList,
    supportedTypes: ["json"],
});
