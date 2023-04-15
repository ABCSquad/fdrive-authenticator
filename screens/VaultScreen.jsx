import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View, SafeAreaView, Button, Text } from "react-native";
import { Buffer } from "buffer";
import * as SecureStore from "expo-secure-store";
import signalStore from "../util/signalStore.js";
import signal from "signal-protocol-react-native";

const VaultScreen = ({ navigation }) => {
  // Check if new file keys need to be encrypted for companions
  useEffect(() => {
    let companionDeviceList;
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
      const responseJSON = await response.json();
      const data = responseJSON.data;
      if (data.length > 0) return data;
      return false;
    };
    const reconstructStore = async () => {
      let store = JSON.parse(await SecureStore.getItemAsync("signalStore"));
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
      // Iterate over companion devices and put sessions into store
      companionDeviceList.forEach(async (companionDevice) => {
        // Add session to store
        await signalStore.storeSession(
          companionDevice.address,
          store[`session${companionDevice.address}`]
        );
      });
    };
    const onLoad = async () => {
      // Create global variable for sessionCiphers
      let sessionCipherObj = {};
      // Create global response to send to server
      let responseToSend = {};
      // Get companion device list from secure store
      companionDeviceList = JSON.parse(
        await SecureStore.getItemAsync("companionDeviceList")
      );
      await reconstructStore();
      const pendingKeys = await checkForNewFileKeys();
      if (pendingKeys && pendingKeys instanceof Array) {
        console.log(`Found ${pendingKeys.length} new keys to encrypt`);
        const companionAddressList = companionDeviceList.map(
          (companionDevice) => companionDevice.address
        );
        // Iterate over pending keys and encrypt them for companions
        await Promise.all(
          pendingKeys.map(async (keyObject) => {
            const allKeyCompanions = keyObject.keys.map(
              (key) => key.companionAddress
            );
            // Find which companion addresses are not present
            const missingCompanions = companionAddressList.filter((address) => {
              return !allKeyCompanions.includes(address);
            });
            const presentCompanions = companionAddressList.filter((address) => {
              return allKeyCompanions.includes(address);
            });
            if (missingCompanions.length === 0) return;
            // Decrypt key using present companion
            const presentCompanionAddress = keyObject.keys[0].companionAddress;
            const presentCompanionKey = keyObject.keys[0].key;
            // Check if sessionCipher for companion exists
            if (!sessionCipherObj[presentCompanionAddress]) {
              // Create sessionCipher for companion
              sessionCipherObj[presentCompanionAddress] =
                new signal.SessionCipher(
                  signalStore,
                  signal.SignalProtocolAddress.fromString(
                    presentCompanionAddress
                  )
                );
            }
            // Decrypt key using present companion
            const decryptedKey = await sessionCipherObj[
              presentCompanionAddress
            ].decryptWhisperMessage(presentCompanionKey.body, "binary");
            // Encrypt key for missing companions and add them to responseToSend
            await Promise.all(
              missingCompanions.map(async (missingAddress) => {
                // Check if sessionCipher for companion exists
                if (!sessionCipherObj[missingAddress]) {
                  // Create sessionCipher for companion
                  sessionCipherObj[missingAddress] = new signal.SessionCipher(
                    signalStore,
                    missingAddress
                  );
                }
                // Encrypt key for missing companion
                const encryptedKey = await sessionCipherObj[
                  missingAddress
                ].encrypt(Buffer.from(decryptedKey).buffer);
                // Push encrypted key to responseToSend at keyObject._id
                if (!responseToSend[keyObject._id]) {
                  responseToSend[keyObject._id] = [];
                }
                responseToSend[keyObject._id].push({
                  companionAddress: missingAddress,
                  key: encryptedKey,
                });
              })
            );
          })
        );
        // Send response to server to update keys
        const response = await fetch(
          "http://192.168.29.215:5000/api/key/update",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: await SecureStore.getItemAsync("username"),
              updatedKeys: responseToSend,
            }),
          }
        );
        if (!response.ok) {
          console.log("Error updating keys");
        }
        if (response.ok) {
          console.log("Keys updated successfully");
        }
      } else {
        console.log("No new keys to encrypt");
      }
    };
    onLoad();
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
