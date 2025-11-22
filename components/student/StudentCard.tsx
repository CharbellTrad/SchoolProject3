import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { listStyles } from '../../constants/Styles';
import { Student } from '../../services-odoo/personService';

interface StudentCardProps {
  student: Student;
  onView: () => void;
  onEdit: () => void;
}

export const StudentCard: React.FC<StudentCardProps> = React.memo(({ student, onView, onEdit }) => {
  return (
    <View style={listStyles.card}>
      <View style={listStyles.cardMain}>
        <View style={listStyles.avatarContainer}>
          {student.image_1920 ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${student.image_1920}` }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
          ) : (
            <Ionicons name="person" size={28} color={Colors.primary} />
          )}
        </View>

        <View style={listStyles.cardInfo}>
          <Text style={listStyles.cardName} numberOfLines={1}>
            {student.name}
          </Text>
          <Text style={listStyles.cardDetail}>
            <Ionicons name="card" size={14} color={Colors.textSecondary} /> {student.nationality}-{student.vat}
          </Text>
        </View>

        <View
          style={[
            listStyles.statusBadge,
            {
              backgroundColor: student.is_active ? Colors.success + '15' : Colors.error + '15',
            },
          ]}
        >
          <Text
            style={[
              listStyles.statusText,
              { color: student.is_active ? Colors.success : Colors.error },
            ]}
          >
            {student.is_active ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      <View style={listStyles.cardActions}>
        <TouchableOpacity style={listStyles.actionButton} onPress={onView}>
          <Ionicons name="eye-outline" size={20} color={Colors.primary} />
          <Text style={listStyles.actionButtonText}>Ver</Text>
        </TouchableOpacity>

        <TouchableOpacity style={listStyles.actionButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color={Colors.secondary} />
          <Text style={[listStyles.actionButtonText, { color: Colors.secondary }]}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.student.id === nextProps.student.id &&
    prevProps.student.name === nextProps.student.name &&
    prevProps.student.is_active === nextProps.student.is_active &&
    prevProps.student.vat === nextProps.student.vat
  );
});
