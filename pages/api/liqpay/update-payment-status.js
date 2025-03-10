import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { updateDocumentInCollection } from '../../../helpers/firebaseControl';

export default async function handler(req, res) {
  // console.log("Received update request:", req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, order_id, status } = req.body;

  if (!uid || !order_id || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = getFirestore();
    const userRequestsRef = collection(db, 'userRequests');

    const allUserRequestsQuery = query(
      userRequestsRef,
      where('uid', '==', uid)
    );
    const allUserRequestsSnapshot = await getDocs(allUserRequestsQuery);

    let q = query(
      userRequestsRef,
      where('uid', '==', uid),
      where('idPost', '==', order_id)
    );

    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({
        error: 'Specific request not found',
        details: {
          uid,
          order_id,
          userRequestsCount: allUserRequestsSnapshot.size,
        },
      });
    }

    const requestId = querySnapshot.docs[0].id;

    await updateDocumentInCollection(
      'userRequests',
      {
        paymentStatus: status,
        status: status === 'success' ? 'paid' : 'pending',
        responseDate: new Date().toISOString(),
      },
      requestId
    );

    return res
      .status(200)
      .json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res
      .status(500)
      .json({ error: 'Internal server error', details: error.message });
  }
}
