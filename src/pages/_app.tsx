import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Head from 'next/head'
import { LoadingOverlayProvider } from '@/context/LoadingOverlayContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <LoadingOverlayProvider>
        <Head>
          <title>Lar Felizidade Maricá</title>
        </Head>
        <Component {...pageProps} />
        <ToastContainer />
      </LoadingOverlayProvider>
    </>
  )
}
