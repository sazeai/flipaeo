import React from 'react';
import { AlertTriangle, Terminal, WifiOff, Disc, Activity } from 'lucide-react';

interface ErrorGraphicProps {
    mode?: 'error' | 'offline' | 'maintenance' | '404';
    errorCode?: string;
    className?: string;
}

export const ErrorGraphic: React.FC<ErrorGraphicProps> = ({ mode = 'error', errorCode = '500', className }) => {
    const isOffline = mode === 'offline';

    return (
        <div className={`w-full max-w-sm mx-auto bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col relative ${className}`}>
            {/* Header */}
            <div className="h-10 border-b-2 border-black bg-gray-50 flex items-center justify-between px-4">
                <span className="font-mono text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {isOffline ? 'NET_DIAGNOSTICS.exe' : 'SYSTEM_CRASH.log'}
                </span>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-black"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-black"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-8 flex flex-col items-center gap-6 relative overflow-hidden bg-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>

                {/* Icon Container */}
                <div className="relative z-10 w-24 h-24 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-neo">
                    {isOffline ? (
                        <WifiOff className="w-10 h-10 text-black animate-pulse" />
                    ) : (
                        <AlertTriangle className="w-10 h-10 text-red-500 animate-bounce" />
                    )}

                    {/* Decorative Elements around Icon */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-bold border border-white rounded-full">
                        !
                    </div>
                </div>

                {/* Error Code / Status */}
                <div className="relative z-10 text-center">
                    <div className="inline-block px-3 py-1 bg-red-100 border border-black text-red-700 font-mono text-xs font-bold mb-2 uppercase">
                        {isOffline ? 'CONNECTION_LOST' : `ERR_CODE: ${errorCode}`}
                    </div>
                    <div className="font-display font-black text-4xl uppercase">
                        {isOffline ? 'Offline' : 'Error'}
                    </div>
                </div>

                {/* Terminal Output */}
                <div className="w-full bg-black text-green-400 font-mono text-[10px] p-3 rounded border-2 border-gray-800 relative z-10 opacity-90">
                    <div className="flex items-center gap-2 mb-1 border-b border-gray-800 pb-1">
                        <Terminal className="w-3 h-3" />
                        <span>console_output</span>
                    </div>
                    <div className="space-y-1">
                        <div>&gt; Initiating diagnostics...</div>
                        {isOffline ? (
                            <>
                                <div className="text-red-400">&gt; Ping failed: Destination unreachable</div>
                                <div>&gt; Retrying connection (attempt 1)...</div>
                            </>
                        ) : (
                            <>
                                <div className="text-red-400">&gt; Runtime exception detected</div>
                                <div>&gt; Generating crash report... done.</div>
                            </>
                        )}
                        <div className="animate-pulse">&gt; _</div>
                    </div>
                </div>

            </div>

            {/* Footer Strip */}
            <div className="h-2 bg-stripes-gray border-t-2 border-black"></div>
        </div>
    );
};
