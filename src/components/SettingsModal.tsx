import React, { useState } from 'react';
import { X, Ban, Sliders, HardDrive, KeyRound, Star } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { BlacklistManager } from './BlacklistManager';
import { FavoriteTagsManager } from './FavoriteTagsManager';
import { CloudBackup } from './CloudBackup';
import { updateSettings } from '../api/client';
import { useToastStore } from '../store/useToastStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'favorites' | 'blacklist' | 'preferences' | 'backup' | 'accounts';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  const { settings, setFullSettings } = useSettingsStore();
  const { showToast } = useToastStore();

  const [e6Username, setE6Username] = useState(settings?.credentials?.e621?.username || '');
  const [e6ApiKey, setE6ApiKey] = useState(settings?.credentials?.e621?.apiKey || '');
  const [danUsername, setDanUsername] = useState(settings?.credentials?.danbooru?.username || '');
  const [danApiKey, setDanApiKey] = useState(settings?.credentials?.danbooru?.apiKey || '');

  const [customServerUrl, setCustomServerUrl] = useState(settings?.preferences?.customServerUrl || '');

  if (!isOpen) return null;

  const handleSaveAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateSettings({
        credentials: {
          e621: { username: e6Username, apiKey: e6ApiKey },
          danbooru: { username: danUsername, apiKey: danApiKey },
        },
        preferences: {
          ...(settings?.preferences || {} as any),
          customServerUrl: customServerUrl.trim() || undefined,
        },
      });
      setFullSettings(updated);
      showToast({ text: 'Settings & connection saved!', duration: 3000 });
    } catch (err) {
      showToast({ text: 'Failed to save settings', duration: 4000 });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className="w-full max-w-xl bg-[#101828] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
        role="dialog"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>⚙️</span>
            <span>Settings & Feed Controls</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-zinc-900/50 px-3 pt-2 space-x-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Star size={15} className={activeTab === 'favorites' ? 'fill-amber-400' : ''} />
            <span>⭐ Favorite Tags</span>
          </button>

          <button
            onClick={() => setActiveTab('blacklist')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'blacklist'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Ban size={15} />
            <span>Blacklist Manager</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders size={15} />
            <span>Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HardDrive size={15} />
            <span>Cloud Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <KeyRound size={15} />
            <span>Accounts & API</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollable-area">
          {activeTab === 'favorites' && <FavoriteTagsManager />}

          {activeTab === 'blacklist' && <BlacklistManager />}

          {activeTab === 'preferences' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-xl space-y-3">
                <h4 className="font-bold text-white">Default Media Settings</h4>
                <div className="space-y-2 text-zinc-300">
                  <p>• <strong>Default Port:</strong> 8765 (accessible on LAN)</p>
                  <p>• <strong>Video Autoplay:</strong> Enabled with policy recovery</p>
                  <p>• <strong>Loop Videos:</strong> Infinite loop enabled</p>
                  <p>• <strong>Feed Preloading:</strong> Automatically preloads next 2 media items for zero stutter</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && <CloudBackup />}

          {activeTab === 'accounts' && (
            <form onSubmit={handleSaveAccounts} className="space-y-4">
              {/* e621 */}
              <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-yellow-400">🐾 e621 Account Credentials (Optional)</h4>
                <p className="text-xs text-zinc-400">
                  Provide your username and API key for higher rate limits and account privileges.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={e6Username}
                    onChange={e => setE6Username(e.target.value)}
                    placeholder="e621 Username"
                    className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                  />
                  <input
                    type="password"
                    value={e6ApiKey}
                    onChange={e => setE6ApiKey(e.target.value)}
                    placeholder="e621 API Key"
                    className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Danbooru */}
              <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-pink-400">🌸 Danbooru Account Credentials (Optional)</h4>
                <p className="text-xs text-zinc-400">
                  Provide your Danbooru username and API key for higher search limits.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={danUsername}
                    onChange={e => setDanUsername(e.target.value)}
                    placeholder="Danbooru Username"
                    className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                  />
                  <input
                    type="password"
                    value={danApiKey}
                    onChange={e => setDanApiKey(e.target.value)}
                    placeholder="Danbooru API Key"
                    className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Custom Server Host */}
              <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-blue-400">🌐 Backend Connection Mode</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                    {customServerUrl ? 'Custom Host' : 'Direct Mobile Mode'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  By default, the app connects directly to Booru APIs on your phone. You can also specify your PC's IP (<code className="text-zinc-300 font-mono">http://192.168.x.x:8765</code>) to use your computer's server over Wi-Fi.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customServerUrl}
                    onChange={e => setCustomServerUrl(e.target.value)}
                    placeholder="Leave empty for Direct Mode (e.g. http://192.168.1.15:8765)"
                    className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 font-mono"
                  />
                  {customServerUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomServerUrl('')}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg font-medium transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow active:scale-95 transition-all"
                >
                  Save Settings & Keys
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
