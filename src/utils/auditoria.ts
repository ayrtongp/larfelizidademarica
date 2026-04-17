import { Db, ObjectId } from 'mongodb';

export interface AuditoriaPayload {
  entidade: string;       // 'funcionario' | 'prestador' | ...
  entidadeId: string;     // _id do documento afetado
  nomeEntidade?: string;  // nome legível para exibição ("João Silva")
  acao: string;           // 'criar' | 'editar_contrato' | 'demitir' | ...
  campo?: string;         // campo específico alterado (opcional)
  antes?: unknown;        // valor anterior
  depois?: unknown;       // valor novo
  realizadoPor?: string;  // usuario._id
}

/**
 * Registra um evento de auditoria na collection `auditoria`.
 * Nunca lança exceção — falhas são apenas logadas no console.
 */
export async function registrarAuditoria(db: Db, payload: AuditoriaPayload): Promise<void> {
  try {
    let realizadoPorNome = '';
    if (payload.realizadoPor) {
      try {
        const u = await db.collection('usuario').findOne(
          { _id: new ObjectId(payload.realizadoPor) },
          { projection: { nome: 1, sobrenome: 1 } }
        );
        if (u) realizadoPorNome = `${u.nome ?? ''} ${u.sobrenome ?? ''}`.trim();
      } catch { /* ObjectId inválido — ignora */ }
    }

    await db.collection('auditoria').insertOne({
      ...payload,
      realizadoPorNome,
      realizadoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[auditoria] Erro ao registrar:', err);
  }
}
