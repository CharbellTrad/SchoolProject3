import { useCallback, useEffect, useState } from 'react';
import { Inscription, Parent, loadStudentInscriptions, loadStudentParents } from '../services-odoo/personService';

interface UseStudentDetailsProps {
    studentId: number;
    parentIds?: number[];
    inscriptionIds?: number[];
    shouldLoad?: boolean;
}

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
        // Si no debemos cargar, o si ya cargamos ESTE estudiante, no hacer nada.
        if (!shouldLoad || !studentId) return;
        if (loadedStudentId === studentId) return;

        setLoading(true);
        setError(null);
        // Limpiar datos anteriores para evitar mostrar datos del estudiante previo mientras carga
        setParents([]);
        setInscriptions([]);

        try {
            const promises: Promise<any>[] = [];

            // Cargar padres si hay IDs
            if (parentIds.length > 0) {
                promises.push(loadStudentParents(studentId, parentIds));
            } else {
                promises.push(Promise.resolve([]));
            }

            // Cargar inscripciones si hay IDs
            if (inscriptionIds.length > 0) {
                promises.push(loadStudentInscriptions(studentId, inscriptionIds));
            } else {
                promises.push(Promise.resolve([]));
            }

            const [loadedParents, loadedInscriptions] = await Promise.all(promises);

            setParents(loadedParents);
            setInscriptions(loadedInscriptions);
            setLoadedStudentId(studentId);
        } catch (err: any) {
            console.error('Error loading student details:', err);
            setError(err.message || 'Error al cargar detalles');
        } finally {
            setLoading(false);
        }
    }, [studentId, parentIds, inscriptionIds, shouldLoad, loadedStudentId]);

    useEffect(() => {
        loadDetails();
    }, [loadDetails]);

    // Método para recargar manualmente
    const refreshDetails = useCallback(() => {
        if (!studentId) return;

        setLoading(true);
        setLoadedStudentId(null); // Forzar recarga

        Promise.all([
            parentIds.length > 0 ? loadStudentParents(studentId, parentIds) : Promise.resolve([]),
            inscriptionIds.length > 0 ? loadStudentInscriptions(studentId, inscriptionIds) : Promise.resolve([])
        ]).then(([p, i]) => {
            setParents(p);
            setInscriptions(i);
            setLoadedStudentId(studentId);
            setLoading(false);
        }).catch(e => {
            setError(e.message);
            setLoading(false);
        });
    }, [studentId, parentIds, inscriptionIds]);

    return {
        parents,
        inscriptions,
        loading,
        error,
        refreshDetails
    };
};
