import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Lar Felizidade Maricá</title>
      </Head>
      <Component {...pageProps} />
      <ToastContainer />
    </>
  )
}
