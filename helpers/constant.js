export const fieldInput = {
  name: "Name",
  surname: "Surname",
  fatherName: "Fathername",
  birthday: "BirdthDay",
  citizenship: "Citizenship",
  phoneNumber: "PhoneNumber",
  country: "Country",
  city: "City",
  address_1: "Address 1",
  inn: "INN",
  passport: "Passport",
};

export const patternInput = {
  name: /^[a-zA-Zа-яА-Я]{2,30}$/,
  surname: /^[a-zA-Zа-яА-Я]{2,30}$/,
  fatherName: /^[a-zA-Zа-яА-Я]{2,30}$/,
  birthday: /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/,
  citizenship: /^[a-zA-Zа-яА-Я]{2,30}$/,
  phoneNumber: /^\d{6,14}$/,
  country: /^[a-zA-Zа-яА-Я]{2,30}$/,
  city: /^[a-zA-Zа-яА-Я]{2,30}$/,
  address_1: /^[\w\s,.'\-\u00C0-\u024F]{5,100}$/,
  inn: /^\d{6,14}$/,
  passport: /^[A-Z0-9]{6,9}$/,
};

export const placeHolder = {
  name: "Shevchenko",
  surname: "Vasyl",
  fatherName: "Mukolavivich",
  birthday: "03-05-1980",
  citizenship: "Ukrainian",
  phoneNumber: "06778787897",
  country: "Ukraine",
  city: "Kyiv",
  address_1: "Obolonskya str 33, 24",
  inn: "123456789",
  passport: "NC456376",
};