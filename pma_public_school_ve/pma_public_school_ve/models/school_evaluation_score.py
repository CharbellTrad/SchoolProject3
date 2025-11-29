from odoo import _, api, fields, models




class SchoolEvaluationScore(models.Model):
    _name = 'school.evaluation.score'
    _description = 'School Evaluation Score'

    evaluation_id = fields.Many2one(comodel_name='school.evaluation', string='Evaluación', required=True)

    year_id = fields.Many2one(comodel_name='school.year', string='Año escolar', related='evaluation_id.year_id', store=True)

    section_id = fields.Many2one(comodel_name='school.section', string='Sección', related='evaluation_id.section_id', store=True)

    type = fields.Selection(string='Tipo', selection=[
                                    ('secundary', 'Media general'), 
                                    ('primary', 'Primaria'), 
                                    ('pre', 'Preescolar')], related='section_id.type', store=True)


    subject_id = fields.Many2one(comodel_name='school.subject', string='Materia', related='evaluation_id.subject_id', store=True)

    student_id = fields.Many2one(comodel_name='school.student', string='Estudiante', required=True)

    literal_type = fields.Selection(string='Tipo literal', selection=[
                                                                        ('A', 'A - Superó las espectativas'),
                                                                        ('B', 'B - Cumplió con las espectativas'),
                                                                        ('C', 'C - Cumplió casi con todas las espectativas'),
                                                                        ('D', 'D - Cumplió con algunas de las espectativas'),
                                                                        ('E', 'E - No cumplió con las espectativas')
                                                                    ])

    observation = fields.Html('Observación')

    score = fields.Float(string='Puntaje')

    points_20 = fields.Float(string='Puntaje a 20', compute='_compute_points', store=True)

    points_100 = fields.Float(string='Puntaje a 100', compute='_compute_points', store=True)

    @api.depends('score')
    def _compute_points(self):
        for record in self:
            if not record.evaluation_id.invisible_score:
                if record.type == 'secundary':
                    if record.evaluation_id.year_id.evalution_type_secundary.type_evaluation == '20':
                        record.points_20 = record.score
                        record.points_100 = record.score * 100 / 20
                    elif record.evaluation_id.year_id.evalution_type_secundary.type_evaluation == '100':
                        record.points_100 = record.score
                        record.points_20 = record.score * 20 / 100

                elif record.type == 'primary':
                    if record.evaluation_id.year_id.evalution_type_primary.type_evaluation == '20':
                        record.points_20 = record.score
                        record.points_100 = record.score * 100 / 20
           
    state = fields.Selection(string='Estado', selection=[('draft', 'No calificado'), ('qualified', 'Calificado')], compute="_compute_state", store=True)

    @api.depends('literal_type', 'score', 'observation')
    def _compute_state(self):
        for record in self:
            if record.literal_type or record.score > 0 or record.observation:
                record.state = 'qualified'
            else:
                record.state = 'draft'
    
    state_score = fields.Selection(string='Estado de nota', selection=[('approve', 'Aprobado'), ('failed', 'Desaprobado')], compute="_compute_state_score", store=True)
    
    @api.depends('evaluation_id.invisible_observation', 'evaluation_id.invisible_score', 'evaluation_id.invisible_literal',
        'points_20', 'literal_type', 'score')
    def _compute_state_score(self):
        for rec in self:
            if not rec.evaluation_id.invisible_observation:
                rec.state_score = 'approve'
            elif not rec.evaluation_id.invisible_score:
                rec.state_score = 'approve' if 10 <= rec.points_20 else 'failed'
            elif not rec.evaluation_id.invisible_literal:
                rec.state_score = 'approve' if rec.literal_type and 'C' >= rec.literal_type else 'failed'

    def write(self, vals):
        res = super().write(vals)
        # Actualizar rendimiento del estudiante cuando se modifican las calificaciones
        if 'score' in vals or 'literal_type' in vals or 'observation' in vals:
            students_to_update = self.mapped('student_id.student_id').filtered(lambda s: s)
            if students_to_update:
                students_to_update._update_performance_json()
        return res
    @api.model_create_multi
    def create(self, vals_list):
        res = super().create(vals_list)
        # Actualizar rendimiento del estudiante cuando se crean nuevas calificaciones
        students_to_update = res.mapped('student_id.student_id').filtered(lambda s: s)
        if students_to_update:
            students_to_update._update_performance_json()
        return res


















# # # You MUST store this key securely. Place it in an
# # # environment variable or in in a file outside of
# # # git (e.g. your home directory).
# api_key = "9a54e0a2320135b736b790d80ffc9c903a3e5cfc"

# import requests
# response = requests.post(
#     "http://185.111.156.32:8500/json/2/res.partner/search_read",
#     headers={
#         "Authorization": f"Bearer {api_key}",
#         # "X-Odoo-Database": "...",
#     },
#     json={
#         "domain": [
#             # [
#             #     "display_name",
#             #     "ilike",
#             #     "a%"
#             # ]
#         ],
#         "fields": [
#             "display_name"
#         ],
#         "limit": 20
#     },
# )
# response.raise_for_status()
# data = response.json()
# print(data)
