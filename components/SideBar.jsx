import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/formPage.module.scss";
import s from "../styles/formPage.module.scss";
import { useTranslation } from "next-i18next";

export default function SideBar() {
  const { pathname } = useRouter();
  const { t } = useTranslation();

  return (
    <div className={styles.formPage__sidebar}>
      <ul className={s.formPage__sidebar__rightLine}>
        <Link href={`/account/profile`}>
          <li className={pathname.includes("profile") ? "active" : ""}>
            {t("Profile")}
          </li>
        </Link>
        <Link href={`/account/history`}>
          <li className={pathname.includes("history") ? "active" : ""}>
            {t("History")}
          </li>
        </Link>
      </ul>
    </div>
  );
}
