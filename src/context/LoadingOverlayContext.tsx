// src/context/LoadingOverlayContext.tsx

import LoadingSpinner from '@/components/LoadingSpinner';
import React, { createContext, useContext, useState } from 'react';

type LoadingContextType = {
    isLoading: boolean;
    showLoading: () => void;
    hideLoading: () => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingOverlayProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);

    const showLoading = () => setIsLoading(true);
    const hideLoading = () => setIsLoading(false);

    return (
        <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
            {isLoading && <LoadingSpinner />}
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoadingOverlay = (): LoadingContextType => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoadingOverlay deve ser usado dentro de LoadingOverlayProvider');
    }
    return context;
};
