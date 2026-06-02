const server = process.env.NEXT_PUBLIC_APIWA_SERVER
const key = process.env.NEXT_PUBLIC_APIWA_KEY

export async function sendMessage(to: string, text: string) {
    const url = `${server}/${key}/message/text`
    const body = { to, text }
    const method = 'POST'
    const headers = { 'Content-Type': 'application/json' }
    const options = { method, headers, body: JSON.stringify(body), }

    const sendMessage = await fetch(url, options)
    const result = await sendMessage.json()
    return result
}

export async function sendDocument(to: string, fileUrl: string, mimetype: string, fileName: string, caption?: string) {
    const url = `${server}/${key}/message/document`
    const body: Record<string, string> = { to, url: fileUrl, mimetype, fileName }
    if (caption) body.caption = caption

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    const result = await res.json()
    return result
}