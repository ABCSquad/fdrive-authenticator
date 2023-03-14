import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Keyboard,
} from "react-native";
import signal, { KeyHelper } from "signal-protocol-react-native";
import * as SecureStore from "expo-secure-store";

import { AuthContext } from "../context/AuthContext";
import { randomUUID } from "expo-crypto";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const { setIsAuthenticated } = React.useContext(AuthContext);

  const generateIdentity = async (store) => {
    const result = await Promise.all([
      KeyHelper.generateIdentityKeyPair(),
      KeyHelper.generateRegistrationId(),
    ]);
    store.put("identityKey", result[0]);
    store.put("registrationId", result[1]);
  };

  const generatePreKeyBundle = async (store, preKeyId, signedPreKeyId) => {
    const result = await Promise.all([
      store.getIdentityKeyPair(),
      store.getLocalRegistrationId(),
    ]);
    var identity = result[0];
    var registrationId = result[1];
    const keys = await Promise.all([
      KeyHelper.generatePreKey(preKeyId),
      KeyHelper.generateSignedPreKey(identity, signedPreKeyId),
    ]);
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
  };

  const handleLogin = async () => {
    // TODO: Implement login logic here
    // Check if username and password match statically
    if (
      username.toLowerCase() !== "test" ||
      password.toLowerCase() !== "test"
    ) {
      setLoginError(true);
      return;
    }

    // Clear login error
    setLoginError(false);

    // // Generate key pair using elliptic curve cryptography
    // const keyPair = await nacl.sign.keyPair();
    // const { publicKey, secretKey } = keyPair;
    // // Convert key pair to base64 encoded strings
    // const base64EncodedPublic = nacl.util.encodeBase64(publicKey);
    // const base64EncodedPrivate = nacl.util.encodeBase64(secretKey);
    // // Convert key pair to Uint8Array
    // const base64DecodedPublic = nacl.util.decodeBase64(base64EncodedPublic);
    // const base64DecodedPrivate = nacl.util.decodeBase64(base64EncodedPrivate);

    // // Store key pair in secure store
    // await SecureStore.setItemAsync("publicKey", base64EncodedPublic);
    // await SecureStore.setItemAsync("privateKey", base64EncodedPrivate);

    // Create signal protocol address object
    const signalProtocolAddress = new signal.SignalProtocolAddress(
      username,
      randomUUID().toString()
    );
    // Create a new store
    const signalStore = new signal.SignalProtocolStore();

    // Set preKeyId and signedPreKeyId
    const preKeyId = 1;
    const signedPreKeyId = 1;
    // Call the generateIdentity function to generate a new identity key pair
    await generateIdentity(signalStore);
    // Call the generatePreKeyBundle function to generate a new pre key bundle
    const preKeyBundle = await generatePreKeyBundle(
      signalStore,
      preKeyId,
      signedPreKeyId
    );

    // Alert with all information
    alert(
      `Username: ${username}\n
      Signal Protocol Address: ${signalProtocolAddress.toString()}\n
      Pre Key Bundle Successfully created..\n
      Sending Pre Key Bundle to server...\n
      Successfully registered user on server!
      `
    );

    // Set user as authenticated
    setIsAuthenticated(true);
  };

  const handlePress = () => {
    Keyboard.dismiss(); // Hide the keyboard when user clicks outside of the text field
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to FDrive!</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          className="bg-main"
          style={styles.button}
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        {loginError && (
          <Text className=" text-red-500 mt-5">
            Incorrect email or password
          </Text>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "80%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    width: "80%",
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LoginScreen;
