import React, { useState } from "react";
import {
  Button,
  Image,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/AntDesign";
import * as SecureStore from "expo-secure-store";

import { storage } from "../firebaseConfig.js";
import { ref, getBlob } from "firebase/storage";

import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import CryptoJS from "react-native-crypto-js";

const FileIcon = ({ fileName }) => {
  const getIconFromIdentifier = (filename) => {
    // Remove .enc
    const encRemoved = filename.substr(0, filename.length - 4);
    const extension = encRemoved.split(".").pop();
    switch (extension) {
      case "jpeg":
      case "jpg":
      case "png":
        return `jpgfile1`;

      case "txt":
        return "unknowfile1";

      case "json":
        return "unknowfile1";

      case "js":
        return "unknown";

      case "mp4":
        return "video";

      case "mp3":
        return "audio";

      case "pdf":
        return "pdffile1";

      case "xlsx":
      case "xls":
      case "csv":
        return "exclefile1";

      case "ppt":
        return "pptfile1";

      case "doc":
        return "wordfile1";

      case "docx":
        return "wordfile1";
      default:
        return "unknowfile1";
    }
  };

  const getNameFromIndentifier = (filename) => {
    const re = /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/;
    let result = filename.replace(re, "");
    while (result.charAt(0) === "_") {
      result = result.substring(1);
    }
    const encRemoved = result.substr(0, result.length - 4);
    return encRemoved;
  };

  const getExtension = (filename) => {
    const encRemoved = filename.substr(0, filename.length - 4);
    const extension = encRemoved.split(".").pop();

    return extension;
  };

  const sourceUrl = `../assets/images/icons/${getIconFromIdentifier(
    fileName
  )}.svg`;

  const download = async () => {
    const downloadRef = ref(storage, `vault/Administrator/${fileName}`);
    const fileKeys = JSON.parse(await SecureStore.getItemAsync("fileKeys"));
    getBlob(downloadRef)
      .then((resBlob) => {
        console.log(fileKeys[fileName]);
        decryptAndDownload(resBlob, fileName, fileKeys[fileName]);
        // const fr = new FileReader();
        // fr.onload = async () => {
        // 	const fileUri = `${FileSystem.documentDirectory}/${fileName}`;
        // 	await FileSystem.writeAsStringAsync(
        // 		fileUri,
        // 		fr.result.split(",")[1],
        // 		{ encoding: FileSystem.EncodingType.Base64 }
        // 	);
        // 	// Sharing.shareAsync(fileUri);
        // 	Linking.openURL(fileUri).catch((err) => alert(err));
        // };
        // fr.readAsDataURL(resBlob);
      })
      .catch((err) => console.log(err));
  };

  const decryptAndDownload = (file, fileName, key) => {
    var reader = new FileReader();
    reader.onload = async () => {
      var decrypted = CryptoJS.AES.decrypt(reader.result, key); // Decryption: I: Base64 encoded string (OpenSSL-format) -> O: WordArray
      var typedArray = convertWordArrayToUint8Array(decrypted); // Convert: WordArray -> typed array

      var fileDec = new Blob([typedArray]); // Create blob from typed array
      //   var fileDec = new Blob([typedArray], { type: "image/jpeg" });
      var filename = fileName.substr(0, fileName.length - 4);

      // console.log(fileDec);
      downloadBlob(fileDec, filename);
    };
    reader.readAsText(file);
  };

  const downloadBlob = (fileBlob, shortFileName) => {
    const fr = new FileReader();
    fr.onload = async () => {
      const fileUri = `${FileSystem.documentDirectory}/${shortFileName}`;
      await FileSystem.writeAsStringAsync(fileUri, fr.result.split(",")[1], {
        encoding: FileSystem.EncodingType.Base64,
      });
      Sharing.shareAsync(fileUri);
      //   Linking.openURL(fileUri).catch((err) => alert(err));
    };
    fr.readAsDataURL(fileBlob);
  };

  const convertWordArrayToUint8Array = (wordArray) => {
    var arrayOfWords = wordArray.hasOwnProperty("words") ? wordArray.words : [];
    var length = wordArray.hasOwnProperty("sigBytes")
      ? wordArray.sigBytes
      : arrayOfWords.length * 4;
    var uInt8Array = new Uint8Array(length),
      index = 0,
      word,
      i;
    for (i = 0; i < length; i++) {
      word = arrayOfWords[i];
      uInt8Array[index++] = word >> 24;
      uInt8Array[index++] = (word >> 16) & 0xff;
      uInt8Array[index++] = (word >> 8) & 0xff;
      uInt8Array[index++] = word & 0xff;
    }
    return uInt8Array;
  };

  return (
    <View className="flex flex-row justify-between align-center w-full rounded-lg border group  bg-white">
      <View className="flex flex-row justify-start align-center">
        <View className="p-2 w-25 place-items-center ">
          <Icon name={getIconFromIdentifier(fileName)} size={42} />
        </View>
        <View className="p-4 content-center w-[60vw] ">
          <Text className="text-[14px] font-medium" numberOfLines={1}>
            {getNameFromIndentifier(fileName)}
          </Text>
        </View>
      </View>
      <TouchableWithoutFeedback onPress={() => download()}>
        <View className="p-4">
          <Icon name="download" size={30} color="rgb(36 144 239)" />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default FileIcon;
