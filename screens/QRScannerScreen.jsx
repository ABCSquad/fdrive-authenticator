import React, { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import NoPermissionModal from "../components/NoPermissionModal";
import { Camera } from "expo-camera";
import * as SecureStore from "expo-secure-store";
import signal from "signal-protocol-react-native";
import signalStore from "../util/signalStore.js";
import { Buffer } from "buffer";

const QRScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [data, setData] = useState(
    " Open web.whatapp.com on your browser or any device and scan the QRCode."
  );

  const askForCameraPermission = () => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  };

  // Request Camera Permission
  useEffect(() => {
    askForCameraPermission();
  }, []);

  // Scan QRCode
  const handleScan = async ({ type, data }) => {
    setData(data);
    const token = data.toString();
    console.log("Scan successful: ", token);
    // Check if data is a valid token
    const hexKeyRegex = /^[0-9a-fA-F]{32}$/;
    if (hexKeyRegex.test(token)) {
      setScanned(true);
      // Send websocket request to server
      const socket = new WebSocket(`ws://192.168.29.215:7071/primary/${token}`);
      socket.onopen = () => {
        console.log("Socket connection established");
      };
      socket.onmessage = async (event) => {
        // Determine type of message
        const message = JSON.parse(event.data);
        if (message.type === "success") {
          // Send information to server
          const data = {
            type: "primaryInformation",
            username: await SecureStore.getItemAsync("username"),
            signalProtocolAddress: await SecureStore.getItemAsync(
              "signalProtocolAddress"
            ),
            deviceDetails: "iPhone 12",
          };
          socket.send(JSON.stringify(data));
        }
        if (message.type === "preKeyWhisperMessage") {
          // Create address from string
          const companionSignalProtocolAddress =
            new signal.SignalProtocolAddress.fromString(
              message.data.companionSignalProtocolAddress
            );
          // Create sessionCipher
          const sessionCipher = new signal.SessionCipher(
            signalStore,
            companionSignalProtocolAddress
          );
          // Decrypt message
          const decryptedMessage =
            await sessionCipher.decryptPreKeyWhisperMessage(
              message.data.ciphertext.body,
              "binary"
            );
          console.log(
            "Decrypted message: ",
            Buffer.from(decryptedMessage).toString("utf8")
          );
          // Get companion device list from secure store
          let companionDeviceList =
            JSON.parse(await SecureStore.getItemAsync("companionDeviceList")) ||
            [];

          // Add new device to list
          companionDeviceList.push(message.data.deviceInfo);
          // Save new device list to secure store
          await SecureStore.setItemAsync(
            "companionDeviceList",
            JSON.stringify(companionDeviceList)
          );

          const whisperMessage = Buffer.from(
            "Take a sad song and make it better"
          ).buffer;
          const ciphertext = await sessionCipher.encrypt(whisperMessage);
          socket.send(
            JSON.stringify({
              type: "whisperMessage",
              data: {
                whisperMessage: ciphertext,
              },
            })
          );
        }
      };
    } else {
      console.log("Invalid token");
    }
  };

  // Screen when system permission modal is shown
  if (hasPermission === null) {
    return (
      <View className="flex flex-col h-full justify-between items-center bg-white">
        <View className="m-3 p-4 bg-gray-100 rounded">
          <Text className="text-center text-md">
            Open web.whatapp.com on your browser or any device and scan the QR
            Code.
          </Text>
        </View>
        <View className=" p-4 h-full w-screen bg-red-100 rounded"></View>
      </View>
    );
  }

  // Screen when permission is denied
  if (hasPermission === false) {
    return (
      <NoPermissionModal
        navigation={navigation}
        askForCameraPermission={askForCameraPermission}
      />
      // <View>
      //   <Button
      //     onPress={() => askForCameraPermission()}
      //     title="click me"
      //   ></Button>
      // </View>
    );
  }

  return (
    <View className="flex flex-col h-full justify-between items-center bg-white">
      <View className="m-3 p-4 bg-gray-100 rounded">
        <Text className="text-center text-md">
          {data}{" "}
          {scanned && (
            <Button title="scan again" onPress={() => setScanned(false)} />
          )}
        </Text>
      </View>
      <View className=" h-full bg-red-100 rounded">
        {/* <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleScan}
          style={{ width: 900, height: 1600 }}
        /> */}
        <Camera
          onBarCodeScanned={scanned ? undefined : handleScan}
          ratio="16:9"
          style={{ width: 450, height: 854 }}
        />
      </View>
    </View>
  );
};

export default QRScannerScreen;
