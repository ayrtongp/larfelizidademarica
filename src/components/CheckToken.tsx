import React, { useEffect } from 'react'
import { useRouter } from 'next/router';
import jwt, { JwtPayload } from 'jsonwebtoken';

const CheckToken = () => {
  const routers = useRouter();

  useEffect(() => { expiredToken(routers) }, []);

  return (null)
}

export default CheckToken

// FUNCTIONS -------------------------------------------------------------

function expiredToken(router: any) {
  if (location.pathname.includes('/portal')) {

    const token = localStorage.getItem('token')

    if (token) {
      const decoded = jwt.decode(token) as JwtPayload
      
      if (decoded?.exp) {
        const expireDate = new Date(decoded.exp * 1000)
        const dateNow = new Date(Date.now())
        
        if (expireDate < dateNow) {
          localStorage.removeItem('token')
          router.push('/portal/login');
        }
        else if (expireDate > dateNow && location.pathname.includes('/portal/login')) {
          router.push('/portal');
        }
      }
    } else {
      router.push('/portal/login');
    }
  }
}