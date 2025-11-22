import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Head from 'expo-router/head';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../../../constants/Colors';

export default function SelectRoleScreen() {
  return (
    <>
      <Head>
        <title>Seleccionar Tipo de Persona</title>
      </Head>
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registrar Persona</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.instruction}>
            <Ionicons name="information-circle" size={48} color={Colors.primary} />
            <Text style={styles.instructionTitle}>Selecciona el tipo de persona</Text>
            <Text style={styles.instructionText}>
              Elige el rol de la persona que deseas registrar en el sistema
            </Text>
          </View>

          <View style={styles.rolesContainer}>
            <RoleCard
              icon="school"
              title="Matrícula"
              description="Registrar un nuevo estudiante con información académica completa"
              color="#3b82f6"
              onPress={() => router.push('/admin/academic-management/register-person/register-student' as any)}
            />

            <RoleCard
              icon="book"
              title="Docente"
              description="Registrar un docente con su especialización y datos profesionales"
              color="#10b981"
              onPress={() => router.push('/admin/academic-management/register-person?role=teacher' as any)}
            />

            <RoleCard
              icon="shield-checkmark"
              title="Administrador"
              description="Registrar personal administrativo con cargo y responsabilidades"
              color="#f59e0b"
              onPress={() => router.push('/admin/academic-management/register-person?role=admin' as any)}
            />
            <RoleCard
              icon="hammer"
              title="Obrero"
              description="Registrar personal obrero de mantenimiento y servicios generales"
              color="#6366f1"
              onPress={() => router.push('/admin/academic-management/register-person?role=obrero' as any)}
            />
            <RoleCard
              icon="restaurant"
              title="Cenar"
              description="Registrar personal del comedor y servicios de alimentación"
              color="#8b5cf6"
              onPress={() => router.push('/admin/academic-management/register-person?role=cenar' as any)}
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="bulb" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Nota: Este registro es para información de personas en el sistema.
              Si deseas crear un usuario con acceso al sistema, usa la opción "Gestionar Usuarios"
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

interface RoleCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ icon, title, description, color, onPress }) => {
  return (
    <TouchableOpacity style={styles.roleCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.roleIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={40} color={color} />
      </View>
      <View style={styles.roleContent}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  instruction: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  rolesContainer: {
    paddingHorizontal: 20,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  roleIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  roleDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginLeft: 12,
  },
});