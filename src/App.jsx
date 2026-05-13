import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { 
  Shield, Users, User as UserIcon, Truck, Package, LogOut, 
  AlertTriangle, CheckCircle, X, MapPin, Calendar, Link as LinkIcon, Edit,
  BarChart3, Activity, Ban, Eye, FileText, Phone, Mail, ArrowRight,
  Bell, DollarSign, HeartHandshake, Clock, ShieldCheck, RotateCcw, MessageCircle, Flag, Trash2
} from 'lucide-react';

// --- IMPORTACIONES DE TUS COMPONENTES MODULARIZADOS ---
import { OverviewTab } from './Components/Admin/OverviewTab';
import { NotificationsTab } from './Components/Admin/NotificationsTab';
import { UsersTab } from './Components/Admin/UsersTab';
import { PublicationsTab } from './Components/Admin/PublicationsTab';
import { ConnectionsTab } from './Components/Admin/ConnectionsTab';
import { ReportsTab } from './Components/Admin/ReportsTab';

// --- CONFIGURACIÓN DE FIREBASE ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collectionGroup, collection, query, onSnapshot, 
  doc, getDoc, updateDoc, writeBatch, serverTimestamp, orderBy, deleteDoc, where
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'smarfleet-d7807';

// ============================================================================
// --- FUNCIONES GLOBALES DE SEGURIDAD (FECHAS Y FORMATOS) ---
// ============================================================================
const safeDateStr = (ts) => {
    if (!ts) return 'N/A';
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatMessageTime = (ts) => {
    if (!ts) return '...';
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    if (isNaN(d.getTime())) return '...';
    return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
};

// 🌟 CARGADOR NATIVO DE GOOGLE MAPS CON MANEJO DE PROMESAS 🌟
let googleMapsPromise = null;

const loadGoogleMapsScript = (apiKey) => {
    if (!apiKey) return Promise.reject(new Error("No API Key"));
    if (window.google && window.google.maps) return Promise.resolve();
    
    if (!googleMapsPromise) {
        googleMapsPromise = new Promise((resolve, reject) => {
            window.gm_authFailure = () => {
                console.error("Fallo de Autenticación de Google Maps detectado.");
                reject(new Error("auth_failure"));
            };

            const existingScript = document.getElementById('googleMapsNativeScript');
            if (existingScript) {
                existingScript.onload = resolve;
                existingScript.onerror = reject;
                return;
            }

            const script = document.createElement('script');
            script.id = 'googleMapsNativeScript';
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = (err) => reject(err);
            document.body.appendChild(script);
        });
    }
    return googleMapsPromise;
};

// ============================================================================
// --- COMPONENTES MODULARES (MODALES REDISEÑADOS Y ELEGANTES) ---
// ============================================================================

const EditUserModal = ({ user, onClose }) => {
    const [formData, setFormData] = useState({ ...user });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const userRef = doc(db, 'artifacts', projectId, 'users', user.id, 'profile', 'data');
            await updateDoc(userRef, {
                tier: formData.tier,
                businessName: formData.businessName,
                isAdmin: formData.isAdmin || false,
                isSuspended: formData.isSuspended || false 
            });
            onClose();
        } catch (e) {
            alert("Error al actualizar: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-100">
                <div className="flex justify-between items-center p-8 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Gestionar Usuario</h3>
                    <button onClick={onClose} className="p-2 bg-white hover:bg-slate-100 rounded-full transition-colors shadow-sm border border-slate-200 text-slate-500 hover:text-slate-800"><X size={18}/></button>
                </div>

                <div className="p-8 space-y-6">
                    <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors shadow-sm ${formData.isSuspended ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <div>
                            <p className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${formData.isSuspended ? 'text-rose-800' : 'text-emerald-800'}`}>
                                {formData.isSuspended ? <Ban size={14}/> : <CheckCircle size={14}/>}
                                {formData.isSuspended ? 'Cuenta Suspendida' : 'Cuenta Activa'}
                            </p>
                            <p className={`text-[10px] font-medium mt-1 ${formData.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formData.isSuspended ? 'Usuario bloqueado temporalmente.' : 'Operando con normalidad.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, isSuspended: !formData.isSuspended})}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${formData.isSuspended ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}
                        >
                            {formData.isSuspended ? 'Reactivar' : 'Suspender'}
                        </button>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Empresa</label>
                        <input 
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-800 transition-all"
                            value={formData.businessName || ''}
                            onChange={e => setFormData({...formData, businessName: e.target.value})}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Plan de Suscripción</label>
                        <select 
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-800 transition-all appearance-none cursor-pointer"
                            value={formData.tier || 'free'}
                            onChange={e => setFormData({...formData, tier: e.target.value})}
                        >
                            <option value="free">Capa Gratuita (Free)</option>
                            <option value="premium">Smarfleet Premium</option>
                        </select>
                    </div>

                    <label className="p-5 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between cursor-pointer transition-colors group">
                        <div>
                            <p className="text-xs font-black text-indigo-900 flex items-center gap-1.5"><Shield size={14} className="text-indigo-500"/> Privilegios Admin</p>
                            <p className="text-[10px] font-medium text-indigo-700/70 mt-1">Otorga acceso al panel maestro.</p>
                        </div>
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 accent-indigo-600 cursor-pointer rounded"
                                checked={formData.isAdmin || false}
                                onChange={e => setFormData({...formData, isAdmin: e.target.checked})}
                            />
                        </div>
                    </label>

                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl mt-4 transition-all disabled:opacity-50 shadow-xl shadow-slate-900/20 active:scale-[0.98]"
                    >
                        {loading ? "Actualizando..." : "Guardar Cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const UserDetailModal = ({ user, onClose, allTrips, allLoads, allConnections }) => {
    const userPubs = useMemo(() => {
        return [...allTrips, ...allLoads]
            .filter(p => p.userId === user.id)
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [allTrips, allLoads, user.id]);

    const userConns = useMemo(() => {
        return allConnections
            .filter(c => c.participants && c.participants.includes(user.id))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [allConnections, user.id]);

    const stats = {
        activePubs: userPubs.filter(p => p.status === 'active').length,
        totalPubs: userPubs.length,
        completedTrips: userConns.filter(c => c.tripStatus === 'completed').length,
        totalConns: userConns.length
    };

    const expDate = user.subscriptionEndsAt?.seconds 
        ? new Date(user.subscriptionEndsAt.seconds * 1000).toLocaleDateString() 
        : (user.currentPeriodEnd?.seconds ? new Date(user.currentPeriodEnd.seconds * 1000).toLocaleDateString() : 'Auto-renovable');

    const warnings = user.warningsCount || 0;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-slate-50 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-100/50" onClick={e => e.stopPropagation()}>
                
                {/* Cabecera Tipo Banner */}
                <div className="bg-white sticky top-0 z-20 shrink-0 shadow-sm border-b border-slate-100">
                    <div className="h-20 bg-gradient-to-r from-slate-800 to-slate-900 w-full relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full transition-colors z-30 shadow-sm">
                            <X size={18}/>
                        </button>
                    </div>
                    
                    <div className="px-8 pb-6 flex flex-col sm:flex-row gap-5 items-start sm:items-end relative -mt-10">
                        <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-slate-300 overflow-hidden shrink-0 relative z-10">
                            {user.photoData ? <img src={user.photoData} alt="Logo" className="w-full h-full object-cover" /> : <Users size={32}/>}
                        </div>
                        
                        <div className="min-w-0 flex-1 pb-1">
                            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                <h2 className="text-3xl font-black text-slate-900 leading-none tracking-tight truncate">{user.businessName || 'Usuario Sin Nombre'}</h2>
                                {user.isSuspended && <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 shadow-sm"><Ban size={12}/> Suspendido</span>}
                                {user.isAdmin && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 shadow-sm"><Shield size={12}/> Admin</span>}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs font-medium text-slate-500 mt-2">
                                <span className="flex items-center gap-1.5"><Mail size={14}/> {user.email || user.id}</span>
                                {user.phone && <span className="flex items-center gap-1.5"><Phone size={14}/> {user.phone}</span>}
                                
                                <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block"></span>
                                
                                <span className={`px-2.5 py-1 rounded-md font-black uppercase tracking-wider text-[9px] shadow-sm border ${user.role === 'carrier' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                    {user.role === 'carrier' ? 'Transportista' : 'Generador de Carga'}
                                </span>
                                <span className={`px-2.5 py-1 rounded-md font-black uppercase tracking-wider text-[9px] shadow-sm border ${user.tier === 'premium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    {user.tier === 'premium' ? `PREMIUM (Vence: ${expDate})` : 'FREE TIER'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar bg-slate-50">
                    
                    {/* Alerta de Amonestaciones */}
                    {warnings > 0 && (
                        <div className={`p-5 rounded-2xl flex items-center justify-between shadow-sm border ${warnings >= 3 ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div>
                                <h4 className={`font-black text-sm flex items-center gap-2 ${warnings >= 3 ? 'text-rose-800' : 'text-amber-800'}`}>
                                    <AlertTriangle size={18} className={warnings >= 3 ? 'animate-pulse' : ''}/> 
                                    {warnings >= 3 ? 'Alerta Máxima: Posible Banneo' : 'Historial de Amonestaciones'}
                                </h4>
                                <p className={`text-xs mt-1 font-medium ${warnings >= 3 ? 'text-rose-700' : 'text-amber-700'}`}>
                                    Este usuario tiene {warnings} de 3 amonestaciones permitidas por la comunidad.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tarjetas de Estadísticas */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3 text-blue-500"><Package size={20}/></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Activas</p>
                            <p className="text-3xl font-black text-slate-800">{stats.activePubs}</p>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3 text-indigo-500"><FileText size={20}/></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Historial Pub.</p>
                            <p className="text-3xl font-black text-slate-800">{stats.totalPubs}</p>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3 text-purple-500"><LinkIcon size={20}/></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Interacciones</p>
                            <p className="text-3xl font-black text-slate-800">{stats.totalConns}</p>
                        </div>
                        <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3 text-emerald-600"><CheckCircle size={20}/></div>
                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-0.5">Viajes Exitosos</p>
                            <p className="text-3xl font-black text-emerald-800">{stats.completedTrips}</p>
                        </div>
                    </div>

                    {/* Contenedores Duales: Publicaciones y Conexiones */}
                    <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
                        
                        {/* Historial de Publicaciones */}
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[450px]">
                            <div className="p-5 border-b border-slate-100 bg-white sticky top-0 shrink-0 z-10 flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package size={18}/></div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm">Publicaciones</h3>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Historial de mercado</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-slate-50/30">
                                {userPubs.length > 0 ? userPubs.map(pub => (
                                    <div key={pub.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-sm flex flex-col gap-3 hover:border-blue-200 transition-colors">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="font-black text-slate-800 flex items-center gap-2 truncate">
                                                {pub.originCity} <ArrowRight size={14} className="text-slate-300 shrink-0"/> {pub.destinationCity}
                                            </p>
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0 ${pub.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : pub.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                {pub.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <span className="font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">ID: {pub.customId || pub.id.substring(0,6)}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="flex items-center gap-1.5"><Calendar size={12}/> {pub.date || 'Ruta Fija'}</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Package size={32} className="mb-2 opacity-20"/>
                                        <p className="text-xs font-medium">Sin publicaciones.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Historial de Interacciones */}
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[450px]">
                            <div className="p-5 border-b border-slate-100 bg-white sticky top-0 shrink-0 z-10 flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><LinkIcon size={18}/></div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm">Interacciones</h3>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Contactos en red</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-slate-50/30">
                                {userConns.length > 0 ? userConns.map(conn => {
                                    const otherName = conn.fromUid === user.id ? conn.toName : conn.fromName;
                                    const isSender = conn.fromUid === user.id;
                                    const targetStatus = conn.tripStatus || conn.status;
                                    
                                    return (
                                    <div key={conn.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-sm flex flex-col gap-3 hover:border-purple-200 transition-colors">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Conectado con:</p>
                                                <p className="font-black text-slate-800 truncate">{otherName}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0 ${targetStatus === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : targetStatus === 'terminated' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                {targetStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <span className="flex items-center gap-1.5"><Activity size={12}/> {isSender ? 'Emisor' : 'Receptor'}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="flex items-center gap-1.5"><Calendar size={12}/> {new Date(conn.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('es-MX')}</span>
                                        </div>
                                    </div>
                                )}) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <LinkIcon size={32} className="mb-2 opacity-20"/>
                                        <p className="text-xs font-medium">Sin interacciones registradas.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ConnectionDetailModal = ({ conn, onClose, trips, loads, handleResolveDispute, resolvingDispute, users, setViewingUser }) => {
    const [messages, setMessages] = useState([]);
    const [trackingHistory, setTrackingHistory] = useState([]);
    const [connReports, setConnReports] = useState([]); 
    const [isLoadingChat, setIsLoadingChat] = useState(true);
    const [mapError, setMapError] = useState(false);
    
    const mapRef = useRef(null);
    const messagesEndRef = useRef(null); 

    const post = [...trips, ...loads].find(p => p.id === conn.postId);
    const isDisputed = conn.isDisputed === true || conn.tripStatus === 'disputed';
    const isFunded = conn.paymentStatus === 'funded';

    const fromUser = users.find(u => u.id === conn.fromUid) || { businessName: conn.fromName, id: conn.fromUid, role: 'unknown' };
    const toUser = users.find(u => u.id === conn.toUid) || { businessName: conn.toName, id: conn.toUid, role: 'unknown' };

    let carrierUser = null;
    let shipperUser = null;

    if (post?.type === 'load') {
        shipperUser = toUser;
        carrierUser = fromUser;
    } else if (post?.type === 'trip') {
        carrierUser = toUser;
        shipperUser = fromUser;
    } else {
        carrierUser = fromUser.role === 'carrier' ? fromUser : toUser;
        shipperUser = fromUser.role === 'shipper' ? fromUser : toUser;
    }

    const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

    // CARGAR CHAT Y TRACKING 
    useEffect(() => {
        setIsLoadingChat(true);

        const qMsg = collection(db, 'artifacts', projectId, 'public', 'data', 'connections', conn.id, 'messages');
        const unsubMsg = onSnapshot(qMsg, snap => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            msgs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
            setMessages(msgs);
            setIsLoadingChat(false);
        }, (err) => {
            console.error("Error cargando chat:", err);
            setIsLoadingChat(false);
        });

        const qTrack = collection(db, 'artifacts', projectId, 'public', 'data', 'connections', conn.id, 'trackingLogs');
        const unsubTrack = onSnapshot(qTrack, snap => {
            const logs = snap.docs.map(d => d.data());
            let combined = [...(conn.trackingHistory || []), ...logs];
            
            const unique = [];
            const seen = new Set();
            combined.forEach(item => {
                const lat = item.lat || item.latitude;
                const lng = item.lng || item.longitude;
                if(lat !== undefined && lng !== undefined) {
                    const key = `${lat}-${lng}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        unique.push(item);
                    }
                }
            });
            unique.sort((a,b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
            setTrackingHistory(unique);
        }, (err) => {
            console.warn("Aviso: No se cargó trackingLogs.", err);
            if (conn.trackingHistory && Array.isArray(conn.trackingHistory)) {
                setTrackingHistory(conn.trackingHistory);
            }
        });

        return () => { unsubMsg(); unsubTrack(); };
    }, [conn.id, JSON.stringify(conn.trackingHistory)]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        const qReports = query(
            collection(db, 'artifacts', projectId, 'public', 'data', 'reports'),
            where('context', '==', `Tracking Viaje: ${conn.id}`)
        );
        const unsubReports = onSnapshot(qReports, snap => {
            setConnReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => {
            console.error("Error cargando reportes:", err);
        });
        
        return () => unsubReports();
    }, [conn.id]);

    useEffect(() => {
        if (!googleApiKey || !mapRef.current) return;
        
        let isMounted = true;

        loadGoogleMapsScript(googleApiKey)
            .then(() => {
                if (!isMounted || !mapRef.current) return;
                mapRef.current.innerHTML = '';
                setMapError(false);
                
                const map = new window.google.maps.Map(mapRef.current, {
                    zoom: 5,
                    center: { lat: 23.6345, lng: -102.5528 }, 
                    disableDefaultUI: true,
                    zoomControl: true
                });

                let realRouteBounds = new window.google.maps.LatLngBounds();
                let hasRealRoute = false;

                if (trackingHistory.length > 0) {
                    const routePath = trackingHistory
                        .map(h => ({ lat: Number(h.lat || h.latitude), lng: Number(h.lng || h.longitude) }))
                        .filter(p => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0);

                    if (routePath.length > 0) {
                        hasRealRoute = true;
                        new window.google.maps.Polyline({
                            path: routePath,
                            geodesic: true,
                            strokeColor: '#3b82f6', 
                            strokeOpacity: 1.0,
                            strokeWeight: 6,
                            map
                        });
                        routePath.forEach(p => realRouteBounds.extend(p));
                    }
                }

                const liveLat = conn.liveLocation?.lat || conn.liveLocation?.latitude;
                const liveLng = conn.liveLocation?.lng || conn.liveLocation?.longitude;

                if (liveLat && liveLng) {
                    const currentPos = { lat: Number(liveLat), lng: Number(liveLng) };
                    new window.google.maps.Marker({
                        position: currentPos,
                        map,
                        title: 'Ubicación GPS Actual',
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#ef4444',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        },
                        zIndex: 999
                    });
                    realRouteBounds.extend(currentPos);
                    hasRealRoute = true;
                }

                const originStr = post ? (post.exactOriginAddress || `${post.originCity}, ${post.originState}, MX`) : "";
                const destStr = post ? (post.exactDestinationAddress || `${post.destinationCity}, ${post.destinationState}, MX`) : "";

                if (originStr && destStr) {
                    const directionsService = new window.google.maps.DirectionsService();
                    const directionsRenderer = new window.google.maps.DirectionsRenderer({
                        map,
                        suppressMarkers: false,
                        preserveViewport: hasRealRoute, 
                        polylineOptions: { strokeColor: '#94a3b8', strokeOpacity: 0.6, strokeWeight: 4 }
                    });

                    directionsService.route({
                        origin: originStr,
                        destination: destStr,
                        travelMode: window.google.maps.TravelMode.DRIVING,
                    }).then(response => {
                        directionsRenderer.setDirections(response);
                        if (hasRealRoute) {
                            setTimeout(() => {
                                if (mapRef.current) map.fitBounds(realRouteBounds, 50); 
                            }, 300);
                        }
                    }).catch(e => {
                        console.warn("No se pudo calcular la ruta planeada gris", e);
                        if (hasRealRoute) {
                            setTimeout(() => {
                                if (mapRef.current) map.fitBounds(realRouteBounds, 50);
                            }, 300);
                        }
                    });
                } else if (hasRealRoute) {
                    setTimeout(() => {
                        if (mapRef.current) map.fitBounds(realRouteBounds, 50);
                    }, 300);
                }
            })
            .catch((err) => {
                console.error("Error al cargar Google Maps:", err);
                if (isMounted) setMapError(true);
            });

        return () => { isMounted = false; };
    }, [trackingHistory, post, conn.liveLocation, googleApiKey]);

    const tl = conn.timeline || {};
    const trackingSteps = [
        { id: 'created', label: "Creado", time: conn.createdAt, icon: FileText },
        { id: 'assigned', label: "Asignado", time: tl.assigned || tl.confirmed, icon: CheckCircle },
        { id: 'loading', label: "Cargando", time: tl.cargando || tl.en_ruta_origen || tl.en_ruta_a_origen, icon: Package },
        { id: 'transit', label: "En Tránsito", time: tl.en_transito, icon: Activity },
        { id: 'delivered', label: "Entregado", time: tl.entregado || tl.delivered, icon: MapPin },
        { id: 'completed', label: "Finalizado", time: tl.completed || tl.terminated, icon: ShieldCheck }
    ];

    let currentStepIndex = 0;
    trackingSteps.forEach((s, i) => { if (s.time) currentStepIndex = i; });

    // 🔥 PUERTA TRASERA: BORRADO FORZADO DE VIAJE EN CONFLICTO 🔥
    const handleForceDelete = async () => {
        if (!window.confirm("🚨 ADVERTENCIA: Estás a punto de forzar el borrado de esta conexión de la base de datos. Esta acción no se puede deshacer y puede afectar historiales. ¿Proceder?")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', projectId, 'public', 'data', 'connections', conn.id));
            alert("Conexión borrada exitosamente. Por favor actualiza la página.");
            onClose();
        } catch (error) {
            alert("Error al borrar conexión: " + error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-100/50" onClick={e => e.stopPropagation()}>
                
                {/* --- CABECERA ELEGANTE --- */}
                <div className="bg-white px-6 py-5 md:px-8 border-b border-slate-100 flex justify-between items-center sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-white ${isDisputed ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {isDisputed ? <AlertTriangle size={20}/> : <LinkIcon size={20}/>}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-black text-slate-900 leading-none flex items-center gap-3">
                                Detalles de Operación
                                {isDisputed && <span className="bg-rose-600 text-white text-[9px] px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm shadow-rose-500/30">Disputa Activa</span>}
                            </h2>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-mono">
                                <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shadow-sm font-bold">ID: {conn.id.substring(0,8).toUpperCase()}</span>
                                <button onClick={handleForceDelete} className="text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1.5 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 transition-colors">
                                    <Trash2 size={12}/> Forzar Borrado
                                </button>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-slate-50 text-slate-500 hover:bg-slate-200 rounded-full transition-colors border border-slate-200 shadow-sm shrink-0">
                        <X size={18}/>
                    </button>
                </div>

                {/* --- CUERPO DEL MODAL --- */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50/50 flex flex-col gap-6 md:gap-8">
                    
                    {/* PANEL SUPERIOR: INFO DE RUTA Y PARTICIPANTES LADO A LADO */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Tarjeta de Ruta */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
                            <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MapPin size={14} className="text-blue-500"/> Información de la Ruta
                            </h4>
                            {post ? (
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30"></div>
                                        <span className="font-black text-slate-800 text-base">{post.originCity || post.originState}</span>
                                    </div>
                                    <div className="w-0.5 h-5 bg-slate-200 ml-1 mb-2 rounded-full"></div>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"></div>
                                        <span className="font-black text-slate-800 text-base">{post.destinationCity || post.destinationState}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
                                        <span className="text-[10px] font-mono font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                                            POST: {post.customId || post.id.substring(0,8).toUpperCase()}
                                        </span>
                                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100 flex items-center gap-1.5 shadow-sm">
                                            <Truck size={12}/> {post.vehicleType || post.loadType || 'Vehículo no especificado'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <span className="text-slate-500 text-xs font-bold">Publicación original archivada o eliminada.</span>
                                </div>
                            )}
                        </div>

                        {/* Tarjeta de Participantes */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                            <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Users size={14} className="text-emerald-500"/> Actores Logísticos
                            </h4>
                            <div className="space-y-3">
                                {/* Generador */}
                                <div className="flex items-center justify-between bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 transition-all hover:bg-emerald-50 hover:shadow-sm">
                                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600"><Package size={12}/></div>
                                        Generador
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); setViewingUser(shipperUser); }} className="text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-emerald-300">
                                        <span className="truncate max-w-[140px]">{shipperUser?.businessName || shipperUser?.id.substring(0,6)}</span> <Eye size={14} className="text-emerald-500"/>
                                    </button>
                                </div>
                                {/* Transportista */}
                                <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100 transition-all hover:bg-blue-50 hover:shadow-sm">
                                    <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-blue-600"><Truck size={12}/></div>
                                        Transportista
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); setViewingUser(carrierUser); }} className="text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-blue-300">
                                        <span className="truncate max-w-[140px]">{carrierUser?.businessName || carrierUser?.id.substring(0,6)}</span> <Eye size={14} className="text-blue-500"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ALERTA DE DISPUTA DESTACADA */}
                    {isDisputed && (
                        <div className="bg-rose-50 border-2 border-rose-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-2">
                            <div className="w-full md:flex-1">
                                <h3 className="font-black text-rose-800 text-sm flex items-center gap-2 mb-2"><AlertTriangle size={18}/> Fondos Congelados por Disputa</h3>
                                <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-inner">
                                    <p className="text-sm text-slate-700 leading-relaxed"><strong className="text-rose-700">Motivo de queja:</strong> "{conn.disputeDetails?.reason || 'No especificado'}"</p>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Apertura: {conn.disputeDetails?.openedByName}</p>
                                </div>
                            </div>
                            
                            {isFunded ? (
                                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                                    <button 
                                        disabled={resolvingDispute === conn.id}
                                        onClick={() => handleResolveDispute(conn, 'carrier')}
                                        className="h-12 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {resolvingDispute === conn.id ? <Activity size={16} className="animate-spin"/> : <Truck size={16}/>} Dar la razón a Transportista
                                    </button>
                                    <button 
                                        disabled={resolvingDispute === conn.id}
                                        onClick={() => handleResolveDispute(conn, 'shipper')}
                                        className="h-12 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {resolvingDispute === conn.id ? <Activity size={16} className="animate-spin"/> : <RotateCcw size={16}/>} Reembolsar a Generador
                                    </button>
                                </div>
                            ) : (
                                <div className="text-[11px] font-black uppercase tracking-widest text-rose-600 px-6 py-4 bg-white border border-rose-200 rounded-2xl text-center shadow-sm">
                                    El pago se hizo externamente.<br/>Requiere arbitraje manual off-platform.
                                </div>
                            )}
                        </div>
                    )}

                    {/* TIMELINE HORIZONTAL FLUIDO */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm w-full overflow-x-auto hide-scrollbar">
                        <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Clock size={14} className="text-slate-500"/> Línea de Tiempo Operativa
                        </h4>
                        <div className="min-w-[700px] relative px-6 pb-4">
                            {/* Línea Base Gris */}
                            <div className="absolute top-6 left-[4rem] right-[4rem] h-1.5 bg-slate-100 rounded-full z-0"></div>
                            {/* Línea de Progreso Verde */}
                            <div className="absolute top-6 left-[4rem] h-1.5 bg-emerald-500 rounded-full z-0 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `calc((100% - 8rem) * ${currentStepIndex / (trackingSteps.length - 1)})` }}></div>

                            <div className="flex justify-between relative z-10">
                                {trackingSteps.map((step, idx) => {
                                    const isCompleted = idx <= currentStepIndex;
                                    const isCurrent = idx === currentStepIndex;
                                    return (
                                        <div key={step.id} className="flex flex-col items-center w-24 relative group">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-md transition-all duration-500 ${isCompleted ? 'bg-emerald-500 text-white scale-110 shadow-emerald-500/40' : 'bg-slate-100 text-slate-300'}`}>
                                                <step.icon size={20} className={isCurrent && idx !== trackingSteps.length - 1 ? 'animate-pulse' : ''} />
                                            </div>
                                            <p className={`text-[10px] font-black uppercase tracking-wider mt-4 text-center leading-tight transition-colors ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                                                {step.label}
                                            </p>
                                            <div className="bg-slate-50 px-2 py-1 rounded-md border border-slate-100 mt-2">
                                                <p className="text-[9px] text-slate-500 font-bold text-center">{step.time ? safeDateStr(step.time) : '--/--/--'}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ACUERDO COMERCIAL Y FINANZAS */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <DollarSign size={14} className="text-slate-500"/> Acuerdo Comercial Final
                            </h4>
                            <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
                                ${Number(conn.proposalAmount || 0).toLocaleString()} <span className="text-lg font-bold text-slate-400">MXN</span>
                            </p>
                        </div>
                        <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                            <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm w-full md:w-auto text-center ${
                                conn.paymentStatus === 'funded' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 
                                conn.paymentStatus === 'released' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                conn.paymentStatus === 'refunded' ? 'bg-slate-100 border-slate-200 text-slate-600' :
                                'bg-slate-50 border-slate-200 text-slate-500'
                            }`}>
                                {conn.paymentStatus === 'funded' ? 'Pago Seguro en Bóveda' : 
                                 conn.paymentStatus === 'released' ? 'Fondos Transferidos' :
                                 conn.paymentStatus === 'refunded' ? 'Reembolso Emitido' :
                                 conn.paymentStatus || 'Pendiente de Fondeo'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                Vía: {conn.proposalEscrow ? <span className="text-indigo-600 flex items-center gap-1"><ShieldCheck size={12}/> Stripe (Pago Seguro)</span> : <span className="text-slate-600 flex items-center gap-1"><HeartHandshake size={12}/> Acuerdo Directo</span>}
                            </div>
                        </div>
                    </div>

                    {/* ZONA DE MAPA Y CHAT DIVIDIDA A LA MITAD 50/50 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                        
                        {/* PANEL MAPA */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none z-0"></div>
                            <div className="p-5 border-b border-slate-100 bg-white/80 backdrop-blur-md shrink-0 z-10 flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm flex items-center gap-2"><MapPin size={16} className="text-emerald-500"/> Monitoreo Satelital</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Rastreo GPS del viaje</p>
                                </div>
                                {conn.liveLocation && (
                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                        <Activity size={10} className="animate-pulse"/> En Vivo
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 relative bg-slate-100 w-full h-full z-0">
                                {mapError ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-rose-50/50 p-6 text-center m-4 rounded-2xl border-2 border-dashed border-rose-200">
                                        <AlertTriangle size={32} className="text-rose-400 mb-3"/>
                                        <p className="text-xs font-black uppercase tracking-widest text-rose-800 mb-2">Error de Conexión GMaps</p>
                                        <p className="text-[11px] text-rose-600 font-medium">Revisa las restricciones de tu API Key en la consola de Google Cloud.</p>
                                    </div>
                                ) : (
                                    <div ref={mapRef} className="absolute inset-0 flex items-center justify-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 animate-pulse">
                                            <MapPin size={32} className="mb-3 text-slate-300"/>
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Iniciando Motor de Mapas...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PANEL CHAT */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none z-0"></div>
                            <div className="p-5 border-b border-slate-100 bg-white/80 backdrop-blur-md shrink-0 z-10 flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm flex items-center gap-2"><MessageCircle size={16} className="text-blue-500"/> Registro de Conversación</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Auditoría de Lectura (Sólo Lectura)</p>
                                </div>
                            </div>
                            
                            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-slate-50/50 space-y-5 z-0">
                                {isLoadingChat ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Activity size={32} className="mb-3 opacity-30 animate-spin"/>
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Descargando Historial...</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white m-4 rounded-2xl border border-dashed border-slate-200">
                                        <MessageCircle size={32} className="mb-3 opacity-20"/>
                                        <p className="text-[11px] font-bold text-slate-500">No hay mensajes registrados entre estos usuarios.</p>
                                    </div>
                                ) : (
                                    messages.map((m, i) => {
                                        const isShipperUser = m.senderId === conn.toUid; // El 'toUid' suele ser el generador si el transportista inició el request, pero varía.
                                        // Mejor validamos directamente con el UID del emisor del mensaje
                                        const isFromShipper = m.senderId === shipperUser?.id;
                                        
                                        return (
                                            <div key={m.id || i} className={`flex flex-col w-full animate-in slide-in-from-bottom-2 ${isFromShipper ? 'items-start' : 'items-end'}`}>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-2">
                                                    {m.senderName || 'Usuario'} {isFromShipper ? '(Generador)' : '(Transportista)'}
                                                </span>
                                                <div className={`p-4 text-sm font-medium shadow-sm max-w-[85%] leading-relaxed ${isFromShipper ? 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-blue-500/20'}`}>
                                                    {m.text || m.message || 'Mensaje de sistema'}
                                                </div>
                                                <span className="text-[8px] font-bold text-slate-400 mt-1.5 px-2">{formatMessageTime(m.createdAt)}</span>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// --- COMPONENTE: LOGIN DEL ADMIN ---
// ============================================================================
const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const docPath = `artifacts/${projectId}/users/${user.uid}/profile/data`;
      
      try {
          const profileSnap = await getDoc(doc(db, 'artifacts', projectId, 'users', user.uid, 'profile', 'data'));
          
          if (profileSnap.exists()) {
             const data = profileSnap.data();
             
             if (data.isAdmin === true || String(data.isAdmin).toLowerCase() === "true") {
                 // Éxito
             } else {
                 await signOut(auth);
                 let errorMsg = `Acceso denegado. `;
                 if (data.isAdmin === undefined) {
                     errorMsg += `El campo 'isAdmin' NO EXISTE en tu documento. Asegúrate de agregarlo como booleano (true) en: ${docPath}`;
                 } else {
                     errorMsg += `El campo 'isAdmin' existe, pero su valor es: "${data.isAdmin}". Debe ser true (Booleano).`;
                 }
                 setError(errorMsg);
             }
          } else {
             await signOut(auth);
             setError(`Error: Documento de perfil no encontrado. Verifica que el documento exista exactamente en la ruta: ${docPath}`);
          }
      } catch (docError) {
          console.error("Error al intentar leer el perfil:", docError);
          await signOut(auth);
          setError(`Error de Firestore al leer tu perfil: ${docError.message}. Verifica las reglas de seguridad.`);
      }
    } catch (err) {
      console.error("Error de login (Authentication):", err);
      setError("Credenciales incorrectas o usuario no encontrado en Firebase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden text-left font-sans">
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-500/20 border border-blue-500/50">
          <Shield size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Admin Smarfleet</h1>
        <p className="text-slate-400 mb-10 font-medium text-sm">Panel de Control Maestro. Acceso restringido.</p>

        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl mb-6 text-xs font-bold leading-relaxed">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-1">Correo Electrónico</label>
             <input type="email" placeholder="admin@smarfleet.com" className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500 focus:bg-slate-900 transition-all text-sm font-medium" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-1">Contraseña de Acceso</label>
             <input type="password" placeholder="••••••••" className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500 focus:bg-slate-900 transition-all text-sm font-medium" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl py-4 mt-8 transition-all uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 disabled:opacity-50 hover:-translate-y-0.5">
            {loading ? "Verificando Seguridad..." : "Autorizar Ingreso"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// --- DASHBOARD PRINCIPAL ---
// ============================================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loads, setLoads] = useState([]);
  const [connections, setConnections] = useState([]);
  const [reports, setReports] = useState([]); 
  
  // Estados para Modales
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [viewingConnection, setViewingConnection] = useState(null); 
  
  // Estado para capturar errores de índices o permisos
  const [dbError, setDbError] = useState(null);

  // --- ESTADOS PARA DIFUSIÓN GLOBAL ---
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'info' });
  const [sendingNotif, setSendingNotif] = useState(false);

  // --- ESTADOS PARA FILTROS ---
  const [usersFilter, setUsersFilter] = useState({ search: '', role: 'all', tier: 'all', status: 'all', warnings: 'all' });
  const [pubsFilter, setPubsFilter] = useState({ search: '', type: 'all', status: 'all' });
  const [connsFilter, setConnsFilter] = useState({ search: '', status: 'all', sortBy: 'recent' });
  const [reportsFilter, setReportsFilter] = useState({ search: '', status: 'pending' });
  
  // Estado para Gráficas Analíticas
  const [trendMonthsRange, setTrendMonthsRange] = useState(6);
  const [resolvingDispute, setResolvingDispute] = useState(null); 
  const [processingWarning, setProcessingWarning] = useState(false);

  // --- ESTADOS PARA PAGINACIÓN ---
  const [pageUsers, setPageUsers] = useState(1);
  const [pagePubs, setPagePubs] = useState(1);
  const [pageConns, setPageConns] = useState(1);
  const [pageReports, setPageReports] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reseteo de páginas al cambiar filtros
  useEffect(() => setPageUsers(1), [usersFilter]);
  useEffect(() => setPagePubs(1), [pubsFilter]);
  useEffect(() => setPageConns(1), [connsFilter]);
  useEffect(() => setPageReports(1), [reportsFilter]);

  // Escuchar colecciones principales de Firebase
  useEffect(() => {
    // 1. Usuarios (Collection Group Query)
    const qUsers = query(collectionGroup(db, 'profile'));
    const unsubUsers = onSnapshot(qUsers, 
        (snap) => {
            const all = snap.docs
                .map(d => ({ id: d.ref.parent.parent.id, refPath: d.ref.path, ...d.data() }))
                .filter(u => u.refPath.includes(projectId));
            setUsers(all);
            setDbError(null); 
        },
        (error) => {
            console.error("Error al cargar usuarios:", error);
            if (error.code === 'failed-precondition' || error.message.includes('index')) {
                setDbError("Falta crear el índice en Firebase. Por favor, abre la consola del navegador (F12) y haz clic en el enlace azul que Firebase generó para crearlo.");
            } else if (error.code === 'permission-denied') {
                setDbError(`Permiso denegado. Tus reglas de Firebase están bloqueando la consulta global de perfiles. Verifica la Regla 5 en Firestore (collectionGroup). UID actual: ${auth.currentUser?.uid}`);
            } else {
                setDbError(error.message);
            }
        }
    );

    // 2. Viajes (Transportistas)
    const qTrips = query(collection(db, 'artifacts', projectId, 'public', 'data', 'trips'));
    const unsubTrips = onSnapshot(qTrips, s => setTrips(s.docs.map(d => ({id: d.id, type: 'trip', ...d.data()}))), 
        (error) => { if (error.code === 'permission-denied') setDbError("Permiso denegado al leer Viajes. Revisa las reglas de Firestore."); }
    );

    // 3. Cargas (Generadores)
    const qLoads = query(collection(db, 'artifacts', projectId, 'public', 'data', 'loads'));
    const unsubLoads = onSnapshot(qLoads, s => setLoads(s.docs.map(d => ({id: d.id, type: 'load', ...d.data()}))),
        (error) => { if (error.code === 'permission-denied') setDbError("Permiso denegado al leer Cargas. Revisa las reglas de Firestore."); }
    );

    // 4. Conexiones (Matches y Chats)
    const qConns = query(collection(db, 'artifacts', projectId, 'public', 'data', 'connections'));
    const unsubConns = onSnapshot(qConns, s => setConnections(s.docs.map(d => ({id: d.id, ...d.data()}))),
        (error) => { if (error.code === 'permission-denied') setDbError("Permiso denegado al leer Conexiones. Revisa las reglas de Firestore."); }
    );

    // 5. Reportes (Denuncias)
    const qReports = query(collection(db, 'artifacts', projectId, 'public', 'data', 'reports'));
    const unsubReports = onSnapshot(qReports, s => setReports(s.docs.map(d => ({id: d.id, ...d.data()}))),
        (error) => { if (error.code === 'permission-denied') setDbError("Permiso denegado al leer Reportes. Revisa las reglas de Firestore."); }
    );

    return () => { unsubUsers(); unsubTrips(); unsubLoads(); unsubConns(); unsubReports(); };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleResolveDispute = async (conn, winner) => {
      const winnerText = winner === 'carrier' ? 'TRANSPORTISTA (Se le pagará el viaje)' : 'GENERADOR (Se le reembolsará su dinero)';
      if(!window.confirm(`⚠️ ACCIÓN IRREVERSIBLE ⚠️\n\n¿Confirmas que deseas resolver esta disputa a favor del ${winnerText}?`)) return;

      setResolvingDispute(conn.id);
      try {
          const resolveDisputeFn = httpsCallable(functions, 'resolveDisputeAdmin');
          await resolveDisputeFn({ connectionId: conn.id, winnerRole: winner, adminNotes: 'Resuelto manualmente', appId: projectId });
          alert("¡Disputa resuelta y fondos movidos exitosamente!");
      } catch (error) {
          console.error(error);
          alert("Hubo un error al comunicar con el servidor de pagos: " + error.message);
      } finally {
          setResolvingDispute(null);
      }
  };

  // 🌟 FUNCIÓN: AMONESTAR O DESCARTAR REPORTE 🌟
  const handleIssueWarning = async (reportId, reportedUid, action) => {
      const actionText = action === 'warn' ? 'AMONESTAR al usuario (1/3)' : 'DESCARTAR este reporte';
      if(!window.confirm(`¿Seguro que deseas ${actionText}?`)) return;

      setProcessingWarning(true);
      try {
          const issueWarningFn = httpsCallable(functions, 'issueUserWarning');
          await issueWarningFn({ 
              reportId: reportId, 
              reportedUid: reportedUid, 
              action: action, 
              adminNotes: action === 'warn' ? 'Amonestado por Admin' : 'Falso reporte', 
              appId: projectId 
          });
          alert(action === 'warn' ? "¡Usuario amonestado exitosamente!" : "Reporte descartado.");
      } catch (error) {
          alert("Error al procesar: " + error.message);
      } finally {
          setProcessingWarning(false);
      }
  };

  const handleDeletePublication = async (id, type) => {
      if(!window.confirm("¿Seguro que deseas eliminar esta publicación permanentemente?")) return;
      try {
          const collectionName = type === 'trip' ? 'trips' : 'loads';
          await deleteDoc(doc(db, 'artifacts', projectId, 'public', 'data', collectionName, id));
      } catch (error) {
          alert("Error al eliminar: " + error.message);
      }
  };

  const handleDeleteUser = async (userToDelete) => {
      if(!window.confirm(`¿Seguro que deseas eliminar permanentemente el perfil de ${userToDelete.businessName || userToDelete.email}? Esta acción borrará su acceso, viajes y archivos.`)) return;
      try {
          const deleteUserFn = httpsCallable(functions, 'deleteUserCompletely');
          await deleteUserFn({ targetUid: userToDelete.id, appId: projectId });
          alert("Usuario eliminado por completo del sistema.");
      } catch (error) {
          alert("Error al eliminar: " + error.message);
      }
  };

  const handleSendGlobalNotification = async (e) => {
      e.preventDefault();
      if (!notifForm.title || !notifForm.message) return;
      
      const validUsers = users.filter(u => !u.isSuspended);
      if (!window.confirm(`Estás a punto de enviar una alerta oficial a ${validUsers.length} usuarios activos. ¿Deseas continuar?`)) return;

      setSendingNotif(true);
      try {
          const batches = [];
          let currentBatch = writeBatch(db);
          let opCount = 0;

          validUsers.forEach((u) => {
              const notifRef = doc(collection(db, 'artifacts', projectId, 'public', 'data', 'notifications'));
              currentBatch.set(notifRef, {
                  toUserId: u.id,
                  fromUserId: 'ADMIN_SYSTEM',
                  type: 'global_alert',
                  alertType: notifForm.type,
                  title: notifForm.title,
                  message: notifForm.message,
                  unread: true,
                  createdAt: serverTimestamp()
              });
              
              opCount++;
              if (opCount === 450) {
                  batches.push(currentBatch.commit());
                  currentBatch = writeBatch(db);
                  opCount = 0;
              }
          });

          if (opCount > 0) batches.push(currentBatch.commit());

          await Promise.all(batches);
          alert(`¡Éxito! Notificación enviada a ${validUsers.length} usuarios de forma segura.`);
          setNotifForm({ title: '', message: '', type: 'info' });
          
      } catch (error) {
          alert("Hubo un error al enviar el Broadcast: " + error.message);
          console.error(error);
      } finally {
          setSendingNotif(false);
      }
  };

  // --- LÓGICA DE FILTRADO ---
  const allPublications = useMemo(() => {
      return [...trips, ...loads].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [trips, loads]);

  const filteredUsers = useMemo(() => {
      return users.filter(u => {
          const searchLower = usersFilter.search.toLowerCase();
          const matchesSearch = !usersFilter.search || 
              u.businessName?.toLowerCase().includes(searchLower) || 
              u.email?.toLowerCase().includes(searchLower) || 
              u.id.toLowerCase().includes(searchLower);
          
          const matchesRole = usersFilter.role === 'all' || u.role === usersFilter.role;
          const matchesTier = usersFilter.tier === 'all' || u.tier === usersFilter.tier;
          
          const isSuspended = u.isSuspended === true;
          const matchesStatus = usersFilter.status === 'all' 
              || (usersFilter.status === 'active' && !isSuspended) 
              || (usersFilter.status === 'suspended' && isSuspended);

          // Filtro por Amonestaciones (Problemáticos)
          const warnings = u.warningsCount || 0;
          const matchesWarnings = usersFilter.warnings === 'all' || 
                                  (usersFilter.warnings === 'problematic' && warnings > 0) || 
                                  (usersFilter.warnings === 'critical' && warnings >= 3);

          return matchesSearch && matchesRole && matchesTier && matchesStatus && matchesWarnings;
      }).sort((a, b) => (b.warningsCount || 0) - (a.warningsCount || 0));
  }, [users, usersFilter]);

  const filteredPubs = useMemo(() => {
      return allPublications.filter(p => {
          const searchLower = pubsFilter.search.toLowerCase();
          const matchesSearch = !pubsFilter.search || 
              p.company?.toLowerCase().includes(searchLower) || 
              p.customId?.toLowerCase().includes(searchLower) ||
              p.originCity?.toLowerCase().includes(searchLower) ||
              p.destinationCity?.toLowerCase().includes(searchLower);
          
          const matchesType = pubsFilter.type === 'all' || p.type === pubsFilter.type;
          const matchesStatus = pubsFilter.status === 'all' || p.status === pubsFilter.status;

          return matchesSearch && matchesType && matchesStatus;
      });
  }, [allPublications, pubsFilter]);

  // ORDENAMIENTO DE LAS CONEXIONES
  const filteredConns = useMemo(() => {
      const result = connections.filter(c => {
          const post = allPublications.find(p => p.id === c.postId) || {};
          const searchLower = connsFilter.search.toLowerCase();
          
          const matchesSearch = !connsFilter.search || 
              c.fromName?.toLowerCase().includes(searchLower) || 
              c.toName?.toLowerCase().includes(searchLower) ||
              c.id.toLowerCase().includes(searchLower) ||
              post.originCity?.toLowerCase().includes(searchLower) ||
              post.destinationCity?.toLowerCase().includes(searchLower) ||
              post.originState?.toLowerCase().includes(searchLower) ||
              post.destinationState?.toLowerCase().includes(searchLower) ||
              post.customId?.toLowerCase().includes(searchLower);
          
          let targetStatus = c.tripStatus || c.status;
          if (c.isDisputed === true || c.tripStatus === 'disputed') targetStatus = 'disputed'; 

          const hasReports = reports.some(r => r.context === `Tracking Viaje: ${c.id}`);

          if (connsFilter.status === 'reported') {
              return matchesSearch && hasReports;
          }

          const matchesStatus = connsFilter.status === 'all' || targetStatus === connsFilter.status;

          return matchesSearch && matchesStatus;
      });

      if (connsFilter.sortBy === 'oldest') {
          return result.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      } else {
          return result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      }
  }, [connections, connsFilter, allPublications, reports]);

  const filteredReports = useMemo(() => {
      return reports.filter(r => {
          const searchLower = reportsFilter.search.toLowerCase();
          const matchesSearch = !reportsFilter.search || 
                                r.reportedName?.toLowerCase().includes(searchLower) || 
                                r.reporterName?.toLowerCase().includes(searchLower) || 
                                r.reason?.toLowerCase().includes(searchLower);
          
          const matchesStatus = reportsFilter.status === 'all' || r.status === reportsFilter.status;

          return matchesSearch && matchesStatus;
      }).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [reports, reportsFilter]);

  // --- CÁLCULOS DE ESTADÍSTICAS Y TENDENCIAS ---
  const stats = useMemo(() => {
      const carriers = users.filter(u => u.role === 'carrier').length;
      const shippers = users.filter(u => u.role === 'shipper').length;
      const suspended = users.filter(u => u.isSuspended).length;
      
      const activePubs = allPublications.filter(p => p.status === 'active').length;
      const completedPubs = allPublications.filter(p => p.status === 'completed').length;
      const pausedPubs = allPublications.filter(p => p.status === 'paused').length;

      const completedMatches = connections.filter(c => c.tripStatus === 'completed');
      const kmSavedPerMatch = 450; 
      const co2KgPerKm = 1.05; 
      const totalKmSaved = completedMatches.length * kmSavedPerMatch;
      const totalCo2SavedTons = ((totalKmSaved * co2KgPerKm) / 1000).toFixed(1);

      const monthsArray = Array.from({length: trendMonthsRange}, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return { 
              month: d.getMonth(), 
              year: d.getFullYear(), 
              label: d.toLocaleString('es-MX', {month: 'short'}).toUpperCase() + ' ' + d.getFullYear().toString().slice(2)
          };
      }).reverse();

      const getSafeDate = (item) => {
          if (item.createdAt?.seconds) return new Date(item.createdAt.seconds * 1000);
          return new Date(); 
      };

      let maxUsersCategory = 1;
      let maxPubsCategory = 1;

      const trendsData = monthsArray.map(m => {
          const mUsers = users.filter(u => {
              const d = getSafeDate(u);
              return d.getMonth() === m.month && d.getFullYear() === m.year;
          });
          const newCarriers = mUsers.filter(u => u.role === 'carrier').length;
          const newShippers = mUsers.filter(u => u.role === 'shipper').length;
          if (newCarriers > maxUsersCategory) maxUsersCategory = newCarriers;
          if (newShippers > maxUsersCategory) maxUsersCategory = newShippers;

          const mPubs = allPublications.filter(p => {
              const d = getSafeDate(p);
              return d.getMonth() === m.month && d.getFullYear() === m.year;
          });
          const newTrips = mPubs.filter(p => p.type === 'trip').length;
          const newLoads = mPubs.filter(p => p.type === 'load').length;
          if (newTrips > maxPubsCategory) maxPubsCategory = newTrips;
          if (newLoads > maxPubsCategory) maxPubsCategory = newLoads;

          return { 
              ...m, 
              newCarriers, newShippers, totalNewUsers: newCarriers + newShippers,
              newTrips, newLoads, totalNewPubs: newTrips + newLoads
          };
      });

      return {
          carriers, shippers, suspended,
          activePubs, completedPubs, pausedPubs,
          totalKmSaved, totalCo2SavedTons, completedMatchesCount: completedMatches.length,
          trendsData, maxUsersCategory, maxPubsCategory
      };
  }, [users, allPublications, connections, trendMonthsRange]);

  // Paginación de arreglos finales
  const pagedUsers = filteredUsers.slice((pageUsers - 1) * ITEMS_PER_PAGE, pageUsers * ITEMS_PER_PAGE);
  const pagedPubs = filteredPubs.slice((pagePubs - 1) * ITEMS_PER_PAGE, pagePubs * ITEMS_PER_PAGE);
  const pagedConns = filteredConns.slice((pageConns - 1) * ITEMS_PER_PAGE, pageConns * ITEMS_PER_PAGE);
  const pagedReports = filteredReports.slice((pageReports - 1) * ITEMS_PER_PAGE, pageReports * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50 flex text-left font-sans relative">
      
      {/* MODALES EN CAPAS SUPERIORES */}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
      {viewingConnection && <ConnectionDetailModal conn={viewingConnection} onClose={() => setViewingConnection(null)} trips={trips} loads={loads} handleResolveDispute={handleResolveDispute} resolvingDispute={resolvingDispute} users={users} setViewingUser={setViewingUser} />}
      {viewingUser && <UserDetailModal user={viewingUser} onClose={() => setViewingUser(null)} allTrips={trips} allLoads={loads} allConnections={connections} />}

      {/* --- MENÚ LATERAL REDISEÑADO --- */}
      <aside className="w-64 bg-slate-900 text-slate-300 fixed h-full flex flex-col p-6 z-20 shadow-2xl border-r border-slate-800">
        <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30"><Shield size={20} className="text-indigo-400"/></div>
            <span className="font-black text-xl tracking-tighter text-white">SMAR<span className="text-indigo-400">ADMIN</span></span>
        </div>
        
        <nav className="flex-1 space-y-1.5">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'hover:bg-slate-800 hover:text-white'}`}>
                <BarChart3 size={18}/> Resumen
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Users size={18}/> Usuarios
            </button>
            <button onClick={() => setActiveTab('publications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'publications' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Package size={18}/> Publicaciones
            </button>
            <button onClick={() => setActiveTab('connections')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'connections' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'hover:bg-slate-800 hover:text-white'}`}>
                <LinkIcon size={18}/> Conexiones
            </button>
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Flag size={18}/> Moderación <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-auto shadow-sm">{reports.filter(r=>r.status==='pending').length}</span>
            </button>
            
            <div className="pt-4 pb-2">
                <div className="h-px bg-slate-800 w-full mb-2"></div>
            </div>

            <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Bell size={18}/> Anuncios Globales
            </button>
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 text-slate-400 hover:text-white font-bold text-sm p-4 rounded-xl hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/30">
            <LogOut size={18}/> Cerrar Sesión
        </button>
      </aside>

      {/* --- ÁREA DE CONTENIDO PRINCIPAL --- */}
      <main className="ml-64 flex-1 p-8 md:p-12 lg:p-16 max-w-7xl mx-auto w-full">
        <header className="mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Panel de Control</h2>
            <p className="text-slate-500 font-medium mt-2 text-sm md:text-base">Monitoreo y métricas en tiempo real de la red Smarfleet.</p>
        </header>

        {/* ALERTA DE ERROR DE BASE DE DATOS */}
        {dbError && (
            <div className="mb-8 bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-2xl text-rose-700 shadow-sm animate-in fade-in">
                <h4 className="font-black text-lg mb-2 flex items-center gap-2">
                    <AlertTriangle /> Problema de Permisos en Firebase
                </h4>
                <p className="font-medium text-sm leading-relaxed mt-2">{dbError}</p>
                <div className="mt-4 p-4 bg-white/50 rounded-xl text-xs font-mono text-rose-800 border border-rose-200">
                    Sugerencia: Revisa la Regla 5 en Firestore (collectionGroup). Debe ser algo como:<br/>
                    <br/>
                    <code>
                        match /{`{path=**}`}/profile/{`{docId}`} {'{'}<br/>
                        &nbsp;&nbsp;allow read: if request.auth != null;<br/>
                        {'}'}
                    </code>
                </div>
            </div>
        )}

        {/* RENDERIZADO MODULAR DE PESTAÑAS */}
        {activeTab === 'overview' && <OverviewTab stats={stats} users={users} trips={trips} loads={loads} connections={connections} trendMonthsRange={trendMonthsRange} setTrendMonthsRange={setTrendMonthsRange} />}
        {activeTab === 'notifications' && <NotificationsTab notifForm={notifForm} setNotifForm={setNotifForm} handleSendGlobalNotification={handleSendGlobalNotification} sendingNotif={sendingNotif} users={users} />}
        {activeTab === 'users' && <UsersTab usersFilter={usersFilter} setUsersFilter={setUsersFilter} filteredUsers={filteredUsers} pagedUsers={pagedUsers} pageUsers={pageUsers} setPageUsers={setPageUsers} ITEMS_PER_PAGE={ITEMS_PER_PAGE} setViewingUser={setViewingUser} setEditingUser={setEditingUser} handleDeleteUser={handleDeleteUser} safeDateStr={safeDateStr} />}
        {activeTab === 'publications' && <PublicationsTab pubsFilter={pubsFilter} setPubsFilter={setPubsFilter} filteredPubs={filteredPubs} pagedPubs={pagedPubs} pagePubs={pagePubs} setPagePubs={setPagePubs} ITEMS_PER_PAGE={ITEMS_PER_PAGE} handleDeletePublication={handleDeletePublication} safeDateStr={safeDateStr} />}
        {activeTab === 'connections' && <ConnectionsTab connsFilter={connsFilter} setConnsFilter={setConnsFilter} filteredConns={filteredConns} pagedConns={pagedConns} pageConns={pageConns} setPageConns={setPageConns} ITEMS_PER_PAGE={ITEMS_PER_PAGE} setViewingConnection={setViewingConnection} safeDateStr={safeDateStr} reports={reports} allPublications={allPublications} />}
        {activeTab === 'reports' && <ReportsTab reportsFilter={reportsFilter} setReportsFilter={setReportsFilter} filteredReports={filteredReports} pagedReports={pagedReports} pageReports={pageReports} setPageReports={setPageReports} ITEMS_PER_PAGE={ITEMS_PER_PAGE} safeDateStr={safeDateStr} handleIssueWarning={handleIssueWarning} processingWarning={processingWarning} users={users} setViewingUser={setViewingUser} connections={connections} setViewingConnection={setViewingConnection} />}

      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold">Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!user ? <AdminLogin /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <AdminDashboard /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}