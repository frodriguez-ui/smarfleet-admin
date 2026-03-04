import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, LayoutDashboard, Users, Truck, Package, LogOut, 
  Search, Lock, AlertTriangle, TrendingUp, CheckCircle, XCircle 
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collectionGroup, collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';

// 🔒 Leemos las variables de entorno de Vite (.env local o Vercel)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'smarfleet-d7807';

// ============================================================================
// --- COMPONENTE DE LOGIN (EXCLUSIVO ADMIN) ---
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
      
      // VERIFICACIÓN DE SEGURIDAD: Comprobar si es admin
      const profileSnap = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'));
      
      if (profileSnap.exists() && (profileSnap.data().isAdmin === true || profileSnap.data().role === 'admin')) {
         navigate('/dashboard');
      } else {
         await signOut(auth);
         setError("Acceso denegado. Esta cuenta no tiene privilegios de administrador.");
      }
    } catch (err) {
      setError("Credenciales incorrectas o error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden text-left">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      <div className="bg-slate-800 p-8 md:p-12 rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 border border-slate-700">
        <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Backoffice</h1>
        <p className="text-slate-400 mb-8 font-medium">Acceso restringido para personal autorizado.</p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl mb-6 flex items-start gap-3 text-sm">
             <AlertTriangle size={18} className="shrink-0 mt-0.5" />
             <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Correo Corporativo</label>
            <input 
              type="email" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
              value={email} onChange={e => setEmail(e.target.value)} required 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Contraseña Maestra</label>
            <input 
              type="password" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
              value={password} onChange={e => setPassword(e.target.value)} required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-3.5 mt-4 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Lock size={18}/> Iniciar Sesión Segura</>}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// --- DASHBOARD ADMIN PRINCIPAL ---
// ============================================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Datos Globales
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loads, setLoads] = useState([]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  useEffect(() => {
    // CARGAR TODOS LOS USUARIOS (Usando collectionGroup 'profile')
    const qUsers = query(collectionGroup(db, 'profile'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
        const allUsers = snap.docs
          .map(d => ({ id: d.id, refPath: d.ref.path, ...d.data() }))
          // Filtrar solo los que pertenecen a esta app
          .filter(u => u.refPath.includes(appId)); 
        setUsers(allUsers);
    });

    // CARGAR TODOS LOS VIAJES (TRIPS)
    const qTrips = query(collection(db, 'artifacts', appId, 'public', 'data', 'trips'));
    const unsubTrips = onSnapshot(qTrips, s => setTrips(s.docs.map(d => ({id: d.id, ...d.data()}))));

    // CARGAR TODAS LAS CARGAS (LOADS)
    const qLoads = query(collection(db, 'artifacts', appId, 'public', 'data', 'loads'));
    const unsubLoads = onSnapshot(qLoads, s => setLoads(s.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { unsubUsers(); unsubTrips(); unsubLoads(); };
  }, []);

  // --- COMPONENTES INTERNOS DE PESTAÑAS ---
  const OverviewTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-black text-slate-800">Resumen Global</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Users size={24}/></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Usuarios Totales</p>
              <p className="text-3xl font-black text-slate-800">{users.length}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Truck size={24}/></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Unidades Publicadas</p>
              <p className="text-3xl font-black text-slate-800">{trips.length}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Package size={24}/></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Cargas Activas</p>
              <p className="text-3xl font-black text-slate-800">{loads.filter(l => l.status === 'active').length}</p>
            </div>
        </div>
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-black text-slate-800">Gestión de Usuarios</h2>
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar empresa o correo..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm" />
         </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-4">Empresa / Nombre</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                   <p className="font-bold text-slate-800">{u.businessName || 'Sin Nombre'}</p>
                   <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${u.role === 'carrier' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                     {u.role}
                   </span>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-fit ${u.tier === 'premium' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500'}`}>
                     {u.tier === 'premium' ? <><TrendingUp size={10}/> Premium</> : 'Free'}
                   </span>
                </td>
                <td className="px-6 py-4">
                   <button className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-lg mr-2 transition-colors">Editar</button>
                   <button className="text-rose-600 hover:text-rose-800 font-bold text-xs bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">Suspender</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex text-left font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full border-r border-slate-800">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
           <ShieldCheck size={28} className="text-blue-500 mr-2" />
           <span className="text-xl font-black text-white tracking-tight">Admin<span className="text-blue-500">Panel</span></span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
             <LayoutDashboard size={20} /> Resumen
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
             <Users size={20} /> Usuarios
          </button>
          <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all hover:bg-slate-800 hover:text-white text-slate-500`} disabled>
             <Truck size={20} /> Cargas / Viajes
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-rose-400 hover:bg-rose-500/10 transition-colors">
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="ml-64 flex-1 p-10">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
      </main>
    </div>
  );
};

// ============================================================================
// --- ENRUTADOR PRINCIPAL ---
// ============================================================================
const MainApp = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Verificar si tiene perfil admin
        const profileSnap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data'));
        if (profileSnap.exists() && (profileSnap.data().isAdmin === true || profileSnap.data().role === 'admin')) {
            setUser(u);
            setIsAdmin(true);
        } else {
            setUser(null);
            setIsAdmin(false);
            await signOut(auth); // Lo saca si no es admin
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user && isAdmin ? <Navigate to="/dashboard" replace /> : <AdminLogin />} />
        <Route path="/dashboard" element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default MainApp;