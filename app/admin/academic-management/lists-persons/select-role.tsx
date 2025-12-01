import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Colors from '../../../../constants/Colors';


export default function SelectRoleScreen() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent />   
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
                disabled={false}
                onPress={() => router.push('/admin/academic-management/lists-persons/students-list' as any)}
              />


              <RoleCard
                icon="book-outline"
                title="Docentes"
                description="Lista de profesores del plantel"
                accentColor="#10b981"
                disabled={true}
                onPress={() => router.push('/admin/academic-management/lists-persons/teachers-list' as any)}
              />


              <RoleCard
                icon="shield-checkmark-outline"
                title="Administrativos"
                description="Personal administrativo"
                accentColor="#f59e0b"
                disabled={true}
                onPress={() => router.push('/admin/academic-management/lists-persons/administrators-list' as any)}
              />
              
              <RoleCard
                icon="construct-outline"
                title="Obreros"
                description="Personal de mantenimiento"
                accentColor="#6366f1"
                disabled={true}
                onPress={() => router.push('/admin/academic-management/lists-persons/workman-list' as any)}
              />
              
              <RoleCard
                icon="restaurant-outline"
                title="Comedor"
                description="Personal del comedor escolar"
                accentColor="#8b5cf6"
                disabled={true}
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
    </SafeAreaProvider>
  );
}


interface RoleCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accentColor: string;
  disabled?: boolean;
  onPress: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ icon, title, description, accentColor, disabled, onPress }) => {

  const handlePress = () => {
    if (disabled) {
      showAlert(
        'Error',
        'Esta función esta deshabilitada o requiere conexión a internet.'
      );
      return;
    }
    onPress();
  };

  return (
    <TouchableOpacity 
      style={[ styles.roleCard, disabled && styles.cardDisabled ]} 
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <View style={[styles.roleIconContainer, { backgroundColor: disabled ? '#f3f4f6' : accentColor + '15' }]}>
        <Ionicons name={icon} size={32} color={disabled ? Colors.textSecondary : accentColor}  />
      </View>
      <View style={styles.roleContent}>
        <Text style={[styles.roleTitle, disabled && styles.cardTitleDisabled]}>{title}</Text>
        <Text style={styles.roleDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />

      {disabled && (
        <View style={styles.disabledIndicator}>
          <Ionicons name="cloud-offline-outline" size={16} color={Colors.textSecondary} />
        </View>
      )}

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
      }
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
      }
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      }
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
    marginBottom: 50,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
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
  cardDisabled: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  cardTitleDisabled: {
    color: Colors.textSecondary,
  },
  disabledIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});
