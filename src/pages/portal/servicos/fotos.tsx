import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import PermissionWrapper from "@/components/PermissionWrapper";
import PortalBase from "@/components/Portal/PortalBase";
import ModalPadrao from "@/components/ModalPadrao";
import { Residentes_GET_getAllActive } from "@/actions/Residentes";
import { notifyError, notifySuccess } from "@/utils/Functions";
import { FaCamera, FaCloudUploadAlt, FaImage, FaSearch, FaTimes, FaUndo, FaSync } from "react-icons/fa";
import { format } from "date-fns";
import Button_M3 from "@/components/Formularios/Button_M3";

// ✅ Carrega o cropper só no client
const Cropper = dynamic(() => import("react-easy-crop"), { ssr: false }) as any;

type Residente = {
    _id: string;
    nome: string;
    apelido?: string;
    fotoPerfilUrl?: string;
};

type FotoItem = {
    _id: string;
    idosoId: string;
    url: string;
    legenda?: string;
    createdAt: string;
};

const PAGE_LIMIT = 10;

function classNames(...c: (string | false | undefined)[]) {
    return c.filter(Boolean).join(" ");
}

const FotosServicosPage: React.FC = () => {
    // --- Estado base
    const [residentes, setResidentes] = useState<Residente[]>([]);
    const [fotos, setFotos] = useState<FotoItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // --- Busca/combobox de idoso
    const [idosoBusca, setIdosoBusca] = useState<string>("");
    const [idosoId, setIdosoId] = useState<string>("");
    const [comboboxOpen, setComboboxOpen] = useState(false);

    // --- Upload & Edição
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [legenda, setLegenda] = useState("");
    const [rawFile, setRawFile] = useState<File | null>(null);
    const [previewURL, setPreviewURL] = useState<string | null>(null);

    // Crop state
    const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(1);
    const [rotation, setRotation] = useState<number>(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // --- Efeitos iniciais
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await Residentes_GET_getAllActive();
                setResidentes(Array.isArray(res) ? res : []);
            } catch (e) {
                notifyError("Não foi possível carregar os residentes.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const resp = await fetch(`/api/Controller/Fotos.ctrl?type=latest&limit=${PAGE_LIMIT}`);
                if (resp.ok) {
                    const data = await resp.json();
                    setFotos(Array.isArray(data?.fotos) ? data.fotos : []);
                } else {
                    setFotos([]);
                }
            } catch (e) {
                setFotos([]);
            }
        })();
    }, []);

    // --- Helpers de imagem (crop/rotate em canvas)
    const createImage = (url: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.addEventListener("load", () => resolve(img));
            img.addEventListener("error", (error) => reject(error));
            img.setAttribute("crossOrigin", "anonymous");
            img.src = url;
        });

    const getRadianAngle = (degreeValue: number) => (degreeValue * Math.PI) / 180;

    const getCroppedImg = useCallback(
        async (imageSrc: string, pixelCrop: any, rotationDeg = 0): Promise<Blob> => {
            const image = await createImage(imageSrc);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas context não disponível");

            const safeArea = Math.max(image.width, image.height) * 2;
            canvas.width = safeArea;
            canvas.height = safeArea;

            ctx.translate(safeArea / 2, safeArea / 2);
            ctx.rotate(getRadianAngle(rotationDeg));
            ctx.translate(-safeArea / 2, -safeArea / 2);
            ctx.drawImage(image, (safeArea - image.width) / 2, (safeArea - image.height) / 2);

            const data = ctx.getImageData(0, 0, safeArea, safeArea);
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;

            ctx.putImageData(
                data,
                Math.round(-safeArea / 2 + image.width / 2 - pixelCrop.x),
                Math.round(-safeArea / 2 + image.height / 2 - pixelCrop.y)
            );

            return new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => resolve(blob as Blob), "image/jpeg", 0.92);
            });
        },
        []
    );

    // --- Combobox filtrado (nome ou id)
    const residentesFiltrados = useMemo(() => {
        const q = idosoBusca.trim().toLowerCase();
        if (!q) return residentes;
        return residentes.filter((r) => {
            const nome = (r.nome || "").toLowerCase();
            const apelido = (r.apelido || "").toLowerCase();
            const id = (r._id || "").toLowerCase();
            return nome.includes(q) || apelido.includes(q) || id.includes(q);
        });
    }, [idosoBusca, residentes]);

    const idosoSelecionado = useMemo(
        () => residentes.find((r) => r._id === idosoId),
        [idosoId, residentes]
    );

    // --- Handlers
    const openCamera = () => cameraInputRef.current?.click();
    const openGallery = () => galleryInputRef.current?.click();

    const onFileChosen = (file?: File) => {
        if (!file) return;
        setRawFile(file);
        const url = URL.createObjectURL(file);
        setPreviewURL(url);
        setUploadModalOpen(true);
    };

    const onCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        onFileChosen(f);
        e.currentTarget.value = "";
    };
    const onGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        onFileChosen(f);
        e.currentTarget.value = "";
    };

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPx: any) => {
        setCroppedAreaPixels(croppedAreaPx);
    }, []);

    const resetEditor = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setLegenda("");
    };

    const closeUploadModal = () => {
        setUploadModalOpen(false);
        setRawFile(null);
        if (previewURL) URL.revokeObjectURL(previewURL);
        setPreviewURL(null);
        resetEditor();
    };

    const doUpload = async () => {
        try {
            if (!previewURL || !croppedAreaPixels) {
                notifyError("Ajuste o recorte antes de enviar.");
                return;
            }
            if (!idosoId) {
                notifyError("Selecione o residente.");
                return;
            }

            const croppedBlob = await getCroppedImg(previewURL, croppedAreaPixels, rotation);
            const fd = new FormData();
            fd.append("idosoId", idosoId);
            fd.append("legenda", legenda || "");
            fd.append("file", new File([croppedBlob], (rawFile?.name || "foto") + ".jpg", { type: "image/jpeg" }));

            const resp = await fetch("/api/Controller/Fotos.ctrl?type=upload", {
                method: "POST",
                body: fd,
            });

            if (!resp.ok) throw new Error("Falha no upload");
            const data = await resp.json();

            notifySuccess("Foto enviada com sucesso!");
            // prepend nova foto na galeria (otimista)
            if (data?.foto) {
                setFotos((curr) => [data.foto, ...curr].slice(0, PAGE_LIMIT));
            }
            closeUploadModal();
        } catch (e) {
            notifyError("Não foi possível enviar a foto.");
        }
    };

    // --- UI
    return (
        <PermissionWrapper href="/portal">
            <PortalBase>
                {/* Header / Ações */}
                <div className="col-span-full mt-4 md:mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Fotos dos Residentes</h1>
                        <p className="text-sm text-gray-500">Veja as últimas 10 fotos adicionadas e envie novas com edição prévia.</p>
                    </div>

                    <div className="flex items-center gap-2">

                        <Button_M3 onClick={openCamera} bgColor="" label={'Camera'} className="flex items-center gap-2" />
                        <Button_M3 onClick={openGallery} bgColor="" label={'Galeria'} className="flex items-center gap-2" />

                        {/* Inputs escondidos */}
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={onCameraChange}
                        />
                        <input
                            ref={galleryInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onGalleryChange}
                        />
                    </div>
                </div>

                {/* Combobox (select digitável) */}
                <div className="col-span-full mt-4">
                    <label className="block text-sm font-medium mb-1">Residente</label>
                    <div className="relative">
                        <div className="flex items-center gap-2 border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 bg-white shadow-sm">
                            <FaSearch className="text-gray-400" />
                            <input
                                value={idosoBusca}
                                onChange={(e) => {
                                    setIdosoBusca(e.target.value);
                                    setComboboxOpen(true);
                                }}
                                onFocus={() => setComboboxOpen(true)}
                                placeholder="Digite nome ou ID do residente"
                                className="w-full outline-none"
                                onBlur={() => setComboboxOpen(false)}
                            />
                            {idosoId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIdosoId("");
                                        setIdosoBusca("");
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Limpar seleção"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>

                        {/* Dropdown */}
                        {comboboxOpen && (
                            <div
                                className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-xl border bg-white shadow-lg"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                {residentesFiltrados.length === 0 && (
                                    <div className="px-3 py-2 text-sm text-gray-500">Nenhum residente encontrado.</div>
                                )}
                                {residentesFiltrados.map((r) => {
                                    const selected = r._id === idosoId;
                                    return (
                                        <button
                                            key={r._id}
                                            className={classNames(
                                                "w-full text-left px-3 py-2 hover:bg-blue-50",
                                                selected && "bg-blue-100"
                                            )}
                                            onClick={() => {
                                                setIdosoId(r._id);
                                                setIdosoBusca(`${r.nome} (${r._id.slice(-6)})`);
                                                setComboboxOpen(false);
                                            }}
                                        >
                                            <div className="font-medium">{r.nome}</div>
                                            <div className="text-xs text-gray-500">{r._id}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {idosoSelecionado && (
                        <p className="mt-1 text-xs text-gray-500">
                            Selecionado: <span className="font-semibold">{idosoSelecionado.nome}</span>
                        </p>
                    )}
                </div>

                {/* Galeria */}
                <section className="col-span-full mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg md:text-xl font-bold">Últimas {PAGE_LIMIT} fotos</h2>
                        <div className="text-sm text-gray-500">
                            {fotos.length} registro{fotos.length === 1 ? "" : "s"}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="animate-pulse aspect-square rounded-2xl bg-gray-200" />
                            ))}
                        </div>
                    ) : fotos.length === 0 ? (
                        <div className="text-gray-500 text-sm">Nenhuma foto encontrada.</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {fotos.map((f) => {
                                const residente = residentes.find((r) => r._id === f.idosoId);
                                return (
                                    <figure
                                        key={f._id}
                                        className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
                                    >
                                        <img
                                            src={f.url}
                                            alt={f.legenda || `Foto do residente ${residente?.nome || f.idosoId}`}
                                            className="aspect-square w-full object-cover"
                                            loading="lazy"
                                        />
                                        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent text-white p-2 text-xs">
                                            <div className="font-semibold truncate">{residente?.nome || f.idosoId}</div>
                                            <div className="opacity-90">{f.legenda || "—"}</div>
                                            <div className="opacity-80">{format(new Date(f.createdAt), "dd/MM/yyyy HH:mm")}</div>
                                        </figcaption>
                                    </figure>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Modal de Edição/Upload */}
                <ModalPadrao isOpen={uploadModalOpen} onClose={closeUploadModal}>
                    <div className="space-y-4">
                        {!previewURL ? (
                            <div className="text-sm text-gray-500">Selecione uma imagem para continuar.</div>
                        ) : (
                            <>
                                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100">
                                    {/* @ts-ignore */}
                                    <Cropper
                                        image={previewURL}
                                        crop={crop}
                                        zoom={zoom}
                                        rotation={rotation}
                                        aspect={1}
                                        onCropChange={setCrop}
                                        onZoomChange={setZoom}
                                        onRotationChange={setRotation}
                                        onCropComplete={onCropComplete}
                                        restrictPosition
                                        showGrid={false}
                                    />
                                </div>

                                {/* Controles */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <div className="text-xs font-semibold mb-1">Zoom</div>
                                        <input
                                            type="range"
                                            min={1}
                                            max={3}
                                            step={0.01}
                                            value={zoom}
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <div className="text-xs font-semibold mb-1">Rotação</div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min={-180}
                                                max={180}
                                                step={1}
                                                value={rotation}
                                                onChange={(e) => setRotation(Number(e.target.value))}
                                                className="w-full"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setRotation(0)}
                                                className="p-2 rounded-lg bg-white border hover:bg-gray-50"
                                                title="Resetar rotação"
                                            >
                                                <FaUndo />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <label className="text-xs font-semibold mb-1 block">Legenda (opcional)</label>
                                        <input
                                            value={legenda}
                                            onChange={(e) => setLegenda(e.target.value)}
                                            placeholder="Ex.: Passeio no jardim"
                                            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Rodapé */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs text-gray-500">
                                        {idosoSelecionado ? (
                                            <>
                                                Enviando para: <span className="font-semibold">{idosoSelecionado.nome}</span>
                                            </>
                                        ) : (
                                            <span className="text-red-600 font-semibold">Selecione um residente</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button_M3 label="Cancelar" onClick={closeUploadModal} className="gap-2" />
                                        <Button_M3 label="Enviar" onClick={doUpload} className="gap-2" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ModalPadrao>
            </PortalBase>
        </PermissionWrapper>
    );
};

export default FotosServicosPage;
