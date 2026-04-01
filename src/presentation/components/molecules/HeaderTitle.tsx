import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  title: string;
  appName: string;
}

export const HeaderTitle = ({ title, appName }: Props) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{title}</Text>
    <Text style={styles.headerApp}>{appName}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  headerApp: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#6200EE' 
  },
});