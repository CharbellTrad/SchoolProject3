import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../../../constants/Colors';

export default function SelectRoleScreen() {
  return (
    <>
      <Head>
        <title>Directorio de Personas</title>
      </Head>
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Directorio de Personas</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.instruction}>
            <View style={styles.instructionIconContainer}>
              <Ionicons name="list" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.instructionTitle}>Selecciona una categoría</Text>
            <Text style={styles.instructionText}>
              Elige el tipo de lista que deseas consultar
            </Text>
          </View>

          <View style={styles.rolesContainer}>
            <RoleCard
              icon="school-outline"
              title="Estudiantes"
              description="Lista de estudiantes registrados"
              accentColor="#3b82f6"
              onPress={() => router.push('/admin/academic-management/lists-persons/students-list' as any)}
            />

            <RoleCard
              icon="book-outline"
              title="Docentes"
              description="Lista de profesores del plantel"
              accentColor="#10b981"
              onPress={() => router.push('/admin/academic-management/lists-persons/teachers-list' as any)}
            />

            <RoleCard
              icon="shield-checkmark-outline"
              title="Administrativos"
              description="Personal administrativo"
              accentColor="#f59e0b"
              onPress={() => router.push('/admin/academic-management/lists-persons/administrators-list' as any)}
            />
            
            <RoleCard
              icon="construct-outline"
              title="Obreros"
              description="Personal de mantenimiento"
              accentColor="#6366f1"
              onPress={() => router.push('/admin/academic-management/lists-persons/workman-list' as any)}
            />
            
            <RoleCard
              icon="restaurant-outline"
              title="Comedor"
              description="Personal del comedor escolar"
              accentColor="#8b5cf6"
              onPress={() => router.push('/admin/academic-management/lists-persons/dining-list' as any)}
            />
          </View>

          <View style={styles.infoBox}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.infoText}>
              <Text style={styles.infoTextBold}>Nota:</Text> Estas listas muestran personas registradas. 
              Para usuarios con acceso al sistema, usa "Gestionar Usuarios"
            </Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </>
  );
}

interface RoleCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accentColor: string;
  onPress: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ icon, title, description, accentColor, onPress }) => {
  return (
    <TouchableOpacity 
      style={[styles.roleCard, { borderLeftColor: accentColor }]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[styles.roleIconContainer, { backgroundColor: accentColor + '15' }]}>
        <Ionicons name={icon} size={32} color={accentColor} />
      </View>
      <View style={styles.roleContent}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 60 : 70,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  instruction: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  instructionIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  instructionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  rolesContainer: {
    paddingHorizontal: 20,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
  },
  infoIconWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontWeight: '500',
  },
  infoTextBold: {
    fontWeight: '800',
    color: Colors.primary,
  },
});
