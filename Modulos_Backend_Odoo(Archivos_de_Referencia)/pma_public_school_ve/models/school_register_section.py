from odoo import _, api, fields, models
from odoo.exceptions import UserError


class SchoolRegisterSection(models.Model):
    _name = 'school.register.section'
    _description = 'School Register Section'

    name = fields.Char(string='Nombre', required=True)

    type = fields.Selection(string='Tipo', selection=[
                                    ('secundary', 'Media general'), 
                                    ('primary', 'Primaria'), 
                                    ('pre', 'Preescolar')], required=True)

    letter_id = fields.Many2one('school.section.letter', string='Letra', help='Letra de la sección (A, B, C, etc.)')

    display_name = fields.Char(string='Nombre Completo', compute='_compute_display_name', store=True)

    subject_ids = fields.Many2many('school.register.subject', 'school_register_subject_section_rel', 'section_id', 'subject_id', string='Materias', domain="[('section_ids', 'in', id)]")

    @api.depends('name', 'letter_id')
    def _compute_display_name(self):
        for record in self:
            if record.letter_id:
                record.display_name = f"{record.name} {record.letter_id.name}"
            else:
                record.display_name = record.name
    
    def unlink(self):
        """Prevent deletion of master sections with enrollments or subjects"""
        for record in self:
            # Check if section is enrolled in any school year
            enrolled_sections = self.env['school.section'].search([('section_id', '=', record.id)])
            if enrolled_sections:
                years = ', '.join(enrolled_sections.mapped('year_id.name'))
                raise UserError(
                    f"No se puede eliminar la sección '{record.display_name}' porque está inscrita en los años escolares: {years}. "
                    f"Elimine primero las secciones inscritas."
                )
            
            # Check for related subjects (many2many)
            if record.subject_ids:
                raise UserError(
                    f"No se puede eliminar la sección '{record.display_name}' porque tiene {len(record.subject_ids)} "
                    f"materia(s) relacionada(s). Elimine primero las relaciones con materias."
                )
        
        return super().unlink()
