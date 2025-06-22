import { useState, useRef, MouseEvent, useEffect } from 'react';

type ClickPosition = {
    x: number; // percentual em relação à largura da imagem
    y: number; // percentual em relação à altura da imagem
};

export type ViewOption = 'frente' | 'costas' | 'lado-esquerdo' | 'lado-direito';

interface HumanBodyProps {
    imageSide: ViewOption;
    onClickData?: (data: { x: number; y: number; viewOption: ViewOption; bodyPart: string }) => void;
    viewOnly?: boolean; // Se for true, não exibe os botões de controle
    xPos?: number;
    yPos?: number;
}

const images: Record<ViewOption, string> = {
    frente: '/images/humanBody/Anatomia Frente.jpg',
    costas: '/images/humanBody/Anatomia Costas.jpg',
    'lado-esquerdo': '/images/humanBody/Anatomia Lado Esquerdo.jpg',
    'lado-direito': '/images/humanBody/Anatomia Lado Direito.jpg',
};


const HumanBodyImage: React.FC<HumanBodyProps> = ({ imageSide, onClickData, viewOnly = false, xPos, yPos }) => {
    const [clickPos, setClickPos] = useState<ClickPosition | null>({ x: xPos || 0, y: yPos || 0 });
    const [view, setView] = useState<ViewOption>('frente');
    const [showGrid, setShowGrid] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDev, setIsDev] = useState(false);

    // Definição da grade 
    const gridRows = 20;
    const gridColumns = 20;


    // Mapeamento de quadrante genérico
    const getGridQuadrant = (pos: ClickPosition): string => {
        const colWidth = 100 / gridColumns;
        const rowHeight = 100 / gridRows;
        const colIndex = Math.floor(pos.x / colWidth);
        const rowIndex = Math.floor(pos.y / rowHeight);
        return `Quadrante ${rowIndex + 1}-${colIndex + 1}`;
    };

    const getBodyPart = (pos: ClickPosition): string => {
        // Converte as porcentagens para índices (0-based)
        const colWidth = 100 / gridColumns;
        const rowHeight = 100 / gridRows;
        const col = Math.floor(pos.x / colWidth) + 1;
        const row = Math.floor(pos.y / rowHeight) + 1;

        // FRENTE
        if (row >= 11 && row <= 12 && col >= 3 && col <= 5) return 'Mão Direita';
        if (row >= 11 && row <= 12 && col >= 16 && col <= 18) return 'Mão Esquerda';
        if (row >= 9 && row <= 10 && col >= 3 && col <= 5) return 'Antebraço Direito';
        if (row >= 9 && row <= 10 && col >= 16 && col <= 18) return 'Antebraço Esquerdo';
        if (row >= 6 && row <= 8 && col >= 3 && col <= 5) return 'Braço Direito';
        if (row >= 6 && row <= 8 && col >= 16 && col <= 17) return 'Braço Esquerdo';
        if (row >= 5 && row <= 5 && col >= 4 && col <= 5) return 'Ombro Direito';
        if (row >= 5 && row <= 5 && col >= 4 && col <= 5) return 'Ombro Esquerdo';
        if (row >= 1 && row <= 3 && col >= 8 && col <= 13) return 'Cabeça';
        if (row >= 5 && row <= 6 && col >= 6 && col <= 15) return 'Tórax';
        if (row >= 4 && row <= 4 && col >= 7 && col <= 13) return 'Pescoço';
        if (row >= 7 && row <= 9 && col >= 6 && col <= 14) return 'Abdômen';
        if (row >= 10 && row <= 11 && col >= 6 && col <= 14) return 'Pelve';
        if (row >= 12 && row <= 14 && col >= 6 && col <= 10) return 'Coxa Direita';
        if (row >= 12 && row <= 14 && col >= 11 && col <= 14) return 'Coxa Esquerda';
        if (row >= 15 && row <= 15 && col >= 8 && col <= 9) return 'Joelho Direito';
        if (row >= 15 && row <= 15 && col >= 11 && col <= 13) return 'Joelho Esquerdo';
        if (row >= 16 && row <= 18 && col >= 7 && col <= 10) return 'Perna Direita';
        if (row >= 16 && row <= 18 && col >= 11 && col <= 13) return 'Perna Esquerda';
        if (row >= 19 && row <= 20 && col >= 7 && col <= 10) return 'Pé Direito';
        if (row >= 19 && row <= 20 && col >= 11 && col <= 13) return 'Pé Esquerdo';

        return 'Área não mapeada';
    };



    // ****************************
    // ****************************
    // USE EFFECTS
    // ****************************
    // ****************************

    useEffect(() => {
        setIsDev(process.env.MODE === 'dev');
    }, []);


    // ****************************
    // ****************************
    // HANDLERS
    // ****************************
    // ****************************

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        if (viewOnly) return;
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        const bodyPart = getBodyPart({ x, y });
        setClickPos({ x, y });

        // Dispara a função do pai, se fornecida
        if (onClickData) {
            onClickData({ x, y, viewOption: view, bodyPart });
        }

    };

    // ****************************
    // ****************************
    // RETURN 
    // ****************************
    // ****************************

    return (
        <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">

            {/* Controles */}
            {isDev && (
                <div className="flex flex-wrap gap-2 justify-center">
                    {/* {(['frente', 'costas', 'lado-esquerdo', 'lado-direito'] as ViewOption[]).map( */}
                    {(['frente',] as ViewOption[]).map(
                        (option) => (
                            <button key={option} onClick={() => { setView(option); setClickPos(null); }}
                                className={`px-4 py-2 rounded ${view === option ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </button>
                        )
                    )}

                    <button onClick={() => setShowGrid((prev) => !prev)} className="px-4 py-2 rounded bg-green-500 text-white">
                        {showGrid ? 'Ocultar' : 'Mostrar'} Grid
                    </button>

                </div>
            )}

            {/* Container da imagem responsiva */}
            <div className="relative w-full max-w-[200px] mx-auto cursor-pointer p-3" onClick={handleClick} ref={containerRef}>
                <img src={images[imageSide]} alt={`Vista ${imageSide}`} className="w-full h-auto object-contain" />

                {/* Ponto vermelho no clique */}
                {clickPos && (
                    <div style={{ top: `${clickPos.y}%`, left: `${clickPos.x}%`, transform: 'translate(-50%, -50%)', }}
                        className="absolute w-2 h-2 bg-red-500 rounded-full pointer-events-none" />
                )}

                {/* Renderização do grid para debug */}
                {showGrid && (
                    <>
                        {/* Linhas verticais com números */}
                        {Array.from({ length: gridColumns }).map((_, idx) => {
                            const leftPos = ((idx + 1) * 100) / gridColumns;
                            return (
                                <div key={`vline-${idx}`} className="absolute top-0 h-full" style={{ left: `${leftPos}%` }}>
                                    <div className="w-px h-full bg-blue-400 opacity-70 pointer-events-none" />
                                    <span className="absolute text-blue-600 px-1 opacity-90 text-xs top-1/12 right-1/12 -translate-y-full">
                                        {idx + 1}
                                    </span>
                                </div>
                            );
                        })}
                        {/* Linhas horizontais com números */}
                        {Array.from({ length: gridRows }).map((_, idx) => {
                            const topPos = ((idx + 1) * 100) / gridRows;
                            return (
                                <div key={`hline-${idx}`} className="absolute left-0 w-full" style={{ top: `${topPos}%` }}>
                                    <div className="w-full h-px bg-blue-400 opacity-70 pointer-events-none" />
                                    <span className="absolute text-blue-600 px-1 opacity-90 text-xs left-1/12 bottom-3/12 -translate-y-1/2">
                                        {idx + 1}
                                    </span>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

        </div>
    );
};

export default HumanBodyImage;