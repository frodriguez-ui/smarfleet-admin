import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { 
  Shield, Users, User as UserIcon, Truck, Package, LogOut, 
  AlertTriangle, CheckCircle, X, MapPin, Calendar, Link as LinkIcon, Edit,
  BarChart3, Activity, Ban, Eye, FileText, Phone, Mail, ArrowRight,
  Bell, DollarSign, HeartHandshake, Clock, ShieldCheck, RotateCcw, MessageCircle, Flag
} from 'lucide-react';

// --- IMPORTACIONES DE TUS COMPONENTES MODULARIZADOS ---
import { OverviewTab } from './Components/Admin/OverviewTab';
import { NotificationsTab } from './Components/Admin/NotificationsTab';
import { UsersTab } from './Components/Admin/UsersTab';
import { PublicationsTab } from './Components/Admin/PublicationsTab';
import { ConnectionsTab } from './Components/Admin/ConnectionsTab';

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
// --- COMPONENTES MODULARES (MODALES) ---
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

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-slate-50 rounded-[2rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 overflow-hidden" onClick={e => e.stopPropagation()}>
                
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

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
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

const ConnectionDetailModal = ({ conn, onClose, trips, loads, handleResolveDispute, resolvingDispute, users, setViewingUser }) => {
    const [messages, setMessages] = useState([]);
    const [trackingHistory, setTrackingHistory] = useState([]);
    const [connReports, setConnReports] = useState([]); 
    const [isLoadingChat, setIsLoadingChat] = useState(true);
    const [mapError, setMapError] = useState(false);
    
    const mapRef = useRef(null);
    const messagesEndRef = useRef(null); // Ref para auto-scroll del chat

    const post = [...trips, ...loads].find(p => p.id === conn.postId);
    const isDisputed = conn.isDisputed === true || conn.tripStatus === 'disputed';
    const isFunded = conn.paymentStatus === 'funded';

    // Identificar a los usuarios de forma robusta
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

    // 1. CARGAR CHAT Y TRACKING SIN DEPENDENCIA DE ÍNDICES COMPUESTOS (Solución al chat en blanco)
    useEffect(() => {
        setIsLoadingChat(true);

        // A. Consultar Chat (Ordenando en memoria para evitar colapsos por falta de índices)
        const qMsg = collection(db, 'artifacts', projectId, 'public', 'data', 'connections', conn.id, 'messages');
        const unsubMsg = onSnapshot(qMsg, snap => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Ordenamos los mensajes localmente por fecha
            msgs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
            setMessages(msgs);
            setIsLoadingChat(false);
        }, (err) => {
            console.error("Error cargando chat:", err);
            setIsLoadingChat(false);
        });

        // B. Consultar Historial GPS (También en memoria)
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
            console.warn("Aviso: No se cargó trackingLogs. Usando fallback.", err);
            if (conn.trackingHistory && Array.isArray(conn.trackingHistory)) {
                setTrackingHistory(conn.trackingHistory);
            }
        });

        return () => { unsubMsg(); unsubTrack(); };
    }, [conn.id, JSON.stringify(conn.trackingHistory)]);

    // 1.5 Auto-Scroll para el Chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // 1.8 CARGAR DENUNCIAS / REPORTES LIGADOS A ESTE VIAJE
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

    // 2. INICIALIZAR Y DIBUJAR MAPA NATIVO (Ajustado para enfocar mejor)
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
                        // Asegurar que el div se haya renderizado aplicando un pequeño retraso antes de hacer fitBounds
                        if (hasRealRoute) {
                            setTimeout(() => {
                                if (mapRef.current) map.fitBounds(realRouteBounds, 50); // 50px de padding para no pegarlo a las orillas
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-slate-50 rounded-[2rem] w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 overflow-hidden" onClick={e => e.stopPropagation()}>
                
                <div className="bg-white px-6 py-4 md:px-8 md:py-6 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isDisputed ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                            {isDisputed ? <AlertTriangle size={24}/> : <LinkIcon size={24}/>}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-black text-slate-800 leading-none flex flex-wrap items-center gap-2">
                                Detalles de Operación {isDisputed && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">En Disputa</span>}
                            </h2>
                            <p className="text-xs text-slate-500 font-mono mt-1.5 truncate">CONN: {conn.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition-colors shrink-0"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex flex-col gap-5">
                    
                    {/* 🌟 NUEVA TARJETA DE CONTEXTO: RUTA Y PARTICIPANTES 🌟 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shrink-0 w-full mb-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
                        
                        <div className="flex-1 w-full relative z-10">
                            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin size={14} className="text-blue-500"/> Ruta de la Operación</h4>
                            {post ? (
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="font-black text-slate-800 text-sm">{post.originCity || post.originState}</span>
                                        <ArrowRight size={14} className="text-slate-400 shrink-0"/>
                                        <span className="font-black text-slate-800 text-sm">{post.destinationCity || post.destinationState}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                                            POST ID: {post.customId || post.id.substring(0,8).toUpperCase()}
                                        </span>
                                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                            <Truck size={10}/> {post.vehicleType || post.loadType || 'Vehículo no espec.'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-slate-500 text-xs font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 block w-max">Publicación original archivada o eliminada.</span>
                            )}
                        </div>

                        <div className="flex-1 w-full border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col gap-3 relative z-10">
                            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={14} className="text-emerald-500"/> Participantes a Evaluar</h4>
                            <div className="flex items-center justify-between bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 transition-colors hover:bg-emerald-50">
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5"><Package size={12}/> Generador</span>
                                <button onClick={(e) => { e.stopPropagation(); setViewingUser(shipperUser); }} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 bg-white px-3 py-1.5 rounded shadow-sm border border-slate-200 hover:border-blue-300">
                                    <span className="truncate max-w-[120px]">{shipperUser?.businessName || shipperUser?.id.substring(0,6)}</span> <Eye size={14}/>
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 transition-colors hover:bg-indigo-50">
                                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5"><Truck size={12}/> Transportista</span>
                                <button onClick={(e) => { e.stopPropagation(); setViewingUser(carrierUser); }} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 bg-white px-3 py-1.5 rounded shadow-sm border border-slate-200 hover:border-blue-300">
                                    <span className="truncate max-w-[120px]">{carrierUser?.businessName || carrierUser?.id.substring(0,6)}</span> <Eye size={14}/>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm w-full overflow-x-auto hide-scrollbar shrink-0">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Truck size={14}/> Hoja de Ruta Operativa</h4>
                        <div className="min-w-[600px] relative px-4 pb-2">
                            <div className="absolute top-5 left-[3.5rem] right-[3.5rem] h-1 bg-slate-100 rounded-full z-0"></div>
                            <div className="absolute top-5 left-[3.5rem] h-1 bg-emerald-500 rounded-full z-0 transition-all duration-700" style={{ width: `calc((100% - 7rem) * ${currentStepIndex / (trackingSteps.length - 1)})` }}></div>

                            <div className="flex justify-between relative z-10">
                                {trackingSteps.map((step, idx) => {
                                    const isCompleted = idx <= currentStepIndex;
                                    const isCurrent = idx === currentStepIndex;
                                    return (
                                        <div key={step.id} className="flex flex-col items-center w-20 relative">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500 ${isCompleted ? 'bg-emerald-500 text-white scale-110' : 'bg-slate-100 text-slate-400'}`}>
                                                <step.icon size={16} className={isCurrent && idx !== trackingSteps.length - 1 ? 'animate-pulse' : ''} />
                                            </div>
                                            <p className={`text-[9px] font-black uppercase tracking-wider mt-3 text-center leading-tight ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                                            <p className="text-[8px] text-slate-500 font-medium text-center mt-1">{step.time ? safeDateStr(step.time) : '--/--/--'}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Disputa */}
                    {isDisputed && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
                            <div className="w-full md:flex-1">
                                <h3 className="font-black text-red-800 text-xs flex items-center gap-1.5 mb-1.5"><AlertTriangle size={14}/> Disputa Activa (Fondos Congelados)</h3>
                                <p className="text-[11px] text-red-700 leading-tight"><strong>Motivo:</strong> "{conn.disputeDetails?.reason || 'No especificado'}" — <span className="opacity-80">Abierta por: {conn.disputeDetails?.openedByName}</span></p>
                            </div>
                            
                            {isFunded ? (
                                <div className="flex flex-row gap-2 mt-1 md:mt-0 w-full md:w-auto shrink-0">
                                    <button 
                                        disabled={resolvingDispute === conn.id}
                                        onClick={() => handleResolveDispute(conn, 'carrier')}
                                        className="flex-1 md:flex-none py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {resolvingDispute === conn.id ? <Activity size={14} className="animate-spin"/> : <Truck size={14}/>} 
                                        Pagar a Transp.
                                    </button>
                                    <button 
                                        disabled={resolvingDispute === conn.id}
                                        onClick={() => handleResolveDispute(conn, 'shipper')}
                                        className="flex-1 md:flex-none py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {resolvingDispute === conn.id ? <Activity size={14} className="animate-spin"/> : <RotateCcw size={14}/>} 
                                        Reembolsar
                                    </button>
                                </div>
                            ) : (
                                <div className="text-[10px] font-bold text-red-600 px-3 py-1.5 bg-red-100 rounded-lg w-full md:w-auto text-center shrink-0">
                                    Pago externo. Intervención manual requerida.
                                </div>
                            )}
                        </div>
                    )}

                    {/* 🌟 Reportes de Usuarios 🌟 */}
                    {connReports.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl shadow-sm flex flex-col items-start justify-between gap-4 shrink-0">
                            <div className="w-full">
                                <h3 className="font-black text-orange-800 text-xs flex items-center gap-1.5 mb-2"><Flag size={14}/> Reportes de Usuarios ({connReports.length})</h3>
                                <div className="grid gap-2">
                                    {connReports.map(rep => (
                                        <div key={rep.id} className="text-[11px] text-orange-700 bg-white/60 p-3 rounded-lg border border-orange-200">
                                            <p className="mb-1"><strong>Motivo:</strong> "{rep.reason}"</p>
                                            {rep.details && <p className="italic text-orange-600 mb-2">"{rep.details}"</p>}
                                            <div className="flex justify-between items-center bg-orange-100/50 p-1.5 rounded text-[9px] font-bold">
                                                <span>Denunciado: <span className="font-black text-orange-800">{rep.reportedName}</span></span>
                                                <span className="text-orange-600">Reportó: {rep.reporterName}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row gap-5 h-[500px] md:h-[450px]">
                        
                        <div className="w-full lg:w-1/2 flex flex-col gap-5 h-full">
                            
                            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><DollarSign size={14}/> Acuerdo Comercial</h4>
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Monto Acordado</p>
                                        <p className="text-2xl font-black text-slate-800">${Number(conn.proposalAmount || 0).toLocaleString()} MXN</p>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${conn.paymentStatus === 'funded' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                        {conn.paymentStatus === 'funded' ? 'Pago Seguro Retenido' : conn.paymentStatus || 'Pendiente'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                                    <span className="font-bold text-slate-600">Vía:</span> 
                                    {conn.proposalEscrow ? <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1"><ShieldCheck size={12}/> Stripe (Seguro)</span> : <span className="text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1"><HeartHandshake size={12}/> Por fuera</span>}
                                </div>
                            </div>

                            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[300px]">
                                <div className="flex justify-between items-center mb-4 shrink-0">
                                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> Trayecto Real</h4>
                                    {conn.liveLocation && (
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5">
                                            <Activity size={10} className="animate-pulse"/> Último GPS detectado
                                        </span>
                                    )}
                                </div>

                                <div className="w-full flex-1 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200 shadow-inner">
                                    {mapError ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-rose-50 p-6 text-center m-2 rounded-xl border-2 border-rose-200 shadow-inner">
                                            <AlertTriangle size={32} className="text-rose-500 mb-3"/>
                                            <p className="text-xs font-black uppercase tracking-widest text-rose-800 mb-1.5">No se pudo cargar el mapa</p>
                                            <p className="text-[11px] text-rose-600 leading-relaxed font-medium">Es posible que el dominio desde donde abres esta página no esté autorizado en las restricciones de tu API Key de Google Cloud. Por favor, asegúrate de permitir las variaciones de dominios en la consola de Google.</p>
                                        </div>
                                    ) : (
                                        <div ref={mapRef} className="absolute inset-0 flex items-center justify-center bg-slate-50">
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                <MapPin size={24} className="animate-pulse mb-2 text-slate-300"/>
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Iniciando Google Maps...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-1/2 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2"><MessageCircle size={16} className="text-blue-500"/> Historial de Conversación</h3>
                                <p className="text-[10px] text-slate-500 font-medium mt-1">Los administradores tienen acceso de solo lectura para auditoría y resolución de disputas.</p>
                            </div>
                            
                            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-50/50 space-y-4">
                                {isLoadingChat ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Activity size={32} className="mb-2 opacity-50 animate-spin"/>
                                        <p className="text-xs font-bold">Cargando conversación...</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <MessageCircle size={32} className="mb-2 opacity-50"/>
                                        <p className="text-xs font-bold">No hay mensajes registrados</p>
                                    </div>
                                ) : (
                                    messages.map(m => {
                                        const isFromShipper = m.senderId === conn.fromUid;
                                        return (
                                            <div key={m.id} className={`flex flex-col w-full ${isFromShipper ? 'items-start' : 'items-end'}`}>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                                                    {isFromShipper ? conn.fromName : conn.toName}
                                                </span>
                                                <div className={`p-3 rounded-2xl text-xs font-medium shadow-sm max-w-[85%] ${isFromShipper ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
                                                    {m.text || m.message || 'Mensaje de sistema'}
                                                </div>
                                                <span className="text-[8px] text-slate-400 mt-1 px-1">{formatMessageTime(m.timestamp)}</span>
                                            </div>
                                        )
                                    })
                                )}
                                {/* Ancla para auto-scroll */}
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

  // --- ESTADOS PARA FILTROS (INCLUYE ORDENAMIENTO POR RECIENTES) ---
  const [usersFilter, setUsersFilter] = useState({ search: '', role: 'all', tier: 'all', status: 'all' });
  const [pubsFilter, setPubsFilter] = useState({ search: '', type: 'all', status: 'all' });
  const [connsFilter, setConnsFilter] = useState({ search: '', status: 'all', sortBy: 'recent' });
  
  // Estado para Gráficas Analíticas
  const [trendMonthsRange, setTrendMonthsRange] = useState(6);
  const [resolvingDispute, setResolvingDispute] = useState(null); 

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

  // 🌟 SE APLICA EL ORDENAMIENTO (MÁS RECIENTES/MÁS ANTIGUAS) A LAS CONEXIONES
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

      // ORDENAR POR FECHA
      if (connsFilter.sortBy === 'oldest') {
          return result.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      } else {
          return result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      }
  }, [connections, connsFilter, allPublications, reports]);

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

  return (
    <div className="min-h-screen bg-slate-50 flex text-left font-sans relative">
      
      {/* MODALES EN CAPAS SUPERIORES */}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
      
      {/* AVISO IMPORTANTE DE ARQUITECTURA: Modal de Conexión se renderiza antes que UserDetailModal 
          para garantizar que el modal del perfil de usuario pueda abrirse "por encima" de este. */}
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
        {activeTab === 'overview' && <OverviewTab stats={stats} users={users} trips={trips} loads={loads} connections={connections} trendMonthsRange={trendMonthsRange} setTrendMonthsRange={setTrendMonthsRange} />}
        {activeTab === 'notifications' && <NotificationsTab notifForm={notifForm} setNotifForm={setNotifForm} handleSendGlobalNotification={handleSendGlobalNotification} sendingNotif={sendingNotif} users={users} />}
        {activeTab === 'users' && <UsersTab usersFilter={usersFilter} setUsersFilter={setUsersFilter} filteredUsers={filteredUsers} pagedUsers={pagedUsers} pageUsers={pageUsers} setPageUsers={setPageUsers} ITEMS_PER_PAGE={ITEMS_PER_PAGE} setViewingUser={setViewingUser} setEditingUser={setEditingUser} handleDeleteUser={handleDeleteUser} safeDateStr={safeDateStr} />}
        {activeTab === 'publications' && <PublicationsTab pubsFilter={pubsFilter} setPubsFilter={setPubsFilter} filteredPubs={filteredPubs} pagedPubs={pagedPubs} pagePubs={pagePubs} setPagePubs={setPagePubs} ITEMS_PER_PAGE={ITEMS_PER_PAGE} handleDeletePublication={handleDeletePublication} safeDateStr={safeDateStr} />}
        {activeTab === 'connections' && <ConnectionsTab connsFilter={connsFilter} setConnsFilter={setConnsFilter} filteredConns={filteredConns} pagedConns={pagedConns} pageConns={pageConns} setPageConns={setPageConns} ITEMS_PER_PAGE={ITEMS_PER_PAGE} setViewingConnection={setViewingConnection} safeDateStr={safeDateStr} reports={reports} allPublications={allPublications} />}

      </main>
    </div>
  );
}