
import Button_M3 from "@/components/Formularios/Button_M3";
import { Card_M1 } from "@/components/Formularios/Card";
import { useLoadingOverlay } from "@/context/LoadingOverlayContext";
import { notifyError, notifySuccess } from "@/utils/Functions";
import React, { useState } from "react";
import { FaUserShield } from "react-icons/fa";

interface Props {
    userId: string;
}

const AbrirPortao = ({ userId }: Props) => {

    const { showLoading, hideLoading } = useLoadingOverlay();

    async function handleAbrir() {
        showLoading();
        const res = await fetch("/api/DO/portaoMQTT", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, ms: 300 }),
        });
        const data = await res.json();
        hideLoading();
        if (res.ok) {
            notifySuccess("Portão aberto com sucesso!");
        } else {
            notifyError("Erro ao abrir o portão.");
        }
    }


    return (
        <div className="">
            <Button_M3 label="Abrir Portão" onClick={handleAbrir} />
        </div>
    );
};

export default AbrirPortao;
