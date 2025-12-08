import { useEffect, useState } from "react";
import "./css/Guide.css";
import apiClient from "../service/Api";

export default function Guide() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    const loadGuides = async () => {
      try {
        const res = await apiClient.get("/guide");
        if (res.data) {
          setDocuments(res.data.documents);
        }
      } catch (e) {
        console.error("Error loading guides:", e);
      }
    };

    loadGuides();
  }, []);

  const loadDocument = async (id) => {
    try {
      const res = await apiClient.get(`/guide/${id}`);
      if (res.data) {
        setSelectedDoc(res.data);
      }
    } catch (e) {
      console.error("Error loading guide:", e);
    }
  };

  return (
    <div className="guide-container">
      <h1 className="guide-title">Pregnancy Guide Library</h1>

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
        <div className="guide-content" 
             dangerouslySetInnerHTML={{ __html: selectedDoc.content }}>
        </div>
      )}
    </div>
  );
}
