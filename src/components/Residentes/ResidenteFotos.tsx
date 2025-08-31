"use client";

// Residente_Fotos.tsx — Completo (Lazy + Infinite Scroll + Upload via Express externo)
// - Integra com services/fotos.svc.ts (getFotosByResidente)
// - Evita múltiplas chamadas/piscadas (guards + observer control)
// - Upload usando File_M4 com uploadUrl para o Node/Express

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Button_M3 from "../Formularios/Button_M3";
import Modalpadrao from "../ModalPadrao";
import TextInputM2 from "../Formularios/TextInputM2";
import File_M4 from "../Formularios/File_M4";
import type { InfoProps } from "@/types/Arquivos_InfoProps";
import { notifyError } from "@/utils/Functions";
import { getFotosByResidente } from "@/services/fotos.svc";

// tipos básicos da galeria
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
const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL ?? "https://lobster-app-gbru2.ondigitalocean.app/upload";

// wrapper para o serviço externo
async function fetchFotosExternas(
  residenteId: string,
  cursor?: string,
  token?: string
): Promise<{ items: I_Foto[]; nextCursor?: string }> {
  const res = await getFotosByResidente(residenteId, { limit: PAGE_SIZE, cursor, token });
  if (!res.success || !res.data) throw new Error(res.message || "Falha ao carregar fotos");
  return { items: res.data.items as I_Foto[], nextCursor: res.data.nextCursor };
}

const Residente_Fotos: React.FC<Props> = ({ residenteData, token }) => {
  // modal / descrição / modo de captura
  const [modalOpen, setModalOpen] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("gallery");

  // info para persistência (mantém seu padrão atual)
  const [infoProps, setInfoProps] = useState<InfoProps>({
    dbName: "residentes",
    residenteId: residenteData._id,
    descricao: "",
  });

  // lista e paginação
  const [fotos, setFotos] = useState<I_Foto[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // sentinela do infinite scroll
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // guards contra concorrência/loops
  const fetchInFlightRef = useRef(false);
  const mountedRef = useRef(false);

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

  // primeira página / troca de residente
  useEffect(() => {
    mountedRef.current = true;
    setInfoProps((p) => ({ ...p, residenteId: residenteData._id }));

    // reset
    setFotos([]);
    setCursor(undefined);
    setHasMore(true);

    // primeira carga controlada (sem competir com observer)
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

  // observer: dispara apenas quando não há requisição em voo e há mais páginas
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fetchInFlightRef.current && hasMore) {
            void loadMore();
          }
        }
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, hasMore]);

  // após upload → recarrega primeira página
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
      <div>
        <Button_M3 label="Nova Foto" onClick={() => setModalOpen(true)} />
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
              onClick={() => setCaptureMode("camera")}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${captureMode === "camera" ? "border-neutral-900" : "border-neutral-300 hover:bg-neutral-100"}`}
            >
              Usar câmera
            </button>
            <button
              type="button"
              onClick={() => setCaptureMode("gallery")}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${captureMode === "gallery" ? "border-neutral-900" : "border-neutral-300 hover:bg-neutral-100"}`}
            >
              Escolher da galeria
            </button>
          </div>

          <File_M4
            folders={`lfz-public/residentes/${residenteData._id}/fotos`}
            infoProps={infoProps}
            triggerEffect={handleUploadFinish}
            accept="image/*"
            capture={captureMode === "camera" ? "environment" : undefined}
            multiple={false}
            uploadUrl={UPLOAD_URL}
            // headers={{ Authorization: `Bearer ${token}` }}
            extraFields={{ origem: "galeria" }}
          />
        </div>
      </Modalpadrao>
    </div>
  );
};

export default Residente_Fotos;
