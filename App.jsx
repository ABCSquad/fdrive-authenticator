import * as React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import HomeScreen from "./screens/HomeScreen"
import QRScannerScreen from "./screens/QRScannerScreen"

const Stack = createNativeStackNavigator()

const ScreenStack = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "FDrive Authenticator" }}
        />
        <Stack.Screen
          name="QRScanner"
          component={QRScannerScreen}
          options={{ title: "Scan" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default ScreenStack
