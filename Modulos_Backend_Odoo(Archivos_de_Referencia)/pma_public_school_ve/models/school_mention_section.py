from odoo import _, api, fields, models
from odoo.exceptions import UserError


class SchoolMentionSection(models.Model):
    _name = 'school.mention.section'
    _description = 'Enrolled Mention per School Year'
    _order = 'year_id desc, mention_id'
    _rec_name = 'display_name'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    display_name = fields.Char(
        string='Nombre',
        compute='_compute_display_name',
        store=True
    )
    
    year_id = fields.Many2one(
        comodel_name='school.year',
        string='Año Escolar',
        required=True,
        ondelete='restrict',
        domain="[('state', '!=', 'finished')]",
        tracking=True
    )

    current = fields.Boolean(string='Actual', related='year_id.current', store=True)
    
    mention_id = fields.Many2one(
        comodel_name='school.mention',
        string='Mención',
        required=True,
        ondelete='restrict',
        domain="[('active', '=', True)]",
        tracking=True
    )
    
    active = fields.Boolean(
        string='Activo',
        default=True
    )
    
    lapso_inscripcion = fields.Selection(
        selection=[
            ('1', 'Primer Lapso'),
            ('2', 'Segundo Lapso'),
            ('3', 'Tercer Lapso')
        ],
        string='Lapso de Inscripción',
        readonly=True,
        help='Lapso en el que se inscribió la mención'
    )
    
    # Students enrolled in this mention for this year
    student_ids = fields.One2many(
        comodel_name='school.student',
        inverse_name='mention_section_id',
        string='Estudiantes Inscritos',
        readonly=True
    )
    
    student_count = fields.Integer(
        string='Número de Estudiantes',
        compute='_compute_student_count',
        store=False
    )
    
    # Subjects assigned to this mention (using school.subject with mention_section_id)
    subject_ids = fields.One2many(
        comodel_name='school.subject',
        inverse_name='mention_section_id',
        string='Materias'
    )
    
    subject_count = fields.Integer(
        string='Número de Materias',
        compute='_compute_subject_count',
        store=False
    )
    
    # Schedules for this mention (using school.schedule with mention_section_id)
    schedule_ids = fields.One2many(
        comodel_name='school.schedule',
        inverse_name='mention_section_id',
        string='Horarios'
    )
    
    # Evaluations for this mention
    evaluation_ids = fields.One2many(
        comodel_name='school.evaluation',
        inverse_name='mention_section_id',
        string='Evaluaciones'
    )
    
    # Performance JSON fields for graphs
    subjects_average_json = fields.Json(
        string='Promedios de Materias (JSON)',
        compute='_compute_subjects_average_json',
        store=True,
    )

    students_average_json = fields.Json(
        string='Promedios de Estudiantes (JSON)',
        compute='_compute_students_average_json',
        store=False,  # Always compute in real-time for dashboard
    )

    top_students_json = fields.Json(
        string='Top 5 Estudiantes (JSON)',
        compute='_compute_top_students_json',
        store=True,
    )
    
    @api.depends('subject_ids', 'student_ids', 'evaluation_ids', 
                 'evaluation_ids.evaluation_score_ids.points_20',
                 'evaluation_ids.evaluation_score_ids.state_score')
    def _compute_subjects_average_json(self):
        """Calcula los promedios de todas las materias de la mención"""
        for record in self:
            # Agrupar notas por materia
            subjects_data = {}
            
            for student in record.student_ids.filtered(
                lambda s: s.current and s.state == 'done' and s.mention_state == 'enrolled'
            ):
                # Obtener notas de las evaluaciones de esta mención para este estudiante
                scores = self.env['school.evaluation.score'].search([
                    ('student_id', '=', student.id),
                    ('mention_section_id', '=', record.id),
                    ('is_mention_score', '=', True)
                ])
                
                for score in scores:
                    if not score.subject_id or score.evaluation_id.invisible_score:
                        continue
                    
                    subject_id = score.subject_id.id
                    subject_name = score.subject_id.subject_id.name
                    
                    if subject_id not in subjects_data:
                        subjects_data[subject_id] = {
                            'subject_id': subject_id,
                            'subject_name': subject_name,
                            'scores': [],
                            'students_scores': {},
                            'students_states': {},
                        }
                    
                    student_id = student.student_id.id
                    score_value = score.points_20
                    
                    subjects_data[subject_id]['scores'].append(score_value)
                    
                    if student_id not in subjects_data[subject_id]['students_scores']:
                        subjects_data[subject_id]['students_scores'][student_id] = []
                        subjects_data[subject_id]['students_states'][student_id] = []
                    
                    subjects_data[subject_id]['students_scores'][student_id].append(score_value)
                    subjects_data[subject_id]['students_states'][student_id].append(score.state_score)
            
            # Calcular promedios por materia
            result = {
                'evaluation_type': '20',
                'subjects': [],
                'general_average': 0.0,
            }
            
            total_average = 0.0
            subject_count = 0
            
            for subject_data in subjects_data.values():
                if subject_data['scores']:
                    subject_average = sum(subject_data['scores']) / len(subject_data['scores'])
                    total_students = len(subject_data['students_scores'])
                    approved_students = sum(
                        1 for states in subject_data['students_states'].values() 
                        if 'approve' in states
                    )
                    
                    result['subjects'].append({
                        'subject_id': subject_data['subject_id'],
                        'subject_name': subject_data['subject_name'],
                        'average': round(subject_average, 2),
                        'total_students': total_students,
                        'approved_students': approved_students,
                        'failed_students': total_students - approved_students,
                    })
                    
                    total_average += subject_average
                    subject_count += 1
            
            if subject_count > 0:
                result['general_average'] = round(total_average / subject_count, 2)
            
            record.subjects_average_json = result

    @api.depends('student_ids', 'evaluation_ids',
                 'evaluation_ids.evaluation_score_ids.points_20',
                 'evaluation_ids.evaluation_score_ids.state_score')
    def _compute_students_average_json(self):
        """Calcula los promedios de estudiantes en la mención"""
        for record in self:
            students_data = []
            total_average = 0.0
            approved_count = 0
            failed_count = 0
            
            enrolled_students = record.student_ids.filtered(
                lambda s: s.current and s.state == 'done' and s.mention_state == 'enrolled'
            )
            
            for student in enrolled_students:
                # Obtener notas de las evaluaciones de esta mención
                scores = self.env['school.evaluation.score'].search([
                    ('student_id', '=', student.id),
                    ('mention_section_id', '=', record.id),
                    ('is_mention_score', '=', True)
                ])
                
                if scores:
                    # Calcular promedio del estudiante en la mención
                    score_values = [s.points_20 for s in scores if s.points_20 > 0]
                    if score_values:
                        avg = sum(score_values) / len(score_values)
                        state = 'approve' if avg >= 10 else 'failed'
                    else:
                        avg = 10  # Default passing grade
                        state = 'approve'
                else:
                    # No scores yet - assume approved with default grade
                    avg = 10
                    state = 'approve'
                
                students_data.append({
                    'student_id': student.student_id.id,
                    'student_name': student.student_id.name,
                    'average': round(avg, 2),
                    'state': state,
                })
                
                total_average += avg
                if state == 'approve':
                    approved_count += 1
                else:
                    failed_count += 1
            
            general_average = 0.0
            if students_data:
                general_average = round(total_average / len(students_data), 2)
            
            result = {
                'evaluation_type': '20',
                'section_type': 'secundary',
                'total_students': len(students_data),
                'approved_students': approved_count,
                'failed_students': failed_count,
                'general_average': general_average,
                'students': students_data,
            }
            
            record.students_average_json = result

    @api.depends('student_ids', 'evaluation_ids',
                 'evaluation_ids.evaluation_score_ids.points_20')
    def _compute_top_students_json(self):
        """Calcula los top 5 estudiantes con mejor promedio en la mención"""
        for record in self:
            students_data = []
            
            for student in record.student_ids.filtered(
                lambda s: s.current and s.state == 'done' and s.mention_state == 'enrolled'
            ):
                # Obtener notas de las evaluaciones de esta mención
                scores = self.env['school.evaluation.score'].search([
                    ('student_id', '=', student.id),
                    ('mention_section_id', '=', record.id),
                    ('is_mention_score', '=', True)
                ])
                
                if not scores:
                    continue
                
                # Calcular promedio del estudiante
                score_values = [s.points_20 for s in scores if s.points_20 > 0]
                if score_values:
                    avg = sum(score_values) / len(score_values)
                    
                    students_data.append({
                        'student_id': student.student_id.id,
                        'student_name': student.student_id.name,
                        'average': round(avg, 2),
                        'state': 'approve' if avg >= 10 else 'failed',
                        'use_literal': False,
                    })
            
            # Ordenar por promedio descendente y tomar top 5
            students_data.sort(key=lambda x: x['average'], reverse=True)
            top_5 = students_data[:5]
            
            result = {
                'evaluation_type': '20',
                'section_type': 'secundary',
                'top_students': top_5,
            }
            
            record.top_students_json = result
    
    _sql_constraints = [
        ('year_mention_unique', 'UNIQUE(year_id, mention_id)', 
         'Esta mención ya está inscrita en este año escolar.')
    ]
    
    @api.depends('year_id', 'mention_id')
    def _compute_display_name(self):
        for record in self:
            if record.year_id and record.mention_id:
                record.display_name = f"{record.mention_id.name} - {record.year_id.name}"
            else:
                record.display_name = "Nueva Mención Inscrita"
    
    @api.depends('student_ids')
    def _compute_student_count(self):
        for record in self:
            record.student_count = len(record.student_ids.filtered(
                lambda s: s.current and s.state == 'done'
            ))
    
    @api.depends('subject_ids')
    def _compute_subject_count(self):
        for record in self:
            record.subject_count = len(record.subject_ids)
    
    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if 'year_id' in vals:
                year = self.env['school.year'].browse(vals['year_id'])
                if year.state == 'finished':
                    raise UserError(
                        f"No se puede inscribir una mención en el año escolar '{year.name}' "
                        "porque está finalizado."
                    )
                # Set lapso_inscripcion from year's current_lapso
                if 'lapso_inscripcion' not in vals:
                    vals['lapso_inscripcion'] = year.current_lapso or '1'
        return super().create(vals_list)
    
    def write(self, vals):
        for record in self:
            if record.year_id.state == 'finished':
                raise UserError(
                    f"No se puede modificar la mención inscrita porque el año escolar "
                    f"'{record.year_id.name}' está finalizado."
                )
        return super().write(vals)
    
    def unlink(self):
        for record in self:
            if record.year_id.state == 'finished':
                raise UserError(
                    f"No se puede eliminar la mención inscrita porque el año escolar "
                    f"'{record.year_id.name}' está finalizado."
                )
            
            if record.student_ids:
                raise UserError(
                    f"No se puede eliminar la mención '{record.mention_id.name}' del año "
                    f"'{record.year_id.name}' porque tiene {len(record.student_ids)} "
                    "estudiante(s) inscrito(s)."
                )
            
            if record.subject_ids:
                raise UserError(
                    f"No se puede eliminar la mención '{record.mention_id.name}' del año "
                    f"'{record.year_id.name}' porque tiene {len(record.subject_ids)} "
                    "materia(s) asignada(s)."
                )
        
        return super().unlink()
