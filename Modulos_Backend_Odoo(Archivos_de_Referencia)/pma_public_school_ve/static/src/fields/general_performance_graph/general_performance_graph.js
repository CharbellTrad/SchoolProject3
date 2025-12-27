/** @odoo-module **/

import { loadBundle } from "@web/core/assets";
import { registry } from "@web/core/registry";
import { getColor } from "@web/core/colors/colors";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { Component, onWillStart, useEffect, useRef } from "@odoo/owl";
import { cookie } from "@web/core/browser/cookie";

export class GeneralPerformanceGraphField extends Component {
    static template = "school.GeneralPerformanceGraphField";
    static props = { ...standardFieldProps };

    setup() {
        this.chart = null;
        this.canvasRef = useRef("canvas");
        this.data = this.props.record.data[this.props.name];
        onWillStart(async () => await loadBundle("web.chartjs_lib"));
        useEffect(() => { this.renderChart(); return () => { if (this.chart) this.chart.destroy(); }; });
    }

    get hasData() { return this.data && (this.data.total_subjects > 0 || this.evaluationType === 'observation'); }

    get evaluationType() {
        if (this.data?.evaluation_type === 'observation' || this.data?.section_type === 'pre') return 'observation';
        if (this.data?.use_literal) return 'literal';
        return 'numeric';
    }

    get showChart() { return this.evaluationType !== 'observation' && this.data?.total_subjects > 0; }

    get performanceInfo() {
        if (!this.data) return null;
        if (this.evaluationType === 'observation') return { type: 'observation', message: 'Evaluación por observación', approved: true };

        if (this.evaluationType === 'literal') {
            // For literal, calculate state based on literal grade
            const literal = this.data.literal_average || 'E';
            const isApproved = ['A', 'B', 'C', 'D'].includes(literal); // A-D are approved
            return {
                type: 'literal', average: literal, averageLabel: 'Promedio Literal',
                state: isApproved ? 'approve' : 'failed', stateLabel: isApproved ? 'Aprobado' : 'Reprobado',
                badgeClass: this.getLiteralBadgeClass(literal),
                totalSubjects: this.data.total_subjects, subjectsApproved: this.data.subjects_approved, subjectsFailed: this.data.subjects_failed
            };
        }

        // For numeric, calculate state based on average (>= 10 is approved)
        const average = this.data.general_average || 0;
        const isApproved = average >= 10;
        const suffix = this.data.evaluation_type === '20' ? '/20' : '/100';
        return {
            type: 'numeric', average: average, suffix: suffix, averageLabel: 'Promedio General',
            state: isApproved ? 'approve' : 'failed', stateLabel: isApproved ? 'Aprobado' : 'Reprobado',
            stateClass: isApproved ? 'text-success' : 'text-danger',
            badgeClass: isApproved ? 'bg-success' : 'bg-danger',
            totalSubjects: this.data.total_subjects, subjectsApproved: this.data.subjects_approved, subjectsFailed: this.data.subjects_failed
        };
    }

    get literalDistribution() {
        if (this.evaluationType !== 'literal' || !this.data?.literal_distribution) return null;
        const dist = this.data.literal_distribution;
        const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
        return ['A', 'B', 'C', 'D', 'E'].map(lit => ({
            literal: lit, count: dist[lit] || 0, percentage: Math.round(((dist[lit] || 0) / total) * 100)
        }));
    }

    renderChart() {
        if (this.chart) { this.chart.destroy(); this.chart = null; }
        if (!this.showChart || !this.canvasRef.el) return;

        const colorScheme = cookie.get("color_scheme");
        this.chart = new Chart(this.canvasRef.el, {
            type: 'pie',
            data: {
                labels: ['Aprobados', 'Reprobados'],
                datasets: [{ data: [this.data.subjects_approved, this.data.subjects_failed], backgroundColor: ['#28a745', '#dc3545'], borderColor: '#ffffff', borderWidth: 2 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 1000, easing: 'easeOutQuart' },
                plugins: { legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 } } } }
            }
        });
    }

    getLiteralBadgeClass(literal) {
        const classes = { 'A': 'bg-success', 'B': 'bg-info', 'C': 'bg-warning text-dark', 'D': 'bg-orange', 'E': 'bg-danger' };
        return classes[literal] || 'bg-secondary';
    }

    getLiteralDescription(literal) {
        const desc = { 'A': 'Excelente - Superó las expectativas', 'B': 'Muy Bueno - Cumplió con las expectativas', 'C': 'Bueno - Alcanzó las expectativas básicas', 'D': 'Regular - Por debajo de las expectativas', 'E': 'Necesita Mejorar - No alcanzó las expectativas' };
        return desc[literal] || '';
    }
}

registry.category("fields").add("general_performance_graph", { component: GeneralPerformanceGraphField, supportedTypes: ["json"] });