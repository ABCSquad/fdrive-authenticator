import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View, SafeAreaView, Text } from "react-native";
import Navbar from "../components/Navbar";
import ScanButton from "../components/ScanButton";
import DeviceList from "../components/DeviceList";

const HomeScreen = ({ navigation }) => {
  return (
    <>
      <SafeAreaView className="h-full flex-col items-center">
        <View className="flex-none p-5 w-full justify-center bg-white border-y-2 border-border">
          <Navbar />
        </View>

        {/* Device List */}
        <DeviceList />

        <View className="flex-none px-4 py-2 w-full">
          <ScanButton navigation={navigation} />
        </View>

        <StatusBar style="auto" />
      </SafeAreaView>
    </>
  );
};

export default HomeScreen;
