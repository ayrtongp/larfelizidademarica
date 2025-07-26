import React from 'react';

export type BadgeVariant =
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';

export interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    icon?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-indigo-100 text-indigo-800',
};

export default function Badge({
    label,
    variant = 'primary',
    icon,
    onClick,
    className = '',
}: BadgeProps) {
    const baseStyles =
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm transition-all duration-150';
    const variantStyles = VARIANT_STYLES[variant];
    const clickable = onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : '';

    return (
        <span
            onClick={onClick}
            className={`${baseStyles} ${variantStyles} ${clickable} ${className}`}
        >
            {icon && <span className="mr-1 flex-shrink-0">{icon}</span>}
            {label}
        </span>
    );
}
