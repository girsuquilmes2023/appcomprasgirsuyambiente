import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Lock, User as UserIcon, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const DEFAULT_USERS = [
  { username: 'admin', password: 'ambiente2026', name: 'Administrador', role: 'ADMIN' as UserRole },
  { username: 'visor', password: 'ambiente2026', name: 'Solo Consulta', role: 'VIEWER' as UserRole },
];

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('pini_users_db', JSON.stringify(DEFAULT_USERS));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const usersStr = localStorage.getItem('pini_users_db');
    const users = usersStr ? JSON.parse(usersStr) : DEFAULT_USERS;
    const matchedUser = users.find((u: any) => u.username === username.toLowerCase() && u.password === password);
    
    if (matchedUser) {
        onLogin({ 
          id: Math.random().toString(36).substr(2, 9), 
          username: matchedUser.username, 
          name: matchedUser.name, 
          role: matchedUser.role 
        });
    } else {
        setError('CREDENCIALES INVÁLIDAS - CONSULTE AL ADMINISTRADOR');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden font-sans italic">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6a4782]/5 rounded-full blur-[120px] opacity-60"></div>
      
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 md:p-12 shadow-soft border border-slate-100 relative z-10 animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex p-6 bg-[#6a4782] rounded-3xl mb-6 shadow-xl shadow-indigo-50">
            <ShieldCheck className="text-white" size={36} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">Portal Seguro</h1>
          <p className="text-[9px] font-black text-[#21b524] uppercase mt-3 tracking-[0.4em] italic">Ambiente y GIRSU - Quilmes</p>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-8 flex items-center gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={18}/>
            <p className="text-[9px] font-black text-amber-800 uppercase tracking-wider italic leading-relaxed">Sesiones restablecidas. Ingrese con su nueva clave autorizada.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Usuario</label>
            <div className="relative">
              <UserIcon className="absolute left-5 top-5 text-slate-300" size={18}/>
              <input 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-4 text-slate-900 font-bold uppercase text-sm outline-none focus:border-[#6a4782] focus:bg-white transition-all italic" 
                placeholder="USUARIO" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nueva Clave</label>
            <div className="relative">
              <Lock className="absolute left-5 top-5 text-slate-300" size={18}/>
              <input 
                type="password" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-4 text-slate-900 font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          {error && <div className="text-red-600 text-[10px] font-black text-center uppercase italic">{error}</div>}

          <button type="submit" className="w-full bg-[#6a4782] text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-black transition-all italic">Validar Ingreso <ArrowRight className="inline ml-2" size={18}/></button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-200">PINI SECURITY PROTOCOL ®</p>
        </div>
      </div>
    </div>
  );
};
