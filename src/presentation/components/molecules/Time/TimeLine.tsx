import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { TimeLineItem } from "../../atoms/Time/TimeLineItem";
import { Fade } from "../../atoms/Common/Fade";

interface TimeLineProps {
  children?: React.ReactNode;
}

export const TimeLine = ({}: TimeLineProps) => {
  return (
    <View style={styles.container}>
      <Fade>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <TimeLineItem
            time="7:00 - 13:00"
            title="ITLAB"
            subtitle="Actividad laboral en ITLAB"
            tag="WORK"
          />
          <TimeLineItem
            time="15:00 - 20:00"
            title="Ing Soft 2"
            subtitle="Seccion 623 - I205"
            tag="CLASS"
          />
          <TimeLineItem
            time="16:00 - 30:00"
            title="Morir"
            subtitle="siempre"
            tag="EXTRA"
            isLast
          />
        </ScrollView>
      </Fade>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 80,
  },
});
