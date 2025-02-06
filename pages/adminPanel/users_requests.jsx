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
import { updateDocumentInCollection } from '../../helpers/firebaseControl';
import Image from 'next/image';

const PAGE_SIZE = 10;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModal, setIsModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [validateStatus, setValidateStatus] = useState(false);
  const [checkFetch, setcheckFetch] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [page, search]);

  useEffect(() => {
    if (checkFetch) {
      const renewFetch = setTimeout(() => {
        fetchUsers();
      }, 2000);
      return () => {
        clearTimeout(renewFetch);
      };
    }
  }, [checkFetch, isModal]);

  const fetchOrders = async () => {
    setLoading(true);
    const ordersRef = collection(db, 'userRequests');
    let q = query(ordersRef, orderBy('name'), limit(PAGE_SIZE));

    if (search) {
      q = query(
        ordersRef,
        where('name', '>=', search),
        where('name', '<=', search + '\uf8ff'),
        orderBy('name'),
        limit(PAGE_SIZE)
      );
    }

    if (page > 1 && lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const querySnapshot = await getDocs(q);
    const userList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setOrders([...userList]);
    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    setLastVisible(lastVisibleDoc);

    setLoading(false);
  };

  const handleEdit = id => {
    setIsModal(true);
    setEditOrder(orders.find(it => it.id === id));
  };

  const handleDelete = async el => {
    try {
      await removeDocumentFromCollection(`${el.type}`, el.idPost);
    } catch (error) {
      alert(error);
    }
  };

  const handlePageChange = newPage => {
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
  return (
    <div className={styles.main}>
      <h1>
        <Link href="/adminPanel"> ← Панель администраторa</Link> / Заказы
      </h1>
      <div className={styles.category}>
        <div>
          <h1>Поиск запросов клиентов</h1>
          <input
            type="text"
            value={search}
            className={styles.searchPanel}
            onChange={handleSearchChange}
            placeholder="Поиск по имени"
          />

          {/* Table displaying user data */}
          {orders && (
            <table className={styles.tablewidth}>
              <thead>
                <tr>
                  <th className={styles.tableHead}>Name</th>
                  <th className={`${styles.tableHead} ${styles.tableHide}`}>
                    Surname
                  </th>
                  <th className={`${styles.tableHead}`}>dateCreating</th>
                  <th className={`${styles.tableHead} ${styles.tableHide}`}>
                    Email
                  </th>
                  <th className={`${styles.tableHead}`}>Title</th>
                  <th className={`${styles.tableHead}`}>Status</th>
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
                      <td className={styles.tableHead}>{order?.name}</td>
                      <td className={`${styles.tableHead} ${styles.tableHide}`}>
                        {order?.surname}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {order?.dateCreating}
                      </td>
                      <td className={`${styles.tableHead} ${styles.tableHide}`}>
                        {order?.email}
                      </td>
                      <td className={`${styles.tableHead}`}>{order?.title}</td>
                      <td className={`${styles.tableHead}`}>{order?.status}</td>
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
          <div>
            <button
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </button>
            <button
              disabled={!lastVisible}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
        {isModal && (
          <Modal
            title={'Редактировать данные пользователя'}
            handleModal={handleModal}
            form={
              <form className={st.form}>
                <ul className="flexWrap">
                  {Object.keys(editOrder) &&
                    Object.keys(editOrder).map(it => {
                      return Array.isArray(editOrder[it]) ||
                        typeof editOrder[it] === 'object'
                        ? Object.keys(editOrder[it]).map((i, ind) => {
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
