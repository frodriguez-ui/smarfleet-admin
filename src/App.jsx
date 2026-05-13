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
// --- COMPONENTES MODULARES (MODALES ORIGINALES) ---
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800">Gestionar Usuario</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div className="space-y-5">
                    <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${formData.isSuspended ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div>
                            <p className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${formData.isSuspended ? 'text-rose-800' : 'text-emerald-800'}`}>
                                {formData.isSuspended ? <Ban size={14}/> : <CheckCircle size={14}/>}
                                {formData.isSuspended ? 'Cuenta Suspendida' : 'Cuenta Activa'}
                            </p>
                            <p className={`text-[10px] font-medium mt-1 ${formData.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formData.isSuspended ? 'El usuario no puede acceder a la app.' : 'El usuario opera con normalidad.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, isSuspended: !formData.isSuspended})}
                            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${formData.isSuspended ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}
                        >
                            {formData.isSuspended ? 'Reactivar' : 'Suspender'}
                        </button>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Empresa</label>
                        <input 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-slate-800"
                            value={formData.businessName || ''}
                            onChange={e => setFormData({...formData, businessName: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Plan de Suscripción</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-slate-800"
                            value={formData.tier || 'free'}
                            onChange={e => setFormData({...formData, tier: e.target.value})}
                        >
                            <option value="free">Capa Gratuita (Free)</option>
                            <option value="premium">Smarfleet Premium</option>
                        </select>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-blue-800 flex items-center gap-1.5"><Shield size={14}/> Privilegios Admin</p>
                            <p className="text-[10px] font-medium text-blue-600 mt-1">Permite acceso a este panel.</p>
                        </div>
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-blue-600 cursor-pointer"
                            checked={formData.isAdmin || false}
                            onChange={e => setFormData({...formData, isAdmin: e.target.checked})}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl mt-8 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xl shadow-slate-900/20"
                >
                    {loading ? "Guardando..." : "Actualizar Perfil"}
                </button>
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-slate-50 rounded-[2rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 overflow-hidden" onClick={e => e.stopPropagation()}>
                
                <div className="bg-white px-8 py-6 border-b border-slate-200 flex justify-between items-start shrink-0">
                    <div className="flex gap-5 items-center min-w-0">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 shadow-sm">
                            {user.photoData ? <img src={user.photoData} alt="Logo" className="w-full h-full object-cover" /> : <Users size={28}/>}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h2 className="text-2xl font-black text-slate-800 leading-none truncate">{user.businessName || 'Usuario sin nombre'}</h2>
                                {user.isSuspended && <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 shrink-0"><Ban size={10}/> Suspendido</span>}
                                {user.isAdmin && <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 shrink-0"><Shield size={10}/> Admin</span>}
                                
                                {warnings > 0 && (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 shrink-0 ${warnings >= 3 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-orange-100 text-orange-700'}`}>
                                        <AlertTriangle size={10}/> {warnings}/3 Amonestaciones
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 mt-2">
                                <span className="flex items-center gap-1.5"><Mail size={14}/> {user.email || user.id}</span>
                                {user.phone && <span className="flex items-center gap-1.5"><Phone size={14}/> {user.phone}</span>}
                                <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[9px] border ${user.role === 'carrier' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                    {user.role === 'carrier' ? 'Transportista' : 'Generador'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] border ${user.tier === 'premium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    {user.tier === 'premium' ? `PREMIUM (Vence: ${expDate})` : 'FREE'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition-colors shrink-0"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                    
                    {warnings >= 3 && !user.isSuspended && (
                        <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                            <div>
                                <h4 className="text-red-800 font-black flex items-center gap-2"><AlertTriangle size={18}/> Alerta Máxima de Moderación</h4>
                                <p className="text-red-700 text-xs mt-1 font-medium">Este usuario ha acumulado 3 amonestaciones. Te sugerimos ir a "Editar" y suspender su cuenta inmediatamente.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Package size={12}/> Pub. Activas</p>
                            <p className="text-3xl font-black text-slate-800">{stats.activePubs}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><FileText size={12}/> Pub. Totales</p>
                            <p className="text-3xl font-black text-slate-800">{stats.totalPubs}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><LinkIcon size={12}/> Interacciones</p>
                            <p className="text-3xl font-black text-slate-800">{stats.totalConns}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-center">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1"><CheckCircle size={12}/> Viajes Exitosos</p>
                            <p className="text-3xl font-black text-emerald-700">{stats.completedTrips}</p>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                    <Package size={16} className="text-blue-500"/> Historial de Publicaciones
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
                                {userPubs.length > 0 ? userPubs.map(pub => (
                                    <div key={pub.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-sm flex justify-between items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-700 truncate flex items-center gap-1.5">
                                                {pub.originCity} <ArrowRight size={12} className="text-slate-300"/> {pub.destinationCity}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                                                <span className="font-mono bg-slate-100 px-1 rounded">{pub.customId || pub.id.substring(0,6)}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Calendar size={10}/> {pub.date || 'Fija'}</span>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[9px] font-bold border shrink-0 ${pub.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : pub.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                            {pub.status.toUpperCase()}
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-center text-slate-400 text-xs py-10 font-medium">No tiene publicaciones.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                    <LinkIcon size={16} className="text-purple-500"/> Interacciones en la Red
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
                                {userConns.length > 0 ? userConns.map(conn => {
                                    const otherName = conn.fromUid === user.id ? conn.toName : conn.fromName;
                                    const isSender = conn.fromUid === user.id;
                                    const targetStatus = conn.tripStatus || conn.status;
                                    
                                    return (
                                    <div key={conn.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-sm flex justify-between items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-700 truncate">
                                                Con: <span className="text-blue-600">{otherName}</span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                                                <span>{isSender ? 'Solicitó contactar' : 'Recibió solicitud'}</span>
                                                <span>•</span>
                                                <span className="font-mono">{new Date(conn.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[9px] font-bold border shrink-0 ${targetStatus === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : targetStatus === 'terminated' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {targetStatus.toUpperCase()}
                                        </span>
                                    </div>
                                )}) : (
                                    <p className="text-center text-slate-400 text-xs py-10 font-medium">No tiene interacciones registradas.</p>
                                )}
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden text-left">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      <div className="bg-slate-800 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 border border-slate-700">
        <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
          <Shield size={32} />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Admin Smarfleet</h1>
        <p className="text-slate-400 mb-8 font-medium">Panel de Control Maestro</p>

        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl mb-6 text-xs font-bold">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-4 mt-4 transition-all uppercase tracking-widest text-xs">
            {loading ? "Verificando..." : "Ingresar"}
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
  const [trendPeriod, setTrendPeriod] = useState('4w');
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

      // NUEVAS MÉTRICAS FINANCIERAS Y DE MODERACIÓN
      const successfulEscrowConns = connections.filter(c => c.paymentStatus === 'released' || c.paymentStatus === 'released_by_dispute' || c.paymentStatus === 'released_penalty');
      const totalEscrowVolume = successfulEscrowConns.reduce((sum, c) => sum + (Number(c.proposalAmount) || 0), 0);
      
      const activeDisputes = connections.filter(c => c.isDisputed === true || c.tripStatus === 'disputed').length;
      const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

      // LÓGICA DE GRÁFICAS: SEMANAL O MENSUAL
      const isWeekly = trendPeriod.endsWith('w');
      const periodsCount = parseInt(trendPeriod); // Extrae 4, 12, 6 o 12

      const periodsArray = Array.from({length: periodsCount}, (_, i) => {
          if (isWeekly) {
              const endD = new Date();
              endD.setDate(endD.getDate() - (i * 7));
              const startD = new Date(endD);
              startD.setDate(startD.getDate() - 6);
              startD.setHours(0,0,0,0);
              endD.setHours(23,59,59,999);
              return {
                  isWeekly: true,
                  start: startD,
                  end: endD,
                  label: `${startD.getDate()} ${startD.toLocaleString('es-MX', {month:'short'})}`
              };
          } else {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              return { 
                  isWeekly: false,
                  month: d.getMonth(), 
                  year: d.getFullYear(), 
                  label: d.toLocaleString('es-MX', {month: 'short'}).toUpperCase() + ' ' + d.getFullYear().toString().slice(2)
              };
          }
      }).reverse();

      const getSafeDate = (item) => {
          if (item.createdAt?.seconds) return new Date(item.createdAt.seconds * 1000);
          return new Date(); 
      };

      let maxUsersCategory = 1;
      let maxPubsCategory = 1;

      const trendsData = periodsArray.map(p => {
          const matchItem = (item) => {
              const d = getSafeDate(item);
              if (p.isWeekly) {
                  return d >= p.start && d <= p.end;
              } else {
                  return d.getMonth() === p.month && d.getFullYear() === p.year;
              }
          };

          const mUsers = users.filter(matchItem);
          const newCarriers = mUsers.filter(u => u.role === 'carrier').length;
          const newShippers = mUsers.filter(u => u.role === 'shipper').length;
          if (newCarriers > maxUsersCategory) maxUsersCategory = newCarriers;
          if (newShippers > maxUsersCategory) maxUsersCategory = newShippers;

          const mPubs = allPublications.filter(matchItem);
          const newTrips = mPubs.filter(p => p.type === 'trip').length;
          const newLoads = mPubs.filter(p => p.type === 'load').length;
          if (newTrips > maxPubsCategory) maxPubsCategory = newTrips;
          if (newLoads > maxPubsCategory) maxPubsCategory = newLoads;

          return { 
              ...p, 
              newCarriers, newShippers, totalNewUsers: newCarriers + newShippers,
              newTrips, newLoads, totalNewPubs: newTrips + newLoads
          };
      });

      return {
          carriers, shippers, suspended,
          activePubs, completedPubs, pausedPubs,
          totalKmSaved, totalCo2SavedTons, completedMatchesCount: completedMatches.length,
          totalEscrowVolume, activeDisputes, pendingReportsCount,
          trendsData, maxUsersCategory, maxPubsCategory
      };
  }, [users, allPublications, connections, reports, trendPeriod]);

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

      {/* --- MENÚ LATERAL --- */}
      <aside className="w-64 bg-slate-900 text-white fixed h-full flex flex-col p-6 z-20 shadow-2xl">
        <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-blue-600 rounded-lg"><Shield size={20}/></div>
            <span className="font-black text-xl tracking-tighter">SMAR<span className="text-blue-500">ADMIN</span></span>
        </div>
        
        <nav className="flex-1 space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-blue-600 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <BarChart3 size={18}/> Resumen
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-blue-600 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Users size={18}/> Usuarios
            </button>
            <button onClick={() => setActiveTab('publications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'publications' ? 'bg-blue-600 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Package size={18}/> Publicaciones
            </button>
            <button onClick={() => setActiveTab('connections')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'connections' ? 'bg-blue-600 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <LinkIcon size={18}/> Conexiones
            </button>
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'reports' ? 'bg-blue-600 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Flag size={18}/> Moderación <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-auto">{reports.filter(r=>r.status==='pending').length}</span>
            </button>
            
            <div className="pt-4 pb-2">
                <div className="h-px bg-slate-800 w-full mb-2"></div>
            </div>

            <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'notifications' ? 'bg-indigo-600 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Bell size={18}/> Anuncios
            </button>
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 text-slate-400 hover:text-white font-bold text-sm p-4 rounded-xl hover:bg-rose-500/20 hover:text-rose-400 transition-all">
            <LogOut size={18}/> Cerrar Sesión
        </button>
      </aside>

      {/* --- ÁREA DE CONTENIDO PRINCIPAL --- */}
      <main className="ml-64 flex-1 p-10 max-w-7xl">
        <header className="mb-10">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Panel de Control</h2>
            <p className="text-slate-500 font-medium mt-1">Monitoreo y métricas en tiempo real de la red Smarfleet</p>
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
        {activeTab === 'overview' && <OverviewTab stats={stats} users={users} trips={trips} loads={loads} connections={connections} trendPeriod={trendPeriod} setTrendPeriod={setTrendPeriod} />}
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