import { useState, useEffect } from 'react';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Permissoes } from '../utils/CategoriaPermissao';

export const usePermissoes = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchData = async () => {
      try {
        const result = await Permissoes('portal_servicos');
        setData(result.response);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    if (token) {
      const decoded = jwt.decode(token) as JwtPayload;
      if (decoded?.userId) {
        fetchData();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);
  return [data, loading];
};