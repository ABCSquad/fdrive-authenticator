import { View, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Entypo";

export default function Device({ name, lastLogin, location }) {
  return (
    <View className="flex-row my-3 ml-3">
      <View className="w-4/5">
        <View className="px-2 py-1 w-full">
          <Text className="text-base font-bold">Device name: {name}</Text>
          <Text className="text-base">Last login: {lastLogin}</Text>
          <Text className="text-base">Location: {location}</Text>
        </View>
      </View>
      <View className="grow items-center justify-center border-l-2 border-border">
        <TouchableOpacity className="bg-white">
          <View className="w-12 h-12 items-center justify-center">
            <Icon name="trash" size={25} color="red" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
