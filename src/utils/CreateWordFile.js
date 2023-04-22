// NPM INSTALL DOCX

import { Document, Paragraph } from "docx";

async function createWordFile() {
  const doc = new Document();
  doc.addSection({
    children: [
      new Paragraph({
        text: "Hello, World!",
      }),
    ],
  });
  const buffer = await docx.Packer.toBuffer(doc);
  return buffer;
}

export default function CreateWordFile() {
  async function handleDownload() {
    const buffer = await createWordFile();
    const url = window.URL.createObjectURL(new Blob([buffer]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "example.docx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div>
      <h1>Create Word File</h1>
      <button onClick={handleDownload}>Download File</button>
    </div>
  );
}