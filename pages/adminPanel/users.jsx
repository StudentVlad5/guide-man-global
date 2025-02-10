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
import Image from 'next/image';
import { placeHolder, patternInput } from '../../helpers/constant';
import saveCredentials from '../api/userProfile';
import { removeDocumentFromCollection } from '../../helpers/firebaseControl';

const PAGE_SIZE = 10;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [checkPage, setCheckPage] = useState(1);
  const [countOFPages, setCountOFPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModal, setIsModal] = useState(false);
  const [editUser, setEditUser] = useState(false);
  const [validateStatus, setValidateStatus] = useState(false);
  const [checkFetch, setcheckFetch] = useState(false);
  const [lastVisiblePerPage, setLastVisiblePerPage] = useState({});

  useEffect(() => {
    fetchUsers();
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

  const fetchUsers = async () => {
    setLoading(true);
    const usersRef = collection(db, 'users');
    let q = query(usersRef, orderBy('email'), limit(PAGE_SIZE));

    if (search) {
      q = query(
        usersRef,
        where('email', '>=', search),
        where('email', '<=', search + '\uf8ff'),
        orderBy('email'),
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

    setUsers(userList);

    if (querySnapshot.docs.length > 0) {
      setLastVisiblePerPage(prev => ({
        ...prev,
        [page]: querySnapshot.docs[querySnapshot.docs.length - 1],
      }));
    }

    setCheckPage(page);
    try {
      let querySnapshotCount = await getDocs(usersRef);
      if (search) {
        querySnapshotCount = await getDocs(
          query(
            usersRef,
            where('email', '>=', search),
            where('email', '<=', search + '\uf8ff')
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
    setEditUser(users.find(it => it.id === id));
  };

  const handleDelete = async el => {
    try {
      await removeDocumentFromCollection(`users`, el.idPost);
      fetchUsers();
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
    const check = saveCredentials({
      ...editUser,
    });
    if (check) {
      setIsModal(false);
      setEditUser('');
    }
  };

  return (
    <div className={styles.main}>
      <h1>
        <Link href="/adminPanel"> ← Панель администраторa</Link> / Пользователи
      </h1>
      <div className={styles.category}>
        <div>
          <h1>Users Search</h1>
          <input
            type="text"
            value={search}
            className={styles.searchPanel}
            onChange={handleSearchChange}
            placeholder="Search by email"
          />

          {/* Table displaying user data */}
          {users && (
            <table className={styles.tablewidth}>
              <thead>
                <tr className={styles.tablewidth}>
                  <th className={styles.tableHead}>Name</th>
                  <th className={`${styles.tableHead} ${styles.tableHide}`}>
                    Surname
                  </th>
                  <th className={`${styles.tableHead} ${styles.tableHide}`}>
                    Role
                  </th>
                  <th className={styles.tableHead}>Email</th>
                  <th className={`${styles.tableHead} ${styles.tableHide}`}>
                    Phone Number
                  </th>
                  <th className={`${styles.tableHead} ${styles.tableHide}`}>
                    Сountry
                  </th>
                  <th className={styles.tableHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3">Loading...</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}>
                      <td className={styles.tableHead}>{user?.name}</td>
                      <td className={`${styles.tableHead} ${styles.tableHide}`}>
                        {user?.surname}
                      </td>
                      <td className={`${styles.tableHead} ${styles.tableHide}`}>
                        {user?.role}
                      </td>
                      <td className={styles.tableHead}>{user?.email}</td>
                      <td className={`${styles.tableHead} ${styles.tableHide}`}>
                        {user?.phoneNumber}
                      </td>
                      <td className={`${styles.tableHead} ${styles.tableHide}`}>
                        {user?.country}
                      </td>
                      <td
                        className={styles.tableHead}
                        style={{ textAlign: 'center' }}
                      >
                        <button
                          onClick={() => handleEdit(user.id)}
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
                          onClick={() => handleDelete(user)}
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
          <p>{`Текущая страница ${page}`}</p>
          <p>{`Всего страниц в базе данных: ${countOFPages}`}</p>
        </div>
        {isModal && (
          <Modal
            title={'Редактировать данные пользователя'}
            handleModal={handleModal}
            form={
              <form className={st.form}>
                <ul className="flexWrap">
                  {Object.keys(editUser) &&
                    Object.keys(editUser).map(it => {
                      return (
                        it !== 'id' &&
                        it !== 'uid' && (
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
                                !patternInput[it].test(editUser[it])
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
                              value={editUser[it]}
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

                                setEditUser({
                                  ...editUser,
                                  [it]: e.currentTarget.value,
                                });
                              }}
                            />
                            <span
                              className={
                                patternInput[it] &&
                                !patternInput[it].test(editUser[it])
                                  ? st.form__validate
                                  : st.form__validate__hide
                              }
                            >
                              {'Please use pattern'}: {placeHolder[it]}
                            </span>
                          </li>
                        )
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
