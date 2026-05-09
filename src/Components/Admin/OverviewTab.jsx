import React from 'react';
import { Users, Truck, Package, Link as LinkIcon, Ban, Leaf, Activity, TrendingUp } from 'lucide-react';

export const OverviewTab = ({ stats, users, trips, loads, connections, trendMonthsRange, setTrendMonthsRange }) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Users size={24}/></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Usuarios</p>
                <p className="text-4xl font-black text-slate-800 mt-1">{users.length}</p>
                {stats.suspended > 0 && <p className="text-[10px] font-bold text-rose-500 mt-2 flex items-center gap-1 bg-rose-50 w-fit px-2 py-1 rounded"><Ban size={10}/> {stats.suspended} Suspendidos</p>}
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4"><Truck size={24}/></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Viajes Publicados</p>
                <p className="text-4xl font-black text-slate-800 mt-1">{trips.length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><Package size={24}/></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cargas Disponibles</p>
                <p className="text-4xl font-black text-slate-800 mt-1">{loads.length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4"><LinkIcon size={24}/></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Interacciones</p>
                <p className="text-4xl font-black text-slate-800 mt-1">{connections.length}</p>
            </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-3xl shadow-lg shadow-emerald-600/20 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <Leaf size={200} className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none transform rotate-12"/>
            <div className="relative z-10 w-full md:w-1/3">
                <h3 className="text-sm font-black text-emerald-100 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Activity size={18}/> Impacto Real Sostenible
                </h3>
                <p className="text-sm text-emerald-50 font-medium leading-relaxed">
                    Al conectar transportistas vacíos con cargas compatibles, Smarfleet reduce la emisión de gases de efecto invernadero en el sector logístico de México.
                </p>
                <span className="inline-block mt-4 text-[10px] font-bold text-emerald-200 bg-emerald-800/50 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    Basado en {stats.completedMatchesCount} viajes completados.
                </span>
            </div>
            
            <div className="grid grid-cols-2 gap-6 relative z-10 w-full md:w-2/3 border-t md:border-t-0 md:border-l border-emerald-500/30 pt-6 md:pt-0 md:pl-8">
                <div>
                    <p className="text-5xl lg:text-6xl font-black tracking-tighter">{stats.totalKmSaved.toLocaleString()}</p>
                    <p className="text-sm font-bold text-emerald-200 mt-2 uppercase tracking-wide">Km. Vacíos Evitados</p>
                </div>
                <div>
                    <p className="text-5xl lg:text-6xl font-black tracking-tighter">{stats.totalCo2SavedTons}</p>
                    <p className="text-sm font-bold text-emerald-200 mt-2 uppercase tracking-wide">Toneladas CO₂ Mitigadas</p>
                </div>
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 relative z-10">
                <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-blue-600"/> Rendimiento y Tracción de Plataforma
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Análisis de crecimiento de cuentas y volumen de publicaciones.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <button onClick={() => setTrendMonthsRange(3)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${trendMonthsRange === 3 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>3 Meses</button>
                    <button onClick={() => setTrendMonthsRange(6)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${trendMonthsRange === 6 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>6 Meses</button>
                    <button onClick={() => setTrendMonthsRange(12)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${trendMonthsRange === 12 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>1 Año</button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={14}/> Nuevas Cuentas (Mensual)</h4>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></div> Transportistas</span>
                            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div> Generadores</span>
                        </div>
                    </div>
                    
                    <div className="h-56 w-full flex items-end gap-2 md:gap-4 relative">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                            <div className="border-b border-dashed border-slate-200 w-full h-0 relative"><span className="absolute -left-6 -top-2.5 text-[9px] text-slate-400">{stats.maxUsersCategory}</span></div>
                            <div className="border-b border-dashed border-slate-200 w-full h-0 relative"><span className="absolute -left-6 -top-2.5 text-[9px] text-slate-400">{Math.round(stats.maxUsersCategory/2)}</span></div>
                            <div className="border-b border-slate-200 w-full h-0 relative"><span className="absolute -left-6 -top-2.5 text-[9px] text-slate-400">0</span></div>
                        </div>

                        <div className="absolute inset-0 flex items-end gap-2 md:gap-4 ml-2 pb-8">
                            {stats.trendsData.map((data, idx) => (
                                <div key={idx} className="flex-1 flex items-end justify-center gap-1 h-full relative group">
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-2 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-xl">
                                        {data.label}: {data.totalNewUsers} Usuarios
                                        <div className="text-[9px] font-normal text-slate-300 mt-1">{data.newCarriers} Transp. / {data.newShippers} Generadores</div>
                                    </div>
                                    <div className="w-1/2 bg-indigo-500 rounded-t-md hover:bg-indigo-400 transition-all duration-500" style={{ height: `${(data.newCarriers / stats.maxUsersCategory) * 100}%`, minHeight: data.newCarriers > 0 ? '4px' : '0' }}></div>
                                    <div className="w-1/2 bg-emerald-500 rounded-t-md hover:bg-emerald-400 transition-all duration-500" style={{ height: `${(data.newShippers / stats.maxUsersCategory) * 100}%`, minHeight: data.newShippers > 0 ? '4px' : '0' }}></div>
                                    <span className="absolute -bottom-6 text-[9px] font-black text-slate-500 tracking-wider w-full text-center truncate">{data.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Package size={14}/> Nuevo Inventario (Mensual)</h4>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div> Viajes</span>
                            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-amber-500"></div> Cargas</span>
                        </div>
                    </div>
                    
                    <div className="h-56 w-full flex items-end gap-2 md:gap-4 relative">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                            <div className="border-b border-dashed border-slate-200 w-full h-0 relative"><span className="absolute -left-6 -top-2.5 text-[9px] text-slate-400">{stats.maxPubsCategory}</span></div>
                            <div className="border-b border-dashed border-slate-200 w-full h-0 relative"><span className="absolute -left-6 -top-2.5 text-[9px] text-slate-400">{Math.round(stats.maxPubsCategory/2)}</span></div>
                            <div className="border-b border-slate-200 w-full h-0 relative"><span className="absolute -left-6 -top-2.5 text-[9px] text-slate-400">0</span></div>
                        </div>

                        <div className="absolute inset-0 flex items-end gap-2 md:gap-4 ml-2 pb-8">
                            {stats.trendsData.map((data, idx) => (
                                <div key={idx} className="flex-1 flex items-end justify-center gap-1 h-full relative group">
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-2 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-xl">
                                        {data.label}: {data.totalNewPubs} Publicaciones
                                        <div className="text-[9px] font-normal text-slate-300 mt-1">{data.newTrips} Viajes / {data.newLoads} Cargas</div>
                                    </div>
                                    <div className="w-1/2 bg-blue-500 rounded-t-md hover:bg-blue-400 transition-all duration-500" style={{ height: `${(data.newTrips / stats.maxPubsCategory) * 100}%`, minHeight: data.newTrips > 0 ? '4px' : '0' }}></div>
                                    <div className="w-1/2 bg-amber-500 rounded-t-md hover:bg-amber-400 transition-all duration-500" style={{ height: `${(data.newLoads / stats.maxPubsCategory) * 100}%`, minHeight: data.newLoads > 0 ? '4px' : '0' }}></div>
                                    <span className="absolute -bottom-6 text-[9px] font-black text-slate-500 tracking-wider w-full text-center truncate">{data.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
);