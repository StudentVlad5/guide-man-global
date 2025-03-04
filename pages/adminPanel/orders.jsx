import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';
import { removeDocumentFromCollection } from '../../helpers/firebaseControl';
import styles from '../../styles/adminPanel.module.scss';
import Image from 'next/image';

const PAGE_SIZE = 10;

export default function UploadOrders() {
  const [files, setFiles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [checkPage, setCheckPage] = useState(1);
  const [countOFPages, setCountOFPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
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
  }, [checkFetch]);

  const fetchOrders = async () => {
    setLoading(true);
    const ordersRef = collection(db, 'orders');
    let q = query(ordersRef, orderBy('id'), limit(PAGE_SIZE));

    if (search) {
      q = query(
        ordersRef,
        where('id', '>=', search),
        where('id', '<=', search + '\uf8ff'),
        orderBy('id'),
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
            where('id', '>=', search),
            where('id', '<=', search + '\uf8ff')
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

  const handleFileChange = event => {
    const selectedFiles = Array.from(event.target.files);
    console.log('Вибрані файли:', selectedFiles);

    if (selectedFiles.length === 0) {
      alert('Выберите файлы для загрузки.');
      return;
    }

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
    // Перевіряємо, чи вибрано файли
    if (!files || files.length === 0) {
      alert('Выберите файлы для загрузки.');
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      const blob = new Blob([file.base64], { type: 'application/pdf' });
      formData.append('files', blob, file.name);
    });

    try {
      const response = await fetch('/api/pdf/uploadOrdersToFirestore', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Помилка завантаження.');
      }

      alert(`Успешно загружено: ${result.message}`);

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
        <h2>Загрузка ордеров</h2>
        <input type="file" multiple accept=".pdf" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={files.length === 0}>
          Загрузить
        </button>
      </div>
      <div className={styles.category}>
        <div>
          <h2>Поиск ордеров</h2>
          <input
            type="number"
            value={search}
            className={styles.searchPanel}
            onChange={handleSearchChange}
            placeholder="Поиск по id"
          />

          {/* Table displaying user data */}
          {orders && (
            <table className={styles.tablewidth}>
              <thead>
                <tr>
                  <th className={styles.tableHead}>ID</th>
                  <th className={`${styles.tableHead} ${styles.tableHide}`}>
                    Status
                  </th>
                  <th className={`${styles.tableHead}`}>AssignedTo</th>
                  <th className={`${styles.tableHead} ${styles.tableHide}`}>
                    UserData
                  </th>
                  <th className={`${styles.tableHead}`}>Url</th>
                  <th className={styles.tableHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3">Loading...</td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id}>
                      <td className={styles.tableHead}>{order?.id}</td>
                      <td className={`${styles.tableHead} ${styles.tableHide}`}>
                        {order?.status}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {order?.assignedTo}
                      </td>
                      <td className={`${styles.tableHead} ${styles.tableHide}`}>
                        {order?.userData}
                      </td>
                      <td className={`${styles.tableHead}`}>{order?.pdfUrl}</td>
                      <td
                        className={styles.tableHead}
                        style={{ textAlign: 'center' }}
                      >
                        <button
                          onClick={() => handleDelete(order)}
                          style={{ border: 'none', marginLeft: '10px' }}
                        >
                          <Image
                            src="/del.svg"
                            alt="Delete"
                            width={20}
                            height={20}
                          />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          <div className={styles.pagination}>
            <div className={styles.pagination__pages}>
              <button
                className={styles.pagination__button}
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </button>
              <button
                className={styles.pagination__button}
                disabled={page >= countOFPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </button>
            </div>
            <div className={styles.pagination__pages__count}>
              <p>{`Текущая страница ${page}`}</p>
              <p>{`Всего страниц в базе данных: ${countOFPages}`}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
