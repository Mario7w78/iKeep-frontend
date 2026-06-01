import { Theme } from "../components/theme/colors";
import { AntDesign } from '@expo/vector-icons';
type AntDesignIconName = React.ComponentProps<typeof AntDesign>['name'];


export type ActivityType = "CLASS" | "WORK" | "EXTRA";

export const getActivityColor = (type: ActivityType): string => {
  const colors: Record<ActivityType, string> = {
    CLASS: Theme.comfyColors.green,
    WORK: Theme.comfyColors.orange,
    EXTRA: Theme.comfyColors.skyBlue,
  };

  return colors[type];
};

export const getFontColor = (type: ActivityType): string => {
  const colors: Record<ActivityType, string> = {
    CLASS: Theme.comfyFontColors.green,
    WORK: Theme.comfyFontColors.orange,
    EXTRA: Theme.comfyFontColors.skyBlue,
  };

  return colors[type];
};

export const getActivityName = (type: ActivityType): string => {
  const names: Record<ActivityType, string> = {
    CLASS: "read",
    WORK: "Trabajo",
    EXTRA: "Actividad",
  };

  return names[type];
};

export const getActivityIcon = (type: ActivityType): AntDesignIconName => {
  const names: Record<ActivityType, AntDesignIconName> = {
    CLASS: "book",
    WORK: "shopping",
    EXTRA: "form",
  };

  return names[type];
};