import { format } from 'date-fns';
import { getAuth } from 'firebase/auth';
import { app, realTimeDb } from '../firebase';
import { db } from '../firebase';
import { storage } from '../firebase';
import {
  ref,
  deleteObject,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { doc, setDoc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';

export const auth = getAuth(app);

export async function getCollection(collection) {
  return new Promise(function (resolve, reject) {
    db.collection(collection)
      .orderBy('dateCreating')
      .get()
      .then(res => {
        const data = [];
        res.forEach(doc => {
          data.push({
            idPost: doc.id,
            ...doc.data(),
          });
        });
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

export async function getTitleOfPosts(col, locale) {
  return new Promise(function (resolve) {
    db.collection(col).onSnapshot(function (snapshot) {
      const titles = [];
      snapshot.docs.forEach(el =>
        titles.push([
          el._delegate._document.data.value.mapValue.fields[locale].mapValue
            .fields.title.stringValue,
          el._delegate._document.data.value.mapValue.fields.type.stringValue,
          el._delegate._document.data.value.mapValue.fields.path.stringValue,
        ])
      );
      resolve(titles);
    });
  }).catch(err => {
    alert(err);
  });
}

export async function getTitleOfServices(locale) {
  return new Promise(function (resolve) {
    db.collection('services').onSnapshot(function (snapshot) {
      const titles = [];
      snapshot.docs.forEach(el =>
        titles.push([
          `${el._delegate._document.data.value.mapValue.fields.serviceType.mapValue.fields[locale].stringValue}: ${el._delegate._document.data.value.mapValue.fields[locale].mapValue.fields.title.stringValue}`,
          el._delegate._document.data.value.mapValue.fields.type.stringValue,
          el._delegate._document.data.value.mapValue.fields.path.stringValue,
        ])
      );
      resolve(titles);
    });
  }).catch(err => {
    alert(err);
  });
}

export const updateDocumentInCollection = async (
  collection,
  document,
  documentId
) => {
  try {
    const documentRef = doc(db, collection, documentId); // Отримуємо посилання на документ
    await updateDoc(documentRef, document); // Оновлюємо документ
    console.log(
      `Документ ${documentId} успішно оновлено у колекції ${collection}.`
    );
  } catch (error) {
    console.error('Помилка під час оновлення документа:', error);
    throw error;
  }
};

export function setDocumentToCollection(collection, document) {
  return new Promise(function (resolve, reject) {
    try {
      db.collection(collection)
        .add(document)
        .then(r => {
          updateDocumentInCollection(
            collection,
            { ...document, idPost: r.id },
            r.id
          )
            .then(res => console.log('success'))
            .catch(e => console.log(e));
          resolve({ result: r });
        })
        .catch(e => {
          reject(e);
        });
    } catch (e) {
      reject(e);
    }
  });
}

export function getCollectionWhereKeyValue(collection, key, value) {
  return new Promise(function (resolve, reject) {
    db.collection(collection)
      .where(key, '==', value)
      .get()
      .then(res => {
        const data = [];
        res.forEach(doc => {
          data.push({
            ...doc.data(),
            idPost: doc.id,
          });
        });
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

export function createNewUser(user, regInfo) {
  return new Promise(function (resolve, reject) {
    const user_to_firebase_start = {
      uid: user?.uid,
      email: user?.email || '',
      phoneNumber: regInfo?.phoneNumber || '',
      dateCreating: format(new Date(), 'dd-MM-yyyy HH:mm'),
      role: 'user',
    };
    setDocumentToCollection('users', user_to_firebase_start)
      .then(r => {
        console.log('user saved in DB');
        resolve(r);
      })
      .catch(e => {
        reject(e);
      });
  });
}

export async function updateFieldInDocumentInCollection(
  collection,
  docId,
  fieldName,
  newValue
) {
  let result;

  try {
    const docRef = db.collection(collection).doc(docId);
    result = await docRef.update({ [fieldName]: newValue });
  } catch (error) {
    console.log(error.message);
  }

  return result;
}

export function removeDocumentFromCollection(collection, docId) {
  return new Promise(function (resolve, reject) {
    try {
      db.collection(collection)
        .doc(docId)
        .delete()
        .then(r => {
          resolve(r);
        })
        .catch(e => {
          reject(e);
        });
    } catch (e) {
      reject(e);
    }
  });
}

export function uploadFileToStorage(file, id, postInfo) {
  return new Promise(function (resolve, reject) {
    storage
      .ref(`${id}`)
      .put(file)
      .then(res => {
        storage
          .ref()
          .child(id)
          .getDownloadURL()
          .then(r => {
            updateFieldInDocumentInCollection(
              `${postInfo.type}`,
              id,
              'image',
              r
            );
            console.log('updateUrl');
          })
          .catch(er => {
            alert(er);
          });
        resolve(res);
      })
      .catch(e => {
        reject(e);
      });
  });
}

export function deleteImageFromStorage(image) {
  return new Promise(function (resolve, reject) {
    deleteObject(ref(storage, image))
      .then(r => {
        resolve(r);
      })
      .catch(error => {
        reject(error);
      });
  });
}

export function createNewPost(postInfo, file, type, serviceType) {
  const id = Math.floor(Date.now() * Math.random()).toString();
  return new Promise(function (resolve, reject) {
    const post_to_firebase =
      type === 'services'
        ? {
            id,
            image: '',

            ua: {
              title: postInfo.ua.title || '',
              text: postInfo.ua.text || '',
            },

            ru: {
              title: postInfo.ru.title || '',
              text: postInfo.ru.text || '',
            },
            en: {
              title: postInfo.en.title || '',
              text: postInfo.en.text || '',
            },

            path: postInfo.path.length > 0 ? postInfo.path : id,
            type: postInfo.type,
            serviceType,
            dateCreating: format(new Date(), 'yyyy-MM-dd HH:mm'),
          }
        : type === 'requests'
        ? {
            id,

            ua: {
              title: postInfo.ua.title || '',
              text: postInfo.ua.text || '',
            },

            ru: {
              title: postInfo.ru.title || '',
              text: postInfo.ru.text || '',
            },
            en: {
              title: postInfo.en.title || '',
              text: postInfo.en.text || '',
            },

            path: postInfo.path.length > 0 ? postInfo.path : id,
            type: postInfo.type,
            requestType: {
              ua: postInfo.serviceType.ua || '',
              ru: postInfo.serviceType.ru || '',
              en: postInfo.serviceType.en || '',
            },
            recipient: postInfo.recipient || '',
            dateCreating: format(new Date(), 'yyyy-MM-dd HH:mm'),
          }
        : type === 'recipient'
        ? {
            id,
            name: postInfo.name || '',
            title: postInfo.title || '',
            application: postInfo.application || '',
            address: postInfo.address || '',
          }
        : {
            id,
            image: '',

            ua: {
              title: postInfo.ua.title || '',
              preview: postInfo.ua.preview || '',
              text: postInfo.ua.text || '',
            },
            ru: {
              title: postInfo.ru.title || '',
              preview: postInfo.ru.preview || '',
              text: postInfo.ru.text || '',
            },
            en: {
              title: postInfo.en.title || '',
              preview: postInfo.en.preview || '',
              text: postInfo.en.text || '',
            },

            path: postInfo.path.length > 0 ? postInfo.path : id,
            type: postInfo.type,
            dateCreating: format(new Date(), 'yyyy-MM-dd HH:mm'),
          };

    setDocumentToCollection(`${postInfo.type}`, post_to_firebase)
      .then(r => {
        if (file) {
          uploadFileToStorage(file, r.result.id, postInfo);
        }

        console.log('post saved in DB');

        resolve(r);
      })
      .catch(e => {
        reject(e);
      });
  });
}

export const saveRequestToFirestore = async (db, uid, data, pdfUrls) => {
  try {
    // Перевіряємо, чи існує юзер та документ
    const users = await getCollectionWhereKeyValue('users', 'uid', uid);

    if (!users || users.length === 0) {
      console.error(`User with UID ${uid} not found in the database.`);
      throw new Error(`User with UID ${uid} does not exist.`);
    }

    const user = users[0];

    // Виключаємо `request` з об'єкта `data`
    const { request, ...restData } = data;

    // Формуємо новий запит
    const newRequest = {
      dateCreating: format(new Date(), 'yyyy-MM-dd HH:mm'),
      title: data.request.ua.title || 'Запит',
      pdfLawyersRequest: pdfUrls.lawyersRequest || '',
      pdfAgreement: pdfUrls.agreement || '',
      pdfContract: pdfUrls.contract || '',
      pdfOrder: pdfUrls.order,
      userEmail: user.email,
      status: 'pending',
      ...restData,
    };

    // Зберігаємо новий запит в колекцію "userRequests"
    const requestRef = doc(db, 'userRequests', newRequest.id);
    await setDoc(requestRef, newRequest);

    console.log('Request saved successfully:', newRequest);
    return newRequest;
  } catch (error) {
    console.error('Error saving request to Firestore:', error);
    throw error;
  }
};

export const uploadPDFToStorage = async (pdfBuffer, fileName, storage) => {
  if (!storage) {
    throw new Error('Помилка: storage не визначено!');
  }

  if (!pdfBuffer || !fileName) {
    throw new Error('Помилка: Неправильні параметри для збереження файлу!');
  }
  const storageRef = ref(storage, fileName);

  try {
    // Завантажуємо PDF у Firebase Storage
    await uploadBytes(storageRef, pdfBuffer, {
      contentType: 'application/pdf',
    });

    // Отримуємо публічний URL для завантаженого файлу
    const fileUrl = await getDownloadURL(storageRef);
    return fileUrl;
  } catch (error) {
    console.error('Error uploading PDF to Storage:', error);
    throw error;
  }
};

export async function getNextAvailableOrder() {
  try {
    // Отримуємо всі ордери з бази Firestore
    const orders = await getCollection('orders');

    if (!orders || orders.length === 0) {
      throw new Error('Ордери відсутні у базі.');
    }

    // Знаходимо перший вільний ордер
    const availableOrder = orders.find(order => !order.used);

    if (!availableOrder) {
      throw new Error('Всі ордери використані.');
    }

    // Оновлюємо статус ордера на "used"
    await updateDocumentInCollection(
      'orders',
      { used: true },
      availableOrder.id
    );

    return { id: availableOrder.id, fileUrl: availableOrder.fileUrl };
  } catch (error) {
    console.error('Помилка отримання наступного ордера:', error);
    throw error;
  }
}

export async function uploadUpdatedOrder(requestId, pdfUrl) {
  try {
    const requestRef = doc(db, 'userRequests', requestId);
    await updateDoc(requestRef, { pdfOrder: pdfUrl });

    console.log(`Ордер збережено в userRequests ${requestId}: ${pdfUrl}`);
  } catch (error) {
    console.error('Помилка при оновленні ордера:', error);
    throw error;
  }
}
