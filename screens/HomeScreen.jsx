import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View, SafeAreaView, Button } from "react-native";
import Navbar from "../components/Navbar";
import Device from "../components/Device";
import ScanButton from "../components/ScanButton";
import * as SecureStore from "expo-secure-store";

const HomeScreen = ({ navigation }) => {
  const [deviceArr, setDeviceArr] = useState([
    {
      name: "Device 1",
      version: "1.0.0",
      os: "Windows",
      lastLogin: "2021-05-01 12:00:00",
      location: "Mumbai, IN",
    },
  ]);

  // Get companion device list from secure storage
  useEffect(() => {
    const getCompanionDevices = async () => {
      const companionDevices = await SecureStore.getItemAsync(
        "companionDevices"
      );
      if (companionDevices) {
        setDeviceArr(JSON.parse(companionDevices));
      }
    };
    getCompanionDevices();
  }, []);

  return (
    <>
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
                version={device.version}
                os={device.os}
                lastLogin={device.lastLogin}
                location={device.location}
              />
            ))}
          </View>
        </View>

        <View className="flex-none px-4 py-2 w-full">
          <ScanButton navigation={navigation} />
        </View>

        <StatusBar style="auto" />
      </SafeAreaView>
    </>
  );
};

export default HomeScreen;
