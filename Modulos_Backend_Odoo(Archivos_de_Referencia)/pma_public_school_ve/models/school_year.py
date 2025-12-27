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
    
    current_lapso = fields.Selection(
        selection=[
            ('1', 'Primer Lapso'),
            ('2', 'Segundo Lapso'),
            ('3', 'Tercer Lapso')
        ],
        string='Lapso Actual',
        default='1',
        readonly=True,
        help='Lapso activo del año escolar. Las evaluaciones se crean en este lapso.'
    )
    
    lapso_display = fields.Char(
        string='Lapso',
        compute='_compute_lapso_display',
        store=False
    )
    
    @api.depends('current_lapso', 'state')
    def _compute_lapso_display(self):
        lapso_names = {'1': 'Primer Lapso', '2': 'Segundo Lapso', '3': 'Tercer Lapso'}
        for record in self:
            if record.state == 'active' and record.current_lapso:
                record.lapso_display = lapso_names.get(record.current_lapso, '')
            elif record.state == 'finished':
                record.lapso_display = 'Finalizado'
            else:
                record.lapso_display = 'No iniciado'


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
        """Inicia el año escolar en el Primer Lapso"""
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
            'current_lapso': '1',
            'start_date_real': fields.Date.today(),
        })
        
        # Marcar otros años como no actuales
        self.search([('id', '!=', self.id), ('current', '=', True)]).write({'current': False})
        
        return True
    
    def action_next_lapso(self):
        """Avanza al siguiente lapso"""
        self.ensure_one()
        
        if self.state != 'active':
            raise UserError("Solo se puede avanzar de lapso en años escolares activos.")
        
        if self.current_lapso == '1':
            self.write({'current_lapso': '2'})
        elif self.current_lapso == '2':
            self.write({'current_lapso': '3'})
        elif self.current_lapso == '3':
            raise UserError(
                "Ya está en el Tercer Lapso. Use 'Finalizar Año Escolar' para cerrar el año."
            )
        
        return True
    
    def action_finish_year(self):
        """Finaliza el año escolar y bloquea todos los registros"""
        self.ensure_one()
        
        if self.state != 'active':
            raise UserError("Solo se pueden finalizar años escolares que estén en curso.")
        
        if self.current_lapso != '3':
            raise UserError(
                f"Solo se puede finalizar el año escolar desde el Tercer Lapso. "
                f"Actualmente está en el Lapso {self.current_lapso}."
            )
        
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
    
    # Materias y docentes por nivel
    subjects_secundary_count = fields.Integer(compute='_compute_dashboard_counts', store=False, 
                                               string='N° de Materias Media General')
    professors_primary_count = fields.Integer(compute='_compute_dashboard_counts', store=False,
                                               string='N° de Docentes Primaria')
    professors_pre_count = fields.Integer(compute='_compute_dashboard_counts', store=False,
                                           string='N° de Docentes Preescolar')
    mentions_count = fields.Integer(compute='_compute_dashboard_counts', store=False,
                                     string='N° de Menciones')
    
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
    sections_distribution_json = fields.Json(compute='_compute_sections_distribution_json', store=False)
    professors_distribution_json = fields.Json(compute='_compute_professors_distribution_json', store=False)
    approval_rate_json = fields.Json(compute='_compute_approval_rate_json', store=False)
    sections_comparison_json = fields.Json(compute='_compute_sections_comparison_json', store=False)
    top_students_year_json = fields.Json(compute='_compute_top_students_year_json', store=False)
    professor_summary_json = fields.Json(compute='_compute_professor_summary_json', store=False)
    difficult_subjects_json = fields.Json(compute='_compute_difficult_subjects_json', store=False)
    evaluations_stats_json = fields.Json(compute='_compute_evaluations_stats_json', store=False)
    recent_evaluations_json = fields.Json(compute='_compute_recent_evaluations_json', store=False)
    
    # Students Tab Dashboard (replaces list with statistics)
    students_tab_json = fields.Json(compute='_compute_students_tab_json', store=False)
    
    # Preschool Observations Timeline
    pre_observations_timeline_json = fields.Json(compute='_compute_pre_observations_timeline_json', store=False)
    
    # Performance JSON por nivel específico
    secundary_performance_json = fields.Json(compute='_compute_level_performance_json', store=False)
    primary_performance_json = fields.Json(compute='_compute_level_performance_json', store=False)
    pre_performance_json = fields.Json(compute='_compute_level_performance_json', store=False)
    tecnico_performance_json = fields.Json(compute='_compute_level_performance_json', store=False)
    
    # ===== NUEVOS CAMPOS JSON PARA DASHBOARD REFACTORIZADO =====
    # Dashboard JSON por nivel (incluye rendimiento, top estudiantes por sección, aprobación)
    pre_dashboard_json = fields.Json(compute='_compute_level_dashboard_json', store=False)
    primary_dashboard_json = fields.Json(compute='_compute_level_dashboard_json', store=False)
    secundary_general_dashboard_json = fields.Json(compute='_compute_level_dashboard_json', store=False)
    secundary_tecnico_dashboard_json = fields.Json(compute='_compute_level_dashboard_json', store=False)
    
    # Estadísticas de profesores detalladas por tipo de estudiante
    professor_detailed_stats_json = fields.Json(compute='_compute_professor_detailed_stats_json', store=False)
    
    # Dashboard consolidado de profesores (KPIs + Top + Distribución)
    professor_dashboard_json = fields.Json(compute='_compute_professor_dashboard_json', store=False)
    
    @api.depends('student_ids', 'student_ids.type', 'student_ids.state', 'student_ids.current',
                 'student_ids.mention_id', 'student_ids.mention_state')
    def _compute_students_by_type(self):
        """Compute filtered Many2many fields for students by type"""
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

    # ===== CAMPOS M2M COMPUTADOS PARA SECCIONES POR TIPO =====
    sections_secundary_ids = fields.Many2many(
        'school.section', compute='_compute_sections_by_type', store=False,
        string='Secciones Media General'
    )
    sections_primary_ids_m2m = fields.Many2many(
        'school.section', compute='_compute_sections_by_type', store=False,
        string='Secciones Primaria'
    )
    sections_pre_ids_m2m = fields.Many2many(
        'school.section', compute='_compute_sections_by_type', store=False,
        string='Secciones Preescolar'
    )

    @api.depends('section_ids', 'section_ids.type')
    def _compute_sections_by_type(self):
        """Compute filtered Many2many fields for sections by type"""
        for year in self:
            year.sections_secundary_ids = year.section_ids.filtered(lambda s: s.type == 'secundary')
            year.sections_primary_ids_m2m = year.section_ids.filtered(lambda s: s.type == 'primary')
            year.sections_pre_ids_m2m = year.section_ids.filtered(lambda s: s.type == 'pre')
            # Menciones activas
            year.mentions_ids = self.env['school.mention.section'].search([
                ('year_id', '=', year.id),
                ('active', '=', True)
            ])
    
    mentions_ids = fields.Many2many(
        'school.mention.section', compute='_compute_sections_by_type', store=False,
        string='Menciones Técnicas'
    )
    
    # FIX: Campo JSON para mostrar nombres de menciones sin el año
    # El widget many2many_tags usa display_name que incluye el año escolar,
    # causando truncamiento y redundancia. Este campo provee solo los nombres.
    mentions_names_json = fields.Json(
        string='Menciones (JSON)',
        compute='_compute_mentions_names_json',
        store=False
    )
    
    @api.depends('section_ids')
    def _compute_mentions_names_json(self):
        """
        Genera un JSON con los nombres de las menciones sin el año escolar.
        Usado por el widget mentions_tags_widget para mostrar badges sin truncamiento.
        """
        for year in self:
            mentions = self.env['school.mention.section'].search([
                ('year_id', '=', year.id),
                ('active', '=', True)
            ])
            year.mentions_names_json = {
                'mentions': [
                    {
                        'id': m.id,
                        'name': m.mention_id.name,  # Solo el nombre de la mención, sin año
                        'student_count': m.student_count
                    }
                    for m in mentions
                ]
            }
    

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
            
            # Materias de Media General (secciones secundary)
            secundary_sections = year.section_ids.filtered(lambda s: s.type == 'secundary')
            subjects_secundary = set()
            for section in secundary_sections:
                for subject in section.subject_ids:
                    subjects_secundary.add(subject.id)
            year.subjects_secundary_count = len(subjects_secundary)
            
            # Docentes de Primaria
            primary_sections = year.section_ids.filtered(lambda s: s.type == 'primary')
            professors_primary = set()
            for section in primary_sections:
                for prof in section.professor_ids:
                    professors_primary.add(prof.id)
            year.professors_primary_count = len(professors_primary)
            
            # Docentes de Preescolar
            pre_sections = year.section_ids.filtered(lambda s: s.type == 'pre')
            professors_pre = set()
            for section in pre_sections:
                for prof in section.professor_ids:
                    professors_pre.add(prof.id)
            year.professors_pre_count = len(professors_pre)
            
            # Menciones activas
            year.mentions_count = self.env['school.mention.section'].search_count([
                ('year_id', '=', year.id),
                ('active', '=', True)
            ])
    
    def _strip_html(self, text):
        """Remove HTML tags from text"""
        import re
        if not text:
            return ''
        # Remove HTML tags
        clean = re.sub('<[^<]+?>', '', text)
        # Unescape HTML entities
        clean = clean.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
        return clean.strip()
    
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
                 'student_ids.mention_scores_json', 'student_ids.mention_state',
                 'section_ids')
    def _compute_performance_by_level_json(self):
        """Calcula el rendimiento promedio por nivel educativo, incluyendo Medio Técnico"""
        
        def safe_get_perf(student):
            """Safely get performance dict"""
            perf = student.general_performance_json
            return perf if isinstance(perf, dict) else {}
        
        def safe_get_mention_perf(student):
            """Safely get mention performance dict"""
            perf = student.mention_scores_json
            return perf if isinstance(perf, dict) else {}
        
        for record in self:
            result = {
                'levels': []
            }
            
            # Preescolar, Primaria, Media General (estudiantes sin mención inscrita)
            for level_type, level_name in [('pre', 'Preescolar'), 
                                           ('primary', 'Primaria'), 
                                           ('secundary', 'Media General')]:
                if level_type == 'secundary':
                    # Solo estudiantes sin mención inscrita
                    students = record.student_ids.filtered(
                        lambda s: s.current and s.state == 'done' and s.type == level_type and s.mention_state != 'enrolled'
                    )
                else:
                    students = record.student_ids.filtered(
                        lambda s: s.current and s.state == 'done' and s.type == level_type
                    )
                
                if not students:
                    continue
                
                total_students = len(students)
                
                # Bloque específico para PRIMARIA: calcular promedio literal desde estudiantes
                if level_type == 'primary':
                    literal_weights_map = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
                    approved = 0
                    total_weight_sum = 0.0
                    students_with_grades = 0
                    
                    for student in students:
                        # Obtener todas las notas literales del estudiante
                        student_literals = [
                            s.literal_type for s in student.evaluation_score_ids 
                            if s.literal_type and not s.evaluation_id.invisible_literal
                        ]
                        
                        if student_literals:
                            # Calcular promedio literal del estudiante
                            avg_weight = sum(literal_weights_map.get(lit, 0) for lit in student_literals) / len(student_literals)
                            total_weight_sum += avg_weight
                            students_with_grades += 1
                            # C o mejor = aprobado (promedio peso >= 2.5)
                            if avg_weight >= 2.5:
                                approved += 1
                    
                    # Calcular promedio literal general basado en promedios de estudiantes
                    if students_with_grades > 0:
                        overall_avg = total_weight_sum / students_with_grades
                        if overall_avg >= 4.5:
                            literal_avg = 'A'
                        elif overall_avg >= 3.5:
                            literal_avg = 'B'
                        elif overall_avg >= 2.5:
                            literal_avg = 'C'
                        elif overall_avg >= 1.5:
                            literal_avg = 'D'
                        else:
                            literal_avg = 'E'
                    else:
                        literal_avg = None
                    
                    approval_rate = round((approved / total_students * 100), 2) if total_students > 0 else 0
                    
                    result['levels'].append({
                        'type': level_type,
                        'name': level_name,
                        'total_students': total_students,
                        'approved_students': approved,
                        'failed_students': total_students - approved,
                        'average': literal_avg,
                        'approval_rate': approval_rate,
                        'use_literal': True
                    })
                else:
                    # Preescolar y Media General: calcular basado en promedio de estudiantes
                    min_score = 10  # Mínimo para aprobar en escala /20
                    approved = 0
                    total_avg = 0.0
                    count_with_avg = 0
                    
                    for student in students:
                        perf = safe_get_perf(student)
                        student_avg = perf.get('general_average', 0)
                        
                        if student_avg and student_avg > 0:
                            total_avg += student_avg
                            count_with_avg += 1
                            # Estudiante aprobado si su promedio >= 10
                            if student_avg >= min_score:
                                approved += 1
                    
                    # Para Preescolar, todos están aprobados (es observación)
                    if level_type == 'pre':
                        approved = total_students
                    
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
            
            # Medio Técnico: estudiantes con mención inscrita - rendimiento de mención
            # Calcula aprobados basándose en el promedio del estudiante >= 10
            tecnico_students = record.student_ids.filtered(
                lambda s: s.current and s.state == 'done' and s.type == 'secundary' and s.mention_state == 'enrolled'
            )
            
            if tecnico_students:
                total_students = len(tecnico_students)
                approved = 0
                total_avg = 0.0
                count_with_avg = 0
                min_score = 10  # Mínimo para aprobar en escala /20
                
                for student in tecnico_students:
                    mention_perf = safe_get_mention_perf(student)
                    student_avg = 0
                    
                    if mention_perf.get('subjects'):
                        # Usar promedio de mención
                        student_avg = mention_perf.get('general_average', 0) or 0
                    else:
                        # Fallback a promedio general si no hay notas de mención
                        perf = safe_get_perf(student)
                        student_avg = perf.get('general_average', 0) or 0
                    
                    if student_avg > 0:
                        total_avg += student_avg
                        count_with_avg += 1
                        # Estudiante aprobado si su promedio >= 10
                        if student_avg >= min_score:
                            approved += 1
                
                avg = round(total_avg / count_with_avg, 2) if count_with_avg > 0 else 0
                approval_rate = round((approved / total_students * 100), 2) if total_students > 0 else 0
                
                result['levels'].append({
                    'type': 'tecnico',
                    'name': 'Medio Técnico',
                    'total_students': total_students,
                    'approved_students': approved,
                    'failed_students': total_students - approved,
                    'average': avg,
                    'approval_rate': approval_rate
                })
            
            record.performance_by_level_json = result
    
    @api.depends('student_ids', 'student_ids.type', 'student_ids.state', 'student_ids.mention_state')
    def _compute_students_distribution_json(self):
        """Distribución de estudiantes por nivel (gráfico de torta) - 4 niveles"""
        for record in self:
            active_students = record.student_ids.filtered(
                lambda s: s.current and s.state == 'done'
            )
            
            if not active_students:
                record.students_distribution_json = {
                    'labels': ['Preescolar', 'Primaria', 'Media General', 'Medio Técnico'],
                    'data': [0, 0, 0, 0],
                    'total': 0
                }
                continue
            
            pre_count = len(active_students.filtered(lambda s: s.type == 'pre'))
            primary_count = len(active_students.filtered(lambda s: s.type == 'primary'))
            # Media General: secundary sin mención inscrita
            secundary_count = len(active_students.filtered(
                lambda s: s.type == 'secundary' and s.mention_state != 'enrolled'
            ))
            # Medio Técnico: secundary con mención inscrita
            tecnico_count = len(active_students.filtered(
                lambda s: s.type == 'secundary' and s.mention_state == 'enrolled'
            ))
            
            record.students_distribution_json = {
                'labels': ['Preescolar', 'Primaria', 'Media General', 'Medio Técnico'],
                'data': [pre_count, primary_count, secundary_count, tecnico_count],
                'total': len(active_students)
            }
    
    @api.depends('section_ids', 'section_ids.type')
    def _compute_sections_distribution_json(self):
        """Distribución de secciones por nivel (gráfico de torta) - 3 niveles principales
        Nota: Técnico Medio usa las mismas secciones que Media General pero con menciones inscritas.
        Para el conteo total consistente, solo contamos section_ids.
        """
        for record in self:
            # Filter sections by type
            pre_count = len(record.section_ids.filtered(lambda s: s.type == 'pre'))
            primary_count = len(record.section_ids.filtered(lambda s: s.type == 'primary'))
            secundary_count = len(record.section_ids.filtered(lambda s: s.type == 'secundary'))
            total = len(record.section_ids)  # Use same count as total_sections_count
            
            record.sections_distribution_json = {
                'labels': ['Preescolar', 'Primaria', 'Media General'],
                'data': [pre_count, primary_count, secundary_count],
                'total': total
            }
    
    def _compute_professors_distribution_json(self):
        """Distribución de profesores por nivel (gráfico de torta) - 3 niveles
        Nota: Técnico Medio se incluye en Media General ya que son los mismos profesores.
        """
        Professor = self.env['school.professor']
        for record in self:
            all_professors = Professor.search([('year_id', '=', record.id)])
            
            pre_count = 0
            primary_count = 0
            secundary_count = 0  # Includes Técnico Medio
            
            for prof in all_professors:
                counted = False
                # Check section_ids for pre/primary (direct assignment)
                if prof.section_ids:
                    for sec in prof.section_ids:
                        if sec.type == 'pre':
                            pre_count += 1
                            counted = True
                            break
                        elif sec.type == 'primary':
                            primary_count += 1
                            counted = True
                            break
                # Check subjects for secundary (includes técnico - all count as secundary)
                if not counted and prof.subject_ids:
                    secundary_count += 1
            
            total = len(all_professors)
            record.professors_distribution_json = {
                'labels': ['Preescolar', 'Primaria', 'Media General'],
                'data': [pre_count, primary_count, secundary_count],
                'total': total
            }
    
    @api.depends('student_ids', 'student_ids.general_performance_json', 
                 'student_ids.mention_scores_json', 'student_ids.mention_state')
    def _compute_approval_rate_json(self):
        """Tasa de aprobación general del año - promedio de porcentajes por nivel
        Calcula aprobación basándose en el promedio individual del estudiante
        """
        literal_weights_map = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
        min_score = 10  # Mínimo para aprobar en escala /20
        
        def is_primaria_approved(student):
            """Primaria: estudiante aprobado si promedio literal >= C (peso >= 2.5)"""
            student_literals = [
                s.literal_type for s in student.evaluation_score_ids 
                if s.literal_type and not s.evaluation_id.invisible_literal
            ]
            if not student_literals:
                return True  # Sin notas = aprobado por observación
            avg_weight = sum(literal_weights_map.get(lit, 0) for lit in student_literals) / len(student_literals)
            return avg_weight >= 2.5  # C o mejor
        
        def is_secundary_approved(student):
            """Media General: estudiante aprobado si promedio >= 10"""
            perf = student.general_performance_json
            if isinstance(perf, dict):
                avg = perf.get('general_average', 0) or 0
                return avg >= min_score
            return False
        
        def is_tecnico_approved(student):
            """Técnico Medio: estudiante aprobado si promedio en mención >= 10"""
            mention_data = student.mention_scores_json
            if isinstance(mention_data, dict) and mention_data.get('subjects'):
                avg = mention_data.get('general_average', 0) or 0
                return avg >= min_score
            # Fallback a general si no hay datos de mención
            return is_secundary_approved(student)
        
        for record in self:
            active_students = record.student_ids.filtered(
                lambda s: s.current and s.state == 'done'
            )
            
            if not active_students:
                record.approval_rate_json = {
                    'total': 0,
                    'approved': 0,
                    'failed': 0,
                    'rate': 0,
                    'by_level': []
                }
                continue
            
            # Calcular aprobación por nivel
            levels_data = []
            level_rates = []
            total_approved = 0
            
            # Preescolar - todos aprobados (observación)
            pre_students = active_students.filtered(lambda s: s.type == 'pre')
            if pre_students:
                pre_approved = len(pre_students)  # Todos aprobados
                total_approved += pre_approved
                pre_rate = 100.0
                levels_data.append({'name': 'Preescolar', 'rate': pre_rate, 'count': len(pre_students)})
                level_rates.append(pre_rate)
            
            # Primaria - basado en promedio literal
            primary_students = active_students.filtered(lambda s: s.type == 'primary')
            if primary_students:
                primary_approved = sum(1 for s in primary_students if is_primaria_approved(s))
                total_approved += primary_approved
                primary_rate = round((primary_approved / len(primary_students) * 100), 2)
                levels_data.append({'name': 'Primaria', 'rate': primary_rate, 'count': len(primary_students)})
                level_rates.append(primary_rate)
            
            # Media General (sin mención) - basado en promedio numérico >= 10
            secundary_students = active_students.filtered(
                lambda s: s.type == 'secundary' and s.mention_state != 'enrolled'
            )
            if secundary_students:
                secundary_approved = sum(1 for s in secundary_students if is_secundary_approved(s))
                total_approved += secundary_approved
                secundary_rate = round((secundary_approved / len(secundary_students) * 100), 2)
                levels_data.append({'name': 'Media General', 'rate': secundary_rate, 'count': len(secundary_students)})
                level_rates.append(secundary_rate)
            
            # Medio Técnico (con mención) - basado en promedio en mención >= 10
            tecnico_students = active_students.filtered(
                lambda s: s.type == 'secundary' and s.mention_state == 'enrolled'
            )
            if tecnico_students:
                tecnico_approved = sum(1 for s in tecnico_students if is_tecnico_approved(s))
                total_approved += tecnico_approved
                tecnico_rate = round((tecnico_approved / len(tecnico_students) * 100), 2)
                levels_data.append({'name': 'Medio Técnico', 'rate': tecnico_rate, 'count': len(tecnico_students)})
                level_rates.append(tecnico_rate)
            
            # Calcular tasa como porcentaje directo: aprobados / total
            total_rate = round((total_approved / len(active_students)) * 100, 2) if active_students else 0
            
            record.approval_rate_json = {
                'total': len(active_students),
                'approved': total_approved,
                'failed': len(active_students) - total_approved,
                'rate': total_rate,
                'by_level': levels_data
            }
    
    @api.depends('student_ids', 'student_ids.type', 'student_ids.state', 'student_ids.current',
                 'student_ids.general_performance_json', 'student_ids.student_id')
    def _compute_students_tab_json(self):
        """Estadísticas y top performers para el tab de Estudiantes"""
        
        literal_weights_map = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
        min_score = 10  # Mínimo para aprobar en escala /20
        
        def safe_get_average(student):
            perf = student.general_performance_json
            if isinstance(perf, dict):
                return perf.get('general_average', 0) or 0
            return 0
        
        def safe_get_state(student):
            """Calcula estado basándose en el promedio del estudiante por nivel"""
            # Preescolar = todos aprobados por observación
            if student.type == 'pre':
                return 'approve'
            
            # Primaria = promedio literal >= C (peso >= 2.5)
            if student.type == 'primary':
                literals = [
                    s.literal_type for s in student.evaluation_score_ids 
                    if s.literal_type and not s.evaluation_id.invisible_literal
                ]
                if literals:
                    avg_weight = sum(literal_weights_map.get(lit, 0) for lit in literals) / len(literals)
                    return 'approve' if avg_weight >= 2.5 else 'failed'
                return 'approve'  # Sin notas = aprobado por observación
            
            # Media General y Técnico Medio = promedio >= 10
            if student.type == 'secundary':
                # Para Técnico Medio, usar promedio de mención
                if student.mention_state == 'enrolled':
                    mention_perf = student.mention_scores_json
                    if isinstance(mention_perf, dict) and mention_perf.get('subjects'):
                        avg = mention_perf.get('general_average', 0) or 0
                        return 'approve' if avg >= min_score else 'failed'
                # Media General o fallback
                perf = student.general_performance_json
                if isinstance(perf, dict):
                    avg = perf.get('general_average', 0) or 0
                    return 'approve' if avg >= min_score else 'failed'
            return 'failed'
        
        for record in self:
            active_students = record.student_ids.filtered(
                lambda s: s.current and s.state == 'done'
            )
            
            if not active_students:
                record.students_tab_json = {
                    'total': 0,
                    'by_gender': {'M': 0, 'F': 0},
                    'by_state': {'done': 0, 'draft': 0, 'cancel': 0},
                    'by_level': [],
                    'top_performers': [],
                    'at_risk': []
                }
                continue
            
            # Distribution by gender (sex field)
            all_students = record.student_ids.filtered(lambda s: s.current)
            male_count = len(all_students.filtered(
                lambda s: s.student_id and s.student_id.sex == 'M'
            ))
            female_count = len(all_students.filtered(
                lambda s: s.student_id and s.student_id.sex == 'F'
            ))
            
            # Distribution by approval status - calculado por promedio del estudiante
            approved_count = sum(1 for s in active_students if safe_get_state(s) == 'approve')
            failed_count = len(active_students) - approved_count
            
            # Distribution by state
            done_count = len(record.student_ids.filtered(lambda s: s.current and s.state == 'done'))
            draft_count = len(record.student_ids.filtered(lambda s: s.current and s.state == 'draft'))
            cancel_count = len(record.student_ids.filtered(lambda s: s.current and s.state == 'cancel'))
            
            # Distribution by level (reuse existing logic)
            pre_count = len(active_students.filtered(lambda s: s.type == 'pre'))
            primary_count = len(active_students.filtered(lambda s: s.type == 'primary'))
            secundary_count = len(active_students.filtered(
                lambda s: s.type == 'secundary' and s.mention_state != 'enrolled'
            ))
            tecnico_count = len(active_students.filtered(
                lambda s: s.type == 'secundary' and s.mention_state == 'enrolled'
            ))
            
            by_level = [
                {'name': 'Preescolar', 'count': pre_count, 'color': '#FFB300'},
                {'name': 'Primaria', 'count': primary_count, 'color': '#43A047'},
                {'name': 'Media General', 'count': secundary_count, 'color': '#1E88E5'},
                {'name': 'Medio Técnico', 'count': tecnico_count, 'color': '#8E24AA'}
            ]
            
            # Top 10 performers (excluding preescolar - no numeric grades)
            scorable_students = active_students.filtered(lambda s: s.type in ['primary', 'secundary'])
            sorted_by_avg = sorted(scorable_students, key=lambda s: safe_get_average(s), reverse=True)
            
            top_performers = []
            for student in sorted_by_avg[:10]:
                avg = safe_get_average(student)
                if avg > 0:
                    top_performers.append({
                        'id': student.id,
                        'name': student.student_id.name if student.student_id else 'Sin nombre',
                        'section': student.section_id.section_id.display_name if student.section_id and student.section_id.section_id else '',
                        'level': student.type,
                        'average': round(avg, 2),
                        'state': safe_get_state(student)
                    })
            
            # Top 10 at risk (lowest performers with grades, excluding top performers)
            top_performer_ids = {s['id'] for s in top_performers}
            # Get students with grades, sorted by average ascending (lowest first)
            students_with_grades = [s for s in scorable_students if safe_get_average(s) > 0]
            sorted_by_avg_asc = sorted(students_with_grades, key=lambda s: safe_get_average(s))
            
            at_risk = []
            for student in sorted_by_avg_asc:
                if student.id in top_performer_ids:
                    continue  # Skip if already in top performers
                avg = safe_get_average(student)
                at_risk.append({
                    'id': student.id,
                    'name': student.student_id.name if student.student_id else 'Sin nombre',
                    'section': student.section_id.section_id.display_name if student.section_id and student.section_id.section_id else '',
                    'level': student.type,
                    'average': round(avg, 2),
                    'state': safe_get_state(student)
                })
                if len(at_risk) >= 10:
                    break
            
            record.students_tab_json = {
                'total': len(active_students),
                'by_gender': {'M': male_count, 'F': female_count},
                'by_approval': {'approved': approved_count, 'failed': failed_count},
                'by_state': {'done': done_count, 'draft': draft_count, 'cancel': cancel_count},
                'by_level': by_level,
                'top_performers': top_performers,
                'at_risk': at_risk
            }
    
    @api.depends('student_ids', 'student_ids.evaluation_score_ids')
    def _compute_pre_observations_timeline_json(self):
        """Timeline de las últimas observaciones de preescolar"""
        for record in self:
            # Get evaluation scores for preschool students with observations
            scores = self.env['school.evaluation.score'].search([
                ('year_id', '=', record.id),
                ('type', '=', 'pre'),
                ('observation', '!=', False),
                ('observation', '!=', '')
            ], order='write_date desc', limit=15)
            
            timeline = []
            for score in scores:
                # Convertir write_date de UTC a zona horaria del usuario
                local_date = fields.Datetime.context_timestamp(self, score.write_date) if score.write_date else None
                timeline.append({
                    'id': score.id,
                    'student_name': score.student_id.student_id.name if score.student_id and score.student_id.student_id else 'Estudiante',
                    'section': score.student_id.section_id.section_id.display_name if score.student_id and score.student_id.section_id and score.student_id.section_id.section_id else '',
                    'observation': self._strip_html(score.observation[:200] + '...' if len(score.observation or '') > 200 else score.observation),
                    'date': local_date.strftime('%d/%m/%Y %I:%M %p') if local_date else '',
                    'professor': score.evaluation_id.professor_id.name if score.evaluation_id and score.evaluation_id.professor_id else '',
                    'evaluation_name': score.evaluation_id.name if score.evaluation_id else ''
                })
            
            record.pre_observations_timeline_json = {
                'total': len(timeline),
                'timeline': timeline
            }
    
    @api.depends('section_ids', 'section_ids.students_average_json')
    def _compute_sections_comparison_json(self):
        """Comparación de rendimiento - mejor sección por nivel"""
        for record in self:
            result = {
                'sections': []
            }
            
            # Agrupar secciones por tipo y encontrar la mejor de cada nivel
            sections_by_type = {
                'primary': [],
                'secundary': [],
                'tecnico': []  # Para menciones
            }
            
            # Secciones regulares (primaria y media general)
            for section in record.section_ids:
                if section.type not in ['secundary', 'primary']:
                    continue
                
                stats = section.students_average_json
                if not stats or stats.get('total_students', 0) == 0:
                    continue
                
                section_data = {
                    'section_id': section.id,
                    'section_name': section.section_id.display_name if section.section_id else section.name,
                    'type': section.type,
                    'type_name': 'Primaria' if section.type == 'primary' else 'Media General',
                    'average': stats.get('general_average', 0),
                    'total_students': stats.get('total_students', 0),
                    'approved_students': stats.get('approved_students', 0),
                    'failed_students': stats.get('failed_students', 0),
                    'approval_rate': round((stats.get('approved_students', 0) / 
                                           stats.get('total_students', 1) * 100), 2)
                }
                
                sections_by_type[section.type].append(section_data)
            
            # Menciones (Medio Técnico)
            mention_sections = self.env['school.mention.section'].search([
                ('year_id', '=', record.id),
                ('active', '=', True)
            ])
            
            for mention_section in mention_sections:
                stats = mention_section.students_average_json
                if not stats or stats.get('total_students', 0) == 0:
                    continue
                
                section_data = {
                    'section_id': mention_section.id,
                    'section_name': mention_section.mention_id.name,
                    'type': 'tecnico',
                    'type_name': 'Medio Técnico',
                    'average': stats.get('general_average', 0),
                    'total_students': stats.get('total_students', 0),
                    'approved_students': stats.get('approved_students', 0),
                    'failed_students': stats.get('failed_students', 0),
                    'approval_rate': round((stats.get('approved_students', 0) / 
                                           stats.get('total_students', 1) * 100), 2)
                }
                
                sections_by_type['tecnico'].append(section_data)
            
            # Obtener la mejor sección de cada nivel (mayor promedio)
            for level_type in ['primary', 'secundary', 'tecnico']:
                if sections_by_type[level_type]:
                    # Ordenar por promedio descendente y tomar la primera
                    sections_by_type[level_type].sort(key=lambda x: x['average'], reverse=True)
                    best_section = sections_by_type[level_type][0]
                    result['sections'].append(best_section)
            
            record.sections_comparison_json = result
    
    @api.depends('student_ids', 'student_ids.general_performance_json',
                 'student_ids.mention_scores_json', 'student_ids.mention_state')
    def _compute_top_students_year_json(self):
        """Top 9 mejores estudiantes del año - 3 por nivel (Primaria, Media General, Medio Técnico)"""
        
        def get_student_avg(student, use_mention=False, is_primary=False):
            """Get average for sorting"""
            if use_mention:
                perf = student.mention_scores_json
                if isinstance(perf, dict) and perf.get('subjects'):
                    return perf.get('general_average', 0)
                perf = student.general_performance_json
            else:
                perf = student.general_performance_json
            
            if not isinstance(perf, dict):
                # For Primaria: assume approved with 'A' equivalent
                return 18 if is_primary else 0
                
            if perf.get('use_literal'):
                literal = perf.get('literal_average', 'A' if is_primary else 'E')
                literal_weights = {'A': 18, 'B': 15, 'C': 12, 'D': 8, 'E': 4}
                return literal_weights.get(literal, 18 if is_primary else 0)
            return perf.get('general_average', 18 if is_primary else 0)
        
        def build_student_data(student, use_mention=False, is_primary=False):
            """Build student data dict"""
            if use_mention:
                perf = student.mention_scores_json
                if isinstance(perf, dict) and perf.get('subjects'):
                    return {
                        'student_id': student.student_id.id,
                        'student_name': student.student_id.name,
                        'section': student.mention_section_id.mention_id.name if student.mention_section_id else '',
                        'average': perf.get('general_average', 0),
                        'literal_average': None,
                        'state': perf.get('general_state', 'failed'),
                        'use_literal': False
                    }
            
            perf = student.general_performance_json
            
            # For Primaria: always return literal data (they use observation-based grading)
            if is_primary:
                # Primaria doesn't have numeric grades - always return approved with literal
                return {
                    'student_id': student.student_id.id,
                    'student_name': student.student_id.name,
                    'section': student.section_id.section_id.display_name if student.section_id and student.section_id.section_id else '',
                    'average': 18,
                    'literal_average': 'A',
                    'state': 'approve',
                    'use_literal': True
                }
            
            # For non-Primaria: require performance data
            if not isinstance(perf, dict) or not perf or perf.get('total_subjects', 0) == 0:
                return None
                
            return {
                'student_id': student.student_id.id,
                'student_name': student.student_id.name,
                'section': student.section_id.section_id.display_name if student.section_id and student.section_id.section_id else '',
                'average': get_student_avg(student),
                'literal_average': perf.get('literal_average'),
                'state': perf.get('general_state', 'failed'),
                'use_literal': perf.get('use_literal', False)
            }
        
        for record in self:
            active_students = record.student_ids.filtered(
                lambda s: s.current and s.state == 'done'
            )
            
            result = {
                'top_primary': [],
                'top_secundary': [],
                'top_tecnico': []
            }
            
            # Primaria: top 3 (include even without performance data)
            primary_students = active_students.filtered(lambda s: s.type == 'primary')
            primary_sorted = sorted(primary_students, key=lambda s: get_student_avg(s, is_primary=True), reverse=True)
            for student in primary_sorted[:3]:
                data = build_student_data(student, is_primary=True)
                if data:
                    result['top_primary'].append(data)
            
            # Media General: top 3 (sin mención)
            secundary_students = active_students.filtered(
                lambda s: s.type == 'secundary' and s.mention_state != 'enrolled'
            )
            secundary_sorted = sorted(secundary_students, key=lambda s: get_student_avg(s), reverse=True)
            for student in secundary_sorted[:3]:
                data = build_student_data(student)
                if data and data['average'] > 0:
                    result['top_secundary'].append(data)
            
            # Medio Técnico: top 3 (con mención)
            tecnico_students = active_students.filtered(
                lambda s: s.type == 'secundary' and s.mention_state == 'enrolled'
            )
            tecnico_sorted = sorted(tecnico_students, key=lambda s: get_student_avg(s, use_mention=True), reverse=True)
            for student in tecnico_sorted[:3]:
                data = build_student_data(student, use_mention=True)
                if data and data['average'] > 0:
                    result['top_tecnico'].append(data)
            
            record.top_students_year_json = result
    
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
    
    def _compute_professor_dashboard_json(self):
        """Dashboard consolidado de profesores con KPIs, top 5 y distribución por nivel"""
        for record in self:
            professors = self.env['school.professor'].search([
                ('year_id', '=', record.id)
            ])
            
            # Totales
            total_professors = len(professors)
            total_subjects = 0
            total_evaluations = 0
            all_scores = []
            
            # Datos por profesor para ranking
            professors_ranking = []
            
            
            for prof in professors:
                # Materias del profesor
                subjects = self.env['school.subject'].search([
                    ('professor_id', '=', prof.id),
                    ('year_id', '=', record.id)
                ])
                subjects_count = len(subjects)
                total_subjects += subjects_count
                
                # Evaluaciones del profesor
                evaluations = self.env['school.evaluation'].search([
                    ('professor_id', '=', prof.id),
                    ('year_id', '=', record.id)
                ])
                evaluations_count = len(evaluations)
                total_evaluations += evaluations_count
                
                # Calcular promedio del profesor (de sus evaluaciones)
                prof_scores = []
                for evaluation in evaluations:
                    # Get scores from evaluation_score_ids
                    for score_line in evaluation.evaluation_score_ids:
                        if score_line.points_20:
                            try:
                                score = float(score_line.points_20)
                                prof_scores.append(score)
                                all_scores.append(score)
                            except (ValueError, TypeError):
                                pass
                
                prof_average = round(sum(prof_scores) / len(prof_scores), 1) if prof_scores else 0.0
                
                professors_ranking.append({
                    'professor_id': prof.professor_id.id,
                    'professor_name': prof.professor_id.name,
                    'average': prof_average,
                    'evaluations_count': evaluations_count,
                    'subjects_count': subjects_count,
                    'sections_count': len(prof.section_ids)
                })
            
            # Ordenar por promedio (descendente) y tomar top 5
            professors_ranking.sort(key=lambda x: (x['average'], x['evaluations_count']), reverse=True)
            top_5_professors = professors_ranking[:5]
            
            # Promedio general
            general_average = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0.0
            
            # Distribución por nivel - contar profesores ÚNICOS por nivel
            # Un profesor se cuenta en un nivel si tiene al menos una materia/sección ahí
            professors_pre = set()
            professors_primary = set()
            professors_secundary = set()
            professors_tecnico = set()
            
            for prof in professors:
                # Profesores asignados directamente a secciones (preescolar y primaria)
                for section in prof.section_ids:
                    if section.type == 'pre':
                        professors_pre.add(prof.id)
                    elif section.type == 'primary':
                        professors_primary.add(prof.id)
                
                # Profesores asignados via materias
                subjects = self.env['school.subject'].search([
                    ('professor_id', '=', prof.id),
                    ('year_id', '=', record.id)
                ])
                
                for subject in subjects:
                    if subject.section_id:
                        section_type = subject.section_id.type
                        if section_type == 'pre':
                            professors_pre.add(prof.id)
                        elif section_type == 'primary':
                            professors_primary.add(prof.id)
                        elif section_type == 'secundary':
                            professors_secundary.add(prof.id)
                    elif subject.mention_section_id:
                        professors_tecnico.add(prof.id)
            
            unique_distribution = {
                'pre': len(professors_pre),
                'primary': len(professors_primary),
                'secundary': len(professors_secundary),
                'tecnico': len(professors_tecnico)
            }
            
            record.professor_dashboard_json = {
                'total_professors': total_professors,
                'total_subjects': total_subjects,
                'total_evaluations': total_evaluations,
                'general_average': general_average,
                'top_professors': top_5_professors,
                'distribution_by_level': unique_distribution,
                'all_professors': professors_ranking
            }
    
    @api.depends('section_ids', 'section_ids.student_ids', 'section_ids.student_ids.evaluation_score_ids')
    def _compute_difficult_subjects_json(self):
        """Materias con mayor índice de reprobación - calculado directamente desde evaluaciones"""
        for record in self:
            # Agrupar datos por NOMBRE de materia base
            subjects_stats = {}
            min_score = 10  # Mínimo para aprobar
            
            # Recopilar todas las notas de evaluación del año escolar
            # Agrupar por nombre de materia y por estudiante para contar correctamente
            all_scores = self.env['school.evaluation.score'].search([
                ('evaluation_id.year_id', '=', record.id),
                ('subject_id', '!=', False),
                ('points_20', '>', 0)
            ])
            
            # Agrupar scores por materia y estudiante
            # subjects_data[subject_name][student_id] = [lista de puntajes]
            subjects_data = {}
            
            for score in all_scores:
                # Filtrar notas invisibles en Python (invisible_score es campo computado)
                if score.evaluation_id.invisible_score:
                    continue
                    
                subject_name = score.subject_id.subject_id.name if score.subject_id.subject_id else 'Sin nombre'
                student_id = score.student_id.id
                points = score.points_20
                
                if subject_name not in subjects_data:
                    subjects_data[subject_name] = {}
                
                if student_id not in subjects_data[subject_name]:
                    subjects_data[subject_name][student_id] = []
                
                subjects_data[subject_name][student_id].append(points)
            
            # Calcular estadísticas por materia
            difficult_subjects = []
            for subject_name, students in subjects_data.items():
                total_students = len(students)
                failed_students = 0
                total_points = 0
                total_scores = 0
                
                for student_id, scores in students.items():
                    # Promedio del estudiante en esta materia (basado en TODAS sus evaluaciones)
                    student_avg = sum(scores) / len(scores)
                    total_points += sum(scores)
                    total_scores += len(scores)
                    
                    # Estudiante reprueba si su promedio en la materia < 10
                    if student_avg < min_score:
                        failed_students += 1
                
                if total_students > 0:
                    failure_rate = round((failed_students / total_students) * 100, 2)
                    avg = round(total_points / total_scores, 2) if total_scores > 0 else 0
                    
                    # Índice compuesto de dificultad (0-100, mayor = más difícil)
                    # Factor promedio bajo: ((20 - avg) / 20) * 100 normalizado
                    # Combina 50% promedio bajo + 50% tasa de reprobación
                    low_avg_factor = ((20 - avg) / 20) * 100 if avg <= 20 else 0
                    difficulty_index = round((low_avg_factor * 0.5) + (failure_rate * 0.5), 2)
                    
                    difficult_subjects.append({
                        'subject_name': subject_name,
                        'total_students': total_students,
                        'failed_students': failed_students,
                        'failure_rate': failure_rate,
                        'average': avg,
                        'difficulty_index': difficulty_index
                    })
            
            # Ordenar por índice de dificultad descendente (más difícil primero)
            difficult_subjects.sort(key=lambda x: x['difficulty_index'], reverse=True)
            
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
            
            # Por tipo - ahora separando Técnico Medio de Media General
            pre = len(evaluations.filtered(lambda e: e.type == 'pre'))
            primary = len(evaluations.filtered(lambda e: e.type == 'primary'))
            # Media General: evaluaciones de tipo secundary SIN mención asignada
            secundary = len(evaluations.filtered(
                lambda e: e.type == 'secundary' and not e.mention_section_id
            ))
            # Técnico Medio: evaluaciones con mención asignada
            tecnico = len(evaluations.filtered(
                lambda e: e.mention_section_id
            ))
            
            record.evaluations_stats_json = {
                'total': total,
                'qualified': qualified,
                'partial': partial,
                'draft': draft,
                'by_type': {
                    'pre': pre,
                    'primary': primary,
                    'secundary': secundary,
                    'tecnico': tecnico
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
            # Media General (secundary sin mención)
            secundary_sections = year.section_ids.filtered(lambda s: s.type == 'secundary')
            year.secundary_performance_json = year._get_level_performance('secundary', secundary_sections)
            
            # Primaria
            primary_sections = year.section_ids.filtered(lambda s: s.type == 'primary')
            year.primary_performance_json = year._get_level_performance('primary', primary_sections)
            
            # Preescolar
            pre_sections = year.section_ids.filtered(lambda s: s.type == 'pre')
            year.pre_performance_json = year._get_level_performance('pre', pre_sections)
            
            # Técnico Medio (usa datos de menciones)
            year.tecnico_performance_json = year._get_tecnico_performance()
            
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
        is_primary = level_type == 'primary'

        # Filtrar estudiantes activos del nivel
        # Para Media General (secundary), excluir estudiantes con mención inscrita (Técnico Medio)
        if level_type == 'secundary':
            students = self.student_ids.filtered(
                lambda s: s.current and s.state == 'done' and s.type == 'secundary' and s.mention_state != 'enrolled'
            )
        else:
            students = self.student_ids.filtered(
                lambda s: s.current and s.state == 'done' and s.type == level_type
            )
        
        # For Primaria with students but no grades, return default approved data
        if not students:
            return {}
        
        # FIX: Para Primaria, calcular por ESTUDIANTES (no por notas individuales)
        # Cada estudiante tiene un promedio literal basado en sus notas
        if is_primary:
            literal_weights_map = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
            literal_distribution = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0}
            
            students_approved = 0
            students_failed = 0
            total_weight_sum = 0.0
            students_with_grades = 0
            
            for student in students:
                # Obtener todas las notas literales del estudiante
                student_literals = [
                    s.literal_type for s in student.evaluation_score_ids 
                    if s.literal_type and not s.evaluation_id.invisible_literal
                ]
                
                if student_literals:
                    # Calcular promedio literal del estudiante
                    avg_weight = sum(literal_weights_map.get(lit, 0) for lit in student_literals) / len(student_literals)
                    total_weight_sum += avg_weight
                    students_with_grades += 1
                    
                    # Determinar literal promedio del estudiante
                    if avg_weight >= 4.5:
                        student_literal = 'A'
                    elif avg_weight >= 3.5:
                        student_literal = 'B'
                    elif avg_weight >= 2.5:
                        student_literal = 'C'
                    elif avg_weight >= 1.5:
                        student_literal = 'D'
                    else:
                        student_literal = 'E'
                    
                    # Incrementar distribución
                    literal_distribution[student_literal] += 1
                    
                    # Contar aprobado/reprobado (A, B, C = aprobado)
                    if student_literal in ['A', 'B', 'C']:
                        students_approved += 1
                    else:
                        students_failed += 1
            
            # Calcular promedio general del nivel
            if students_with_grades > 0:
                overall_avg_weight = total_weight_sum / students_with_grades
                if overall_avg_weight >= 4.5:
                    literal_avg = 'A'
                elif overall_avg_weight >= 3.5:
                    literal_avg = 'B'
                elif overall_avg_weight >= 2.5:
                    literal_avg = 'C'
                elif overall_avg_weight >= 1.5:
                    literal_avg = 'D'
                else:
                    literal_avg = 'E'
            else:
                overall_avg_weight = 0
                literal_avg = None
            
            total_students = len(students)
            approval_pct = round((students_approved / total_students) * 100, 2) if total_students > 0 else 0.0
            
            return {
                'evaluation_type': 'literal',
                'section_type': level_type,
                'total_subjects': total_students,  # Total de ESTUDIANTES
                'subjects_approved': students_approved,
                'subjects_failed': students_failed,
                'general_average': round(overall_avg_weight * 4, 1),  # Escala aproximada 20
                'general_state': 'approve' if literal_avg in ['A', 'B', 'C'] else 'failed',
                'use_literal': True,
                'literal_average': literal_avg,
                'approval_percentage': approval_pct,
                'literal_distribution': literal_distribution
            }


        # ===== BLOQUE PARA MEDIA GENERAL (secundary) =====
        # Cuenta ESTUDIANTES aprobados/reprobados por su promedio individual
        
        total_students = len(students)
        students_approved = 0
        students_failed = 0
        total_avg = 0.0
        count_with_avg = 0
        
        min_score = 10 if evaluation_type == '20' else 50

        for student in students:
            perf = student.general_performance_json
            if not isinstance(perf, dict):
                perf = {}
            
            # Obtener el promedio individual del estudiante
            student_avg = perf.get('general_average', 0)
            if student_avg and student_avg > 0:
                total_avg += student_avg
                count_with_avg += 1
                # Estudiante aprobado si su promedio >= 10
                if student_avg >= min_score:
                    students_approved += 1
                else:
                    students_failed += 1
            else:
                # Estudiante sin promedio = reprobado
                students_failed += 1

        # Calcular promedio general del nivel
        avg = round(total_avg / count_with_avg, 2) if count_with_avg > 0 else 0.0
        
        result = {
            'evaluation_type': evaluation_type,
            'section_type': level_type,
            'total_subjects': total_students,  # Total de ESTUDIANTES
            'subjects_approved': students_approved,
            'subjects_failed': students_failed,
            'general_average': avg,
            'general_state': 'approve' if avg >= min_score else 'failed',
            'use_literal': False,
            'literal_average': None,
            'approval_percentage': round((students_approved / total_students) * 100, 2) if total_students > 0 else 0.0,
        }

        return result
    
    def _get_tecnico_performance(self):
        """Calcula rendimiento específico para Técnico Medio usando datos de menciones
        Cuenta ESTUDIANTES aprobados/reprobados por su promedio individual
        """
        # Estudiantes de técnico medio (con mención inscrita)
        students = self.student_ids.filtered(
            lambda s: s.current and s.state == 'done' and 
                      s.type == 'secundary' and s.mention_state == 'enrolled'
        )
        
        if not students:
            return {}
        
        # Configuración de evaluación (usamos secundary)
        evaluation_config = self.evalution_type_secundary
        evaluation_type = evaluation_config.type_evaluation if evaluation_config else '20'
        min_score = 10 if evaluation_type == '20' else 50
        
        # Cuenta ESTUDIANTES, no materias
        total_students = len(students)
        students_approved = 0
        students_failed = 0
        total_avg = 0.0
        count_with_avg = 0
        
        for student in students:
            mention_data = student.mention_scores_json
            if not isinstance(mention_data, dict) or not mention_data.get('subjects'):
                students_failed += 1
                continue
            
            # Usar el promedio general del estudiante en la mención
            student_avg = mention_data.get('general_average', 0)
            if student_avg and student_avg > 0:
                total_avg += student_avg
                count_with_avg += 1
                if student_avg >= min_score:
                    students_approved += 1
                else:
                    students_failed += 1
            else:
                students_failed += 1
        
        # Calcular promedio general del nivel
        avg = round(total_avg / count_with_avg, 2) if count_with_avg > 0 else 0.0
        
        result = {
            'evaluation_type': evaluation_type,
            'section_type': 'tecnico',
            'total_subjects': total_students,  # Total de ESTUDIANTES
            'subjects_approved': students_approved,
            'subjects_failed': students_failed,
            'general_average': avg,
            'general_state': 'approve' if avg >= min_score else 'failed',
            'use_literal': False,
            'literal_average': None,
            'approval_percentage': round((students_approved / total_students) * 100, 2) if total_students > 0 else 0.0,
        }
        
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
        use_literal = evaluation_type == 'literal' or level_type == 'primary'  # Primaria always uses literal
        
        # FIX: Helper function to safely get performance state
        # Calcula aprobación basándose en el promedio del estudiante >= 10
        min_score = 10  # Mínimo para aprobar en escala /20
        
        def get_perf_state(student, is_primary=False):
            # Para Técnico Medio, usar promedio de mention_scores_json
            if level_type == 'secundary_tecnico':
                mention_perf = student.mention_scores_json
                if isinstance(mention_perf, dict) and mention_perf.get('subjects'):
                    avg = mention_perf.get('general_average', 0) or 0
                    return 'approve' if avg >= min_score else 'failed'
                # Fallback a promedio general
                perf = student.general_performance_json
                if isinstance(perf, dict):
                    avg = perf.get('general_average', 0) or 0
                    return 'approve' if avg >= min_score else 'failed'
                return 'failed'
            
            # FIX: Para Primaria, calcular directamente desde literal_type
            # porque general_performance_json está vacío (evaluaciones sin subject_id)
            if level_type == 'primary':
                literals = [
                    s.literal_type for s in student.evaluation_score_ids 
                    if s.literal_type and not s.evaluation_id.invisible_literal
                ]
                if literals:
                    # Calcular promedio y determinar estado
                    literal_weights = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
                    avg_weight = sum(literal_weights.get(lit, 0) for lit in literals) / len(literals)
                    if avg_weight >= 2.5:  # C o mejor = aprobado
                        return 'approve'
                    return 'failed'
                return 'approve'  # Sin notas = aprobado por observación
            
            # Para Media General, usar promedio >= 10
            if level_type == 'secundary_general':
                perf = student.general_performance_json
                if isinstance(perf, dict) and perf:
                    avg = perf.get('general_average', 0) or 0
                    return 'approve' if avg >= min_score else 'failed'
                return 'failed'
            
            # Para otros niveles (pre), usar general_performance_json
            perf = student.general_performance_json
            if isinstance(perf, dict) and perf:
                return perf.get('general_state', 'approve')  # Preescolar = aprobado por observación
            return 'approve'
        
        # Calculate approval stats - Preescolar uses observations, all are approved
        is_primary = level_type == 'primary'
        is_pre = level_type == 'pre'
        
        if is_pre:
            # Preescolar: All students are approved by observation (no grades)
            approved_count = len(students)
            failed_count = 0
        else:
            approved_count = sum(
                1 for s in students 
                if get_perf_state(s, is_primary) == 'approve'
            )
            failed_count = len(students) - approved_count
        approval_rate = round((approved_count / len(students)) * 100, 2) if students else 0
        
        # Build performance data (by evaluation for pre/primary, by subject for media/tecnico)
        if level_type in ['pre', 'primary']:
            performance_data = self._build_performance_by_evaluation(students, evaluation_type)
        else:
            performance_data = self._build_performance_by_subject(students, evaluation_type, level_type == 'secundary_tecnico')
        
        # Build top 3 students per section (or by mention for tecnico)
        # Skip for preescolar - no grades
        if level_type == 'pre':
            top_students_by_section = []  # No top students for preescolar
            sections_count = len(self.sections_pre_ids_m2m)
        elif level_type == 'secundary_tecnico':
            top_students_by_section = self._build_top_students_by_mention(students, evaluation_type, use_literal)
            # Use mentions_count field for accurate count of active mention sections
            sections_count = self.mentions_count
        else:
            top_students_by_section = self._build_top_students_by_section(students, evaluation_type, use_literal, level_type)
            sections_count = len(top_students_by_section)
        
        return {
            'level_type': level_type,
            'total_students': len(students),
            'approved_count': approved_count,
            'failed_count': failed_count,
            'approval_rate': approval_rate,
            'sections_count': sections_count,
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
                    score_value = score.points_20
                    evaluations_data[eval_id]['scores'].append(score_value)
                    min_score = 10  # Always base 20
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
                    score_value = score.points_20
                    subjects_data[subject_id]['scores'].append(score_value)
                    min_score = 10  # Always base 20
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
    
    def _build_top_students_by_section(self, students, evaluation_type, use_literal, level_type=''):
        """Build top 3 students per section"""
        sections_data = {}
        is_primary = level_type == 'primary'
        
        for student in students:
            section_id = student.section_id.id
            section_name = student.section_id.section_id.display_name if student.section_id.section_id else student.section_id.name
            
            if section_id not in sections_data:
                sections_data[section_id] = {
                    'section_id': section_id,
                    'section_name': section_name,
                    'students': []
                }
            
            # Handle False or non-dict values for general_performance_json
            perf = student.general_performance_json
            if not isinstance(perf, dict) or not perf:
                perf = {}
            
            if use_literal or is_primary:
                # FIX: Para Primaria, calcular literal directamente desde evaluation_score_ids
                # porque general_performance_json está vacío (evaluaciones sin subject_id)
                if is_primary:
                    literals = [
                        s.literal_type for s in student.evaluation_score_ids 
                        if s.literal_type and not s.evaluation_id.invisible_literal
                    ]
                    if literals:
                        literal_weights = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
                        avg_weight = sum(literal_weights.get(lit, 0) for lit in literals) / len(literals)
                        # Convertir peso promedio a literal
                        if avg_weight >= 4.5:
                            literal = 'A'
                        elif avg_weight >= 3.5:
                            literal = 'B'
                        elif avg_weight >= 2.5:
                            literal = 'C'
                        elif avg_weight >= 1.5:
                            literal = 'D'
                        else:
                            literal = 'E'
                        state = 'approve' if literal in ['A', 'B', 'C'] else 'failed'
                    else:
                        literal = 'E'
                        state = 'failed'
                else:
                    literal = perf.get('literal_average', 'E')
                    state = perf.get('general_state', 'failed')
                
                literal_weights = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
                sort_value = literal_weights.get(literal, 0)
                display_value = literal
            else:
                sort_value = perf.get('general_average', 0)
                suffix = '/20' if evaluation_type == '20' else '/100'
                display_value = f"{sort_value}{suffix}"
                state = perf.get('general_state', 'failed')
            
            sections_data[section_id]['students'].append({
                'student_id': student.student_id.id,
                'student_name': student.student_id.name,
                'enrollment_id': student.id,
                'average': display_value,
                'literal_average': display_value if (use_literal or is_primary) else None,
                'sort_value': sort_value,
                'state': state,
                'use_literal': use_literal or is_primary
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
    
    def _build_top_students_by_mention(self, students, evaluation_type, use_literal):
        """Build top 3 students per mention (for Técnico Medio)"""
        mentions_data = {}
        
        for student in students:
            # Get mention info
            mention = student.mention_id
            if not mention:
                continue
            
            mention_id = mention.id
            mention_name = mention.name
            
            if mention_id not in mentions_data:
                mentions_data[mention_id] = {
                    'section_id': mention_id,  # Use section_id key for compatibility with widget
                    'section_name': mention_name,  # Use section_name key for compatibility
                    'mention_id': mention_id,
                    'mention_name': mention_name,
                    'students': []
                }
            
            # Get performance from mention_scores_json for Técnico Medio
            perf = student.mention_scores_json
            if not isinstance(perf, dict):
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
            
            mentions_data[mention_id]['students'].append({
                'student_id': student.student_id.id,
                'student_name': student.student_id.name,
                'enrollment_id': student.id,
                'average': display_value,
                'sort_value': sort_value,
                'state': perf.get('general_state', 'failed'),
                'use_literal': use_literal
            })
        
        # Sort students and take top 3 per mention
        result = []
        for mention_id, data in mentions_data.items():
            data['students'].sort(key=lambda x: x['sort_value'], reverse=True)
            data['top_3'] = data['students'][:3]
            del data['students']  # Remove full list, keep only top 3
            result.append(data)
        
        # Sort mentions by name
        result.sort(key=lambda x: x['mention_name'])
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
                        else:
                            score_value = score.points_20
                        
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
    
    