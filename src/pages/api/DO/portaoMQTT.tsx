import { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "@/utils/authMiddleware";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }
    if (!requireAuth(req, res)) return;

    try {
        const apiRes = await fetch(`${process.env.URLDO}/portao/abrir`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: req.headers.authorization!,
            },
            body: JSON.stringify(req.body),
        });

        const data = await apiRes.json();
        res.status(apiRes.status).json(data);
    } catch (err) {
        res.status(500).json({ error: "Falha ao conectar ao backend" });
    }
}
