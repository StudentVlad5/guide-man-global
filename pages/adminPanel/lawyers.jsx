import { useEffect, useState } from 'react';
import { format } from 'date-fns';
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
  getCollection,
  setDocumentToCollection,
  uploadFileToStorage,
  getCollectionWhereKeyValue,
  updateDocumentInCollection,
  removeDocumentFromCollection,
} from '../../helpers/firebaseControl';

export default function AdminLawyer() {
  const init = {
    surname: '',
    name: '',
    fatherName: '',
    application: '',
    address: '',
    tel: '',
    email: '',
    status: '',
    certificate: {
      number: '',
      date: '',
      agency: '',
      fileUrl: '',
    },
  };
  const [lawyer, setLawyer] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModal, setIsModal] = useState(false);
  const [func, setFunc] = useState('updateInfo');
  const [editLawyer, setEditLawyer] = useState(init);
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
    setFunc('updateInfo');
    setIsModal(true);
    setEditLawyer(lawyer.find(it => it.id === id));
    setCertificateFile(null); // Скидаємо файл при відкритті модального вікна
  };

  const handleDelete = async el => {
    if (!el) return;
    const docId = el.id ?? el.idPost ?? null;
    console.log('🚀 ~ handleDelete ~ docId:', docId);
    if (!docId) {
      console.error('Не знайдено id для видалення:', el);
      alert('Не вдалося знайти id для видалення. Перевірте консоль.');
      return;
    }
    if (!confirm('Видалити адвоката?')) return;

    try {
      setIsUploading(true);
      await removeDocumentFromCollection('lawyers', String(docId));
      setLawyer(prev => prev.filter(l => (l.id ?? l.idPost) !== String(docId)));

      await fetchLawyer();
    } catch (err) {
      console.error('Помилка видалення адвоката:', err);
      alert('Не вдалося видалити адвоката. Дивіться консоль для деталей.');
    } finally {
      setIsUploading(false);
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

  const handleAddNewLawyer = e => {
    setEditLawyer(init);
    setCertificateFile(null);
    setIsModal(true);
    setFunc('addItem');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!editLawyer) return;

    setIsUploading(true);

    try {
      // якщо є id -> редагування, інакше -> створення
      if (editLawyer?.id) {
        let updatedLawyerData = { ...editLawyer };

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

        await updateDocumentInCollection(
          'lawyers',
          updatedLawyerData,
          editLawyer.id
        );
      } else {
        await addLawyer(editLawyer, certificateFile);
        setIsModal(false);
        setEditLawyer(init);
        setCertificateFile(null);
        fetchLawyer();
      }
    } catch (error) {
      console.error('Помилка оновлення даних адвоката:', error);
      alert('Не вдалося оновити дані. Дивіться консоль для деталей.');
    } finally {
      setIsUploading(false);
      setIsModal(false);
      setCheckFetch(true);
    }
  };

  const addLawyer = async (lawyerData, certificateFile) => {
    try {
      setIsUploading(true);

      const existing = await getCollection('lawyers');
      let maxId = 0;
      if (Array.isArray(existing) && existing.length > 0) {
        existing.forEach(doc => {
          const raw =
            doc?.id ?? doc?.idPost ?? doc?.idPostNumber ?? doc?.idPostStr ?? '';
          const n = Number(raw);
          if (!Number.isNaN(n) && Number.isFinite(n)) {
            if (n > maxId) maxId = n;
          }
        });
      }
      const newNumericId = maxId + 1;
      const newId = String(newNumericId);

      const newLawyer = {
        id: newId,
        idPost: newId,
        surname: lawyerData.surname || '',
        name: lawyerData.name || '',
        fatherName: lawyerData.fatherName || '',
        application: lawyerData.application || '',
        address: lawyerData.address || '',
        tel: lawyerData.tel || '',
        email: lawyerData.email || '',
        status: lawyerData.status || '',
        certificate: {
          number: lawyerData?.certificate?.number || '',
          date: convertToDDMMYYYY(lawyerData?.certificate?.date || ''),
          agency: lawyerData?.certificate?.agency || '',
          fileUrl: '',
        },
        dateCreating: format(new Date(), 'yyyy-MM-dd HH:mm'),
      };

      await setDocumentToCollection('lawyers', newLawyer);

      const createdId = newId;

      if (certificateFile && createdId) {
        await uploadFileToStorage(certificateFile, createdId, {
          type: 'lawyers',
        });

        const docs = await getCollectionWhereKeyValue(
          'lawyers',
          'idPost',
          createdId
        );
        const created = (docs && docs[0]) || null;
        const fileUrl = created?.certificate?.fileUrl || null;
        if (fileUrl) {
          const updatedCertificate = {
            ...(newLawyer.certificate || {}),
            fileUrl: fileUrl,
          };
          await updateDocumentInCollection(
            'lawyers',
            { certificate: updatedCertificate },
            createdId
          );
        }
      }

      setIsModal(false);
      setEditLawyer(null);
      fetchLawyer();
      return createdId;
    } catch (err) {
      console.error('Помилка додавання адвоката:', err);
      throw err;
    } finally {
      setIsUploading(false);
      setIsModal(false);
    }
  };

  const formatDateForInput = dateStr => {
    if (!dateStr) return '';
    // якщо вже у форматі YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // якщо вже у форматі DD.MM.YYYY -> перетворюємо в YYYY-MM-DD
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('.');
      return `${y}-${m}-${d}`;
    }
    // пробуємо розпарсити стандартний ISO / інші формати
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    // підтримка формату dd.MM.yyyy вже оброблена, але залишаємо fallback
    const dm = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (dm) return `${dm[3]}-${dm[2]}-${dm[1]}`;
    return '';
  };

  const convertToDDMMYYYY = dateStr => {
    if (!dateStr) return '';
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return dateStr; // вже у потрібному форматі
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}.${m}.${y}`;
    }
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const y = d.getFullYear();
      return `${day}.${m}.${y}`;
    }
    return dateStr;
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
                  <th className={`${styles.tableHead}`}>Статус</th>
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
                        {lawyer?.fatherName}
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
                        {' від '}
                        {lawyer?.certificate?.date}
                        {' виданий '} {lawyer?.certificate?.agency}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {lawyer?.certificate?.fileUrl}
                      </td>
                      <td className={`${styles.tableHead}`}>
                        {lawyer?.status}
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
      </div>

      <button
        name="lawyers"
        className={`${styles.body__item__button} ${styles.body__item__button_item}`}
        onClick={e => handleAddNewLawyer(e)}
      >
        Добавить адвоката
      </button>

      {isModal && editLawyer && (
        <Modal
          title={'Редактировать данные адвоката'}
          handleModal={handleModal}
          form={
            <form className={st.form}>
              <ul className="flexWrap">
                {/* Render top-level fields except id and certificate */}
                {Object.keys(editLawyer).map(it => {
                  if (it === 'id' || it === 'certificate') return null;
                  return (
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
                        value={editLawyer[it] ?? ''}
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

                {/* Certificate fields (number, date, agency) */}
                <li className={st.form__li}>
                  <span
                    className={styl.orderForm__form_span}
                    style={{ color: '#fff' }}
                  >
                    Сертификат — №:
                  </span>
                  <input
                    className={styl.orderForm__form_input}
                    style={{ width: '100%', padding: '0 16px', height: '48px' }}
                    type="text"
                    name="certificate_number"
                    value={editLawyer.certificate?.number ?? ''}
                    placeholder="Номер сертификата"
                    onChange={e =>
                      setEditLawyer({
                        ...editLawyer,
                        certificate: {
                          ...(editLawyer.certificate || {}),
                          number: e.currentTarget.value,
                        },
                      })
                    }
                  />
                </li>

                <li className={st.form__li}>
                  <span
                    className={styl.orderForm__form_span}
                    style={{ color: '#fff' }}
                  >
                    Сертификат — Дата:
                  </span>
                  <input
                    className={styl.orderForm__form_input}
                    style={{ width: '100%', padding: '0 16px', height: '48px' }}
                    type="date"
                    name="certificate_date"
                    value={formatDateForInput(
                      editLawyer.certificate?.date ?? ''
                    )}
                    onChange={e =>
                      setEditLawyer({
                        ...editLawyer,
                        certificate: {
                          ...(editLawyer.certificate || {}),
                          date: convertToDDMMYYYY(e.currentTarget.value),
                        },
                      })
                    }
                  />
                </li>

                <li className={st.form__li}>
                  <span
                    className={styl.orderForm__form_span}
                    style={{ color: '#fff' }}
                  >
                    Сертификат — Кем выдан:
                  </span>
                  <input
                    className={styl.orderForm__form_input}
                    style={{ width: '100%', padding: '0 16px', height: '48px' }}
                    type="text"
                    name="certificate_agency"
                    value={editLawyer.certificate?.agency ?? ''}
                    placeholder="Орган, выдавший (в падеже)"
                    onChange={e =>
                      setEditLawyer({
                        ...editLawyer,
                        certificate: {
                          ...(editLawyer.certificate || {}),
                          agency: e.currentTarget.value,
                        },
                      })
                    }
                  />
                </li>

                {/* File upload */}
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
                  {/* show current file link if exists */}
                  {editLawyer?.certificate?.fileUrl && !certificateFile && (
                    <span
                      style={{
                        color: '#90ee90',
                        fontSize: '12px',
                        marginTop: '5px',
                      }}
                    >
                      Текущий файл:{' '}
                      <a
                        href={editLawyer.certificate.fileUrl}
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
                {func === 'updateInfo'
                  ? isUploading
                    ? 'Обновление...'
                    : 'Обновить'
                  : isUploading
                  ? 'Добавление...'
                  : 'Добавить'}
              </button>
            </form>
          }
        />
      )}
    </div>
  );
}
