import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, SafeAreaView, Button } from "react-native";
import Navbar from "../components/Navbar";
import Device from "../components/Device";
import ScanButton from "../components/ScanButton";

const HomeScreen = ({ navigation }) => {
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
								lastLogin={device.lastLogin}
								location={device.location}
							/>
						))}
					</View>
				</View>

				<View className="flex-none px-8 py-8 w-full bg-white">
					<ScanButton navigation={navigation} />
				</View>

				<StatusBar style="auto" />
			</SafeAreaView>
		</>
	);
};

export default HomeScreen;
