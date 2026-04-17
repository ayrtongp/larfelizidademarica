import React, { useState } from 'react';

interface Props {
  onClose: () => void;
}

const PASSOS = [
  {
    icon: '📋',
    titulo: 'Criar uma nova lista',
    descricao: 'Clique em "Nova Lista" no canto superior direito. Escolha o tipo (Mercado ou Sacolão), dê um título, selecione a data prevista da compra e clique em "Criar Lista".',
    dica: 'A lista começa no status Rascunho — você ainda pode editar tudo.',
  },
  {
    icon: '➕',
    titulo: 'Adicionar itens',
    descricao: 'Dentro da lista, clique em "+ Adicionar Item". Informe o nome, a quantidade, a unidade de medida e, opcionalmente, a categoria e o preço estimado.',
    dica: 'Clique em "Salvar Itens" sempre que terminar de editar. A barra amarela avisa quando há alterações não salvas.',
  },
  {
    icon: '✏️',
    titulo: 'Editar ou remover itens',
    descricao: 'Cada linha da tabela tem os botões "Editar" e "Remover". Use "Editar" para corrigir quantidade, unidade ou categoria. Use "Remover" para excluir o item da lista.',
    dica: 'Lembre de salvar após as alterações.',
  },
  {
    icon: '✅',
    titulo: 'Finalizar a lista',
    descricao: 'Quando a lista estiver pronta para ir às compras, clique em "Finalizar lista". O status muda para Finalizada e os checkboxes de comprado ficam ativos.',
    dica: 'Só é possível marcar itens como comprados após finalizar a lista.',
  },
  {
    icon: '🛒',
    titulo: 'Marcar itens durante a compra',
    descricao: 'Com a lista Finalizada, marque o checkbox de cada item conforme for comprando. A barra de progresso no topo da lista mostra quantos itens já foram comprados.',
    dica: 'As marcações são salvas junto com os demais itens — lembre de clicar em "Salvar Itens".',
  },
  {
    icon: '🏁',
    titulo: 'Concluir a compra',
    descricao: 'Após comprar tudo, clique em "Marcar como comprada". O status muda para Comprada e a lista fica somente para consulta — nenhuma edição é possível após isso.',
    dica: 'Esta ação é definitiva. Se precisar corrigir algo, use "Voltar p/ rascunho" antes de marcar como comprada.',
  },
  {
    icon: '📄',
    titulo: 'Usar uma lista como modelo',
    descricao: 'No histórico, cada card tem o botão "Usar como modelo". Clique nele para criar uma nova lista com todos os itens já copiados — basta ajustar o título e a data.',
    dica: 'Os itens são copiados com o checkbox desmarcado, prontos para a nova compra.',
  },
];

const STATUS_INFO = [
  { badge: 'bg-yellow-100 text-yellow-800', label: 'Rascunho', desc: 'Lista em montagem. Itens podem ser adicionados, editados e removidos.' },
  { badge: 'bg-blue-100 text-blue-800', label: 'Finalizada', desc: 'Lista pronta. Checkboxes de comprado estão ativos. Ainda pode voltar para rascunho se necessário.' },
  { badge: 'bg-green-100 text-green-800', label: 'Comprada', desc: 'Compra concluída. Lista somente leitura — serve como histórico.' },
];

const ModalAjudaListas: React.FC<Props> = ({ onClose }) => {
  const [passoAtivo, setPassoAtivo] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <h2 className="text-base font-bold text-gray-800">Como usar as Listas de Compras</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            ×
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Passos */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Passo a passo</p>

            {/* Navegação lateral dos passos */}
            <div className="flex gap-1 mb-4 flex-wrap">
              {PASSOS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPassoAtivo(idx)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-colors
                    ${passoAtivo === idx ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Conteúdo do passo */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 min-h-[140px]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{PASSOS[passoAtivo].icon}</span>
                <h3 className="text-sm font-bold text-gray-800">{PASSOS[passoAtivo].titulo}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{PASSOS[passoAtivo].descricao}</p>
              <div className="flex items-start gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                <span className="text-indigo-400 text-xs mt-0.5">💡</span>
                <p className="text-xs text-indigo-700">{PASSOS[passoAtivo].dica}</p>
              </div>
            </div>

            {/* Botões prev / next */}
            <div className="flex justify-between mt-3">
              <button
                onClick={() => setPassoAtivo((p) => Math.max(0, p - 1))}
                disabled={passoAtivo === 0}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-xs text-gray-400 self-center">{passoAtivo + 1} / {PASSOS.length}</span>
              <button
                onClick={() => setPassoAtivo((p) => Math.min(PASSOS.length - 1, p + 1))}
                disabled={passoAtivo === PASSOS.length - 1}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 transition-colors"
              >
                Próximo →
              </button>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Significado dos status</p>
            <div className="space-y-2">
              {STATUS_INFO.map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 mt-0.5 ${s.badge}`}>
                    {s.label}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fluxo visual */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Fluxo da lista</p>
            <div className="flex items-center gap-1 flex-wrap text-xs">
              <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full font-medium">Rascunho</span>
              <span className="text-gray-300 font-bold">→</span>
              <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-medium">Finalizada</span>
              <span className="text-gray-300 font-bold">→</span>
              <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-medium">Comprada</span>
              <span className="text-gray-300 mx-1">|</span>
              <span className="text-gray-400 italic">Finalizada pode voltar para Rascunho</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Entendi!
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalAjudaListas;
