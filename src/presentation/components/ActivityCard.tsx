import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue } from 'react-native-reanimated';
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
  
  const renderRightActions = (progress: SharedValue<number>, dragX: SharedValue<number>) => {
    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton]} onPress={onEdit}>
          <MaterialIcons name="edit" size={24} color="#6C5CE7" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton]} onPress={onDelete}>
          <MaterialIcons name="delete" size={24} color="#6C5CE7" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ReanimatedSwipeable renderRightActions={renderRightActions} friction={2}>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="shower" size={24} color="#6C5CE7" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.timeText}>{time}</Text>
          <Text style={styles.titleText}>{title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#6C5CE7" />
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
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
    marginVertical: 8,
    marginRight: 16,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    borderRadius: 12,
    marginLeft: 2,
    marginRight: 10,
  },
  actionText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});