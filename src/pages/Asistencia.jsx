import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Asistencia() {
  const navigate = useNavigate();
  const [miembros, setMiembros] = useState([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const hoy = new Date().toISOString().split("T")[0];

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      // Cargar miembros activos
      const miembrosSnap = await getDocs(query(collection(db, "miembros"), orderBy("nombre")));
      const lista = miembrosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const activos = lista.filter(m => {
        if (!m.vencimiento) return false;
        const diff = Math.ceil((new Date(m.vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });
      setMiembros(activos);

      // Cargar asistencias de hoy
      const asistSnap = await getDocs(
        query(collection(db, "asistencias"), where("fecha", "==", hoy))
      );
      const ids = asistSnap.docs.map(d => d.data().miembroId);
      setAsistenciasHoy(ids);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(miembro) {
    if (asistenciasHoy.includes(miembro.id)) return;
    setRegistrando(miembro.id);
    try {
      await addDoc(collection(db, "asistencias"), {
        miembroId: miembro.id,
        nombre: miembro.nombre,
        fecha: hoy,
        hora: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
        creadoEn: new Date().toISOString(),
      });
      setAsistenciasHoy([...asistenciasHoy, miembro.id]);
    } catch (err) {
      console.error(err);
    } finally {
      setRegistrando(null);
    }
  }

  function getInitials(nombre) {
    return nombre?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?";
  }

  const miembrosFiltrados = miembros.filter(m =>
    m.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const asistieronHoy = miembros.filter(m => asistenciasHoy.includes(m.id));
  const pendientes = miembros.filter(m => !asistenciasHoy.includes(m.id));

  return (
    <div className="min-h-screen bg-manada-black px-4 py-6">

      {/* Topbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-8 h-8 border border-manada-border rounded-lg flex items-center justify-center text-manada-gray hover:border-manada-red hover:text-manada-red transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-white font-bold tracking-widest text-sm">ASISTENCIA</h1>
            <p className="text-manada-gray text-xs">{hoy}</p>
          </div>
        </div>
        <div className="bg-manada-dark border border-manada-border rounded-lg px-3 py-2 text-center">
          <p className="text-manada-red text-lg font-bold">{asistenciasHoy.length}</p>
          <p className="text-manada-gray text-xs">hoy</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-manada-dark border border-manada-border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{miembros.length}</p>
          <p className="text-manada-gray text-xs mt-0.5">Activos</p>
        </div>
        <div className="bg-green-950 border border-green-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{asistenciasHoy.length}</p>
          <p className="text-manada-gray text-xs mt-0.5">Asistieron</p>
        </div>
        <div className="bg-manada-dark border border-manada-border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-manada-gray">{pendientes.length}</p>
          <p className="text-manada-gray text-xs mt-0.5">Pendientes</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-manada-dark border border-manada-border rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
        <span className="text-manada-gray">🔍</span>
        <input
          type="text"
          placeholder="Buscar miembro..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="bg-transparent text-white text-sm flex-1 outline-none placeholder-manada-gray"
        />
      </div>

      {loading ? (
        <div className="text-center text-manada-gray text-sm mt-10">Cargando...</div>
      ) : miembrosFiltrados.length === 0 ? (
        <div className="text-center text-manada-gray text-sm mt-10">No hay miembros activos</div>
      ) : (
        <div className="flex flex-col gap-3">

          {/* Pendientes primero */}
          {miembrosFiltrados.filter(m => !asistenciasHoy.includes(m.id)).map(m => (
            <div
              key={m.id}
              className="bg-manada-dark border border-manada-border rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-manada-card border border-manada-border flex items-center justify-center text-sm font-bold text-manada-gray flex-shrink-0">
                {getInitials(m.nombre)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{m.nombre}</p>
                <p className="text-manada-gray text-xs mt-0.5">{m.tipo}</p>
              </div>
              <button
                onClick={() => handleCheckIn(m)}
                disabled={registrando === m.id}
                className="bg-manada-red hover:bg-manada-darkred text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {registrando === m.id ? "..." : "CHECK IN"}
              </button>
            </div>
          ))}

          {/* Ya asistieron */}
          {miembrosFiltrados.filter(m => asistenciasHoy.includes(m.id)).map(m => (
            <div
              key={m.id}
              className="bg-green-950 border border-green-800 rounded-xl px-4 py-3 flex items-center gap-3 opacity-75"
            >
              <div className="w-10 h-10 rounded-full bg-green-900 border border-green-700 flex items-center justify-center text-sm font-bold text-green-400 flex-shrink-0">
                {getInitials(m.nombre)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{m.nombre}</p>
                <p className="text-green-500 text-xs mt-0.5">✓ Asistió hoy</p>
              </div>
              <span className="text-green-400 text-xl">✓</span>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}