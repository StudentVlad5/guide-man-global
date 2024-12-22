import React, { useState } from "react";
import axios from "axios";

const UploadForm = () => {
  const [fileUrl, setFileUrl] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("/api/docusign", {
        fileUrl,
        name,
        email,
      });
      alert(`Документ отправлен, ID: ${response.data.envelopeId}`);
    } catch (error) {
      console.error(error);
      alert("Ошибка при отправке документа");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Имя:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Ссылка на файл:</label>
        <input
          type="url"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          required
        />
      </div>
      <button type="submit">Отправить</button>
    </form>
  );
};

export default UploadForm;
