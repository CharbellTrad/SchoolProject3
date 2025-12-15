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
    
    year_id = fields.Many2one(
        comodel_name='school.year',
        string='Año Escolar',
        related='student_id.year_id',
        readonly=True
    )
    
    can_enroll = fields.Boolean(
        string='Puede Inscribirse',
        compute='_compute_can_enroll',
        store=False
    )
    
    @api.depends('student_id', 'student_id.can_enroll_mention')
    def _compute_can_enroll(self):
        for record in self:
            record.can_enroll = record.student_id.can_enroll_mention if record.student_id else False
    
    mention_section_id = fields.Many2one(
        comodel_name='school.mention.section',
        string='Mención',
        required=True,
        domain="[('year_id', '=', year_id), ('active', '=', True)]",
        help='Seleccione la mención técnica inscrita en el año escolar'
    )
    
    mention_name = fields.Char(
        string='Nombre de Mención',
        related='mention_section_id.mention_id.name',
        readonly=True
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
        
        if not self.can_enroll:
            raise UserError(
                "El estudiante no puede inscribirse en una mención. "
                "Verifique que la sección tenga habilitado 'Extiende a Medio Técnico'."
            )
        
        if not self.parent_signature:
            raise UserError(
                "Se requiere la firma del representante para inscribir en mención."
            )
        
        if not self.parent_id:
            raise UserError(
                "Debe seleccionar un representante."
            )
        
        # Actualizar estudiante con la mención inscrita
        self.student_id.write({
            'mention_section_id': self.mention_section_id.id,
            'mention_state': 'enrolled',
            'mention_inscription_date': fields.Date.today(),
            'mention_parent_signature': self.parent_signature,
            'mention_parent_signature_date': self.parent_signature_date,
            'mention_observations': self.observations,
        })
        
        return {'type': 'ir.actions.act_window_close'}

