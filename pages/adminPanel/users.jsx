import { useEffect, useState } from "react";
import styles from "../../styles/adminPanel.module.scss";
import styl from "../../styles/lawyersRequestForm.module.scss";
import st from "../../styles/formPage.module.scss";
import { db } from "../../firebase";
import { Modal } from "../../components/Modal";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import Link from "next/link";
import { placeHolder, patternInput } from "../../helpers/constant";
import saveCredentials from "../api/userProfile";

const PAGE_SIZE = 10;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModal, setIsModal] = useState(false);
  const [editUser, setEditUser] = useState(false);
  const [validateStatus, setValidateStatus] = useState(false);
  const [checkFetch, setcheckFetch] = useState(false);

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
    const usersRef = collection(db, "users");
    let q = query(usersRef, orderBy("name"), limit(PAGE_SIZE));

    if (search) {
      q = query(
        usersRef,
        where("name", ">=", search),
        where("name", "<=", search + "\uf8ff"),
        orderBy("name"),
        limit(PAGE_SIZE)
      );
    }

    if (page > 1 && lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const querySnapshot = await getDocs(q);
    const userList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsers([...userList]);
    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    setLastVisible(lastVisibleDoc);

    setLoading(false);
  };

  const handleEdit = (id) => {
    setIsModal(true);
    setEditUser(users.find((it) => it.id === id));
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleModal = () => {
    setcheckFetch(true);
    setIsModal(!isModal);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const check = saveCredentials({
      ...editUser,
    });
    if (check) {
      setIsModal(false);
      setEditUser("");
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
            placeholder="Search by name"
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
                  users.map((user) => (
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
                      <td className={styles.tableHead}>
                        <button onClick={() => handleEdit(user.id)}>
                          Edit
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
            title={"Редактировать данные пользователя"}
            handleModal={handleModal}
            form={
              <form className={st.form}>
                <ul className="flexWrap">
                  {Object.keys(editUser) &&
                    Object.keys(editUser).map((it) => {
                      return (
                        it !== "id" &&
                        it !== "uid" && (
                          <li key={it} className={st.form__li}>
                            <span
                              className={styl.orderForm__form_span}
                              style={{ color: "#fff" }}
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
                                width: "100%",
                                padding: "0 16px",
                                height: "48px",
                                display: "flex",
                                alignItems: "center",
                              }}
                              type="text"
                              id={it}
                              name={it}
                              value={editUser[it]}
                              pattern={patternInput[it]?.source}
                              placeholder={placeHolder[it]}
                              onChange={(e) => {
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
                              {"Please use pattern"}: {placeHolder[it]}
                            </span>
                          </li>
                        )
                      );
                    })}
                </ul>
                <button
                  type="submit"
                  className={`button ${st.form__button}`}
                  style={{ marginTop: "20px" }}
                  onClick={(e) => handleSubmit(e)}
                  disabled={validateStatus}
                >
                  {"submit"}
                </button>
              </form>
            }
          />
        )}
      </div>
    </div>
  );
}
