import { useEffect, useState } from 'react';
import styles from '../../styles/adminPanel.module.scss';
import styl from '../../styles/lawyersRequestForm.module.scss';
import st from '../../styles/formPage.module.scss';
import { db, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { Modal } from '../../components/Modal';
import { placeHolder, patternInput } from '../../helpers/constant';
import {
  updateDocumentInCollection,
  removeDocumentFromCollection,
} from '../../helpers/firebaseControl';

export default function AdminLawyer() {
  const [lawyer, setLawyer] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModal, setIsModal] = useState(false);
  const [editLawyer, setEditLawyer] = useState(false);
  const [validateStatus, setValidateStatus] = useState(false);
  const [checkFetch, setCheckFetch] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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
    setCertificateFile(null); // Скидаємо файл при відкритті модального вікна
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

  const handleFileChange = e => {
    if (e.target.files[0]) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // const check = updateDocumentInCollection(
    //   'lawyers',
    //   { ...editLawyer },
    //   editLawyer.id
    // );
    // if (check) {
    //   setIsModal(false);
    //   setEditLawyer('');
    // }

    if (!editLawyer) return;

    setIsUploading(true);
    let updatedLawyerData = { ...editLawyer };

    try {
      // Крок 1: Якщо вибрано новий файл, завантажуємо його в Storage
      if (certificateFile) {
        const fileRef = ref(
          storage,
          `certificates/certificate_${editLawyer.id}.pdf`
        );
        await uploadBytes(fileRef, certificateFile);
        const downloadURL = await getDownloadURL(fileRef);
        updatedLawyerData.certificate = {
          ...(editLawyer.certificate || {}),
          fileUrl: downloadURL,
        };
        console.log('Файл сертифіката завантажено:', downloadURL);
      }

      // Крок 2: Оновлюємо документ в Firestore
      await updateDocumentInCollection(
        'lawyers',
        updatedLawyerData,
        editLawyer.id
      );

      // Крок 3: Закриваємо модальне вікно та оновлюємо дані
      setIsModal(false);
      setEditLawyer(null);
      setCertificateFile(null);
      fetchLawyer(); // Оновлюємо список адвокатів
    } catch (error) {
      console.error('Помилка оновлення даних адвоката:', error);
      alert('Не вдалося оновити дані. Дивіться консоль для деталей.');
    } finally {
      setIsUploading(false);
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
                  <th className={styles.tableHead}>Фамилия</th>
                  <th className={`${styles.tableHead}`}>Имя</th>
                  <th className={`${styles.tableHead}`}>Отчество</th>
                  <th className={`${styles.tableHead}`}>
                    Инициалы для подписи
                  </th>
                  <th className={`${styles.tableHead}`}>Адрес</th>
                  <th className={`${styles.tableHead}`}>Телефон</th>
                  <th className={`${styles.tableHead}`}>Email</th>
                  <th className={`${styles.tableHead}`}>
                    Сертификат (номер, дата, кем выдано)
                  </th>
                  <th className={`${styles.tableHead}`}>
                    Сертификат (файл PDF)
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
                      <td className={`${styles.tableHead}`}>
                        {lawyer?.certificate?.fileUrl}
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
        {isModal && editLawyer && (
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
                            </li>
                          );
                    })}

                  <li className={st.form__li}>
                    <span
                      className={styl.orderForm__form_span}
                      style={{ color: '#fff' }}
                    >
                      Сертификат (PDF):
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#fff',
                        backgroundColor: '#333',
                        border: '1px solid #555',
                        borderRadius: '4px',
                      }}
                    />
                    {editLawyer.certificateUrl && !certificateFile && (
                      <span
                        style={{
                          color: '#90ee90',
                          fontSize: '12px',
                          marginTop: '5px',
                        }}
                      >
                        Текущий файл:{' '}
                        <a
                          href={editLawyer.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          просмотреть
                        </a>
                      </span>
                    )}
                    {certificateFile && (
                      <span
                        style={{
                          color: '#add8e6',
                          fontSize: '12px',
                          marginTop: '5px',
                        }}
                      >
                        Новый файл: {certificateFile.name}
                      </span>
                    )}
                  </li>
                </ul>
                <button
                  type="submit"
                  className={styles.submitButton}
                  style={{ marginTop: '20px' }}
                  onClick={e => handleSubmit(e)}
                  disabled={validateStatus || isUploading}
                >
                  {isUploading ? 'Обновление...' : 'Обновить'}
                </button>
              </form>
            }
          />
        )}
      </div>
    </div>
  );
}
