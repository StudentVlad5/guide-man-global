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

export default function AdminLawyer() {
  const [lawyer, setLawyer] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModal, setIsModal] = useState(false);
  const [editLawyer, setEditLawyer] = useState(false);
  const [validateStatus, setValidateStatus] = useState(false);
  const [checkFetch, setCheckFetch] = useState(false);

  useEffect(() => {
    fetchLawyer();
  }, [search]);

  useEffect(() => {
    if (checkFetch) {
      const renewFetch = setTimeout(() => {
        fetchLawyer();
      }, 2000);
      return () => {
        clearTimeout(renewFetch);
      };
    }
  }, [checkFetch, isModal]);

  const fetchLawyer = async () => {
    setLoading(true);
    const lawyerRef = collection(db, 'lawyers');
    let q = query(lawyerRef, orderBy('surname'));

    if (search) {
      q = query(
        lawyerRef,
        where('title', '>=', search),
        where('title', '<=', search + '\uf8ff'),
        orderBy('title')
      );
    }

    const querySnapshot = await getDocs(q);
    const lawyerList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setLawyer([...lawyerList]);
    setLoading(false);
  };
  // console.log(editLawyer);

  const handleEdit = id => {
    setIsModal(true);
    setEditLawyer(lawyer.find(it => it.id === id));
  };

  const handleDelete = async el => {
    try {
      await removeDocumentFromCollection(`lawyers`, el.id);
      fetchLawyer();
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
      'lawyers',
      { ...editLawyer },
      editLawyer.id
    );
    if (check) {
      setIsModal(false);
      setEditLawyer('');
    }
  };

  return (
    <div className={styles.main}>
      <h1>
        <Link href="/adminPanel"> ← Панель администраторa</Link> / Адвокат
      </h1>
      <div className={styles.category}>
        <div>
          <h2>Поиск адвоката</h2>
          <input
            type="text"
            value={search}
            className={styles.searchPanel}
            onChange={handleSearchChange}
            placeholder="Поиск по фамилии"
          />

          {/* Table displaying lawyer data */}
          {lawyer && (
            <table className={styles.tablewidth}>
              <thead>
                <tr>
                  <th className={styles.tableHead}>Surname</th>
                  <th className={`${styles.tableHead}`}>Name</th>
                  <th className={`${styles.tableHead}`}>FathersName</th>
                  <th className={`${styles.tableHead}`}>Application</th>
                  <th className={`${styles.tableHead}`}>Address</th>
                  <th className={`${styles.tableHead}`}>Telephone</th>
                  <th className={`${styles.tableHead}`}>Email</th>
                  <th className={`${styles.tableHead}`}>Certificate</th>
                  <th className={styles.tableHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3">Loading...</td>
                  </tr>
                ) : (
                  lawyer.map(lawyer => (
                    <tr key={lawyer.id}>
                      <td className={styles.tableHead}>{lawyer?.surname}</td>
                      <td className={`${styles.tableHead}`}>{lawyer?.name}</td>
                      <td className={`${styles.tableHead}`}>
                        {lawyer?.fathersName}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {lawyer?.application}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {lawyer?.address}
                      </td>
                      <td className={`${styles.tableHead}`}>{lawyer?.tel}</td>
                      <td className={`${styles.tableHead}`}>{lawyer?.email}</td>
                      <td className={`${styles.tableHead}`}>
                        № {lawyer?.certificate?.number}
                        {' від'}
                        {lawyer?.certificate?.date}
                        {' виданий'} {lawyer?.certificate?.agency}
                      </td>
                      <td
                        className={styles.tableHead}
                        style={{ textAlign: 'center' }}
                      >
                        <button
                          onClick={() => handleEdit(lawyer.id)}
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
                          onClick={() => handleDelete(lawyer)}
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
            title={'Редактировать данные адвоката'}
            handleModal={handleModal}
            form={
              <form className={st.form}>
                <ul className="flexWrap">
                  {Object.keys(editLawyer) &&
                    Object.keys(editLawyer).map(it => {
                      return Array.isArray(editLawyer[it]) ||
                        typeof editLawyer[it] === 'object'
                        ? Object.keys(editLawyer[it]).map((i, ind) => {
                            if (
                              !Array.isArray(editLawyer[it[i]]) &&
                              typeof editLawyer[it[i]] === 'object'
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
                                    value={editLawyer[it[i]]}
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
                                      setEditLawyer({
                                        ...editLawyer,
                                        [it]: {
                                          ...editLawyer[it],
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
                                  !patternInput[it].test(editLawyer[it])
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
                                value={editLawyer[it]}
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
                                  setEditLawyer({
                                    ...editLawyer,
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
                  className={styles.submitButton}
                  style={{ marginTop: '20px' }}
                  onClick={e => handleSubmit(e)}
                  disabled={validateStatus}
                >
                  {'Обновить'}
                </button>
              </form>
            }
          />
        )}
      </div>
    </div>
  );
}
