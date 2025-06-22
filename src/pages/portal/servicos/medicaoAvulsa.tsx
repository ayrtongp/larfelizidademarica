import React, { useEffect, useState } from "react";
import { useLoadingOverlay } from "@/context/LoadingOverlayContext";
import { SINAL_VITAL_OPTIONS, validarSinalVital } from "@/models/sinaisvitaisv2.model";
import { createSinalVital, getSinaisVitaisPages } from "@/services/sinaisvitaisv2.svc";
import PermissionWrapper from "@/components/PermissionWrapper";
import PortalBase from '@/components/Portal/PortalBase'
import { Residentes_GET_getAllActive } from "@/actions/Residentes";
import { notifyError } from "@/utils/Functions";
import { sendMessage } from "@/pages/api/WhatsApp";
import { getUserID } from "@/utils/Login";
import { FaFilter } from "react-icons/fa";

const PAGE_SIZE = 20; // ADICIONE ESTA LINHA

const MedicaoAvulsa = () => {
    const [residentes, setResidentes] = useState<any[]>([]);
    const [idosoId, setIdosoId] = useState("");
    const [sinalTipo, setSinalTipo] = useState("");
    const [valor, setValor] = useState("");
    const [limites, setLimites] = useState<{ min: number; max: number; unidade?: string } | null>(null);
    const { showLoading, hideLoading } = useLoadingOverlay();
    const [tabela, setTabela] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [showFilter, setShowFilter] = useState(false);
    const [filter, setFilter] = useState({
        idosoId: "",
        tipo: "",
        foraLimite: "",
        dataIni: "",
        dataFim: ""
    });

    // Buscar residentes ativos ao montar
    useEffect(() => {
        async function fetchData() {
            showLoading();
            const residentes = await Residentes_GET_getAllActive();
            if (residentes.length < 1) {
                notifyError('Não foram encontrados residentes')
                hideLoading();
            }
            else {
                setResidentes(residentes)
                hideLoading();
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        async function fetchTabela() {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(PAGE_SIZE),
                ...(filter.idosoId && { idosoId: filter.idosoId }),
                ...(filter.tipo && { tipo: filter.tipo }),
                ...(filter.foraLimite && { foraLimite: filter.foraLimite }),
                ...(filter.dataIni && { dataIni: filter.dataIni }),
                ...(filter.dataFim && { dataFim: filter.dataFim }),
            });
            const resp = await fetch(`/api/Controller/SinaisVitaisV2.ctrl?type=getPages&${params}`);
            if (resp.ok) {
                const data = await resp.json();
                setTabela(data.sinais);
                setTotal(data.total);
            } else {
                setTabela([]);
                setTotal(0);
            }
        }
        fetchTabela();
    }, [page, filter]);

    // Atualiza limites ao trocar idoso ou sinal
    useEffect(() => {
        if (!idosoId || !sinalTipo) {
            setLimites(null);
            return;
        }
        const residente = residentes.find(r => r._id === idosoId);
        const sinal = SINAL_VITAL_OPTIONS.find(opt => opt.value === sinalTipo);
        if (!residente || !sinal) {
            setLimites(null);
            return;
        }
        // Busca limites do residente para o sinal selecionado
        const limite = residente.limitesSinais?.find((l: any) => l.tipo === sinalTipo);
        if (limite) {
            setLimites({ min: limite.valorMin, max: limite.valorMax, unidade: sinal.placeholder });
        } else {
            setLimites(null);
        }
    }, [idosoId, sinalTipo, residentes]);

    const sinalOption = SINAL_VITAL_OPTIONS.find(opt => opt.value === sinalTipo);

    const limparFiltros = () => setFilter({ idosoId: "", tipo: "", foraLimite: "", dataIni: "", dataFim: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        showLoading();
        if (!idosoId || !sinalTipo || !valor) return;

        // Validação do valor conforme pattern
        const { valido, erro } = validarSinalVital(sinalTipo, valor);
        if (!valido) {
            alert(erro);
            return;
        }

        // Checa limites personalizados do residente
        let foraLimite = false;
        if (limites) {
            const v = parseFloat(valor.replace(",", "."));
            if (!isNaN(v)) {
                foraLimite = v < limites.min || v > limites.max;
            }
        }

        if (foraLimite) {
            const idoso = residentes.find(i => i._id === idosoId)?.nome || "";
            sendMessage(process.env.NEXT_PUBLIC_WPP_GRUPO_TECNICOS as string,
                `⚠️ Atenção!\n\nMedição: ${sinalOption?.label}\nIdoso: ${idoso}\nEstá fora dos limites: ${valor} ${limites?.unidade || ""}\n(Aceitável: ${limites?.min} - ${limites?.max})`
            );
        }

        const response = await createSinalVital({
            idosoId,
            userId: getUserID(),
            tipo: sinalTipo as any,
            valor,
            dataHora: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            foraLimite: foraLimite,
        });
        hideLoading();

        if (response.success) {
            alert("Medição salva com sucesso!");
            setValor("");
            setSinalTipo("");
            setIdosoId("");
        } else {
            alert(response.message || "Erro ao salvar medição.");
        }
    };

    return (
        <PermissionWrapper href='/portal' groups={['66955f79820cc8004aab9596']}>
            <PortalBase>
                <div className="col-span-full max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
                    <button
                        className="col-span-full fixed z-30 bottom-3 right-3 md:hidden bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
                        onClick={() => setShowFilter(true)}
                        aria-label="Abrir filtros"
                    >
                        <FaFilter size={16} />
                    </button>

                    {/* Sidebar de filtros - mobile overlay */}
                    <div
                        className={`fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-300 ${showFilter ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} md:hidden`}
                        onClick={() => setShowFilter(false)}
                    >
                        <aside
                            className={`absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-lg p-4 transition-transform duration-300 ${showFilter ? "translate-x-0" : "translate-x-full"}`}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-700">Filtros</h4>
                                <button onClick={() => setShowFilter(false)} className="text-gray-500 text-xl">&times;</button>
                            </div>
                            {/* Filtros */}
                            <div className="mb-2">
                                <label className="block text-xs mb-1">Residente</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={filter.idosoId}
                                    onChange={e => setFilter(f => ({ ...f, idosoId: e.target.value }))}
                                >
                                    <option value="">Todos</option>
                                    {residentes.map(i => (
                                        <option key={i._id} value={i._id}>{i.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="block text-xs mb-1">Tipo</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={filter.tipo}
                                    onChange={e => setFilter(f => ({ ...f, tipo: e.target.value }))}
                                >
                                    <option value="">Todos</option>
                                    {SINAL_VITAL_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="block text-xs mb-1">Fora Limite</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={filter.foraLimite}
                                    onChange={e => setFilter(f => ({ ...f, foraLimite: e.target.value }))}
                                >
                                    <option value="">Todos</option>
                                    <option value="true">Sim</option>
                                    <option value="false">Não</option>
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="block text-xs mb-1">Data Inicial</label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2"
                                    value={filter.dataIni}
                                    onChange={e => setFilter(f => ({ ...f, dataIni: e.target.value }))}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block text-xs mb-1">Data Final</label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2"
                                    value={filter.dataFim}
                                    onChange={e => setFilter(f => ({ ...f, dataFim: e.target.value }))}
                                />
                            </div>
                            <button
                                className="w-full mt-2 bg-gray-200 hover:bg-gray-300 rounded p-2 text-sm"
                                onClick={limparFiltros}
                                type="button"
                            >
                                Limpar Filtros
                            </button>
                        </aside>
                    </div>

                    {/* Sidebar de filtros - desktop */}
                    <div className="hidden md:block">
                        <aside className="w-64 bg-white rounded shadow p-4 mb-6 h-fit sticky top-6">
                            <h4 className="font-bold mb-2 text-gray-700">Filtros</h4>
                            <div className="mb-2">
                                <label className="block text-xs mb-1">Residente</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={filter.idosoId}
                                    onChange={e => setFilter(f => ({ ...f, idosoId: e.target.value }))}
                                >
                                    <option value="">Todos</option>
                                    {residentes.map(i => (
                                        <option key={i._id} value={i._id}>{i.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="block text-xs mb-1">Tipo</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={filter.tipo}
                                    onChange={e => setFilter(f => ({ ...f, tipo: e.target.value }))}
                                >
                                    <option value="">Todos</option>
                                    {SINAL_VITAL_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="block text-xs mb-1">Fora Limite</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={filter.foraLimite}
                                    onChange={e => setFilter(f => ({ ...f, foraLimite: e.target.value }))}
                                >
                                    <option value="">Todos</option>
                                    <option value="true">Sim</option>
                                    <option value="false">Não</option>
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="block text-xs mb-1">Data Inicial</label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2"
                                    value={filter.dataIni}
                                    onChange={e => setFilter(f => ({ ...f, dataIni: e.target.value }))}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block text-xs mb-1">Data Final</label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2"
                                    value={filter.dataFim}
                                    onChange={e => setFilter(f => ({ ...f, dataFim: e.target.value }))}
                                />
                            </div>
                            <button
                                className="w-full mt-2 bg-gray-200 hover:bg-gray-300 rounded p-2 text-sm"
                                onClick={limparFiltros}
                                type="button"
                            >
                                Limpar Filtros
                            </button>
                        </aside>
                    </div>

                    <h2 className="text-xl font-bold mb-4">Medição Avulsa</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block mb-1 font-medium">Residente</label>
                            <select
                                className="w-full border rounded p-2"
                                value={idosoId}
                                onChange={e => setIdosoId(e.target.value)}
                                required
                            >
                                <option value="">Selecione o residente</option>
                                {residentes.map(i => (
                                    <option key={i._id} value={i._id}>{i.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Sinal Vital</label>
                            <select
                                className="w-full border rounded p-2"
                                value={sinalTipo}
                                onChange={e => { setSinalTipo(e.target.value); setValor(""); }}
                                required
                            >
                                <option value="">Selecione o sinal vital</option>
                                {SINAL_VITAL_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        {sinalOption && (
                            <div>
                                <label className="block mb-1 font-medium">Valor</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2"
                                    value={valor}
                                    onChange={e => setValor(e.target.value)}
                                    required
                                    maxLength={sinalOption.maxLength}
                                    pattern={sinalOption.pattern.source}
                                    title={sinalOption.title}
                                    placeholder={sinalOption.placeholder}
                                />
                            </div>
                        )}
                        {limites && (
                            <div className="flex gap-2 items-end">
                                <div>
                                    <label className="block mb-1 font-medium text-xs">Mínimo</label>
                                    <input
                                        type="text"
                                        className="w-20 border rounded p-2 bg-gray-100"
                                        value={limites.min}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-xs">Máximo</label>
                                    <input
                                        type="text"
                                        className="w-20 border rounded p-2 bg-gray-100"
                                        value={limites.max}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <span className="ml-2">{limites.unidade}</span>
                                </div>
                            </div>
                        )}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white rounded p-2 font-bold hover:bg-blue-700"
                        >
                            Salvar Medição
                        </button>
                    </form>
                </div>

                {/* Tabela de medições */}
                <div className="col-span-full w-full mx-auto mt-10 bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-bold mb-4">Últimas medições</h3>
                    <div className="overflow-x-auto w-full">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-2 py-1 text-left">Data/Hora</th>
                                    <th className="px-2 py-1 text-left">Residente</th>
                                    <th className="px-2 py-1 text-left">Sinal Vital</th>
                                    <th className="px-2 py-1 text-left">Valor</th>
                                    <th className="px-2 py-1 text-left">Fora Limite?</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tabela.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center text-gray-500 py-4">Nenhuma medição encontrada.</td>
                                    </tr>
                                )}
                                {tabela.map((m: any) => (
                                    <tr key={m._id} className="border-b">
                                        <td className="px-2 py-1">{new Date(m.dataHora).toLocaleString()}</td>
                                        <td className="px-2 py-1">{residentes.find(r => r._id === m.idosoId)?.nome || "Residente"}</td>
                                        <td className="px-2 py-1">{SINAL_VITAL_OPTIONS.find(opt => opt.value === m.tipo)?.label || m.tipo}</td>
                                        <td className="px-2 py-1">{m.valor}</td>
                                        <td className="px-2 py-1">
                                            {m.foraLimite ? <span className="text-red-600 font-bold">Sim</span> : "Não"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Paginação */}
                    <div className="flex justify-between items-center mt-4">
                        <button
                            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Anterior
                        </button>
                        <span className="text-sm">Página {page} de {Math.ceil(total / PAGE_SIZE) || 1}</span>
                        <button
                            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page * PAGE_SIZE >= total}
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </PortalBase >
        </PermissionWrapper >
    );
};

export default MedicaoAvulsa;