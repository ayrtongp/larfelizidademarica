// src/models/fotos.model.ts
import type { ObjectId } from "mongodb";

export type ArquivoR2Doc = {
    _id: ObjectId;
    bucket: string;
    key: string;
    originalName: string;
    title?: string;
    contentType?: string;
    size?: number;
    etag?: string;
    isPublic: boolean;

    collection?: string; // "fotos" | "arquivos" — salvo no MongoDB
    // resource NÃO é salvo no doc, só usada no buildKey do backend
    folder?: string;     // = userId = residenteId
    userId?: string;
    createdBy?: string;
    tags?: string[];

    createdAt: Date | string;
    updatedAt?: Date | string;
};

export type FotoItem = {
    _id: string;
    idosoId: string;
    url: string | null;        // null se não conseguir montar URL pública
    title?: string;          // se você futuramente persistir título
    createdAt: string;         // ISO
};

export const FOTOS_COLLECTION_NAME = "arquivosr2";
export const FOTOS_COLLECTION_FILTER = { collection: "fotos" } as const;
