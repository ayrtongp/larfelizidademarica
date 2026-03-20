export interface I_Arquivo {
    _id?: string;

    createdAt?: string;
    updatedAt?: string;

    descricao: string;

    status?: string;

    dbName: string;

    residenteId?: string[];
    userId?: string[];

    cloudURL: string;
    filename: string;
    cloudFilename: string;
    size: string;
    format: string;
    fullName: string;

    tags?: string[];
    categoria?: string;
}