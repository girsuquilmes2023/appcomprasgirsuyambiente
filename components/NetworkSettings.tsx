import React, { useState } from 'react';
import { NetworkConfig, User } from '../types';
import { Settings, Globe, Database, RefreshCw, Save, ShieldCheck, AlertTriangle, CheckCircle2, Link, Download, Upload } from 'lucide-react';

interface NetworkSettingsProps {
  config: NetworkConfig;
  user: User;
  onUpdateConfig: (config: NetworkConfig) => void;
  onSyncNow: () => Promise<void>;
  isSyncing: boolean;
  onExportData: () => void;
  onRestoreData: (data: any) => void;
}

export const NetworkSettings: React.FC<NetworkSettingsProps> = ({ 
  config, user, onUpdateConfig, onSyncNow, isSyncing, onExportData, onRestoreData
}) => {
  const [url, setUrl] = useState(config.googleSheetUrl);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

  const handleSave = () => {
    onUpdateConfig({
      ...config,
      googleSheetUrl: url,
      autoSync: autoSync,
      isConnected: !!url
    });
    setMessage({ text: 'CONFIGURACIÓN GUARDADA EXITOSAMENTE', type: 'success' });
    setTimeout(() => setMessage({ text: '', type: null }), 3000);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (window.confirm("¿Está seguro de restaurar este backup? Se sobrescribirán los datos actuales.")) {
          onRestoreData(data);
          setMessage({ text: 'DATOS RESTAURADOS EXITOSAMENTE', type: 'success' });
        }
      } catch (err) {
        setMessage({ text: 'ERROR AL LEER EL ARCHIVO DE BACKUP', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center space-y-6 animate-fade-in">
        <div className="bg-red-50 p-6 rounded-[3rem] text-red-500 shadow-xl shadow-red-100/50 border border-red-100">
          <ShieldCheck size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Acceso Restringido</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Solo el personal con rango ADMINISTRADOR puede gestionar la red</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Configuración de Red</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Gestión de Nube y Sincronización de Datos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-soft space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-indigo-50 rounded-2xl text-[#6a4782]"><Database size={24}/></div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Google Sheets Cloud</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Base de Datos Principal en la Nube</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">URL de Google Apps Script</label>
                <div className="relative">
                  <Link className="absolute left-5 top-5 text-slate-300" size={18}/>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-4 text-xs font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                    placeholder="https://script.google.com/macros/s/..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                  />
                </div>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest ml-1 mt-2">Asegúrese de que el script esté publicado como 'Cualquier persona'</p>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight italic">Sincronización Automática</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Guardar cambios al instante en la nube</p>
                </div>
                <button 
                  onClick={() => setAutoSync(!autoSync)}
                  className={`w-14 h-8 rounded-full p-1 transition-all ${autoSync ? 'bg-[#21b524]' : 'bg-slate-200'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${autoSync ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {message.text && (
              <div className={`p-4 rounded-2xl text-[9px] font-black text-center uppercase tracking-widest animate-pulse ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button 
                onClick={handleSave}
                className="flex-1 bg-[#6a4782] text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic flex items-center justify-center gap-3"
              >
                <Save size={18}/> Guardar Configuración
              </button>
              <button 
                onClick={onSyncNow}
                disabled={isSyncing || !config.googleSheetUrl}
                className="px-10 py-6 border border-slate-100 text-slate-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all italic disabled:opacity-50 flex items-center gap-3"
              >
                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''}/> {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl border-b-8 border-[#21b524]">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-[#21b524]/20 rounded-2xl text-[#21b524]"><ShieldCheck size={24}/></div>
              <h3 className="text-sm font-black uppercase tracking-tight italic">Estado de Red</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conexión Cloud</span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${config.isConnected ? 'text-[#21b524]' : 'text-red-400'}`}>
                  {config.isConnected ? 'ACTIVA' : 'DESCONECTADA'}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Último Sync</span>
                <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest tabular-nums">
                  {config.lastSync ? new Date(config.lastSync).toLocaleTimeString() : 'NUNCA'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle size={20}/>
              <h4 className="text-[10px] font-black uppercase tracking-widest">Seguridad de Datos</h4>
            </div>
            <p className="text-[9px] font-bold text-amber-800 uppercase italic leading-relaxed mb-6">
              Los datos se sincronizan con Google Sheets. Para mayor seguridad, descargue un respaldo local periódicamente.
            </p>
            <button 
              onClick={onExportData}
              className="w-full py-4 bg-white border border-amber-200 text-amber-600 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-amber-100 transition-all italic flex items-center justify-center gap-2 mb-2"
            >
              <Download size={14}/> Exportar Backup Local
            </button>
            <label className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-50 transition-all italic flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={14}/> Restaurar Backup
              <input type="file" className="hidden" accept=".json" onChange={handleRestore} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
