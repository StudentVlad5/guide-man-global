import { useState } from "react";

export default function Home() {
  const [signerEmail, setSignerEmail] = useState("");
  const [signerName, setSignerName] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [ccName, setCcName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/docusign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signerEmail, signerName, ccEmail, ccName }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(`Envelope sent successfully! Envelope ID: ${data.envelopeId}`);
    } else {
      setMessage(`Error: ${data.error}`);
    }
  };

  return (
    <div>
      <h1>DocuSign Integration</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Signer Email"
          value={signerEmail}
          onChange={(e) => setSignerEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Signer Name"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="CC Email"
          value={ccEmail}
          onChange={(e) => setCcEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="CC Name"
          value={ccName}
          onChange={(e) => setCcName(e.target.value)}
          required
        />
        <button type="submit">Send for Signing</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
