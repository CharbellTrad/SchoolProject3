from odoo import _, api, fields, models
from odoo.exceptions import UserError


class SchoolEvaluationType(models.Model):
    _name = 'school.evaluation.type'
    _description = 'school evaluation type'

    type = fields.Selection(string='Tipo', selection=[
                                    ('secundary', 'Media general'), 
                                    ('primary', 'Primaria'), 
                                    ('pre', 'Preescolar')], required=True)

    type_evaluation = fields.Selection(string='Tipo de Evaluación', selection=[
                                                        ('20', 'En base a 20'), 
                                                        ('literal', 'Literal'), 
                                                        ('observation', 'Observación')], required=True)
    
    min_score = fields.Char(string='Mínima aprobatoria', compute="_compute_min_score")
    

    @api.depends('type_evaluation')
    def _compute_min_score(self):
        for rec in self:
            if rec.type_evaluation == '20':
                rec.min_score = '10'
            elif rec.type_evaluation == 'literal':
                rec.min_score = 'C'
            else:
                rec.min_score = ''

    name = fields.Char(string='Nombre', compute="_compute_name", store=True)

    @api.depends('type_evaluation')
    def _compute_name(self):
        for rec in self:
            rec.name = dict(self._fields['type_evaluation'].selection).get(rec.type_evaluation, ' ')
    
    def unlink(self):
        """Prevent deletion of evaluation types being used in school years"""
        for record in self:
            # Check if evaluation type is used as secondary evaluation mechanism
            years_secundary = self.env['school.year'].search([('evalution_type_secundary', '=', record.id)])
            if years_secundary:
                year_names = ', '.join(years_secundary.mapped('name'))
                raise UserError(
                    f"No se puede eliminar el tipo de evaluación '{record.name}' porque está configurado como mecanismo de "
                    f"evaluación de Media General en los años escolares: {year_names}."
                )
            
            # Check if evaluation type is used as primary evaluation mechanism
            years_primary = self.env['school.year'].search([('evalution_type_primary', '=', record.id)])
            if years_primary:
                year_names = ', '.join(years_primary.mapped('name'))
                raise UserError(
                    f"No se puede eliminar el tipo de evaluación '{record.name}' porque está configurado como mecanismo de "
                    f"evaluación de Primaria en los años escolares: {year_names}."
                )
            
            # Check if evaluation type is used as preschool evaluation mechanism
            years_pree = self.env['school.year'].search([('evalution_type_pree', '=', record.id)])
            if years_pree:
                year_names = ', '.join(years_pree.mapped('name'))
                raise UserError(
                    f"No se puede eliminar el tipo de evaluación '{record.name}' porque está configurado como mecanismo de "
                    f"evaluación de Preescolar en los años escolares: {year_names}."
                )
        
        return super().unlink()
    
    
                                                        



# if 'C' < 'D':
#     print('Reprobaste')