export interface LinhaImportada {
  dataMovimento: string; // YYYY-MM-DD
  tipoMovimento: 'entrada' | 'saida';
  historico: string;
  valor: number;
}

/** Converte serial de data do Excel para YYYY-MM-DD */
function excelSerialToDateStr(serial: number): string {
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Converte "dd/MM/yyyy" para "YYYY-MM-DD" */
function brDateToISO(str: string): string {
  const parts = str.trim().split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** Converte valor BR "5.505,00" ou "-10.000,00" para número */
function parseBrNumber(raw: any): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const cleaned = raw.trim().replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned);
  }
  return NaN;
}

/**
 * Parseia um array de arrays (saída do xlsx sheet_to_json com header:1)
 * no formato do extrato Banco Inter PJ.
 *
 * Estrutura esperada:
 * - Linhas 0-4: cabeçalho/metadados (puladas)
 * - Linha com "Data Lançamento" na col 0: cabeçalho das colunas
 * - Linhas seguintes: dados (Data Lançamento | Histórico | Descrição | Valor | Saldo)
 */
export function parseInterPJ(data: any[][]): LinhaImportada[] {
  // Encontra a linha de cabeçalho
  let headerIdx = -1;
  for (let i = 0; i < data.length; i++) {
    const cell = String(data[i][0] ?? '').trim().toLowerCase();
    if (cell.includes('data') && (cell.includes('lançamento') || cell.includes('lancamento'))) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error(
      'Formato não reconhecido. Certifique-se de que o arquivo é um extrato do Banco Inter PJ. ' +
      'Coluna "Data Lançamento" não encontrada.'
    );
  }

  const rows = data.slice(headerIdx + 1);
  const result: LinhaImportada[] = [];

  for (const row of rows) {
    if (!row[0] && !row[1]) continue; // linha vazia

    // Coluna 0: Data
    let dataMovimento = '';
    if (typeof row[0] === 'number') {
      dataMovimento = excelSerialToDateStr(row[0]);
    } else if (typeof row[0] === 'string' && row[0].includes('/')) {
      dataMovimento = brDateToISO(row[0]);
    } else if (row[0] instanceof Date) {
      const d = row[0] as Date;
      dataMovimento = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    if (!dataMovimento) continue;

    // Coluna 1: Histórico (tipo da operação)
    const tipoOp = String(row[1] ?? '').trim();

    // Coluna 2: Descrição (nome da contraparte)
    const descricao = String(row[2] ?? '').trim();

    // Junta: "Pix recebido - Flavio Amaral Bastos"
    const historico = descricao ? `${tipoOp} - ${descricao}` : tipoOp;

    // Coluna 3: Valor (pode ser negativo)
    const valorBruto = parseBrNumber(row[3]);
    if (isNaN(valorBruto)) continue;

    const tipoMovimento: 'entrada' | 'saida' = valorBruto >= 0 ? 'entrada' : 'saida';
    const valor = Math.abs(valorBruto);

    result.push({ dataMovimento, tipoMovimento, historico, valor });
  }

  return result;
}
