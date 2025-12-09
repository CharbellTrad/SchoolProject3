/**
 * Dashboard UI Components
 * Reusable UI components for the admin dashboard
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Colors from '../../../constants/Colors';

// ==================== CARD ====================
interface CardProps {
    title?: string;
    children: React.ReactNode;
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ title, children, style }) => (
    <View style={[styles.card, style]}>
        {title && <Text style={styles.cardTitle}>{title}</Text>}
        {children}
    </View>
);

// ==================== SEPARATOR ====================
interface SeparatorProps {
    title: string;
}

export const Separator: React.FC<SeparatorProps> = ({ title }) => (
    <Text style={styles.separator}>{title}</Text>
);

// ==================== STAT CARD ====================
interface StatCardProps {
    value: number | string;
    label: string;
    color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, color = Colors.primary }) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// ==================== KPI CARD ====================
interface KPICardProps {
    icon: keyof typeof Ionicons.glyphMap;
    value: number | string;
    label: string;
    color: string;
    loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ icon, value, label, color, loading }) => (
    <View style={styles.kpiCard}>
        <View style={[styles.kpiIcon, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.kpiValue}>{loading ? '—' : value}</Text>
        <Text style={styles.kpiLabel}>{label}</Text>
    </View>
);

// ==================== EMPTY STATE ====================
export const Empty: React.FC<{ message?: string }> = ({ message = 'Sin datos disponibles' }) => (
    <View style={styles.empty}>
        <Ionicons name="analytics-outline" size={40} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>{message}</Text>
    </View>
);

// ==================== INFO NOTE ====================
interface InfoNoteProps {
    message: string;
}

export const InfoNote: React.FC<InfoNoteProps> = ({ message }) => (
    <View style={styles.infoNote}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
        <Text style={styles.infoText}>{message}</Text>
    </View>
);

// ==================== BADGE ====================
interface BadgeProps {
    value: number | string;
    color?: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const Badge: React.FC<BadgeProps> = ({ value, color = Colors.primary, icon }) => (
    <View style={[styles.badge, { backgroundColor: color + '15' }]}>
        {icon && <Ionicons name={icon} size={12} color={color} />}
        <Text style={[styles.badgeText, { color }]}>{value}</Text>
    </View>
);

// ==================== LIST ROW ====================
interface ListRowProps {
    children: React.ReactNode;
    borderBottom?: boolean;
}

export const ListRow: React.FC<ListRowProps> = ({ children, borderBottom = true }) => (
    <View style={[styles.listRow, borderBottom && styles.listRowBorder]}>
        {children}
    </View>
);

// ==================== STUDENT AVATAR ====================
interface StudentAvatarProps {
    name: string;
    color?: string;
    size?: number;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({ name, color = Colors.primary, size = 40 }) => (
    <View style={[styles.avatar, { width: size, height: size, backgroundColor: color + '15' }]}>
        <Text style={[styles.avatarText, { color, fontSize: size * 0.4 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
);

// ==================== RANK BADGE ====================
interface RankBadgeProps {
    rank: number;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank }) => {
    const isTop3 = rank <= 3;
    const medals = ['🥇', '🥈', '🥉'];

    return (
        <View style={[styles.rankBadge, isTop3 && styles.rankBadgeTop]}>
            <Text style={[styles.rankText, isTop3 && styles.rankTextTop]}>
                {isTop3 ? medals[rank - 1] : rank}
            </Text>
        </View>
    );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
    // Card
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },

    // Separator
    separator: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 10, marginTop: 8 },

    // Stat Card
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    statValue: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
    statLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },

    // KPI Card
    kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    kpiIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    kpiValue: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
    kpiLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },

    // Empty
    empty: { alignItems: 'center', paddingVertical: 32, gap: 12 },
    emptyText: { fontSize: 13, color: Colors.textTertiary },

    // Info Note
    infoNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundSecondary, padding: 12, borderRadius: 10, gap: 10 },
    infoText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

    // Badge
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    badgeText: { fontSize: 11, fontWeight: '700' },

    // List Row
    listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    listRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },

    // Avatar
    avatar: { borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontWeight: '700' },

    // Rank Badge
    rankBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' },
    rankBadgeTop: { backgroundColor: Colors.warning + '20' },
    rankText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
    rankTextTop: { fontSize: 16 },
});
