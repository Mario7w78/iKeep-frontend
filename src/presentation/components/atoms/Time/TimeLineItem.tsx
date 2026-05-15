import React from "react";
import { View, StyleSheet, Text } from "react-native";
import {
  ActivityType,
  getActivityName,
  getActivityColor,
  getFontColor,
  getActivityIcon,
} from "../../../utils/activityUtils";
import { AntDesign } from "@expo/vector-icons";

interface TimeLineItemProps {
  time: string;
  title: string;
  subtitle?: string;
  tag: ActivityType;
  isLast?: boolean;
}

export const TimeLineItem = ({
  time,
  title,
  subtitle,
  tag,
  isLast = false,
}: TimeLineItemProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.timelineSection}>
        <View
          style={[
            styles.line,
            isLast && styles.lineUp,
            { backgroundColor: getActivityColor(tag) },
          ]}
        />
        <View style={[styles.dot, { backgroundColor: getActivityColor(tag) }]}>
          <AntDesign
            style={styles.lineIcon}
            name={getActivityIcon(tag)}
            size={16}
            color={getFontColor(tag)}
          />
        </View>
      </View>
      <View
        style={[styles.content, { backgroundColor: getActivityColor(tag) }]}
      >
        <Text style={[styles.timeText, { color: getFontColor(tag) }]}>
          {time}
        </Text>
        <Text style={[styles.title, { color: getFontColor(tag) }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: getFontColor(tag) }]}>
            {subtitle}
          </Text>
        )}
        <View style={styles.tagContainer}>
          <Text style={[styles.tag, { color: getFontColor(tag) }]}>
            {getActivityName(tag)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: 16,
  },
  timelineSection: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  dot: {
    width: 35,
    height: 35,
    borderRadius: 25,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lineIcon: {},
  line: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
  },
  lineUp: {
    bottom: "50%",
  },
  content: {
    flex: 1,
    borderRadius: 15,
    padding: 16,
    marginVertical: 16,
    marginLeft: 12,
    marginRight: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: "#4b170b",
    marginTop: 4,
  },
  tagContainer: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(75, 23, 11, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 8,
  },
  tag: {
    fontSize: 12,
    color: "#4b170b",
    fontWeight: "500",
  },
});
