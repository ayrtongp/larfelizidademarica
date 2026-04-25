import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';
import { verifyFamiliaSession } from '@/utils/familiaSession';
import { MEASUREMENT_TYPES } from '@/types/T_measurement';
import { FOTOS_COLLECTION_NAME, FOTOS_COLLECTION_FILTER } from '@/types/Fotos';

const PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_BASEURL || process.env.R2_PUBLIC_BASEURL || '';

// Tipos com lógica invertida (menor = pior) — mesmo critério de calcAbnormalFlag
const INVERTED = new Set(['BRADEN', 'BARTHEL', 'MMSE', 'KATZ', 'IMRC', 'CALF_CIRC']);

function vitaisStatus(code: string, value: number): 'normal' | 'atencao' | 'critico' {
  const meta = MEASUREMENT_TYPES.find(t => t.code === code);
  if (!meta || meta.reference_min === undefined || meta.reference_max === undefined) return 'normal';

  if (INVERTED.has(code)) {
    if (value < meta.reference_min * 0.5) return 'critico';
    if (value < meta.reference_min)       return 'atencao';
    return 'normal';
  }

  const range = meta.reference_max - meta.reference_min;
  if (value < meta.reference_min - range * 0.3 || value > meta.reference_max + range * 0.3) return 'critico';
  if (value < meta.reference_min || value > meta.reference_max) return 'atencao';
  return 'normal';
}

const VITAIS_LABELS: Record<string, string> = {
  BP_SYS:  'Pressão (sistólica)',
  BP_DIA:  'Pressão (diastólica)',
  HR:      'Frequência Cardíaca',
  TEMP:    'Temperatura',
  SPO2:    'Saturação de Oxigênio',
  GLUCOSE: 'Glicemia',
  WEIGHT:  'Peso',
};
const VITAIS_ORDER = ['BP_SYS', 'BP_DIA', 'HR', 'TEMP', 'SPO2', 'GLUCOSE', 'WEIGHT'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Valida sessão e extrai id_residente do cookie (nunca da URL)
  const session = verifyFamiliaSession(req as any);
  if (!session) return res.status(401).json({ message: 'Não autenticado.' });

  const { id_residente } = session;
  const { type } = req.query;
  const { db } = await connect();

  // ── PERFIL ──────────────────────────────────────────────────────────────
  if (type === 'perfil') {
    try {
      let resId: ObjectId;
      try { resId = new ObjectId(id_residente); } catch {
        return res.status(400).json({ message: 'id_residente inválido.' });
      }

      const patient = await db.collection('patient').findOne({ _id: resId });
      if (!patient) return res.status(404).json({ message: 'Residente não encontrado.' });

      const birth = patient.birthDate || patient.birth_date || '';
      let idade: number | null = null;
      if (birth) {
        const d = new Date(birth);
        const hoje = new Date();
        idade = hoje.getFullYear() - d.getFullYear();
        if (hoje.getMonth() < d.getMonth() || (hoje.getMonth() === d.getMonth() && hoje.getDate() < d.getDate())) {
          idade--;
        }
      }

      return res.status(200).json({
        nome:     patient.display_name || patient.given_name || '',
        apelido:  patient.apelido || '',
        foto:     patient.photo || patient.photo_url || null,
        nascimento: birth,
        idade,
      });
    } catch {
      return res.status(500).json({ message: 'Erro ao buscar perfil.' });
    }
  }

  // ── VITAIS ───────────────────────────────────────────────────────────────
  if (type === 'vitals') {
    try {
      const sessions = await db.collection('measurement_session')
        .find({ patient_id: id_residente, status: { $ne: 'cancelled' } })
        .sort({ measured_at: -1 })
        .limit(10)
        .toArray();

      if (sessions.length === 0) return res.status(200).json({ vitais: [] });

      const sessionIds = sessions.map((s: any) => String(s._id));
      const measurements = await db.collection('measurement')
        .find({ session_id: { $in: sessionIds }, status: { $ne: 'cancelled' } })
        .sort({ created_at: -1 })
        .toArray();

      // Pega o valor mais recente por tipo
      const latest = new Map<string, number>();
      for (const m of measurements) {
        if (!latest.has(m.type_code) && m.value_numeric !== undefined && m.value_numeric !== null) {
          latest.set(m.type_code, m.value_numeric);
        }
      }

      const vitais = VITAIS_ORDER
        .filter(code => latest.has(code))
        .map(code => ({
          code,
          label:  VITAIS_LABELS[code] || code,
          valor:  latest.get(code),
          status: vitaisStatus(code, latest.get(code)!),
        }));

      return res.status(200).json({ vitais });
    } catch {
      return res.status(500).json({ message: 'Erro ao buscar sinais vitais.' });
    }
  }

  // ── EVENTOS ──────────────────────────────────────────────────────────────
  if (type === 'eventos') {
    try {
      const docs = await db.collection('datas_importantes').find().sort({ data: 1 }).toArray();

      const hoje = new Date();
      const anoAtual = hoje.getFullYear();
      const mmddHoje = hoje.getMonth() * 100 + hoje.getDate();

      const proximas = docs
        .map((d: any) => {
          const parts = String(d.data || '').split('-');
          const mes = parseInt(parts[1] || '0', 10);
          const dia = parseInt(parts[2] || '0', 10);
          const ano = d.recorrente ? anoAtual : parseInt(parts[0] || '0', 10);
          const mmdd = mes * 100 + dia;
          const dataFull = new Date(ano, mes - 1, dia);
          return { titulo: d.titulo, dataFull, mmdd, mes, dia, ano };
        })
        .filter((e: { mes: number; dia: number; mmdd: number; titulo: string; ano: number }) => {
          if (e.mes === 0 || e.dia === 0) return false;
          const mmddEvento = e.mes * 100 + e.dia;
          return mmddEvento >= mmddHoje;
        })
        .sort((a: { mmdd: number }, b: { mmdd: number }) => a.mmdd - b.mmdd)
        .slice(0, 5)
        .map((e: { mes: number; dia: number; titulo: string; ano: number }) => ({
          titulo: e.titulo,
          data:   `${String(e.dia).padStart(2,'0')}/${String(e.mes).padStart(2,'0')}/${e.ano}`,
        }));

      return res.status(200).json({ eventos: proximas });
    } catch {
      return res.status(500).json({ message: 'Erro ao buscar datas.' });
    }
  }

  // ── FOTOS ────────────────────────────────────────────────────────────────
  if (type === 'fotos') {
    try {
      const docs = await db.collection(FOTOS_COLLECTION_NAME)
        .find({ ...FOTOS_COLLECTION_FILTER, folder: id_residente, isPublic: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      const fotos = docs.map((d: any) => ({
        _id: String(d._id),
        url: PUBLIC_BASE ? `${PUBLIC_BASE.replace(/\/$/, '')}/${d.key}` : null,
        createdAt: d.createdAt,
      })).filter((f: any) => f.url);

      return res.status(200).json({ fotos });
    } catch {
      return res.status(500).json({ message: 'Erro ao buscar fotos.' });
    }
  }

  return res.status(400).json({ message: 'type não reconhecido.' });
}
