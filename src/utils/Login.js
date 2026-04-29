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
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded = jwt.decode(token);
    return decoded?.userId ?? null;
  }
  return null;
}

export function getUserFuncao() {
  const raw = localStorage.getItem('userInfo');
  if (!raw) return null;
  return JSON.parse(raw)?.funcao ?? null;
}

export function getUserFuncoes() {
  const info = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (Array.isArray(info.funcoes) && info.funcoes.length > 0) return info.funcoes
  return info.funcao ? [info.funcao] : []
}

export function updateProfile() {
  if (typeof window !== 'undefined') {
    const userIdString = localStorage.getItem('userInfo');
    if (userIdString) {
      const data = JSON.parse(userIdString);
      return data
    }
  }
}