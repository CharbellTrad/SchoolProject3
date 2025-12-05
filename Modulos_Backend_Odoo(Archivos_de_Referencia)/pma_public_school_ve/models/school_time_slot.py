from odoo import _, api, fields, models, exceptions


class SchoolTimeSlot(models.Model):
    _name = 'school.time.slot'
    _description = 'School Time Slot'
    _order = 'education_level, sequence, start_time'

    name = fields.Char(
        string='Nombre',
        required=True,
        help='Nombre del bloque (ej: "1er Bloque", "Recreo")'
    )

    education_level = fields.Selection(
        selection=[
            ('pre', 'Preescolar'),
            ('primary', 'Primaria'),
            ('secundary', 'Media General'),
        ],
        string='Nivel Educativo',
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

    sequence = fields.Integer(
        string='Secuencia',
        default=10,
        help='Orden de visualización'
    )

    is_break = fields.Boolean(
        string='Es Recreo/Descanso',
        default=False,
        help='Marcar si este bloque es un recreo o descanso'
    )

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

    duration_minutes = fields.Integer(
        string='Duración (minutos)',
        compute='_compute_duration_minutes',
        store=True
    )

    @api.depends('duration')
    def _compute_duration_minutes(self):
        for record in self:
            record.duration_minutes = int(record.duration * 60)

    # Campos para visualización
    time_range = fields.Char(
        string='Rango Horario',
        compute='_compute_time_range',
        store=True
    )

    @api.depends('start_time', 'end_time')
    def _compute_time_range(self):
        for record in self:
            start = record._float_to_time_string(record.start_time)
            end = record._float_to_time_string(record.end_time)
            record.time_range = f"{start} - {end}"

    active = fields.Boolean(string='Activo', default=True)

    # Constraints
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

    @api.constrains('education_level', 'start_time', 'end_time', 'sequence')
    def _check_overlap(self):
        """Verifica que no haya solapamiento de bloques para el mismo nivel educativo"""
        for record in self:
            if not record.active or record.is_break:
                continue
                
            domain = [
                ('education_level', '=', record.education_level),
                ('id', '!=', record.id),
                ('active', '=', True),
                ('is_break', '=', False),
            ]
            
            overlapping = self.search(domain)
            
            for slot in overlapping:
                if self._times_overlap(
                    record.start_time, record.end_time,
                    slot.start_time, slot.end_time
                ):
                    raise exceptions.ValidationError(
                        f"Conflicto de bloques de tiempo: El bloque '{record.name}' se solapa con "
                        f"el bloque '{slot.name}' ({slot.time_range})"
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
    @api.model
    def get_time_slots_for_level(self, education_level):
        """
        Obtiene todos los bloques de tiempo para un nivel educativo
        Útil para el widget de horarios
        """
        slots = self.search([
            ('education_level', '=', education_level),
            ('active', '=', True)
        ], order='sequence, start_time')
        
        return [{
            'id': slot.id,
            'name': slot.name,
            'start_time': slot.start_time,
            'end_time': slot.end_time,
            'start_time_str': slot._float_to_time_string(slot.start_time),
            'end_time_str': slot._float_to_time_string(slot.end_time),
            'time_range': slot.time_range,
            'is_break': slot.is_break,
            'duration': slot.duration,
            'duration_minutes': slot.duration_minutes,
        } for slot in slots]

    def action_create_schedule(self):
        """
        Acción para crear un horario usando este bloque de tiempo
        """
        self.ensure_one()
        return {
            'name': 'Crear Horario',
            'type': 'ir.actions.act_window',
            'res_model': 'school.schedule',
            'view_mode': 'form',
            'context': {
                'default_time_slot_id': self.id,
                'default_start_time': self.start_time,
                'default_end_time': self.end_time,
            },
            'target': 'new',
        }
