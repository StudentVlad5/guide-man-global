import {
  runTransaction,
  doc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { updateDocumentInCollection } from './firebaseControl';

// Функція послідовного видачі першого вільного ордера
export async function assignOrderToUser(db, requestId, userData) {
  if (!requestId) {
    throw new Error('assignOrderToUser: requestId не може бути undefined!');
  }

  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('status', '==', 'free'),
    orderBy('id', 'asc') // Вибираємо найменший ORDER-0001, ORDER-0002...
  );
  const ordersSnapshot = await getDocs(q);

  if (ordersSnapshot.empty) throw new Error('Немає доступних ордерів!');

  const firstOrderDoc = ordersSnapshot.docs[0]; // Беремо перший вільний ордер
  const orderRef = doc(db, 'orders', firstOrderDoc.id);

  return runTransaction(db, async transaction => {
    const orderDoc = await transaction.get(orderRef);

    if (!orderDoc.exists()) throw new Error('Ордер не знайдено!');
    if (orderDoc.data().status !== 'free')
      throw new Error('Ордер вже використано!');

    // Оновлюємо статус ордера та прив'язуємо його до користувача
    transaction.update(orderRef, {
      status: 'used',
      assignedTo: requestId,
      userData: userData,
    });

    return {
      id: firstOrderDoc.id,
      pdfUrl: orderDoc.data().pdfUrl,
    };
  });
}
