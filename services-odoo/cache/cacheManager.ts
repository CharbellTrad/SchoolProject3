/**
 * Sistema de caché para optimizar peticiones a Odoo
 * Reduce drásticamente los tiempos de carga
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live en milisegundos
  maxSize: number; // Máximo de entradas
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos
  private maxSize = 100;

  /**
   * Obtiene un valor del caché
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar expiración
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    if (__DEV__) {
      const age = Math.round((Date.now() - entry.timestamp) / 1000);
      console.log(`📦 Cache HIT: ${key} (age: ${age}s)`);
    }

    return entry.data as T;
  }

  /**
   * Guarda un valor en el caché
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Limpiar caché si está lleno
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt,
    });

    if (__DEV__) {
      console.log(`💾 Cache SET: ${key} (ttl: ${Math.round((ttl || this.defaultTTL) / 1000)}s)`);
    }
  }

  /**
   * Invalida una entrada específica
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    
    if (__DEV__) {
      console.log(`🗑️ Cache INVALIDATE: ${key}`);
    }
  }

  /**
   * Invalida múltiples entradas por patrón
   */
  invalidatePattern(pattern: string): void {
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (__DEV__) {
      console.log(`🗑️ Cache INVALIDATE PATTERN: ${pattern} (${count} entries)`);
    }
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    
    if (__DEV__) {
      console.log(`🗑️ Cache CLEARED (${size} entries)`);
    }
  }

  /**
   * Elimina la entrada más antigua
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Instancia singleton
export const cacheManager = new CacheManager();

/**
 * Hook para usar caché en operaciones asíncronas
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Intentar obtener del caché
  const cached = cacheManager.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Si no está en caché, ejecutar fetcher
  const data = await fetcher();
  
  // Guardar en caché
  cacheManager.set(key, data, ttl);
  
  return data;
}

/**
 * Genera claves de caché consistentes
 */
export const CacheKeys = {
  // Estudiantes
  students: () => 'students:all',
  student: (id: number) => `student:${id}`,
  studentParents: (id: number) => `student:${id}:parents`,
  studentInscriptions: (id: number) => `student:${id}:inscriptions`,
  
  // ✅ NUEVO: Paginación de estudiantes
  studentsPage: (page: number, pageSize: number) => `students:page:${page}:size:${pageSize}`,
  studentsPaginationMeta: () => 'students:pagination:meta',
  
  // Padres
  parents: () => 'parents:all',
  parent: (id: number) => `parent:${id}`,
  parentSearch: (query: string) => `parent:search:${query.toLowerCase()}`,
  
  // Inscripciones
  inscriptions: () => 'inscriptions:all',
  inscription: (id: number) => `inscription:${id}`,
};
