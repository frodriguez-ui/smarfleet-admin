import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Truck, Package, LogOut, 
  Search, AlertTriangle, CheckCircle, XCircle, X,
  MapPin, Calendar, Link as LinkIcon, Trash2, Edit
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collectionGroup, collection, query, onSnapshot, 
  doc, getDoc, updateDoc, deleteDoc
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
                isAdmin: formData.isAdmin || false
            });
            onClose();
        } catch (e) {
            alert("Error al actualizar: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800">Gestionar Usuario</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                </div>

                <div className="space-y-5">
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
                            <p className="text-xs font-bold text-blue-800">Privilegios Admin</p>
                            <p className="text-[10px] text-blue-600">Permite acceso a este panel.</p>
                        </div>
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-blue-600"
                            checked={formData.isAdmin || false}
                            onChange={e => setFormData({...formData, isAdmin: e.target.checked})}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl mt-8 hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                    {loading ? "Guardando..." : "Actualizar Perfil"}
                </button>
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
      const profileSnap = await getDoc(doc(db, 'artifacts', projectId, 'users', user.uid, 'profile', 'data'));
      
      if (profileSnap.exists() && profileSnap.data().isAdmin === true) {
         navigate('/dashboard');
      } else {
         await signOut(auth);
         setError("Acceso denegado. No eres administrador.");
      }
    } catch (err) {
      setError("Credenciales incorrectas o acceso restringido.");
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
  const [editingUser, setEditingUser] = useState(null);
  
  // Nuevo estado para capturar errores de índices o permisos
  const [dbError, setDbError] = useState(null);

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
            setDbError(null); // Limpiamos errores si tiene éxito
        },
        (error) => {
            console.error("Error al cargar usuarios:", error);
            if (error.code === 'failed-precondition' || error.message.includes('index')) {
                setDbError("Falta crear el índice en Firebase. Por favor, abre la consola del navegador (F12) y haz clic en el enlace azul que Firebase generó para crearlo.");
            } else if (error.code === 'permission-denied') {
                setDbError("Permiso denegado. Las reglas de Firebase están bloqueando el acceso o tu usuario no es administrador.");
            } else {
                setDbError(error.message);
            }
        }
    );

    // 2. Viajes (Transportistas)
    const qTrips = query(collection(db, 'artifacts', projectId, 'public', 'data', 'trips'));
    const unsubTrips = onSnapshot(qTrips, s => setTrips(s.docs.map(d => ({id: d.id, type: 'trip', ...d.data()}))));

    // 3. Cargas (Generadores)
    const qLoads = query(collection(db, 'artifacts', projectId, 'public', 'data', 'loads'));
    const unsubLoads = onSnapshot(qLoads, s => setLoads(s.docs.map(d => ({id: d.id, type: 'load', ...d.data()}))));

    // 4. Conexiones (Matches y Chats)
    const qConns = query(collection(db, 'artifacts', projectId, 'public', 'data', 'connections'));
    const unsubConns = onSnapshot(qConns, s => setConnections(s.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { unsubUsers(); unsubTrips(); unsubLoads(); unsubConns(); };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // Función para moderación (borrar publicaciones)
  const handleDeletePublication = async (id, type) => {
      if(!window.confirm("¿Seguro que deseas eliminar esta publicación permanentemente?")) return;
      try {
          const collectionName = type === 'trip' ? 'trips' : 'loads';
          await deleteDoc(doc(db, 'artifacts', projectId, 'public', 'data', collectionName, id));
      } catch (error) {
          alert("Error al eliminar: " + error.message);
      }
  };

  // Combinar cargas y viajes para la vista de Publicaciones
  const allPublications = [...trips, ...loads].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  return (
    <div className="min-h-screen bg-slate-50 flex text-left font-sans">
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}

      {/* --- MENÚ LATERAL --- */}
      <aside className="w-64 bg-slate-900 text-white fixed h-full flex flex-col p-6 z-20">
        <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-blue-600 rounded-lg"><Shield size={20}/></div>
            <span className="font-black text-xl tracking-tighter">SMAR<span className="text-blue-500">ADMIN</span></span>
        </div>
        
        <nav className="flex-1 space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-blue-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Search size={18}/> Resumen
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-blue-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Users size={18}/> Usuarios
            </button>
            <button onClick={() => setActiveTab('publications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'publications' ? 'bg-blue-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Package size={18}/> Publicaciones
            </button>
            <button onClick={() => setActiveTab('connections')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'connections' ? 'bg-blue-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <LinkIcon size={18}/> Conexiones
            </button>
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 text-slate-400 hover:text-white font-bold text-sm p-4 rounded-xl hover:bg-slate-800 transition-all">
            <LogOut size={18}/> Cerrar Sesión
        </button>
      </aside>

      {/* --- ÁREA DE CONTENIDO PRINCIPAL --- */}
      <main className="ml-64 flex-1 p-10 max-w-7xl">
        <header className="mb-10">
            <h2 className="text-3xl font-black text-slate-800">Panel de Control</h2>
            <p className="text-slate-500 font-medium mt-1">Monitoreo en tiempo real de la red Smarfleet</p>
        </header>

        {/* ALERTA DE ERROR DE BASE DE DATOS */}
        {dbError && (
            <div className="mb-8 bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-2xl text-rose-700 shadow-sm animate-in fade-in">
                <h4 className="font-black text-lg mb-2 flex items-center gap-2">
                    <AlertTriangle /> Error de Acceso a Firebase
                </h4>
                <p className="font-medium text-sm leading-relaxed">{dbError}</p>
            </div>
        )}

        {/* MÓDULO: RESUMEN (OVERVIEW) */}
        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Users size={24}/></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Usuarios Registrados</p>
                    <p className="text-4xl font-black text-slate-800 mt-1">{users.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4"><Truck size={24}/></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Viajes Publicados</p>
                    <p className="text-4xl font-black text-slate-800 mt-1">{trips.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><Package size={24}/></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cargas Disponibles</p>
                    <p className="text-4xl font-black text-slate-800 mt-1">{loads.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4"><LinkIcon size={24}/></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Matches / Conexiones</p>
                    <p className="text-4xl font-black text-slate-800 mt-1">{connections.length}</p>
                </div>
            </div>
        )}

        {/* MÓDULO: USUARIOS */}
        {activeTab === 'users' && !dbError && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Directorio de Usuarios</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Rol</th>
                                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Plan</th>
                                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            {u.isAdmin && <Shield size={14} className="text-blue-500" title="Administrador"/>}
                                            <p className="font-bold text-slate-800">{u.businessName || 'Sin nombre'}</p>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">{u.email || u.id}</p>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'carrier' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {u.role === 'carrier' ? 'Transportista' : 'Generador'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        {u.tier === 'premium' ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full w-max"><AlertTriangle size={12}/> Premium</span>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-500">Free</span>
                                        )}
                                    </td>
                                    <td className="p-5 text-right">
                                        <button onClick={() => setEditingUser(u)} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors">
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* MÓDULO: PUBLICACIONES (Mercado Global) */}
        {activeTab === 'publications' && (
             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                 <div className="p-5 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800">Todas las Publicaciones (Mercado)</h3>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-left">
                         <thead className="bg-slate-50 border-b border-slate-100">
                             <tr>
                                 <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Tipo / Empresa</th>
                                 <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Ruta (Origen - Destino)</th>
                                 <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Fecha / Estatus</th>
                                 <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                             {allPublications.map(pub => (
                                 <tr key={pub.id} className="hover:bg-slate-50/50 transition-colors">
                                     <td className="p-5">
                                         <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${pub.type === 'trip' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                             {pub.type === 'trip' ? 'Viaje' : 'Carga'}
                                         </span>
                                         <p className="font-bold text-slate-800 text-sm">{pub.company}</p>
                                         <p className="text-xs text-slate-500 font-mono">ID: {pub.customId || pub.id.substring(0,6)}</p>
                                     </td>
                                     <td className="p-5">
                                         <p className="font-bold text-slate-800 text-sm">{pub.originCity || pub.originState}</p>
                                         <p className="text-xs text-slate-500">{pub.destinationCity || pub.destinationState}</p>
                                     </td>
                                     <td className="p-5">
                                         <p className="font-bold text-slate-800 text-sm flex items-center gap-1"><Calendar size={12}/> {pub.date || 'Fija'}</p>
                                         <span className={`text-[10px] font-bold ${pub.status === 'active' ? 'text-emerald-500' : pub.status === 'completed' ? 'text-blue-500' : 'text-amber-500'}`}>
                                            {pub.status === 'active' ? 'ACTIVA' : pub.status.toUpperCase()}
                                         </span>
                                     </td>
                                     <td className="p-5 text-right">
                                         <button onClick={() => handleDeletePublication(pub.id, pub.type)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors" title="Borrar Publicación">
                                             <Trash2 size={16}/>
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>
        )}

        {/* MÓDULO: CONEXIONES (Matches y Tracking) */}
        {activeTab === 'connections' && (
             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                 <div className="p-5 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800">Tracking de Conexiones (Matches)</h3>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-left">
                         <thead className="bg-slate-50 border-b border-slate-100">
                             <tr>
                                 <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Participantes</th>
                                 <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Estatus de Solicitud</th>
                                 <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Estatus del Viaje</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                             {connections.map(conn => (
                                 <tr key={conn.id} className="hover:bg-slate-50/50 transition-colors">
                                     <td className="p-5">
                                         <p className="text-xs font-bold text-blue-600 mb-1">De: <span className="text-slate-800">{conn.fromName}</span></p>
                                         <p className="text-xs font-bold text-emerald-600">Para: <span className="text-slate-800">{conn.toName}</span></p>
                                     </td>
                                     <td className="p-5">
                                         <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${conn.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                             {conn.status === 'accepted' ? 'Aceptada' : 'Pendiente'}
                                         </span>
                                     </td>
                                     <td className="p-5">
                                         {conn.status === 'accepted' ? (
                                             <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${conn.tripStatus === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-200' : conn.tripStatus === 'terminated' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {conn.tripStatus ? conn.tripStatus.toUpperCase() : 'EN PROCESO'}
                                             </span>
                                         ) : (
                                            <span className="text-xs text-slate-400">-</span>
                                         )}
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
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