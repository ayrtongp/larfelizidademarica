import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import jwt, { JwtPayload } from 'jsonwebtoken';

const REFRESH_THRESHOLD_MIN = 20; // renova quando faltam menos de 20 min

async function tryRefreshToken(token: string): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const { token: newToken } = await res.json();
    return newToken ?? null;
  } catch {
    return null;
  }
}

export const CheckToken = () => {
  const [loadingSign, setLoadingSign] = useState(true);
  const [logged, setLogged] = useState(false)
  const routers = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined' || !routers.pathname.includes('/portal')) return;

    const token = localStorage.getItem('token');

    if (!token) {
      routers.push('/portal/login');
      return;
    }

    const decoded = jwt.decode(token) as JwtPayload;

    if (!decoded?.exp) {
      localStorage.removeItem('token');
      routers.push('/portal/login');
      return;
    }

    const msLeft = decoded.exp * 1000 - Date.now();

    if (msLeft <= 0) {
      // Token já expirou
      localStorage.removeItem('token');
      routers.push('/portal/login');
      return;
    }

    if (routers.pathname.includes('/portal/login')) {
      routers.push('/portal');
      return;
    }

    setLogged(true);

    // Renova silenciosamente se faltam menos de REFRESH_THRESHOLD_MIN minutos
    if (msLeft < REFRESH_THRESHOLD_MIN * 60 * 1000) {
      tryRefreshToken(token).then((newToken) => {
        if (newToken) localStorage.setItem('token', newToken);
      });
    }
  }, [routers.pathname])

  return [loadingSign, logged]
}

export default CheckToken