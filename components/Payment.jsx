import React, { useEffect, useState } from "react";

export const Payment = () => {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const storedFormData = localStorage.getItem("formData");
    if (storedFormData) {
      setFormData(JSON.parse(storedFormData));
    }
  }, []);

  if (!formData) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Payment Page</h1>

      <p>
        <strong>Surname:</strong> {formData.request.en.title}
      </p>
    </div>
  );
};
