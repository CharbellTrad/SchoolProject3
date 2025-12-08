from odoo import _, api, fields, models
from odoo.exceptions import UserError
import logging


class SchoolSubject(models.Model):
    _name = 'school.subject'
    _description = 'School Subject'

    _rec_name = 'subject_id'

    section_id = fields.Many2one(comodel_name='school.section', string='Sección', required=True)

    year_id = fields.Many2one(comodel_name='school.year', string='Año escolar', related='section_id.year_id', store=True)

    subject_id = fields.Many2one(comodel_name='school.register.subject', string='Materia', domain="[('id', 'in', available_subject_ids)]", required=True)

    available_subject_ids = fields.Many2many(comodel_name='school.register.subject', string='Materias disponibles', compute='_compute_available_subject_ids')

    @api.depends('section_id.subject_ids', 'section_id')
    def _compute_available_subject_ids(self):
        for record in self:
            section_id = record.section_id.section_id.id

            if not isinstance(section_id, int):
                try:
                    section_id = int(str(record.section_id.section_id.id).replace('NewId_', ''))
                except:
                    section_id = 0
                


            all_subject_ids = self.env['school.register.subject'].search([('section_ids', 'in', [section_id])])
            used_subject_ids = self.section_id.subject_ids.mapped('subject_id.id')
            record.available_subject_ids = list(set(all_subject_ids.ids) - set(used_subject_ids))

    professor_id = fields.Many2one(comodel_name='school.professor', domain="[('id', 'in', available_professor_ids)]", string='Profesor', required=True)

    available_professor_ids = fields.Many2many(comodel_name='school.professor', string='Profesores disponibles', compute='_compute_available_professor_ids')

    @api.depends('subject_id', 'year_id')
    def _compute_available_professor_ids(self):
        for record in self:
            professor_ids = self.env['school.professor'].search([('subject_ids', 'in', [record.subject_id.id]), ('year_id', '=', record.year_id.id)])
            record.available_professor_ids = professor_ids.ids if professor_ids else []
    
    def unlink(self):
        """Prevent deletion of assigned subjects with evaluations or scores"""
        for record in self:
            # Check for related evaluations
            evaluations = self.env['school.evaluation'].search([('subject_id', '=', record.id)])
            if evaluations:
                raise UserError(
                    f"No se puede eliminar la materia asignada '{record.subject_id.name}' de la sección '{record.section_id.name}' "
                    f"porque tiene {len(evaluations)} evaluación(ones) registrada(s). Elimine primero las evaluaciones."
                )
            
            # Check for evaluation scores
            scores = self.env['school.evaluation.score'].search([('subject_id', '=', record.id)])
            if scores:
                raise UserError(
                    f"No se puede eliminar la materia asignada '{record.subject_id.name}' de la sección '{record.section_id.name}' "
                    f"porque tiene {len(scores)} puntaje(s) de evaluación registrado(s). Elimine primero los puntajes."
                )
        
        return super().unlink()
