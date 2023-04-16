import Head from 'next/head'
import Hero from '@/components/Hero'
import { SliderData } from '../components/SliderData'
import Slider from '@/components/Slider'
import Instagram from '@/components/Instagram'
import AboutUs from '@/components/AboutUs'
import Contact from '@/components/Contact'

export default function Home() {
  return (
    <div>
      <Head>
        <title>Lar da Felizidade</title>
        <meta name='LarFelizidade' content='O lugar para o idoso chamar de seu' />
        <link rel='icon' href='favicon.ico' />
      </Head>

      <Hero heading='Lar Felizidade' message='O lugar para o idoso chamar de seu' />

      <Slider slides={SliderData} />
      <Instagram />
      <AboutUs />
      <Contact />
    </div>
  )
}
