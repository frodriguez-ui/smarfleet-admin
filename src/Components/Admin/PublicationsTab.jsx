import React from 'react';
import { Package, Search, MapPin, Calendar, Clock, Trash2, ArrowRight, Zap } from 'lucide-react';
import { Pagination } from './Pagination';

export const PublicationsTab = ({ pubsFilter, setPubsFilter, filteredPubs, pagedPubs, pagePubs, setPagePubs, ITEMS_PER_PAGE, handleDeletePublication, safeDateStr }) => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Package size={18} className="text-emerald-600"/> Publicaciones Globales
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full">{filteredPubs.length}</span>
            </h3>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Buscar ciudad, ID, empresa..." 
                        className="w-full sm:w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors"
                        value={pubsFilter.search}
                        onChange={e => setPubsFilter({...pubsFilter, search: e.target.value})}
                    />
                </div>
                <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-500"
                    value={pubsFilter.type}
                    onChange={e => setPubsFilter({...pubsFilter, type: e.target.value})}
                >
                    <option value="all">Tipo (Todos)</option>
                    <option value="trip">Viajes (Camiones)</option>
                    <option value="load">Cargas</option>
                </select>
                <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-500"
                    value={pubsFilter.status}
                    onChange={e => setPubsFilter({...pubsFilter, status: e.target.value})}
                >
                    <option value="all">Estado (Todos)</option>
                    <option value="active">Activas</option>
                    <option value="paused">Pausadas</option>
                    <option value="completed">Completadas</option>
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100">
                    <tr>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo / Empresa</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ruta (Origen - Destino)</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha / Estatus</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {pagedPubs.length > 0 ? pagedPubs.map(pub => (
                        <tr key={pub.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-5">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider mb-1.5 border ${pub.type === 'trip' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                    {pub.type === 'trip' ? 'Viaje' : 'Carga'}
                                </span>
                                <p className="font-bold text-slate-800 text-sm">{pub.company}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5 bg-slate-100 px-1.5 py-0.5 rounded w-max">ID: {pub.customId || pub.id.substring(0,6)}</p>
                            </td>
                            <td className="p-5">
                                <p className="font-bold text-slate-800 text-sm">{pub.originCity || pub.originState}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin size={10} className="text-slate-400"/> {pub.destinationCity || pub.destinationState}
                                </p>
                            </td>
                            <td className="p-5">
                                <p className="font-bold text-slate-800 text-xs flex items-center gap-1"><Calendar size={12} className="text-blue-500"/> {pub.date || 'Fija'}</p>
                                <p className="text-[9px] font-bold text-slate-500 flex items-center gap-1 mt-1"><Clock size={10}/> Creado: {safeDateStr(pub.createdAt)}</p>
                                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold border ${pub.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : pub.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                {pub.status === 'active' ? 'ACTIVA' : pub.status.toUpperCase()}
                                </span>
                            </td>
                            <td className="p-5 text-right">
                                <button onClick={() => handleDeletePublication(pub.id, pub.type)} className="p-2.5 bg-white border border-rose-200 text-rose-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm ml-auto" title="Borrar Publicación">
                                    <Trash2 size={16}/>
                                </button>
                            </td>
                        </tr>
                    )) : (
                    <tr>
                        <td colSpan="4" className="p-10 text-center text-slate-500 font-medium">No se encontraron publicaciones.</td>
                    </tr>
                    )}
                </tbody>
            </table>
        </div>
        <Pagination currentPage={pagePubs} totalItems={filteredPubs.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPagePubs} />
    </div>
);