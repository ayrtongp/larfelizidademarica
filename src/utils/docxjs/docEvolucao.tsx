import { saveAs } from 'file-saver';
import { AlignmentType, BorderStyle, Document, Footer, HeadingLevel, PageNumber, Packer, PageOrientation, Paragraph, Table, TableCell, TableRow, TextRun, HeightRule, TextWrappingType, VerticalAlign, WidthType } from 'docx';

async function generateDocx(data: any, responsaveis: any, nome: string, cpf: string, dataInicio: string, dataFim: string, nomeDoc: string) {

  const qtdResponsaveis = responsaveis.length

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
              new TextRun({ text: text, bold: bold, size: 16 })
            ],
            alignment: AlignmentType.CENTER,
          })],
        verticalAlign: VerticalAlign.CENTER
      })
    )
  }

  function celulaLinha(size: number, text: string, bold: boolean) {
    new TableCell({
      width: { size: size, type: WidthType.DXA, },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: text, bold: bold, size: 16 })
          ],
          alignment: AlignmentType.CENTER,
        })],
      verticalAlign: VerticalAlign.CENTER
    })
  }

  function tabelaLinhaCabecalho() {
    const columns = 5
    const size = 30000 / columns;
    return (
      new TableRow({
        tableHeader: true,
        children: [
          celulaCabecalho(size, "Data Registro", true),
          celulaCabecalho(size, "Responsável", true),
          celulaCabecalho(size, "Categoria", true),
          celulaCabecalho(size, "Setor", true),
          celulaCabecalho(size, "Descrição", true),
        ]
      })
    )
  }

  function tabelaLinhaComum(data: string, responsavel: string, area: string, setor: string, descricao: string) {

    const columns = 4
    const size = 6000 / columns
    const size2 = 24000
    return (
      new TableRow({
        children: [
          celulaCabecalho(size, data, false),
          celulaCabecalho(size, responsavel, false),
          celulaCabecalho(size, area, false),
          celulaCabecalho(size, setor, false),
          celulaCabecalho(size2, descricao, false),
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
          tabelaLinhaComum(item.dataEvolucao, abbreviatedName, item.categoria, item.area, item.descricao)
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

  function makeRow() {
    const rows: TableRow[] = [];
    const maxColumns = 5
    const maxWidth = 30000 / maxColumns
    const rowSpacing = 1500

    for (let i = 0; i < responsaveis.length; i += maxColumns) {
      const rowArray = responsaveis.slice(i, i + maxColumns);
      const cells: TableCell[] = rowArray.map((item: any) =>

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
        }));

      while (cells.length < maxColumns) {
        // Fill the last row with empty cells if needed
        cells.push(new TableCell({
          children: [new Paragraph("")],
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          },
        }));
      }
      rows.push(new TableRow(
        {
          children: cells,
          height: {
            rule: HeightRule.ATLEAST,
            value: rowSpacing, // Set the height to create space between rows
          },
          cantSplit: true, // Prevent the row from being split across pages
        }));
    }

    return rows;
  }

  const tabelaAssinaturaComRegistro = new Table({
    // Contém Nome Completo, Função do Funcionário e Registro Profissional (ou CPF quando não tiver)
    // Sem bordas, texto centralizado

    rows: makeRow()
  })

  const tableInfoRelatorio = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
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

  const _footer = new Footer({
    children: [
      espacoEmBranco,
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

          children: [
            _heading1("Relatório de Evoluções"),
            espacoEmBranco,
            table,
            espacoEmBranco,
            espacoEmBranco,
            espacoEmBranco,
            espacoEmBranco,
            tabelaAssinaturaComRegistro,
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