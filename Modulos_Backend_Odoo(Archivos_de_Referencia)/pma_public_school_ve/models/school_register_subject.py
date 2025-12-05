from odoo import _, api, fields, models



class SchoolRegisterSubject(models.Model):
    _name = 'school.register.subject'
    _description = 'School Subject'

    name = fields.Char(string='Nombre', required=True)

    section_ids = fields.Many2many('school.register.section', 'school_register_subject_section_rel', 'subject_id', 'section_id', string='Secciones', domain="[('type', '=', 'secundary')]")

    professor_ids = fields.Many2many('hr.employee', 'school_register_subject_professor_rel', 'subject_id', 'professor_id', string='Profesores')

    