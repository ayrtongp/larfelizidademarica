import React, {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    KeyboardEvent,
    FocusEvent,
} from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

function cx(...c: (string | false | undefined)[]) {
    return c.filter(Boolean).join(" ");
}

export interface Opcao {
    _id: string;
    nome: string;
    [k: string]: any;
}

interface Props {
    label: string;
    placeholder?: string;
    value: Opcao | null;                       // seleção atual
    onChange: (val: Opcao | null) => void;     // callback ao selecionar/limpar
    options: Opcao[];                          // lista completa
    disabled?: boolean;
    className?: string;
    clearable?: boolean;                       // padrão: true
    showIdSuffix?: boolean;                    // exibe “(xxxxx)” após nome quando FECHADO (padrão: true)
    showSubtitle?: boolean
    // Customizações (opcionais)
    getOptionLabel?: (opt: Opcao) => string;         // padrão: opt.nome
    getOptionKey?: (opt: Opcao) => string;           // padrão: opt._id
    getOptionSubtitle?: (opt: Opcao) => string | null; // ex.: mostrar _id
    filter?: (opt: Opcao, query: string) => boolean; // padrão: nome/_id/apelido includes
    emptyText?: string;                              // texto quando sem resultados
}

const ComboBox: React.FC<Props> = ({
    label,
    placeholder = "Digite para buscar...",
    value,
    onChange,
    options,
    disabled = false,
    className,
    clearable = true,
    showIdSuffix = false,
    showSubtitle = false,
    getOptionLabel = (o) => o.nome,
    getOptionKey = (o) => o._id,
    getOptionSubtitle = (o) => o._id || null,
    filter,
    emptyText = "Nenhuma opção encontrada.",
}) => {
    const genId = useId();
    const inputId = `cb-input-${genId}`;
    const listId = `cb-list-${genId}`;

    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [highlightIndex, setHighlightIndex] = useState(0);

    // Abriu → começa com query vazia e highlight no topo
    useEffect(() => {
        if (open) {
            setQuery("");
            setHighlightIndex(0);
            // foca o input ao abrir
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    // Filtro padrão (nome/apelido/_id)
    const defaultFilter = (opt: Opcao, q: string) => {
        const s = q.trim().toLowerCase();
        if (!s) return true;
        const nome = (opt.nome || "").toLowerCase();
        const id = (opt._id || "").toLowerCase();
        const apelido = (String(opt.apelido || "")).toLowerCase();
        return nome.includes(s) || apelido.includes(s) || id.includes(s);
    };

    const filtered = useMemo(() => {
        const f = filter || defaultFilter;
        return options.filter((o) => f(o, query));
    }, [options, query, filter]);

    // Fecha no blur do wrapper, exceto quando o foco permanece DENTRO
    const handleWrapperBlur = (e: FocusEvent<HTMLDivElement>) => {
        const next = e.relatedTarget as Node | null;
        if (wrapperRef.current && next && wrapperRef.current.contains(next)) {
            return; // foco ainda dentro do combobox → não fecha
        }
        setOpen(false);
    };

    // Teclado no input
    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            setOpen(true);
            return;
        }
        if (!open) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const opt = filtered[highlightIndex];
            if (opt) {
                onChange(opt);
                setOpen(false);
                inputRef.current?.blur();
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            inputRef.current?.blur();
        }
    };

    const handleSelect = (opt: Opcao) => {
        onChange(opt);
        setOpen(false);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleClear = () => {
        onChange(null);
        setQuery("");
        setHighlightIndex(0);
        setOpen(false);
        inputRef.current?.focus();
    };

    // O que aparece no INPUT:
    // - Se aberto → mostra a query digitada
    // - Se fechado e há seleção → mostra label (com sufixo do ID se showIdSuffix)
    // - Se nada → string vazia
    const selectedLabel = value ? getOptionLabel(value) : "";
    const idSuffix = value && showIdSuffix ? ` (${String(value._id).slice(-6)})` : "";
    const inputDisplay = open ? query : value ? `${selectedLabel}${idSuffix}` : "";

    return (
        <div className={cx("col-span-full", className)}>
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium mb-1">
                    {label}
                </label>
            )}

            <div
                ref={wrapperRef}
                className="relative"
                onBlur={handleWrapperBlur}
                role="combobox"
                aria-expanded={open}
                aria-owns={listId}
                aria-haspopup="listbox"
            >
                <div
                    className={cx(
                        "flex items-center gap-2 border rounded-xl px-3 py-2 bg-white shadow-sm",
                        "focus-within:ring-2 focus-within:ring-blue-500",
                        disabled && "opacity-60 cursor-not-allowed"
                    )}
                >
                    <FaSearch className="text-gray-400" />
                    <input
                        id={inputId}
                        ref={inputRef}
                        value={inputDisplay}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (!open) setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={onKeyDown}
                        placeholder={placeholder}
                        className="w-full outline-none"
                        disabled={disabled}
                        aria-autocomplete="list"
                        aria-controls={listId}
                        aria-activedescendant={
                            open && filtered[highlightIndex]
                                ? `${listId}-opt-${getOptionKey(filtered[highlightIndex])}`
                                : undefined
                        }
                    />

                    {clearable && value && !disabled && (
                        <button
                            type="button"
                            title="Limpar seleção"
                            className="text-gray-400 hover:text-gray-600 p-1 rounded"
                            onClick={handleClear}
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>

                {/* Dropdown */}
                {open && (
                    <div
                        id={listId}
                        role="listbox"
                        className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-xl border bg-white shadow-lg"
                        onMouseDown={(e) => e.preventDefault()} // evita blur antes do click
                    >
                        {filtered.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">{emptyText}</div>
                        ) : (
                            filtered.map((opt, idx) => {
                                const key = getOptionKey(opt);
                                const label = getOptionLabel(opt);
                                const subtitle = getOptionSubtitle(opt);
                                const active = idx === highlightIndex;
                                const selected = value ? getOptionKey(value) === key : false;

                                return (
                                    <button
                                        key={key}
                                        id={`${listId}-opt-${key}`}
                                        role="option"
                                        aria-selected={selected}
                                        type="button"
                                        className={cx(
                                            "w-full text-left px-3 py-2",
                                            active ? "bg-blue-50" : "hover:bg-blue-50",
                                            selected && "bg-blue-100"
                                        )}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSelect(opt)}
                                        onMouseEnter={() => setHighlightIndex(idx)}
                                    >
                                        <div className="font-medium">{label}</div>
                                        {showSubtitle && subtitle ? (
                                            <div className="text-xs text-gray-500">{subtitle}</div>
                                        ) : null}
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComboBox;
