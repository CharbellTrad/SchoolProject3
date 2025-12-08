from odoo import _, api, fields, models
from odoo.exceptions import UserError


class SchoolSectionLetter(models.Model):
    _name = 'school.section.letter'
    _description = 'School Section Letter'
    _order = 'name'

    name = fields.Char(string='Letra', required=True, help='Letra de la sección (A, B, C, etc.)')

    _sql_constraints = [
        ('name_unique', 'UNIQUE(name)', 'La letra de la sección debe ser única.')
    ]
    
    def unlink(self):
        """Prevent deletion of section letters being used by master sections"""
        for record in self:
            sections_using_letter = self.env['school.register.section'].search([('letter_id', '=', record.id)])
            if sections_using_letter:
                section_names = ', '.join(sections_using_letter.mapped('display_name'))
                raise UserError(
                    f"No se puede eliminar la letra '{record.name}' porque está siendo usada por las secciones: {section_names}. "
                    f"Elimine primero la letra de estas secciones."
                )
        
        return super().unlink()
