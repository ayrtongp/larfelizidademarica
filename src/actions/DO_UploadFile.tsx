const urlDO = `https://lobster-app-gbru2.ondigitalocean.app/upload`;

export async function uploadArquivoPasta(file: File, pasta: string, fullName: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folders", pasta);

    try {
        const response = await fetch(urlDO, {
            method: "POST",
            body: formData,
            mode: "cors",
            credentials: "omit", // <<< NÃO enviar cookies; se usar cookies, trocar para "include"
            cache: "no-store",
        });

        if (!response.ok) {
            const txt = await response.text().catch(() => "");
            console.error("Failed to upload file:", response.status, response.statusText, txt);
            return false;
        }

        // Garante que só tenta parsear JSON quando vier JSON
        const ct = response.headers.get("content-type") || "";
        const result = ct.includes("application/json") ? await response.json() : {};

        const novoBody: any = {
            status: result?.status ?? null,
            cloudURL: result?.url,
            filename: result?.originalName,
            cloudFilename: result?.filenameTimestamp,
            size: result?.size,
            format: result?.format,
            fullName,
        };

        return result?.status === "OK" ? novoBody : false;
    } catch (error) {
        console.error("Error uploading file:", error);
        return false;
    }
}

export async function deleteArquivoPastaSubPasta(folderPath: string, fileName: string) {
    const encodedFolderPath = encodeURIComponent(folderPath);
    const urlDO = `https://lobster-app-gbru2.ondigitalocean.app/delete?fileName=${encodeURIComponent(fileName)}&filePath=${encodedFolderPath}`;

    try {
        const response = await fetch(urlDO, {
            method: "DELETE",
            mode: "cors",
            credentials: "omit", // idem
            cache: "no-store",
        });

        if (!response.ok) {
            const txt = await response.text().catch(() => "");
            console.error("Failed to delete file:", response.status, response.statusText, txt);
            return { responseOk: false, message: "Falha ao deletar arquivo." };
        }

        return { responseOk: true, message: "Arquivo deletado com sucesso!" };
    } catch (error) {
        console.error("Error deleting file:", error);
        return { responseOk: false, message: "Falha ao deletar arquivo." };
    }
}
