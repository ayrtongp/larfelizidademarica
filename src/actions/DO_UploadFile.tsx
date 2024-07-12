import { I_Arquivo } from "@/types/Arquivos";

const urlDO = `https://lobster-app-gbru2.ondigitalocean.app/upload`



export async function uploadArquivoPasta(file: File, pasta: string, fullName: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folders', pasta);

    try {
        const response = await fetch(urlDO, { method: 'POST', body: formData });
        if (response.ok) {
            const result = await response.json()
            const novoBody = {
                status: result.status || null,
                cloudURL: result.url,
                filename: result.originalName,
                cloudFilename: result.filenameTimestamp,
                size: result.size,
                format: result.format,
                fullName: fullName,
            }

            if (result.status === 'OK') {
                return novoBody
            }
            else {
                return false
            }
        } else {
            console.error('Failed to upload file:', response.statusText);
            return false
        }
    } catch (error) {
        console.error('Error uploading file:', error);
    }
}

export async function deleteArquivoPastaSubPasta(folderPath: string, fileName: string) {
    const encodedFolderPath = encodeURIComponent(folderPath);
    const urlDO = `https://lobster-app-gbru2.ondigitalocean.app/delete?fileName=${fileName}&filePath=${encodedFolderPath}`
    try {
        const response = await fetch(urlDO, { method: 'DELETE' });

        if (response.ok) {
            return { responseOk: true, message: 'Arquivo deletado com sucesso!' }
        } else {
            console.error('Failed to delete file:', response.statusText);
            return { responseOk: false, message: 'Falha ao deletar arquivo.' }
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}