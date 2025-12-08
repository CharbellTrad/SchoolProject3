from odoo import _, api, fields, models
from odoo.exceptions import UserError


class SchoolUninscriptionWizard(models.TransientModel):
    _name = 'school.uninscription.wizard'
    _description = 'Wizard para Desinscripción de Estudiante'

    student_id = fields.Many2one(
        comodel_name='school.student',
        string='Estudiante',
        required=True,
        readonly=True
    )
    
    uninscription_reason = fields.Text(
        string='Motivo de Desinscripción',
        required=True,
        help='Describa detalladamente el motivo de la desinscripción'
    )
    
    document_1 = fields.Binary(
        string='Documento 1',
        attachment=True,
        help='Documento de soporte (opcional)'
    )
    document_1_filename = fields.Char(string='Nombre Documento 1')
    
    document_2 = fields.Binary(
        string='Documento 2',
        attachment=True,
        help='Documento de soporte (opcional)'
    )
    document_2_filename = fields.Char(string='Nombre Documento 2')
    
    document_3 = fields.Binary(
        string='Documento 3',
        attachment=True,
        help='Documento de soporte (opcional)'
    )
    document_3_filename = fields.Char(string='Nombre Documento 3')
    
    def action_confirm_uninscription(self):
        """Confirma la desinscripción del estudiante con la información proporcionada"""
        self.ensure_one()
        
        if not self.student_id:
            raise UserError("No se encontró el estudiante para desinscribir.")
        
        # Verificar que el estudiante esté inscrito
        if self.student_id.state != 'done':
            raise UserError("Solo se pueden desinscribir estudiantes que estén inscritos.")
        
        # Guardar la información de desinscripción en el estudiante
        self.student_id.write({
            'state': 'cancel',
            'uninscription_date': fields.Datetime.now(),
            'uninscription_reason': self.uninscription_reason,
            'uninscription_document_1': self.document_1,
            'uninscription_document_1_filename': self.document_1_filename,
            'uninscription_document_2': self.document_2,
            'uninscription_document_2_filename': self.document_2_filename,
            'uninscription_document_3': self.document_3,
            'uninscription_document_3_filename': self.document_3_filename,
        })
        
        return {'type': 'ir.actions.act_window_close'}
