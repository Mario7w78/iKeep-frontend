import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

type ActivityCardProps = {
  title: string;
  time: string;
  onPress: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

export default function ActivityCard({ title, time, onPress, onDelete, onEdit }: ActivityCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="shower" size={24} color="#6C5CE7" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.timeText}>{time}</Text>
          <Text style={styles.titleText}>{title}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowActions(!showActions)}>
          <Ionicons name={showActions ? 'chevron-up' : 'ellipsis-vertical'} size={24} color="#6C5CE7" />
        </TouchableOpacity>
      </TouchableOpacity>

      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => { onEdit(); setShowActions(false); }}>
            <MaterialIcons name="edit" size={20} color="#6C5CE7" />
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => { onDelete(); setShowActions(false); }}>
            <MaterialIcons name="delete" size={20} color="#E74C3C" />
            <Text style={[styles.actionText, { color: '#E74C3C' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  actionText: {
    color: '#6C5CE7',
    fontWeight: '600',
    fontSize: 14,
  },
});