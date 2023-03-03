import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { styled } from "nativewind";
const StyledView = styled(View);

export default function ScanButton({ buttonCoordinates }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalBottom, setModalBottom] = useState(null);
  const buttonRef = useRef(null);

  const handleScanButtonPress = () => {
    setShowDropdown(!showDropdown);
  };

  const handleOptionButtonPress = (option) => {
    console.log(option);
    setShowDropdown(false);
  };

  useEffect(() => {
    if (buttonCoordinates) {
      const { y, height } = buttonCoordinates;
      setModalBottom(y - height);
    }
  }, [buttonCoordinates]);

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
          onPress={() => setShowDropdown(false)}
          className={`inline-flex flex-1 justify-end items-end bg-opacity-50 fixed`}
        >
          <View className={`px-4 py-2 rounded-md relative -top-24`}>
            <TouchableOpacity
              onPress={() => handleOptionButtonPress(1)}
              className="items-end bg-gray-50 rounded-lg my-2 border border-border"
            >
              <Text className="text-gray-900 font-medium text-lg px-3 py-2">
                Scan a QR code
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleOptionButtonPress(2)}
              className="items-end bg-gray-50 rounded-lg my-2 border border-border"
            >
              <Text className="text-gray-900 font-medium text-lg px-3 py-2">
                Choose a QR image
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
