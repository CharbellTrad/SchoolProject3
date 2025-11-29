/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

export class ScheduleWidget extends Component {
    static template = "pma_public_school_ve.ScheduleWidget";
    static props = {};

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");

        this.state = useState({
            sections: [],
            selectedSection: null,
            scheduleData: null,  // Will contain {schedule_type, education_level, section_name, schedules}
            loading: false,
            timeSlots: [],
            educationLevel: null,
            scheduleType: null,  // 'subject' or 'teacher'
        });

        this.days = [
            { key: "0", label: "Lunes" },
            { key: "1", label: "Martes" },
            { key: "2", label: "Miércoles" },
            { key: "3", label: "Jueves" },
            { key: "4", label: "Viernes" },
            { key: "5", label: "Sábado" },
            { key: "6", label: "Domingo" }
        ];

        onWillStart(async () => {
            await this.loadSections();
        });
    }

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
            await this.loadTimeSlots();
        }
    }

    async loadSchedule() {
        if (!this.state.selectedSection) return;

        this.state.loading = true;
        try {
            // Llamar al método MEJORADO que retorna el horario semanal con tipo
            const scheduleData = await this.orm.call(
                "school.schedule",
                "get_weekly_schedule_enhanced",
                [this.state.selectedSection.id]
            );

            // scheduleData = {schedule_type, education_level, section_name, schedules: {0: [], 1: [], ...}}
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

    async loadTimeSlots() {
        if (!this.state.educationLevel) return;

        try {
            const timeSlots = await this.orm.call(
                "school.time.slot",
                "get_time_slots_for_level",
                [this.state.educationLevel]
            );

            this.state.timeSlots = timeSlots;
        } catch (error) {
            console.error("Error loading time slots:", error);
        }
    }

    getScheduleForDay(dayKey) {
        if (!this.state.scheduleData || !this.state.scheduleData.schedules) {
            return [];
        }
        return this.state.scheduleData.schedules[dayKey] || [];
    }

    getColorClass(colorIndex) {
        // Odoo color palette
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
            '#EC7063'
        ];
        return colors[colorIndex % colors.length];
    }

    formatTime(floatTime) {
        const hours = Math.floor(floatTime);
        const minutes = Math.round((floatTime - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    getScheduleItemStyle(schedule) {
        // Calcular posición y altura basada en tiempo
        const startMinutes = schedule.start_time * 60;
        const endMinutes = schedule.end_time * 60;
        const duration = endMinutes - startMinutes;

        // Asumiendo que el día empieza a las 7:00 (420 minutos)
        const dayStartMinutes = 7 * 60;
        const top = ((startMinutes - dayStartMinutes) / 60) * 80; // 80px por hora
        const height = (duration / 60) * 80;

        return {
            top: `${top}px`,
            height: `${height}px`,
            backgroundColor: this.getColorClass(schedule.color),
        };
    }

    async exportToPDF() {
        if (!this.state.selectedSection) {
            this.notification.add("Seleccione una sección primero", { type: "warning" });
            return;
        }

        this.notification.add("Función de exportación en desarrollo", { type: "info" });
        // TODO: Implementar exportación a PDF
    }

    async printSchedule() {
        if (!this.state.selectedSection) {
            this.notification.add("Seleccione una sección primero", { type: "warning" });
            return;
        }

        window.print();
    }

    hasScheduleData() {
        if (!this.state.scheduleData || !this.state.scheduleData.schedules) {
            return false;
        }
        return Object.values(this.state.scheduleData.schedules).some(day => day.length > 0);
    }

    getEarliestTime() {
        if (!this.state.scheduleData || !this.state.scheduleData.schedules) {
            return 7;
        }
        let earliest = 24;
        Object.values(this.state.scheduleData.schedules).forEach(day => {
            day.forEach(schedule => {
                if (schedule.start_time < earliest) {
                    earliest = schedule.start_time;
                }
            });
        });
        return Math.floor(earliest);
    }

    getLatestTime() {
        if (!this.state.scheduleData || !this.state.scheduleData.schedules) {
            return 14;
        }
        let latest = 0;
        Object.values(this.state.scheduleData.schedules).forEach(day => {
            day.forEach(schedule => {
                if (schedule.end_time > latest) {
                    latest = schedule.end_time;
                }
            });
        });
        return Math.ceil(latest);
    }

    getTimeRange() {
        if (!this.hasScheduleData()) {
            return { start: 7, end: 14 }; // Default range
        }
        return {
            start: this.getEarliestTime(),
            end: this.getLatestTime()
        };
    }

    getHourSlots() {
        const range = this.getTimeRange();
        const slots = [];
        for (let hour = range.start; hour < range.end; hour++) {
            slots.push(hour);
        }
        return slots;
    }

    // Nuevos métodos para renderizado diferenciado
    isSubjectBasedSchedule() {
        return this.state.scheduleType === 'subject';
    }

    isTeacherBasedSchedule() {
        return this.state.scheduleType === 'teacher';
    }

    // Métodos para la vista de calendario en cuadrícula
    getTimeSlots() {
        // Genera slots de tiempo desde las 6:00 AM hasta las 6:00 PM (18:00)
        const slots = [];
        for (let hour = 6; hour <= 18; hour++) {
            const label = `${hour.toString().padStart(2, '0')}:00`;
            slots.push({ hour, label });
        }
        return slots;
    }

    getSchedulesForDayAndTime(dayKey, hour) {
        // Obtiene los horarios que empiezan en esta hora específica para este día
        if (!this.state.scheduleData || !this.state.scheduleData.schedules) {
            return [];
        }

        const daySchedules = this.state.scheduleData.schedules[dayKey] || [];

        // Filtra los horarios que empiezan en esta hora
        return daySchedules.filter(schedule => {
            const startHour = Math.floor(schedule.start_time);
            return startHour === hour;
        });
    }

    getScheduleBlockStyle(schedule) {
        // Calcula la posición y altura del bloque de horario
        const startHour = Math.floor(schedule.start_time);
        const startMinutes = (schedule.start_time - startHour) * 60;
        const durationHours = schedule.duration;

        // Cada hora tiene 80px de altura
        const hourHeight = 80;

        // Posición desde el inicio de la celda (en minutos desde la hora)
        const topOffset = (startMinutes / 60) * hourHeight;

        // Altura del bloque basada en la duración
        const blockHeight = durationHours * hourHeight;

        // Color de fondo
        const backgroundColor = this.getColorClass(schedule.color);

        return `
            position: absolute;
            top: ${topOffset}px;
            left: 4px;
            right: 4px;
            height: ${blockHeight - 4}px;
            background-color: ${backgroundColor};
            border-radius: 4px;
            padding: 6px;
            color: white;
            font-size: 0.75rem;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
            z-index: 1;
        `.replace(/\s+/g, ' ').trim();
    }

    getScheduleTooltip(schedule) {
        // Genera un tooltip con información completa del horario
        let tooltip = '';

        if (this.isSubjectBasedSchedule()) {
            tooltip = schedule.subject_name || '';
            if (schedule.professor_name) {
                tooltip += `\nProfesor: ${schedule.professor_name}`;
            }
        } else {
            tooltip = schedule.professors_names || '';
        }

        tooltip += `\nHora: ${schedule.start_time_str} - ${schedule.end_time_str}`;

        if (schedule.classroom) {
            tooltip += `\nAula: ${schedule.classroom}`;
        }

        return tooltip;
    }
}

registry.category("actions").add("schedule_widget", ScheduleWidget);
