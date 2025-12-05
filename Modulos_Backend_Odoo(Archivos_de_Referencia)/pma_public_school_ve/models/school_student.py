from odoo import _, api, fields, models, exceptions
import json

class SchoolStudent(models.Model):
    _name = 'school.student'
    _description = 'School Student'

    _order = 'inscription_date DESC, student_id DESC'

    def _default_year(self):
        year_id = self.env['school.year'].search([('current', '=', True)], limit=1)
        return year_id.id if year_id else False

    name = fields.Char(string='Nombre', compute='_compute_name', store=True)

    @api.depends('year_id', 'section_id', 'student_id')
    def _compute_name(self):
        for record in self:
            if record.year_id and record.section_id and record.student_id:
                record.name = f"Estudiante {record.student_id.name}"
            else:
                record.name = 'Estudiante'
    state = fields.Selection(string='Estado', selection=[('draft', 'Por inscribir'), ('done', 'Inscrito'), ('cancel', 'Desinscrito')], default="draft", readonly=True)

    year_id = fields.Many2one(comodel_name='school.year', string='Año escolar', default=_default_year, required=True)

    section_id = fields.Many2one(comodel_name='school.section', string='Sección', domain="[('year_id', '=', year_id)]", required=True)

    student_id = fields.Many2one(comodel_name='res.partner', string='Estudiante', domain="[('is_enrollment', '=', True), ('parents_ids', '!=', False)]", required=True)

    current = fields.Boolean(string='Actual', related='year_id.current', store=True)

    inscription_date = fields.Date(string="Fecha de inscripción")

    uninscription_date = fields.Date(string="Fecha de Desinscripción")

    height = fields.Float(string="Estatura (m)")

    size_shoes = fields.Float(string="Talla de zapatos")

    size_shirt = fields.Selection(selection=[('xs', 'XS'), ('s', 'S'), ('m', 'M'), ('l', 'L'), ('xl', 'XL')], string="Talla de Camisa")

    size_pants = fields.Float(string="Talla de pantalón")

    weight = fields.Float(string="Peso (kg)")

    from_school = fields.Char(string="Plantel de procedencia")

    observations = fields.Text(string="Observaciones")

    parent_id = fields.Many2one(comodel_name="res.partner",string="Responsable de la inscripción", domain="[('id', 'in', parent_ids)]", required=False)

    parent_name = fields.Char(string="Nombre del Responsable", related='parent_id.display_name', store=True)

    parent_ids = fields.Many2many(comodel_name='res.partner', string='Representantes', relation="res_partner_parents_students_rel", column1="student_id", column2="parent_id" ,compute='_compute_parent_ids')

    evaluation_score_ids = fields.One2many(comodel_name='school.evaluation.score', inverse_name='student_id', string='Puntajes de evaluaciones', readonly=True)

    evaluation_scores_json = fields.Json(
        string='Puntajes de evaluaciones (JSON)',
        compute='_compute_evaluation_scores_json',
        store=True,
    )

    type = fields.Selection(string='Tipo', selection=[
                ('secundary', 'Media general'), 
                ('primary', 'Primaria'), 
                ('pre', 'Preescolar')], related='section_id.type', store=True)

    @api.depends('evaluation_score_ids.points_20', 'evaluation_score_ids.points_100', 
                 'evaluation_score_ids.state_score', 'evaluation_score_ids.subject_id',
                 'section_id.type', 'year_id.evalution_type_secundary')
    def _compute_evaluation_scores_json(self):
        """Calcula los promedios por materia para estudiantes de media general."""
        for record in self:
            if record.section_id.type != 'secundary':
                record.evaluation_scores_json = {}
                continue
                
            # Obtener el tipo de evaluación configurado
            evaluation_type = record.year_id.evalution_type_secundary.type_evaluation if record.year_id.evalution_type_secundary else '20'
            min_score = 10 if evaluation_type == '20' else 50
            
            # Agrupar notas por materia
            subjects_data = {}
            
            for score in record.evaluation_score_ids:
                if not score.subject_id or score.evaluation_id.invisible_score:
                    continue
                    
                subject_id = score.subject_id.id
                
                if subject_id not in subjects_data:
                    subjects_data[subject_id] = {
                        'subject_id': subject_id,
                        'subject_name': score.subject_id.subject_id.name,
                        'scores': [],
                        'states': []
                    }
                
                # Agregar el puntaje según el tipo de evaluación
                score_value = score.points_20 if evaluation_type == '20' else score.points_100
                subjects_data[subject_id]['scores'].append(score_value)
                subjects_data[subject_id]['states'].append(score.state_score)
            
            # Calcular promedios y estado general
            result = {
                'evaluation_type': evaluation_type,
                'subjects': [],
                'general_average': 0.0,
                'general_state': 'approve'
            }
            
            total_average = 0.0
            subject_count = 0
            all_approved = True
            
            for subject_data in subjects_data.values():
                if subject_data['scores']:
                    # Calcular promedio de la materia
                    subject_average = sum(subject_data['scores']) / len(subject_data['scores'])
                    subject_approved = subject_average >= min_score and 'failed' not in subject_data['states']
                    
                    result['subjects'].append({
                        'subject_id': subject_data['subject_id'],
                        'subject_name': subject_data['subject_name'],
                        'average': round(subject_average, 2),
                        'state': 'approve' if subject_approved else 'failed',
                        'num_evaluations': len(subject_data['scores'])
                    })
                    
                    total_average += subject_average
                    subject_count += 1
                    
                    if not subject_approved:
                        all_approved = False
            
            # Calcular promedio general
            if subject_count > 0:
                result['general_average'] = round(total_average / subject_count, 2)
                result['general_state'] = 'approve' if all_approved and result['general_average'] >= min_score else 'failed'
            
            record.evaluation_scores_json = result

    general_performance_json = fields.Json(
        string='Rendimiento General (JSON)',
        compute='_compute_general_performance_json',
        store=True,
        readonly=True,
    )
    
    @api.depends('evaluation_score_ids', 'evaluation_score_ids.points_20', 'evaluation_score_ids.points_100',
                 'evaluation_score_ids.literal_type', 'evaluation_score_ids.state_score', 
                 'evaluation_score_ids.subject_id', 'section_id.type', 'year_id')
    def _compute_general_performance_json(self):
        for record in self:
            # Solo aplicar para media general y primaria
            if record.section_id.type not in ['secundary', 'primary']:
                record.general_performance_json = {}
                continue
            
            # Determinar el tipo de evaluación según la sección
            if record.section_id.type == 'secundary':
                evaluation_config = record.year_id.evalution_type_secundary
            else:  # primary
                evaluation_config = record.year_id.evalution_type_primary
            
            evaluation_type = evaluation_config.type_evaluation if evaluation_config else '20'
            
            # Agrupar notas por materia
            subjects_data = {}
            
            for score in record.evaluation_score_ids:
                if not score.subject_id:
                    continue
                
                subject_id = score.subject_id.id
                
                if subject_id not in subjects_data:
                    subjects_data[subject_id] = {
                        'subject_name': score.subject_id.subject_id.name,
                        'scores_20': [],
                        'scores_100': [],
                        'literal_types': [],
                        'states': []
                    }
                
                # Agregar datos según el tipo de evaluación
                if not score.evaluation_id.invisible_score:
                    if evaluation_type == '20':
                        subjects_data[subject_id]['scores_20'].append(score.points_20)
                    else:  # '100'
                        subjects_data[subject_id]['scores_100'].append(score.points_100)
                
                if not score.evaluation_id.invisible_literal:
                    if score.literal_type:
                        subjects_data[subject_id]['literal_types'].append(score.literal_type)
                
                subjects_data[subject_id]['states'].append(score.state_score)
            
            # Calcular promedio general
            result = {
                'evaluation_type': evaluation_type,
                'section_type': record.section_id.type,
                'total_subjects': 0,
                'subjects_approved': 0,
                'subjects_failed': 0,
                'general_average': 0.0,
                'general_state': 'approve',
                'use_literal': False,
                'literal_average': None,
            }
            
            # Verificar si se usa sistema literal
            use_literal = any(
                score.literal_type and not score.evaluation_id.invisible_literal 
                for score in record.evaluation_score_ids
            )
            result['use_literal'] = use_literal
            
            if use_literal:
                # Cálculo basado en literales
                all_literals = []
                for subject_data in subjects_data.values():
                    if subject_data['literal_types']:
                        # Obtener el literal más frecuente o el último
                        subject_literal = subject_data['literal_types'][-1]
                        all_literals.append(subject_literal)
                        
                        # Determinar si aprobó la materia (A, B, C = aprobado)
                        if subject_literal in ['A', 'B', 'C']:
                            result['subjects_approved'] += 1
                        else:
                            result['subjects_failed'] += 1
                        result['total_subjects'] += 1
                
                if all_literals:
                    # Calcular literal promedio (el más común o promedio ponderado)
                    literal_weights = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}
                    avg_weight = sum(literal_weights.get(lit, 0) for lit in all_literals) / len(all_literals)
                    
                    # Convertir peso promedio a literal
                    if avg_weight >= 4.5:
                        result['literal_average'] = 'A'
                    elif avg_weight >= 3.5:
                        result['literal_average'] = 'B'
                    elif avg_weight >= 2.5:
                        result['literal_average'] = 'C'
                    elif avg_weight >= 1.5:
                        result['literal_average'] = 'D'
                    else:
                        result['literal_average'] = 'E'
                    
                    # Estado general basado en literales
                    result['general_state'] = 'approve' if result['literal_average'] in ['A', 'B', 'C'] else 'failed'
            
            else:
                # Cálculo basado en puntuaciones numéricas
                total_average = 0.0
                subject_count = 0
                
                for subject_data in subjects_data.values():
                    if evaluation_type == '20' and subject_data['scores_20']:
                        subject_avg = sum(subject_data['scores_20']) / len(subject_data['scores_20'])
                        min_score = 10
                    elif evaluation_type == '100' and subject_data['scores_100']:
                        subject_avg = sum(subject_data['scores_100']) / len(subject_data['scores_100'])
                        min_score = 50
                    else:
                        continue
                    
                    total_average += subject_avg
                    subject_count += 1
                    result['total_subjects'] += 1
                    
                    # Determinar si aprobó la materia
                    if subject_avg >= min_score and 'failed' not in subject_data['states']:
                        result['subjects_approved'] += 1
                    else:
                        result['subjects_failed'] += 1
                
                # Calcular promedio general
                if subject_count > 0:
                    result['general_average'] = round(total_average / subject_count, 2)
                    
                    # Determinar estado general
                    min_score = 10 if evaluation_type == '20' else 50
                    if result['general_average'] >= min_score and result['subjects_failed'] == 0:
                        result['general_state'] = 'approve'
                    else:
                        result['general_state'] = 'failed'
            
            # Calcular porcentaje de aprobación
            if result['total_subjects'] > 0:
                result['approval_percentage'] = round(
                    (result['subjects_approved'] / result['total_subjects']) * 100, 2
                )
            else:
                result['approval_percentage'] = 0.0
            
            record.general_performance_json = result


    @api.depends('student_id')
    def _compute_parent_ids(self):
        for rec in self:
            if rec.student_id:
                rec.parent_ids = rec.student_id.parents_ids.ids
            else:
                rec.parent_ids = []

    parent_singnature = fields.Binary(string="Firma del representante")


    @api.onchange('parent_id')
    def _onchange_parent_id(self):
        for rec in self:
            if rec.parent_id:
                rec.parent_singnature = rec.parent_id.parent_singnature

    parent_siganture_date = fields.Date(string="Fecha de firma")

    @api.onchange('student_id')
    def _onchange_sizes(self):
        """Actualiza las medidas del estudiante desde el contacto."""
        for rec in self:
            if rec.student_id and (not rec.height or not rec.weight or not rec.size_shirt or not rec.size_pants or not rec.size_shoes):
                # No usar write() en onchange, solo asignar valores
                rec.height = rec.student_id.current_height
                rec.weight = rec.student_id.current_weight
                rec.size_shirt = rec.student_id.current_size_shirt
                rec.size_pants = rec.student_id.current_size_pants
                rec.size_shoes = rec.student_id.current_size_shoes

    @api.model_create_multi
    def create(self, vals_list):
        res = super().create(vals_list)
        for student in res:
            student.student_id._update_sizes_json()
            student.student_id._update_performance_json()
        return res
    
    def write(self, vals):
        res = super().write(vals)
        
        # Determinar qué campos han cambiado
        size_fields = {'height', 'weight', 'size_shoes', 'size_shirt', 'size_pants'}
        performance_fields = {'evaluation_score_ids', 'state', 'current'}
        
        # Manejar tanto dict como list de dicts
        changed_fields = set()
        if isinstance(vals, list):
            for val in vals:
                changed_fields.update(val.keys())
        else:
            changed_fields = set(vals.keys())
        
        # Actualizar tallas si es necesario
        if size_fields & changed_fields:
            self.mapped('student_id')._update_sizes_json()
        
        # Actualizar rendimiento si es necesario
        if performance_fields & changed_fields:
            self.mapped('student_id')._update_performance_json()
        
        return res

    def validate_inscription(self):
        self.ensure_one()
        if not self.parent_id:
            raise exceptions.UserError("Debe seleccionar un representante para la inscripción.")

        if not self.parent_siganture_date or not self.parent_singnature or not self.parent_id:
            raise exceptions.UserError("Para validar la inscripción deben estar la firma y fecha de firma del representante.")

        self.state = 'done'
        self.inscription_date = fields.Datetime.now()
    
    def validate_uninscription(self):
        self.ensure_one()
        if not self.inscription_date or self.state != 'done':
            raise exceptions.UserError("No se puede desinscribir a un estudiante no inscrito.")

        self.state = 'cancel'
        self.uninscription_date = fields.Datetime.now()


    @api.constrains('student_id', 'year_id')
    def _check_student_unique_enrollment_per_year(self):
        for rec in self:
            if not rec.student_id or not rec.year_id:
                continue
            existing = self.env['school.student'].search([
                ('student_id', '=', rec.student_id.id),
                ('year_id', '=', rec.year_id.id),
                ('id', '!=', rec.id),
                ('state', '!=', 'cancel'),
            ], limit=1)
            if existing:
                raise exceptions.ValidationError("No se puede crear la inscripción: el estudiante ya está inscrito en el año escolar seleccionado.")
