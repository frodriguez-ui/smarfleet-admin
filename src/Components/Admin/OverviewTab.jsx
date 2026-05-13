import React from 'react';
import { Users, Truck, Package, Link as LinkIcon, Ban, Leaf, Activity, TrendingUp, ShieldCheck, DollarSign, AlertTriangle, Flag } from 'lucide-react';

export const OverviewTab = ({ stats, users, trips, loads, connections, trendPeriod, setTrendPeriod }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Primera Fila: KPIs Básicos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Users size={12}/> Usuarios</p>
                    <p className="text-3xl font-black text-slate-800 relative z-10">{users.length}</p>
                    {stats.suspended > 0 && <p className="text-[9px] font-bold text-rose-500 mt-2 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 w-fit"><Ban size={10}/> {stats.suspended} Suspendidos</p>}
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Truck size={12}/> Viajes Pub.</p>
                    <p className="text-3xl font-black text-slate-800">{trips.length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Package size={12}/> Cargas Disp.</p>
                    <p className="text-3xl font-black text-slate-800">{loads.length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><LinkIcon size={12}/> Conexiones</p>
                    <p className="text-3xl font-black text-slate-800">{connections.length}</p>
                </div>
            </div>

            {/* Segunda Fila: Finanzas y Moderación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-200 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><DollarSign size={14}/> Transacciones (Pago Seguro)</p>
                    <p className="text-3xl md:text-4xl font-black text-indigo-700 tracking-tight">${stats.totalEscrowVolume.toLocaleString('en-MX')}</p>
                    <p className="text-[10px] text-indigo-600 font-medium mt-1.5">Monto en MXN de viajes exitosos.</p>
                </div>
                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><AlertTriangle size={14}/> Disputas Activas</p>
                    <p className="text-3xl md:text-4xl font-black text-rose-700 tracking-tight">{stats.activeDisputes}</p>
                    <p className="text-[10px] text-rose-600 font-medium mt-1.5">Viajes con fondos congelados.</p>
                </div>
                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-200 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Flag size={14}/> Reportes Pendientes</p>
                    <p className="text-3xl md:text-4xl font-black text-orange-700 tracking-tight">{stats.pendingReportsCount}</p>
                    <p className="text-[10px] text-orange-600 font-medium mt-1.5">Usuarios reportados por revisar.</p>
                </div>
            </div>

            {/* Tercera Fila: Sostenibilidad Ambiental */}
            <div className="bg-emerald-50 border border-emerald-200 p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-sm font-black text-emerald-800 flex items-center gap-2"><Leaf size={16}/> Impacto Ambiental (Sostenibilidad)</h3>
                    <p className="text-xs text-emerald-600 font-medium mt-1.5 max-w-md leading-relaxed">Kilómetros vacíos evitados y huella de carbono reducida gracias a la red de Match Inteligente de Smarfleet.</p>
                </div>
                <div className="flex gap-6 shrink-0 w-full md:w-auto border-t border-emerald-200 pt-4 md:border-0 md:pt-0">
                    <div className="text-center md:text-right flex-1">
                        <p className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tight">{stats.totalKmSaved.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Km Ahorrados</p>
                    </div>
                    <div className="w-px bg-emerald-200 hidden md:block"></div>
                    <div className="text-center md:text-right flex-1">
                        <p className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tight">{stats.totalCo2SavedTons}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Ton CO₂ Evitado</p>
                    </div>
                </div>
            </div>

            {/* Cuarta Fila: Gráficas de Rendimiento */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2"><TrendingUp size={16} className="text-blue-500"/> Rendimiento de Plataforma</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Crecimiento de usuarios y publicaciones.</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
                        <button onClick={() => setTrendPeriod('4w')} className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${trendPeriod === '4w' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>4 Sem</button>
                        <button onClick={() => setTrendPeriod('12w')} className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${trendPeriod === '12w' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>12 Sem</button>
                        <button onClick={() => setTrendPeriod('6m')} className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${trendPeriod === '6m' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>6 Meses</button>
                        <button onClick={() => setTrendPeriod('12m')} className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${trendPeriod === '12m' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>1 Año</button>
                    </div>
                </div>

                <div className="h-64 w-full flex items-end gap-2 md:gap-4 relative pt-6">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                        <div className="border-b border-dashed border-slate-200 w-full h-0"><span className="absolute -left-2 -top-2.5 text-[9px] font-bold text-slate-400 bg-white px-1">{Math.max(stats.maxUsersCategory, stats.maxPubsCategory, 1)}</span></div>
                        <div className="border-b border-dashed border-slate-200 w-full h-0"><span className="absolute -left-2 -top-2.5 text-[9px] font-bold text-slate-400 bg-white px-1">{Math.round(Math.max(stats.maxUsersCategory, stats.maxPubsCategory, 1)/2)}</span></div>
                        <div className="border-b-2 border-slate-200 w-full h-0"><span className="absolute -left-2 -top-2.5 text-[9px] font-bold text-slate-400 bg-white px-1">0</span></div>
                    </div>

                    <div className="absolute inset-0 flex items-end gap-2 md:gap-4 ml-6 pb-6">
                        {stats.trendsData.map((data, idx) => {
                            const maxScale = Math.max(stats.maxUsersCategory, stats.maxPubsCategory, 1);
                            return (
                            <div key={idx} className="flex-1 flex items-end justify-center gap-1 h-full relative group">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-2 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-lg">
                                    <span className="block text-center mb-1 text-slate-300">{data.label}</span>
                                    <div className="flex gap-2">
                                        <span className="text-blue-300">{data.totalNewUsers} Usuarios</span>
                                        <span className="text-emerald-300">{data.totalNewPubs} Pubs.</span>
                                    </div>
                                </div>
                                <div className="w-1/2 bg-blue-500 rounded-t-md transition-all duration-500 hover:brightness-110" style={{ height: `${(data.totalNewUsers / maxScale) * 100}%`, minHeight: data.totalNewUsers > 0 ? '4px' : '0' }}></div>
                                <div className="w-1/2 bg-emerald-500 rounded-t-md transition-all duration-500 hover:brightness-110" style={{ height: `${(data.totalNewPubs / maxScale) * 100}%`, minHeight: data.totalNewPubs > 0 ? '4px' : '0' }}></div>
                                <span className="absolute -bottom-6 text-[9px] font-black text-slate-400 uppercase tracking-widest w-full text-center truncate">{data.label}</span>
                            </div>
                        )})}
                    </div>
                </div>
            </div>

        </div>
    );
};