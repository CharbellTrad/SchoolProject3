from odoo import _, api, fields, models
from odoo.exceptions import UserError


class SchoolRegisterSubject(models.Model):
    _name = 'school.register.subject'
    _description = 'School Subject'

    name = fields.Char(string='Nombre', required=True)

    section_ids = fields.Many2many('school.register.section', 'school_register_subject_section_rel', 'subject_id', 'section_id', string='Secciones', domain="[('type', '=', 'secundary')]")

    professor_ids = fields.Many2many('hr.employee', 'school_register_subject_professor_rel', 'subject_id', 'professor_id', string='Profesores')
    
    mention_ids = fields.Many2many(
        comodel_name='school.mention',
        relation='school_mention_subject_rel',
        column1='subject_id',
        column2='mention_id',
        string='Menciones',
        help='Menciones a las que pertenece esta materia'
    )
    
    def unlink(self):
        """Prevent deletion of master subjects with assignments or relationships"""
        for record in self:
            # Check if subject is assigned in any enrolled section
            assigned_subjects = self.env['school.subject'].search([('subject_id', '=', record.id)])
            if assigned_subjects:
                sections = ', '.join(assigned_subjects.mapped('section_id.name'))
                raise UserError(
                    f"No se puede eliminar la materia '{record.name}' porque está asignada en las secciones: {sections}. "
                    f"Elimine primero las asignaciones de esta materia."
                )
            
            # Check for related sections (many2many)
            if record.section_ids:
                raise UserError(
                    f"No se puede eliminar la materia '{record.name}' porque tiene {len(record.section_ids)} "
                    f"sección(es) relacionada(s). Elimine primero las relaciones con secciones."
                )
            
            # Check for related mentions (many2many)
            if record.mention_ids:
                raise UserError(
                    f"No se puede eliminar la materia '{record.name}' porque pertenece a {len(record.mention_ids)} "
                    f"mención(es). Elimine primero las relaciones con menciones."
                )
            
            # Check for related professors (many2many)
            if record.professor_ids:
                raise UserError(
                    f"No se puede eliminar la materia '{record.name}' porque tiene {len(record.professor_ids)} "
                    f"profesor(es) relacionado(s). Elimine primero las relaciones con profesores."
                )
        
        return super().unlink()
