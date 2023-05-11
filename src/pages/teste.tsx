import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const generateDocx = async () => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun("Hello World"),
              new TextRun({ text: "Foo Bar", bold: true, }),
              new TextRun({ text: "\tGithub is the best", bold: true, }),
            ],
          }),
        ],
        
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, 'example.docx');
  });
}

// Done! A file called 'My Document.docx' will be in your file system.

const TestePage = () => {
  const handleClick = async () => {
    await generateDocx();
  };

  return (
    <div>
      <h1>Teste Page</h1>
      <button onClick={handleClick}>Generate Document</button>
    </div>
  );
};

export default TestePage;