import { db } from '../../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'; // Import required Firestore functions
import { getCollectionWhereKeyValue } from '../../helpers/firebaseControl';

export default async function saveCredentials(userCredentials) {
  try {
    const users = await getCollectionWhereKeyValue(
      'users',
      'uid',
      userCredentials.uid
    );

    if (!users || users.length === 0) {
      console.error(`User with UID ${uid} not found in the database.`);
      throw new Error(`User with UID ${uid} does not exist.`);
    }

    const user = users[0];
    const userRef = doc(db, 'users', user.idPost);
    // const userRef = doc(db, 'users', userCredentials.uid); // Get a reference to the document using the uid
    const docSnapshot = await getDoc(userRef);

    if (docSnapshot.exists()) {
      // If the document exists, update the data
      await updateDoc(userRef, userCredentials);
      console.log('Credentials updated successfully!');
    } else {
      // If the document doesn't exist, create it
      await setDoc(userRef, userCredentials);
      console.log('Credentials saved successfully (new user).');
    }

    return 1; // Success
  } catch (error) {
    console.error('Error saving credentials: ', error);
    return 0; // Error occurred
  }
}
