import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View, SafeAreaView, Text } from "react-native";
import Navbar from "../components/Navbar";
import Device from "../components/Device";
import ScanButton from "../components/ScanButton";
import * as SecureStore from "expo-secure-store";

const HomeScreen = ({ navigation }) => {
  const [deviceArr, setDeviceArr] = useState([]);

  // Get companion device list from secure storage
  useEffect(() => {
    const getCompanionDevices = async () => {
      const companionDevices = await SecureStore.getItemAsync(
        "companionDeviceList"
      );
      if (companionDevices) {
        setDeviceArr(JSON.parse(companionDevices));
      }
    };
    getCompanionDevices();
  }, []);

  useEffect(() => {
    console.log("Device list updated", deviceArr);
  }, [deviceArr]);

  return (
    <>
      <SafeAreaView className="h-full flex-col items-center">
        <View className="flex-none p-5 w-full justify-center bg-white border-y-2 border-border">
          <Navbar />
        </View>

        <View className="grow w-full items-center bg-white">
          <View className="w-full">
            {deviceArr.length > 0 ? (
              deviceArr.map(({ deviceInfo }, index) => (
                <Device
                  key={index}
                  name={deviceInfo.name}
                  version={deviceInfo.version}
                  os={deviceInfo.os.family}
                  lastLogin={deviceInfo.lastLogin}
                  location={deviceInfo.location}
                />
              ))
            ) : (
              <View className="justify-center items-center mt-5">
                <Text className="text-lg">No devices found</Text>
              </View>
            )}
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
