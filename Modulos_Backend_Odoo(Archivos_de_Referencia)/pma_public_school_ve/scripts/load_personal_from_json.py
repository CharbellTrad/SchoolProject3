#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para cargar personal desde el archivo JSON a hr.employee

Este script puede ejecutarse de dos formas:
1. Desde la línea de comandos de Odoo (shell):
   python odoo-bin shell -d <database> < scripts/load_personal_from_json.py

2. Desde un wizard o acción del servidor dentro de Odoo

Mapeo de columnas JSON -> campos hr.employee:
    0: COD ESTADO           -> (usado para buscar private_state_id)
    1: ESTADO               -> private_state_id (buscar por nombre)
    2: MUNICIPIO            -> municipio
    3: PARROQUIA            -> parroquia
    4: CODIGO DEPENDENCIA   -> codigo_dependencia
    5: CODIGO ESTADISTICO   -> codigo_estadistico
    6: CODIGO DEL PLANTEL   -> codigo_plantel
    7: NOMBRE DEL PLANTEL   -> nombre_plantel_nomina
    8: UBICACIÓN GEOGRÁFICA -> ubicacion_geografica
    9: CODIGO RAC           -> codigo_rac
    10: CARGO               -> job_title (campo nativo hr.employee)
    11: TIPO PERSONAL       -> school_employee_type (mapear A/D/O/C)
    12: CEDULA              -> identification_id
    13: NOMBRES Y APELLIDOS -> name
    14: FECHA DE INGRESO    -> fecha_ingreso_plantel
    15: SEXO                -> gender (F/M -> female/male)
    16: ESPECIALIDAD        -> especialidad_docente
    17: HORAS               -> horas_academicas
    18: TURNO               -> turno_manana, turno_tarde (parsear MAÑANA/TARDE)
    19: ESTATUS             -> situacion_trabajador (mapear ACTIVA -> activo)
    20-21: OBSERVACION      -> observacion_personal
"""

import json
import logging
from datetime import datetime, date

_logger = logging.getLogger(__name__)


def parse_fecha(fecha_str):
    """
    Convierte una fecha string del JSON al formato date de Python.
    Formatos soportados: 'YYYY-MM-DD HH:MM:SS', 'DD/MM/YYYY', 'YYYY-MM-DD'
    """
    if not fecha_str:
        return None
    
    try:
        # Formato del JSON: "2014-09-01 00:00:00"
        if ' ' in fecha_str:
            return datetime.strptime(fecha_str, '%Y-%m-%d %H:%M:%S').date()
        elif '/' in fecha_str:
            return datetime.strptime(fecha_str, '%d/%m/%Y').date()
        else:
            return datetime.strptime(fecha_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        _logger.warning(f"No se pudo parsear la fecha: {fecha_str}")
        return None


def parse_turnos(turno_str):
    """
    Parsea el string de turnos para determinar mañana y tarde.
    Retorna un dict con turno_manana y turno_tarde como booleanos.
    """
    if not turno_str:
        return {'turno_manana': False, 'turno_tarde': False}
    
    turno_lower = turno_str.lower()
    return {
        'turno_manana': 'mañana' in turno_lower or 'manana' in turno_lower,
        'turno_tarde': 'tarde' in turno_lower,
    }


def map_tipo_personal(tipo_str):
    """
    Mapea el tipo de personal del JSON al selection del modelo.
    A = Administrativo, D = Docente, O = Obrero, C = Cenar
    """
    if not tipo_str:
        return 'administrativo'
    
    tipo_upper = tipo_str.strip().upper()
    mapping = {
        'A': 'administrativo',
        'ADMINISTRATIVO': 'administrativo',
        'D': 'docente',
        'DOCENTE': 'docente',
        'O': 'obrero',
        'OBRERO': 'obrero',
        'C': 'cenar',
        'CENAR': 'cenar',
    }
    return mapping.get(tipo_upper, 'administrativo')


def map_sexo(sexo_str):
    """
    Mapea el sexo del JSON al campo gender del modelo.
    """
    if not sexo_str:
        return None
    
    sexo_upper = sexo_str.strip().upper()
    mapping = {
        'F': 'female',
        'FEMENINO': 'female',
        'M': 'male',
        'MASCULINO': 'male',
    }
    return mapping.get(sexo_upper)


def map_estatus(estatus_str):
    """
    Mapea el estatus del JSON al campo situacion_trabajador.
    """
    if not estatus_str:
        return 'activo'
    
    estatus_upper = estatus_str.strip().upper()
    mapping = {
        'ACTIVA': 'activo',
        'ACTIVO': 'activo',
        'REPOSO': 'reposo',
        'PERMISO': 'permiso',
        'JUBILADO': 'jubilado',
        'RETIRADO': 'retirado',
        'SUSPENDIDO': 'suspendido',
    }
    return mapping.get(estatus_upper, 'activo')


def parse_cedula(cedula_str):
    """
    Normaliza el formato de cédula.
    Ejemplo: "V10749113" -> "V10749113"
    """
    if not cedula_str:
        return None
    return cedula_str.strip().upper()


def parse_horas(horas_str):
    """
    Convierte horas string a float.
    """
    if not horas_str:
        return 0.0
    try:
        return float(horas_str)
    except (ValueError, TypeError):
        return 0.0





def get_state_by_name(env, estado_nombre, cod_estado=None):
    """
    Busca el estado (res.country.state) por nombre o código.
    Venezuela country code: 'VE'
    """
    if not estado_nombre and not cod_estado:
        return env['res.country.state']
    
    # Buscar país Venezuela
    venezuela = env['res.country'].search([('code', '=', 'VE')], limit=1)
    if not venezuela:
        return env['res.country.state']
    
    # Buscar por nombre
    if estado_nombre:
        state = env['res.country.state'].search([
            ('country_id', '=', venezuela.id),
            '|',
            ('name', '=ilike', estado_nombre.strip()),
            ('code', '=', cod_estado.strip() if cod_estado else ''),
        ], limit=1)
        return state
    
    return env['res.country.state']


def load_personal_from_json(env, json_path=None, json_data=None, company_id=None):
    """
    Carga los empleados desde el archivo JSON al modelo hr.employee.
    
    Args:
        env: Entorno de Odoo
        json_path: Ruta al archivo JSON (opcional si se proporciona json_data)
        json_data: Datos JSON ya parseados (lista de listas)
        company_id: ID de la compañía (opcional, usa la del usuario actual)
    
    Returns:
        dict con estadísticas de la carga
    """
    # Cargar datos JSON
    if json_data is None and json_path:
        with open(json_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
    
    if not json_data or not isinstance(json_data, list) or len(json_data) < 2:
        return {'error': 'Datos JSON inválidos o vacíos'}
    
    # Primera fila son los encabezados
    headers = json_data[0]
    rows = json_data[1:]
    
    # Obtener compañía
    if company_id:
        company = env['res.company'].browse(company_id)
    else:
        company = env.user.company_id
    
    # Estadísticas
    stats = {
        'total': len(rows),
        'created': 0,
        'updated': 0,
        'skipped': 0,
        'errors': [],
        'duplicates_skipped': 0,
    }
    
    # Conjunto para rastrear cédulas ya procesadas (evitar duplicados)
    cedulas_procesadas = set()
    
    for idx, row in enumerate(rows):
        try:
            # Validar que la fila tenga suficientes columnas
            if len(row) < 14:
                stats['errors'].append(f"Fila {idx + 2}: Columnas insuficientes ({len(row)})")
                stats['skipped'] += 1
                continue
            
            # Extraer datos de la fila (índices ajustados sin NIVEL, MODALIDAD, INGRESO/EGRESO)
            cod_estado = row[0] if len(row) > 0 else None
            estado = row[1] if len(row) > 1 else None
            municipio = row[2] if len(row) > 2 else None
            parroquia = row[3] if len(row) > 3 else None
            codigo_dependencia = row[4] if len(row) > 4 else None
            codigo_estadistico = row[5] if len(row) > 5 else None
            codigo_plantel = row[6] if len(row) > 6 else None
            nombre_plantel = row[7] if len(row) > 7 else None
            ubicacion_geo = row[8] if len(row) > 8 else None
            codigo_rac = row[9] if len(row) > 9 else None
            cargo = row[10] if len(row) > 10 else None
            tipo_personal = row[11] if len(row) > 11 else None
            cedula = row[12] if len(row) > 12 else None
            nombre = row[13] if len(row) > 13 else None
            fecha_ingreso = row[14] if len(row) > 14 else None
            sexo = row[15] if len(row) > 15 else None
            especialidad = row[16] if len(row) > 16 else None
            horas = row[17] if len(row) > 17 else None
            turno = row[18] if len(row) > 18 else None
            estatus = row[19] if len(row) > 19 else None
            observacion = row[20] if len(row) > 20 else None
            observacion2 = row[21] if len(row) > 21 else None
            
            # Validar nombre y cédula requeridos
            if not nombre or not cedula:
                stats['errors'].append(f"Fila {idx + 2}: Nombre o cédula vacíos")
                stats['skipped'] += 1
                continue
            
            # Evitar procesar cédulas duplicadas
            cedula_normalizada = parse_cedula(cedula)
            if cedula_normalizada in cedulas_procesadas:
                stats['duplicates_skipped'] += 1
                continue
            cedulas_procesadas.add(cedula_normalizada)
            
            # Parsear turnos
            turnos_data = parse_turnos(turno)
            
            # Buscar estado
            state_record = get_state_by_name(env, estado, cod_estado)
            
            # Combinar observaciones
            obs_combinada = ''
            if observacion:
                obs_combinada = str(observacion)
            if observacion2:
                if obs_combinada:
                    obs_combinada += '\n' + str(observacion2)
                else:
                    obs_combinada = str(observacion2)
            
            # Preparar valores para el empleado
            employee_vals = {
                'name': nombre.strip().title() if nombre else 'Sin Nombre',
                'identification_id': cedula_normalizada,
                'company_id': company.id,
                
                # Campos personalizados del módulo escolar
                'school_employee_type': map_tipo_personal(tipo_personal),
                'municipio': municipio.strip().title() if municipio else None,
                'parroquia': parroquia.strip().title() if parroquia else None,
                'ubicacion_geografica': ubicacion_geo.strip().title() if ubicacion_geo else None,
                'codigo_dependencia': codigo_dependencia.strip() if codigo_dependencia else None,
                'codigo_estadistico': codigo_estadistico.strip() if codigo_estadistico else None,
                'codigo_plantel': codigo_plantel.strip() if codigo_plantel else None,
                'nombre_plantel_nomina': nombre_plantel.strip() if nombre_plantel else None,
                'codigo_rac': codigo_rac.strip() if codigo_rac else None,
                'especialidad_docente': especialidad.strip() if especialidad else None,
                'horas_academicas': parse_horas(horas),
                'situacion_trabajador': map_estatus(estatus),
                'observacion_personal': obs_combinada if obs_combinada else None,
                
                # Turnos
                'turno_manana': turnos_data['turno_manana'],
                'turno_tarde': turnos_data['turno_tarde'],
                
                # Cargo (campo nativo)
                'job_title': cargo.strip().title() if cargo else None,
            }
            
            # Fecha de ingreso (puede fallar si hay formatos diferentes)
            fecha_parsed = parse_fecha(fecha_ingreso)
            if fecha_parsed:
                employee_vals['fecha_ingreso_plantel'] = fecha_parsed
            
            # Sexo/Género
            gender = map_sexo(sexo)
            if gender:
                employee_vals['gender'] = gender
            
            # Estado privado (si existe)
            if state_record:
                employee_vals['private_state_id'] = state_record.id
            
            # Limpiar valores None
            employee_vals = {k: v for k, v in employee_vals.items() if v is not None}
            
            # Buscar empleado existente por cédula
            existing_employee = env['hr.employee'].search([
                ('identification_id', '=', cedula_normalizada),
                ('company_id', '=', company.id)
            ], limit=1)
            
            if existing_employee:
                # Actualizar empleado existente
                # Remover campos que no deberían actualizarse
                update_vals = {k: v for k, v in employee_vals.items() 
                               if k not in ['name', 'identification_id', 'company_id']}
                existing_employee.write(update_vals)
                stats['updated'] += 1
                _logger.info(f"Empleado actualizado: {nombre} ({cedula_normalizada})")
            else:
                # Crear nuevo empleado
                env['hr.employee'].create(employee_vals)
                stats['created'] += 1
                _logger.info(f"Empleado creado: {nombre} ({cedula_normalizada})")
                
        except Exception as e:
            error_msg = f"Fila {idx + 2}: Error procesando - {str(e)}"
            stats['errors'].append(error_msg)
            _logger.error(error_msg)
            stats['skipped'] += 1
            continue
    
    # Resumen
    _logger.info(f"""
    ===============================================
    RESUMEN DE CARGA DE PERSONAL
    ===============================================
    Total registros en JSON: {stats['total']}
    Empleados creados: {stats['created']}
    Empleados actualizados: {stats['updated']}
    Duplicados omitidos: {stats['duplicates_skipped']}
    Registros con errores: {stats['skipped']}
    ===============================================
    """)
    
    if stats['errors']:
        _logger.warning(f"Errores encontrados ({len(stats['errors'])}):")
        for error in stats['errors'][:10]:  # Mostrar solo primeros 10
            _logger.warning(f"  - {error}")
        if len(stats['errors']) > 10:
            _logger.warning(f"  ... y {len(stats['errors']) - 10} errores más")
    
    return stats


# ===================================================================
# EJECUCIÓN DESDE SHELL DE ODOO
# ===================================================================
# Para ejecutar desde el shell de Odoo:
#
# 1. Iniciar shell:
#    python odoo-bin shell -d <nombre_base_datos>
#
# 2. Ejecutar:
#    >>> from odoo.addons.pma_public_school_ve.scripts.load_personal_from_json import load_personal_from_json
#    >>> result = load_personal_from_json(
#    ...     env,
#    ...     json_path='/ruta/a/personal.json'
#    ... )
#    >>> env.cr.commit()  # Confirmar cambios
#
# ===================================================================

if __name__ == '__main__':
    # Este bloque solo funciona si se ejecuta directamente con el shell de Odoo
    import os
    
    # Ruta al archivo JSON (ajustar según ubicación real)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_file = os.path.join(script_dir, '..', 'models', 'personal.json')
    
    if os.path.exists(json_file):
        print(f"Archivo JSON encontrado: {json_file}")
        print("Ejecute este script desde el shell de Odoo:")
        print(f"  >>> exec(open('{os.path.abspath(__file__)}').read())")
        print("  >>> result = load_personal_from_json(env, json_path=r'{}'".format(json_file))
        print("  >>> env.cr.commit()")
    else:
        print(f"Archivo JSON no encontrado: {json_file}")
