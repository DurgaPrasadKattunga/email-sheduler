import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
};
