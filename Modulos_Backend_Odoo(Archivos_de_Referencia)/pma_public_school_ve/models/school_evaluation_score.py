from odoo import _, api, fields, models




class SchoolEvaluationScore(models.Model):
    _name = 'school.evaluation.score'
    _description = 'School Evaluation Score'

    evaluation_id = fields.Many2one(comodel_name='school.evaluation', string='Evaluación', required=True)

    year_id = fields.Many2one(comodel_name='school.year', string='Año escolar', related='evaluation_id.year_id', store=True)
    
    lapso = fields.Selection(
        selection=[
            ('1', 'Primer Lapso'),
            ('2', 'Segundo Lapso'),
            ('3', 'Tercer Lapso')
        ],
        string='Lapso',
        related='evaluation_id.lapso',
        store=True
    )

    section_id = fields.Many2one(comodel_name='school.section', string='Sección', related='evaluation_id.section_id', store=True)

    type = fields.Selection(string='Tipo', selection=[
                                    ('secundary', 'Media general'), 
                                    ('primary', 'Primaria'), 
                                    ('pre', 'Preescolar')], related='section_id.type', store=True)


    subject_id = fields.Many2one(comodel_name='school.subject', string='Materia', related='evaluation_id.subject_id', store=True)
    
    mention_section_id = fields.Many2one(
        comodel_name='school.mention.section', 
        string='Mención', 
        related='evaluation_id.mention_section_id', 
        store=True
    )
    
    is_mention_score = fields.Boolean(
        string='Es Nota de Mención',
        related='evaluation_id.is_mention_evaluation',
        store=True
    )

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

    points_20 = fields.Float(string='Puntaje (Base 20)', compute='_compute_points', store=True)

    # FIX: Agregamos 'is_mention_score' como dependencia porque las evaluaciones
    # de mención no tienen section_id (tienen mention_section_id), lo que causa
    # que el campo 'type' sea NULL para notas de mención.
    @api.depends('score', 'type', 'is_mention_score')
    def _compute_points(self):
        """Compute points normalized to base 20
        
        PROBLEMA ORIGINAL:
        - El campo 'type' viene de 'section_id.type' (línea 27-30)
        - Para evaluaciones de MENCIÓN, section_id es NULL (usan mention_section_id)
        - Esto causaba que type = NULL, y por tanto points_20 = 0.0
        - Resultado: todas las notas de mención aparecían como "Desaprobado"
        
        SOLUCIÓN:
        - Verificamos primero si es una nota de mención (is_mention_score)
        - Las notas de mención usan sistema numérico base 20 (igual que secundary)
        """
        for record in self:
            # Las notas de mención siempre usan base 20 (igual que secundary)
            # porque el Técnico Medio usa el sistema de calificación numérica
            if record.is_mention_score or record.type in ['secundary', 'primary']:
                record.points_20 = record.score
            else:
                record.points_20 = 0.0
           
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
