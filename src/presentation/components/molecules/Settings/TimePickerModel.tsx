import { Theme } from "../../theme/colors";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { TimePickerSection } from "../../molecules/Time/TimePickerSection";

export const TimePickerModal = ({
  visible,
  title,
  time,
  onTimeChange,
  onDone,
  onCancel,
}: {
  visible: boolean;
  title: string;
  time: Date;
  onTimeChange: (h: string, m: string, p: string) => void;
  onDone: () => void;
  onCancel: () => void;
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent
    onRequestClose={onCancel}
  >
    <View style={modal.overlay}>
      <View style={modal.sheet}>
        <View style={modal.handle} />
        <View style={modal.header}>
          <TouchableOpacity
            onPress={onCancel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={modal.cancelBtn}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={modal.headerTitle}>{title}</Text>
          <TouchableOpacity
            onPress={onDone}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={modal.doneBtn}>Listo</Text>
          </TouchableOpacity>
        </View>
        <View style={modal.divider} />
        <View style={modal.pickerWrapper}>
          <TimePickerSection
            time={time}
            onTimeChange={(h, m, p) => onTimeChange(h, m, p)}
          />
        </View>
      </View>
    </View>
  </Modal>
);

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: Theme.colors.cardBackground,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Theme.colors.surface,
    opacity: 0.3,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Theme.colors.surface,
    flex: 1,
    textAlign: "center",
  },
  cancelBtn: {
    fontSize: 17,
    color: Theme.colors.surface,
    minWidth: 70,
  },
  doneBtn: {
    fontSize: 17,
    fontWeight: "600",
    color: Theme.colors.surface,
    minWidth: 70,
    textAlign: "right",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Theme.colors.surface,
    opacity: 0.2,
  },
  pickerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
