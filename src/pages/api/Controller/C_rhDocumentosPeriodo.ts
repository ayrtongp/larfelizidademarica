import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';
import { sendMessage } from '../WhatsApp';

const MESES_EXTENSO = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('rh_documentos_periodo');

  switch (req.method) {

    case 'GET': {
      if (req.query.type === 'getByFuncionario') {
        try {
          const { funcionarioId, tipo, mes, ano } = req.query;
          if (!funcionarioId || !tipo) return res.status(400).json({ error: 'funcionarioId e tipo são obrigatórios' });

          const filter: any = { funcionarioId: String(funcionarioId), tipo: String(tipo) };
          if (mes) filter['periodo.mes'] = Number(mes);
          if (ano) filter['periodo.ano'] = Number(ano);

          const docs = await collection.find(filter).sort({ 'periodo.ano': -1, 'periodo.mes': -1 }).toArray();
          return res.status(200).json(docs);
        } catch {
          return res.status(500).json({ error: 'Erro ao buscar documentos' });
        }
      }

      if (req.query.type === 'getResumoMes') {
        try {
          const mes = Number(req.query.mes);
          const ano = Number(req.query.ano);
          if (!mes || !ano) return res.status(400).json({ error: 'mes e ano são obrigatórios' });
          const tipoDoc = (req.query.tipo as string) || 'folha_ponto';

          const colFuncionarios = db.collection('funcionarios_clt');
          const funcionariosAtivos = await colFuncionarios.aggregate([
            { $match: { status: 'ativo' } },
            { $addFields: { usuarioObjectId: { $toObjectId: '$usuarioId' } } },
            { $lookup: { from: 'usuario', localField: 'usuarioObjectId', foreignField: '_id', as: 'usuarioArr' } },
            { $addFields: { u: { $arrayElemAt: ['$usuarioArr', 0] } } },
            { $project: {
              _id: 1,
              'contrato.cargo': 1,
              'contrato.setor': 1,
              nomeCompleto: { $concat: [{ $ifNull: ['$u.nome', ''] }, ' ', { $ifNull: ['$u.sobrenome', ''] }] },
              'u.foto_cdn': 1,
              'u.foto_base64': 1,
            }},
          ]).toArray();

          const documentos = await collection
            .find({ tipo: tipoDoc, 'periodo.mes': mes, 'periodo.ano': ano })
            .toArray();

          const docPorFuncionario = new Map(documentos.map((d: any) => [d.funcionarioId, d]));

          const resumo = funcionariosAtivos.map((f: any) => ({
            funcionarioId: String(f._id),
            nome: ((f.nomeCompleto as string) ?? '').trim(),
            cargo: f.contrato?.cargo ?? '',
            setor: f.contrato?.setor ?? '',
            foto: f.u?.foto_cdn || f.u?.foto_base64 || null,
            enviado: docPorFuncionario.has(String(f._id)),
            documento: docPorFuncionario.get(String(f._id)) ?? undefined,
          }));

          resumo.sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
          return res.status(200).json(resumo);
        } catch {
          return res.status(500).json({ error: 'Erro ao gerar resumo' });
        }
      }

      return res.status(400).json({ error: 'type inválido' });
    }

    case 'POST': {
      if (req.query.type === 'new') {
        try {
          const body = req.body;
          const { funcionarioId, tipo, periodo, cloudURL, filename, cloudFilename, r2FileId, size, format, uploadedBy, uploadedByNome, funcionarioNome } = body;
          if (!funcionarioId || !tipo || !periodo?.mes || !periodo?.ano || (!cloudURL && !r2FileId)) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
          }

          const existente = await collection.findOne({ funcionarioId, tipo, 'periodo.mes': periodo.mes, 'periodo.ano': periodo.ano });
          const statusAnterior = existente?.status ?? null;
          if (existente) {
            await collection.deleteOne({ _id: existente._id });
          }

          // reenviado se havia reprovação anterior; senão, enviado
          const novoStatus = statusAnterior === 'reprovado' ? 'reenviado' : 'enviado';

          const doc = {
            tipo, funcionarioId, funcionarioNome: funcionarioNome || '',
            periodo: { mes: Number(periodo.mes), ano: Number(periodo.ano) },
            cloudURL: cloudURL || '',
            filename, cloudFilename, r2FileId: r2FileId || cloudFilename || '',
            size, format,
            descricao: body.descricao || '',
            uploadedBy, uploadedByNome,
            createdAt: new Date().toISOString(),
            status: novoStatus,
          };
          const result = await collection.insertOne(doc);
          return res.status(201).json({ ...doc, _id: result.insertedId });
        } catch {
          return res.status(500).json({ error: 'Erro ao salvar documento' });
        }
      }
      if (req.query.type === 'enviarAviso') {
        try {
          const { mes, ano } = req.body as { mes: number; ano: number };
          if (!mes || !ano) return res.status(400).json({ error: 'mes e ano são obrigatórios' });

          const colFuncionarios = db.collection('funcionarios_clt');
          const funcionariosAtivos = await colFuncionarios.aggregate([
            { $match: { status: 'ativo' } },
            { $addFields: { usuarioObjectId: { $toObjectId: '$usuarioId' } } },
            { $lookup: { from: 'usuario', localField: 'usuarioObjectId', foreignField: '_id', as: 'usuarioArr' } },
            { $addFields: { u: { $arrayElemAt: ['$usuarioArr', 0] } } },
            { $project: {
              _id: 1,
              nomeCompleto: { $concat: [{ $ifNull: ['$u.nome', ''] }, ' ', { $ifNull: ['$u.sobrenome', ''] }] },
            }},
          ]).toArray();

          const documentos = await collection
            .find({ tipo: 'folha_ponto', 'periodo.mes': mes, 'periodo.ano': ano })
            .toArray();

          const idsEnviados = new Set(documentos.map((d: any) => d.funcionarioId));
          const pendentes = funcionariosAtivos.filter((f: any) => !idsEnviados.has(String(f._id)));

          if (pendentes.length === 0) {
            return res.status(200).json({ ok: true, pendentes: 0 });
          }

          const lista = pendentes.map((f: any) => `• ${(f.nomeCompleto as string).trim()}`).join('\n');
          const periodo = `${MESES_EXTENSO[mes - 1]}/${ano}`;
          const mensagem = `📋 *Folha de Ponto — ${periodo}*\n⚠️ Funcionários sem envio:\n\n${lista}\n\nFavor enviar até o 5º dia útil.`;

          await sendMessage(process.env.NEXT_PUBLIC_WPP_GRUPO_PRINCIPAL as string, mensagem);
          return res.status(200).json({ ok: true, pendentes: pendentes.length });
        } catch {
          return res.status(500).json({ error: 'Erro ao enviar aviso' });
        }
      }

      return res.status(400).json({ error: 'type inválido' });
    }

    case 'PUT': {
      if (req.query.type === 'atualizarStatus') {
        try {
          const { id, status, motivoReprovacao, atualizadoPor, atualizadoPorNome } = req.body as {
            id: string;
            status: 'aprovado' | 'reprovado';
            motivoReprovacao?: string;
            atualizadoPor: string;
            atualizadoPorNome: string;
          };
          if (!id || !status) return res.status(400).json({ error: 'id e status são obrigatórios' });
          if (status === 'reprovado' && !motivoReprovacao?.trim()) {
            return res.status(400).json({ error: 'Motivo de reprovação é obrigatório' });
          }

          const update: any = {
            status,
            statusAtualizadoEm: new Date().toISOString(),
            statusAtualizadoPor: atualizadoPor,
            statusAtualizadoPorNome: atualizadoPorNome,
          };
          if (status === 'reprovado') update.motivoReprovacao = motivoReprovacao;
          else update.motivoReprovacao = '';

          await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
          return res.status(200).json({ ok: true });
        } catch {
          return res.status(500).json({ error: 'Erro ao atualizar status' });
        }
      }
      return res.status(400).json({ error: 'type inválido' });
    }

    case 'DELETE': {
      if (req.query.type === 'delete') {
        try {
          const id = req.query.id as string;
          if (!id) return res.status(400).json({ error: 'id obrigatório' });
          await collection.deleteOne({ _id: new ObjectId(id) });
          return res.status(200).json({ ok: true });
        } catch {
          return res.status(500).json({ error: 'Erro ao remover documento' });
        }
      }
      return res.status(400).json({ error: 'type inválido' });
    }

    default:
      return res.status(405).json({ error: 'Método não permitido' });
  }
}
