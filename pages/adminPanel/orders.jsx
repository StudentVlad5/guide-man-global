import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { Modal } from '../../components/Modal';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';
import {
  updateDocumentInCollection,
  removeDocumentFromCollection,
} from '../../helpers/firebaseControl';
import styles from '../../styles/adminPanel.module.scss';

const PAGE_SIZE = 10;

export default function UploadOrders() {
  const [files, setFiles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [checkPage, setCheckPage] = useState(1);
  const [countOFPages, setCountOFPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModal, setIsModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [validateStatus, setValidateStatus] = useState(false);
  const [checkFetch, setcheckFetch] = useState(false);
  const [lastVisiblePerPage, setLastVisiblePerPage] = useState({});

  useEffect(() => {
    fetchOrders();
  }, [page, search]);

  useEffect(() => {
    if (checkFetch) {
      const renewFetch = setTimeout(() => {
        fetchOrders();
      }, 2000);
      return () => {
        clearTimeout(renewFetch);
      };
    }
  }, [checkFetch, isModal]);

  const fetchOrders = async () => {
    setLoading(true);
    const ordersRef = collection(db, 'orders');
    let q = query(ordersRef, orderBy('orderId'), limit(PAGE_SIZE));

    if (search) {
      q = query(
        ordersRef,
        where('orderId', '>=', search),
        where('orderId', '<=', search + '\uf8ff'),
        orderBy('orderId'),
        limit(PAGE_SIZE)
      );
    }

    if (page > 1 && lastVisiblePerPage[page - 1]) {
      q = query(q, startAfter(lastVisiblePerPage[page - 1]));
    } else if (page < checkPage && lastVisiblePerPage[page + 1] && page !== 1) {
      q = query(q, startBefore(lastVisiblePerPage[page + 1]));
    }

    const querySnapshot = await getDocs(q);
    const userList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setOrders(userList);
    if (querySnapshot.docs.length > 0) {
      setLastVisiblePerPage(prev => ({
        ...prev,
        [page]: querySnapshot.docs[querySnapshot.docs.length - 1],
      }));
    }

    setCheckPage(page);
    try {
      let querySnapshotCount = await getDocs(ordersRef);
      if (search) {
        querySnapshotCount = await getDocs(
          query(
            ordersRef,
            where('orderId', '>=', search),
            where('orderId', '<=', search + '\uf8ff')
          )
        );
      }
      const collectionLength = querySnapshotCount.size;
      setCountOFPages(Math.ceil(collectionLength / PAGE_SIZE));
    } catch (error) {
      console.error('Error getting documents:', error);
    }
    setLoading(false);
  };

  const handleEdit = id => {
    setIsModal(true);
    setEditOrder(orders.find(it => it.id === id));
  };

  const handleDelete = async el => {
    try {
      await removeDocumentFromCollection(`orders`, el.id);
      fetchOrders();
    } catch (error) {
      alert(error);
    }
  };

  const handlePageChange = newPage => {
    if (newPage < 1 || newPage > countOFPages) return;
    setPage(newPage);
  };

  const handleSearchChange = e => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleModal = () => {
    setcheckFetch(true);
    setIsModal(!isModal);
  };

  const handleSubmit = e => {
    e.preventDefault();
    const check = updateDocumentInCollection(
      'orders',
      { ...editOrder },
      editOrder.id
    );
    if (check) {
      setIsModal(false);
      setEditOrder('');
    }
  };

  const handleFileChange = event => {
    const selectedFiles = Array.from(event.target.files);
    const fileReaders = selectedFiles.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          resolve({
            name: file.name,
            base64: reader.result.split(',')[1], // Беремо тільки base64 частину
          });
        };
      });
    });

    Promise.all(fileReaders).then(filesData => {
      setFiles(filesData);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Оберіть файли для завантаження');
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/pdf/uploadOrdersToFirestore', {
        method: 'POST',
        // headers: { 'Content-Type': 'application/json' },
        // body: JSON.stringify({ files }),
        body: formData,
      });

      const data = await response.json();
      alert(data.message);
      setFiles([]); // Очищаємо список після завантаження
    } catch (error) {
      console.error('Помилка завантаження:', error);
      alert('Помилка завантаження ордерів');
    }
  };

  return (
    <div className={styles.main}>
      <h1>
        <Link href="/adminPanel"> ← Панель администраторa</Link> / Вопросы
      </h1>
      <div className={styles.category}>
        <h2>Завантаження ордерів</h2>
        <input type="file" multiple accept=".pdf" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={files.length === 0}>
          Завантажити
        </button>
      </div>
    </div>
  );
}
