from odoo import _, api, fields, models



class SchoolRegisterSection(models.Model):
    _name = 'school.register.section'
    _description = 'School Register Section'

    name = fields.Char(string='Nombre', required=True)

    type = fields.Selection(string='Tipo', selection=[
                                    ('secundary', 'Media general'), 
                                    ('primary', 'Primaria'), 
                                    ('pre', 'Preescolar')], required=True)

    subject_ids = fields.Many2many('school.register.subject', 'school_register_subject_section_rel', 'section_id', 'subject_id', string='Materias', domain="[('section_ids', 'in', id)]")
    