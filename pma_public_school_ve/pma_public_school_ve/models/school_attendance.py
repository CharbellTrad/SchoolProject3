from odoo import _, api, fields, models, exceptions
from datetime import datetime, timedelta


class SchoolAttendance(models.Model):
    _name = 'school.attendance'
    _description = 'School Attendance'
    _order = 'date DESC, check_in_time DESC'
    _rec_name = 'display_name'

    display_name = fields.Char(string='Nombre', compute='_compute_display_name', store=True)

    @api.depends('student_id', 'employee_id', 'visitor_name', 'attendance_type', 'date', 'state')
    def _compute_display_name(self):
        for record in self:
            # Determinar el nombre según el tipo de asistencia
            if record.attendance_type == 'student' and record.student_id:
                name = record.student_id.student_id.name
            elif record.attendance_type == 'employee' and record.employee_id:
                name = record.employee_id.name
            elif record.attendance_type == 'visitor' and record.visitor_name:
                name = record.visitor_name
            else:
                name = 'Asistencia'
            
            state_label = dict(record._fields['state'].selection).get(record.state, '')
            record.display_name = f"{name} - {record.date} ({state_label})"

    # Tipo de asistencia
    attendance_type = fields.Selection(
        selection=[
            ('student', 'Estudiante'),
            ('employee', 'Personal'),
            ('visitor', 'Visitante Externo'),
        ],
        string='Tipo de Asistencia',
        required=True,
        default='student',
        index=True
    )

    # Campos principales
    date = fields.Date(
        string='Fecha',
        required=True,
        default=fields.Date.context_today,
        index=True
    )

    # Relaciones - condicionales según tipo de asistencia
    student_id = fields.Many2one(
        comodel_name='school.student',
        string='Estudiante',
        ondelete='cascade',
        index=True,
        help='Solo para tipo Estudiante'
    )

    employee_id = fields.Many2one(
        comodel_name='hr.employee',
        string='Empleado',
        ondelete='cascade',
        index=True,
        help='Solo para tipo Personal'
    )

    # Campos para visitantes externos
    visitor_name = fields.Char(
        string='Nombre del Visitante',
        help='Solo para tipo Visitante Externo'
    )

    visitor_id_number = fields.Char(
        string='Cédula del Visitante',
        help='Solo para tipo Visitante Externo'
    )

    visitor_destination = fields.Char(
        string='Destino',
        help='Solo para tipo Visitante Externo'
    )

    # Estado de asistencia
    state = fields.Selection(
        selection=[
            ('present', 'Presente'),
            ('absent', 'Ausente'),
            ('late', 'Tardanza'),
            ('permission', 'Permiso'),
        ],
        string='Estado',
        required=True,
        default='present',
        index=True
    )

    # Horarios y sección
    schedule_id = fields.Many2one(
        comodel_name='school.schedule',
        string='Horario de Clase',
        ondelete='set null',
        help='Obligatorio para estudiantes, opcional para otros tipos'
    )

    section_id = fields.Many2one(
        comodel_name='school.section',
        string='Sección',
        compute='_compute_section_id',
        store=True,
        index=True
    )

    @api.depends('student_id', 'student_id.section_id', 'schedule_id', 'schedule_id.section_id')
    def _compute_section_id(self):
        for record in self:
            if record.student_id and record.student_id.section_id:
                record.section_id = record.student_id.section_id
            elif record.schedule_id and record.schedule_id.section_id:
                record.section_id = record.schedule_id.section_id
            else:
                record.section_id = False

    # Observaciones
    observations = fields.Text(string='Observaciones')

    # Campos de tiempo
    check_in_time = fields.Float(
        string='Hora de Entrada',
        help='Hora de entrada en formato 24h (ej: 8.5 = 08:30)'
    )

    check_out_time = fields.Float(
        string='Hora de Salida',
        help='Hora de salida en formato 24h (ej: 12.5 = 12:30)'
    )

    # Campos relacionados útiles
    year_id = fields.Many2one(
        comodel_name='school.year',
        string='Año Escolar',
        related='section_id.year_id',
        store=True
    )

    subject_id = fields.Many2one(
        comodel_name='school.subject',
        string='Materia',
        related='schedule_id.subject_id',
        store=True
    )

    # Campos computados para estadísticas
    is_student = fields.Boolean(
        string='Es Estudiante',
        compute='_compute_attendance_type',
        store=True
    )

    is_employee = fields.Boolean(
        string='Es Empleado',
        compute='_compute_attendance_type',
        store=True
    )

    @api.depends('student_id', 'employee_id')
    def _compute_attendance_type(self):
        for record in self:
            record.is_student = bool(record.student_id)
            record.is_employee = bool(record.employee_id)

    # Campos para reportes
    week_number = fields.Integer(
        string='Número de Semana',
        compute='_compute_week_number',
        store=True
    )

    month = fields.Selection(
        selection=[
            ('1', 'Enero'), ('2', 'Febrero'), ('3', 'Marzo'),
            ('4', 'Abril'), ('5', 'Mayo'), ('6', 'Junio'),
            ('7', 'Julio'), ('8', 'Agosto'), ('9', 'Septiembre'),
            ('10', 'Octubre'), ('11', 'Noviembre'), ('12', 'Diciembre'),
        ],
        string='Mes',
        compute='_compute_month',
        store=True
    )

    @api.depends('date')
    def _compute_week_number(self):
        for record in self:
            if record.date:
                record.week_number = record.date.isocalendar()[1]
            else:
                record.week_number = 0

    @api.depends('date')
    def _compute_month(self):
        for record in self:
            if record.date:
                record.month = str(record.date.month)
            else:
                record.month = False

    # Constraints y validaciones
    @api.constrains('attendance_type', 'student_id', 'employee_id', 'visitor_name', 'visitor_id_number', 'schedule_id')
    def _check_required_by_type(self):
        """Valida que los campos requeridos estén presentes según el tipo de asistencia"""
        for record in self:
            if record.attendance_type == 'student':
                if not record.student_id:
                    raise exceptions.ValidationError(
                        "Para asistencia de estudiantes es obligatorio seleccionar un estudiante"
                    )
                if not record.schedule_id:
                    raise exceptions.ValidationError(
                        "Para asistencia de estudiantes es obligatorio vincular a un horario de clase"
                    )
            elif record.attendance_type == 'employee':
                if not record.employee_id:
                    raise exceptions.ValidationError(
                        "Para asistencia de personal es obligatorio seleccionar un empleado"
                    )
            elif record.attendance_type == 'visitor':
                if not record.visitor_name:
                    raise exceptions.ValidationError(
                        "Para asistencia de visitantes es obligatorio ingresar el nombre"
                    )
                if not record.visitor_id_number:
                    raise exceptions.ValidationError(
                        "Para asistencia de visitantes es obligatorio ingresar la cédula/identificación"
                    )

    @api.constrains('student_id', 'employee_id', 'visitor_name')
    def _check_exclusive_fields(self):
        """Valida que solo se llene un tipo de registro"""
        for record in self:
            filled_count = sum([
                bool(record.student_id),
                bool(record.employee_id),
                bool(record.visitor_name)
            ])
            if filled_count == 0:
                raise exceptions.ValidationError(
                    "Debe seleccionar o ingresar al menos un estudiante, empleado o visitante"
                )
            if filled_count > 1:
                raise exceptions.ValidationError(
                    "Solo puede registrar un tipo de asistencia a la vez (estudiante, empleado o visitante)"
                )

    @api.constrains('check_in_time', 'check_out_time')
    def _check_times(self):
        for record in self:
            if record.check_in_time and (record.check_in_time < 0 or record.check_in_time >= 24):
                raise exceptions.ValidationError(
                    "La hora de entrada debe estar entre 0:00 y 23:59"
                )
            if record.check_out_time and (record.check_out_time < 0 or record.check_out_time >= 24):
                raise exceptions.ValidationError(
                    "La hora de salida debe estar entre 0:00 y 23:59"
                )
            if record.check_in_time and record.check_out_time:
                if record.check_out_time <= record.check_in_time:
                    raise exceptions.ValidationError(
                        "La hora de salida debe ser posterior a la hora de entrada"
                    )

    @api.constrains('student_id', 'date', 'schedule_id', 'attendance_type')
    def _check_unique_student_attendance(self):
        """Evita registros duplicados de asistencia"""
        for record in self:
            # Para estudiantes: validar unicidad por estudiante/fecha/horario
            if record.attendance_type == 'student' and record.student_id:
                domain = [
                    ('student_id', '=', record.student_id.id),
                    ('date', '=', record.date),
                    ('schedule_id', '=', record.schedule_id.id if record.schedule_id else False),
                    ('id', '!=', record.id),
                ]
                
                existing = self.search(domain, limit=1)
                if existing:
                    raise exceptions.ValidationError(
                        f"Ya existe un registro de asistencia para {record.student_id.student_id.name} "
                        f"en el horario de {record.schedule_id.display_name if record.schedule_id else 'sin horario'} "
                        f"del {record.date}"
                    )
            
            # Para empleados: validar unicidad por empleado/fecha
            elif record.attendance_type == 'employee' and record.employee_id:
                domain = [
                    ('employee_id', '=', record.employee_id.id),
                    ('date', '=', record.date),
                    ('id', '!=', record.id),
                ]
                
                existing = self.search(domain, limit=1)
                if existing:
                    raise exceptions.ValidationError(
                        f"Ya existe un registro de asistencia para {record.employee_id.name} en la fecha {record.date}"
                    )

    # Métodos de utilidad
    def _float_to_time_string(self, float_time):
        """Convierte un float a formato de hora HH:MM"""
        if not float_time:
            return ''
        hours = int(float_time)
        minutes = int((float_time - hours) * 60)
        return f"{hours:02d}:{minutes:02d}"

    def get_attendance_statistics(self, date_from=None, date_to=None, section_id=None):
        """
        Obtiene estadísticas de asistencia para un rango de fechas y sección
        """
        domain = []
        
        if date_from:
            domain.append(('date', '>=', date_from))
        if date_to:
            domain.append(('date', '<=', date_to))
        if section_id:
            domain.append(('section_id', '=', section_id))
        
        attendances = self.search(domain)
        
        total = len(attendances)
        if total == 0:
            return {
                'total': 0,
                'present': 0,
                'absent': 0,
                'late': 0,
                'permission': 0,
                'attendance_rate': 0.0
            }
        
        present = len(attendances.filtered(lambda a: a.state == 'present'))
        absent = len(attendances.filtered(lambda a: a.state == 'absent'))
        late = len(attendances.filtered(lambda a: a.state == 'late'))
        permission = len(attendances.filtered(lambda a: a.state == 'permission'))
        
        # Calcular tasa de asistencia (presente + tardanza + permiso)
        attendance_rate = ((present + late + permission) / total) * 100 if total > 0 else 0
        
        return {
            'total': total,
            'present': present,
            'absent': absent,
            'late': late,
            'permission': permission,
            'attendance_rate': round(attendance_rate, 2)
        }

    @api.model
    def create_student_attendance_for_schedule(self, schedule_id, date, students_data):
        """
        Crea registros de asistencia para estudiantes en un horario específico
        students_data: lista de diccionarios con {student_id, state, observations, check_in_time, check_out_time}
        """
        attendance_vals = []
        
        for student_data in students_data:
            vals = {
                'attendance_type': 'student',
                'student_id': student_data['student_id'],
                'date': date,
                'schedule_id': schedule_id,
                'state': student_data.get('state', 'present'),
            }
            
            if student_data.get('observations'):
                vals['observations'] = student_data['observations']
                
            if student_data.get('check_in_time'):
                vals['check_in_time'] = student_data['check_in_time']
                
            if student_data.get('check_out_time'):
                vals['check_out_time'] = student_data['check_out_time']
            
            attendance_vals.append(vals)
        
        return self.create(attendance_vals)

    @api.model
    def create_employee_daily_attendance(self, employee_ids, date, state='present'):
        """
        Crea registros de asistencia diaria para empleados
        employee_ids: lista de IDs de empleados
        """
        attendance_vals = []
        
        for employee_id in employee_ids:
            vals = {
                'attendance_type': 'employee',
                'employee_id': employee_id,
                'date': date,
                'state': state,
            }
            attendance_vals.append(vals)
        
        return self.create(attendance_vals)

    @api.model
    def create_employee_daily_attendance_bulk(self, date, employees_data):
        """
        Crea registros de asistencia para empleados con datos detallados
        employees_data: lista de diccionarios con {employee_id, state, check_in_time, check_out_time}
        """
        attendance_vals = []
        
        for employee_data in employees_data:
            vals = {
                'attendance_type': 'employee',
                'employee_id': employee_data['employee_id'],
                'date': date,
                'state': employee_data.get('state', 'present'),
            }
            
            if employee_data.get('check_in_time'):
                vals['check_in_time'] = employee_data['check_in_time']
                
            if employee_data.get('check_out_time'):
                vals['check_out_time'] = employee_data['check_out_time']
            
            attendance_vals.append(vals)
        
        return self.create(attendance_vals)

    @api.model
    def register_visitor(self, visitor_data):
        """
        Registra un visitante externo
        visitor_data: diccionario con name, id_number, destination, date, etc.
        """
        vals = {
            'attendance_type': 'visitor',
            'visitor_name': visitor_data['name'],
            'visitor_id_number': visitor_data['id_number'],
            'date': visitor_data.get('date', fields.Date.context_today(self)),
            'state': visitor_data.get('state', 'present'),
        }
        
        if visitor_data.get('destination'):
            vals['visitor_destination'] = visitor_data['destination']
        
        if visitor_data.get('check_in_time'):
            vals['check_in_time'] = visitor_data['check_in_time']
        
        if visitor_data.get('check_out_time'):
            vals['check_out_time'] = visitor_data['check_out_time']
        
        if visitor_data.get('observations'):
            vals['observations'] = visitor_data['observations']
        
        return self.create(vals)

    @api.model
    def get_daily_visitors(self, date=None):
        """
        Obtiene todos los visitantes de un día específico
        """
        if not date:
            date = fields.Date.context_today(self)
        
        return self.search([
            ('attendance_type', '=', 'visitor'),
            ('date', '=', date)
        ], order='check_in_time DESC')
