from odoo import _, api, fields, models, exceptions
from dateutil import relativedelta



class ResPartner(models.Model):
    _inherit = 'res.partner'

    is_active = fields.Boolean(string='Inscrito', compute="_compute_is_active")

    is_twin = fields.Boolean(string='Es gemelo')


    @api.depends('inscription_ids.current', 'inscription_ids.state', 'inscription_ids', 'type_enrollment')
    def _compute_is_active(self):
        for rec in self:
            rec.is_active = bool(rec.inscription_ids.filtered(lambda insc: insc.current and insc.state == 'done')) if rec.type_enrollment == 'student' else False

    is_enrollment = fields.Boolean(string="Es matrícula")

    type_enrollment = fields.Selection(string='Tipo', selection=[('parent', 'Representante'), ('student', 'Estudinate'),],)

    age = fields.Integer(string="Edad", compute="_compute_age")

    @api.depends('born_date')
    def _compute_age(self):
        for rec in self:
            rec.age =  0  if not rec.born_date or (rec.born_date and rec.born_date >= fields.Date.today()) else  fields.Date.today().year - rec.born_date.year 

    @api.constrains('born_date')
    def _check_born_date(self):
        for rec in self:
            if rec.type_enrollment == 'student' and rec.born_date and rec.born_date >= fields.Date.today():
                raise exceptions.UserError('La fecha de nacimiento no puede ser mayor o igual a la fecha actual.')
            elif rec.type_enrollment == 'parent' and rec.born_date and rec.born_date > fields.Date.today() - relativedelta.relativedelta(years=18):
                raise exceptions.UserError('La fecha de nacimiento del representante debe ser mayor de edad.')
    

    born_date = fields.Date(string="Fecha de nacimiento")

    sex = fields.Selection(string="Sexo", selection=[('M', 'Masculino'), ('F', 'Femenino')])

    nationality = fields.Selection(string="Nacionalidad", selection=[('V', 'Venezolano'),('E', 'Extrangero')], default="V")

    current_height = fields.Float(string="Estatura (m)", compute="_compute_sizes", inverse="_inverse_sizes", store=True)
    current_size_shoes = fields.Float(string="Talla de zapatos", compute="_compute_sizes", inverse="_inverse_sizes", store=True)
    current_size_shirt = fields.Selection(
        selection=[('xs', 'XS'), ('s', 'S'), ('m', 'M'), ('l', 'L'), ('xl', 'XL')],
        string="Talla de camisa", compute="_compute_sizes", inverse="_inverse_sizes", store=True
    )
    current_size_pants = fields.Float(string="Talla de pantalon", compute="_compute_sizes", inverse="_inverse_sizes", store=True)
    current_weight = fields.Float(string="Peso (kg)", compute="_compute_sizes", inverse="_inverse_sizes", store=True)

    sizes_json = fields.Json(string="Tallas (JSON)")

    @api.depends('sizes_json')
    def _compute_sizes(self):
        """
        Espera un JSON con claves como:
            { "height": ..., "weight": ..., "size_shirt": ..., "size_pants": ..., "size_shoes": ... }
        También soporta los nombres en español usados antes: estatura_m, peso_kg, talla_camisa, talla_pantalon, talla_zapatos
        """
        def _normalize_shirt(val):
            if not val or not isinstance(val, str):
                return False
            v = str(val).strip().lower()
            # normalizar formatos como "M", "m", "M ", " m ", "XL", "Xl", etc.
            v = v.replace(' ', '')
            if v in ('xs', 's', 'm', 'l', 'xl'):
                return v
            # intentar extraer solo letras si viene algo como "Talla M"
            for key in ('xs', 's', 'm', 'l', 'xl'):
                if key in v:
                    return key
            return False

        def _to_float(value):
            try:
                return float(value) if value is not None and value != '' else 0.0
            except (TypeError, ValueError):
                return 0.0

        for rec in self:
            data = rec.sizes_json or {}
            # Preferir claves en inglés según el ejemplo del frontend, sino caer a las claves en español anteriores.
            height = data.get('height', 0.0)
            weight = data.get('weight', 0.0)
            size_shirt = data.get('size_shirt', False)
            size_pants = data.get('size_pants', 0.0)
            size_shoes = data.get('size_shoes', 0.0)

            rec.current_height = _to_float(height)
            rec.current_weight = _to_float(weight)
            rec.current_size_shoes = _to_float(size_shoes)
            rec.current_size_pants = _to_float(size_pants)
            rec.current_size_shirt = _normalize_shirt(size_shirt)

    def _inverse_sizes(self):
        for rec in self:
            rec.sizes_json = {
                'height': rec.current_height,
                'weight': rec.current_weight,
                'size_shirt': rec.current_size_shirt,
                'size_pants': rec.current_size_pants,
                'size_shoes': rec.current_size_shoes
            }

    def _update_sizes_json(self):
        for rec in self:
            last_inscription = rec.inscription_ids.filtered(lambda insc: insc.current)
            if last_inscription:
                rec.sizes_json = {
                    'height': last_inscription[0].height,
                    'weight': last_inscription[0].weight,
                    'size_shirt': last_inscription[0].size_shirt,
                    'size_pants': last_inscription[0].size_pants,
                    'size_shoes': last_inscription[0].size_shoes
                }

    blood_type = fields.Selection(string="Tipo de Sangre", selection=[('A+','A+'), ('B+','B+'), ('AB+','AB+'), ('O+','O+'),
                                                                        ('A-','A-'), ('B-','B-'), ('AB-','AB-'), ('O-','O-')])

    suffer_illness_treatment = fields.Selection(string="¿Sufre de algun tipo de alergia, enfermedad o recibe algun tipo de tratamiento?", selection=[('si', 'Si'), ('no', 'No')])

    what_illness_treatment = fields.Text(string="¿Cual?")

    authorize_primary_atention = fields.Selection(string="¿En caso de fiebre o malestar autoriza a realizarle atencion primaria?",  selection=[('si', 'Si'), ('no', 'No')])

    student_lives = fields.Selection(string="El estudiante vive con", selection=[('P/M', 'PADRE/MADRE'),('O', 'OTRO')])

    emergency_phone_number = fields.Char(string="En caso de emergencia llamar a")


    resident_number = fields.Char(string= "Numero de residencia")

    pregnat_finished = fields.Selection(string="¿Fue un embarazo a término?", selection=[('si', 'Sí'), ('no', 'No')])

    gestation_time = fields.Char(string="Tiempo de gestación")

    peso_al_nacer = fields.Float(string="Peso al nacer (kg)")

    born_complication = fields.Selection(string="¿Tuvo algún tipo de complicación?", selection=[('si', 'Sí'), ('no', 'No')])

    complication = fields.Text(string="¿Cuál complicación?")

    live_with_student = fields.Selection(string="¿Vive con el alumno?", selection=[('si', 'Sí'), ('no', 'No')])

    active_job = fields.Selection(string="¿Está activa laboralmente?", selection=[('si', 'Sí'), ('no', 'No')])

    job_place = fields.Char(string="Lugar de Trabajo")

    job = fields.Char(string="Profesión")

    ci_document = fields.Binary(string="Copia C.I", attachment=True)
    ci_document_filename = fields.Char('Nombre del Archivo')

    brown_folder = fields.Boolean(string="Carpeta Marrón Tamaño Oficio")

    born_document = fields.Binary(string="Copia de Partida de Nacimiento Alumno", attachment=True)
    born_document_filename = fields.Char('Nombre del Archivo')

    boletin_informative = fields.Boolean(string="Boletín Informativo")

    inscription_ids = fields.One2many('school.student', 'student_id', string='Inscripciones')

    parents_ids = fields.Many2many(comodel_name='res.partner', relation="res_partner_parents_students_rel", column1="student_id", column2="parent_id" ,string='Representantes')
    
    students_ids = fields.Many2many(comodel_name='res.partner', relation="res_partner_parents_students_rel", column1="parent_id", column2="student_id" ,string='Estudiantes')

    parent_singnature = fields.Binary(string='Firma de representante')

    inscriptions_count = fields.Integer(string='Inscripciones contador', compute="_compute_inscriptions_count")

    @api.depends('inscription_ids')
    def _compute_inscriptions_count(self):
        for rec in self:
            rec.inscriptions_count = len(rec.inscription_ids.ids)

    def action_open_inscriptions(self):
        self.ensure_one()
        return {
            'name': "Inscripciones",
            'type': 'ir.actions.act_window',
            'res_model': 'school.student',
            'view_mode': 'list,form',
            'target': 'current',
            'domain': [('id','in', self.inscription_ids.ids)],
        }
    

    current_year_id = fields.Many2one(comodel_name='school.year', string='Año escolar', compute="_compute_current_scolar_info", store=True)
    current_section_id = fields.Many2one(comodel_name='school.section', string='Sección', compute="_compute_current_scolar_info", store=True)
    current_section_type = fields.Selection(string='Tipo de sección', selection=[
                                    ('secundary', 'Media general'),
                                    ('primary', 'Primaria'),
                                    ('pre', 'Preescolar')], compute="_compute_current_scolar_info", store=True)
    
    @api.depends('inscription_ids', 'inscription_ids.current', 'inscription_ids.state')
    def _compute_current_scolar_info(self):
        for rec in self:
            inscription = rec.inscription_ids.filtered(lambda insc: insc.current and insc.state == 'done')
            if inscription:
                rec.current_year_id = inscription.year_id.id
                rec.current_section_id = inscription.section_id.id
                rec.current_section_type = inscription.section_id.type
            else:
                rec.current_year_id = False
                rec.current_section_id = False
                rec.current_section_type = False

    historical_performance_json = fields.Json(
        string='Rendimiento Histórico (JSON)',
        compute='_compute_historical_performance_json',
        store=True,
    )

    current_performance_json = fields.Json(
        string='Rendimiento Actual (JSON)',
        compute='_compute_current_performance_json',
        store=True,
    )

    current_scores_json = fields.Json(
        string='Puntajes Actuales (JSON)',
        compute='_compute_current_scores_json',
        store=True,
    )

    @api.depends('inscription_ids', 'inscription_ids.current', 'inscription_ids.state',
                 'inscription_ids.general_performance_json')
    def _compute_current_performance_json(self):
        """Obtiene el rendimiento actual del estudiante"""
        for rec in self:
            if rec.type_enrollment != 'student':
                rec.current_performance_json = {}
                continue

            inscription = rec.inscription_ids.filtered(
                lambda insc: insc.current and insc.state == 'done'
            )
            
            if inscription:
                rec.current_performance_json = inscription[0].general_performance_json or {}
            else:
                rec.current_performance_json = {}

    @api.depends('inscription_ids', 'inscription_ids.current', 'inscription_ids.state',
                 'inscription_ids.evaluation_scores_json')
    def _compute_current_scores_json(self):
        """Obtiene los puntajes actuales del estudiante"""
        for rec in self:
            if rec.type_enrollment != 'student':
                rec.current_scores_json = {}
                continue

            inscription = rec.inscription_ids.filtered(
                lambda insc: insc.current and insc.state == 'done'
            )
            
            if inscription:
                rec.current_scores_json = inscription[0].evaluation_scores_json or {}
            else:
                rec.current_scores_json = {}

    def _update_performance_json(self):
        """Actualiza el rendimiento actual desde la inscripción actual (similar a _update_sizes_json)"""
        for rec in self:
            if rec.type_enrollment != 'student':
                continue
                
            last_inscription = rec.inscription_ids.filtered(lambda insc: insc.current and insc.state == 'done')
            if last_inscription:
                # Invalidar los campos computed para forzar su recálculo
                rec.invalidate_recordset(['current_performance_json', 'current_scores_json', 'historical_performance_json'])
                # También invalidar los campos relacionados en la inscripción para forzar recálculo
                last_inscription.invalidate_recordset(['general_performance_json', 'evaluation_scores_json'])

    @api.depends('inscription_ids', 'inscription_ids.general_performance_json',
                 'inscription_ids.evaluation_score_ids', 'inscription_ids.year_id',
                 'inscription_ids.section_id')
    def _compute_historical_performance_json(self):
        """Calcula el rendimiento histórico del estudiante a través de todos los años"""
        for rec in self:
            if rec.type_enrollment != 'student':
                rec.historical_performance_json = {}
                continue

            # Obtener todas las inscripciones completadas ordenadas por año
            inscriptions = rec.inscription_ids.filtered(
                lambda insc: insc.state == 'done' and insc.section_id.type in ['secundary', 'primary']
            ).sorted(key=lambda x: x.year_id.name if x.year_id else '', reverse=True)
            
            historical_data = []
            total_average = 0.0
            year_count = 0
            
            for inscription in inscriptions:
                perf_data = inscription.general_performance_json
                if not perf_data or perf_data.get('total_subjects', 0) == 0:
                    continue
                
                year_name = inscription.year_id.name if inscription.year_id else 'N/A'
                section_name = inscription.section_id.section_id.name if inscription.section_id and inscription.section_id.section_id else 'N/A'
                
                if perf_data.get('use_literal'):
                    # Para literales, convertir a numérico aproximado
                    literal = perf_data.get('literal_average', 'E')
                    literal_weights = {'A': 18, 'B': 15, 'C': 12, 'D': 8, 'E': 4}
                    avg = literal_weights.get(literal, 0)
                    avg_display = literal
                else:
                    avg = perf_data.get('general_average', 0)
                    evaluation_type = perf_data.get('evaluation_type', '20')
                    suffix = '/20' if evaluation_type == '20' else '/100'
                    avg_display = f"{avg}{suffix}"
                
                historical_data.append({
                    'year_id': inscription.year_id.id if inscription.year_id else False,
                    'year_name': year_name,
                    'section_id': inscription.section_id.id if inscription.section_id else False,
                    'section_name': section_name,
                    'section_type': inscription.section_id.type if inscription.section_id else False,
                    'average': avg,
                    'average_display': avg_display,
                    'state': perf_data.get('general_state', 'failed'),
                    'total_subjects': perf_data.get('total_subjects', 0),
                    'subjects_approved': perf_data.get('subjects_approved', 0),
                    'subjects_failed': perf_data.get('subjects_failed', 0),
                    'use_literal': perf_data.get('use_literal', False),
                    'literal_average': perf_data.get('literal_average'),
                })
                
                total_average += avg
                year_count += 1
            
            # Calcular promedio histórico general
            historical_average = 0.0
            if year_count > 0:
                historical_average = round(total_average / year_count, 2)
            
            result = {
                'historical_average': historical_average,
                'total_years': year_count,
                'years': historical_data,
            }
            
            rec.historical_performance_json = result

    