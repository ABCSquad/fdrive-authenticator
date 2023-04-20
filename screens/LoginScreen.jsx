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
import signalStore from "../util/signalStore.js";
import * as SecureStore from "expo-secure-store";
import { Buffer } from "buffer";

import { AuthContext } from "../context/AuthContext";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const { setIsAuthenticated } = React.useContext(AuthContext);

  const generateIdentity = async (store) => {
    return Promise.all([
      KeyHelper.generateIdentityKeyPair(),
      KeyHelper.generateRegistrationId(),
    ]).then(function (result) {
      store.put("identityKey", result[0]);
      store.put("registrationId", result[1]);
      // Save identity key pair to secure store
      SecureStore.setItemAsync(
        "identityPubKey",
        Buffer.from(result[0].pubKey).toString("base64")
      );
      SecureStore.setItemAsync(
        "identityPrivKey",
        Buffer.from(result[0].privKey).toString("base64")
      );
      // Save registration id to secure store
      SecureStore.setItemAsync("registrationId", result[1].toString());
    });
  };

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

    let signalProtocolAddress;
    // Set preKeyId and signedPreKeyId
    const preKeyId = 1337;
    const signedPreKeyId = 1;
    // Call the generateIdentity function to generate a new identity key pair
    await generateIdentity(signalStore)
      .then(async () => {
        // Create signal protocol address object
        signalProtocolAddress = new signal.SignalProtocolAddress(
          username,
          await signalStore.getLocalRegistrationId()
        );
        // Store username and signal prtocol address in secure store
        SecureStore.setItemAsync("username", username);
        SecureStore.setItemAsync(
          "signalProtocolAddress",
          signalProtocolAddress.toString()
        );
        // Call the generatePreKeyBundle function to generate a new pre key bundle
        return generatePreKeyBundle(signalStore, preKeyId, signedPreKeyId);
      })
      .then((preKeyBundle) => {
        // Send preKeyBundle to server
        fetch(`http://localhost:5000/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // Convert buffers to base64 strings before sending to server
          body: JSON.stringify({
            username,
            signalProtocolAddress: signalProtocolAddress.toString(),
            preKeyBundle: {
              identityKey: Buffer.from(preKeyBundle.identityKey).toString(
                "base64"
              ),
              registrationId: preKeyBundle.registrationId,
              preKey: {
                keyId: preKeyId,
                publicKey: Buffer.from(preKeyBundle.preKey.publicKey).toString(
                  "base64"
                ),
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
          }),
        }).then((res) => {
          if (res.status === 200) {
            console.log("User successfully logged in");
            // Set user as authenticated
            setIsAuthenticated(true);
          } else {
            console.log("User login failed");
          }
        });
      });

    // Alert with all information
    alert(
      `Username: ${username}\n
    Signal Protocol Address: ${signalProtocolAddress.toString()}\n
    Pre Key Bundle Successfully created..\n
    Sending Pre Key Bundle to server...\n
    Successfully registered user on server!`
    );
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
