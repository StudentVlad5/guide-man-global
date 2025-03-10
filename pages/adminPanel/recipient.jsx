import { useEffect, useState } from 'react';
import styles from '../../styles/adminPanel.module.scss';
import styl from '../../styles/lawyersRequestForm.module.scss';
import st from '../../styles/formPage.module.scss';
import { db } from '../../firebase';
import { Modal } from '../../components/Modal';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { placeHolder, patternInput } from '../../helpers/constant';
import { updateDocumentInCollection } from '../../helpers/firebaseControl';

export default function AdminRecipient() {
  const [recipient, setRecipient] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModal, setIsModal] = useState(false);
  const [editRecipient, setEditRecipient] = useState(false);
  const [validateStatus, setValidateStatus] = useState(false);
  const [checkFetch, setCheckFetch] = useState(false);

  useEffect(() => {
    fetchRecipient();
  }, [search]);

  useEffect(() => {
    if (checkFetch) {
      const renewFetch = setTimeout(() => {
        fetchRecipient();
      }, 2000);
      return () => {
        clearTimeout(renewFetch);
      };
    }
  }, [checkFetch, isModal]);

  const fetchRecipient = async () => {
    setLoading(true);
    const recipientRef = collection(db, 'recipient');
    let q = query(recipientRef, orderBy('title'));

    if (search) {
      q = query(
        recipientRef,
        where('title', '>=', search),
        where('title', '<=', search + '\uf8ff'),
        orderBy('title')
      );
    }

    const querySnapshot = await getDocs(q);
    const recipientList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setRecipient([...recipientList]);
    setLoading(false);
  };
  // console.log(editRecipient);

  const handleEdit = id => {
    setIsModal(true);
    setEditRecipient(recipient.find(it => it.id === id));
  };

  const handleDelete = async el => {
    try {
      await removeDocumentFromCollection(`recipient`, el.id);
      fetchRecipient();
    } catch (error) {
      alert(error);
    }
  };

  const handleSearchChange = e => {
    setSearch(e.target.value);
  };

  const handleModal = () => {
    setCheckFetch(true);
    setIsModal(!isModal);
  };

  const handleSubmit = e => {
    e.preventDefault();
    const check = updateDocumentInCollection(
      'recipient',
      { ...editRecipient },
      editRecipient.id
    );
    if (check) {
      setIsModal(false);
      setEditRecipient('');
    }
  };
  return (
    <div className={styles.main}>
      <h1>
        <Link href="/adminPanel"> ← Панель администраторa</Link> / Адрес
        госорганов
      </h1>
      <div className={styles.category}>
        <div>
          <h2>Поиск госоргана</h2>
          <input
            type="text"
            value={search}
            className={styles.searchPanel}
            onChange={handleSearchChange}
            placeholder="Поиск по названию"
          />

          {/* Table displaying recipient data */}
          {recipient && (
            <table className={styles.tablewidth}>
              <thead>
                <tr>
                  <th className={styles.tableHead}>Name</th>
                  <th className={`${styles.tableHead}`}>Title</th>
                  <th className={`${styles.tableHead}`}>Application</th>
                  <th className={`${styles.tableHead}`}>Address</th>
                  <th className={styles.tableHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3">Loading...</td>
                  </tr>
                ) : (
                  recipient.map(recipient => (
                    <tr key={recipient.id}>
                      <td className={styles.tableHead}>{recipient?.name}</td>
                      <td className={`${styles.tableHead}`}>
                        {recipient?.title}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {recipient?.application}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {recipient?.address}
                      </td>
                      <td
                        className={styles.tableHead}
                        style={{ textAlign: 'center' }}
                      >
                        <button
                          onClick={() => handleEdit(recipient.id)}
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
                          onClick={() => handleDelete(recipient)}
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
        </div>
        {isModal && (
          <Modal
            title={'Редактировать данные госоргана'}
            handleModal={handleModal}
            form={
              <form className={st.form}>
                <ul className="flexWrap">
                  {Object.keys(editRecipient) &&
                    Object.keys(editRecipient).map(it => {
                      return Array.isArray(editRecipient[it]) ||
                        typeof editRecipient[it] === 'object'
                        ? Object.keys(editRecipient[it]).map((i, ind) => {
                            if (
                              !Array.isArray(editRecipient[it[i]]) &&
                              typeof editRecipient[it[i]] === 'object'
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
                                    value={editRecipient[it[i]]}
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
                                      setEditRecipient({
                                        ...editRecipient,
                                        [it]: {
                                          ...editRecipient[it],
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
                                  !patternInput[it].test(editRecipient[it])
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
                                value={editRecipient[it]}
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
                                  setEditRecipient({
                                    ...editRecipient,
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
