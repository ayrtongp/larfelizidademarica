"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaCamera, FaImages, FaTrash, FaPaperPlane } from "react-icons/fa";

/**
 * Componente exclusivo para tirar foto / escolher da galeria
 * e enviar diretamente ao backend Express (multipart/form-data).
 *
 * Não usa actions locais. Não tem fallbacks. Só Express.
 */

export type PhotoPickerPayload = {
    status: "OK" | "ERROR" | string;
    url?: string; // URL pública devolvida pelo back
    key?: string; // chave no bucket (ex.: lfz-public/...)
    _id?: string; // id do registro salvo (se o back retornar)
    [k: string]: any;
};

interface Props {
    /** Endpoint do seu backend Express (ex.: https://.../upload) */
    uploadUrl: string;
    /** Caminho/pasta desejada no bucket. Ex.: lfz-public/residentes/<id>/fotos */
    folders: string;
    /** Contexto mínimo usual do seu back */
    residenteId: string;
    dbName?: string; // padrão: 'residentes'

    /** Campos opcionais que seu back aceita */
    descricao?: string;
    ownerType?: string;
    ownerId?: string;
    tags?: string[] | string;
    extraFields?: Record<string, string>;
    headers?: Record<string, string>; // Authorization, etc.

    /** Callbacks */
    onSuccess?: (payload: PhotoPickerPayload) => void;
    onError?: (message: string, detail?: any) => void;
}

const File_Photo: React.FC<Props> = ({
    uploadUrl,
    folders,
    residenteId,
    dbName = "residentes",
    descricao,
    ownerType,
    ownerId,
    tags,
    extraFields,
    headers,
    onSuccess,
    onError,
}) => {
    // estado do arquivo e preview
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMsg, setStatusMsg] = useState<string>("");

    // modo de captura + chaves para recriar input quando muda
    const [mode, setMode] = useState<"camera" | "gallery">("gallery");
    const [inputKey, setInputKey] = useState<string>("gallery-image");
    const [pickerTick, setPickerTick] = useState(0);

    // input escondido
    const inputRef = useRef<HTMLInputElement | null>(null);

    // iOS x Android: iOS usa "camera", Android/Chrome aceita "environment" p/ traseira
    const isIOS = useMemo(
        () => typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent),
        []
    );
    const captureAttr: any = mode === "camera" ? (isIOS ? "camera" : "environment") : undefined;

    // Abre o seletor com o modo desejado
    const openWith = (nextMode: "camera" | "gallery") => {
        setMode(nextMode);
        // força recriar input com novo capture e abrir imediatamente
        const nextKey = `${nextMode}-${Date.now()}`;
        setInputKey(nextKey);
        setPickerTick((t) => t + 1);
    };

    // Clique programático quando o tick mudar
    useEffect(() => {
        if (pickerTick && inputRef.current) inputRef.current.click();
    }, [pickerTick]);

    // Limpa preview ao trocar arquivo
    useEffect(() => {
        if (!file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const f = e.target.files?.[0] || null;
        setFile(f);
    };

    const handleClear = () => {
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    // Upload com XHR para ter progresso
    const upload = async () => {
        if (!file) {
            setStatusMsg("Anexe uma foto antes de enviar.");
            onError?.("Nenhum arquivo selecionado");
            return;
        }

        setUploading(true);
        setProgress(0);
        setStatusMsg("");

        // Monta o form data esperado pelo seu back
        const form = new FormData();
        form.append("file", file);
        form.append("folders", folders);
        form.append("dbName", dbName);
        form.append("residenteId", residenteId);
        if (descricao) form.append("descricao", descricao);
        if (ownerType) form.append("ownerType", ownerType);
        if (ownerId) form.append("ownerId", ownerId);
        if (typeof tags === "string") form.append("tags", tags);
        else if (Array.isArray(tags)) tags.forEach((t) => form.append("tags", t));
        if (extraFields) Object.entries(extraFields).forEach(([k, v]) => form.append(k, v));

        try {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", uploadUrl, true);

            // headers (sem definir Content-Type; o XHR faz o boundary)
            if (headers) Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

            xhr.upload.onprogress = (ev) => {
                if (ev.lengthComputable) {
                    const pct = Math.round((ev.loaded / ev.total) * 100);
                    setProgress(pct);
                }
            };

            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;
                try {
                    const json: PhotoPickerPayload = JSON.parse(xhr.responseText || "{}");
                    const ok = xhr.status >= 200 && xhr.status < 300 && (json.status === "OK" || json.status === undefined);
                    if (!ok) {
                        const msg = json?.message || json?.error || `Falha no upload (${xhr.status}).`;
                        setStatusMsg(msg);
                        onError?.(msg, json);
                        setUploading(false);
                        return;
                    }
                    setStatusMsg("Upload realizado com sucesso.");
                    onSuccess?.(json);
                    // Reseta estado
                    setFile(null);
                    setProgress(0);
                    if (inputRef.current) inputRef.current.value = "";
                } catch (err: any) {
                    const msg = `Erro ao processar resposta do servidor.`;
                    setStatusMsg(msg);
                    onError?.(msg, err);
                } finally {
                    setUploading(false);
                }
            };

            xhr.onerror = () => {
                const msg = "Erro de rede durante o upload.";
                setStatusMsg(msg);
                onError?.(msg);
                setUploading(false);
            };

            xhr.send(form);
        } catch (err: any) {
            const msg = err?.message || "Falha inesperada no upload.";
            setStatusMsg(msg);
            onError?.(msg, err);
            setUploading(false);
        }
    };

    return (
        <div className="flex w-full flex-col gap-3">
            {/* Ações rápidas */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => openWith("camera")}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-100"
                >
                    <FaCamera className="h-4 w-4" /> Usar câmera
                </button>
                <button
                    type="button"
                    onClick={() => openWith("gallery")}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-100"
                >
                    <FaImages className="h-4 w-4" /> Escolher da galeria
                </button>
            </div>

            {/* Input escondido controlado */}
            <input
                key={inputKey}
                ref={inputRef}
                type="file"
                accept="image/*"
                capture={captureAttr}
                className="hidden"
                onChange={handleSelect}
            />

            {/* Preview */}
            {previewUrl ? (
                <div className="flex items-center gap-3">
                    <div className="relative h-24 w-24 overflow-hidden rounded-xl ring-1 ring-neutral-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt="Pré-visualização da foto" className="h-full w-full object-cover" />
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-100"
                    >
                        <FaTrash className="h-4 w-4" /> Remover
                    </button>
                </div>
            ) : (
                <p className="text-sm text-neutral-600">Nenhuma foto selecionada.</p>
            )}

            {/* Barra de progresso */}
            {uploading && (
                <div className="w-full max-w-xs rounded-lg border bg-white p-3 shadow">
                    <div className="h-2 w-full rounded-full bg-neutral-200">
                        <div
                            className="h-full rounded-full bg-neutral-900 transition-all"
                            style={{ width: `${progress}%` }}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progress}
                            role="progressbar"
                        />
                    </div>
                    <p className="mt-2 text-center text-xs text-neutral-600">{progress}%</p>
                </div>
            )}

            {/* Mensagens */}
            {statusMsg && <p className="text-sm text-neutral-700">{statusMsg}</p>}

            {/* Enviar */}
            <div>
                <button
                    type="button"
                    disabled={!file || uploading}
                    onClick={upload}
                    className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <FaPaperPlane className="h-4 w-4" /> Enviar foto
                </button>
            </div>
        </div>
    );
};

export default File_Photo;
