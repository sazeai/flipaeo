import React from 'react';

interface CornerDotProps {
    className?: string;
}

/**
 * A reusable design token for the 'crosshair' grid aesthetic.
 * Large 20px white dot with rounded edges, positioned absolutely.
 */
export const CornerDot: React.FC<CornerDotProps> = ({ className = "" }) => (
    <div className={`absolute w-5 h-5 bg-white border border-stone-200 rounded-md z-50 ${className}`} />
);
