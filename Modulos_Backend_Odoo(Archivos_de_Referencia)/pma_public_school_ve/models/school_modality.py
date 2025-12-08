from odoo import fields, models


class SchoolModality(models.Model):
    _name = 'school.modality'
    _description = 'Modalidad Educativa'
    _order = 'sequence, name'

    name = fields.Char(string='Nombre', required=True)
    sequence = fields.Integer(string='Secuencia', default=10)
    active = fields.Boolean(string='Activo', default=True)
