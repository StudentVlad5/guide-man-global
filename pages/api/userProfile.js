import { db } from "../../firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getCollectionWhereKeyValue } from "../../helpers/firebaseControl";

export default async function saveCredentials(userCredentials) {
  try {
    const users = await getCollectionWhereKeyValue(
      "users",
      "uid",
      userCredentials.uid
    );

    if (!users || users.length === 0) {
      console.error(`User with UID ${uid} not found in the database.`);
      throw new Error(`User with UID ${uid} does not exist.`);
    }

    const user = users[0];
    const userRef = doc(db, "users", user.idPost);
    const docSnapshot = await getDoc(userRef);

    if (docSnapshot.exists()) {
      await updateDoc(userRef, userCredentials);
      console.log("Credentials updated successfully!");
    } else {
      await setDoc(userRef, userCredentials);
      console.log("Credentials saved successfully (new user).");
    }

    return 1;
  } catch (error) {
    console.error("Error saving credentials: ", error);
    return 0;
  }
}
