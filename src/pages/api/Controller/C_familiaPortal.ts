import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';
import { verifyFamiliaSession } from '@/utils/familiaSession';
import { MEASUREMENT_TYPES } from '@/types/T_measurement';
import { FOTOS_COLLECTION_NAME, FOTOS_COLLECTION_FILTER } from '@/types/Fotos';

const PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_BASEURL || process.env.R2_PUBLIC_BASEURL || '';

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
  const ALLOWED = ['GET', 'POST', 'PUT'];
  if (!ALLOWED.includes(req.method!)) {
    res.setHeader('Allow', ALLOWED);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Valida sessão
  const session = verifyFamiliaSession(req as any);
  if (!session) return res.status(401).json({ message: 'Não autenticado.' });

  // residente_id sempre na query string
  const { type, residente_id } = req.query;
  if (!residente_id) return res.status(400).json({ message: 'residente_id é obrigatório.' });

  const { db } = await connect();

  const vinculo = await db.collection('familiar_residente').findOne({
    usuario_id:   session.userId,
    residente_id: String(residente_id),
    ativo:        true,
  });
  if (!vinculo) return res.status(403).json({ message: 'Acesso não autorizado a este residente.' });

  const id_residente = String(residente_id);

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {

    // PERFIL
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
          nome:       patient.display_name || patient.given_name || '',
          apelido:    patient.apelido || '',
          foto:       patient.photo || patient.photo_url || null,
          nascimento: birth,
          idade,
        });
      } catch {
        return res.status(500).json({ message: 'Erro ao buscar perfil.' });
      }
    }

    // VITAIS
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

    // EVENTOS
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
            return { titulo: d.titulo, mmdd, mes, dia, ano };
          })
          .filter((e: any) => e.mes !== 0 && e.dia !== 0 && e.mmdd >= mmddHoje)
          .sort((a: any, b: any) => a.mmdd - b.mmdd)
          .slice(0, 5)
          .map((e: any) => ({
            titulo: e.titulo,
            data:   `${String(e.dia).padStart(2,'0')}/${String(e.mes).padStart(2,'0')}/${e.ano}`,
          }));

        return res.status(200).json({ eventos: proximas });
      } catch {
        return res.status(500).json({ message: 'Erro ao buscar datas.' });
      }
    }

    // FOTOS
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

    // COMUNICADOS
    if (type === 'comunicados') {
      try {
        const docs = await db.collection('comunicados')
          .find({ publico: true })
          .sort({ createdAt: -1 })
          .limit(20)
          .toArray();

        const comunicados = docs.map((d: any) => ({
          _id:         String(d._id),
          title:       d.title,
          description: d.description,
          createdAt:   d.createdAt,
          lido:        (d.readers || []).some((r: any) => r.userId === session.userId),
        }));

        return res.status(200).json({ comunicados });
      } catch {
        return res.status(500).json({ message: 'Erro ao buscar comunicados.' });
      }
    }

    // VISITAS
    if (type === 'visitas') {
      try {
        const hoje = new Date().toISOString().split('T')[0];
        const docs = await db.collection('agenda_visitas')
          .find({ residente_id: id_residente, data: { $gte: hoje }, confirmada: true })
          .sort({ data: 1, horario: 1 })
          .limit(10)
          .toArray();

        return res.status(200).json({ visitas: docs.map((d: any) => ({ ...d, _id: String(d._id) })) });
      } catch {
        return res.status(500).json({ message: 'Erro ao buscar visitas.' });
      }
    }

    // BOLETINS
    if (type === 'boletins') {
      try {
        const docs = await db.collection('boletins_familia')
          .find({ residente_id: id_residente, publicado: true })
          .sort({ publicado_em: -1 })
          .limit(3)
          .toArray();

        return res.status(200).json({ boletins: docs.map((d: any) => ({ ...d, _id: String(d._id) })) });
      } catch {
        return res.status(500).json({ message: 'Erro ao buscar boletins.' });
      }
    }

    // MENSAGENS
    if (type === 'mensagens') {
      try {
        const docs = await db.collection('mensagens_familia')
          .find({ usuario_id: session.userId, residente_id: id_residente })
          .sort({ createdAt: -1 })
          .toArray();

        return res.status(200).json({ mensagens: docs.map((d: any) => ({ ...d, _id: String(d._id) })) });
      } catch {
        return res.status(500).json({ message: 'Erro ao buscar mensagens.' });
      }
    }

    return res.status(400).json({ message: 'type não reconhecido.' });
  }

  // ── PUT ──────────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});

    // MARCAR COMUNICADO COMO LIDO
    if (type === 'marcarLido') {
      const { comunicado_id } = body;
      if (!comunicado_id) return res.status(400).json({ message: 'comunicado_id é obrigatório.' });
      try {
        const existing = await db.collection('comunicados').findOne({
          _id:              new ObjectId(comunicado_id),
          'readers.userId': session.userId,
        });
        if (!existing) {
          await db.collection('comunicados').updateOne(
            { _id: new ObjectId(comunicado_id) },
            { $push: { readers: { userId: session.userId, readAt: new Date().toISOString() } } as any }
          );
        }
        return res.status(200).json({ ok: true });
      } catch {
        return res.status(500).json({ message: 'Erro ao marcar leitura.' });
      }
    }

    return res.status(400).json({ message: 'type não reconhecido.' });
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});

    // NOVA MENSAGEM
    if (type === 'novaMensagem') {
      const { assunto, texto } = body;
      if (!assunto?.trim() || !texto?.trim()) {
        return res.status(400).json({ message: 'assunto e texto são obrigatórios.' });
      }
      try {
        const doc = {
          usuario_id:   session.userId,
          residente_id: id_residente,
          assunto:      assunto.trim(),
          texto:        texto.trim(),
          lida_admin:   false,
          status:       'nova',
          createdAt:    new Date().toISOString(),
          updatedAt:    new Date().toISOString(),
        };
        const result = await db.collection('mensagens_familia').insertOne(doc);
        return res.status(201).json({ id: String(result.insertedId) });
      } catch {
        return res.status(500).json({ message: 'Erro ao enviar mensagem.' });
      }
    }

    return res.status(400).json({ message: 'type não reconhecido.' });
  }
}
