import { useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const buttonRef = useRef(null);

  const handleScanButtonPress = () => {
    setShowDropdown(!showDropdown);
  };

  const handleOptionButtonPress = (option) => {
    console.log(option);
    setShowDropdown(false);
  };

  return (
    <>
      <TouchableOpacity
        className="items-end justify-center"
        ref={buttonRef}
        onPress={handleScanButtonPress}
      >
        <View className="w-14 h-14 rounded-full bg-main items-center justify-center shadow-sm shadow-stone-400">
          <Text className="text-white text-4xl">+</Text>
        </View>
      </TouchableOpacity>
      <Modal
        visible={showDropdown}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          className={`flex-1 justify-center items-center bg-opacity-50 fixed`}
          onPress={() => setShowDropdown(false)}
        >
          <View className="bg-gray-200 p-4 rounded-md w-full">
            <TouchableOpacity
              onPress={() => handleOptionButtonPress(1)}
              className="items-end"
            >
              <Text className="text-gray-900 font-medium text-lg py-2">
                Scan a QR code
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleOptionButtonPress(2)}
              className="items-end"
            >
              <Text className="text-gray-900 font-medium text-lg py-2">
                Choose a QR image
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
