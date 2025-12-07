import { useEffect, useState } from "react";
import "./css/Guide.css";
import apiClient from "../service/Api";

export default function Guide() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

useEffect(() => {
  const loadGuides = async () => {
    try {
      const res = await apiClient.get("/guide");   // ✅ await is now valid
      if (res.data) {
        setDocuments(res.data.documents);
      }
    } catch (e) {
      console.error("Error loading tasks:", e);
    }
  };

  loadGuides();  
}, []);


  const loadDocument = async (id) => {
    try {
      const res = await apiClient.get(`/guide/${id}`);
      if(res.data){
      setSelectedDoc(res.data)}
    } catch (e) {
      console.error("Error loading tasks:", e);
    } 
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
