import React from "react";
import { Payment } from "../components/Payment";

export default function PaymentPage({ request, currentLanguage }) {
  return (
    <div>
      <Payment request={request} currentLanguage={currentLanguage}/>
    </div>
  );
}
