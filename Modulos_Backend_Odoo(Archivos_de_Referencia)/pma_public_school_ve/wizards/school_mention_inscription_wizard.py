from odoo import _, api, fields, models
from odoo.exceptions import UserError


class SchoolMentionInscriptionWizard(models.TransientModel):
    _name = 'school.mention.inscription.wizard'
    _description = 'Wizard para Inscripción en Mención'

    student_id = fields.Many2one(
        comodel_name='school.student',
        string='Estudiante',
        required=True,
        readonly=True
    )
    
    mention_id = fields.Many2one(
        comodel_name='school.mention',
        string='Mención',
        required=True,
        domain="[('active', '=', True)]",
        help='Seleccione la mención técnica para el estudiante'
    )
    
    parent_id = fields.Many2one(
        comodel_name='res.partner',
        string='Representante',
        required=True,
        help='Representante que autoriza la inscripción en mención'
    )
    
    parent_signature = fields.Binary(
        string='Firma del Representante',
        required=True,
        attachment=True,
        help='Firma autorizando la inscripción en esta mención técnica'
    )
    
    parent_signature_date = fields.Date(
        string='Fecha de Firma',
        required=True,
        default=fields.Date.context_today,
        help='Fecha en que el representante firmó la autorización'
    )
    
    observations = fields.Text(
        string='Observaciones',
        help='Observaciones adicionales sobre la inscripción en mención'
    )
    
    def action_confirm_inscription(self):
        """Confirma la inscripción del estudiante en la mención"""
        self.ensure_one()
        
        if not self.parent_signature:
            raise UserError(
                "Se requiere la firma del representante para inscribir en mención."
            )
        
        if not self.parent_id:
            raise UserError(
                "Debe seleccionar un representante."
            )
        
        # Actualizar estudiante con la mención seleccionada
        self.student_id.write({
            'mention_id': self.mention_id.id,
            'mention_state': 'enrolled',
            'mention_inscription_date': fields.Date.today(),
            'mention_parent_signature': self.parent_signature,
            'mention_parent_signature_date': self.parent_signature_date,
            'mention_observations': self.observations,
        })
        
        return {'type': 'ir.actions.act_window_close'}
