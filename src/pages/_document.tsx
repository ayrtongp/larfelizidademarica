import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@200;300;400&family=Roboto&display=swap" rel="stylesheet" />
        {/* <title>Lar Felizidade Maricá</title> */}
        {/* <meta name="keywords" content="Lar Idosos, ILPI, Idosos, Creche Dia, Centro dia, Lar, Residência, Residência Idosos"/> */}
        {/* <meta name="description" content="Lar Felizidade, o lugar para o idoso chamar de seu. Residência Fixa e Temporária, centro dia (creche). Profissionais qualificados."/> */}
        {/* <meta name="author" content="Lar Felizidade"/> */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
