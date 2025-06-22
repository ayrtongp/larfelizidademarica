export type User = {
  _id: string;
  usuario: string;
  senha: string;
  email: string;
  tipo: number;
  expiredAt: number;
  accessToken: string;
};