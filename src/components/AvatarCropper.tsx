'use client'
import { getCroppedImg } from '@/utils/cropImage'
import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { BsCamera } from 'react-icons/bs'

type Props = {
    onImageCropped: (imgUrl: string) => void
    defaultImage?: string
    size?: number
}

const AvatarCropper = ({ onImageCropped, defaultImage, size = 24 }: Props) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [preview, setPreview] = useState<string | null>(defaultImage || null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => setImageSrc(reader.result as string)
        reader.readAsDataURL(file)
    }

    const onCropComplete = useCallback((_: any, cropped: any) => {
        setCroppedAreaPixels(cropped)
    }, [])

    const cropImage = async () => {
        if (!imageSrc || !croppedAreaPixels) return
        const cropped = await getCroppedImg(imageSrc, croppedAreaPixels)
        setPreview(cropped)
        setImageSrc(null)
        onImageCropped(cropped)
    }

    return (
        <div className="relative">
            <img
                src={preview || '/avatar.jpg'}
                alt="Avatar"
                className={`w-${size} h-${size} rounded-full object-cover border-4 border-white shadow-md`}
            />
            <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer">
                <BsCamera size={20} />
            </label>
            <input id="avatar-upload" type="file" className="hidden" onChange={handleFileChange} />

            {imageSrc && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 w-full max-w-md">
                        <div className="relative w-full h-64 bg-gray-200">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                        <div className="flex justify-between mt-4">
                            <button onClick={() => setImageSrc(null)} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
                            <button onClick={cropImage} className="px-4 py-2 bg-blue-600 text-white rounded">Recortar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AvatarCropper
