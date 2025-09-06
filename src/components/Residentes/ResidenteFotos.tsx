"use client";

// Residente_Fotos.tsx — completo
// ✅ Botões "Usar câmera" / "Escolher da galeria" funcionando (via pickerTrigger + inputKey)
// ✅ Lazy loading + infinite scroll com guards (sem piscar / sem múltiplas chamadas)
// ✅ Upload via File_M4 com backend Express externo (NEXT_PUBLIC_UPLOAD_URL) ou actions antigas

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Button_M3 from "../Formularios/Button_M3";
import Modalpadrao from "../ModalPadrao";
import TextInputM2 from "../Formularios/TextInputM2";
import File_M4 from "../Formularios/File_M4";
import type { InfoProps } from "@/types/Arquivos_InfoProps";
import { notifyError } from "@/utils/Functions";
import File_Photo from "../Formularios/File_Photo";

// Tipos básicos
export type I_Foto = {
    _id: string;
    url: string;
    alt?: string;
    createdAt?: string;
};

interface Props {
    residenteData: { _id: string; apelido?: string };
    token?: string; // opcional: se o backend exigir Authorization
}

type CaptureMode = "camera" | "gallery";
const PAGE_SIZE = 20;
const API_BASE = process.env.NEXT_PUBLIC_API_EXT ?? "https://lobster-app-gbru2.ondigitalocean.app";
const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL ?? `${API_BASE}/upload`;

// Wrapper para buscar fotos paginadas no backend externo
async function fetchFotosExternas(
    residenteId: string,
    cursor?: string,
    token?: string
): Promise<{ items: I_Foto[]; nextCursor?: string }> {
    const url = new URL(`${API_BASE}/fotos`);
    url.searchParams.set("residenteId", residenteId);
    url.searchParams.set("limit", String(PAGE_SIZE));
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // credentials: "include", // habilite se o back usar cookies
        // mode: "cors",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Erro ao buscar fotos.");

    // aceita {items,nextCursor} ou {data:{items,nextCursor}}
    const items: I_Foto[] = data?.data?.items ?? data?.items ?? [];
    const nextCursor: string | undefined = data?.data?.nextCursor ?? data?.nextCursor ?? undefined;
    return { items, nextCursor };
}

const Residente_Fotos: React.FC<Props> = ({ residenteData, token }) => {
    // Modal / descrição / captura
    const [modalOpen, setModalOpen] = useState(false);
    const [descricao, setDescricao] = useState("");
    const [captureMode, setCaptureMode] = useState<CaptureMode>("gallery");
    const [pickerTick, setPickerTick] = useState(0); // muda para abrir o file picker

    // iOS x Android: iOS aceita "camera", Android prefere "environment"
    const isIOS = useMemo(
        () => typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent),
        []
    );
    const captureValue = captureMode === "camera" ? (isIOS ? "camera" : "environment") : undefined;

    // Info para persistência
    const [infoProps, setInfoProps] = useState<InfoProps>({
        dbName: "residentes",
        residenteId: residenteData._id,
        descricao: "",
    });

    // Lista e paginação
    const [fotos, setFotos] = useState<I_Foto[]>([]);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // Sentinela e guards
    const loaderRef = useRef<HTMLDivElement | null>(null);
    const fetchInFlightRef = useRef(false);
    const mountedRef = useRef(false);

    // Abre o input do File_M4 com o modo escolhido
    const openWith = (mode: CaptureMode) => {
        setCaptureMode(mode);
        // força remontar input e abrir
        setPickerTick((t) => t + 1);
    };

    // Carrega mais
    const loadMore = useCallback(async () => {
        if (fetchInFlightRef.current || !hasMore) return;
        fetchInFlightRef.current = true;
        try {
            setLoading(true);
            const { items, nextCursor } = await fetchFotosExternas(residenteData._id, cursor, token);
            if (!mountedRef.current) return;
            setFotos((prev) => [...prev, ...items]);
            setCursor(nextCursor);
            setHasMore(Boolean(nextCursor));
        } catch (e: any) {
            if (mountedRef.current) setHasMore(false);
            notifyError?.(e?.message || "Erro ao carregar fotos");
        } finally {
            if (mountedRef.current) setLoading(false);
            fetchInFlightRef.current = false;
        }
    }, [cursor, hasMore, residenteData._id, token]);

    // Primeira página / troca de residente
    useEffect(() => {
        mountedRef.current = true;
        setInfoProps((p) => ({ ...p, residenteId: residenteData._id }));

        setFotos([]);
        setCursor(undefined);
        setHasMore(true);

        (async () => {
            fetchInFlightRef.current = true;
            try {
                setLoading(true);
                const { items, nextCursor } = await fetchFotosExternas(residenteData._id, undefined, token);
                if (!mountedRef.current) return;
                setFotos(items);
                setCursor(nextCursor);
                setHasMore(Boolean(nextCursor));
            } catch (e: any) {
                if (mountedRef.current) setHasMore(false);
                notifyError?.(e?.message || "Erro ao carregar fotos");
            } finally {
                if (mountedRef.current) setLoading(false);
                fetchInFlightRef.current = false;
            }
        })();

        return () => {
            mountedRef.current = false;
        };
    }, [residenteData._id, token]);

    // Observer
    useEffect(() => {
        const el = loaderRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && !fetchInFlightRef.current && hasMore) void loadMore();
                }
            },
            { rootMargin: "800px 0px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [loadMore, hasMore]);

    // Pós-upload: recarrega primeira página
    const handleUploadFinish = () => {
        setModalOpen(false);
        setDescricao("");
        setInfoProps((prev) => ({ ...prev, descricao: "" }));

        setFotos([]);
        setCursor(undefined);
        setHasMore(true);

        (async () => {
            if (fetchInFlightRef.current) return;
            fetchInFlightRef.current = true;
            try {
                setLoading(true);
                const { items, nextCursor } = await fetchFotosExternas(residenteData._id, undefined, token);
                if (!mountedRef.current) return;
                setFotos(items);
                setCursor(nextCursor);
                setHasMore(Boolean(nextCursor));
            } catch (e: any) {
                if (mountedRef.current) setHasMore(false);
                notifyError?.(e?.message || "Erro ao carregar fotos");
            } finally {
                if (mountedRef.current) setLoading(false);
                fetchInFlightRef.current = false;
            }
        })();
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
                <Button_M3 label="Nova Foto" onClick={() => setModalOpen(true)} />
                {/* atalhos rápidos para abrir direto na câmera/galeria */}
                <button
                    type="button"
                    onClick={() => openWith("camera")}
                    className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-100"
                >
                    Usar câmera
                </button>
                <button
                    type="button"
                    onClick={() => openWith("gallery")}
                    className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-100"
                >
                    Escolher da galeria
                </button>
            </div>

            {/* Galeria */}
            <section aria-labelledby="galeria-title">
                <h2 id="galeria-title" className="sr-only">Galeria de fotos do residente</h2>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" role="list">
                    {fotos.map((f) => (
                        <article key={f._id} role="listitem" className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
                            <Image
                                src={f.url}
                                alt={f.alt || `Foto de ${residenteData?.apelido || "residente"}`}
                                fill
                                sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 20vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                            />
                        </article>
                    ))}

                    {loading && Array.from({ length: 6 }).map((_, i) => (
                        <div key={`s-${i}`} className="aspect-square animate-pulse rounded-xl bg-neutral-200" />
                    ))}
                </div>

                {hasMore && (
                    <div ref={loaderRef} className="flex items-center justify-center py-4">
                        {loading ? (
                            <span className="text-sm text-neutral-600">Carregando…</span>
                        ) : (
                            <button onClick={loadMore} className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100">
                                Carregar mais
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* Modal de upload */}
            <Modalpadrao isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <div className="flex flex-col gap-4 p-5">
                    <h3 className="text-center text-2xl font-semibold italic">Adicionar foto para {residenteData?.apelido || "residente"}</h3>

                    <TextInputM2
                        disabled={false}
                        label="Descrição da Foto"
                        name="descricao"
                        onChange={(e: any) => {
                            const value = e?.target?.value ?? "";
                            setDescricao(value);
                            setInfoProps((prev) => ({ ...prev, descricao: value }));
                        }}
                        value={descricao}
                    />

                    <div className="flex justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => openWith("camera")}
                            className={`rounded-xl border px-3 py-2 text-sm font-medium ${captureMode === "camera" ? "border-neutral-900" : "border-neutral-300 hover:bg-neutral-100"}`}
                        >
                            Usar câmera
                        </button>
                        <button
                            type="button"
                            onClick={() => openWith("gallery")}
                            className={`rounded-xl border px-3 py-2 text-sm font-medium ${captureMode === "gallery" ? "border-neutral-900" : "border-neutral-300 hover:bg-neutral-100"}`}
                        >
                            Escolher da galeria
                        </button>
                    </div>

                    <File_Photo
                        uploadUrl={process.env.NEXT_PUBLIC_UPLOAD_URL ?? "https://lobster-app-gbru2.ondigitalocean.app/r2_upload"}
                        folders={`lfz-public/residentes/${residenteData._id}/fotos`}
                        residenteId={residenteData._id}
                        dbName="residentes"
                        descricao={infoProps.descricao}           // opcional
                        // ownerType="residente"                  // opcional
                        // ownerId={residenteData._id}            // opcional
                        // tags={["galeria"]}                     // opcional
                        // extraFields={{ origem: "galeria" }}    // opcional
                        // headers={{ Authorization: `Bearer ${token}` }} // se precisar
                        onSuccess={(payload) => {
                            // ex.: payload.url / payload.key
                            handleUploadFinish(); // recarrega a galeria
                        }}
                        onError={(msg) => console.error(msg)}
                    />
                </div>
            </Modalpadrao>
        </div>
    );
};

export default Residente_Fotos;
