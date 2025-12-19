from odoo import _, api, fields, models
from odoo.exceptions import UserError



class SchoolSection(models.Model):
    _name = 'school.section'
    _description = 'School Section'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    def _default_year(self):
        year_id = self.env['school.year'].search([('current', '=', True)], limit=1)
        return year_id.id if year_id else False


    name = fields.Char(string='Nombre', compute='_compute_name')

    @api.depends('section_id', 'year_id')
    def _compute_name(self):
        for record in self:
            # Use display_name which includes the letter (e.g., "1er Grado A")
            record.name = record.section_id.display_name if record.section_id else ''

    year_id = fields.Many2one(comodel_name='school.year', string='Año Escolar', default=_default_year, required=True, tracking=True)

    section_id = fields.Many2one(comodel_name='school.register.section', string='Sección', domain="[('id', 'not in', used_section_ids)]", tracking=True)

    used_section_ids = fields.Many2many(comodel_name='school.register.section', string='Secciones utilizadas', compute='_compute_used_section_ids')

    @api.depends('year_id')
    def _compute_used_section_ids(self):
        for record in self:
            used = []
            record.used_section_ids = used
            if record.year_id:
                used = self.env['school.section'].search([('year_id', '=', record.year_id.id)])
                record.used_section_ids = used.ids if used else []
    
    type = fields.Selection(string='Tipo', selection=[
                                    ('secundary', 'Media general'), 
                                    ('primary', 'Primaria'), 
                                    ('pre', 'Preescolar')], related='section_id.type', store=True)

    professor_ids = fields.Many2many('school.professor', 'school_section_professor_rel', 'section_id', 'professor_id', domain="[('year_id', '=', year_id)]", string='Profesores')

    subject_ids = fields.One2many(comodel_name='school.subject', inverse_name='section_id', string='Materias')

    student_ids = fields.One2many(comodel_name='school.student', inverse_name='section_id', string='Estudiantes', readonly=True)

    current = fields.Boolean(string='Actual', related='year_id.current', store=True)
    
    lapso_inscripcion = fields.Selection(
        selection=[
            ('1', 'Primer Lapso'),
            ('2', 'Segundo Lapso'),
            ('3', 'Tercer Lapso')
        ],
        string='Lapso de Inscripción',
        readonly=True,
        help='Lapso en el que se inscribió la sección'
    )

    # Campos JSON para gráficos de rendimiento
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

    @api.depends('subject_ids', 'student_ids', 'student_ids.evaluation_score_ids', 
                 'student_ids.evaluation_score_ids.points_20', 
                 'student_ids.evaluation_score_ids.state_score',
                 'type', 'year_id')
    def _compute_subjects_average_json(self):
        """Calcula los promedios de todas las materias para media general"""
        for record in self:
            if record.type != 'secundary':
                record.subjects_average_json = {}
                continue

            # Obtener el tipo de evaluación configurado
            evaluation_type = record.year_id.evalution_type_secundary.type_evaluation if record.year_id.evalution_type_secundary else '20'
            
            # Agrupar notas por materia
            subjects_data = {}
            
            for student in record.student_ids.filtered(lambda s: s.current and s.state == 'done'):
                for score in student.evaluation_score_ids:
                    if not score.subject_id or score.evaluation_id.invisible_score:
                        continue
                    
                    subject_id = score.subject_id.id
                    subject_name = score.subject_id.subject_id.name
                    
                    if subject_id not in subjects_data:
                        subjects_data[subject_id] = {
                            'subject_id': subject_id,
                            'subject_name': subject_name,
                            'scores': [],
                            'students_scores': {},  # {student_id: [scores]}
                            'students_states': {},  # {student_id: [states]}
                        }
                    
                    student_id = student.student_id.id
                    
                    # Agregar el puntaje (siempre base 20)
                    score_value = score.points_20
                    
                    subjects_data[subject_id]['scores'].append(score_value)
                    
                    # Agrupar por estudiante
                    if student_id not in subjects_data[subject_id]['students_scores']:
                        subjects_data[subject_id]['students_scores'][student_id] = []
                        subjects_data[subject_id]['students_states'][student_id] = []
                    
                    subjects_data[subject_id]['students_scores'][student_id].append(score_value)
                    subjects_data[subject_id]['students_states'][student_id].append(score.state_score)
            
            # Calcular promedios por materia
            result = {
                'evaluation_type': evaluation_type,
                'subjects': [],
                'general_average': 0.0,
            }
            
            total_average = 0.0
            subject_count = 0
            
            for subject_data in subjects_data.values():
                if subject_data['scores']:
                    # Calcular promedio de la materia
                    subject_average = sum(subject_data['scores']) / len(subject_data['scores'])
                    
                    # Contar estudiantes únicos y aprobados/reprobados
                    total_students = len(subject_data['students_scores'])
                    approved_students = 0
                    failed_students = 0
                    
                    for student_id, states in subject_data['students_states'].items():
                        # Un estudiante aprueba si tiene al menos una evaluación aprobada
                        if 'approve' in states:
                            approved_students += 1
                        else:
                            failed_students += 1
                    
                    result['subjects'].append({
                        'subject_id': subject_data['subject_id'],
                        'subject_name': subject_data['subject_name'],
                        'average': round(subject_average, 2),
                        'total_students': total_students,
                        'approved_students': approved_students,
                        'failed_students': failed_students,
                    })
                    
                    total_average += subject_average
                    subject_count += 1
            
            # Calcular promedio general
            if subject_count > 0:
                result['general_average'] = round(total_average / subject_count, 2)
            
            record.subjects_average_json = result

    @api.depends('student_ids', 'student_ids.general_performance_json', 
                 'student_ids.evaluation_score_ids', 'type', 'year_id')
    def _compute_students_average_json(self):
        """Calcula los promedios de estudiantes en general (media general y primaria)"""
        for record in self:
            if record.type not in ['secundary', 'primary']:
                record.students_average_json = {}
                continue

            # Obtener el tipo de evaluación configurado
            if record.type == 'secundary':
                evaluation_config = record.year_id.evalution_type_secundary
            else:  # primary
                evaluation_config = record.year_id.evalution_type_primary
            
            evaluation_type = evaluation_config.type_evaluation if evaluation_config else '20'
            
            students_data = []
            total_average = 0.0
            approved_count = 0
            failed_count = 0
            
            active_students = record.student_ids.filtered(lambda s: s.current and s.state == 'done')
            
            for student in active_students:
                perf_data = student.general_performance_json
                
                # For Primaria: If no performance data, assume approved (observation-based)
                if record.type == 'primary':
                    if not perf_data or perf_data.get('total_subjects', 0) == 0:
                        # Primaria without grades - assume approved with 'A' equivalent
                        students_data.append({
                            'student_id': student.student_id.id,
                            'student_name': student.student_id.name,
                            'average': 18,  # A equivalent
                            'state': 'approve',
                        })
                        total_average += 18
                        approved_count += 1
                        continue
                    
                    # Has performance data
                    if perf_data.get('use_literal'):
                        literal = perf_data.get('literal_average', 'A')
                        literal_weights = {'A': 18, 'B': 15, 'C': 12, 'D': 8, 'E': 4}
                        avg = literal_weights.get(literal, 18)
                    else:
                        avg = perf_data.get('general_average', 18)
                    
                    students_data.append({
                        'student_id': student.student_id.id,
                        'student_name': student.student_id.name,
                        'average': avg,
                        'state': perf_data.get('general_state', 'approve'),
                    })
                    total_average += avg
                    if perf_data.get('general_state', 'approve') == 'approve':
                        approved_count += 1
                    else:
                        failed_count += 1
                else:
                    # Media General - require performance data
                    if not perf_data or perf_data.get('total_subjects', 0) == 0:
                        continue
                    
                    if perf_data.get('use_literal'):
                        literal = perf_data.get('literal_average', 'E')
                        literal_weights = {'A': 18, 'B': 15, 'C': 12, 'D': 8, 'E': 4}
                        avg = literal_weights.get(literal, 0)
                    else:
                        avg = perf_data.get('general_average', 0)
                    
                    students_data.append({
                        'student_id': student.student_id.id,
                        'student_name': student.student_id.name,
                        'average': avg,
                        'state': perf_data.get('general_state', 'failed'),
                    })
                    
                    total_average += avg
                    if perf_data.get('general_state') == 'approve':
                        approved_count += 1
                    else:
                        failed_count += 1
            
            # Calcular promedio general de la sección
            general_average = 0.0
            if students_data:
                general_average = round(total_average / len(students_data), 2)
            
            result = {
                'evaluation_type': evaluation_type,
                'section_type': record.type,
                'total_students': len(students_data),
                'approved_students': approved_count,
                'failed_students': failed_count,
                'general_average': general_average,
                'students': students_data,
            }
            
            record.students_average_json = result

    @api.depends('student_ids', 'student_ids.general_performance_json', 
                 'student_ids.evaluation_score_ids', 'type', 'year_id')
    def _compute_top_students_json(self):
        """Calcula los top 5 estudiantes con mejor promedio"""
        for record in self:
            if record.type not in ['secundary', 'primary']:
                record.top_students_json = {}
                continue

            # Obtener el tipo de evaluación configurado
            if record.type == 'secundary':
                evaluation_config = record.year_id.evalution_type_secundary
            else:  # primary
                evaluation_config = record.year_id.evalution_type_primary
            
            evaluation_type = evaluation_config.type_evaluation if evaluation_config else '20'
            
            students_data = []
            
            for student in record.student_ids.filtered(lambda s: s.current and s.state == 'done'):
                perf_data = student.general_performance_json
                if not perf_data or perf_data.get('total_subjects', 0) == 0:
                    continue
                
                if perf_data.get('use_literal'):
                    # Para literales, convertir a numérico aproximado
                    literal = perf_data.get('literal_average', 'E')
                    literal_weights = {'A': 18, 'B': 15, 'C': 12, 'D': 8, 'E': 4}
                    avg = literal_weights.get(literal, 0)
                else:
                    avg = perf_data.get('general_average', 0)
                
                students_data.append({
                    'student_id': student.student_id.id,
                    'student_name': student.student_id.name,
                    'average': avg,
                    'literal_average': perf_data.get('literal_average'),
                    'state': perf_data.get('general_state', 'failed'),
                    'use_literal': perf_data.get('use_literal', False),
                })
            
            # Ordenar por promedio descendente y tomar top 5
            students_data.sort(key=lambda x: x['average'], reverse=True)
            top_5 = students_data[:5]
            
            result = {
                'evaluation_type': evaluation_type,
                'section_type': record.type,
                'top_students': top_5,
            }
            
            record.top_students_json = result
    
    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if 'year_id' in vals and 'lapso_inscripcion' not in vals:
                year = self.env['school.year'].browse(vals['year_id'])
                vals['lapso_inscripcion'] = year.current_lapso or '1'
        return super().create(vals_list)
    
    def unlink(self):
        """Prevent deletion of enrolled sections with related records or in finished years"""
        for record in self:
            # Check if year is finished
            if record.year_id and record.year_id.state == 'finished':
                raise UserError(
                    f"No se puede eliminar la sección '{record.name}' porque el año escolar "
                    f"'{record.year_id.name}' está finalizado."
                )
            
            # Check for related students
            if record.student_ids:
                raise UserError(
                    f"No se puede eliminar la sección inscrita '{record.name}' porque tiene {len(record.student_ids)} "
                    f"estudiante(s) inscrito(s). Elimine primero los estudiantes."
                )
            
            # Check for related subjects
            if record.subject_ids:
                raise UserError(
                    f"No se puede eliminar la sección inscrita '{record.name}' porque tiene {len(record.subject_ids)} "
                    f"materia(s) asignada(s). Elimine primero las materias asignadas."
                )
            
            # Check for related evaluations
            evaluations = self.env['school.evaluation'].search([('section_id', '=', record.id)])
            if evaluations:
                raise UserError(
                    f"No se puede eliminar la sección inscrita '{record.name}' porque tiene {len(evaluations)} "
                    f"evaluación(ones) registrada(s). Elimine primero las evaluaciones."
                )
        
        return super().unlink()