import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";

import HomeScreen from "./screens/HomeScreen";
import QRScannerScreen from "./screens/QRScannerScreen";
import LoginScreen from "./screens/LoginScreen";

import { AuthContext } from "./context/AuthContext";
import { Button } from "react-native";

const Stack = createNativeStackNavigator();

const ScreenStack = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const publicKey = await SecureStore.getItemAsync("privateKey");
      if (publicKey) {
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("publicKey");
    await SecureStore.deleteItemAsync("privateKey");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      <NavigationContainer>
        <Stack.Navigator>
          {isAuthenticated ? (
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                  title: "FDrive Authenticator",
                  headerRight: () => (
                    <Button onPress={handleLogout} title="Logout" />
                  ),
                }}
              />
              <Stack.Screen
                name="QRScanner"
                component={QRScannerScreen}
                options={{ title: "Scan QR Code" }}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default ScreenStack;
