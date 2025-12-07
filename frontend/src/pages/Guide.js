import React, { useEffect, useState } from "react";
import "./css/Guide.css";

export default function Guide() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const apiURL = process.env.REACT_APP_API_URL;
  useEffect(() => {
    fetch(`${apiURL}/guide`)
      .then((res) => res.json())
      .then((data) => setDocuments(data.documents));
  }, []);

  const loadDocument = (id) => {
    fetch(`${apiURL}/guide/${id}`)
      .then((res) => res.json())
      .then((data) => setSelectedDoc(data));
  };

  return (
    <div className="guide-container">
      <h1 className="guide-title">💗 Pregnancy Guide Library 💗</h1>

      <select
        className="guide-dropdown"
        onChange={(e) => loadDocument(e.target.value)}
      >
        <option value="">Select a guide...</option>
        {documents.map((doc) => (
          <option key={doc._id} value={doc._id}>
            {doc.title}
          </option>
        ))}
      </select>

      {selectedDoc && (
        <div className="guide-content">
          <div className="guide-header">
            <span className="guide-emoji">{selectedDoc.emoji}</span>
            <h2>{selectedDoc.title}</h2>
            <p className="guide-subtitle">{selectedDoc.subtitle}</p>
          </div>

          <div className="guide-tips">
            {selectedDoc.tips.map((tip, idx) => (
              <div key={idx} className="guide-card">
                <span className="tip-emoji">{tip.emoji}</span>
                <div>
                  <h3>{tip.title}</h3>
                  <p>{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
