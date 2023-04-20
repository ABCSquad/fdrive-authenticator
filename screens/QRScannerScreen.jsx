import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import NoPermissionModal from "../components/NoPermissionModal";
import { Camera } from "expo-camera";
import * as SecureStore from "expo-secure-store";
import signal, { KeyHelper } from "signal-protocol-react-native";
import signalStore from "../util/signalStore.js";
import { Buffer } from "buffer";
import _ from "lodash";

const QRScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  const [data, setData] = useState(
    "Open FDrive's Vault on your browser or any device and scan the QR code."
  );

  const generatePreKeyBundle = async (store, preKeyId, signedPreKeyId) => {
    return Promise.all([
      store.getIdentityKeyPair(),
      store.getLocalRegistrationId(),
    ]).then(function (result) {
      var identity = result[0];
      var registrationId = result[1];

      return Promise.all([
        KeyHelper.generatePreKey(preKeyId),
        KeyHelper.generateSignedPreKey(identity, signedPreKeyId),
      ]).then(function (keys) {
        var preKey = keys[0];
        var signedPreKey = keys[1];

        store.storePreKey(preKeyId, preKey.keyPair);
        store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

        return {
          identityKey: identity.pubKey,
          registrationId: registrationId,
          preKey: {
            keyId: preKeyId,
            publicKey: preKey.keyPair.pubKey,
          },
          signedPreKey: {
            keyId: signedPreKeyId,
            publicKey: signedPreKey.keyPair.pubKey,
            signature: signedPreKey.signature,
          },
        };
      });
    });
  };

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
      setShowLoader(true);
      // Send websocket request to server
      const socket = new WebSocket(`ws://localhost:7071/primary/${token}`);
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
          // Check if a store exists in secure store
          const store = await SecureStore.getItemAsync("signalStore");
          if (store) {
            // Reconstruct store before proceeding
            const reconstructStore = async () => {
              let store = JSON.parse(
                await SecureStore.getItemAsync("signalStore")
              );
              // Convert all base64 strings to ArrayBuffer
              store.identityKey.pubKey = Buffer.from(
                store.identityKey.pubKey,
                "base64"
              ).buffer;
              store.identityKey.privKey = Buffer.from(
                store.identityKey.privKey,
                "base64"
              ).buffer;
              // Put store content into signal store
              signalStore.put("identityKey", store.identityKey);
              signalStore.put(
                "registrationId",
                await SecureStore.getItemAsync("registrationId")
              );
              const companionDeviceList = JSON.parse(
                await SecureStore.getItemAsync("companionDeviceList")
              );
              // Iterate over companion devices and put sessions into store
              companionDeviceList.forEach(async (companionDevice) => {
                // Add session to store
                await signalStore.storeSession(
                  companionDevice.address,
                  store[`session${companionDevice.address}`]
                );
              });
            };
            reconstructStore();
          }
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
          companionDeviceList.push({
            address: message.data.companionSignalProtocolAddress,
            deviceInfo: message.data.deviceInfo,
          });
          // Save new device list to secure store
          await SecureStore.setItemAsync(
            "companionDeviceList",
            JSON.stringify(companionDeviceList)
          );
          // Send request to server to add companion to user devices
          fetch("http://localhost:5000/api/user/companion/add", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: await SecureStore.getItemAsync("username"),
              companionDevice: {
                address: message.data.companionSignalProtocolAddress,
                deviceInfo: message.data.deviceInfo,
              },
            }),
          });

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

          // Create new preKeyId and signedPreKeyId
          const preKeyId = Math.floor(Math.random() * 1000000);
          const signedPreKeyId = Math.floor(Math.random() * 1000000);
          // Create a new preKeyBundle for next companion device
          const preKeyBundle = await generatePreKeyBundle(
            signalStore,
            preKeyId,
            signedPreKeyId
          );
          // Send preKeyBundle to server
          socket.send(
            JSON.stringify({
              type: "preKeyBundleUpdate",
              data: {
                username: await SecureStore.getItemAsync("username"),
                newPreKeyBundle: {
                  identityKey: Buffer.from(preKeyBundle.identityKey).toString(
                    "base64"
                  ),
                  registrationId: preKeyBundle.registrationId,
                  preKey: {
                    keyId: preKeyId,
                    publicKey: Buffer.from(
                      preKeyBundle.preKey.publicKey
                    ).toString("base64"),
                  },
                  signedPreKey: {
                    keyId: signedPreKeyId,
                    publicKey: Buffer.from(
                      preKeyBundle.signedPreKey.publicKey
                    ).toString("base64"),
                    signature: Buffer.from(
                      preKeyBundle.signedPreKey.signature
                    ).toString("base64"),
                  },
                },
              },
            })
          );
          // Create copy of store contents
          let storeContents = _.cloneDeep(signalStore.store);
          // Convert ArrayBuffer identityKeyPair to base64
          storeContents.identityKey.pubKey = Buffer.from(
            storeContents.identityKey.pubKey
          ).toString("base64");
          storeContents.identityKey.privKey = Buffer.from(
            storeContents.identityKey.privKey
          ).toString("base64");
          // Save store to secure store
          await SecureStore.setItemAsync(
            "signalStore",
            JSON.stringify(storeContents)
          );
          // Navigate back to home screen
          navigation.navigate("Home");
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
          {data}
          {/* {scanned && (
            <Button title="scan again" onPress={() => setScanned(false)} />
          )} */}
        </Text>
      </View>
      {scanned ? (
        <ActivityIndicator />
      ) : (
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
      )}
    </View>
  );
};

export default QRScannerScreen;
