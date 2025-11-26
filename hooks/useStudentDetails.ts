import { useEffect, useState } from 'react';
import { Inscription, Parent, loadStudentInscriptions, loadStudentParents } from '../services-odoo/personService';

interface UseStudentDetailsProps {
    studentId: number;
    parentIds?: number[];
    inscriptionIds?: number[];
    shouldLoad?: boolean;
}

/**
 * ⚡ Hook para cargar detalles on-demand de un estudiante
 * - SIEMPRE carga desde servidor (SIN CACHÉ)
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

    // ✅ useEffect se ejecuta cuando cambian las dependencias
    useEffect(() => {
        // Si no debemos cargar o no hay studentId, limpiar y salir
        if (!shouldLoad || !studentId) {
            setParents([]);
            setInscriptions([]);
            setLoading(false);
            return;
        }

        // Función async dentro del useEffect
        const loadDetails = async () => {
            setLoading(true);
            setError(null);
            
            // Limpiar datos anteriores
            setParents([]);
            setInscriptions([]);

            try {
                if (__DEV__) {
                    console.log(`🔄 Cargando detalles FRESCOS para estudiante ${studentId}`);
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
        };

        loadDetails();

        // ✅ Dependencias: se recarga solo cuando cambian estos valores
    }, [studentId, shouldLoad, parentIds?.length, inscriptionIds?.length]);
    // Nota: Usamos .length en lugar de los arrays completos para evitar comparaciones por referencia

    return {
        parents,
        inscriptions,
        loading,
        error,
    };
};