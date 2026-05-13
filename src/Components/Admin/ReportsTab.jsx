import React from 'react';
import { Flag, Search, User as UserIcon, AlertTriangle, CheckCircle, XCircle, Activity, ExternalLink, MessageCircle, ChevronLeft } from 'lucide-react';

export const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col items-center gap-3 p-6 bg-white border-t border-slate-100">
            <div className="flex items-center gap-1.5">
                <button 
                    disabled={currentPage === 1} 
                    onClick={() => onPageChange(currentPage - 1)} 
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors text-slate-600 shadow-sm"
                >
                    <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                            <button 
                                key={pageNum} 
                                onClick={() => onPageChange(pageNum)} 
                                className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>
                <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => onPageChange(currentPage + 1)} 
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors text-slate-600 shadow-sm rotate-180"
                >
                    <ChevronLeft size={16} />
                </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                Página {currentPage} de {totalPages} ({totalItems} resultados)
            </p>
        </div>
    );
};

export const ReportsTab = ({ reportsFilter, setReportsFilter, filteredReports, pagedReports, pageReports, setPageReports, ITEMS_PER_PAGE, safeDateStr, handleIssueWarning, processingWarning, users = [], setViewingUser, connections = [], setViewingConnection }) => {
    
    // Función auxiliar para ver el perfil de un usuario
    const openProfile = (uid) => {
        const u = users.find(x => x.id === uid);
        if (u && setViewingUser) setViewingUser(u);
        else alert("El usuario ya no existe o fue eliminado.");
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Flag size={18} className="text-rose-600"/> Reportes y Moderación
                    <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full">{filteredReports.length}</span>
                </h3>

                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o motivo..." 
                            className="w-full sm:w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500 transition-colors"
                            value={reportsFilter.search}
                            onChange={e => setReportsFilter({...reportsFilter, search: e.target.value})}
                        />
                    </div>
                    <select 
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-rose-500"
                        value={reportsFilter.status}
                        onChange={e => setReportsFilter({...reportsFilter, status: e.target.value})}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendientes de Revisión</option>
                        <option value="resolved_warning">Amonestados</option>
                        <option value="dismissed">Descartados</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white border-b border-slate-100">
                        <tr>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Involucrados</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle del Reporte</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estatus</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones de Moderación</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pagedReports.length > 0 ? pagedReports.map(rep => {
                            const isPending = rep.status === 'pending';
                            const reportedUser = users.find(u => u.id === rep.reportedUid) || {};
                            const warnings = reportedUser.warningsCount || 0;

                            // =======================================================
                            // ALGORITMO DE EXTRACCIÓN Y FORZADO DEL CHAT
                            // =======================================================
                            let extractedChatId = '';
                            let relatedConn = null;

                            // 1. Extraer el ID exacto del texto del reporte
                            if (rep.context && typeof rep.context === 'string') {
                                if (rep.context.includes(':')) {
                                    // Ej: "Chat Connection: 8JIR7UUW" -> extrae "8JIR7UUW"
                                    extractedChatId = rep.context.split(':').pop().trim();
                                } else {
                                    extractedChatId = rep.context.trim();
                                }
                            }

                            // 2. Buscamos en la memoria local cruzando los IDs cortos
                            if (connections && connections.length > 0 && extractedChatId) {
                                // Limpiamos la cadena de caracteres basura
                                const searchId = extractedChatId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                
                                if (searchId) {
                                    relatedConn = connections.find(c => {
                                        const cId = c.id.toUpperCase();
                                        const pId = (c.postId || '').toUpperCase();
                                        
                                        // Evaluamos si la conexión de Firebase (cId) INICIA con el ID de 8 caracteres (searchId)
                                        // Esto es vital porque los chats apenas iniciados usan el connection.id
                                        return cId === searchId || 
                                               cId.startsWith(searchId) || 
                                               pId === searchId || 
                                               pId.startsWith(searchId) ||
                                               (rep.context && rep.context.toUpperCase().includes(cId));
                                    });
                                }
                            }

                            // 3. EL TRUCO DEFINITIVO: Si el chat sigue sin aparecer, creamos
                            // un objeto comodín COMPLETAMENTE POBLADO. Esto forzará al modal a 
                            // abrirse y consultar directamente a Firebase sin colapsar la pantalla.
                            if (!relatedConn && extractedChatId) {
                                relatedConn = {
                                    id: extractedChatId,
                                    postId: extractedChatId,
                                    fromUid: rep.reporterUid,
                                    fromName: rep.reporterName,
                                    toUid: rep.reportedUid,
                                    toName: rep.reportedName,
                                    participants: [rep.reporterUid, rep.reportedUid], // Campo vital para evitar crashes
                                    status: 'accepted',
                                    tripStatus: 'contact_only',
                                    timeline: {},
                                    isDummy: true 
                                };
                            }

                            return (
                                <tr key={rep.id} className={`transition-colors ${isPending ? 'bg-orange-50/20 hover:bg-orange-50/40' : 'hover:bg-slate-50/50'}`}>
                                    <td className="p-5">
                                        <div className="mb-3">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Denunciado:</span>
                                            <button onClick={() => openProfile(rep.reportedUid)} className="font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 transition-colors">
                                                <UserIcon size={14}/> {rep.reportedName}
                                            </button>
                                            {warnings > 0 && (
                                                <span className={`text-[9px] mt-1 font-bold px-1.5 py-0.5 rounded flex items-center gap-1 w-max ${warnings >= 3 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-orange-100 text-orange-700'}`}>
                                                    <AlertTriangle size={10}/> Ya tiene {warnings}/3 Amonestaciones
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Reportado por:</span>
                                            <button onClick={() => openProfile(rep.reporterUid)} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors text-xs">
                                                <UserIcon size={12}/> {rep.reporterName}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="mb-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Motivo:</span>
                                            <p className="font-bold text-slate-800 text-sm">{rep.reason}</p>
                                        </div>
                                        {rep.details && (
                                            <div className="mb-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Comentarios Adicionales:</span>
                                                <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">"{rep.details}"</p>
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-col gap-2 mt-3">
                                            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                                                <ExternalLink size={12}/> Contexto: <span className="bg-slate-100 px-1.5 rounded text-slate-600 font-mono font-bold">{rep.context || 'Sin contexto'}</span>
                                            </div>
                                            
                                            {/* =======================================================
                                                BOTÓN DE AUDITORÍA DIRECTO (FORZADO AL ID)
                                            ======================================================= */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (relatedConn) setViewingConnection(relatedConn);
                                                }}
                                                disabled={!relatedConn}
                                                className={`flex items-center justify-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-xl transition-colors shadow-sm w-fit ${
                                                    relatedConn 
                                                    ? 'text-white bg-blue-600 border border-blue-700 hover:bg-blue-700 shadow-blue-500/20 active:scale-95' 
                                                    : 'text-slate-400 bg-slate-50 border border-slate-200 cursor-not-allowed'
                                                }`}
                                            >
                                                <MessageCircle size={14}/> 
                                                {relatedConn && !relatedConn.isDummy ? `Auditar Chat (${extractedChatId.substring(0,8)})` : relatedConn && relatedConn.isDummy ? `Forzar Búsqueda (${extractedChatId.substring(0,8)})` : 'Sin ID de Chat'}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                            {isPending ? (
                                                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-orange-200">
                                                    <Activity size={12} className="animate-spin-slow"/> Pendiente
                                                </span>
                                            ) : rep.status === 'resolved_warning' ? (
                                                <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-rose-200">
                                                    <AlertTriangle size={12}/> Amonestado
                                                </span>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-slate-200">
                                                    <CheckCircle size={12}/> Descartado
                                                </span>
                                            )}
                                            <span className="text-[9px] text-slate-400 font-bold">{safeDateStr(rep.createdAt)}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        {isPending ? (
                                            <div className="flex flex-col items-end gap-2 w-full max-w-[160px] ml-auto">
                                                <button 
                                                    onClick={() => handleIssueWarning(rep.id, rep.reportedUid, 'warn')} 
                                                    disabled={processingWarning}
                                                    className="w-full px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md shadow-rose-500/20 disabled:opacity-50 flex justify-center items-center gap-1.5"
                                                >
                                                    <AlertTriangle size={14}/> Emitir Amonestación
                                                </button>
                                                <button 
                                                    onClick={() => handleIssueWarning(rep.id, rep.reportedUid, 'dismiss')} 
                                                    disabled={processingWarning}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 flex justify-center items-center gap-1.5"
                                                >
                                                    <XCircle size={14}/> Descartar Falso
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                                                Resuelto por Administrador
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="4" className="p-10 text-center text-slate-500 font-medium">No se encontraron reportes con estos filtros. ¡Todo está en orden!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={pageReports} totalItems={filteredReports.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPageReports} />
        </div>
    );
};