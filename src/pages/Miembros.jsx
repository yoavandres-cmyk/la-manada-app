import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Miembros() {
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function cargarMiembros() {
      try {
        const q = query(collection(db, "miembros"), orderBy("nombre"));
        const snap = await getDocs(q);
        const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMiembros(lista);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    cargarMiembros();
  }, []);

  function getEstado(vencimiento) {
    if (!vencimiento) return "vencido";
    const hoy = new Date();
    const vence = new Date(vencimiento);
    const diff = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "vencido";
    if (diff <= 3) return "por_vencer";
    return "vigente";
  }

  function getBadge(estado) {
    if (estado === "vigente") return <span className="text-xs font-bold px-2 py-1 rounded-md bg-green-950 text-green-400">Vigente</span>;
    if (estado === "por_vencer") return <span className="text-xs font-bold px-2 py-1 rounded-md bg-yellow-950 text-yellow-400">3 días</span>;
    return <span className="text-xs font-bold px-2 py-1 rounded-md bg-red-950 text-manada-red">Vencido</span>;
  }

  function getInitials(nombre) {
    return nombre?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?";
  }

  const miembrosFiltrados = miembros
    .filter(m => filtro === "todos" ? true : getEstado(m.vencimiento) === filtro)
    .filter(m => m.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

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
          <h1 className="text-white font-bold tracking-widest text-sm">MIEMBROS</h1>
        </div>
        <button
          onClick={() => navigate("/nuevo-miembro")}
          className="bg-manada-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-manada-darkred transition-colors"
        >
          + Nuevo
        </button>
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

      {/* Filtros */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: "todos", label: "Todos" },
          { key: "vigente", label: "Vigentes" },
          { key: "por_vencer", label: "Por vencer" },
          { key: "vencido", label: "Vencidos" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              filtro === f.key
                ? "bg-manada-red text-white"
                : "bg-manada-dark border border-manada-border text-manada-gray"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center text-manada-gray text-sm mt-10">Cargando miembros...</div>
      ) : miembrosFiltrados.length === 0 ? (
        <div className="text-center text-manada-gray text-sm mt-10">
          {miembros.length === 0 ? "No hay miembros registrados aún" : "No se encontraron resultados"}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {miembrosFiltrados.map(m => {
            const estado = getEstado(m.vencimiento);
            return (
              <div
                key={m.id}
                onClick={() => navigate(`/miembro/${m.id}`)}
                className="bg-manada-dark border border-manada-border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-manada-red transition-colors cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  estado === "vigente" ? "bg-red-950 text-manada-red border border-manada-red border-opacity-50" : "bg-manada-card text-manada-gray"
                }`}>
                  {getInitials(m.nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{m.nombre}</p>
                  <p className="text-manada-gray text-xs mt-0.5">{m.tipo} · Vence {m.vencimiento}</p>
                </div>
                {getBadge(estado)}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}