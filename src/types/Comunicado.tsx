export interface Comunicado {
    _id: string;

    createdAt?: string;
    updatedAt?: string;

    title: string;
    description: string;

    createdBy?: string;
    creatorName?: string;

    readers?: Reader[];
    publico?: boolean;
}

interface Reader {
    userId: string;
    readAt: string;
}