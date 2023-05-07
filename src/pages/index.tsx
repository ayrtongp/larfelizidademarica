import Head from 'next/head'
import Hero from '@/components/Hero'
import { SliderData } from '../utils/SliderData'
import Slider from '@/components/Slider'
import Instagram from '@/components/Instagram'
import AboutUs from '@/components/AboutUs'
import Contact from '@/components/Contact'
import Navbar from '@/components/Navbar'
import Servicos from '@/components/Servicos'

export default function Home() {
  return (
    <div>
      <Head>
        <title>Lar da Felizidade</title>
        <meta name='LarFelizidade' content='O lugar para o idoso chamar de seu' />
        <link rel='icon' href='favicon.ico' />
      </Head>
      <Navbar />
      <Hero heading='Lar Felizidade' message='O lugar para o idoso chamar de seu' />

      <Slider slides={SliderData} />
      <Servicos />
      <AboutUs />
      <Contact />
    </div>
  )
}
