from odoo import _, api, fields, models
from odoo.exceptions import UserError



class SchoolProfessor(models.Model):
    _name = 'school.professor'
    _description = 'School Professor'

    def _default_year(self):
        year_id = self.env['school.year'].search([('current', '=', True)], limit=1)
        return year_id.id if year_id else False

    name = fields.Char(string='Nombre', compute='_compute_name', store=True)

    @api.depends('professor_id', 'year_id')
    def _compute_name(self):
        for record in self:
            if record.professor_id and record.year_id:
                record.name = f"Docente {record.professor_id.name}"
            else:
                record.name = ''

    professor_id = fields.Many2one(comodel_name='hr.employee', string='Profesor', domain="[('school_employee_type', '=', 'docente'), ('active', '!=', False), ('id','not in', used_professor_ids)]", required=True)

    used_professor_ids = fields.Many2many(comodel_name='hr.employee', string='Profesores utilizados', compute='_compute_used_professor_ids')

    @api.depends('year_id')
    def _compute_used_professor_ids(self):
        for record in self:
            if record.year_id:
                professor_ids = self.env['school.professor'].search([
                    ('year_id', '=', record.year_id.id)
                ]).mapped('professor_id.id')
                record.used_professor_ids = professor_ids
            else:
                record.used_professor_ids = []


    year_id = fields.Many2one(comodel_name='school.year', string='Año escolar', required=True, default=_default_year)

    subject_ids = fields.Many2many(comodel_name='school.register.subject', string='Materias', domain="[('professor_ids', 'in', [professor_id])]",)

    section_ids = fields.Many2many('school.section',  'school_section_professor_rel', 'professor_id', 'section_id', string='Secciones', domain="[('year_id', '=', year_id), ('type', '!=', 'secundary' )]")

    current = fields.Boolean(string='Actual', related='year_id.current', store=True)
    
    def unlink(self):
        """Prevent deletion of professors with assigned subjects, evaluations, or sections"""
        for record in self:
            # Check for assigned subjects
            assigned_subjects = self.env['school.subject'].search([('professor_id', '=', record.id)])
            if assigned_subjects:
                sections = ', '.join(assigned_subjects.mapped('section_id.name'))
                raise UserError(
                    f"No se puede eliminar el profesor '{record.name}' porque tiene materias asignadas en las secciones: {sections}. "
                    f"Elimine primero las asignaciones de materias."
                )
            
            # Check for created evaluations
            evaluations = self.env['school.evaluation'].search([('professor_id', '=', record.id)])
            if evaluations:
                raise UserError(
                    f"No se puede eliminar el profesor '{record.name}' porque tiene {len(evaluations)} "
                    f"evaluación(ones) creada(s). Elimine primero las evaluaciones."
                )
            
            # Check for assigned sections (many2many)
            if record.section_ids:
                section_names = ', '.join(record.section_ids.mapped('name'))
                raise UserError(
                    f"No se puede eliminar el profesor '{record.name}' porque está asignado a las secciones: {section_names}. "
                    f"Elimine primero las asignaciones de secciones."
                )
        
        return super().unlink()
