import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import useScheduleAdapter from '../../../hooks/useScheduleAdapter';

export default function ScheduleScreen() {
  const { schedule, isLoading, handleGenerateSchedule, currentDayActivities } = useScheduleAdapter();

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.activityCard}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{item.assignedStartTime}</Text>
        <Text style={styles.timeTextSmall}>{item.assignedEndTime}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.activityTitle}>{item.activity.title}</Text>
        <Text style={styles.dayBadge}>{item.day}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu Horario</Text>

      {isLoading && !schedule ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={styles.loadingText}>Optimizando tu tiempo...</Text>
        </View>
      ) : (
        <FlatList
          data={currentDayActivities}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleGenerateSchedule} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay actividades programadas todavía.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  loadingText: { marginTop: 10, color: '#6200EE', fontWeight: '500' },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeContainer: {
    borderRightWidth: 2,
    borderRightColor: '#6200EE',
    paddingRight: 15,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70
  },
  timeText: { fontSize: 16, fontWeight: 'bold', color: '#6200EE' },
  timeTextSmall: { fontSize: 12, color: '#666' },
  detailsContainer: { flex: 1, justifyContent: 'center' },
  activityTitle: { fontSize: 18, fontWeight: '600', color: '#222' },
  dayBadge: { fontSize: 12, color: '#888', marginTop: 4, textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 }
});