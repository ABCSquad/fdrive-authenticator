import React, { useEffect, useState } from "react"
import { Button, Text, View } from "react-native"
import { BarCodeScanner } from "expo-barcode-scanner"
import NoPermissionModal from "../components/NoPermissionModal"

const QRScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null)
  const [scanned, setScanned] = useState(false)
  const [data, setData] = useState(
    " Open web.whatapp.com on your browser or any device and scan the QRCode."
  )

  const askForCameraPermission = () => {
    ;(async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === "granted")
    })()
  }

  // Request Camera Permission
  useEffect(() => {
    askForCameraPermission()
  }, [])

  // Scan QRCode
  const handleScan = ({ type, data }) => {
    setScanned(true)
    setData(data)
    console.log("Type" + type + "\nData" + data)
  }

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
    )
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
    )
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
      <View className=" p-4 h-full w-screen bg-red-100 rounded">
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleScan}
          style={{ height: "100%", width: "100%" }}
        />
      </View>
    </View>
  )
}

export default QRScannerScreen
