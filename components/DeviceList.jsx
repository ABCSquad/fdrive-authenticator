import React, { useState, useEffect, useCallback } from "react";
import Device from "./Device";
import * as SecureStore from "expo-secure-store";
import { Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const DeviceList = () => {
  const [deviceArr, setDeviceArr] = useState([]);

  // Get companion device list from secure storage
  useFocusEffect(
    useCallback(() => {
      const getCompanionDevices = async () => {
        const companionDevices = await SecureStore.getItemAsync(
          "companionDeviceList"
        );
        if (companionDevices) {
          setDeviceArr(JSON.parse(companionDevices));
        }
      };
      getCompanionDevices();
    }, [])
  );

  useEffect(() => {
    console.log("Device list updated", deviceArr);
  }, [deviceArr]);

  return (
    <>
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
    </>
  );
};

export default DeviceList;
