from odoo import _, api, fields, models
from odoo.exceptions import UserError

class SchoolYear(models.Model):
    _name = 'school.year'
    _description = 'School Year'

    name = fields.Char(string='Nombre', required=True)

    current = fields.Boolean(string='Año actual')
    
    state = fields.Selection(
        string='Estado',
        selection=[
            ('draft', 'Borrador'),
            ('active', 'En Curso'),
            ('finished', 'Finalizado')
        ],
        default='draft',
        readonly=True,
        help='Estado del año escolar: Borrador (no iniciado), En Curso (activo), Finalizado (cerrado)'
    )
    
    start_date_real = fields.Date(
        string='Fecha de Inicio Real',
        readonly=True,
        help='Fecha en que se inició oficialmente el año escolar'
    )
    
    end_date_real = fields.Date(
        string='Fecha de Finalización Real',
        readonly=True,
        help='Fecha en que se finalizó oficialmente el año escolar'
    )
    
    is_locked = fields.Boolean(
        string='Bloqueado',
        compute='_compute_is_locked',
        store=False,
        help='Indica si el año escolar está bloqueado (finalizado)'
    )
    
    @api.depends('state')
    def _compute_is_locked(self):
        for record in self:
            record.is_locked = record.state == 'finished'


    @api.model_create_multi
    def create(self, vals):
        if not isinstance(vals, dict):
            for val in vals:
                val['current'] = True
        else:
            vals['current'] = True

        self.search([('current', '=', True)]).write({'current': False})
        
        return super(SchoolYear, self).create(vals)

    section_ids = fields.One2many(comodel_name='school.section', inverse_name='year_id', string='Secciones', readonly=True)

    student_ids = fields.One2many(comodel_name='school.student', inverse_name='year_id', string='Estudiantes', readonly=True)

    evalution_type_secundary = fields.Many2one(comodel_name='school.evaluation.type', string='Mecanismo de evalución Media general', domain="[('type','=','secundary')]", required=True)

    evalution_type_primary = fields.Many2one(comodel_name='school.evaluation.type', string='Mecanismo de evalución Primaria', domain="[('type','=','primary')]", required=True)

    evalution_type_pree = fields.Many2one(comodel_name='school.evaluation.type', string='Mecanismo de evalución Preescolar', domain="[('type','=','pre')]", required=True, defaul=lambda x: x.env.ref('pma_public_school_ve.pre_observation'))

    def write(self, vals):
        if isinstance(vals, dict):
            if 'evalution_type_secundary' in vals or 'evalution_type_secundary' in vals or 'evalution_type_secundary' in vals:
                if self.env['school.evaluation'].search([('year_id', '=', self.id)]):
                    raise UserError("No se puede modificar el mecanismo de evaluación cuando ya se crearon evaluciones relacionadas a este año escolar.")
        return super().write(vals)
    
    def unlink(self):
        """Prevent deletion of school years with related records"""
        for record in self:
            # Check for related sections
            if record.section_ids:
                raise UserError(
                    f"No se puede eliminar el año escolar '{record.name}' porque tiene {len(record.section_ids)} "
                    f"sección(es) inscrita(s). Elimine primero las secciones inscritas."
                )
            
            # Check for related students
            if record.student_ids:
                raise UserError(
                    f"No se puede eliminar el año escolar '{record.name}' porque tiene {len(record.student_ids)} "
                    f"estudiante(s) inscrito(s). Elimine primero los estudiantes."
                )
            
            # Check for related professors
            professors = self.env['school.professor'].search([('year_id', '=', record.id)])
            if professors:
                raise UserError(
                    f"No se puede eliminar el año escolar '{record.name}' porque tiene {len(professors)} "
                    f"profesor(es) asignado(s). Elimine primero los profesores."
                )
            
            # Check for related evaluations
            evaluations = self.env['school.evaluation'].search([('year_id', '=', record.id)])
            if evaluations:
                raise UserError(
                    f"No se puede eliminar el año escolar '{record.name}' porque tiene {len(evaluations)} "
                    f"evaluación(ones) registrada(s). Elimine primero las evaluaciones."
                )
        
        return super().unlink()
    
    def action_start_year(self):
        """Inicia el año escolar"""
        self.ensure_one()
        
        if self.state != 'draft':
            raise UserError("Solo se pueden iniciar años escolares en estado borrador.")
        
        # Verificar que no haya otro año activo
        active_years = self.search([('state', '=', 'active'), ('id', '!=', self.id)])
        if active_years:
            raise UserError(
                f"Ya existe un año escolar activo: '{active_years[0].name}'. "
                f"Finalice ese año antes de iniciar uno nuevo."
            )
        
        self.write({
            'state': 'active',
            'current': True,
            'start_date_real': fields.Date.today(),
        })
        
        # Marcar otros años como no actuales
        self.search([('id', '!=', self.id), ('current', '=', True)]).write({'current': False})
        
        return True
    
    def action_finish_year(self):
        """Finaliza el año escolar y bloquea todos los registros"""
        self.ensure_one()
        
        if self.state != 'active':
            raise UserError("Solo se pueden finalizar años escolares que estén en curso.")
        
        self.write({
            'state': 'finished',
            'current': False,
            'end_date_real': fields.Date.today(),
        })
        
        return True
    
    def _check_year_not_finished(self):
        """Método auxiliar para validar que el año no esté finalizado"""
        if self.state == 'finished':
            raise UserError(
                f"El año escolar '{self.name}' está finalizado. "
                f"No se pueden crear, modificar o eliminar registros."
            )
    
    total_students_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    approved_students_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    total_sections_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    total_professors_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    
    students_pre_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    students_primary_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    students_secundary_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    students_tecnico_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    
    approved_pre_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    approved_primary_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    approved_secundary_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    approved_tecnico_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    
    sections_pre_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    sections_primary_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    sections_secundary_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    
    # ===== CAMPOS M2M COMPUTADOS PARA ESTUDIANTES POR TIPO =====
    students_pre_ids = fields.Many2many(
        'school.student', compute='_compute_students_by_type', store=False,
        string='Estudiantes Preescolar'
    )
    students_primary_ids = fields.Many2many(
        'school.student', compute='_compute_students_by_type', store=False,
        string='Estudiantes Primaria'
    )
    students_secundary_general_ids = fields.Many2many(
        'school.student', compute='_compute_students_by_type', store=False,
        string='Estudiantes Media General'
    )
    students_secundary_tecnico_ids = fields.Many2many(
        'school.student', compute='_compute_students_by_type', store=False,
        string='Estudiantes Técnico Medio'
    )
    
    # ===== CAMPOS JSON PARA WIDGETS =====
    performance_by_level_json = fields.Json(compute='_compute_performance_by_level_json', store=False)
    students_distribution_json = fields.Json(compute='_compute_students_distribution_json', store=False)
    approval_rate_json = fields.Json(compute='_compute_approval_rate_json', store=False)
    sections_comparison_json = fields.Json(compute='_compute_sections_comparison_json', store=False)
    top_students_year_json = fields.Json(compute='_compute_top_students_year_json', store=False)
    professor_summary_json = fields.Json(compute='_compute_professor_summary_json', store=False)
    difficult_subjects_json = fields.Json(compute='_compute_difficult_subjects_json', store=False)
    evaluations_stats_json = fields.Json(compute='_compute_evaluations_stats_json', store=False)
    recent_evaluations_json = fields.Json(compute='_compute_recent_evaluations_json', store=False)
    
    # Performance JSON por nivel específico
    secundary_performance_json = fields.Json(compute='_compute_level_performance_json', store=False)
    primary_performance_json = fields.Json(compute='_compute_level_performance_json', store=False)
    pre_performance_json = fields.Json(compute='_compute_level_performance_json', store=False)
    
    # ===== NUEVOS CAMPOS JSON PARA DASHBOARD REFACTORIZADO =====
    # Dashboard JSON por nivel (incluye rendimiento, top estudiantes por sección, aprobación)
    pre_dashboard_json = fields.Json(compute='_compute_level_dashboard_json', store=False)
    primary_dashboard_json = fields.Json(compute='_compute_level_dashboard_json', store=False)
    secundary_general_dashboard_json = fields.Json(compute='_compute_level_dashboard_json', store=False)
    secundary_tecnico_dashboard_json = fields.Json(compute='_compute_level_dashboard_json', store=False)
    
    # Estadísticas de profesores detalladas por tipo de estudiante
    professor_detailed_stats_json = fields.Json(compute='_compute_professor_detailed_stats_json', store=False)
    
    @api.depends('student_ids', 'student_ids.type', 'student_ids.state', 'student_ids.current',
                 'student_ids.mention_id', 'student_ids.mention_state')
    def _compute_students_by_type(self):
        """Compute M2M fields for students grouped by type"""
        for year in self:
            active_students = year.student_ids.filtered(lambda s: s.current and s.state == 'done')
            
            year.students_pre_ids = active_students.filtered(lambda s: s.type == 'pre')
            year.students_primary_ids = active_students.filtered(lambda s: s.type == 'primary')
            
            # Media General: secundary sin mención inscrita
            year.students_secundary_general_ids = active_students.filtered(
                lambda s: s.type == 'secundary' and s.mention_state != 'enrolled'
            )
            
            # Técnico Medio: secundary con mención inscrita
            year.students_secundary_tecnico_ids = active_students.filtered(
                lambda s: s.type == 'secundary' and s.mention_state == 'enrolled'
            )
    
    @api.depends('student_ids', 'student_ids.state', 'student_ids.current', 'section_ids',
                 'student_ids.mention_state')
    def _compute_dashboard_counts(self):
        for year in self:
            active_students = year.student_ids.filtered(lambda s: s.current and s.state == 'done')
            
            year.total_students_count = len(active_students)
            year.total_sections_count = len(year.section_ids)
            year.total_professors_count = self.env['school.professor'].search_count([('year_id', '=', year.id)])
            
            # Helper function to safely get performance state
            def is_approved(student):
                perf = student.general_performance_json
                if isinstance(perf, dict):
                    return perf.get('general_state') == 'approve'
                return False
            
            # Aprobados total
            year.approved_students_count = sum(1 for s in active_students if is_approved(s))
            
            # Por nivel - estudiantes
            pre_students = active_students.filtered(lambda s: s.type == 'pre')
            primary_students = active_students.filtered(lambda s: s.type == 'primary')
            # Media General sin mención inscrita
            secundary_general = active_students.filtered(
                lambda s: s.type == 'secundary' and s.mention_state != 'enrolled'
            )
            # Técnico Medio con mención inscrita
            secundary_tecnico = active_students.filtered(
                lambda s: s.type == 'secundary' and s.mention_state == 'enrolled'
            )
            
            year.students_pre_count = len(pre_students)
            year.students_primary_count = len(primary_students)
            year.students_secundary_count = len(secundary_general)
            year.students_tecnico_count = len(secundary_tecnico)
            
            # Aprobados por nivel
            year.approved_pre_count = sum(1 for s in pre_students if is_approved(s))
            year.approved_primary_count = sum(1 for s in primary_students if is_approved(s))
            year.approved_secundary_count = sum(1 for s in secundary_general if is_approved(s))
            year.approved_tecnico_count = sum(1 for s in secundary_tecnico if is_approved(s))
            
            # Secciones por nivel
            year.sections_pre_count = len(year.section_ids.filtered(lambda s: s.type == 'pre'))
            year.sections_primary_count = len(year.section_ids.filtered(lambda s: s.type == 'primary'))
            year.sections_secundary_count = len(year.section_ids.filtered(lambda s: s.type == 'secundary'))
    
    # Copia aquí TODOS los métodos _compute que te di en la primera respuesta:
    # - _compute_performance_by_level_json
    # - _compute_students_distribution_json
    # - _compute_approval_rate_json
    # - _compute_sections_comparison_json
    # - _compute_top_students_year_json
    # - _compute_professor_summary_json
    # - _compute_difficult_subjects_json
    # - _compute_evaluations_stats_json
    # - _compute_recent_evaluations_json

    @api.depends('student_ids', 'student_ids.general_performance_json',
                 'section_ids')
    def _compute_performance_by_level_json(self):
        """Calcula el rendimiento promedio por nivel educativo"""
        
        def safe_get_perf(student):
            """Safely get performance dict"""
            perf = student.general_performance_json
            return perf if isinstance(perf, dict) else {}
        
        for record in self:
            result = {
                'levels': []
            }
            
            for level_type, level_name in [('pre', 'Preescolar'), 
                                           ('primary', 'Primaria'), 
                                           ('secundary', 'Media General')]:
                students = record.student_ids.filtered(
                    lambda s: s.current and s.state == 'done' and s.type == level_type
                )
                
                if not students:
                    continue
                
                total_students = len(students)
                approved = sum(1 for s in students 
                              if safe_get_perf(s).get('general_state') == 'approve')
                
                # Calcular promedio general del nivel
                total_avg = 0
                count_with_avg = 0
                
                for student in students:
                    perf = safe_get_perf(student)
                    if perf.get('general_average'):
                        total_avg += perf.get('general_average', 0)
                        count_with_avg += 1
                
                avg = round(total_avg / count_with_avg, 2) if count_with_avg > 0 else 0
                approval_rate = round((approved / total_students * 100), 2) if total_students > 0 else 0
                
                result['levels'].append({
                    'type': level_type,
                    'name': level_name,
                    'total_students': total_students,
                    'approved_students': approved,
                    'failed_students': total_students - approved,
                    'average': avg,
                    'approval_rate': approval_rate
                })
            
            record.performance_by_level_json = result
    
    @api.depends('student_ids', 'student_ids.type', 'student_ids.state')
    def _compute_students_distribution_json(self):
        """Distribución de estudiantes por nivel (gráfico de torta)"""
        for record in self:
            active_students = record.student_ids.filtered(
                lambda s: s.current and s.state == 'done'
            )
            
            pre_count = len(active_students.filtered(lambda s: s.type == 'pre'))
            primary_count = len(active_students.filtered(lambda s: s.type == 'primary'))
            secundary_count = len(active_students.filtered(lambda s: s.type == 'secundary'))
            
            record.students_distribution_json = {
                'labels': ['Preescolar', 'Primaria', 'Media General'],
                'data': [pre_count, primary_count, secundary_count],
                'total': len(active_students)
            }
    
    @api.depends('student_ids', 'student_ids.general_performance_json')
    def _compute_approval_rate_json(self):
        """Tasa de aprobación general del año"""
        
        def safe_get_state(student):
            perf = student.general_performance_json
            if isinstance(perf, dict):
                return perf.get('general_state')
            return 'failed'
        
        for record in self:
            active_students = record.student_ids.filtered(
                lambda s: s.current and s.state == 'done'
            )
            
            if not active_students:
                record.approval_rate_json = {
                    'total': 0,
                    'approved': 0,
                    'failed': 0,
                    'rate': 0
                }
                continue
            
            approved = sum(1 for s in active_students if safe_get_state(s) == 'approve')
            failed = len(active_students) - approved
            rate = round((approved / len(active_students) * 100), 2)
            
            record.approval_rate_json = {
                'total': len(active_students),
                'approved': approved,
                'failed': failed,
                'rate': rate
            }
    
    @api.depends('section_ids', 'section_ids.students_average_json')
    def _compute_sections_comparison_json(self):
        """Comparación de rendimiento entre secciones"""
        for record in self:
            result = {
                'sections': []
            }
            
            for section in record.section_ids:
                if section.type not in ['secundary', 'primary']:
                    continue
                
                stats = section.students_average_json
                if not stats or stats.get('total_students', 0) == 0:
                    continue
                
                result['sections'].append({
                    'section_id': section.id,
                    'section_name': section.section_id.name,
                    'type': section.type,
                    'average': stats.get('general_average', 0),
                    'total_students': stats.get('total_students', 0),
                    'approved_students': stats.get('approved_students', 0),
                    'failed_students': stats.get('failed_students', 0),
                    'approval_rate': round((stats.get('approved_students', 0) / 
                                           stats.get('total_students', 1) * 100), 2)
                })
            
            # Ordenar por promedio descendente
            result['sections'].sort(key=lambda x: x['average'], reverse=True)
            record.sections_comparison_json = result
    
    @api.depends('student_ids', 'student_ids.general_performance_json')
    def _compute_top_students_year_json(self):
        """Top 10 mejores estudiantes del año"""
        for record in self:
            active_students = record.student_ids.filtered(
                lambda s: s.current and s.state == 'done'
            )
            
            students_data = []
            for student in active_students:
                perf = student.general_performance_json
                # Handle False or non-dict values
                if not isinstance(perf, dict) or perf.get('total_subjects', 0) == 0:
                    continue
                
                if perf.get('use_literal'):
                    literal = perf.get('literal_average', 'E')
                    literal_weights = {'A': 18, 'B': 15, 'C': 12, 'D': 8, 'E': 4}
                    avg = literal_weights.get(literal, 0)
                else:
                    avg = perf.get('general_average', 0)
                
                students_data.append({
                    'student_id': student.student_id.id,
                    'student_name': student.student_id.name,
                    'section': student.section_id.section_id.name if student.section_id.section_id else '',
                    'average': avg,
                    'literal_average': perf.get('literal_average'),
                    'state': perf.get('general_state', 'failed'),
                    'use_literal': perf.get('use_literal', False)
                })
            
            # Ordenar y tomar top 10
            students_data.sort(key=lambda x: x['average'], reverse=True)
            top_10 = students_data[:10]
            
            record.top_students_year_json = {
                'top_students': top_10
            }
    
    @api.depends('section_ids.professor_ids', 'section_ids.subject_ids')
    def _compute_professor_summary_json(self):
        """Resumen de profesores y su carga académica"""
        for record in self:
            professors = self.env['school.professor'].search([
                ('year_id', '=', record.id)
            ])
            
            professors_data = []
            for prof in professors:
                # Contar secciones asignadas
                sections_count = len(prof.section_ids)
                
                # Contar materias asignadas
                subjects = self.env['school.subject'].search([
                    ('professor_id', '=', prof.id),
                    ('year_id', '=', record.id)
                ])
                subjects_count = len(subjects)
                
                # Contar evaluaciones creadas
                evaluations = self.env['school.evaluation'].search([
                    ('professor_id', '=', prof.id),
                    ('year_id', '=', record.id)
                ])
                evaluations_count = len(evaluations)
                
                professors_data.append({
                    'professor_id': prof.professor_id.id,
                    'professor_name': prof.professor_id.name,
                    'sections_count': sections_count,
                    'subjects_count': subjects_count,
                    'evaluations_count': evaluations_count
                })
            
            record.professor_summary_json = {
                'professors': professors_data,
                'total': len(professors_data)
            }
    
    @api.depends('section_ids', 'section_ids.subjects_average_json')
    def _compute_difficult_subjects_json(self):
        """Materias con mayor índice de reprobación"""
        for record in self:
            subjects_stats = {}
            
            for section in record.section_ids:
                if section.type != 'secundary':
                    continue
                
                stats = section.subjects_average_json
                if not stats or not stats.get('subjects'):
                    continue
                
                for subject in stats['subjects']:
                    subject_id = subject['subject_id']
                    subject_name = subject['subject_name']
                    
                    if subject_id not in subjects_stats:
                        subjects_stats[subject_id] = {
                            'subject_name': subject_name,
                            'total_students': 0,
                            'failed_students': 0,
                            'approved_students': 0,
                            'total_average': 0,
                            'count': 0
                        }
                    
                    subjects_stats[subject_id]['total_students'] += subject['total_students']
                    subjects_stats[subject_id]['failed_students'] += subject['failed_students']
                    subjects_stats[subject_id]['approved_students'] += subject['approved_students']
                    subjects_stats[subject_id]['total_average'] += subject['average']
                    subjects_stats[subject_id]['count'] += 1
            
            # Calcular tasas de reprobación y ordenar
            difficult_subjects = []
            for subject_id, stats in subjects_stats.items():
                if stats['total_students'] > 0:
                    failure_rate = round((stats['failed_students'] / 
                                        stats['total_students'] * 100), 2)
                    avg = round(stats['total_average'] / stats['count'], 2)
                    
                    difficult_subjects.append({
                        'subject_id': subject_id,
                        'subject_name': stats['subject_name'],
                        'total_students': stats['total_students'],
                        'failed_students': stats['failed_students'],
                        'failure_rate': failure_rate,
                        'average': avg
                    })
            
            # Ordenar por tasa de reprobación descendente
            difficult_subjects.sort(key=lambda x: x['failure_rate'], reverse=True)
            
            record.difficult_subjects_json = {
                'subjects': difficult_subjects[:10]  # Top 10
            }
    
    @api.depends('section_ids')
    def _compute_evaluations_stats_json(self):
        """Estadísticas generales de evaluaciones"""
        for record in self:
            evaluations = self.env['school.evaluation'].search([
                ('year_id', '=', record.id)
            ])
            
            total = len(evaluations)
            qualified = len(evaluations.filtered(lambda e: e.state == 'all'))
            partial = len(evaluations.filtered(lambda e: e.state == 'partial'))
            draft = len(evaluations.filtered(lambda e: e.state == 'draft'))
            
            # Por tipo
            secundary = len(evaluations.filtered(lambda e: e.type == 'secundary'))
            primary = len(evaluations.filtered(lambda e: e.type == 'primary'))
            pre = len(evaluations.filtered(lambda e: e.type == 'pre'))
            
            record.evaluations_stats_json = {
                'total': total,
                'qualified': qualified,
                'partial': partial,
                'draft': draft,
                'by_type': {
                    'secundary': secundary,
                    'primary': primary,
                    'pre': pre
                }
            }
    
    @api.depends('section_ids')
    def _compute_recent_evaluations_json(self):
        """Evaluaciones recientes (últimas 20)"""
        for record in self:
            evaluations = self.env['school.evaluation'].search([
                ('year_id', '=', record.id)
            ], order='evaluation_date desc', limit=20)
            
            evals_data = []
            for ev in evaluations:
                evals_data.append({
                    'id': ev.id,
                    'name': ev.name,
                    'date': ev.evaluation_date.strftime('%Y-%m-%d') if ev.evaluation_date else '',
                    'professor': ev.professor_id.professor_id.name,
                    'section': ev.section_id.section_id.name,
                    'subject': ev.subject_id.subject_id.name if ev.subject_id else 'N/A',
                    'state': ev.state,
                    'average': ev.score_average
                })
            
            record.recent_evaluations_json = {
                'evaluations': evals_data
            }

    @api.depends('section_ids', 'student_ids')
    def _compute_level_performance_json(self):
        """Performance específico por nivel para los widgets de cada tab"""
        for year in self:
            # Media General
            secundary_sections = year.section_ids.filtered(lambda s: s.type == 'secundary')
            year.secundary_performance_json = year._get_level_performance('secundary', secundary_sections)
            
            # Primaria
            primary_sections = year.section_ids.filtered(lambda s: s.type == 'primary')
            year.primary_performance_json = year._get_level_performance('primary', primary_sections)
            
            # Preescolar
            pre_sections = year.section_ids.filtered(lambda s: s.type == 'pre')
            year.pre_performance_json = year._get_level_performance('pre', pre_sections)
            
    def _get_level_performance(self, level_type, sections):
        """Agrega los datos de rendimiento específico del nivel para general_performance_graph"""
        # Determinar configuración de evaluación por nivel
        if level_type == 'secundary':
            evaluation_config = self.evalution_type_secundary
        elif level_type == 'primary':
            evaluation_config = self.evalution_type_primary
        else:  # pre
            evaluation_config = self.evalution_type_pree

        evaluation_type = evaluation_config.type_evaluation if evaluation_config else '20'

        # Filtrar estudiantes activos del nivel
        students = self.student_ids.filtered(
            lambda s: s.current and s.state == 'done' and s.type == level_type
        )
        if not students:
            return {}

        total_subjects = 0
        subjects_approved = 0
        subjects_failed = 0

        # Para promedio numérico ponderado
        weighted_sum_avg = 0.0
        weighted_count_for_avg = 0

        # Para promedio literal ponderado (si hay literales)
        use_literal = False
        literal_weights_sum = 0.0
        literal_weighted_count = 0

        literal_weights_map = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}

        for student in students:
            perf = student.general_performance_json
            if not isinstance(perf, dict):
                perf = {}
            s_total = int(perf.get('total_subjects', 0))
            s_approved = int(perf.get('subjects_approved', 0))
            s_failed = int(perf.get('subjects_failed', 0))

            total_subjects += s_total
            subjects_approved += s_approved
            subjects_failed += s_failed

            # Numérico: acumular promedio ponderado por número de materias del alumno
            if not perf.get('use_literal') and perf.get('general_average') is not None and s_total > 0:
                try:
                    avg_val = float(perf.get('general_average', 0.0))
                    weighted_sum_avg += avg_val * s_total
                    weighted_count_for_avg += s_total
                except (ValueError, TypeError):
                    pass

            # Literal: marcar y acumular usando el número de materias como peso si existe literal
            if perf.get('use_literal') and perf.get('literal_average'):
                use_literal = True
                lit = perf.get('literal_average')
                if lit in literal_weights_map:
                    weight = literal_weights_map.get(lit, 0)
                    # usar s_total como factor de ponderación si hay información de materias
                    factor = s_total if s_total > 0 else 1
                    literal_weights_sum += weight * factor
                    literal_weighted_count += factor

        result = {
            'evaluation_type': evaluation_type,
            'section_type': level_type,
            'total_subjects': total_subjects,
            'subjects_approved': subjects_approved,
            'subjects_failed': subjects_failed,
            'general_average': 0.0,
            'general_state': 'failed',
            'use_literal': use_literal,
            'literal_average': None,
            'approval_percentage': 0.0,
        }

        # Calcular promedio y estado según tipo de representación
        if use_literal and literal_weighted_count > 0:
            avg_weight = literal_weights_sum / literal_weighted_count
            # Convertir peso promedio a literal (mismo mapeo que en cálculo por estudiante)
            if avg_weight >= 4.5:
                literal_avg = 'A'
            elif avg_weight >= 3.5:
                literal_avg = 'B'
            elif avg_weight >= 2.5:
                literal_avg = 'C'
            elif avg_weight >= 1.5:
                literal_avg = 'D'
            else:
                literal_avg = 'E'
            result['literal_average'] = literal_avg
            result['use_literal'] = True
            result['general_state'] = 'approve' if literal_avg in ['A', 'B', 'C'] else 'failed'
        else:
            # Promedio numérico ponderado por cantidad de materias reportadas por estudiante
            if weighted_count_for_avg > 0:
                avg = round(weighted_sum_avg / weighted_count_for_avg, 2)
                result['general_average'] = avg
                # Determinar umbral mínimo según tipo de evaluación
                min_score = 10 if evaluation_type == '20' else 50
                # Estado: aprobado si promedio >= min_score y no hay materias reprobadas
                result['general_state'] = 'approve' if (avg >= min_score and subjects_failed == 0) else 'failed'
            else:
                result['general_average'] = 0.0
                result['general_state'] = 'failed'

        # Porcentaje de aprobación
        if total_subjects > 0:
            result['approval_percentage'] = round((subjects_approved / total_subjects) * 100, 2)
        else:
            result['approval_percentage'] = 0.0

        return result
    
    @api.depends('student_ids', 'student_ids.general_performance_json', 'student_ids.evaluation_score_ids',
                 'student_ids.type', 'student_ids.state', 'student_ids.current',
                 'student_ids.mention_id', 'student_ids.mention_state', 'student_ids.section_id')
    def _compute_level_dashboard_json(self):
        """Compute dashboard JSON for each level with performance, top students, and approval data"""
        for year in self:
            # Preescolar Dashboard
            year.pre_dashboard_json = year._build_level_dashboard('pre', year.students_pre_ids)
            
            # Primaria Dashboard
            year.primary_dashboard_json = year._build_level_dashboard('primary', year.students_primary_ids)
            
            # Media General Dashboard (sin mención)
            year.secundary_general_dashboard_json = year._build_level_dashboard(
                'secundary_general', year.students_secundary_general_ids
            )
            
            # Técnico Medio Dashboard (con mención inscrita)
            year.secundary_tecnico_dashboard_json = year._build_level_dashboard(
                'secundary_tecnico', year.students_secundary_tecnico_ids
            )
    
    def _build_level_dashboard(self, level_type, students):
        """Build dashboard data for a specific level"""
        if not students:
            return {
                'total_students': 0,
                'approved_count': 0,
                'failed_count': 0,
                'approval_rate': 0,
                'performance_data': [],
                'top_students_by_section': [],
                'evaluation_type': '20',
                'use_literal': False
            }
        
        # Determine evaluation type based on level
        if level_type in ['secundary_general', 'secundary_tecnico']:
            evaluation_config = self.evalution_type_secundary
        elif level_type == 'primary':
            evaluation_config = self.evalution_type_primary
        else:  # pre
            evaluation_config = self.evalution_type_pree
        
        evaluation_type = evaluation_config.type_evaluation if evaluation_config else '20'
        use_literal = evaluation_type == 'literal'
        
        # Helper function to safely get performance state
        def get_perf_state(student):
            perf = student.general_performance_json
            if isinstance(perf, dict):
                return perf.get('general_state')
            return 'failed'
        
        # Calculate approval stats
        approved_count = sum(
            1 for s in students 
            if get_perf_state(s) == 'approve'
        )
        failed_count = len(students) - approved_count
        approval_rate = round((approved_count / len(students)) * 100, 2) if students else 0
        
        # Build performance data (by evaluation for pre/primary, by subject for media/tecnico)
        if level_type in ['pre', 'primary']:
            performance_data = self._build_performance_by_evaluation(students, evaluation_type)
        else:
            performance_data = self._build_performance_by_subject(students, evaluation_type, level_type == 'secundary_tecnico')
        
        # Build top 3 students per section
        top_students_by_section = self._build_top_students_by_section(students, evaluation_type, use_literal)
        
        return {
            'total_students': len(students),
            'approved_count': approved_count,
            'failed_count': failed_count,
            'approval_rate': approval_rate,
            'performance_data': performance_data,
            'top_students_by_section': top_students_by_section,
            'evaluation_type': evaluation_type,
            'use_literal': use_literal
        }
    
    def _build_performance_by_evaluation(self, students, evaluation_type):
        """Build performance grouped by evaluation (for pre/primary)"""
        evaluations_data = {}
        
        for student in students:
            for score in student.evaluation_score_ids:
                eval_id = score.evaluation_id.id
                eval_name = score.evaluation_id.name
                
                if eval_id not in evaluations_data:
                    evaluations_data[eval_id] = {
                        'evaluation_id': eval_id,
                        'evaluation_name': eval_name,
                        'professor_name': score.evaluation_id.professor_id.professor_id.name if score.evaluation_id.professor_id else 'N/A',
                        'scores': [],
                        'literal_scores': [],
                        'total_students': 0,
                        'approved_count': 0
                    }
                
                evaluations_data[eval_id]['total_students'] += 1
                
                if evaluation_type == 'literal' and score.literal_type:
                    evaluations_data[eval_id]['literal_scores'].append(score.literal_type)
                    if score.literal_type in ['A', 'B', 'C']:
                        evaluations_data[eval_id]['approved_count'] += 1
                else:
                    score_value = score.points_20 if evaluation_type == '20' else score.points_100
                    evaluations_data[eval_id]['scores'].append(score_value)
                    min_score = 10 if evaluation_type == '20' else 50
                    if score_value >= min_score:
                        evaluations_data[eval_id]['approved_count'] += 1
        
        # Calculate averages
        result = []
        for eval_id, data in evaluations_data.items():
            if evaluation_type == 'literal' and data['literal_scores']:
                # Calculate mode for literal
                from collections import Counter
                literal_counts = Counter(data['literal_scores'])
                avg_literal = literal_counts.most_common(1)[0][0] if literal_counts else 'N/A'
                data['average'] = avg_literal
            elif data['scores']:
                data['average'] = round(sum(data['scores']) / len(data['scores']), 2)
            else:
                data['average'] = 0
            
            data['approval_rate'] = round((data['approved_count'] / data['total_students']) * 100, 2) if data['total_students'] > 0 else 0
            result.append(data)
        
        # Sort by evaluation name
        result.sort(key=lambda x: x['evaluation_name'])
        return result
    
    def _build_performance_by_subject(self, students, evaluation_type, is_tecnico=False):
        """Build performance grouped by subject (for media general/tecnico)"""
        subjects_data = {}
        
        for student in students:
            for score in student.evaluation_score_ids:
                if not score.subject_id:
                    continue
                
                subject_id = score.subject_id.subject_id.id
                subject_name = score.subject_id.subject_id.name
                
                # For Técnico Medio, optionally filter by mention subjects
                if is_tecnico and student.mention_id:
                    # Include all subjects for now, can filter by mention_ids later if needed
                    pass
                
                if subject_id not in subjects_data:
                    subjects_data[subject_id] = {
                        'subject_id': subject_id,
                        'subject_name': subject_name,
                        'scores': [],
                        'literal_scores': [],
                        'total_evaluations': 0,
                        'approved_count': 0
                    }
                
                subjects_data[subject_id]['total_evaluations'] += 1
                
                if evaluation_type == 'literal' and score.literal_type:
                    subjects_data[subject_id]['literal_scores'].append(score.literal_type)
                    if score.literal_type in ['A', 'B', 'C']:
                        subjects_data[subject_id]['approved_count'] += 1
                else:
                    score_value = score.points_20 if evaluation_type == '20' else score.points_100
                    subjects_data[subject_id]['scores'].append(score_value)
                    min_score = 10 if evaluation_type == '20' else 50
                    if score_value >= min_score:
                        subjects_data[subject_id]['approved_count'] += 1
        
        # Calculate averages
        result = []
        for subject_id, data in subjects_data.items():
            if evaluation_type == 'literal' and data['literal_scores']:
                from collections import Counter
                literal_counts = Counter(data['literal_scores'])
                avg_literal = literal_counts.most_common(1)[0][0] if literal_counts else 'N/A'
                data['average'] = avg_literal
            elif data['scores']:
                data['average'] = round(sum(data['scores']) / len(data['scores']), 2)
            else:
                data['average'] = 0
            
            data['approval_rate'] = round((data['approved_count'] / data['total_evaluations']) * 100, 2) if data['total_evaluations'] > 0 else 0
            result.append(data)
        
        # Sort by subject name
        result.sort(key=lambda x: x['subject_name'])
        return result
    
    def _build_top_students_by_section(self, students, evaluation_type, use_literal):
        """Build top 3 students per section"""
        sections_data = {}
        
        for student in students:
            section_id = student.section_id.id
            section_name = student.section_id.section_id.name if student.section_id.section_id else student.section_id.name
            
            if section_id not in sections_data:
                sections_data[section_id] = {
                    'section_id': section_id,
                    'section_name': section_name,
                    'students': []
                }
            
            # Handle False or non-dict values for general_performance_json
            perf = student.general_performance_json
            if not isinstance(perf, dict):
                perf = {}
            
            if use_literal:
                literal = perf.get('literal_average', 'E')
                literal_weights = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
                sort_value = literal_weights.get(literal, 0)
                display_value = literal
            else:
                sort_value = perf.get('general_average', 0)
                suffix = '/20' if evaluation_type == '20' else '/100'
                display_value = f"{sort_value}{suffix}"
            
            sections_data[section_id]['students'].append({
                'student_id': student.student_id.id,
                'student_name': student.student_id.name,
                'enrollment_id': student.id,
                'average': display_value,
                'sort_value': sort_value,
                'state': perf.get('general_state', 'failed'),
                'use_literal': use_literal
            })
        
        # Sort students and take top 3 per section
        result = []
        for section_id, data in sections_data.items():
            data['students'].sort(key=lambda x: x['sort_value'], reverse=True)
            data['top_3'] = data['students'][:3]
            del data['students']  # Remove full list, keep only top 3
            result.append(data)
        
        # Sort sections by name
        result.sort(key=lambda x: x['section_name'])
        return result
    
    @api.depends('student_ids', 'student_ids.evaluation_score_ids', 'section_ids')
    def _compute_professor_detailed_stats_json(self):
        """Compute professor statistics grouped by student type"""
        for year in self:
            professors = self.env['school.professor'].search([('year_id', '=', year.id)])
            
            professors_data = []
            for prof in professors:
                # Get all evaluations by this professor
                evaluations = self.env['school.evaluation'].search([
                    ('professor_id', '=', prof.id),
                    ('year_id', '=', year.id)
                ])
                
                # Group scores by student type
                stats_by_type = {
                    'pre': {'scores': [], 'count': 0, 'average': 0},
                    'primary': {'scores': [], 'count': 0, 'average': 0},
                    'secundary_general': {'scores': [], 'count': 0, 'average': 0},
                    'secundary_tecnico': {'scores': [], 'count': 0, 'average': 0}
                }
                
                for evaluation in evaluations:
                    for score in evaluation.evaluation_score_ids:
                        student = score.student_id
                        if not student or student.state != 'done':
                            continue
                        
                        # Determine student category
                        if student.type == 'pre':
                            category = 'pre'
                        elif student.type == 'primary':
                            category = 'primary'
                        elif student.type == 'secundary':
                            if student.mention_state == 'enrolled':
                                category = 'secundary_tecnico'
                            else:
                                category = 'secundary_general'
                        else:
                            continue
                        
                        # Get evaluation type for this level
                        if category in ['secundary_general', 'secundary_tecnico']:
                            eval_type = year.evalution_type_secundary.type_evaluation if year.evalution_type_secundary else '20'
                        elif category == 'primary':
                            eval_type = year.evalution_type_primary.type_evaluation if year.evalution_type_primary else '20'
                        else:
                            eval_type = year.evalution_type_pree.type_evaluation if year.evalution_type_pree else 'literal'
                        
                        # Get score value
                        if eval_type == 'literal':
                            literal_weights = {'A': 18, 'B': 15, 'C': 12, 'D': 8, 'E': 4}
                            score_value = literal_weights.get(score.literal_type, 0)
                        elif eval_type == '20':
                            score_value = score.points_20
                        else:
                            score_value = score.points_100
                        
                        stats_by_type[category]['scores'].append(score_value)
                        stats_by_type[category]['count'] += 1
                
                # Calculate averages
                for cat, data in stats_by_type.items():
                    if data['scores']:
                        data['average'] = round(sum(data['scores']) / len(data['scores']), 2)
                    del data['scores']  # Don't include raw scores in JSON
                
                professors_data.append({
                    'professor_id': prof.professor_id.id,
                    'professor_name': prof.professor_id.name,
                    'total_evaluations': len(evaluations),
                    'sections_count': len(prof.section_ids),
                    'stats_by_type': stats_by_type
                })
            
            year.professor_detailed_stats_json = {
                'professors': professors_data,
                'total': len(professors_data)
            }
    
    