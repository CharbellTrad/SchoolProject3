{
    'name': 'Sistema educativo público',
    'version': '19.0.0.1',
    'description': 'Gestión de escuelas públicas, estudiantes, docentes y materias. En Venezuela',
    'summary': 'Módulo para la gestión de escuelas públicas en Odoo. En Venezuela',
    'author': "Pozzomire'z Agency",
    'license': 'OPL-1',
    'category': 'Education',
    'depends': [
        'base', 'contacts', 'hr'
    ],
    'data': [
        'data/school_evaluation_type_data.xml',
        'data/school_time_slot_data.xml',
        'security/ir.model.access.csv',
        'views/school_register_employee_view.xml',
        'views/school_register_partner_view.xml',
        'views/school_register_section_view.xml',
        'views/school_register_subject_view.xml',
        'views/school_professor_view.xml',
        'views/school_section_view.xml',
        'views/school_student_view.xml',
        'views/school_evaluation_view.xml',
        'views/school_year_view.xml',
        'views/school_attendance_view.xml',
        'views/school_schedule_view.xml',
        'views/school_time_slot_view.xml',
        'views/menu.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'pma_public_school_ve/static/src/**/*',
        ],
    },
    'application': True
}


