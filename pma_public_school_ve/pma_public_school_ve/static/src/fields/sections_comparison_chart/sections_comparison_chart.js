/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, useEffect, useRef } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { loadBundle } from "@web/core/assets";
import { getColor } from "@web/core/colors/colors";
import { cookie } from "@web/core/browser/cookie";
import { useService } from "@web/core/utils/hooks";

export class SectionsComparisonChart extends Component {
    static template = "school.SectionsComparisonChart";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.chart = null;
        this.canvasRef = useRef("canvas");
        this.actionService = useService("action");
        this.data = this.props.record.data[this.props.name];

        onWillStart(async () => {
            await loadBundle("web.chartjs_lib");
        });

        useEffect(() => {
            this.renderChart();
            return () => {
                if (this.chart) {
                    this.chart.destroy();
                }
            };
        });
    }

    get sectionsData() {
        return this.data?.sections || [];
    }

    renderChart() {
        if (this.chart) {
            this.chart.destroy();
        }

        if (!this.sectionsData || this.sectionsData.length === 0) {
            return;
        }

        const colorScheme = cookie.get("color_scheme");
        const labels = this.sectionsData.map(s => s.section_name);
        const averages = this.sectionsData.map(s => s.average);
        const approvalRates = this.sectionsData.map(s => s.approval_rate);

        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Promedio',
                        data: averages,
                        backgroundColor: getColor(10, colorScheme),
                        borderColor: getColor(10, colorScheme),
                        borderWidth: 2,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Tasa de Aprobación (%)',
                        data: approvalRates,
                        backgroundColor: getColor(3, colorScheme),
                        borderColor: getColor(3, colorScheme),
                        borderWidth: 2,
                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Promedio'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Aprobación (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        max: 100
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                const index = context.dataIndex;
                                const section = this.sectionsData[index];
                                return [
                                    `Total: ${section.total_students} estudiantes`,
                                    `Aprobados: ${section.approved_students}`,
                                    `Reprobados: ${section.failed_students}`
                                ];
                            }
                        }
                    }
                }
            }
        };

        this.chart = new Chart(this.canvasRef.el, config);
    }

    onSectionClick(sectionId) {
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'school.section',
            res_id: sectionId,
            views: [[false, 'form']],
            target: 'current',
        });
    }
}

registry.category("fields").add("sections_comparison_chart", {
    component: SectionsComparisonChart,
    supportedTypes: ["json"],
});
