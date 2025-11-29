/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

export class AttendanceRegister extends Component {
    static template = "pma_public_school_ve.AttendanceRegister";
    static props = {};

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");

        this.state = useState({
            activeTab: 'student',
            loading: false,

            // Student tab
            sections: [],
            selectedSection: null,
            schedules: [],
            selectedSchedule: null,
            students: [],
            studentSearch: '',
            date: this.getTodayString(),

            // Employee tab
            employees: [],
            employeeTypes: [
                { value: 'administrativo', label: 'Administrativo' },
                { value: 'docente', label: 'Docente' },
                { value: 'obrero', label: 'Obrero' },
                { value: 'cenar', label: 'Cenar' }
            ],
            selectedEmployeeType: null,
            employeeSearch: '',

            // Visitor tab
            visitorName: '',
            visitorIdNumber: '',
            visitorDestination: '',
            todayVisitors: [],
        });

        onWillStart(async () => {
            await this.loadInitialData();
        });
    }

    async loadInitialData() {
        await this.loadSections();
        await this.loadEmployees();
        await this.loadTodayVisitors();
    }

    switchTab(tabName) {
        this.state.activeTab = tabName;
    }

    // ========== STUDENT TAB ==========

    async loadSections() {
        this.state.loading = true;
        try {
            const sections = await this.orm.searchRead(
                "school.section",
                [["current", "=", true]],
                ["id", "section_id", "type"],
                { order: "section_id" }
            );
            this.state.sections = sections;
        } catch (error) {
            this.notification.add("Error al cargar secciones", { type: "danger" });
            console.error(error);
        } finally {
            this.state.loading = false;
        }
    }

    async onSectionChange(ev) {
        const sectionId = parseInt(ev.target.value);
        this.state.selectedSection = this.state.sections.find(s => s.id === sectionId);
        this.state.selectedSchedule = null;
        this.state.students = [];
        this.state.schedules = [];

        if (this.state.selectedSection) {
            await this.loadSchedules();
        }
    }

    async loadSchedules() {
        if (!this.state.selectedSection) return;

        try {
            const today = new Date(this.state.date);
            const jsDay = today.getDay();

            let odooDayOfWeek;
            if (jsDay === 0) {
                odooDayOfWeek = '6';
            } else {
                odooDayOfWeek = (jsDay - 1).toString();
            }

            const schedules = await this.orm.searchRead(
                "school.schedule",
                [
                    ["section_id", "=", this.state.selectedSection.id],
                    ["day_of_week", "=", odooDayOfWeek],
                    ["active", "=", true]
                ],
                ["id", "display_name", "start_time", "end_time"],
                { order: "start_time" }
            );
            this.state.schedules = schedules;
        } catch (error) {
            console.error("Error loading schedules:", error);
            this.notification.add("Error al cargar horarios", { type: "danger" });
        }
    }

    async onScheduleChange(ev) {
        const scheduleId = parseInt(ev.target.value);
        this.state.selectedSchedule = this.state.schedules.find(s => s.id === scheduleId);
        this.state.students = [];

        if (this.state.selectedSchedule) {
            await this.loadStudents();
        }
    }

    async loadStudents() {
        if (!this.state.selectedSection) return;

        try {
            const students = await this.orm.searchRead(
                "school.student",
                [
                    ["section_id", "=", this.state.selectedSection.id],
                    ["current", "=", true]
                ],
                ["id", "student_id", "name"],
                { order: "name" }
            );

            this.state.students = students.map(s => ({
                ...s,
                attendance_id: null,
                state: 'absent',
                observations: '',
                check_in_time: '',
                check_out_time: ''
            }));

            if (this.state.selectedSchedule) {
                await this.loadExistingAttendances();
            }
        } catch (error) {
            console.error("Error loading students:", error);
            this.notification.add("Error al cargar estudiantes", { type: "danger" });
        }
    }

    async loadExistingAttendances() {
        if (!this.state.selectedSchedule || this.state.students.length === 0) return;

        try {
            const attendances = await this.orm.searchRead(
                "school.attendance",
                [
                    ["date", "=", this.state.date],
                    ["schedule_id", "=", this.state.selectedSchedule.id],
                    ["student_id", "in", this.state.students.map(s => s.id)]
                ],
                ["id", "student_id", "state", "observations", "check_in_time", "check_out_time"]
            );

            attendances.forEach(att => {
                const student = this.state.students.find(s => s.id === att.student_id[0]);
                if (student) {
                    student.attendance_id = att.id;
                    student.state = att.state;
                    student.observations = att.observations || '';
                    student.check_in_time = this.floatToTime(att.check_in_time);
                    student.check_out_time = this.floatToTime(att.check_out_time);
                }
            });
        } catch (error) {
            console.error("Error loading existing attendances:", error);
        }
    }

    updateStudentState(studentId, state) {
        const student = this.state.students.find(s => s.id === studentId);
        if (!student) return;

        student.state = state;

        // Apply rules based on state
        if (state === 'present') {
            student.check_in_time = this.floatToTime(this.state.selectedSchedule.start_time);
            student.check_out_time = this.floatToTime(this.state.selectedSchedule.end_time);
        } else if (state === 'absent') {
            student.check_in_time = '';
            student.check_out_time = '';
        }
    }

    get filteredStudents() {
        if (!this.state.studentSearch) return this.state.students;
        const search = this.state.studentSearch.toLowerCase();
        return this.state.students.filter(s =>
            s.name.toLowerCase().includes(search)
        );
    }

    isStudentTimeEditable(student) {
        return student.state === 'late' || student.state === 'permission';
    }

    async saveStudentAttendances() {
        if (!this.state.selectedSection || !this.state.selectedSchedule) {
            this.notification.add("Seleccione sección y horario", { type: "warning" });
            return;
        }

        this.state.loading = true;
        try {
            const toUpdate = [];
            const toCreate = [];

            this.state.students.forEach(s => {
                const data = {
                    student_id: s.id,
                    state: s.state,
                    observations: s.observations,
                    check_in_time: this.timeToFloat(s.check_in_time),
                    check_out_time: this.timeToFloat(s.check_out_time),
                    date: this.state.date,
                    schedule_id: this.state.selectedSchedule.id,
                    attendance_type: 'student'
                };

                if (s.attendance_id) {
                    toUpdate.push({ id: s.attendance_id, data });
                } else {
                    toCreate.push(data);
                }
            });

            for (const item of toUpdate) {
                await this.orm.write("school.attendance", [item.id], item.data);
            }

            if (toCreate.length > 0) {
                await this.orm.create("school.attendance", toCreate);
            }

            this.notification.add("Asistencias guardadas correctamente", { type: "success" });
            await this.loadExistingAttendances();
        } catch (error) {
            this.notification.add("Error al guardar asistencias", { type: "danger" });
            console.error(error);
        } finally {
            this.state.loading = false;
        }
    }

    // ========== EMPLOYEE TAB ==========

    async loadEmployees() {
        try {
            let domain = [["active", "=", true]];
            if (this.state.selectedEmployeeType) {
                domain.push(["school_employee_type", "=", this.state.selectedEmployeeType]);
            }

            const employees = await this.orm.searchRead(
                "hr.employee",
                domain,
                ["id", "name", "school_employee_type"],
                { order: "name" }
            );

            this.state.employees = employees.map(emp => ({
                ...emp,
                attendance_id: null,
                state: 'absent',
                check_in_time: '',
                check_out_time: ''
            }));

            await this.loadExistingEmployeeAttendances();
        } catch (error) {
            console.error("Error loading employees:", error);
        }
    }

    async loadExistingEmployeeAttendances() {
        if (this.state.employees.length === 0) return;

        try {
            const attendances = await this.orm.searchRead(
                "school.attendance",
                [
                    ["date", "=", this.state.date],
                    ["attendance_type", "=", "employee"],
                    ["employee_id", "in", this.state.employees.map(e => e.id)]
                ],
                ["id", "employee_id", "state", "check_in_time", "check_out_time"]
            );

            attendances.forEach(att => {
                const employee = this.state.employees.find(e => e.id === att.employee_id[0]);
                if (employee) {
                    employee.attendance_id = att.id;
                    employee.state = att.state;
                    employee.check_in_time = this.floatToTime(att.check_in_time);
                    employee.check_out_time = this.floatToTime(att.check_out_time);
                }
            });
        } catch (error) {
            console.error("Error loading existing employee attendances:", error);
        }
    }

    async onEmployeeTypeChange(ev) {
        const typeValue = ev.target.value || null;
        this.state.selectedEmployeeType = typeValue;
        await this.loadEmployees();
    }

    get filteredEmployees() {
        if (!this.state.employeeSearch) return this.state.employees;
        const search = this.state.employeeSearch.toLowerCase();
        return this.state.employees.filter(e =>
            e.name.toLowerCase().includes(search)
        );
    }

    updateEmployeeState(employeeId, state) {
        const employee = this.state.employees.find(e => e.id === employeeId);
        if (!employee) return;

        employee.state = state;

        if (state === 'present' || state === 'late' || state === 'permission') {
            employee.check_in_time = this.getCurrentTime();
            employee.check_out_time = '';
        } else if (state === 'absent') {
            employee.check_in_time = '';
            employee.check_out_time = '';
        }
    }

    markEmployeeCheckOut(employeeId) {
        const employee = this.state.employees.find(e => e.id === employeeId);
        if (employee) {
            employee.check_out_time = this.getCurrentTime();
        }
    }

    canShowCheckOutButton(employee) {
        if (employee.state === 'present' || employee.state === 'late') {
            return true;
        }
        if (employee.state === 'permission' && employee.check_in_time) {
            return true;
        }
        return false;
    }

    isEmployeeTimeEditable(employee) {
        return employee.state !== 'absent';
    }

    async saveEmployeeAttendances() {
        this.state.loading = true;
        try {
            const toUpdate = [];
            const toCreate = [];

            this.state.employees.forEach(e => {
                const data = {
                    employee_id: e.id,
                    state: e.state,
                    check_in_time: this.timeToFloat(e.check_in_time),
                    check_out_time: this.timeToFloat(e.check_out_time),
                    date: this.state.date,
                    attendance_type: 'employee'
                };

                if (e.attendance_id) {
                    toUpdate.push({ id: e.attendance_id, data });
                } else if (e.state !== 'absent') {
                    toCreate.push(data);
                }
            });

            for (const item of toUpdate) {
                await this.orm.write("school.attendance", [item.id], item.data);
            }

            if (toCreate.length > 0) {
                await this.orm.create("school.attendance", toCreate);
            }

            this.notification.add("Asistencias de personal guardadas", { type: "success" });
            await this.loadExistingEmployeeAttendances();
        } catch (error) {
            this.notification.add("Error al guardar asistencias", { type: "danger" });
            console.error(error);
        } finally {
            this.state.loading = false;
        }
    }

    // ========== VISITOR TAB ==========

    async loadTodayVisitors() {
        try {
            const visitors = await this.orm.searchRead(
                "school.attendance",
                [
                    ["date", "=", this.state.date],
                    ["attendance_type", "=", "visitor"]
                ],
                ["visitor_name", "visitor_id_number", "visitor_destination", "check_in_time"],
                { order: "check_in_time desc" }
            );
            this.state.todayVisitors = visitors;
        } catch (error) {
            console.error("Error loading visitors:", error);
        }
    }

    async registerVisitor() {
        if (!this.state.visitorName || !this.state.visitorIdNumber) {
            this.notification.add("Ingrese nombre y cédula del visitante", { type: "warning" });
            return;
        }

        this.state.loading = true;
        try {
            const visitorData = {
                attendance_type: 'visitor',
                visitor_name: this.state.visitorName,
                visitor_id_number: this.state.visitorIdNumber,
                visitor_destination: this.state.visitorDestination,
                date: this.state.date,
                check_in_time: this.getCurrentTimeFloat(),
                state: 'present'
            };

            await this.orm.create("school.attendance", [visitorData]);

            this.notification.add("Visitante registrado correctamente", { type: "success" });

            this.state.visitorName = '';
            this.state.visitorIdNumber = '';
            this.state.visitorDestination = '';

            await this.loadTodayVisitors();
        } catch (error) {
            this.notification.add("Error al registrar visitante", { type: "danger" });
            console.error(error);
        } finally {
            this.state.loading = false;
        }
    }

    // ========== UTILITIES ==========

    getTodayString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    getCurrentTimeFloat() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        return hours + (minutes / 60);
    }

    floatToTime(floatTime) {
        if (!floatTime) return '';
        const hours = Math.floor(floatTime);
        const minutes = Math.round((floatTime - hours) * 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    timeToFloat(timeStr) {
        if (!timeStr) return 0.0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + (minutes / 60);
    }

    async onDateChange(ev) {
        this.state.date = ev.target.value;
        if (this.state.activeTab === 'student' && this.state.selectedSection) {
            await this.loadSchedules();
            await this.loadExistingAttendances();
        } else if (this.state.activeTab === 'employee') {
            await this.loadExistingEmployeeAttendances();
        } else if (this.state.activeTab === 'visitor') {
            await this.loadTodayVisitors();
        }
    }
}

registry.category("actions").add("attendance_register", AttendanceRegister);
