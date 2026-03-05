import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Truck, Package, LogOut, 
  Search, AlertTriangle, CheckCircle, XCircle, X,
  MapPin, Calendar, Link as LinkIcon, Trash2, Edit, Filter,
  Leaf, TrendingUp, BarChart3, Activity, Ban, Eye, FileText, Phone, Mail, ArrowRight,
  Bell, Megaphone, Send, Info, ChevronLeft
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collectionGroup, collection, query, onSnapshot, 
  doc, getDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp
} from 'firebase/firestore';

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
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'smarfleet-d7807';

// ============================================================================
// --- COMPONENTE AUXILIAR (PAGINACIÓN) ---
// ============================================================================
const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col items-center gap-3 p-6 bg-white border-t border-slate-100">
            <div className="flex items-center gap-1.5">
                <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors text-slate-600 shadow-sm"><ChevronLeft size={16} /></button>
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                            <button key={pageNum} onClick={() => onPageChange(pageNum)} className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                {pageNum}
                            </button>
                        );
                    })}
                </div>
                <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors text-slate-600 shadow-sm rotate-180"><ChevronLeft size={16} /></button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                Página {currentPage} de {totalPages} ({totalItems} resultados)
            </p>
        </div>
    );
};

// ============================================================================
// --- COMPONENTES MODULARES (MODALES) ---
// ============================================================================

// 1. MODAL DE EDICIÓN
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
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

// 2. MODAL DE DETALLE (DRILL-DOWN)
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

    // Extraer fecha de vencimiento
    const expDate = user.subscriptionEndsAt?.seconds 
        ? new Date(user.subscriptionEndsAt.seconds * 1000).toLocaleDateString() 
        : (user.currentPeriodEnd?.seconds ? new Date(user.currentPeriodEnd.seconds * 1000).toLocaleDateString() : 'Auto-renovable');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-slate-50 rounded-[2rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Cabecera del Detalle */}
                <div className="bg-white px-8 py-6 border-b border-slate-200 flex justify-between items-start shrink-0">
                    <div className="flex gap-5 items-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 shadow-sm">
                            {user.photoData ? <img src={user.photoData} alt="Logo" className="w-full h-full object-cover" /> : <Users size={28}/>}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black text-slate-800 leading-none">{user.businessName || 'Usuario sin nombre'}</h2>
                                {user.isSuspended && <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1"><Ban size={10}/> Suspendido</span>}
                                {user.isAdmin && <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1"><Shield size={10}/> Admin</span>}
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
                    <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                </div>

                {/* Contenido Scrolleable */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                    
                    {/* Tarjetas de Métricas */}
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
                        {/* Lista de Publicaciones */}
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

                        {/* Lista de Conexiones */}
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
// --- COMPONENTE: LOGIN ---
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
                 navigate('/dashboard');
             } else {
                 await signOut(auth);
                 let errorMsg = `Acceso denegado. `;
                 if (data.isAdmin === undefined) {
                     errorMsg += `El campo 'isAdmin' NO EXISTE en tu documento. Asegúrate de agregarlo como booleano (true) en: ${docPath}`;
                 } else {
                     errorMsg += `El campo 'isAdmin' existe, pero su valor es: "${data.isAdmin}" (tipo: ${typeof data.isAdmin}). Debe ser true (Booleano).`;
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
          setError(`Error de Firestore al leer tu perfil: ${docError.message}. Verifica las reglas de seguridad o tu conexión.`);
      }
    } catch (err) {
      console.error("Error de login (Authentication):", err);
      setError("Credenciales incorrectas o usuario no encontrado en Firebase Authentication.");
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
  
  // Estados para Modales
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  
  // Estado para capturar errores de índices o permisos
  const [dbError, setDbError] = useState(null);

  // --- ESTADOS PARA DIFUSIÓN GLOBAL ---
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'info' });
  const [sendingNotif, setSendingNotif] = useState(false);

  // --- ESTADOS PARA FILTROS ---
  const [usersFilter, setUsersFilter] = useState({ search: '', role: 'all', tier: 'all', status: 'all' });
  const [pubsFilter, setPubsFilter] = useState({ search: '', type: 'all', status: 'all' });
  const [connsFilter, setConnsFilter] = useState({ search: '', status: 'all' });
  
  // Estado para Gráficas Analíticas
  const [trendMonthsRange, setTrendMonthsRange] = useState(6);

  // --- ESTADOS PARA PAGINACIÓN ---
  const [pageUsers, setPageUsers] = useState(1);
  const [pagePubs, setPagePubs] = useState(1);
  const [pageConns, setPageConns] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reseteo de páginas al cambiar filtros
  useEffect(() => setPageUsers(1), [usersFilter]);
  useEffect(() => setPagePubs(1), [pubsFilter]);
  useEffect(() => setPageConns(1), [connsFilter]);

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

    return () => { unsubUsers(); unsubTrips(); unsubLoads(); unsubConns(); };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
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

          return matchesSearch && matchesRole && matchesTier && matchesStatus;
      });
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

  const filteredConns = useMemo(() => {
      return connections.filter(c => {
          const searchLower = connsFilter.search.toLowerCase();
          const matchesSearch = !connsFilter.search || 
              c.fromName?.toLowerCase().includes(searchLower) || 
              c.toName?.toLowerCase().includes(searchLower) ||
              c.id.toLowerCase().includes(searchLower);
          
          const targetStatus = c.tripStatus || c.status;
          const matchesStatus = connsFilter.status === 'all' || targetStatus === connsFilter.status;

          return matchesSearch && matchesStatus;
      });
  }, [connections, connsFilter]);

  // --- CÁLCULOS DE ESTADÍSTICAS Y TENDENCIAS (MÓDULO ROBUSTO) ---
  const stats = useMemo(() => {
      const carriers = users.filter(u => u.role === 'carrier').length;
      const shippers = users.filter(u => u.role === 'shipper').length;
      const suspended = users.filter(u => u.isSuspended).length;
      
      const activePubs = allPublications.filter(p => p.status === 'active').length;
      const completedPubs = allPublications.filter(p => p.status === 'completed').length;
      const pausedPubs = allPublications.filter(p => p.status === 'paused').length;

      // KPI Sostenibilidad
      const completedMatches = connections.filter(c => c.tripStatus === 'completed');
      const kmSavedPerMatch = 450; 
      const co2KgPerKm = 1.05; 
      const totalKmSaved = completedMatches.length * kmSavedPerMatch;
      const totalCo2SavedTons = ((totalKmSaved * co2KgPerKm) / 1000).toFixed(1);

      // --- CÁLCULO DE GRÁFICAS POR MES (TENDENCIAS) ---
      const monthsArray = Array.from({length: trendMonthsRange}, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return { 
              month: d.getMonth(), 
              year: d.getFullYear(), 
              label: d.toLocaleString('es-MX', {month: 'short'}).toUpperCase() + ' ' + d.getFullYear().toString().slice(2)
          };
      }).reverse();

      // Función auxiliar para extraer fecha segura
      const getSafeDate = (item) => {
          if (item.createdAt?.seconds) return new Date(item.createdAt.seconds * 1000);
          return new Date(); // Fallback temporal para datos legacy sin fecha
      };

      let maxUsersCategory = 1;
      let maxPubsCategory = 1;

      const trendsData = monthsArray.map(m => {
          // Filtrar Usuarios de este mes
          const mUsers = users.filter(u => {
              const d = getSafeDate(u);
              return d.getMonth() === m.month && d.getFullYear() === m.year;
          });
          const newCarriers = mUsers.filter(u => u.role === 'carrier').length;
          const newShippers = mUsers.filter(u => u.role === 'shipper').length;
          if (newCarriers > maxUsersCategory) maxUsersCategory = newCarriers;
          if (newShippers > maxUsersCategory) maxUsersCategory = newShippers;

          // Filtrar Publicaciones de este mes
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

  return (
    <div className="min-h-screen bg-slate-50 flex text-left font-sans">
      
      {/* MODALES EN CAPAS SUPERIORES */}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
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

        {/* MÓDULO: RESUMEN Y GRÁFICAS (OVERVIEW) */}
        {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                {/* 1. Tarjetas Superiores (Totales Históricos) */}
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

                {/* 2. Sección de Impacto Ambiental */}
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

                {/* 3. PANEL DE GRÁFICAS DE TENDENCIAS (NUEVO) */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
                    {/* Controles del Dashboard */}
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
                        
                        {/* Gráfica A: Crecimiento de Usuarios */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={14}/> Nuevas Cuentas (Mensual)</h4>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></div> Transportistas</span>
                                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div> Generadores</span>
                                </div>
                            </div>
                            
                            <div className="h-56 w-full flex items-end gap-2 md:gap-4 relative">
                                {/* Líneas de fondo (Eje Y) */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                                    <div className="border-b border-dashed border-slate-200 w-full h-0 relative"><span className="absolute -left-6 -top-2.5 text-[9px] text-slate-400">{stats.maxUsersCategory}</span></div>
                                    <div className="border-b border-dashed border-slate-200 w-full h-0 relative"><span className="absolute -left-6 -top-2.5 text-[9px] text-slate-400">{Math.round(stats.maxUsersCategory/2)}</span></div>
                                    <div className="border-b border-slate-200 w-full h-0 relative"><span className="absolute -left-6 -top-2.5 text-[9px] text-slate-400">0</span></div>
                                </div>

                                {/* Barras Dinámicas */}
                                <div className="absolute inset-0 flex items-end gap-2 md:gap-4 ml-2 pb-8">
                                    {stats.trendsData.map((data, idx) => (
                                        <div key={idx} className="flex-1 flex items-end justify-center gap-1 h-full relative group">
                                            
                                            {/* Tooltip Hover */}
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-2 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-xl">
                                                {data.label}: {data.totalNewUsers} Usuarios
                                                <div className="text-[9px] font-normal text-slate-300 mt-1">{data.newCarriers} Transp. / {data.newShippers} Generadores</div>
                                            </div>

                                            {/* Barra Transp */}
                                            <div 
                                                className="w-1/2 bg-indigo-500 rounded-t-md hover:bg-indigo-400 transition-all duration-500" 
                                                style={{ height: `${(data.newCarriers / stats.maxUsersCategory) * 100}%`, minHeight: data.newCarriers > 0 ? '4px' : '0' }}>
                                            </div>
                                            {/* Barra Generador */}
                                            <div 
                                                className="w-1/2 bg-emerald-500 rounded-t-md hover:bg-emerald-400 transition-all duration-500" 
                                                style={{ height: `${(data.newShippers / stats.maxUsersCategory) * 100}%`, minHeight: data.newShippers > 0 ? '4px' : '0' }}>
                                            </div>

                                            {/* Etiqueta Eje X */}
                                            <span className="absolute -bottom-6 text-[9px] font-black text-slate-500 tracking-wider w-full text-center truncate">{data.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Gráfica B: Crecimiento de Publicaciones */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Package size={14}/> Nuevo Inventario (Mensual)</h4>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div> Viajes</span>
                                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-amber-500"></div> Cargas</span>
                                </div>
                            </div>
                            
                            <div className="h-56 w-full flex items-end gap-2 md:gap-4 relative">
                                {/* Líneas de fondo (Eje Y) */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                                    <div className="border-b border-dashed border-slate-200 w-full h-0 relative"><span className="absolute -left-6 -top-2.5 text-[9px] text-slate-400">{stats.maxPubsCategory}</span></div>
                                    <div className="border-b border-dashed border-slate-200 w-full h-0 relative"><span className="absolute -left-6 -top-2.5 text-[9px] text-slate-400">{Math.round(stats.maxPubsCategory/2)}</span></div>
                                    <div className="border-b border-slate-200 w-full h-0 relative"><span className="absolute -left-6 -top-2.5 text-[9px] text-slate-400">0</span></div>
                                </div>

                                {/* Barras Dinámicas */}
                                <div className="absolute inset-0 flex items-end gap-2 md:gap-4 ml-2 pb-8">
                                    {stats.trendsData.map((data, idx) => (
                                        <div key={idx} className="flex-1 flex items-end justify-center gap-1 h-full relative group">
                                            
                                            {/* Tooltip Hover */}
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-2 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-xl">
                                                {data.label}: {data.totalNewPubs} Publicaciones
                                                <div className="text-[9px] font-normal text-slate-300 mt-1">{data.newTrips} Viajes / {data.newLoads} Cargas</div>
                                            </div>

                                            {/* Barra Viajes */}
                                            <div 
                                                className="w-1/2 bg-blue-500 rounded-t-md hover:bg-blue-400 transition-all duration-500" 
                                                style={{ height: `${(data.newTrips / stats.maxPubsCategory) * 100}%`, minHeight: data.newTrips > 0 ? '4px' : '0' }}>
                                            </div>
                                            {/* Barra Cargas */}
                                            <div 
                                                className="w-1/2 bg-amber-500 rounded-t-md hover:bg-amber-400 transition-all duration-500" 
                                                style={{ height: `${(data.newLoads / stats.maxPubsCategory) * 100}%`, minHeight: data.newLoads > 0 ? '4px' : '0' }}>
                                            </div>

                                            {/* Etiqueta Eje X */}
                                            <span className="absolute -bottom-6 text-[9px] font-black text-slate-500 tracking-wider w-full text-center truncate">{data.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        )}

        {/* 🔥 MÓDULO: NOTIFICACIONES GLOBALES (BROADCAST) 🔥 */}
        {activeTab === 'notifications' && !dbError && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 
                 <div className="grid lg:grid-cols-2 gap-8">
                     
                     {/* Formulario de Envío */}
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

                     {/* Panel Lateral: Vista Previa */}
                     <div className="flex flex-col gap-6">
                         <div className="bg-slate-100 p-8 rounded-3xl border border-slate-200 flex-1 flex flex-col justify-center items-center relative shadow-inner">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 absolute top-6 left-1/2 -translate-x-1/2">
                                 Vista Previa del Usuario
                             </p>
                             
                             {/* Tarjeta de Notificación Simulada */}
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
        )}

        {/* MÓDULO: USUARIOS */}
        {activeTab === 'users' && !dbError && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Users size={18} className="text-blue-600"/> Directorio de Usuarios 
                        <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">{filteredUsers.length}</span>
                    </h3>
                    
                    {/* BARRA DE FILTROS */}
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
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
                        <select 
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-500"
                            value={usersFilter.tier}
                            onChange={e => setUsersFilter({...usersFilter, tier: e.target.value})}
                        >
                            <option value="all">Plan: Todos</option>
                            <option value="premium">Premium</option>
                            <option value="free">Free</option>
                        </select>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-100">
                            <tr>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pagedUsers.length > 0 ? pagedUsers.map(u => {
                                const expDate = u.subscriptionEndsAt?.seconds 
                                    ? new Date(u.subscriptionEndsAt.seconds * 1000).toLocaleDateString() 
                                    : (u.currentPeriodEnd?.seconds ? new Date(u.currentPeriodEnd.seconds * 1000).toLocaleDateString() : 'Auto-renovable');

                                return (
                                <tr key={u.id} className={`transition-colors ${u.isSuspended ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50/50'}`}>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            {u.isAdmin && <Shield size={14} className="text-blue-500" title="Administrador"/>}
                                            <p className={`font-bold ${u.isSuspended ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{u.businessName || 'Sin nombre'}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-slate-500 font-medium">{u.email || u.id}</p>
                                            {u.isSuspended && <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-1"><Ban size={8}/> Suspendido</span>}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${u.role === 'carrier' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'} ${u.isSuspended ? 'opacity-50' : ''}`}>
                                            {u.role === 'carrier' ? 'Transportista' : 'Generador'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        {u.tier === 'premium' ? (
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-lg w-max ${u.isSuspended ? 'opacity-50' : ''}`}><AlertTriangle size={12}/> Premium</span>
                                                <span className={`text-[9px] font-bold text-slate-400 uppercase tracking-widest ${u.isSuspended ? 'opacity-50' : ''}`}>Vence: {expDate}</span>
                                            </div>
                                        ) : (
                                            <span className={`text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg ${u.isSuspended ? 'opacity-50' : ''}`}>Free</span>
                                        )}
                                    </td>
                                    <td className="p-5 text-right flex items-center justify-end gap-2">
                                        <button onClick={() => setViewingUser(u)} className={`px-4 py-2 border text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 ${u.isSuspended ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50' : 'bg-white border-slate-200 text-slate-700 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50'}`}>
                                            <Eye size={14}/> Detalles
                                        </button>
                                        <button onClick={() => setEditingUser(u)} className={`px-4 py-2 border text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 ${u.isSuspended ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-300' : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50'}`}>
                                            <Edit size={14}/> Editar
                                        </button>
                                    </td>
                                </tr>
                            )}) : (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center text-slate-500 font-medium">No se encontraron usuarios con esos filtros.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={pageUsers} totalItems={filteredUsers.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPageUsers} />
            </div>
        )}

        {/* MÓDULO: PUBLICACIONES (Mercado Global) */}
        {activeTab === 'publications' && !dbError && (
             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                 <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Package size={18} className="text-emerald-600"/> Publicaciones Globales
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full">{filteredPubs.length}</span>
                    </h3>

                    {/* BARRA DE FILTROS */}
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
        )}

        {/* MÓDULO: CONEXIONES (Matches y Tracking) */}
        {activeTab === 'connections' && !dbError && (
             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                 <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <LinkIcon size={18} className="text-purple-600"/> Tracking de Conexiones
                        <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full">{filteredConns.length}</span>
                    </h3>

                     {/* BARRA DE FILTROS */}
                     <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input 
                                type="text" 
                                placeholder="Buscar empresa o ID..." 
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
                                 <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Solicitud Inicial</th>
                                 <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus del Viaje</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                             {pagedConns.length > 0 ? pagedConns.map(conn => (
                                 <tr key={conn.id} className="hover:bg-slate-50/50 transition-colors">
                                     <td className="p-5">
                                         <p className="text-xs font-bold text-blue-600 mb-1.5 flex items-center gap-1.5"><MapPin size={12}/> De: <span className="text-slate-800">{conn.fromName}</span></p>
                                         <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle size={12}/> Para: <span className="text-slate-800">{conn.toName}</span></p>
                                         <p className="text-[9px] text-slate-400 font-mono mt-2">Ref: {conn.id.substring(0,8)}</p>
                                     </td>
                                     <td className="p-5">
                                         <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${conn.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                             {conn.status === 'accepted' ? 'Aceptada' : 'Pendiente'}
                                         </span>
                                     </td>
                                     <td className="p-5">
                                         {conn.status === 'accepted' ? (
                                             <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${conn.tripStatus === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-200' : conn.tripStatus === 'terminated' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                                {conn.tripStatus ? conn.tripStatus.toUpperCase() : 'SOLO CONTACTO'}
                                             </span>
                                         ) : (
                                            <span className="text-xs font-medium text-slate-400">-</span>
                                         )}
                                     </td>
                                 </tr>
                             )) : (
                                <tr>
                                    <td colSpan="3" className="p-10 text-center text-slate-500 font-medium">No hay conexiones que coincidan con la búsqueda.</td>
                                </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
                 <Pagination currentPage={pageConns} totalItems={filteredConns.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPageConns} />
             </div>
        )}

      </main>
    </div>
  );
};

// ============================================================================
// --- APP PRINCIPAL Y ENRUTAMIENTO ---
// ============================================================================
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