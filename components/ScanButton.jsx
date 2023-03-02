import { View, Text, TouchableOpacity } from "react-native";

export default function Navbar() {
  return (
    <TouchableOpacity className="items-end justify-center">
      <View className="w-14 h-14 rounded-full bg-main items-center justify-center shadow-sm shadow-stone-400">
        <Text className="text-white text-4xl">+</Text>
      </View>
    </TouchableOpacity>
  );
}
