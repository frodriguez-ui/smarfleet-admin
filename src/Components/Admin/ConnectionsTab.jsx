import React from 'react';
import { Link as LinkIcon, Search, MapPin, CheckCircle, Clock, AlertTriangle, ShieldCheck, Eye, Flag } from 'lucide-react';
import { Pagination } from './Pagination';

export const ConnectionsTab = ({ connsFilter, setConnsFilter, filteredConns, pagedConns, pageConns, setPageConns, ITEMS_PER_PAGE, setViewingConnection, safeDateStr, reports = [], allPublications = [] }) => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <LinkIcon size={18} className="text-purple-600"/> Tracking y Resolución de Disputas
            <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full">{filteredConns.length}</span>
        </h3>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                    type="text" 
                    placeholder="Buscar empresa, ciudad o ID..." 
                    className="w-full sm:w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500 transition-colors"
                    value={connsFilter.search}
                    onChange={e => setConnsFilter({...connsFilter, search: e.target.value})}
                />
            </div>
            <select 
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-purple-500"
                value={connsFilter.status}
                onChange={e => setConnsFilter({...connsFilter, status: e.target.value})}
            >
                <option value="all">Cualquier Estatus</option>
                <option value="reported">🚩 CON REPORTES</option>
                <option value="disputed">⚠️ EN DISPUTA</option>
                <option value="pending">Solicitud Pendiente</option>
                <option value="accepted">Aceptada / En Contacto</option>
                <option value="confirmed">Viaje Confirmado</option>
                <option value="completed">Completado</option>
                <option value="terminated">Cancelado</option>
            </select>
        </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100">
                    <tr>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participantes</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus / Pago</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Disputa / Detalles</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {pagedConns.length > 0 ? pagedConns.map(conn => {
                        const isDisputed = conn.isDisputed === true || conn.tripStatus === 'disputed';
                        const connReports = reports.filter(r => r.context === `Tracking Viaje: ${conn.id}`);
                        const hasReports = connReports.length > 0;
                        
                        const post = allPublications.find(p => p.id === conn.postId);
                        let displayId = conn.id.substring(0,8).toUpperCase();
                        if (post) {
                            displayId = post.customId || `${post.type === 'load' ? 'CP' : (post.isFixedRoute ? 'RE' : 'VP')}-${post.id.substring(0,6).toUpperCase()}`;
                        }
                        
                        return (
                        <tr key={conn.id} className={`transition-colors ${isDisputed ? 'bg-red-50/30' : hasReports ? 'bg-orange-50/20' : 'hover:bg-slate-50/50'}`}>
                            <td className="p-5">
                                <p className="text-xs font-bold text-blue-600 mb-1.5 flex items-center gap-1.5"><MapPin size={12}/> De: <span className="text-slate-800">{conn.fromName}</span></p>
                                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle size={12}/> Para: <span className="text-slate-800">{conn.toName}</span></p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="text-[9px] text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm font-bold">ID: {displayId}</span>
                                <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100"><Clock size={10}/> {safeDateStr(conn.createdAt)}</span>
                                </div>
                            </td>
                            <td className="p-5">
                                {isDisputed ? (
                                    <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-red-100 text-red-700 border-red-200 flex items-center gap-1 w-max">
                                        <AlertTriangle size={12}/> EN DISPUTA
                                    </span>
                                ) : (
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${conn.tripStatus === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-200' : conn.tripStatus === 'terminated' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                    {conn.tripStatus ? conn.tripStatus.toUpperCase() : (conn.status === 'accepted' ? 'ACEPTADA' : 'PENDIENTE')}
                                    </span>
                                )}
                                {conn.paymentStatus === 'funded' && <p className="text-[9px] font-black text-indigo-600 mt-2 flex items-center gap-1"><ShieldCheck size={10}/> PAGO SEGURO RETENIDO</p>}
                            </td>
                            <td className="p-5">
                                {isDisputed ? (
                                    <div className="text-xs mb-2">
                                        <p className="font-bold text-red-800 mb-1">Disputa: <span className="font-medium text-red-600">{conn.disputeDetails?.reason || 'No especificado'}</span></p>
                                        <p className="text-[9px] text-red-500">Abierta por: {conn.disputeDetails?.openedByName || 'Usuario'}</p>
                                    </div>
                                ) : (
                                    !hasReports && <span className="text-xs font-medium text-slate-400 block mb-2">Sin incidencias</span>
                                )}

                                {hasReports && (
                                    <div className={`text-xs ${isDisputed ? 'border-t border-red-100 pt-2 mt-2' : ''}`}>
                                        <p className="font-bold text-orange-700 flex items-center gap-1 mb-1.5"><Flag size={12}/> Reportes ({connReports.length})</p>
                                        <div className="space-y-1.5 max-w-[200px]">
                                            {connReports.slice(0, 2).map(rep => (
                                                <div key={rep.id} className="text-[9px] text-orange-700 bg-orange-50 border border-orange-100 p-1.5 rounded" title={rep.details}>
                                                    <span className="font-black block truncate">{rep.reportedName}</span>
                                                    <span className="truncate block opacity-80">{rep.reason}</span>
                                                </div>
                                            ))}
                                            {connReports.length > 2 && <p className="text-[9px] text-orange-500 font-bold">+ {connReports.length - 2} reporte(s) más</p>}
                                        </div>
                                    </div>
                                )}
                            </td>
                            <td className="p-5 text-right">
                                <div className="flex flex-col gap-2 w-max ml-auto">
                                <button onClick={() => setViewingConnection(conn)} className="px-4 py-2 border text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50">
                                    <Eye size={14}/> Ver Detalles y Chat
                                </button>
                                </div>
                            </td>
                        </tr>
                        );
                    }) : (
                    <tr>
                        <td colSpan="4" className="p-10 text-center text-slate-500 font-medium">No hay conexiones que coincidan con la búsqueda.</td>
                    </tr>
                    )}
                </tbody>
            </table>
        </div>
        <Pagination currentPage={pageConns} totalItems={filteredConns.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPageConns} />
    </div>
);