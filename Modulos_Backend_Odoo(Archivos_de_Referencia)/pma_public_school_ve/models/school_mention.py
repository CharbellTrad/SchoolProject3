from odoo import _, api, fields, models
from odoo.exceptions import UserError


class SchoolMention(models.Model):
    _name = 'school.mention'
    _description = 'School Mention (Technical Specialization)'
    _order = 'name'

    name = fields.Char(string='Nombre', required=True, help='Nombre de la mención (ej: Informática, Electricidad)')
    
    code = fields.Char(string='Código', help='Código de identificación de la mención')
    
    active = fields.Boolean(string='Activo', default=True, help='Mención activa o archivada')
    
    description = fields.Text(string='Descripción', help='Descripción detallada de la mención')
    
    subject_ids = fields.Many2many(
        comodel_name='school.register.subject',
        relation='school_mention_subject_rel',
        column1='mention_id',
        column2='subject_id',
        string='Materias',
        help='Materias que pertenecen a esta mención'
    )
    
    student_ids = fields.One2many(
        comodel_name='school.student',
        inverse_name='mention_id',
        string='Estudiantes Inscritos',
        readonly=True,
        help='Estudiantes inscritos en esta mención'
    )
    
    student_count = fields.Integer(
        string='Número de Estudiantes',
        compute='_compute_student_count',
        store=False,
        help='Total de estudiantes inscritos en esta mención'
    )

    _sql_constraints = [
        ('name_unique', 'UNIQUE(name)', 'El nombre de la mención debe ser único.')
    ]

    @api.depends('student_ids')
    def _compute_student_count(self):
        """Calcula el número de estudiantes inscritos en la mención"""
        for record in self:
            # Contar solo estudiantes activos e inscritos
            record.student_count = len(record.student_ids.filtered(
                lambda s: s.current and s.state == 'done'
            ))
    
    def unlink(self):
        """Prevent deletion of mentions with related students or subjects"""
        for record in self:
            # Check for enrolled students
            active_students = record.student_ids.filtered(
                lambda s: s.state != 'cancel'
            )
            if active_students:
                raise UserError(
                    f"No se puede eliminar la mención '{record.name}' porque tiene {len(active_students)} "
                    f"estudiante(s) inscrito(s). Desinscríbalos primero o archive la mención."
                )
            
            # Check for related subjects
            if record.subject_ids:
                raise UserError(
                    f"No se puede eliminar la mención '{record.name}' porque tiene {len(record.subject_ids)} "
                    f"materia(s) relacionada(s). Elimine primero las relaciones con materias."
                )
        
        return super().unlink()
