import React from 'react';
import { Users, Search, Shield, Ban, AlertTriangle, Eye, Edit, Trash2, Calendar, MapPin, Flag } from 'lucide-react';
import { Pagination } from './Pagination';

export const UsersTab = ({ usersFilter, setUsersFilter, filteredUsers, pagedUsers, pageUsers, setPageUsers, ITEMS_PER_PAGE, setViewingUser, setEditingUser, handleDeleteUser, safeDateStr }) => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-blue-600"/> Directorio de Usuarios 
                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">{filteredUsers.length}</span>
            </h3>
            
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 flex-wrap justify-end">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Buscar por email, empresa..." 
                        className="w-full sm:w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors"
                        value={usersFilter.search}
                        onChange={e => setUsersFilter({...usersFilter, search: e.target.value})}
                    />
                </div>
                
                {/* NUEVO FILTRO DE CONDUCTA */}
                <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-rose-500"
                    value={usersFilter.warnings}
                    onChange={e => setUsersFilter({...usersFilter, warnings: e.target.value})}
                >
                    <option value="all">Conducta: Todas</option>
                    <option value="problematic">🚩 Problemáticos (1+ amonest.)</option>
                    <option value="critical">🚨 Riesgo Ban (3+ amonest.)</option>
                </select>

                <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-500"
                    value={usersFilter.status}
                    onChange={e => setUsersFilter({...usersFilter, status: e.target.value})}
                >
                    <option value="all">Estado: Todos</option>
                    <option value="active">Activos</option>
                    <option value="suspended">Suspendidos</option>
                </select>
                <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-500"
                    value={usersFilter.role}
                    onChange={e => setUsersFilter({...usersFilter, role: e.target.value})}
                >
                    <option value="all">Rol: Todos</option>
                    <option value="carrier">Transportistas</option>
                    <option value="shipper">Generadores</option>
                </select>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100">
                    <tr>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa y Conducta</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol / Zona</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registro / Plan</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {pagedUsers.length > 0 ? pagedUsers.map(u => {
                        const expDate = u.subscriptionEndsAt?.seconds ? new Date(u.subscriptionEndsAt.seconds * 1000).toLocaleDateString() : (u.currentPeriodEnd?.seconds ? new Date(u.currentPeriodEnd.seconds * 1000).toLocaleDateString() : 'Auto');
                        const warnings = u.warningsCount || 0;

                        return (
                        <tr key={u.id} className={`transition-colors ${u.isSuspended ? 'bg-rose-50/30' : warnings >= 3 ? 'bg-red-50/50' : 'hover:bg-slate-50/50'}`}>
                            <td className="p-5">
                                <div className="flex items-center gap-2">
                                    {u.isAdmin && <Shield size={14} className="text-blue-500" title="Administrador"/>}
                                    <p className={`font-bold ${u.isSuspended ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{u.businessName || 'Sin nombre'}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 mb-2">
                                    <p className="text-xs text-slate-500 font-medium">{u.email || u.id}</p>
                                    {u.isSuspended && <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-1"><Ban size={8}/> Suspendido</span>}
                                </div>

                                {/* MEDALLA DE AMONESTACIONES */}
                                {warnings > 0 && (
                                    <div className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-max border ${warnings >= 3 ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                        <AlertTriangle size={10}/> Amonestaciones: {warnings}/3 {warnings >= 3 && '(Banneo Sugerido)'}
                                    </div>
                                )}
                            </td>
                            <td className="p-5">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${u.role === 'carrier' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'} ${u.isSuspended ? 'opacity-50' : ''}`}>
                                    {u.role === 'carrier' ? 'Transportista' : 'Generador'}
                                </span>
                                <div className={`mt-2 text-[10px] text-slate-500 font-medium flex items-start gap-1.5 ${u.isSuspended ? 'opacity-50' : ''}`}>
                                    <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5"/>
                                    <span className="truncate max-w-[140px]" title={u.operatingStates?.join(', ') || u.operatingPoints?.map(p => p.state).join(', ') || 'No especificada'}>
                                        {u.operatingStates?.join(', ') || u.operatingPoints?.map(p => p.state).join(', ') || 'No especificada'}
                                    </span>
                                </div>
                            </td>
                            <td className="p-5">
                                <div className={`mb-2 text-[10px] font-bold text-slate-500 flex items-center gap-1.5 ${u.isSuspended ? 'opacity-50' : ''}`}>
                                    <Calendar size={12} className="text-blue-500"/> Ingreso: {u.createdAt ? safeDateStr(u.createdAt) : 'N/A'}
                                </div>
                                {u.tier === 'premium' ? (
                                    <div className="flex flex-col gap-1.5">
                                        <span className={`flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-lg w-max ${u.isSuspended ? 'opacity-50' : ''}`}><AlertTriangle size={12}/> Premium</span>
                                        <span className={`text-[9px] font-bold text-slate-400 uppercase tracking-widest ${u.isSuspended ? 'opacity-50' : ''}`}>Vence: {expDate}</span>
                                    </div>
                                ) : (
                                    <span className={`text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg w-max ${u.isSuspended ? 'opacity-50' : ''}`}>Free</span>
                                )}
                            </td>
                            <td className="p-5 text-right flex items-center justify-end gap-2">
                                <button onClick={() => setViewingUser(u)} title="Detalles" className={`p-2 border text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center ${u.isSuspended ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50' : 'bg-white border-slate-200 text-slate-700 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50'}`}>
                                    <Eye size={16}/>
                                </button>
                                <button onClick={() => setEditingUser(u)} title="Editar (Suspender)" className={`p-2 border text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center ${u.isSuspended || warnings >= 3 ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-300 ring-2 ring-rose-500/20' : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50'}`}>
                                    <Edit size={16}/>
                                </button>
                                <button onClick={() => handleDeleteUser(u)} title="Eliminar Perfil Falso" className="p-2 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center bg-white text-rose-500 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50">
                                    <Trash2 size={16}/>
                                </button>
                            </td>
                        </tr>
                        );
                    }) : (
                        <tr>
                            <td colSpan="4" className="p-10 text-center text-slate-500 font-medium">No se encontraron usuarios con esos filtros.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        <Pagination currentPage={pageUsers} totalItems={filteredUsers.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPageUsers} />
    </div>
);