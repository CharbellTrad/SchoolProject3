from odoo import fields, models


class SchoolEducationLevel(models.Model):
    _name = 'school.education.level'
    _description = 'Nivel Educativo'
    _order = 'sequence, name'

    name = fields.Char(string='Nombre', required=True)
    sequence = fields.Integer(string='Secuencia', default=10)
    active = fields.Boolean(string='Activo', default=True)
