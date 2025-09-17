import * as Font from "expo-font";

export async function loadFonts() {
  await Font.loadAsync({
    PoppinsRegular: require("../../assets/fonts/Poppins/Poppins-Regular.ttf"),
    PoppinsBold: require("../../assets/fonts/Poppins/Poppins-Bold.ttf"),
  });
}
