from odoo import fields, models, api, exceptions
import logging
from collections import Counter

class SchoolEvaluation(models.Model):
    _name = 'school.evaluation'
    _description = 'School Evaluation'

    def _default_year(self):
        year_id = self.env['school.year'].search([('current', '=', True)], limit=1)
        return year_id.id if year_id else False

    evaluation_date = fields.Date('Fecha de la evaluación')

    year_id = fields.Many2one(comodel_name='school.year', string='Año escolar', default=_default_year, required=True)

    current = fields.Boolean(string='Año actual', related='year_id.current', store=True)
    
    lapso = fields.Selection(
        selection=[
            ('1', 'Primer Lapso'),
            ('2', 'Segundo Lapso'),
            ('3', 'Tercer Lapso')
        ],
        string='Lapso',
        required=True,
        default=lambda self: self._default_lapso(),
        help='Lapso al que pertenece esta evaluación'
    )
    
    def _default_lapso(self):
        """Returns current lapso from active year"""
        year = self.env['school.year'].search([('current', '=', True)], limit=1)
        return year.current_lapso if year else '1'

    name = fields.Char(string='Nombre', required=True)

    description = fields.Html(string='Descripción', required=True)

    professor_id = fields.Many2one(comodel_name='school.professor', string='Profesor', required=True, domain="[('year_id', '=', year_id)]")

    # Evaluación puede ser para una sección regular O para una mención
    section_id = fields.Many2one(
        comodel_name='school.section', 
        string='Sección', 
        domain="[('id', 'in', available_section_ids)]",
        help='Sección regular para la evaluación'
    )
    
    mention_section_id = fields.Many2one(
        comodel_name='school.mention.section',
        string='Mención',
        domain="[('id', 'in', available_mention_section_ids)]",
        help='Mención técnica para la evaluación'
    )
    
    is_mention_evaluation = fields.Boolean(
        string='Es Evaluación de Mención',
        compute='_compute_is_mention_evaluation',
        store=True,
        help='Indica si esta evaluación es para una mención técnica'
    )
    
    @api.depends('mention_section_id')
    def _compute_is_mention_evaluation(self):
        for rec in self:
            rec.is_mention_evaluation = bool(rec.mention_section_id)
    
    @api.constrains('section_id', 'mention_section_id')
    def _check_section_or_mention(self):
        for rec in self:
            if not rec.section_id and not rec.mention_section_id:
                raise exceptions.ValidationError(
                    "Debe especificar una Sección o una Mención para la evaluación."
                )
            if rec.section_id and rec.mention_section_id:
                raise exceptions.ValidationError(
                    "La evaluación solo puede ser para una Sección o una Mención, no ambas."
                )

    type = fields.Selection(string='Tipo', selection=[
                                    ('secundary', 'Media general'), 
                                    ('primary', 'Primaria'), 
                                    ('pre', 'Preescolar')], compute='_compute_type', store=True)
    
    @api.depends('section_id', 'section_id.type', 'mention_section_id')
    def _compute_type(self):
        for rec in self:
            if rec.mention_section_id:
                # Menciones siempre son Media General (secundary)
                rec.type = 'secundary'
            elif rec.section_id:
                rec.type = rec.section_id.type
            else:
                rec.type = False

    available_section_ids = fields.Many2many(comodel_name='school.section', string='Secciones disponibles', compute="_compute_available_section_ids")

    @api.depends('professor_id', 'year_id')
    def _compute_available_section_ids(self):
        for rec in self:
            if rec.year_id and rec.professor_id:
                # Secciones donde el profesor está asignado directamente
                section_ids = self.env['school.section'].search([
                    ('professor_ids', 'in', [rec.professor_id.id]),
                    ('year_id', '=', rec.year_id.id)
                ]).ids
                
                # Secciones donde el profesor tiene materias asignadas (solo de sección, no mención)
                subject_sections = self.env['school.subject'].search([
                    ('professor_id', '=', rec.professor_id.id),
                    ('year_id', '=', rec.year_id.id),
                    ('section_id', '!=', False)
                ]).mapped('section_id.id')
                
                # Combinar y eliminar duplicados
                section_ids = list(set(section_ids + subject_sections))
            else:
                section_ids = []
            
            rec.available_section_ids = section_ids
    
    available_mention_section_ids = fields.Many2many(
        comodel_name='school.mention.section', 
        string='Menciones disponibles', 
        compute='_compute_available_mention_section_ids'
    )
    
    @api.depends('professor_id', 'year_id')
    def _compute_available_mention_section_ids(self):
        """Calcula las menciones donde el profesor tiene materias asignadas"""
        for rec in self:
            if rec.year_id and rec.professor_id:
                # Menciones donde el profesor tiene materias asignadas
                mention_sections = self.env['school.subject'].search([
                    ('professor_id', '=', rec.professor_id.id),
                    ('year_id', '=', rec.year_id.id),
                    ('mention_section_id', '!=', False)
                ]).mapped('mention_section_id')
                rec.available_mention_section_ids = mention_sections.ids
            else:
                rec.available_mention_section_ids = []

    subject_id = fields.Many2one(comodel_name='school.subject', string='Materia', domain="[('id','in', available_subject_ids)]")
    
    available_subject_ids = fields.Many2many(comodel_name='school.subject', string='Materias disponibles', compute="_compute_available_subject_ids")

    @api.depends('section_id', 'mention_section_id', 'professor_id', 'year_id')
    def _compute_available_subject_ids(self):
        for rec in self:
            if rec.year_id and rec.professor_id:
                if rec.section_id:
                    # Materias de la sección regular
                    rec.available_subject_ids = self.env['school.subject'].search([
                        ('professor_id', '=', rec.professor_id.id),
                        ('section_id', '=', rec.section_id.id),
                        ('year_id', '=', rec.year_id.id)
                    ]).ids
                elif rec.mention_section_id:
                    # Materias de la mención
                    rec.available_subject_ids = self.env['school.subject'].search([
                        ('professor_id', '=', rec.professor_id.id),
                        ('mention_section_id', '=', rec.mention_section_id.id),
                        ('year_id', '=', rec.year_id.id)
                    ]).ids
                else:
                    rec.available_subject_ids = []
            else:
                rec.available_subject_ids = []

    evaluation_score_ids = fields.One2many(comodel_name='school.evaluation.score', inverse_name='evaluation_id', string='Puntajes de evaluación')
        
    invisible_score = fields.Boolean(compute="_compute_invisible_calification")

    invisible_observation = fields.Boolean(compute="_compute_invisible_calification")

    invisible_literal = fields.Boolean(compute="_compute_invisible_calification")

    @api.depends('type', 'year_id.evalution_type_primary', 'is_mention_evaluation')
    def _compute_invisible_calification(self):
        for rec in self:
            invisible_score = True
            invisible_observation = True
            invisible_literal = True

            if rec.is_mention_evaluation or rec.type == 'secundary':
                # Menciones y secundaria usan notas numéricas
                invisible_score = False
            elif rec.type == 'primary':
                if rec.year_id.evalution_type_primary.type_evaluation == 'literal':
                    invisible_literal = False
                else:
                    invisible_score = False

            elif rec.type == 'pre':
                invisible_observation = False

            rec.invisible_score = invisible_score
            rec.invisible_observation = invisible_observation
            rec.invisible_literal = invisible_literal

    def create(self, vals):
        # Validar que el año escolar no esté finalizado
        for val in vals if isinstance(vals, list) else [vals]:
            if 'year_id' in val and val.get('year_id'):
                year = self.env['school.year'].browse(val['year_id'])
                if year.state == 'finished':
                    raise exceptions.UserError(
                        f"No se pueden crear evaluaciones en el año escolar '{year.name}' porque está finalizado."
                    )
        
        res = super().create(vals)
        for rec in res:
            # Crear líneas de calificación para estudiantes
            if rec.section_id:
                # Estudiantes de la sección regular
                students = rec.section_id.student_ids.filtered(
                    lambda s: s.current and s.state == 'done'
                )
            elif rec.mention_section_id:
                # Estudiantes inscritos en la mención
                students = rec.mention_section_id.student_ids.filtered(
                    lambda s: s.current and s.state == 'done' and s.mention_state == 'enrolled'
                )
            else:
                students = self.env['school.student']
            
            # if students:
            #     rec.evaluation_score_ids.create([{
            #         'evaluation_id': rec.id,
            #         'student_id': st.id
            #     } for st in students])
        return res


    state = fields.Selection(string='Estado', selection=[('all', 'Calificado'), ('partial', 'Parcial'), ('draft', 'No calificado')], compute="_compute_state")
    
    @api.depends('evaluation_score_ids', 'evaluation_score_ids.state')
    def _compute_state(self):
        for rec in self:
            states = rec.evaluation_score_ids.mapped('state')
            if states:
                rec.state = 'all' if all(state == 'qualified' for state in states) else \
                        'draft'   if all(state == 'draft' for state in states) else 'partial'
            else:
                rec.state = 'draft'
    
    @api.constrains('evaluation_score_ids')
    def _check_evaluation_score_ids(self):
        for rec in self:
            students = []
            for scores in rec.evaluation_score_ids:
                if rec.type == 'secundary':
                    # Solo validar base 20 para secundaria
                    if scores.score > 20:
                        raise exceptions.UserError("La nota debe ser igual o menor a 20")
                    elif scores.score < 0:
                        raise exceptions.UserError("La nota no puede tener valores negativos")

                elif rec.type == 'primary':
                    if rec.year_id.evalution_type_primary.type_evaluation == 'literal':
                        if not scores.literal_type:
                            raise exceptions.UserError("Debe tener un literal el estudiante")
                    else:
                        # Primaria con notas numéricas (base 20)
                        if scores.score > 20:
                            raise exceptions.UserError("La nota debe ser igual o menor a 20")
                        elif scores.score < 0:
                            raise exceptions.UserError("La nota no puede tener valores negativos")

                elif rec.type == 'pre':
                    if not scores.observation:
                            raise exceptions.UserError("Debe tener una observación el estudiante")
                            
                if scores.student_id in students:
                    raise exceptions.UserError(f"El {scores.student_id.name} está duplicado")

                students.append(scores.student_id)
    
    state_score = fields.Selection(string='Estado de nota', selection=[('approve', 'La mayoría aprobó'), ('failed', 'La mayoría desaprobó'),], compute="_compute_state_score", store=True)

    @api.depends('evaluation_score_ids', 'evaluation_score_ids.state_score')
    def _compute_state_score(self):
        for rec in self:
            minimun = int(len(rec.evaluation_score_ids) / 2)
            approved = len(rec.evaluation_score_ids.filtered(lambda x: x.state_score == 'approve'))
            rec.state_score = 'approve' if approved > minimun else 'failed'
    
    score_average = fields.Char(string='Promedio', compute="_compute_score_average", store=True)

    @api.depends('invisible_score', 'invisible_literal', 'invisible_observation', 'evaluation_score_ids', 'evaluation_score_ids.literal_type', 'evaluation_score_ids.points_20')
    def _compute_score_average(self):
        for rec in self:
            average = ' '
            if not rec.invisible_score:
                all_scores = rec.evaluation_score_ids.mapped('points_20')
                average = f"{sum(all_scores) / len(all_scores)} pts".replace('.', ',') if all_scores else '0 pts'
            
            elif not rec.invisible_literal:
                all_scores = Counter(rec.evaluation_score_ids.mapped('literal_type'))
                average = f"{all_scores.most_common(1)[0][0] if all_scores else ' '}"
            
            elif not rec.invisible_observation:
                average = "Aprobado"
            

            rec.score_average = average

    def unlink(self):
        """Prevent deletion of evaluations with evaluation scores or in finished years"""
        for record in self:
            # Check if year is finished
            if record.year_id and record.year_id.state == 'finished':
                raise exceptions.UserError(
                    f"No se puede eliminar la evaluación '{record.name}' porque el año escolar "
                    f"'{record.year_id.name}' está finalizado."
                )
            
            # Check for evaluation scores
            if record.evaluation_score_ids:
                raise exceptions.UserError(
                    f"No se puede eliminar la evaluación '{record.name}' porque tiene {len(record.evaluation_score_ids)} "
                    f"puntaje(s) registrado(s). Elimine primero todos los puntajes de esta evaluación."
                )
        
        return super().unlink()
