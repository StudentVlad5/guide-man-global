import { useEffect, useState } from 'react';
import styles from '../../styles/adminPanel.module.scss';
import styl from '../../styles/lawyersRequestForm.module.scss';
import st from '../../styles/formPage.module.scss';
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
import Link from 'next/link';
import { placeHolder, patternInput } from '../../helpers/constant';
import {
  updateDocumentInCollection,
  removeDocumentFromCollection,
} from '../../helpers/firebaseControl';
import Image from 'next/image';

const PAGE_SIZE = 10;

export default function AdminOrders() {
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
    const ordersRef = collection(db, 'userRequests');
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

  const handleEdit = id => {
    setIsModal(true);
    setEditOrder(orders.find(it => it.id === id));
  };

  const handleDelete = async el => {
    try {
      await removeDocumentFromCollection(`userRequests`, el.id);
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
      'userRequests',
      { ...editOrder },
      editOrder.id
    );
    if (check) {
      setIsModal(false);
      setEditOrder('');
    }
  };

  const sortedOrders = orders
    .map(order => ({ ...order, dateCreating: order.dateCreating }))
    .sort((a, b) => {
      const dateA = a.dateCreating.split('.').reverse().join('-'); // "YYYY-MM-DD"
      const dateB = b.dateCreating.split('.').reverse().join('-');
      return dateB.localeCompare(dateA); // Сортування за спаданням (новіші зверху)
    });

  return (
    <div className={styles.main}>
      <h1>
        <Link href="/adminPanel"> ← Панель администраторa</Link> / Запросы
      </h1>
      <div className={styles.category}>
        <div>
          <h2>Поиск запросов клиентов</h2>
          <input
            type="text"
            value={search}
            className={styles.searchPanel}
            onChange={handleSearchChange}
            placeholder="Поиск по id"
          />

          {/* Table displaying user data */}
          {sortedOrders && (
            <table className={styles.tablewidth}>
              <thead>
                <tr>
                  <th className={styles.tableHead}>Name</th>
                  <th className={`${styles.tableHead}`}>Date Creating</th>
                  {/* <th className={`${styles.tableHead} ${styles.tableHide}`}>
                    Email
                  </th> */}
                  <th className={`${styles.tableHead}`}>Title</th>
                  <th className={`${styles.tableHead}`}>Status</th>
                  <th className={`${styles.tableHead}`}>LawyersRequest</th>
                  <th className={`${styles.tableHead}`}>Agreement</th>
                  <th className={`${styles.tableHead}`}>Contract</th>
                  <th className={`${styles.tableHead}`}>Order</th>
                  <th className={styles.tableHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3">Loading...</td>
                  </tr>
                ) : (
                  sortedOrders.map(order => (
                    <tr key={order.id}>
                      <td className={styles.tableHead}>
                        {order?.name} {order?.surname} {order?.fatherName}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {order?.dateCreating}
                      </td>
                      {/* <td className={`${styles.tableHead} ${styles.tableHide}`}>
                        {order?.email}
                      </td> */}
                      <td className={`${styles.tableHead}`}>{order?.title}</td>
                      <td
                        className={`${styles.tableHead}`}
                        style={{ textAlign: 'center' }}
                      >
                        {order?.status}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {order?.pdfLawyersRequest}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {order?.pdfAgreement}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {order?.pdfContract}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {order?.pdfOrder}
                      </td>
                      <td
                        className={styles.tableHead}
                        style={{ textAlign: 'center' }}
                      >
                        <button
                          onClick={() => handleEdit(order.id)}
                          style={{ border: 'none' }}
                        >
                          <Image
                            src="/edit_icon.svg"
                            alt="Edit"
                            width={20}
                            height={20}
                          />
                        </button>
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
        {isModal && (
          <Modal
            title={'Редактировать данные запроса пользователя'}
            handleModal={handleModal}
            form={
              <form className={st.form}>
                <ul className="flexWrap">
                  {Object.keys(editOrder) &&
                    Object.keys(editOrder)
                      .sort()
                      .map(it => {
                        return Array.isArray(editOrder[it]) ||
                          typeof editOrder[it] === 'object'
                          ? Object.keys(editOrder[it])
                              .sort()
                              .map((i, ind) => {
                                if (
                                  !Array.isArray(editOrder[it[i]]) &&
                                  typeof editOrder[it[i]] === 'object'
                                )
                                  return (
                                    <li key={ind} className={st.form__li}>
                                      <span
                                        className={styl.orderForm__form_span}
                                        style={{ color: '#fff' }}
                                      >
                                        {i}:
                                      </span>
                                      <input
                                        style={{
                                          width: '100%',
                                          padding: '0 16px',
                                          height: '48px',
                                          display: 'flex',
                                          alignItems: 'center',
                                        }}
                                        type="text"
                                        id={ind}
                                        name={i}
                                        value={editOrder[it[i]]}
                                        pattern={patternInput[it[i]]?.source}
                                        placeholder={placeHolder[it[i]]}
                                        onChange={e => {
                                          if (
                                            patternInput[it[i]] &&
                                            !patternInput[it[i]].test(
                                              e.target.value
                                            )
                                          ) {
                                            setValidateStatus(true);
                                          } else {
                                            setValidateStatus(false);
                                          }
                                          setEditOrder({
                                            ...editOrder,
                                            [it]: {
                                              ...editOrder[it],
                                              [i]: e.currentTarget.value,
                                            },
                                          });
                                        }}
                                      />
                                      <span style={{ color: '#fff' }}>
                                        {placeHolder[it[i]] &&
                                          'Please use pattern:' +
                                            placeHolder[it[i]]}
                                      </span>
                                    </li>
                                  );
                              })
                          : it !== 'id' && (
                              <li key={it} className={st.form__li}>
                                <span
                                  className={styl.orderForm__form_span}
                                  style={{ color: '#fff' }}
                                >
                                  {it}:
                                </span>
                                <input
                                  className={
                                    patternInput[it] &&
                                    !patternInput[it].test(editOrder[it])
                                      ? st.form__input__danger
                                      : styl.orderForm__form_input
                                  }
                                  style={{
                                    width: '100%',
                                    padding: '0 16px',
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                  type="text"
                                  id={it}
                                  name={it}
                                  value={editOrder[it]}
                                  pattern={patternInput[it]?.source}
                                  placeholder={placeHolder[it]}
                                  onChange={e => {
                                    if (
                                      patternInput[it] &&
                                      !patternInput[it].test(e.target.value)
                                    ) {
                                      setValidateStatus(true);
                                    } else {
                                      setValidateStatus(false);
                                    }
                                    setEditOrder({
                                      ...editOrder,
                                      [it]: e.currentTarget.value,
                                    });
                                  }}
                                />
                                <span style={{ color: '#fff' }}>
                                  {placeHolder[it] &&
                                    'Please use pattern:' + placeHolder[it]}
                                </span>
                              </li>
                            );
                      })}
                </ul>
                <button
                  type="submit"
                  className={`button ${st.form__button}`}
                  style={{ marginTop: '20px' }}
                  onClick={e => handleSubmit(e)}
                  disabled={validateStatus}
                >
                  {'submit'}
                </button>
              </form>
            }
          />
        )}
      </div>
    </div>
  );
}
