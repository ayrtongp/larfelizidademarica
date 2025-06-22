import { useState, useEffect } from 'react';
import { MongoClient } from 'mongodb';

const Paginacao = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [documents, setDocuments] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {

        const countURL = '/api/Controller/SinaisVitaisController?type=countDocuments'
        const res = await fetch(countURL)
        const { count } = await res.json()

        const totalPages = Math.ceil(count / pageSize);
        setTotalPages(totalPages);

        const skip = (page - 1) * pageSize;

        const docsURL = `/api/Controller/SinaisVitaisController?type=pages&skip=${skip}&limit=${pageSize}`
        const res2 = await fetch(docsURL)
        const { data } = await res2.json()
        setDocuments(data);

      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, [page, pageSize]);

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div>
      {documents.map((document) => (
        // Render the fetched documents
        <div key={document}>{/* Render document data */}</div>
      ))}
      <button onClick={handlePrevPage} disabled={page === 1}>
        Previous Page
      </button>
      <button onClick={handleNextPage} disabled={page === totalPages}>
        Next Page
      </button>
    </div>
  );
};

export default Paginacao;
