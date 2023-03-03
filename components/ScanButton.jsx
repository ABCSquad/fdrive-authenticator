import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Button } from "react-native";
import { styled } from "nativewind";
const StyledView = styled(View);

export default function ScanButton({ navigation }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const buttonRef = useRef(null);

  const handleScanButtonPress = () => {
    setShowDropdown(!showDropdown);
  };

  const handleOptionButtonPress = (option) => {
    if (option === 1) {
      navigation.navigate("QRScanner");
    }
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
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          onPress={() => setShowDropdown(false)}
          className={`inline-flex flex-1 justify-end items-end bg-opacity-100 fixed`}
        >
          <View className={`px-4 py-2 rounded-md relative -top-24`}>
            <TouchableOpacity
              onPress={() => handleOptionButtonPress(1)}
              className="items-end rounded-lg my-2 bg-white border border-border shadow-sm shadow-gray-200"
            >
              <Text className="text-gray-900 text-base px-3 py-2">
                Scan a QR code
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleOptionButtonPress(2)}
              className="items-end rounded-lg my-2 bg-white border border-border shadow-sm shadow-gray-200"
            >
              <Text className="text-gray-900 text-base px-3 py-2">
                Choose a QR image
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
