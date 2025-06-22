import React from "react";
import axios from "axios";
import { toast } from 'react-toastify'
import jwt from 'jsonwebtoken'

export async function Login(router, usuario, senha) {
  try {
    const response = await axios.post('/api/Controller/LoginController', { usuario, senha });
    const { token, userInfo } = await response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    toast.success('Logged in successfully!');
    router.push('/portal');
  } catch (error) {
    toast.error('Invalid usuario or senha!');
  }
}

export function Logout(router) {
  localStorage.removeItem('token');
  router.push('/portal/login');
}

export function getUserID() {
  const token = localStorage.getItem('token');
  const { userId } = jwt.decode(token)
  return userId
}

export function getUserFuncao() {
  const funcao = JSON.parse(localStorage.getItem('userInfo')).funcao
  return funcao
}

export function updateProfile() {
  const userIdString = localStorage.getItem('userInfo');
  if (userIdString) {
    const data = JSON.parse(userIdString);
    return data
  }

}