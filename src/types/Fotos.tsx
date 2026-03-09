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

    collection?: string; // "usuario"
    resource?: string;   // "fotos" — subcategoria dentro de usuario
    folder?: string;     // idosoId (ex.: "64f...ab")
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
export const FOTOS_COLLECTION_FILTER = { collection: "usuario", resource: "fotos" } as const;
