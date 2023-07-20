import { saveAs } from 'file-saver';
import { AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, Packer, PageNumber, PageOrientation, Paragraph, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType } from 'docx';

async function generateDocx(data: any, responsaveis: any, nome: string, cpf: string, dataInicio: string, dataFim: string, nomeDoc: string) {

  const espacoEmBranco = new Paragraph({})

  function textoLivre(texto: string, align: AlignmentType, negrito: boolean) {
    return (
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({ text: `\t${texto}`, bold: negrito, }),
        ],
      })
    )
  }

  function paragrafoInformacoes(titulo: string, texto: string) {
    return (
      new Paragraph({
        alignment: AlignmentType.CENTER,
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

  function textoNormal(texto: string, tamanho: number, negrito: boolean) {
    return new TextRun({ text: texto, size: tamanho, bold: negrito })
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
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: '#000000' }
      })
    )
  }

  function tabelaLinhaCabecalho() {
    const size1 = 2850
    const size2 = 3600
    return (
      new TableRow({
        tableHeader: true,
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

  function tabelaLinhaComum(data: string, responsavel: string, PaMmHg: string, FCBpm: string, FRIrpm: string, TaxC: string, SPO2: string, HGT: string, diurese: string, evacuacoes: string, fillColor: string) {
    const size1 = 2850
    const size2 = 3600

    const novaCelula = (texto: string, bgColor: string, cellWidthDXA: number) => (
      new TableCell({
        width: { size: cellWidthDXA, type: WidthType.DXA, },
        children: [new Paragraph({ text: texto, alignment: AlignmentType.CENTER })],
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: bgColor }
      })
    )

    return (
      new TableRow({
        children: [
          new TableCell({
            width: { size: size2, type: WidthType.DXA, },
            children: [new Paragraph({ text: data, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: fillColor }
          }),
          new TableCell({
            width: { size: size2, type: WidthType.DXA, },
            children: [new Paragraph({ text: responsavel, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: fillColor }
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: PaMmHg, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: fillColor }
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: FCBpm, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: fillColor }
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: FRIrpm, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: fillColor }
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: TaxC, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: fillColor }
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: SPO2, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: fillColor }
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: HGT, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: fillColor }
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: diurese, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: fillColor }
          }),
          new TableCell({
            width: { size: size1, type: WidthType.DXA, },
            children: [new Paragraph({ text: evacuacoes, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: fillColor }
          }),
        ]
      })
    )
  }

  const tabelaRelatorioPrincipal = new Table({
    rows: [
      tabelaLinhaCabecalho(),

      ...data.map((item: any, index: any) => {
        // Abreviação Nome, ex.: Lucas Medeiros Soares -> Lucas S.
        const fullName = item.usuario_nome;
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        const abbreviatedName = `${firstName} ${lastName.charAt(0)}.`;
        // Linhas | Cores Alternadas
        const fillColor = index % 2 == 0 ? '#D3D3D3' : '#ffffff'
        return (
          tabelaLinhaComum(item.createdAt, abbreviatedName, item.pressaoArterial, item.frequenciaCardiaca, item.frequenciaRespiratoria,
            item.temperatura, item.saturacao, item.glicemiaCapilar, item.diurese, item.evacuacao, fillColor)
        )
      }),

    ],
  });

  const tabelaAssinaturaComRegistro = new Table({
    // Contém Nome Completo, Função do Funcionário e Registro Profissional (ou CPF quando não tiver)
    // Sem bordas, texto centralizado
    rows: [
      new TableRow({
        children: [
          ...responsaveis.map((item: any, index: any) => {
            const maxWidth = 30000 / responsaveis.length
            return (
              new TableCell({
                width: { size: maxWidth, type: WidthType.DXA, },
                children: [
                  new Paragraph({ text: item.nome + " " + item.sobrenome, alignment: AlignmentType.CENTER }),
                  new Paragraph({ text: item.funcao, alignment: AlignmentType.CENTER }),
                  new Paragraph({ text: item.registro, alignment: AlignmentType.CENTER }),
                ],
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

  const tableInfoRelatorio = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 10000, type: WidthType.DXA, },
            children: [paragrafoInformacoes('Nome do Residente:', nome)],
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 10000, type: WidthType.DXA, },
            children: [paragrafoInformacoes('CPF:', cpf)],
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 10000, type: WidthType.DXA, },
            children: [paragrafoInformacoes('Data do Relatório:', `${dataInicio} à ${dataFim}`)],
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
          }),
        ]
      }),
    ]
  })

  const _header = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            children: ["LAR FELIZIDADE MARICÁ"],
            color: '#800080',
            size: 36
          })
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          textoNormal('Relatório de Sinais Vitais', 24, true)
        ]
      }),
    ],
  })

  const _footer = new Footer({
    children: [
      tableInfoRelatorio,
      espacoEmBranco,
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            children: ["Página ", PageNumber.CURRENT],
          }),
          new TextRun({
            children: [" de ", PageNumber.TOTAL_PAGES],
          }),
        ],
      }),
    ],
  })

  const doc = new Document(
    {
      sections: [
        {
          properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },

          headers: { default: _header },

          children: [
            tabelaRelatorioPrincipal,
            espacoEmBranco,
            espacoEmBranco,
            espacoEmBranco,
            espacoEmBranco,
            tabelaAssinaturaComRegistro,
            espacoEmBranco,
            espacoEmBranco,
            espacoEmBranco,
            textoLivre("Beatriz da Fonseca Fortes", AlignmentType.CENTER, true),
            textoLivre("Responsável ILPI", AlignmentType.CENTER, true),
          ],

          footers: { default: _footer }
        },
      ],
    });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `${nomeDoc}.docx`);
  });
}

export default generateDocx;