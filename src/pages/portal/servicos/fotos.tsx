import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import PermissionWrapper from "@/components/PermissionWrapper";
import PortalBase from "@/components/Portal/PortalBase";
import ModalPadrao from "@/components/ModalPadrao";
import { Residentes_GET_getAllActive } from "@/actions/Residentes";
import { notifyError, notifySuccess } from "@/utils/Functions";
import { FaCamera, FaCloudUploadAlt, FaImage, FaSearch, FaTimes, FaUndo, FaSync } from "react-icons/fa";
import { format, set } from "date-fns";
import Button_M3 from "@/components/Formularios/Button_M3";
import { GetServerSideProps } from "next";
import { isMobileUA } from "@/utils/device";
import { useIsMobile } from "@/hooks/useIsMobile";
import TextInputM2 from "@/components/Formularios/TextInputM2";
import ComboBox from "@/components/UI/ComboBox";
import { Fotos_GET_latest } from "@/services/fotos.service";
import { Fotos_POST_upload } from "@/services/fotos.svc";

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
    url: string | null;
    legenda?: string;
    createdAt: string;
};

interface FormsData {
    users_id: string[] | null;
    idosos_id: string[] | null;
    collection: string;
    createdBy: string;
    isPublic: boolean;
    folder: string;
}

const PAGE_LIMIT = 10;

const INITIAL_FORMSDATA: FormsData = {
    collection: '',
    createdBy: '',
    folder: '',
    idosos_id: null,
    users_id: null,
    isPublic: false,
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const ua = String(req.headers["user-agent"] || "");
    return { props: { initialIsMobile: isMobileUA(ua) } };
};

const FotosServicosPage = ({ initialIsMobile }: { initialIsMobile: boolean }) => {
    // --- Estado base
    const [residentes, setResidentes] = useState<Residente[]>([]);
    const [fotos, setFotos] = useState<FotoItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // --- Busca/combobox de idoso
    const [idosoBusca, setIdosoBusca] = useState<string>("");
    const [idosoId, setIdosoId] = useState<string | null>(null);
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

    const isMobile = useIsMobile(initialIsMobile); // reativo e sem mismatch

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const [idoso, setIdoso] = useState<Residente | null>(null); // para o combobox

    const [FormsData, setFormsData] = useState<FormsData>(INITIAL_FORMSDATA)

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
                const arr = await Fotos_GET_latest(PAGE_LIMIT);
                setFotos(Array.isArray(arr) ? arr : []);
            } catch {
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
                canvas.toBlob((blob) => resolve(blob as Blob), "image/jpeg", 0.80);
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

    function getCreatedByFallback() {
        try {
            const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            if (raw) {
                const u = JSON.parse(raw);
                return String(u?.id || u?.email || u?.name || "guest");
            }
        } catch { }
        return "guest";
    }

    const doUpload = async () => {
        try {
            if (!previewURL || !croppedAreaPixels) return notifyError("Ajuste o recorte antes de enviar.");
            if (!idosoId) return notifyError("Selecione o residente.");

            const croppedBlob = await getCroppedImg(previewURL, croppedAreaPixels, rotation);

            const createdBy = getCreatedByFallback();
            const originalName = (rawFile?.name || "foto") + ".jpg";

            const fd = new FormData();
            fd.append("file", new File([croppedBlob], originalName, { type: "image/jpeg" }));

            // ---- campos OBRIGATÓRIOS do seu Express ----
            fd.append("createdBy", createdBy);
            fd.append("originalName", originalName);
            fd.append("collection", "fotos");
            fd.append("userId", idosoId);    // folder no MongoDB = userId → residente
            fd.append("resource", "fotos");

            // ---- opcionais práticos ----
            fd.append("isPublic", "true");  // render direto por CDN (se tiver)
            if (legenda) fd.append("tags", legenda);
            fd.append("idosoId", idosoId);  // útil para o service montar FotoItem de retorno
            fd.append("legenda", legenda || "");

            // chama o backend externo (service)
            const foto = await Fotos_POST_upload(fd);

            notifySuccess("Foto enviada com sucesso!");
            setFotos((curr) => [foto, ...curr].slice(0, PAGE_LIMIT));
            closeUploadModal();
        } catch (e: any) {
            notifyError(e?.message || "Não foi possível enviar a foto.");
        }
    };

    const selecionado = useMemo(
        () => residentes.find((r) => r._id === idosoId) ?? null,
        [residentes, idosoId]
    );

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

                <ComboBox
                    className="col-span-full"
                    label="Residente"
                    placeholder="Digite nome ou ID do residente"
                    options={residentes}
                    value={selecionado}
                    onChange={(opt) => setIdosoId(opt?._id ?? null)}
                    // como renderizamos o subtítulo de cada opção (linha menor)
                    getOptionSubtitle={(opt) => opt._id}
                // opcional: se quiser customizar o filtro
                // filter={(opt, q) => /* ... */}
                // opcional: desabilitar/clear
                // disabled={false}
                // clearable
                />

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
                                            src={f.url ?? undefined}
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
                                <div className="relative w-full max-h-[65vh] aspect-square rounded-2xl overflow-hidden bg-gray-100">
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
                                        <InputRange min={1} max={3} step={0.01} value={zoom} onChange={setZoom} />
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <div className="text-xs font-semibold mb-1">Rotação</div>
                                        <div className="flex items-center gap-2">
                                            <InputRange min={-180} max={180} step={1} value={rotation} onChange={setRotation} />
                                            <button type="button" onClick={() => setRotation(0)} className="p-2 rounded-lg bg-white border hover:bg-gray-50" title="Resetar rotação">
                                                <FaUndo />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <TextInputM2 name="legenda" label="Legenda (opcional)" value={legenda} onChange={(e) => setLegenda(e.target.value)} />
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <ComboBox
                                            label="Residente"
                                            value={idoso}
                                            onChange={(opt) => {
                                                setIdoso(opt);
                                                setIdosoId(opt?._id || "");
                                                setIdosoBusca(opt ? `${opt.nome} (${opt._id.slice(-6)})` : "");
                                            }}
                                            options={residentes}
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


// Componente de input range reutilizável
interface InputRangeProps {
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (value: number) => void;
}

const InputRange = ({ min, max, step, value, onChange }: InputRangeProps) => {
    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
        />
    );
};
