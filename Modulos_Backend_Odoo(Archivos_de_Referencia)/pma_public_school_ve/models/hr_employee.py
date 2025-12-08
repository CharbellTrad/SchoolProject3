from odoo import _, api, fields, models


class HrEmployee(models.Model):
    _inherit = 'hr.employee'

    # Tipo de empleado escolar
    school_employee_type = fields.Selection(
        string='Tipo de Empleado Escolar',
        selection=[
            ('administrativo', 'Administrativo'),
            ('docente', 'Docente'),
            ('obrero', 'Obrero'),
            ('cenar', 'Cenar'),
        ],
        required=True
    )

    subject_ids = fields.Many2many(
        'school.register.subject',
        'school_register_subject_professor_rel',
        'professor_id',
        'subject_id',
        string='Materias'
    )

    # =====================================================
    # CAMPOS DE MATRICULA DE PERSONAL (Venezuela)
    # =====================================================

    # --- Ubicación Geográfica ---
    # Nota: Usamos los campos nativos de hr.version para estado (private_state_id)
    # cod_estado se calcula automáticamente del state_id
    cod_estado = fields.Char(
        string="Código Estado",
        compute='_compute_cod_estado',
        store=True
    )
    municipio = fields.Char(string="Municipio")
    parroquia = fields.Char(string="Parroquia")
    ubicacion_geografica = fields.Char(string="Ubicación Geográfica")

    @api.depends('private_state_id')
    def _compute_cod_estado(self):
        for record in self:
            if record.private_state_id:
                record.cod_estado = record.private_state_id.code or ''
            else:
                record.cod_estado = ''

    # --- Códigos del Plantel ---
    codigo_dependencia = fields.Char(string="Código Dependencia")
    codigo_estadistico = fields.Char(string="Código Estadístico")
    codigo_plantel = fields.Char(string="Código del Plantel")
    nombre_plantel_nomina = fields.Char(string="Nombre del Plantel en Nómina")
    fecha_ingreso_plantel = fields.Date(
        string="Fecha de Ingreso al Plantel",
        default=fields.Date.today,
        tracking=True
    )

    # --- Turnos del Plantel ---
    turno_manana = fields.Boolean(string="Turno Mañana")
    turno_tarde = fields.Boolean(string="Turno Tarde")

    # --- Nivel y Modalidad ---
    nivel_educativo_ids = fields.Many2many(
        'school.education.level',
        'hr_employee_education_level_rel',
        'employee_id',
        'level_id',
        string="Niveles Educativos"
    )

    modalidad_ids = fields.Many2many(
        'school.modality',
        'hr_employee_modality_rel',
        'employee_id',
        'modality_id',
        string="Modalidades"
    )

    # --- Datos del Personal ---
    codigo_rac = fields.Char(string="Código RAC")
    # Nota: sexo usa el campo nativo 'sex' de hr.version (heredado en hr.employee)
    horas_academicas = fields.Float(string="Horas Académicas")
    horas_administrativas = fields.Float(string="Horas Administrativas")

    # --- Para Inicial y Primaria (secciones que imparte actualmente) ---
    # Many2many a school.section para grados/secciones del año escolar actual
    secciones_imparte_ids = fields.Many2many(
        'school.section',
        'hr_employee_school_section_rel',
        'employee_id',
        'section_id',
        string='Grados/Secciones que Imparte',
        domain="[('current', '=', True)]",
        help="Secciones o grados que imparte actualmente en el año escolar vigente"
    )

    # --- Para Media General y Técnica ---
    especialidad_docente = fields.Char(string="Especialidad que Imparte")
    ano_que_imparte = fields.Char(string="Año que Imparte")
    secciones_que_imparte = fields.Char(
        string="Secciones que Imparte (Texto)",
        help="Para media general/técnica, escribir las secciones separadas por coma"
    )

    # --- Especial/Jóvenes y Adultos ---
    materia_especialidad = fields.Char(string="Materia o Especialidad")
    periodo_grupo = fields.Char(string="Período o Grupo")

    # --- Situación del Trabajador ---
    situacion_trabajador = fields.Selection(
        string="Situación del Trabajador",
        selection=[
            ('activo', 'Activo'),
            ('reposo', 'Reposo'),
            ('permiso', 'Permiso'),
            ('jubilado', 'Jubilado'),
            ('retirado', 'Retirado'),
            ('suspendido', 'Suspendido'),
            ('otro', 'Otro'),
        ],
        default='activo'
    )

    especifique_situacion = fields.Text(string="Especifique Situación")
    observacion_personal = fields.Text(string="Observación")

    # --- Método onchange para limpiar especificación y archivar ---
    @api.onchange('situacion_trabajador')
    def _onchange_situacion_trabajador(self):
        """
        - Limpia el campo de especificación si no es 'otro'
        - Archiva el empleado si la situación no es activa/reposo/permiso
        """
        if self.situacion_trabajador != 'otro':
            self.especifique_situacion = False
        
        # Archivar si no está en estados activos
        active_states = ['activo', 'reposo', 'permiso']
        if self.situacion_trabajador and self.situacion_trabajador not in active_states:
            self.active = False
        else:
            self.active = True