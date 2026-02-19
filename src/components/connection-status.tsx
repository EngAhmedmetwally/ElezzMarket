
'use client';
import { useConnectionStatus } from '@/firebase';
import { Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from './language-provider';

export function ConnectionStatus() {
    const status = useConnectionStatus();
    const { language } = useLanguage();

    const statusInfo = {
        connected: {
            label: language === 'ar' ? 'متصل' : 'Connected',
            Icon: Wifi,
            color: 'text-green-500',
        },
        disconnected: {
            label: language === 'ar' ? 'غير متصل' : 'Disconnected',
            Icon: WifiOff,
            color: 'text-red-500',
        },
        loading: {
            label: language === 'ar' ? 'جاري التحقق...' : 'Checking...',
            Icon: Wifi,
            color: 'text-muted-foreground animate-pulse',
        },
    };

    const current = statusInfo[status];

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center justify-center h-10 w-10">
                    <current.Icon className={`h-5 w-5 ${current.color}`} />
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{current.label}</p>
            </TooltipContent>
        </Tooltip>
    );
}
