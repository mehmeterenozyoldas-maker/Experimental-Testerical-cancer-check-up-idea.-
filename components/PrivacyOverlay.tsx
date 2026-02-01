import React from 'react';
import { Shield, EyeOff, Cpu, X } from 'lucide-react';

interface PrivacyOverlayProps {
  onClose: () => void;
}

export const PrivacyOverlay: React.FC<PrivacyOverlayProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-teal-500/10 rounded-full">
            <Shield className="text-teal-400" size={32} />
          </div>
          <h2 className="text-2xl font-semibold text-white">Your Safe Space</h2>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <Cpu className="text-slate-400 shrink-0" size={24} />
            <div>
              <h3 className="text-slate-200 font-medium mb-1">Local Processing</h3>
              <p className="text-slate-400 text-sm">Everything happens right here on your device. No video or personal data is ever sent to a server.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <EyeOff className="text-slate-400 shrink-0" size={24} />
            <div>
              <h3 className="text-slate-200 font-medium mb-1">No Recording</h3>
              <p className="text-slate-400 text-sm">We do not take photos or record video. The camera is strictly used for real-time motion guidance if enabled.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
            <p className="text-slate-300 text-sm">
              <span className="font-bold text-teal-400">Note:</span> This application is educational. It helps you build a habit of self-checks but cannot replace a professional medical examination.
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-8 w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold py-3 rounded-xl transition-colors"
        >
          I Understand
        </button>
      </div>
    </div>
  );
};