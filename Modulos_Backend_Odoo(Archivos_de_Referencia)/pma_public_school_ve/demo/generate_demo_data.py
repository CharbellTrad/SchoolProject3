#!/usr/bin/env python3
"""
Script to generate massive demo data for Odoo school module.
Generates: ~700 students, 50 professors, 12 evaluations per section with all students graded.

IMPORTANT: 
- Media General uses BASE-100 scores (50-100 range for passing) - system auto-converts to base-20
- Primaria uses LITERAL grades (A-E)
- Preescolar uses OBSERVATIONS
"""

import random
from datetime import date, timedelta

random.seed(42)  # Fixed seed for reproducible results

# Venezuelan names
FIRST_NAMES_M = ["José", "Carlos", "Luis", "Miguel", "Antonio", "Francisco", "Juan", "Pedro", "Rafael", "Manuel", 
                 "Andrés", "Diego", "Gabriel", "Daniel", "David", "Alejandro", "Fernando", "Eduardo", "Ricardo", "Jorge",
                 "Sebastián", "Nicolás", "Martín", "Santiago", "Leonardo", "Cristian", "Víctor", "Ángel", "Jesús", "Oscar",
                 "Pablo", "Adrián", "Enrique", "Ramón", "Alberto", "Sergio", "Héctor", "Roberto", "Gustavo", "Alfredo"]

FIRST_NAMES_F = ["María", "Ana", "Carmen", "Isabel", "Rosa", "Patricia", "Laura", "Claudia", "Luisa", "Gabriela",
                 "Andrea", "Carolina", "Valentina", "Sofía", "Daniela", "Camila", "Isabella", "Fernanda", "Paula", "Adriana",
                 "Natalia", "Victoria", "Mariana", "Vanessa", "Diana", "Mónica", "Paola", "Estefanía", "Ximena", "Alejandra",
                 "Lucía", "Emma", "Valeria", "Catalina", "Tatiana", "Génesis", "Yorgelis", "Mileidy", "Yulimar", "Mariangel"]

LAST_NAMES = ["García", "Rodríguez", "Martínez", "López", "González", "Hernández", "Pérez", "Sánchez", "Ramírez", "Torres",
              "Flores", "Rivera", "Gómez", "Díaz", "Reyes", "Morales", "Cruz", "Ortiz", "Gutiérrez", "Ramos",
              "Mendoza", "Vargas", "Castillo", "Fernández", "Jiménez", "Rojas", "Medina", "Castro", "Delgado", "Suárez",
              "Romero", "Ruiz", "Paredes", "Navarro", "Silva", "Chávez", "Contreras", "Velásquez", "Briceño", "Colmenares"]

CITIES = ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay", "Barcelona", "Ciudad Guayana", "Maturín"]

STREETS = ["Av. Principal", "Calle", "Urbanización", "Residencias", "Sector", "Bloque", "Torre", "Quinta"]

# Valid section references - using lists for round-robin assignment
SECTIONS_PRE = [
    ('section_preescolar_1_a', 'pre'),
    ('section_preescolar_2_a', 'pre'),
    ('section_preescolar_3_a', 'pre'),
]

SECTIONS_PRIMARY = [
    ('section_primaria_1_a', 'primary'),
    ('section_primaria_1_b', 'primary'),
    ('section_primaria_2_a', 'primary'),
    ('section_primaria_2_b', 'primary'),
    ('section_primaria_3_a', 'primary'),
    ('section_primaria_4_a', 'primary'),
    ('section_primaria_5_a', 'primary'),
    ('section_primaria_6_a', 'primary'),
]

SECTIONS_SECUNDARY = [
    ('section_media_1_a', 'secundary'),
    ('section_media_1_b', 'secundary'),
    ('section_media_2_a', 'secundary'),
    ('section_media_2_b', 'secundary'),
    ('section_media_3_b', 'secundary'),
    ('section_media_4_a', 'secundary'),
    ('section_media_5_a', 'secundary'),
]

# ORIGINAL students from school_enrollment_demo.xml (ID -> section_ref)
ORIGINAL_STUDENTS = {
    'student_sofia_preescolar': 'section_preescolar_1_a',
    'student_matias_preescolar': 'section_preescolar_2_a',
    'student_lucia_preescolar': 'section_preescolar_3_a',
    'student_andres_primaria': 'section_primaria_1_a',
    'student_valentina_primaria': 'section_primaria_3_a',
    'student_diego_media': 'section_media_1_a',
    'student_gabriel_media': 'section_media_1_a',
    'student_carolina_media': 'section_media_3_b',
    'student_luis_media': 'section_media_4_a',
    'student_mariajose_media': 'section_media_5_a',
    'student_emma_preescolar': 'section_preescolar_1_a',
    'student_santiago_preescolar': 'section_preescolar_2_a',
    'student_daniela_preescolar': 'section_preescolar_3_a',
    'student_sebastian_primaria': 'section_primaria_1_b',
    'student_camila_primaria': 'section_primaria_2_b',
    'student_nicolas_primaria': 'section_primaria_4_a',
    'student_isabella_primaria': 'section_primaria_5_a',
    'student_martin_primaria': 'section_primaria_6_a',
    'student_valeria_media': 'section_media_1_b',
    'student_alejandro_media': 'section_media_2_b',
    'student_adriana_media': 'section_media_3_b',
    'student_eduardo_media': 'section_media_4_a',
    'student_fernanda_media': 'section_media_5_a',
    'student_andres_felipe_media': 'section_media_5_a',
    'student_paula_media': 'section_media_4_a',
}

# Valid departments
VALID_DEPARTMENTS = ['dept_academico', 'dept_ciencias', 'dept_humanidades', 'dept_tecnico']

def generate_name(sex):
    first = random.choice(FIRST_NAMES_M if sex == 'M' else FIRST_NAMES_F)
    second = random.choice(FIRST_NAMES_M if sex == 'M' else FIRST_NAMES_F)
    last1 = random.choice(LAST_NAMES)
    last2 = random.choice(LAST_NAMES)
    return f"{first} {second} {last1} {last2}"

def generate_phone():
    prefix = random.choice(["412", "414", "416", "424", "426"])
    return f"+58 {prefix} {random.randint(100,999)}-{random.randint(1000,9999)}"

def generate_email(name):
    parts = name.lower().replace('á','a').replace('é','e').replace('í','i').replace('ó','o').replace('ú','u').replace('ñ','n').split()
    return f"{parts[0][0]}.{parts[2]}@email.com"

def generate_address():
    street = random.choice(STREETS)
    city = random.choice(CITIES)
    num = random.randint(1, 100)
    return f"{street} #{num}", city

def generate_vat(start):
    return str(start + random.randint(0, 999999))

def generate_birth_date(min_age, max_age):
    today = date(2024, 9, 1)
    days_ago = random.randint(min_age * 365, max_age * 365)
    return today - timedelta(days=days_ago)

# Track students per section for evaluations
students_by_section = {}

# Initialize with original students
for student_id, section_ref in ORIGINAL_STUDENTS.items():
    if section_ref not in students_by_section:
        students_by_section[section_ref] = []
    students_by_section[section_ref].append(student_id)

def generate_representatives(count, start_id=14):
    xml = "\n        <!-- ============================================== -->\n"
    xml += "        <!-- REPRESENTANTES ADICIONALES GENERADOS         -->\n"
    xml += "        <!-- ============================================== -->\n\n"
    
    for i in range(count):
        rep_id = start_id + i
        sex = random.choice(['M', 'F'])
        name = generate_name(sex)
        phone = generate_phone()
        email = generate_email(name)
        street, city = generate_address()
        vat = generate_vat(24000000 + i * 100)
        
        xml += f'''        <record id="partner_representante_{rep_id}" model="res.partner">
            <field name="name">{name}</field>
            <field name="type_enrollment">parent</field>
            <field name="phone">{phone}</field>
            <field name="email">{email}</field>
            <field name="street">{street}</field>
            <field name="city">{city}</field>
            <field name="nationality">V</field>
            <field name="vat">{vat}</field>
        </record>
        
'''
    return xml

def generate_students(count, start_id=26, start_rep=14, num_reps=250):
    global students_by_section
    
    xml = "\n        <!-- ============================================== -->\n"
    xml += "        <!-- ESTUDIANTES ADICIONALES GENERADOS            -->\n"
    xml += "        <!-- ============================================== -->\n\n"
    
    # Distribute students across levels
    preescolar_count = int(count * 0.15)  # 15% preescolar
    primaria_count = int(count * 0.40)    # 40% primaria
    media_count = count - preescolar_count - primaria_count  # 45% media
    
    student_data = []
    current_id = start_id
    
    # Preescolar (ages 3-6)
    for i in range(preescolar_count):
        sex = random.choice(['M', 'F'])
        name = generate_name(sex)
        vat = generate_vat(33000000 + i * 10)
        birth = generate_birth_date(3, 6)
        rep_id = start_rep + (i % num_reps)
        section_ref, section_type = SECTIONS_PRE[i % len(SECTIONS_PRE)]
        _, city = generate_address()
        
        xml += f'''        <record id="partner_estudiante_{current_id}" model="res.partner">
            <field name="name">{name}</field>
            <field name="type_enrollment">student</field>
            <field name="is_enrollment" eval="True"/>
            <field name="nationality">E</field>
            <field name="vat">{vat}</field>
            <field name="sex">{sex}</field>
            <field name="born_date">{birth}</field>
            <field name="city">{city}</field>
            <field name="parent_id" ref="partner_representante_{rep_id}"/>
            <field name="parents_ids" eval="[(6, 0, [ref('partner_representante_{rep_id}')])]"/>
        </record>
        
'''
        student_data.append((current_id, section_ref, section_type, rep_id))
        
        # Track by section using student_enrolled_X format
        student_ref = f"student_enrolled_{current_id}"
        if section_ref not in students_by_section:
            students_by_section[section_ref] = []
        students_by_section[section_ref].append(student_ref)
        
        current_id += 1
    
    # Primaria (ages 6-12)
    for i in range(primaria_count):
        sex = random.choice(['M', 'F'])
        name = generate_name(sex)
        vat = generate_vat(32000000 + i * 10)
        birth = generate_birth_date(6, 12)
        rep_id = start_rep + ((preescolar_count + i) % num_reps)
        section_ref, section_type = SECTIONS_PRIMARY[i % len(SECTIONS_PRIMARY)]
        _, city = generate_address()
        
        xml += f'''        <record id="partner_estudiante_{current_id}" model="res.partner">
            <field name="name">{name}</field>
            <field name="type_enrollment">student</field>
            <field name="is_enrollment" eval="True"/>
            <field name="nationality">E</field>
            <field name="vat">{vat}</field>
            <field name="sex">{sex}</field>
            <field name="born_date">{birth}</field>
            <field name="city">{city}</field>
            <field name="parent_id" ref="partner_representante_{rep_id}"/>
            <field name="parents_ids" eval="[(6, 0, [ref('partner_representante_{rep_id}')])]"/>
        </record>
        
'''
        student_data.append((current_id, section_ref, section_type, rep_id))
        
        student_ref = f"student_enrolled_{current_id}"
        if section_ref not in students_by_section:
            students_by_section[section_ref] = []
        students_by_section[section_ref].append(student_ref)
        
        current_id += 1
    
    # Media General (ages 12-18)
    for i in range(media_count):
        sex = random.choice(['M', 'F'])
        name = generate_name(sex)
        vat = generate_vat(31000000 + i * 10)
        birth = generate_birth_date(12, 18)
        rep_id = start_rep + ((preescolar_count + primaria_count + i) % num_reps)
        section_ref, section_type = SECTIONS_SECUNDARY[i % len(SECTIONS_SECUNDARY)]
        _, city = generate_address()
        
        xml += f'''        <record id="partner_estudiante_{current_id}" model="res.partner">
            <field name="name">{name}</field>
            <field name="type_enrollment">student</field>
            <field name="is_enrollment" eval="True"/>
            <field name="nationality">V</field>
            <field name="vat">{vat}</field>
            <field name="sex">{sex}</field>
            <field name="born_date">{birth}</field>
            <field name="city">{city}</field>
            <field name="parent_id" ref="partner_representante_{rep_id}"/>
            <field name="parents_ids" eval="[(6, 0, [ref('partner_representante_{rep_id}')])]"/>
        </record>
        
'''
        student_data.append((current_id, section_ref, section_type, rep_id))
        
        student_ref = f"student_enrolled_{current_id}"
        if section_ref not in students_by_section:
            students_by_section[section_ref] = []
        students_by_section[section_ref].append(student_ref)
        
        current_id += 1
    
    return xml, student_data

def generate_professors(count, start_id=20):
    xml = "\n        <!-- ============================================== -->\n"
    xml += "        <!-- PROFESORES ADICIONALES GENERADOS             -->\n"
    xml += "        <!-- ============================================== -->\n\n"
    
    job_titles = [
        ("Profesor de Matemáticas", "dept_ciencias", "subject_matematica_media"),
        ("Profesora de Física", "dept_ciencias", "subject_fisica"), 
        ("Profesor de Química", "dept_ciencias", "subject_quimica"),
        ("Profesora de Biología", "dept_ciencias", "subject_biologia"),
        ("Profesor de Castellano", "dept_humanidades", "subject_castellano"),
        ("Profesora de Historia", "dept_humanidades", "subject_historia"),
        ("Profesor de Geografía", "dept_humanidades", "subject_geografia"),
        ("Profesora de Inglés", "dept_humanidades", "subject_ingles"),
        ("Maestro de Educación Integral", "dept_academico", None),
        ("Maestra de Educación Inicial", "dept_academico", None),
        ("Docente de Informática", "dept_tecnico", "subject_informatica"),
    ]
    
    for i in range(count):
        emp_id = start_id + i
        sex = random.choice(['M', 'F'])
        name = generate_name(sex)
        email = generate_email(name).replace("@email.com", "@escuela.edu.ve")
        job_title, dept, subject = random.choice(job_titles)
        
        subject_line = ""
        if subject:
            subject_line = f'\n            <field name="subject_ids" eval="[(6, 0, [ref(\'{subject}\')])]"/>'
        
        xml += f'''        <record id="employee_prof_gen_{emp_id}" model="hr.employee">
            <field name="name">{name}</field>
            <field name="school_employee_type">docente</field>
            <field name="job_title">{job_title}</field>
            <field name="department_id" ref="{dept}"/>{subject_line}
            <field name="work_email">{email}</field>
        </record>
        
'''
    return xml

def generate_enrollments(student_data, start_id=26):
    xml = "\n        <!-- ============================================== -->\n"
    xml += "        <!-- INSCRIPCIONES ADICIONALES GENERADAS          -->\n"
    xml += "        <!-- ============================================== -->\n\n"
    
    for student_id, section_ref, section_type, rep_id in student_data:
        if section_type == 'pre':
            height = round(random.uniform(0.90, 1.10), 2)
            weight = round(random.uniform(15, 22), 1)
            pants = random.randint(4, 8)
            shoes = random.randint(24, 30)
            shirt = random.choice(['xs', 's'])
        elif section_type == 'primary':
            height = round(random.uniform(1.10, 1.55), 2)
            weight = round(random.uniform(22, 45), 1)
            pants = random.randint(8, 14)
            shoes = random.randint(28, 38)
            shirt = random.choice(['s', 'm', 'l'])
        else:
            height = round(random.uniform(1.50, 1.85), 2)
            weight = round(random.uniform(45, 75), 1)
            pants = random.randint(28, 40)
            shoes = random.randint(36, 45)
            shirt = random.choice(['m', 'l', 'xl'])
        
        inscription_date = f"2024-09-{random.randint(1, 15):02d}"
        
        xml += f'''        <record id="student_enrolled_{student_id}" model="school.student">
            <field name="year_id" ref="school_year_2024_2025"/>
            <field name="section_id" ref="{section_ref}"/>
            <field name="student_id" ref="partner_estudiante_{student_id}"/>
            <field name="parent_id" ref="partner_representante_{rep_id}"/>
            <field name="height">{height}</field>
            <field name="weight">{weight}</field>
            <field name="size_shirt">{shirt}</field>
            <field name="size_pants">{pants}</field>
            <field name="size_shoes">{shoes}</field>
            <field name="state">done</field>
            <field name="inscription_date">{inscription_date}</field>
            <field name="parent_siganture_date">{inscription_date}</field>
        </record>
        
'''
    return xml

def generate_evaluations_and_scores():
    """Generate 12 evaluations per section with scores for ALL students."""
    global students_by_section
    
    xml = "\n        <!-- ============================================== -->\n"
    xml += "        <!-- EVALUACIONES Y CALIFICACIONES GENERADAS      -->\n"
    xml += "        <!-- ============================================== -->\n\n"
    
    eval_id = 1
    score_id = 1
    
    professor_assignments = {
        'section_media_1_a': 'professor_matematica_media',
        'section_media_1_b': 'professor_matematica_media',
        'section_media_2_a': 'professor_fisica',
        'section_media_2_b': 'professor_fisica',
        'section_media_3_b': 'professor_quimica',
        'section_media_4_a': 'professor_biologia',
        'section_media_5_a': 'professor_castellano',
        'section_primaria_1_a': 'professor_primaria_1',
        'section_primaria_1_b': 'professor_primaria_1',
        'section_primaria_2_a': 'professor_primaria_2',
        'section_primaria_2_b': 'professor_primaria_2',
        'section_primaria_3_a': 'professor_primaria_3',
        'section_primaria_4_a': 'professor_primaria_4',
        'section_primaria_5_a': 'professor_primaria_5',
        'section_primaria_6_a': 'professor_primaria_6',
        'section_preescolar_1_a': 'professor_preescolar_1',
        'section_preescolar_2_a': 'professor_preescolar_2',
        'section_preescolar_3_a': 'professor_preescolar_3',
    }
    
    # Subject assignments by section (matching demo data - only use existing subjects)
    # Available: matematica_1a, 1b, 3b, 4a, 5a - use matematica_1a for sections without specific subject
    subject_assignments = {
        'section_media_1_a': 'subject_matematica_1a',
        'section_media_1_b': 'subject_matematica_1b',
        'section_media_2_a': 'subject_matematica_1a',  # No subject_matematica_2a exists
        'section_media_2_b': 'subject_matematica_1a',  # No subject_matematica_2b exists
        'section_media_3_b': 'subject_matematica_3b',
        'section_media_4_a': 'subject_matematica_4a',
        'section_media_5_a': 'subject_matematica_5a',
    }
    
    evaluation_names = [
        "Evaluación Diagnóstica",
        "Primer Parcial",
        "Segundo Parcial",
        "Tercer Parcial",
        "Examen de Recuperación",
        "Trabajo Práctico 1",
        "Trabajo Práctico 2",
        "Exposición Grupal",
        "Proyecto de Investigación",
        "Examen Final",
        "Taller Evaluado",
        "Actividad Integradora",
    ]
    
    literals = ['A', 'B', 'C', 'D', 'E']
    literal_weights = [0.4, 0.3, 0.2, 0.08, 0.02]
    
    observations = [
        "El estudiante demuestra un excelente desempeño en las actividades planteadas.",
        "Muestra buen progreso en su desarrollo integral.",
        "Participa activamente en las actividades grupales.",
        "Se observa avance en sus habilidades motoras y cognitivas.",
        "Requiere apoyo adicional en algunas áreas específicas.",
        "Demuestra creatividad en sus trabajos.",
        "Mantiene buenas relaciones con sus compañeros.",
        "Se integra bien en las dinámicas de clase.",
    ]
    
    total_students_graded = 0
    
    print("\nStudents per section:")
    for section, students in sorted(students_by_section.items()):
        print(f"  {section}: {len(students)} students")
    print()
    
    for section_ref, student_ids in students_by_section.items():
        if not student_ids:
            continue
            
        professor_ref = professor_assignments.get(section_ref, 'professor_matematica_media')
        subject_ref = subject_assignments.get(section_ref, None)
        
        # Determine section type
        if 'preescolar' in section_ref:
            section_type = 'pre'
        elif 'primaria' in section_ref:
            section_type = 'primary'
        else:
            section_type = 'secundary'
        
        # Create 12 evaluations per section
        for eval_num in range(12):
            eval_name = evaluation_names[eval_num % len(evaluation_names)]
            eval_date = f"2024-{10 + (eval_num // 4):02d}-{(eval_num % 28) + 1:02d}"
            
            # Add subject_id only for Media General sections
            subject_line = ""
            if subject_ref and section_type == 'secundary':
                subject_line = f'\n            <field name="subject_id" ref="{subject_ref}"/>'
            
            xml += f'''        <record id="eval_gen_{eval_id}" model="school.evaluation">
            <field name="name">{eval_name} - {section_ref.replace("section_", "").replace("_", " ").title()}</field>
            <field name="description">&lt;p&gt;Evaluación del período académico 2024-2025.&lt;/p&gt;</field>
            <field name="year_id" ref="school_year_2024_2025"/>
            <field name="professor_id" ref="{professor_ref}"/>
            <field name="section_id" ref="{section_ref}"/>{subject_line}
            <field name="evaluation_date">{eval_date}</field>
        </record>
        
'''
            
            # Create scores for ALL students in this section
            for student_ref in student_ids:
                if section_type == 'pre':
                    # Preescolar uses observations ONLY
                    obs = random.choice(observations)
                    xml += f'''        <record id="score_gen_{score_id}" model="school.evaluation.score">
            <field name="evaluation_id" ref="eval_gen_{eval_id}"/>
            <field name="student_id" ref="{student_ref}"/>
            <field name="observation">&lt;p&gt;{obs}&lt;/p&gt;</field>
        </record>
        
'''
                elif section_type == 'primary':
                    # Primary uses LITERAL grades (A-E) - weighted towards better grades
                    literal = random.choices(literals, weights=literal_weights)[0]
                    xml += f'''        <record id="score_gen_{score_id}" model="school.evaluation.score">
            <field name="evaluation_id" ref="eval_gen_{eval_id}"/>
            <field name="student_id" ref="{student_ref}"/>
            <field name="literal_type">{literal}</field>
        </record>
        
'''
                else:
                    # SECUNDARY uses BASE-20 scores (10-20 for passing, 5-9 for failing)
                    if random.random() < 0.95:  # 95% pass
                        score = random.randint(10, 20)
                    else:  # 5% fail
                        score = random.randint(5, 9)
                    
                    xml += f'''        <record id="score_gen_{score_id}" model="school.evaluation.score">
            <field name="evaluation_id" ref="eval_gen_{eval_id}"/>
            <field name="student_id" ref="{student_ref}"/>
            <field name="score">{score}</field>
        </record>
        
'''
                score_id += 1
                total_students_graded += 1
            
            eval_id += 1
    
    return xml, eval_id - 1, score_id - 1, total_students_graded

def generate_scores_for_original_evals():
    """Generate scores for generated students in original demo evaluations."""
    global students_by_section
    
    xml = "\n        <!-- ============================================== -->\n"
    xml += "        <!-- SCORES FOR GENERATED STUDENTS IN ORIGINAL EVALS -->\n"
    xml += "        <!-- ============================================== -->\n\n"
    
    # Original evaluations from school_evaluations_demo.xml (eval_id, section_ref, type)
    original_evals = [
        ('eval_matematica_1a_1', 'section_media_1_a', 'secundary'),
        ('eval_matematica_1a_2', 'section_media_1_a', 'secundary'),
        ('eval_fisica_1a_1', 'section_media_1_a', 'secundary'),
        ('eval_castellano_1a_1', 'section_media_1_a', 'secundary'),
        ('eval_matematica_3b_1', 'section_media_3_b', 'secundary'),
        ('eval_fisica_3b_1', 'section_media_3_b', 'secundary'),
        ('eval_matematica_4a_1', 'section_media_4_a', 'secundary'),
        ('eval_fisica_4a_1', 'section_media_4_a', 'secundary'),
        ('eval_circuitos_4a_1', 'section_media_4_a', 'secundary'),
        ('eval_matematica_5a_1', 'section_media_5_a', 'secundary'),
        ('eval_programacion_5a_1', 'section_media_5_a', 'secundary'),
        ('eval_contabilidad_5a_1', 'section_media_5_a', 'secundary'),
        ('eval_primaria_1a_1', 'section_primaria_1_a', 'primary'),
        ('eval_primaria_3a_1', 'section_primaria_3_a', 'primary'),
        ('eval_primaria_4a_1', 'section_primaria_4_a', 'primary'),
        ('eval_primaria_5a_1', 'section_primaria_5_a', 'primary'),
        ('eval_primaria_6a_1', 'section_primaria_6_a', 'primary'),
        ('eval_preescolar_1a_1', 'section_preescolar_1_a', 'pre'),
        ('eval_preescolar_2a_1', 'section_preescolar_2_a', 'pre'),
        ('eval_preescolar_3a_1', 'section_preescolar_3_a', 'pre'),
    ]
    
    literals = ['A', 'B', 'C', 'D', 'E']
    literal_weights = [0.4, 0.3, 0.2, 0.08, 0.02]
    
    observations = [
        "El estudiante demuestra un excelente desempeño en las actividades planteadas.",
        "Muestra buen progreso en su desarrollo integral.",
        "Participa activamente en las actividades grupales.",
        "Se observa avance en sus habilidades motoras y cognitivas.",
    ]
    
    score_id = 10001  # Start with high ID to avoid conflicts
    total_scores = 0
    
    for eval_ref, section_ref, section_type in original_evals:
        if section_ref not in students_by_section:
            continue
            
        # Get only GENERATED students (those starting with "student_enrolled_")
        student_ids = [s for s in students_by_section[section_ref] if s.startswith('student_enrolled_')]
        
        for student_ref in student_ids:
            if section_type == 'pre':
                obs = random.choice(observations)
                xml += f'''        <record id="score_orig_{score_id}" model="school.evaluation.score">
            <field name="evaluation_id" ref="{eval_ref}"/>
            <field name="student_id" ref="{student_ref}"/>
            <field name="observation">&lt;p&gt;{obs}&lt;/p&gt;</field>
        </record>
        
'''
            elif section_type == 'primary':
                literal = random.choices(literals, weights=literal_weights)[0]
                xml += f'''        <record id="score_orig_{score_id}" model="school.evaluation.score">
            <field name="evaluation_id" ref="{eval_ref}"/>
            <field name="student_id" ref="{student_ref}"/>
            <field name="literal_type">{literal}</field>
        </record>
        
'''
            else:
                # Secundary - base 20
                if random.random() < 0.95:
                    score = random.randint(10, 20)
                else:
                    score = random.randint(5, 9)
                
                xml += f'''        <record id="score_orig_{score_id}" model="school.evaluation.score">
            <field name="evaluation_id" ref="{eval_ref}"/>
            <field name="student_id" ref="{student_ref}"/>
            <field name="score">{score}</field>
        </record>
        
'''
            score_id += 1
            total_scores += 1
    
    return xml, total_scores

def main():
    print("Generating demo data...")
    print(f"Original students tracked: {len(ORIGINAL_STUDENTS)}")
    
    # Generate representatives
    reps_xml = generate_representatives(250, start_id=14)
    print("Generated 250 representatives")
    
    # Generate students
    students_xml, student_data = generate_students(700, start_id=26, start_rep=14, num_reps=250)
    print(f"Generated {len(student_data)} new students")
    
    # Generate professors
    profs_xml = generate_professors(40, start_id=20)
    print("Generated 40 professors")
    
    # Generate enrollments
    enrollments_xml = generate_enrollments(student_data, start_id=26)
    print(f"Generated {len(student_data)} enrollments")
    
    # Generate evaluations and scores
    evals_xml, eval_count, score_count, graded_count = generate_evaluations_and_scores()
    print(f"Generated {eval_count} evaluations and {score_count} scores")
    print(f"Total student grades: {graded_count}")
    
    # Generate scores for original demo evaluations
    orig_scores_xml, orig_score_count = generate_scores_for_original_evals()
    print(f"Generated {orig_score_count} scores for original demo evaluations")
    
    # Write files
    with open("school_students_generated.xml", "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<odoo>\n')
        f.write(reps_xml)
        f.write(students_xml)
        f.write('\n</odoo>')
    print("Written: school_students_generated.xml")
    
    with open("school_employees_generated.xml", "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<odoo>\n')
        f.write(profs_xml)
        f.write('\n</odoo>')
    print("Written: school_employees_generated.xml")
    
    with open("school_enrollment_generated.xml", "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<odoo>\n')
        f.write(enrollments_xml)
        f.write('\n</odoo>')
    print("Written: school_enrollment_generated.xml")
    
    with open("school_evaluations_generated.xml", "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<odoo>\n')
        f.write(evals_xml)
        f.write(orig_scores_xml)  # Add scores for original evals
        f.write('\n</odoo>')
    print("Written: school_evaluations_generated.xml")
    
    print("\n" + "="*50)
    print("SUMMARY")
    print("="*50)
    print(f"Representatives: 250 new")
    print(f"Students: {len(student_data)} new + {len(ORIGINAL_STUDENTS)} original = {len(student_data) + len(ORIGINAL_STUDENTS)} total")
    print(f"Professors: 40 new")
    print(f"Enrollments: {len(student_data)}")
    print(f"Evaluations: {eval_count} new (12 per section)")
    print(f"Scores: {score_count} new + {orig_score_count} for original evals = {score_count + orig_score_count} total")

if __name__ == "__main__":
    main()
