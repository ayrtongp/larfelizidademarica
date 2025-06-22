import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import jwt, { JwtPayload } from 'jsonwebtoken';

// FUNCTIONS -------------------------------------------------------------

export const CheckToken = () => {
  const [loadingSign, setLoadingSign] = useState(true);
  const [logged, setLogged] = useState(false)
  const routers = useRouter()

  useEffect(() => {

    if (typeof window != undefined && routers.pathname.includes('/portal')) {

      const token = localStorage.getItem('token');

      if (token) {
        const decoded = jwt.decode(token) as JwtPayload

        if (decoded?.exp) {
          const expireDate = new Date(decoded.exp * 1000)
          const dateNow = new Date(Date.now())

          if (expireDate < dateNow) {
            localStorage.removeItem('token')
            routers.push('/portal/login');
          }
          else if (expireDate > dateNow && routers.pathname.includes('/portal/login')) {
            routers.push('/portal');
          }
          else {
            setLogged(true)
          }
        }
      } else {
        routers.push('/portal/login');
      }
    }
  }, [])

  return [loadingSign, logged]
}

export default CheckToken