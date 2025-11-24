import { odooRequest } from './requestHandler';
import { OdooResult } from './types';

/**
 * Busca registros en Odoo y devuelve solo los IDs
 */
export const search = async (
  model: string,
  domain: any[] = [],
  limit: number = 100,
  offset: number = 0
): Promise<OdooResult<number[]>> => {
  return odooRequest<number[]>('/web/dataset/call_kw', {
    model,
    method: 'search',
    args: [domain],
    kwargs: {
      limit,
      offset,
    },
  });
};

/**
 * Busca y lee registros en una sola operación
 */
export const searchRead = async (
  model: string,
  domain: any[] = [],
  fields: string[] = [],
  limit: number = 100,
  offset: number = 0,
  order: string = ''
): Promise<OdooResult<any[]>> => {
  return odooRequest<any[]>('/web/dataset/call_kw', {
    model,
    method: 'search_read',
    args: [],
    kwargs: {
      domain,
      fields,
      limit,
      offset,
      order,
    },
  });
};

/**
 * Lee registros específicos por sus IDs
 */
export const read = async (
  model: string,
  ids: number[],
  fields: string[] = []
): Promise<OdooResult<any[]>> => {
  return odooRequest<any[]>('/web/dataset/call_kw', {
    model,
    method: 'read',
    args: [ids],
    kwargs: {
      fields,
    },
  });
};

/**
 * Cuenta el número de registros que coinciden con el dominio
 */
export const searchCount = async (
  model: string,
  domain: any[] = []
): Promise<OdooResult<number>> => {
  return odooRequest<number>('/web/dataset/call_kw', {
    model,
    method: 'search_count',
    args: [domain],
    kwargs: {},
  });
};

/**
 * Crea un nuevo registro en Odoo
 */
export const create = async (
  model: string,
  values: any
): Promise<OdooResult<number>> => {
  return odooRequest<number>('/web/dataset/call_kw', {
    model,
    method: 'create',
    args: [values],
    kwargs: {},
  });
};

/**
 * Actualiza registros existentes en Odoo
 */
export const update = async (
  model: string,
  ids: number[],
  values: any
): Promise<OdooResult<boolean>> => {
  return odooRequest<boolean>('/web/dataset/call_kw', {
    model,
    method: 'write',
    args: [ids, values],
    kwargs: {},
  });
};

/**
 * Elimina registros de Odoo
 */
export const deleteRecords = async (
  model: string,
  ids: number[]
): Promise<OdooResult<boolean>> => {
  return odooRequest<boolean>('/web/dataset/call_kw', {
    model,
    method: 'unlink',
    args: [ids],
    kwargs: {},
  });
};

/**
 * Llama a un método personalizado de un modelo en Odoo
 */
export const callMethod = async (
  model: string,
  method: string,
  args: any[] = [],
  kwargs: Record<string, any> = {}
): Promise<OdooResult<any>> => {
  return odooRequest('/web/dataset/call_kw', {
    model,
    method,
    args,
    kwargs,
  });
};