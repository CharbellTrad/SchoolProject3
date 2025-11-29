from odoo import _, api, fields, models, exceptions


class SchoolSchedule(models.Model):
    _name = 'school.schedule'
    _description = 'School Schedule'
    _order = 'section_id, day_of_week, start_time'
    _rec_name = 'display_name'

    display_name = fields.Char(
        string='Nombre',
        compute='_compute_display_name',
        store=True
    )

    @api.depends('subject_id', 'professor_ids', 'education_level', 'day_of_week', 'start_time', 'end_time')
    def _compute_display_name(self):
        days = dict(self._fields['day_of_week'].selection)
        for record in self:
            day_name = days.get(record.day_of_week, '')
            start = record._float_to_time_string(record.start_time)
            end = record._float_to_time_string(record.end_time)
            
            # Media General: mostrar materia
            if record.education_level == 'secundary' and record.subject_id:
                record.display_name = f"{record.subject_id.subject_id.name} - {day_name} {start}-{end}"
            # Primaria/Preescolar: mostrar profesor(es)
            elif record.education_level in ['primary', 'pre'] and record.professor_ids:
                professors = ', '.join(record.professor_ids.mapped('name'))
                record.display_name = f"{professors} - {day_name} {start}-{end}"
            else:
                record.display_name = f'{day_name} {start}-{end}' if day_name else 'Horario'

    # Campos principales
    section_id = fields.Many2one(
        comodel_name='school.section',
        string='Sección',
        required=True,
        ondelete='cascade',
        index=True
    )

    # Para Media General: por materia
    subject_id = fields.Many2one(
        comodel_name='school.subject',
        string='Materia',
        domain="[('section_id', '=', section_id)]",
        ondelete='cascade',
        help='Solo para Media General'
    )

    professor_id = fields.Many2one(
        comodel_name='school.professor',
        string='Profesor (Materia)',
        related='subject_id.professor_id',
        store=True,
        readonly=True,
        help='Profesor de la materia (Media General)'
    )
    
    # Para Primaria/Preescolar: por profesor(es)
    professor_ids = fields.Many2many(
        comodel_name='school.professor',
        relation='school_schedule_professor_rel',
        column1='schedule_id',
        column2='professor_id',
        string='Profesores',
        domain="[('id', 'in', available_professor_ids)]",
        help='Solo para Primaria y Preescolar'
    )
    
    available_professor_ids = fields.Many2many(
        comodel_name='school.professor',
        compute='_compute_available_professors',
        string='Profesores Disponibles'
    )
    
    @api.depends('section_id')
    def _compute_available_professors(self):
        """Obtiene los profesores de la sección"""
        for record in self:
            if record.section_id:
                # Obtener profesores de las materias de la sección
                professors = record.section_id.subject_ids.mapped('professor_id')
                record.available_professor_ids = professors
            else:
                record.available_professor_ids = False

    # Día y horario (7 días de la semana)
    day_of_week = fields.Selection(
        selection=[
            ('0', 'Lunes'),
            ('1', 'Martes'),
            ('2', 'Miércoles'),
            ('3', 'Jueves'),
            ('4', 'Viernes'),
            ('5', 'Sábado'),
            ('6', 'Domingo'),
        ],
        string='Día de la Semana',
        required=True,
        index=True
    )

    start_time = fields.Float(
        string='Hora de Inicio',
        required=True,
        help='Hora en formato 24h (ej: 8.5 = 8:30)'
    )

    end_time = fields.Float(
        string='Hora de Fin',
        required=True,
        help='Hora en formato 24h (ej: 9.5 = 9:30)'
    )

    # Información adicional
    classroom = fields.Char(string='Aula/Salón')

    notes = fields.Text(string='Notas')

    active = fields.Boolean(string='Activo', default=True)

    # Campos relacionados
    year_id = fields.Many2one(
        comodel_name='school.year',
        string='Año Escolar',
        related='section_id.year_id',
        store=True,
        readonly=True
    )

    education_level = fields.Selection(
        string='Nivel Educativo',
        related='section_id.type',
        store=True,
        readonly=True
    )

    # Campos computados para visualización
    duration = fields.Float(
        string='Duración (horas)',
        compute='_compute_duration',
        store=True
    )

    @api.depends('start_time', 'end_time')
    def _compute_duration(self):
        for record in self:
            if record.start_time and record.end_time:
                record.duration = record.end_time - record.start_time
            else:
                record.duration = 0.0

    time_slot_id = fields.Many2one(
        comodel_name='school.time.slot',
        string='Bloque de Tiempo',
        help='Bloque de tiempo predefinido (opcional)'
    )

    # Color para visualización en el widget
    color = fields.Integer(
        string='Color',
    )

    # Relación con asistencias
    attendance_ids = fields.One2many(
        comodel_name='school.attendance',
        inverse_name='schedule_id',
        string='Asistencias'
    )

    attendance_count = fields.Integer(
        string='Cantidad de Asistencias',
        compute='_compute_attendance_count'
    )

    def _compute_attendance_count(self):
        for record in self:
            record.attendance_count = len(record.attendance_ids)

    # Constraints y validaciones
    @api.constrains('start_time', 'end_time')
    def _check_times(self):
        for record in self:
            if record.start_time < 0 or record.start_time >= 24:
                raise exceptions.ValidationError(
                    "La hora de inicio debe estar entre 0:00 y 23:59"
                )
            if record.end_time < 0 or record.end_time >= 24:
                raise exceptions.ValidationError(
                    "La hora de fin debe estar entre 0:00 y 23:59"
                )
            if record.end_time <= record.start_time:
                raise exceptions.ValidationError(
                    "La hora de fin debe ser posterior a la hora de inicio"
                )
            
            # Validar rangos según nivel educativo
            duration = record.end_time - record.start_time
            if record.education_level == 'pre' and duration > 3:
                raise exceptions.ValidationError(
                    "Para preescolar, los bloques no deben exceder 3 horas"
                )
            elif record.education_level in ['primary', 'secundary'] and duration > 2:
                raise exceptions.ValidationError(
                    "Los bloques de clase no deben exceder 2 horas"
                )

    @api.constrains('section_id', 'subject_id', 'professor_ids', 'education_level')
    def _check_required_fields(self):
        """Valida que los campos requeridos estén presentes según el nivel educativo"""
        for record in self:
            if record.education_level == 'secundary':
                if not record.subject_id:
                    raise exceptions.ValidationError(
                        "Para Media General es obligatorio seleccionar una materia"
                    )
            elif record.education_level in ['primary', 'pre']:
                if not record.professor_ids:
                    raise exceptions.ValidationError(
                        f"Para {dict(record._fields['education_level'].selection)[record.education_level]} "
                        "es obligatorio seleccionar al menos un profesor"
                    )

    @api.constrains('section_id', 'day_of_week', 'start_time', 'end_time', 'subject_id')
    def _check_section_overlap(self):
        """Valida que no haya solapamiento de horarios para la misma sección"""
        for record in self:
            if not record.active:
                continue
                
            domain = [
                ('section_id', '=', record.section_id.id),
                ('day_of_week', '=', record.day_of_week),
                ('id', '!=', record.id),
                ('active', '=', True),
            ]
            
            overlapping = self.search(domain)
            
            for schedule in overlapping:
                # Verificar solapamiento de horarios
                if self._times_overlap(
                    record.start_time, record.end_time,
                    schedule.start_time, schedule.end_time
                ):
                    # Mensaje diferenciado por nivel educativo
                    if record.education_level == 'secundary':
                        conflict_msg = f"la materia {schedule.subject_id.subject_id.name}"
                    else:
                        profs = ', '.join(schedule.professor_ids.mapped('name'))
                        conflict_msg = f"clase con {profs}"
                    
                    raise exceptions.ValidationError(
                        f"Conflicto de horario: La sección {record.section_id.section_id.name} ya tiene "
                        f"{conflict_msg} programada el "
                        f"{dict(record._fields['day_of_week'].selection)[record.day_of_week]} "
                        f"de {self._float_to_time_string(schedule.start_time)} a "
                        f"{self._float_to_time_string(schedule.end_time)}"
                    )

    @api.constrains('professor_id', 'professor_ids', 'day_of_week', 'start_time', 'end_time')
    def _check_professor_overlap(self):
        """Valida que los profesores no tengan clases solapadas (validación cruzada)"""
        for record in self:
            if not record.active:
                continue
            
            # Recopilar todos los profesores involucrados
            professors_to_check = self.env['school.professor']
            
            # Media General: revisar profesor de la materia
            if record.education_level == 'secundary' and record.professor_id:
                professors_to_check |= record.professor_id
            
            # Primaria/Preescolar: revisar todos los profesores asignados
            if record.education_level in ['primary', 'pre'] and record.professor_ids:
                professors_to_check |= record.professor_ids
            
            # Validar cada profesor
            for professor in professors_to_check:
                # Buscar horarios donde este profesor participe
                domain = [
                    '|',
                        ('professor_id', '=', professor.id),  # Como profesor de materia
                        ('professor_ids', 'in', [professor.id]),  # Como profesor general
                    ('day_of_week', '=', record.day_of_week),
                    ('id', '!=', record.id),
                    ('active', '=', True),
                ]
                
                overlapping = self.search(domain)
                
                for schedule in overlapping:
                    if self._times_overlap(
                        record.start_time, record.end_time,
                        schedule.start_time, schedule.end_time
                    ):
                        raise exceptions.ValidationError(
                            f"Conflicto de horario para el profesor {professor.name}: "
                            f"ya tiene clase con la sección {schedule.section_id.section_id.name} el "
                            f"{dict(record._fields['day_of_week'].selection)[record.day_of_week]} "
                            f"de {self._float_to_time_string(schedule.start_time)} a "
                            f"{self._float_to_time_string(schedule.end_time)}"
                        )

    def _times_overlap(self, start1, end1, start2, end2):
        """Verifica si dos rangos de tiempo se solapan"""
        return start1 < end2 and end1 > start2

    def _float_to_time_string(self, float_time):
        """Convierte un float a formato de hora HH:MM"""
        if not float_time:
            return '00:00'
        hours = int(float_time)
        minutes = int((float_time - hours) * 60)
        return f"{hours:02d}:{minutes:02d}"

    # Métodos de utilidad
    @api.onchange('time_slot_id')
    def _onchange_time_slot(self):
        """Autocompleta horarios desde un bloque de tiempo predefinido"""
        if self.time_slot_id:
            self.start_time = self.time_slot_id.start_time
            self.end_time = self.time_slot_id.end_time

    def action_view_attendances(self):
        """Acción para ver las asistencias de este horario"""
        self.ensure_one()
        return {
            'name': f'Asistencias - {self.display_name}',
            'type': 'ir.actions.act_window',
            'res_model': 'school.attendance',
            'view_mode': 'tree,form,calendar',
            'domain': [('schedule_id', '=', self.id)],
            'context': {
                'default_schedule_id': self.id,
                'default_section_id': self.section_id.id,
            }
        }

    @api.model
    def get_weekly_schedule_enhanced(self, section_id):
        """
        Obtiene el horario semanal completo de una sección
        Formato optimizado para el widget de visualización con soporte para 7 días
        y diferenciación por tipo de horario (materia vs profesores)
        """
        section = self.env['school.section'].browse(section_id)
        schedules = self.search([
            ('section_id', '=', section_id),
            ('active', '=', True)
        ])
        
        weekly_data = {
            '0': [],  # Lunes
            '1': [],  # Martes
            '2': [],  # Miércoles
            '3': [],  # Jueves
            '4': [],  # Viernes
            '5': [],  # Sábado
            '6': [],  # Domingo
        }
        
        schedule_type = 'subject' if section.type == 'secundary' else 'teacher'
        
        for schedule in schedules:
            schedule_data = {
                'id': schedule.id,
                'start_time': schedule.start_time,
                'end_time': schedule.end_time,
                'start_time_str': schedule._float_to_time_string(schedule.start_time),
                'end_time_str': schedule._float_to_time_string(schedule.end_time),
                'classroom': schedule.classroom or '',
                'color': schedule.color,
                'duration': schedule.duration,
            }
            
            # Datos específicos por tipo
            if section.type == 'secundary':
                # Media General: por materia
                schedule_data.update({
                    'subject_name': schedule.subject_id.subject_id.name if schedule.subject_id else '',
                    'professor_name': schedule.professor_id.name if schedule.professor_id else '',
                })
            else:
                # Primaria/Preescolar: por profesor(es)
                professors_names = ', '.join(schedule.professor_ids.mapped('name'))
                schedule_data.update({
                    'professors_names': professors_names,
                    'professor_count': len(schedule.professor_ids),
                })
            
            weekly_data[schedule.day_of_week].append(schedule_data)
        
        # Ordenar cada día por hora de inicio
        for day in weekly_data:
            weekly_data[day] = sorted(weekly_data[day], key=lambda x: x['start_time'])
        
        return {
            'schedule_type': schedule_type,
            'education_level': section.type,
            'section_name': section.section_id.name,
            'schedules': weekly_data
        }

    @api.model
    def validate_professor_availability(self, professor_id, day_of_week, start_time, end_time, exclude_schedule_id=None):
        """
        Valida si un profesor está disponible en un horario específico
        Retorna True si está disponible, False si tiene conflicto
        """
        domain = [
            '|',
                ('professor_id', '=', professor_id),
                ('professor_ids', 'in', [professor_id]),
            ('day_of_week', '=', day_of_week),
            ('active', '=', True),
        ]
        
        if exclude_schedule_id:
            domain.append(('id', '!=', exclude_schedule_id))
        
        existing_schedules = self.search(domain)
        
        for schedule in existing_schedules:
            if self._times_overlap(start_time, end_time, schedule.start_time, schedule.end_time):
                return {
                    'available': False,
                    'conflict_schedule': schedule.id,
                    'conflict_section': schedule.section_id.section_id.name,
                    'conflict_time': f"{schedule._float_to_time_string(schedule.start_time)} - {schedule._float_to_time_string(schedule.end_time)}"
                }
        
        return {'available': True}


    @api.model
    def create_from_template(self, section_id, template_data):
        """
        Crea horarios desde una plantilla
        template_data: lista de diccionarios con la configuración
        """
        created_schedules = self.env['school.schedule']
        
        for data in template_data:
            vals = {
                'section_id': section_id,
                'subject_id': data.get('subject_id'),
                'day_of_week': data.get('day_of_week'),
                'start_time': data.get('start_time'),
                'end_time': data.get('end_time'),
                'classroom': data.get('classroom', ''),
            }
            
            if 'time_slot_id' in data:
                vals['time_slot_id'] = data['time_slot_id']
            
            created_schedules |= self.create(vals)
        
        return created_schedules
