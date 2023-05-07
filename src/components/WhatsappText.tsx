import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppTextarea() {
  const [message, setMessage] = useState("Olá, bom dia. Vim através do site para buscar mais informações sobre o Lar Felizidade.");

  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const phone = '5521999269047'
    const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;
    // const queryParams = queryString.stringify({ text: encodedMessage, app_absent: "0", });
    // const finalUrl = `${whatsappUrl}&${queryParams}`;
    window.open(whatsappUrl);
  };

  return (
    <div className="flex flex-col items-center space-x-2">
      <h2 className="">Digite sua mensagem abaixo (whatsapp)</h2>
      <textarea className="h-36 text-black border border-gray-300 rounded-md px-3 py-2 w-full" value={message} onChange={(e) => setMessage(e.target.value)} />
      <div onClick={handleClick} className="flex items-center justify-center mt-2 bg-green-500 text-white rounded-full p-3 hover:bg-green-600 focus:outline-none cursor-pointer">
        <span className="mr-2">Enviar</span>
        <FaWhatsapp size={20} />
      </div>
    </div>
  );
}
