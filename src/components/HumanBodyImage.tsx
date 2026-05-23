import { useState, useRef, MouseEvent } from 'react';

type ClickPosition = { x: number; y: number };

export type ViewOption = 'frente' | 'costas' | 'lado-esquerdo' | 'lado-direito';

interface HumanBodyProps {
    imageSide: ViewOption;
    onClickData?: (data: { x: number; y: number; viewOption: ViewOption; bodyPart: string }) => void;
    viewOnly?: boolean;
    xPos?: number;
    yPos?: number;
}

const images: Record<ViewOption, string> = {
    frente: '/images/humanBody/Anatomia Frente.jpg',
    costas: '/images/humanBody/Anatomia Costas.jpg',
    'lado-esquerdo': '/images/humanBody/Anatomia Lado Esquerdo.jpg',
    'lado-direito': '/images/humanBody/Anatomia Lado Direito.jpg',
};

const viewLabels: Record<ViewOption, string> = {
    frente: 'Frente',
    costas: 'Costas',
    'lado-direito': 'Lado Dir.',
    'lado-esquerdo': 'Lado Esq.',
};

const GRID = 20;

const getBodyPart = (pos: ClickPosition, view: ViewOption): string => {
    const col = Math.floor(pos.x / (100 / GRID)) + 1;
    const row = Math.floor(pos.y / (100 / GRID)) + 1;

    if (view === 'frente') {
        if (row <= 3 && col >= 8 && col <= 13) return 'Cabeça';
        if (row === 4 && col >= 7 && col <= 13) return 'Pescoço';
        if (row === 5 && col >= 4 && col <= 6) return 'Ombro Direito';
        if (row === 5 && col >= 15 && col <= 17) return 'Ombro Esquerdo';
        if (row >= 5 && row <= 6 && col >= 6 && col <= 15) return 'Tórax';
        if (row >= 6 && row <= 8 && col >= 3 && col <= 5) return 'Braço Direito';
        if (row >= 6 && row <= 8 && col >= 16 && col <= 18) return 'Braço Esquerdo';
        if (row >= 7 && row <= 9 && col >= 6 && col <= 14) return 'Abdômen';
        if (row >= 9 && row <= 10 && col >= 3 && col <= 5) return 'Antebraço Direito';
        if (row >= 9 && row <= 10 && col >= 16 && col <= 18) return 'Antebraço Esquerdo';
        if (row >= 10 && row <= 11 && col >= 6 && col <= 14) return 'Pelve';
        if (row >= 11 && row <= 12 && col >= 3 && col <= 5) return 'Mão Direita';
        if (row >= 11 && row <= 12 && col >= 16 && col <= 18) return 'Mão Esquerda';
        if (row >= 12 && row <= 14 && col >= 6 && col <= 10) return 'Coxa Direita';
        if (row >= 12 && row <= 14 && col >= 11 && col <= 14) return 'Coxa Esquerda';
        if (row === 15 && col >= 8 && col <= 9) return 'Joelho Direito';
        if (row === 15 && col >= 11 && col <= 13) return 'Joelho Esquerdo';
        if (row >= 16 && row <= 18 && col >= 7 && col <= 10) return 'Perna Direita';
        if (row >= 16 && row <= 18 && col >= 11 && col <= 13) return 'Perna Esquerda';
        if (row >= 19 && col >= 7 && col <= 10) return 'Pé Direito';
        if (row >= 19 && col >= 11 && col <= 13) return 'Pé Esquerdo';
    }

    if (view === 'costas') {
        // Na vista posterior, esquerdo da imagem = direito da pessoa (e vice-versa)
        if (row <= 3 && col >= 8 && col <= 13) return 'Cabeça';
        if (row === 4 && col >= 7 && col <= 13) return 'Pescoço';
        if (row === 5 && col >= 4 && col <= 6) return 'Ombro Esquerdo';
        if (row === 5 && col >= 15 && col <= 17) return 'Ombro Direito';
        if (row >= 5 && row <= 7 && col >= 6 && col <= 15) return 'Dorso Superior';
        if (row >= 6 && row <= 8 && col >= 3 && col <= 5) return 'Braço Esquerdo';
        if (row >= 6 && row <= 8 && col >= 16 && col <= 18) return 'Braço Direito';
        if (row >= 8 && row <= 10 && col >= 6 && col <= 14) return 'Região Lombar';
        if (row >= 9 && row <= 10 && col >= 3 && col <= 5) return 'Antebraço Esquerdo';
        if (row >= 9 && row <= 10 && col >= 16 && col <= 18) return 'Antebraço Direito';
        if (row >= 10 && row <= 12 && col >= 6 && col <= 14) return 'Glúteo';
        if (row >= 11 && row <= 12 && col >= 3 && col <= 5) return 'Mão Esquerda';
        if (row >= 11 && row <= 12 && col >= 16 && col <= 18) return 'Mão Direita';
        if (row >= 12 && row <= 14 && col >= 6 && col <= 10) return 'Coxa Posterior Esquerda';
        if (row >= 12 && row <= 14 && col >= 11 && col <= 14) return 'Coxa Posterior Direita';
        if (row === 15 && col >= 8 && col <= 9) return 'Fossa Poplítea Esquerda';
        if (row === 15 && col >= 11 && col <= 13) return 'Fossa Poplítea Direita';
        if (row >= 16 && row <= 18 && col >= 7 && col <= 10) return 'Panturrilha Esquerda';
        if (row >= 16 && row <= 18 && col >= 11 && col <= 13) return 'Panturrilha Direita';
        if (row >= 19 && col >= 7 && col <= 10) return 'Calcanhar Esquerdo';
        if (row >= 19 && col >= 11 && col <= 13) return 'Calcanhar Direito';
    }

    if (view === 'lado-direito' || view === 'lado-esquerdo') {
        const ladoM = view === 'lado-direito' ? 'Direito' : 'Esquerdo';
        const ladoF = view === 'lado-direito' ? 'Direita' : 'Esquerda';
        if (row <= 3) return 'Cabeça';
        if (row === 4) return 'Pescoço';
        if (row === 5) return `Ombro ${ladoM}`;
        if (row >= 5 && row <= 7 && col >= 5 && col <= 15) return 'Tórax Lateral';
        if (row >= 6 && row <= 8 && (col < 5 || col > 15)) return `Braço ${ladoM}`;
        if (row >= 8 && row <= 10 && col >= 5 && col <= 15) return 'Abdômen Lateral';
        if (row >= 9 && row <= 10 && (col < 5 || col > 15)) return `Antebraço ${ladoM}`;
        if (row >= 10 && row <= 12 && col >= 5 && col <= 15) return `Quadril ${ladoM}`;
        if (row >= 11 && row <= 12 && (col < 5 || col > 15)) return `Mão ${ladoF}`;
        if (row >= 12 && row <= 15) return `Coxa Lateral ${ladoF}`;
        if (row >= 16 && row <= 18) return `Perna Lateral ${ladoF}`;
        if (row >= 19) return `Pé ${ladoM}`;
    }

    return 'Área não mapeada';
};

const HumanBodyImage: React.FC<HumanBodyProps> = ({ imageSide, onClickData, viewOnly = false, xPos, yPos }) => {
    const [clickPos, setClickPos] = useState<ClickPosition | null>(
        xPos && yPos ? { x: xPos, y: yPos } : null
    );
    const [view, setView] = useState<ViewOption>(imageSide);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleViewChange = (newView: ViewOption) => {
        setView(newView);
        setClickPos(null);
    };

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        if (viewOnly || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        const bodyPart = getBodyPart({ x, y }, view);
        setClickPos({ x, y });
        if (onClickData) onClickData({ x, y, viewOption: view, bodyPart });
    };

    return (
        <div className="flex flex-col items-center gap-3">
            {!viewOnly && (
                <div className="flex flex-wrap gap-1.5 justify-center">
                    {(['frente', 'costas', 'lado-direito', 'lado-esquerdo'] as ViewOption[]).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => handleViewChange(option)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-150 ${view === option
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                }`}
                        >
                            {viewLabels[option]}
                        </button>
                    ))}
                </div>
            )}

            {viewOnly && (
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {viewLabels[imageSide]}
                </span>
            )}

            <div
                ref={containerRef}
                onClick={handleClick}
                className={`relative w-full max-w-[180px] select-none ${!viewOnly ? 'cursor-crosshair' : ''}`}
            >
                <img
                    src={viewOnly ? images[imageSide] : images[view]}
                    alt={`Anatomia corporal - ${viewOnly ? viewLabels[imageSide] : viewLabels[view]}`}
                    className="w-full h-auto object-contain rounded"
                    draggable={false}
                />
                {clickPos && (
                    <div
                        style={{ top: `${clickPos.y}%`, left: `${clickPos.x}%`, transform: 'translate(-50%, -50%)' }}
                        className="absolute w-4 h-4 bg-red-500 rounded-full pointer-events-none border-2 border-white shadow-md"
                    />
                )}
            </div>

            {!viewOnly && (
                <p className="text-xs text-gray-400">Clique sobre o corpo para marcar a lesão</p>
            )}
        </div>
    );
};

export default HumanBodyImage;
