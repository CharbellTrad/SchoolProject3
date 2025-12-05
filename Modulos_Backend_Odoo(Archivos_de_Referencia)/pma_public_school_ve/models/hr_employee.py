from odoo import _, api, fields, models



class HrEmployee(models.Model):
    _inherit = 'hr.employee'


    school_employee_type = fields.Selection(string='tipo de empleado escolar', selection=[
                ('administrativo', 'Administrativo'), 
                ('docente', 'Docente'),
                ('obrero', 'Obrero'),
                ('cenar', 'Cenar'),
            ], required=True)

    subject_ids = fields.Many2many('school.register.subject', 'school_register_subject_professor_rel', 'professor_id', 'subject_id', string='Materias')

    