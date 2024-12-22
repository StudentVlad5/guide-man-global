import React, { useState, useMemo, useEffect } from 'react';
import { auth, getCollectionWhereKeyValue } from '../helpers/firebaseControl';
import { useRouter } from 'next/router';
import { getTitleOfPosts, getTitleOfServices } from '../helpers/firebaseControl';


export const AppContext = React.createContext({
  user: null,
  setUser: () => {},
  titleArr: [],
  setTitleArr: () => {},
  userRole: null,
  setUserRole: () => {},
  servicesArray: [],
  setServicesArray: () => {},
});

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [titleArr, setTitleArr] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [servicesArray, setServicesArray] = useState([]);

  console.log(user);
  
  const router = useRouter();

  const locale = router.locale;

  const getData = async() => {
    try {
        const newsTitles = await getTitleOfPosts('news', locale);
        const questionsTitles = await getTitleOfPosts('questions', locale);
        const explanationsTitles = await getTitleOfPosts('explanations', locale);
        const servicesTitles = await getTitleOfServices(locale);
        const citizenshipTitles = await getTitleOfPosts('citizenship', locale);
        setTitleArr([...newsTitles, ...questionsTitles, ...explanationsTitles, ...servicesTitles, ...citizenshipTitles]);
        setServicesArray(servicesTitles);
    } catch (error){
      alert (error);
    }
  };  

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setUser(user || null)});
      if (user) {
        getCollectionWhereKeyValue('users', 'uid', auth.currentUser.uid).then(res => {
          if (res[0].role === "admin") {
            setUserRole(res[0].role);
            router.push('adminPanel');
          }
        });
      }
    
  }, [user]);

  useEffect(() => {
    getData();
  }, [locale]);

  const contextValue = useMemo(() => {
    return {
      user,
      setUser,
      titleArr,
      setTitleArr,
      userRole,
      servicesArray

    };
  }, [user, titleArr, userRole, servicesArray]) ;

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
