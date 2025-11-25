import { useCallback, useEffect, useState } from 'react';
import { Inscription, Parent, loadStudentInscriptions, loadStudentParents } from '../services-odoo/personService';

interface UseStudentDetailsProps {
    studentId: number;
    parentIds?: number[];
    inscriptionIds?: number[];
    shouldLoad?: boolean;
}

/**
 * ⚡ Hook para cargar detalles on-demand de un estudiante
 * - SIEMPRE carga desde servidor (NO USA CACHÉ)
 * - Se usa al VER o EDITAR un estudiante
 * - Carga padres e inscripciones de forma independiente
 */
export const useStudentDetails = ({
    studentId,
    parentIds = [],
    inscriptionIds = [],
    shouldLoad = true
}: UseStudentDetailsProps) => {
    const [parents, setParents] = useState<Parent[]>([]);
    const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadedStudentId, setLoadedStudentId] = useState<number | null>(null);

    const loadDetails = useCallback(async () => {
        // Si no debemos cargar, o si ya cargamos ESTE estudiante, no hacer nada
        if (!shouldLoad || !studentId) return;
        if (loadedStudentId === studentId) return;

        setLoading(true);
        setError(null);
        
        // Limpiar datos anteriores para evitar mostrar datos del estudiante previo
        setParents([]);
        setInscriptions([]);

        try {
            if (__DEV__) {
                console.log(`🔄 Cargando detalles on-demand para estudiante ${studentId}`);
            }

            const promises: Promise<any>[] = [];

            // 🌐 Cargar padres si hay IDs (SIEMPRE desde servidor)
            if (parentIds.length > 0) {
                promises.push(loadStudentParents(studentId, parentIds));
            } else {
                promises.push(Promise.resolve([]));
            }

            // 🌐 Cargar inscripciones si hay IDs (SIEMPRE desde servidor)
            if (inscriptionIds.length > 0) {
                promises.push(loadStudentInscriptions(studentId, inscriptionIds));
            } else {
                promises.push(Promise.resolve([]));
            }

            const [loadedParents, loadedInscriptions] = await Promise.all(promises);

            setParents(loadedParents);
            setInscriptions(loadedInscriptions);
            setLoadedStudentId(studentId);

            if (__DEV__) {
                console.log(`✅ Detalles cargados: ${loadedParents.length} padres, ${loadedInscriptions.length} inscripciones`);
            }
        } catch (err: any) {
            if (__DEV__) {
                console.error('❌ Error loading student details:', err);
            }
            setError(err.message || 'Error al cargar detalles');
        } finally {
            setLoading(false);
        }
    }, [studentId, parentIds, inscriptionIds, shouldLoad, loadedStudentId]);

    useEffect(() => {
        loadDetails();
    }, [loadDetails]);

    /**
     * 🔄 Método para recargar manualmente
     * - Fuerza recarga completa desde servidor
     */
    const refreshDetails = useCallback(async () => {
        if (!studentId) return;

        setLoading(true);
        setLoadedStudentId(null); // Forzar recarga

        try {
            if (__DEV__) {
                console.log(`🔄 Refrescando detalles del estudiante ${studentId}`);
            }

            const [p, i] = await Promise.all([
                parentIds.length > 0 ? loadStudentParents(studentId, parentIds) : Promise.resolve([]),
                inscriptionIds.length > 0 ? loadStudentInscriptions(studentId, inscriptionIds) : Promise.resolve([])
            ]);

            setParents(p);
            setInscriptions(i);
            setLoadedStudentId(studentId);

            if (__DEV__) {
                console.log(`✅ Detalles refrescados: ${p.length} padres, ${i.length} inscripciones`);
            }
        } catch (e: any) {
            setError(e.message);
            if (__DEV__) {
                console.error('❌ Error refrescando detalles:', e);
            }
        } finally {
            setLoading(false);
        }
    }, [studentId, parentIds, inscriptionIds]);

    return {
        parents,
        inscriptions,
        loading,
        error,
        refreshDetails
    };
};