import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View, SafeAreaView, Button, Text } from "react-native";
import { Buffer } from "buffer";
import * as SecureStore from "expo-secure-store";
import signalStore from "../util/signalStore.js";
import signal from "signal-protocol-react-native";
import _ from "lodash";

const VaultScreen = ({ navigation }) => {
  // Check if new file keys need to be encrypted for companions
  useEffect(() => {
    let companionDeviceList;
    const checkForNewFileKeys = async () => {
      // Send request to server
      const response = await fetch("http://localhost:5000/api/key/check", {
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
    const storeSignalStore = async (signalStore) => {
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
    };
    const onLoad = async () => {
      // Create global response to send to server
      let missingCompanionsResponseToSend = {};
      let existingCompanionsResponseToSend = {};
      // Get companion device list from secure store
      companionDeviceList = JSON.parse(
        await SecureStore.getItemAsync("companionDeviceList")
      );
      // Reconstruct signal store
      await reconstructStore();
      const pendingKeys = await checkForNewFileKeys();
      if (pendingKeys && pendingKeys instanceof Array) {
        console.log(`Found ${pendingKeys.length} new keys to encrypt`);
        const companionAddressList = companionDeviceList.map(
          (companionDevice) => companionDevice.address
        );
        // Iterate over pending keys and encrypt them for companions
        await Promise.all(
          pendingKeys.map(async (pendingKeyObject) => {
            const allKeyCompanions = pendingKeyObject.keys.map(
              (key) => key.companionAddress
            );
            // Find which companion addresses are not present
            const missingCompanions = companionAddressList.filter((address) => {
              return !allKeyCompanions.includes(address);
            });
            const presentCompanions = companionAddressList.filter((address) => {
              return allKeyCompanions.includes(address);
            });
            // Push address of companion with key that has sameChainEncrypted as true
            let sameChainEncryptedCompanions = pendingKeyObject.keys.filter(
              (key) => key.sameChainEncrypted
            );
            sameChainEncryptedCompanions = sameChainEncryptedCompanions.map(
              (key) => key.companionAddress
            );
            console.log(missingCompanions, sameChainEncryptedCompanions);
            if (
              missingCompanions.length === 0 &&
              sameChainEncryptedCompanions.length === 0
            )
              return;
            // Decrypt key using present companion
            console.log(pendingKeyObject.keys[0]);
            const presentCompanionAddress =
              pendingKeyObject.keys[0].companionAddress;
            const presentCompanionKey = pendingKeyObject.keys[0].phoneKey;
            // Create sessionCipher for present companion
            const sessionCipher = new signal.SessionCipher(
              signalStore,
              signal.SignalProtocolAddress.fromString(presentCompanionAddress)
            );
            // Decrypt key using present companion
            const decryptedKey = await sessionCipher.decryptWhisperMessage(
              presentCompanionKey.body,
              "binary"
            );
            // Reset store after decryption
            await reconstructStore();
            // Encrypt key for missing companions and add them to responseToSend
            await Promise.all([
              ...missingCompanions.map(async (missingAddress) => {
                // Create sessionCipher for missing companion
                const sessionCipher = new signal.SessionCipher(
                  signalStore,
                  signal.SignalProtocolAddress.fromString(missingAddress)
                );
                // Encrypt key for missing companion
                const encryptedKey = await sessionCipher.encrypt(
                  Buffer.from(decryptedKey).buffer
                );
                // Push encrypted key to missingCompanionsResponseToSend at pendingKeyObject._id
                if (!missingCompanionsResponseToSend[pendingKeyObject._id]) {
                  missingCompanionsResponseToSend[pendingKeyObject._id] = [];
                }
                missingCompanionsResponseToSend[pendingKeyObject._id].push({
                  companionAddress: missingAddress,
                  key: encryptedKey,
                });
              }),
              // Repeat for sameChainEncryptedCompanions
              ...sameChainEncryptedCompanions.map(async (existingAddress) => {
                // Retrieve existing file keys in secure store
                let existingFileKeys = _.cloneDeep(
                  JSON.parse(await SecureStore.getItemAsync("fileKeys")) || {}
                );
                // Add new key to existing file keys
                existingFileKeys[pendingKeyObject.file] =
                  Buffer.from(decryptedKey).toString("utf8");
                await SecureStore.setItemAsync(
                  "fileKeys",
                  JSON.stringify(existingFileKeys)
                );
                console.log(
                  "fileKeys",
                  await SecureStore.getItemAsync("fileKeys")
                );
                // Update signalStore with content in SecureStorage
                const sessionCipher = new signal.SessionCipher(
                  signalStore,
                  signal.SignalProtocolAddress.fromString(existingAddress)
                );

                // Encrypt key for existing companion
                const encryptedKey = await sessionCipher.encrypt(
                  Buffer.from(decryptedKey).buffer
                );
                // Push encrypted key to existingCompanionsResponseToSend at pendingKeyObject._id
                if (!existingCompanionsResponseToSend[pendingKeyObject._id]) {
                  existingCompanionsResponseToSend[pendingKeyObject._id] = [];
                }
                existingCompanionsResponseToSend[pendingKeyObject._id].push({
                  companionAddress: existingAddress,
                  key: encryptedKey,
                });
              }),
            ]);
          })
        );
        // Send response to server to update keys
        console.log(
          missingCompanionsResponseToSend,
          existingCompanionsResponseToSend
        );
        const response = await fetch("http://localhost:5000/api/key/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: await SecureStore.getItemAsync("username"),
            missingCompanionsUpdatedKeys: missingCompanionsResponseToSend,
            existingCompanionsUpdatedKeys: existingCompanionsResponseToSend,
          }),
        });
        if (!response.ok) {
          console.log("Error updating keys");
        }
        if (response.ok) {
          console.log("Keys updated successfully");
          // Update store content in SecureStorage
          await storeSignalStore(signalStore);
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
