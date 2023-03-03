import React, { useState } from "react"
import { Modal, Pressable, Text, View } from "react-native"

const NoPermissionModal = ({ navigation, askForCameraPermission }) => {
  const [modalVisible, setModalVisible] = useState(true)
  return (
    <View className="flex flex-col h-full justify-center items-center bg-red-100">
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View className="flex h-full flex-col justify-center items-center bg-">
          <Text>hello</Text>
          <Pressable
            onPress={() => {
              setModalVisible(!modalVisible)
              navigation.goBack()
            }}
          >
            <Text>Hide Modal</Text>
          </Pressable>
          <Pressable>
            <Text onPress={askForCameraPermission}>Continue</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  )
}

export default NoPermissionModal
