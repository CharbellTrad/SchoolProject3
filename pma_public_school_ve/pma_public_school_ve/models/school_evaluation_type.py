from odoo import _, api, fields, models


class SchoolEvaluationType(models.Model):
    _name = 'school.evaluation.type'
    _description = 'school evaluation type'

    type = fields.Selection(string='Tipo', selection=[
                                    ('secundary', 'Media general'), 
                                    ('primary', 'Primaria'), 
                                    ('pre', 'Preescolar')], required=True)

    type_evaluation = fields.Selection(string='Tipo', selection=[('20', 'En base a 20'), 
                                                        ('100', 'En base a 100'), 
                                                        ('literal', 'Literal'), 
                                                        ('observation', 'Observación')], required=True)
    
    min_score = fields.Char(string='Mínima aprobatoria', compute="_compute_min_score" )
    

    @api.depends('type_evaluation')
    def _compute_min_score(self):
        for rec in self:
            if  rec.type_evaluation == '20':
                rec.min_score = '10'
            elif rec.type_evaluation == '100':
                rec.min_score = '50'
            elif rec.type_evaluation == 'literal':
                rec.min_score == 'C'
            else:
                rec.min_score = ''

    name = fields.Char(string='Nombre', compute="_compute_name", store=True)

    @api.depends('type_evaluation')
    def _compute_name(self):
        for rec in self:
            rec.name = dict(self._fields['type_evaluation'].selection).get(rec.type_evaluation, ' ')
    
    
                                                        



# if 'C' < 'D':
#     print('Reprobaste')