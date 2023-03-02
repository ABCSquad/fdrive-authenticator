import { View, Text } from "react-native";

export default function Navbar() {
  return (
    <View className="flex-row">
      <View className="w-auto">
        <Text className="text-black text-xl">FDrive Authenticator</Text>
      </View>
    </View>
  );
}
