import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View, SafeAreaView, Button, Text } from "react-native";
import Navbar from "../components/Navbar";
import * as SecureStore from "expo-secure-store";

const VaultScreen = ({ navigation }) => {
  // Check if new file keys need to be encrypted for companions
  useEffect(() => {
    const checkForNewFileKeys = async () => {
      // Send request to server
      const response = await fetch("http://192.168.29.215:5000/api/key/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: await SecureStore.getItemAsync("username"),
        }),
      });
      const data = await response.json();
      console.log(data);
      if (data.length > 0) return data;
      return false;
    };
    checkForNewFileKeys();
  }, []);

  return (
    <>
      <SafeAreaView className="h-full flex-col items-center">
        <View className="flex-none p-5 w-full h-full justify-center items-center">
          <Text>Files will be here shortly!</Text>
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    </>
  );
};

export default VaultScreen;
