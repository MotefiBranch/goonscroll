import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Cloud, CloudRain, RefreshCw, Check, Key, ExternalLink } from 'lucide-react';
import { exportBackupJson, importBackupJson, getGitHubSyncStatus, syncToGitHubGist, pullFromGitHubGist } from '../api/client';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useToastStore } from '../store/useToastStore';

export const CloudBackup: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [customToken, setCustomToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [lastSyncUrl, setLastSyncUrl] = useState<string | null>(null);

  const { setFullSettings, initSettings } = useSettingsStore();
  const { initFavorites } = useFavoritesStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    getGitHubSyncStatus().then(status => {
      setHasToken(status.configured);
    }).catch(() => {});
  }, []);

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

  const handleGitHubSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncToGitHubGist(customToken || undefined);
      if (res.success) {
        setLastSyncUrl(res.url);
        showToast({ text: '☁️ Synced blacklists & favorites to your private GitHub repository!', duration: 4000 });
      }
    } catch (err: any) {
      showToast({ text: `Sync failed: ${err.message}`, duration: 5000 });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGitHubPull = async () => {
    setIsPulling(true);
    try {
      const res = await pullFromGitHubGist(customToken || undefined);
      if (res.success && res.result?.settings) {
        setFullSettings(res.result.settings);
        await initFavorites();
        showToast({ text: '⬇️ Successfully pulled and restored latest backup from GitHub!', duration: 4000 });
      }
    } catch (err: any) {
      showToast({ text: `Pull failed: ${err.message}`, duration: 5000 });
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* 1. GitHub Cloud Sync */}
      <div className="p-4 bg-zinc-900/90 border border-purple-500/30 rounded-xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-purple-300 flex items-center space-x-2">
            <Cloud size={17} />
            <span>GitHub Cloud Sync (Cross-Device)</span>
          </h3>
          {hasToken ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center space-x-1">
              <Check size={10} />
              <span>Token Connected</span>
            </span>
          ) : (
            <button
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="text-[11px] text-purple-400 hover:text-purple-300 underline flex items-center space-x-1"
            >
              <Key size={11} />
              <span>{showTokenInput ? 'Hide Token' : 'Add Token'}</span>
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Sync all your favorite tags, blacklists, and saved posts between your PC and Android Termux instance via your private GitHub repository.
        </p>

        {(!hasToken || showTokenInput) && (
          <div className="pt-1">
            <input
              type="password"
              value={customToken}
              onChange={e => setCustomToken(e.target.value)}
              placeholder="Paste GitHub Personal Access Token (or keep in .env)..."
              className="w-full bg-zinc-950 border border-purple-500/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-purple-500 font-mono"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* Push to GitHub */}
          <button
            onClick={handleGitHubSync}
            disabled={isSyncing}
            className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 shadow"
          >
            <Cloud size={15} className={isSyncing ? 'animate-bounce' : ''} />
            <span>{isSyncing ? 'Uploading to GitHub...' : '☁️ Sync to GitHub'}</span>
          </button>

          {/* Pull from GitHub */}
          <button
            onClick={handleGitHubPull}
            disabled={isPulling}
            className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-purple-200 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 border border-purple-500/30"
          >
            <RefreshCw size={15} className={isPulling ? 'animate-spin' : ''} />
            <span>{isPulling ? 'Pulling from GitHub...' : '⬇️ Pull & Restore from GitHub'}</span>
          </button>
        </div>

        {lastSyncUrl && (
          <div className="pt-1 text-[11px] text-zinc-400 flex items-center space-x-1">
            <span>Last Gist Backup:</span>
            <a
              href={lastSyncUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline flex items-center space-x-0.5"
            >
              <span>View on GitHub</span>
              <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>

      {/* 2. Offline JSON Backup */}
      <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <span>📁</span>
          <span>Manual Offline File Backup</span>
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Export your configuration to a standalone `.json` file for offline manual transfer.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {/* Download Backup */}
          <button
            onClick={handleExport}
            className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all active:scale-95 border border-white/10"
          >
            <Download size={14} />
            <span>Export Backup (.json)</span>
          </button>

          {/* Restore Backup */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all active:scale-95 border border-white/10"
          >
            <Upload size={14} />
            <span>{isImporting ? 'Restoring...' : 'Import from File'}</span>
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
