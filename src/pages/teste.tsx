import { saveAs } from 'file-saver';
import { AlignmentType, BorderStyle, Document, Header, HeadingLevel, ImageRun, Media, Packer, PageOrientation, Paragraph, Table, TableCell, TableRow, TextRun, TextWrappingSide, TextWrappingType, VerticalAlign, WidthType } from 'docx';
import axios from 'axios';
import { useEffect, useState } from 'react';

const generateDocx = async (data: any, responsaveis: any) => {

  const espacoEmBranco = new Paragraph({})

  function textoLivre(texto: string) {
    return new Paragraph(texto)
  }

  function paragrafoInformacoes(titulo: string, texto: string) {
    return (
      new Paragraph({
        children: [
          new TextRun({ text: titulo, bold: true, }),
          new TextRun({ text: `\t${texto}`, bold: false, }),
        ],
      })
    )
  }

  function _heading1(texto: string) {
    return (
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: texto, bold: true })
        ]
      })
    )
  }

  function _heading2(texto: string) {
    return (
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: texto, bold: true })
        ]
      })
    )
  }

  function textoNormal(texto: string) {
    return new TextRun(texto)
  }

  function textoNegrito(texto: string) {
    return new TextRun({ text: texto, bold: true })
  }

  function celulaCabecalho(size: number, text: string, bold: boolean) {
    return (
      new TableCell({
        width: { size: size, type: WidthType.DXA, },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: text, bold: bold })
            ],
            alignment: AlignmentType.CENTER,
          })],
        verticalAlign: VerticalAlign.CENTER
      })
    )
  }

  function tabelaLinhaCabecalho() {
    const size1 = 2850
    const size2 = 3600
    return (
      new TableRow({
        children: [
          celulaCabecalho(size1, "Data Registro", true),
          celulaCabecalho(size1, "Responsável", true),
          celulaCabecalho(size1, "Pa MmHg", true),
          celulaCabecalho(size1, "FC Bpm", true),
          celulaCabecalho(size1, "FR Irpm", true),
          celulaCabecalho(size1, "Tax ºC", true),
          celulaCabecalho(size1, "SPO2%", true),
          celulaCabecalho(size1, "HGT", true),
          celulaCabecalho(size1, "Diurese", true),
          celulaCabecalho(size1, "Evacuações", true),
        ]
      })
    )
  }

  function tabelaLinhaComum(data: string, responsavel: string, PaMmHg: string, FCBpm: string, FRIrpm: string, TaxC: string, SPO2: string, HGT: string, diurese: string, evacuacoes: string) {
    const size1 = 2850
    const size2 = 3600
    return (
      new TableRow({
        children: [
          new TableCell({
            width: { size: size2, type: WidthType.DXA, },
            children: [new Paragraph({ text: data, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER
          }),
          new TableCell({
            width: { size: size2, type: WidthType.DXA, },
            children: [new Paragraph({ text: responsavel, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: PaMmHg, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: FCBpm, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: FRIrpm, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: TaxC, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: SPO2, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: HGT, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: diurese, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: evacuacoes, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER
          }),
        ]
      })
    )
  }

  const table = new Table({
    rows: [
      tabelaLinhaCabecalho(),
      ...data.map((item: any, index: any) => {
        const fullName = item.usuario_nome;
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        const abbreviatedName = `${firstName} ${lastName.charAt(0)}.`;

        return (
          tabelaLinhaComum(item.createdAt, abbreviatedName, item.pressaoArterial, item.frequenciaCardiaca, item.frequenciaRespiratoria,
            item.temperatura, item.saturacao, item.glicemiaCapilar, item.diurese, item.evacuacao)
        )
      }),
    ],
  });

  const table2 = new Table({
    rows: [
      new TableRow({
        children: [
          ...responsaveis.map((item: any, index: any) => {
            const maxWidth = 30000 / responsaveis.length
            return (
              new TableCell({
                width: { size: maxWidth, type: WidthType.DXA, },
                children: [new Paragraph(item)],
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
              })
            )
          })
        ]
      }),
    ]
  })

  const doc = new Document(
    {
      sections: [
        {
          properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },

          children: [
            _heading1("Relatório de Sinais Vitais"),
            espacoEmBranco,
            paragrafoInformacoes('Nome do Residente:', "Alex Correia"),
            paragrafoInformacoes('Data do Relatório:', "05/06/2023 à 12/06/2023"),
            espacoEmBranco,
            table,
            espacoEmBranco,
            _heading2("Assinaturas"),
            espacoEmBranco,
            table2,
          ],

        },
      ],
    });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, 'example.docx');
  });
}

// Done! A file called 'My Document.docx' will be in your file system.

const TestePage = () => {
  const [arrayData, setArrayData] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);

  async function fetchData() {
    const result = await axios.get('api/Controller/SinaisVitaisController?type=report&id=6475443e621d1604edb0c4c3&dataInicio=2023-06-05&dataFim=2023-06-12')
    if (result.status > 199 && result.status < 300) {
      const names = result.data.map((item: any) => item.usuario_nome);
      const uniqueNames = names.filter((name: any, index: any) => names.indexOf(name) === index);
      setArrayData(result.data)
      setResponsaveis(uniqueNames)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleClick = async () => {
    await generateDocx(arrayData, responsaveis);
  };

  return (
    <div>
      <h1>Teste Page</h1>
      <button onClick={handleClick}>Generate Document</button>
    </div>
  );
};

export default TestePage;