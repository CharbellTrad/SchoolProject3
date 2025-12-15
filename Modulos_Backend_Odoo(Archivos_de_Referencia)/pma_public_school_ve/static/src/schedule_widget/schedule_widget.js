/** @odoo-module **/

import { Component, useState, onWillStart, onRendered } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Layout } from "@web/search/layout";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";

export class ScheduleWidget extends Component {
    static template = "pma_public_school_ve.ScheduleWidget";
    static components = { Layout };
    static props = { ...standardActionServiceProps };

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");

        this.state = useState({
            sections: [],
            selectedSection: null,
            scheduleData: null,
            loading: false,
            educationLevel: null,
            scheduleType: null,
        });

        // Days array (Monday to Sunday)
        this.days = [
            { key: "0", label: "LUN", fullLabel: "Lunes" },
            { key: "1", label: "MAR", fullLabel: "Martes" },
            { key: "2", label: "MIÉ", fullLabel: "Miércoles" },
            { key: "3", label: "JUE", fullLabel: "Jueves" },
            { key: "4", label: "VIE", fullLabel: "Viernes" },
            { key: "5", label: "SÁB", fullLabel: "Sábado" },
            { key: "6", label: "DOM", fullLabel: "Domingo" }
        ];

        // Color palette for schedule blocks
        this.colors = [
            '#4285F4', '#EA4335', '#FBBC04', '#34A853', '#FF6D01',
            '#46BDC6', '#7BAAF7', '#F07B72', '#FDD663', '#57BB8A',
            '#E8710A', '#AF5CF7', '#F538A0', '#174EA6', '#A50E0E'
        ];

        onWillStart(async () => {
            await this.loadSections();
        });

        onRendered(() => {
            this.env.config.setDisplayName("Horario de Clases");
        });
    }

    // ========== DATA LOADING ==========

    async loadSections() {
        this.state.loading = true;
        try {
            const sections = await this.orm.searchRead(
                "school.section",
                [["current", "=", true]],
                ["id", "section_id", "type", "year_id"],
                { order: "section_id" }
            );
            this.state.sections = sections;
        } catch (error) {
            this.notification.add("Error al cargar las secciones", { type: "danger" });
            console.error(error);
        } finally {
            this.state.loading = false;
        }
    }

    async onSectionChange(ev) {
        const sectionId = parseInt(ev.target.value);
        this.state.selectedSection = this.state.sections.find(s => s.id === sectionId);

        if (this.state.selectedSection) {
            this.state.educationLevel = this.state.selectedSection.type;
            await this.loadSchedule();
        } else {
            this.state.scheduleData = null;
        }
    }

    async loadSchedule() {
        if (!this.state.selectedSection) return;

        this.state.loading = true;
        try {
            const scheduleData = await this.orm.call(
                "school.schedule",
                "get_weekly_schedule_enhanced",
                [this.state.selectedSection.id]
            );

            this.state.scheduleData = scheduleData;
            this.state.scheduleType = scheduleData.schedule_type;
            this.state.educationLevel = scheduleData.education_level;
        } catch (error) {
            this.notification.add("Error al cargar el horario", { type: "danger" });
            console.error(error);
        } finally {
            this.state.loading = false;
        }
    }

    // ========== TIME SLOTS ==========

    get timeSlots() {
        // Generate time slots from 6:00 AM to 6:00 PM
        const slots = [];
        for (let hour = 6; hour <= 18; hour++) {
            slots.push({
                hour: hour,
                label: `${hour} AM`,
                displayLabel: hour <= 12 ? `${hour} AM` : `${hour - 12} PM`
            });
        }
        return slots;
    }

    // ========== SCHEDULE DATA ACCESS ==========

    getSchedulesForDay(dayKey) {
        if (!this.state.scheduleData?.schedules) return [];
        return this.state.scheduleData.schedules[dayKey] || [];
    }

    getSchedulesForCell(dayKey, hour) {
        const daySchedules = this.getSchedulesForDay(dayKey);
        return daySchedules.filter(schedule => {
            const startHour = Math.floor(schedule.start_time);
            return startHour === hour;
        });
    }

    hasScheduleData() {
        if (!this.state.scheduleData?.schedules) return false;
        return Object.values(this.state.scheduleData.schedules).some(day => day.length > 0);
    }

    isSubjectBasedSchedule() {
        return this.state.scheduleType === 'subject';
    }

    // ========== BLOCK STYLING ==========

    getBlockColor(colorIndex) {
        return this.colors[colorIndex % this.colors.length];
    }

    getBlockStyle(schedule) {
        const startHour = Math.floor(schedule.start_time);
        const startMinutes = (schedule.start_time - startHour) * 60;
        const durationMinutes = schedule.duration * 60;

        // Each hour = 60px height
        const hourHeight = 60;
        const topOffset = (startMinutes / 60) * hourHeight;
        const blockHeight = (durationMinutes / 60) * hourHeight;

        const backgroundColor = this.getBlockColor(schedule.color);

        return `
            position: absolute;
            top: ${topOffset}px;
            left: 2px;
            right: 2px;
            height: ${Math.max(blockHeight - 2, 20)}px;
            background-color: ${backgroundColor};
            border-radius: 4px;
            padding: 4px 6px;
            color: white;
            font-size: 11px;
            overflow: hidden;
            cursor: pointer;
            z-index: 1;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        `.replace(/\s+/g, ' ').trim();
    }

    getBlockTitle(schedule) {
        if (this.isSubjectBasedSchedule()) {
            return schedule.subject_name || '';
        }
        return schedule.professors_names || '';
    }

    getBlockTooltip(schedule) {
        let tooltip = this.getBlockTitle(schedule);
        tooltip += `\n${this.formatTime(schedule.start_time)} - ${this.formatTime(schedule.end_time)}`;
        if (schedule.professor_name) {
            tooltip += `\nProf: ${schedule.professor_name}`;
        }
        if (schedule.classroom) {
            tooltip += `\nAula: ${schedule.classroom}`;
        }
        return tooltip;
    }

    // ========== UTILITIES ==========

    formatTime(floatTime) {
        const hours = Math.floor(floatTime);
        const minutes = Math.round((floatTime - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    formatHourLabel(hour) {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    }

    // ========== ACTIONS ==========

    printSchedule() {
        if (!this.state.selectedSection) {
            this.notification.add("Seleccione una sección primero", { type: "warning" });
            return;
        }
        window.print();
    }

    exportToPDF() {
        if (!this.state.selectedSection) {
            this.notification.add("Seleccione una sección primero", { type: "warning" });
            return;
        }
        this.notification.add("Función de exportación en desarrollo", { type: "info" });
    }
}

registry.category("actions").add("schedule_widget", ScheduleWidget);
