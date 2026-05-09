import React from 'react';
import { Megaphone, Send, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const NotificationsTab = ({ notifForm, setNotifForm, handleSendGlobalNotification, sendingNotif, users }) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                <Megaphone size={160} className="absolute -right-8 -bottom-10 text-slate-50 pointer-events-none"/>
                <div className="relative z-10">
                    <h3 className="font-black text-2xl text-slate-800 mb-2">Centro de Difusión</h3>
                    <p className="text-slate-500 text-sm mb-8">Envía un aviso oficial que aparecerá en el panel de notificaciones de todos los usuarios activos.</p>

                    <form onSubmit={handleSendGlobalNotification} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Tipo de Alerta</label>
                            <select 
                                value={notifForm.type} 
                                onChange={e => setNotifForm({...notifForm, type: e.target.value})} 
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="info">ℹ️ Aviso Informativo</option>
                                <option value="warning">⚠️ Mantenimiento o Alerta</option>
                                <option value="success">🎉 Promoción / Novedad</option>
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Título del Mensaje</label>
                            <input 
                                required 
                                type="text" 
                                placeholder="Ej. Actualización del Sistema v2.0" 
                                value={notifForm.title} 
                                onChange={e => setNotifForm({...notifForm, title: e.target.value})} 
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" 
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Contenido Detallado</label>
                            <textarea 
                                required 
                                rows="5" 
                                placeholder="Escribe aquí el detalle completo para los usuarios..." 
                                value={notifForm.message} 
                                onChange={e => setNotifForm({...notifForm, message: e.target.value})} 
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
                            ></textarea>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={sendingNotif || users.filter(u => !u.isSuspended).length === 0} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm py-4 px-8 rounded-xl shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {sendingNotif ? (
                                <>Enviando... por favor espera</>
                            ) : (
                                <><Send size={18}/> Enviar a {users.filter(u => !u.isSuspended).length} usuarios activos</>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="bg-slate-100 p-8 rounded-3xl border border-slate-200 flex-1 flex flex-col justify-center items-center relative shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 absolute top-6 left-1/2 -translate-x-1/2">
                        Vista Previa del Usuario
                    </p>
                    
                    <div className={`w-full max-w-sm p-5 rounded-2xl shadow-md border flex items-start gap-4 transition-all duration-300 ${
                        notifForm.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' : 
                        notifForm.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 
                        'bg-blue-50 border-blue-200 text-blue-900'
                    }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            notifForm.type === 'warning' ? 'bg-amber-200 text-amber-700' : 
                            notifForm.type === 'success' ? 'bg-emerald-200 text-emerald-700' : 
                            'bg-blue-200 text-blue-700'
                        }`}>
                            {notifForm.type === 'warning' ? <AlertTriangle size={20}/> : 
                            notifForm.type === 'success' ? <CheckCircle size={20}/> : 
                            <Info size={20}/>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <h4 className="font-black text-sm leading-tight">{notifForm.title || 'Título del Mensaje'}</h4>
                                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1"></span>
                            </div>
                            <p className="text-xs mt-2 opacity-80 leading-relaxed font-medium">
                                {notifForm.message || 'El contenido de tu anuncio aparecerá aquí y podrá ser leído por todos los usuarios en su centro de notificaciones personal.'}
                            </p>
                            <p className="text-[9px] font-bold opacity-50 mt-3 uppercase tracking-widest">
                                Smarfleet Admin • Ahora
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);