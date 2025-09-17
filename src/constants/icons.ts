import { ImageSourcePropType } from "react-native";

export const subscriptionIcons: Record<string, ImageSourcePropType> = {
  netflix: require("../../assets/subscriptions/netflix.png"),
  spotify: require("../../assets/subscriptions/spotify.png"),
  icloud: require("../../assets/subscriptions/icloud.png"),
  disney: require("../../assets/subscriptions/disney.png"),
  prime: require("../../assets/subscriptions/prime.png"),
  youtube: require("../../assets/subscriptions/youtube.png"),
  chatgpt: require("../../assets/subscriptions/chatgpt.png"),
  kindle: require("../../assets/subscriptions/kindle.png"),
  googleone: require("../../assets/subscriptions/googleone.png"),
  x: require("../../assets/subscriptions/x.png"),
  default: require("../../assets/subscriptions/default.png"),
};


export function getIconKeyForName(name: string): keyof typeof subscriptionIcons {
  const key = name.toLowerCase();
  if (subscriptionIcons[key]) return key as keyof typeof subscriptionIcons;
  return "default";
}
