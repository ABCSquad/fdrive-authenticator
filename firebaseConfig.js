import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
	apiKey: "api-key",
	authDomain: "project-id.firebaseapp.com",
	databaseURL: "https://project-id.firebaseio.com",
	projectId: "project-id",
	storageBucket: "project-id.appspot.com",
	messagingSenderId: "sender-id",
	appId: "app-id",
	measurementId: "G-measurement-id",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
