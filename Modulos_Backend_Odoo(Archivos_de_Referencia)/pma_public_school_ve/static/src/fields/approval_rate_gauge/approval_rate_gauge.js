/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onMounted, useRef, useState } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";

export class ApprovalRateGauge extends Component {
    static template = "school.ApprovalRateGauge";
    static props = { ...standardFieldProps };

    setup() {
        this.data = this.props.record.data[this.props.name];
        this.gaugeRef = useRef("gaugeContainer");
        this.state = useState({
            animatedRate: 0,
            animatedApproved: 0,
            animatedFailed: 0,
        });
        onMounted(() => this.animateGauge());
    }

    animateGauge() {
        const targetRate = this.data?.rate || 0;
        const targetApproved = this.data?.approved || 0;
        const targetFailed = this.data?.failed || 0;
        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);

            this.state.animatedRate = Math.round(targetRate * easeOut * 10) / 10;
            this.state.animatedApproved = Math.round(targetApproved * easeOut);
            this.state.animatedFailed = Math.round(targetFailed * easeOut);

            if (progress < 1) requestAnimationFrame(animate);
            else {
                this.state.animatedRate = targetRate;
                this.state.animatedApproved = targetApproved;
                this.state.animatedFailed = targetFailed;
            }
        };
        requestAnimationFrame(animate);
    }

    get hasData() { return this.data && this.data.total > 0; }
    get rate() { return this.data?.rate || 0; }
    get byLevel() { return this.data?.by_level || []; }
    get total() { return this.data?.total || 0; }
    get approved() { return this.data?.approved || 0; }
    get failed() { return this.data?.failed || 0; }

    // Override Preescolar to always show 100% (they don't have numeric grades)
    get adjustedByLevel() {
        return this.byLevel.map(level => {
            if (level.name === 'Preescolar') {
                return { ...level, rate: 100 };
            }
            return level;
        });
    }

    getGaugeColor(rate) {
        if (rate >= 90) return '#4caf50';
        if (rate >= 80) return '#8bc34a';
        if (rate >= 70) return '#ffc107';
        if (rate >= 60) return '#ff9800';
        return '#f44336';
    }

    getProgressStyle() {
        const rate = this.state.animatedRate;
        // Arc length is approximately 126 for this path
        const maxLength = 126;
        const dashLength = (rate / 100) * maxLength;
        return `stroke-dasharray: ${dashLength} ${maxLength};`;
    }

    getTextColorClass(rate) {
        if (rate >= 80) return 'text-success';
        if (rate >= 60) return 'text-warning';
        return 'text-danger';
    }

    getProgressArcStyle() {
        const rate = this.state.animatedRate;
        const maxArcLength = 251.33;
        const progressLength = (rate / 100) * maxArcLength;
        const color = this.getGaugeColor(rate);
        return `stroke-dasharray: ${progressLength} ${maxArcLength}; stroke: ${color};`;
    }

    getNeedleRotation() {
        const rate = this.state.animatedRate;
        const angle = ((rate / 100) * 180) - 90;
        return `rotate(${angle}deg)`;
    }

    getLevelRateClass(rate) {
        if (rate >= 80) return 'rate-excellent';
        if (rate >= 60) return 'rate-good';
        return 'rate-poor';
    }

    getLevelIconClass(name) {
        const map = { 'Preescolar': 'icon-pre', 'Primaria': 'icon-primary', 'Media General': 'icon-secundary', 'Medio Técnico': 'icon-tecnico' };
        return map[name] || 'icon-pre';
    }

    getLevelIcon(name) {
        const map = { 'Preescolar': 'fa-child', 'Primaria': 'fa-book', 'Media General': 'fa-graduation-cap', 'Medio Técnico': 'fa-cogs' };
        return map[name] || 'fa-users';
    }
}

registry.category("fields").add("approval_rate_gauge", { component: ApprovalRateGauge, supportedTypes: ["json"] });
