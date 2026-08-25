import React, { useRef, useState } from 'react';
import { Download, Upload, Check, AlertCircle } from 'lucide-react';
import { exportBackupJson, importBackupJson } from '../api/client';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useToastStore } from '../store/useToastStore';

export const CloudBackup: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { setFullSettings, initSettings } = useSettingsStore();
  const { initFavorites } = useFavoritesStore();
  const { showToast } = useToastStore();

  const handleExport = () => {
    exportBackupJson();
    showToast({ text: 'Downloading GoonScroll backup...', duration: 3000 });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      const result = await importBackupJson(backupData);

      if (result.success && result.result?.settings) {
        setFullSettings(result.result.settings);
        await initFavorites();
        showToast({ text: 'Backup restored successfully!', duration: 4000 });
      }
    } catch (err: any) {
      console.error('Failed to import backup:', err);
      showToast({ text: `Failed to restore backup: ${err.message}`, duration: 5000 });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 select-none">
      <div className="p-4 bg-zinc-900/80 border border-white/10 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <span>📦</span>
          <span>Server Backup & Cloud Sync</span>
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Export your blacklists, saved favorites, and preferences to a portable JSON backup. You can import this file on your phone, PC, or any instance running on Termux.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          {/* Download Backup */}
          <button
            onClick={handleExport}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 shadow"
          >
            <Download size={16} />
            <span>Download Backup (.json)</span>
          </button>

          {/* Restore Backup */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 border border-white/10"
          >
            <Upload size={16} />
            <span>{isImporting ? 'Restoring...' : 'Restore from File'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
