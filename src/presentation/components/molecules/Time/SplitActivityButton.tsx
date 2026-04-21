import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { Theme } from "../../theme/colors";
import { AntDesign } from "@expo/vector-icons";
import { PartitionConfig } from "../../../hooks/props";

interface Props {
  partitions: PartitionConfig[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
}

export default function SplitActivityButton({
  partitions,
  activeIndex,
  onSelect,
  onAdd,
}: Props) {
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        {partitions.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onSelect(index)}
            style={{
              backgroundColor:
                activeIndex === index
                  ? Theme.colors.lightPrimary
                  : Theme.colors.lightBackground,
              paddingHorizontal: 15,
              paddingVertical: 5,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: Theme.colors.veryLightPrimary,
            }}
          >
            <Text
              style={{
                color: Theme.colors.surface,
                fontWeight: "bold",
              }}
            >
              {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={onAdd}
          style={{
            backgroundColor: Theme.colors.lightBackground,
            width: 30,
            height: 30,
            borderRadius: 50,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: Theme.colors.veryLightPrimary,
          }}
        >
          <AntDesign name="plus" size={12} color={Theme.colors.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
}