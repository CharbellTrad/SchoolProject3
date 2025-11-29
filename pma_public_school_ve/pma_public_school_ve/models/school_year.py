from odoo import _, api, fields, models
from odoo.exceptions import UserError

class SchoolYear(models.Model):
    _name = 'school.year'
    _description = 'School Year'

    name = fields.Char(string='Nombre', required=True)

    current = fields.Boolean(string='Año actual')

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
    total_students_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    approved_students_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    total_sections_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    total_professors_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    
    students_pre_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    students_primary_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    students_secundary_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    
    approved_pre_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    approved_primary_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    approved_secundary_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    
    sections_pre_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    sections_primary_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    sections_secundary_count = fields.Integer(compute='_compute_dashboard_counts', store=False)
    
    # ===== CAMPOS JSON PARA WIDGETS (reutilizando los que te di antes) =====
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
    
    @api.depends('student_ids', 'student_ids.state', 'student_ids.current', 'section_ids')
    def _compute_dashboard_counts(self):
        for year in self:
            active_students = year.student_ids.filtered(lambda s: s.current and s.state == 'done')
            
            year.total_students_count = len(active_students)
            year.total_sections_count = len(year.section_ids)
            year.total_professors_count = self.env['school.professor'].search_count([('year_id', '=', year.id)])
            
            # Aprobados total
            year.approved_students_count = sum(
                1 for s in active_students 
                if s.general_performance_json.get('general_state') == 'approve'
            )
            
            # Por nivel - estudiantes
            pre_students = active_students.filtered(lambda s: s.type == 'pre')
            primary_students = active_students.filtered(lambda s: s.type == 'primary')
            secundary_students = active_students.filtered(lambda s: s.type == 'secundary')
            
            year.students_pre_count = len(pre_students)
            year.students_primary_count = len(primary_students)
            year.students_secundary_count = len(secundary_students)
            
            # Aprobados por nivel
            year.approved_pre_count = sum(1 for s in pre_students if s.general_performance_json.get('general_state') == 'approve')
            year.approved_primary_count = sum(1 for s in primary_students if s.general_performance_json.get('general_state') == 'approve')
            year.approved_secundary_count = sum(1 for s in secundary_students if s.general_performance_json.get('general_state') == 'approve')
            
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
                              if s.general_performance_json.get('general_state') == 'approve')
                
                # Calcular promedio general del nivel
                total_avg = 0
                count_with_avg = 0
                
                for student in students:
                    perf = student.general_performance_json
                    if perf and perf.get('general_average'):
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
            
            approved = sum(1 for s in active_students 
                          if s.general_performance_json.get('general_state') == 'approve')
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
                if not perf or perf.get('total_subjects', 0) == 0:
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
                    'section': student.section_id.section_id.name,
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
            perf = student.general_performance_json or {}
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
    