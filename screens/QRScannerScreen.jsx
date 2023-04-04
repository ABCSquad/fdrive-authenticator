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
      // Store identityKey of companion in secure store
      let companions = await SecureStore.getItemAsync("companions");
      if (!companions) companions = JSON.stringify([]);
      const updatedCompanions = [...JSON.parse(companions), token];
      await SecureStore.setItemAsync(
        "companions",
        JSON.stringify(updatedCompanions)
      );
      // Verify token with server
      fetch(`http://192.168.29.215:5000/api/session/${token}/verify`, {
        method: "GET",
      }).then((res) => {
        if (res.status === 200) {
          console.log("Token verified by server");
          // Websocket connection to path /primary/:token
          const socket = new WebSocket(
            `ws://192.168.29.215:5000/primary/${token}`
          );
          socket.onopen = () => {
            console.log("Socket connection established");
          };
          socket.onmessage = async (event) => {
            // Determine type of message
            const receivedMessage = JSON.parse(event.data);
            if (receivedMessage.type === "greeting") {
              console.log(`Server says: ${receivedMessage.message}`);
            }
            if (receivedMessage.type === "preKeyWhisperMessage") {
              const address = await SecureStore.getItemAsync(
                "signalProtocolAddress"
              );
              const sessionCipher = new signal.SessionCipher(
                signalStore,
                signal.SignalProtocolAddress.fromString(address)
              );
              sessionCipher
                .decryptPreKeyWhisperMessage(
                  receivedMessage.preKeyWhisperMessage.body,
                  "binary"
                )
                .then((plaintext) =>
                  console.log(
                    "Decryption successful",
                    Buffer.from(plaintext).toString("utf8")
                  )
                )
                .catch((err) => console.log("Failed to decrypt", err));
              return;
            }
            // Send signal related information to server
            const message = {
              type: "initialPrimaryX3DHMessage",
              username: await SecureStore.getItemAsync("username"),
              signalProtocolAddress: await SecureStore.getItemAsync(
                "signalProtocolAddress"
              ),
              deviceDetails: "Test Device, details",
            };
            socket.send(JSON.stringify(message));
          };
          socket.onerror = (error) => {
            console.log(`Socket encountered error:`, error);
          };
          socket.onclose = (event) => {
            if (event.wasClean) {
              console.log("Socket connection closed cleanly");
            }
            console.log(`Socket connection closed with code: ${event.code}`);
          };
        } else {
          console.log("Token not verified", res.status);
        }
      });
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
