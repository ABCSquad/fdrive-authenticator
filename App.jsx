import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, SafeAreaView } from "react-native";
import Navbar from "./components/Navbar";
import Device from "./components/Device";
import ScanButton from "./components/ScanButton";

export default function App() {
  const [deviceArr, setDeviceArr] = useState([
    {
      name: "Device 1",
      lastLogin: "2021-05-01 12:00:00",
      location: "Mumbai, IN",
    },
    {
      name: "Device 2",
      lastLogin: "2021-05-01 12:00:00",
      location: "Nashik, IN",
    },
    {
      name: "Device 3",
      lastLogin: "2021-05-01 12:00:00",
      location: "Pune, IN",
    },
  ]);
  const [buttonCoordinates, setButtonCoordinates] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const handleButtonLayout = (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setButtonCoordinates({ x, y, width, height });
  };

  return (
    <SafeAreaView className="h-full flex-col items-center">
      <View className="flex-none p-5 w-full justify-center bg-white border-y-2 border-border">
        <Navbar />
      </View>

      <View className="grow w-full items-center bg-white">
        <View className="w-full">
          {deviceArr.map((device, index) => (
            <Device
              key={index}
              name={device.name}
              lastLogin={device.lastLogin}
              location={device.location}
            />
          ))}
        </View>
      </View>

      <View
        className="flex-none px-4 py-2 w-full"
        onLayout={handleButtonLayout}
      >
        <ScanButton buttonCoordinates={buttonCoordinates} />
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
