import { useState, useEffect } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../firebase/config";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activos: 0,
    porVencer: 0,
    asistenciaHoy: 0,
    ingresosMes: 0,
    egresosMes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarStats();
  }, []);

  async function cargarStats() {
    try {
      const hoy = new Date();
      const hoyStr = hoy.toISOString().split("T")[0];
      const mesActual = hoy.toISOString().slice(0, 7);

      // Miembros
      const miembrosSnap = await getDocs(collection(db, "miembros"));
      const miembros = miembrosSnap.docs.map(d => d.data());

      let activos = 0;
      let porVencer = 0;

      miembros.forEach(m => {
        if (!m.vencimiento) return;
        const vence = new Date(m.vencimiento);
        const diff = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));
        if (diff >= 0) activos++;
        if (diff >= 0 && diff <= 3) porVencer++;
      });

      // Asistencia hoy
      const asistenciaSnap = await getDocs(collection(db, "asistencias"));
      const asistenciaHoy = asistenciaSnap.docs.filter(d => d.data().fecha === hoyStr).length;

      // Movimientos del mes
      const movSnap = await getDocs(collection(db, "movimientos"));
      const movimientos = movSnap.docs.map(d => d.data()).filter(m => m.fecha?.startsWith(mesActual));
      const ingresosMes = movimientos.filter(m => m.tipo === "ingreso").reduce((a, m) => a + m.monto, 0);
      const egresosMes = movimientos.filter(m => m.tipo === "egreso").reduce((a, m) => a + m.monto, 0);

      setStats({ activos, porVencer, asistenciaHoy, ingresosMes, egresosMes });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-manada-black px-4 py-6">

      {/* Topbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-manada-red rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">M</span>
          </div>
          <div>
            <h1 className="text-white font-bold tracking-widest text-sm">LA MANADA</h1>
            <p className="text-manada-red text-xs tracking-widest">MMA · GYM</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-manada-gray text-xs border border-manada-border px-3 py-2 rounded-lg hover:border-manada-red hover:text-manada-red transition-colors"
        >
          Salir
        </button>
      </div>

      {/* Alerta por vencer */}
      {stats.porVencer > 0 && (
        <div className="bg-red-950 border border-manada-red border-opacity-40 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
          <span className="text-manada-red text-lg">⚠️</span>
          <p className="text-red-300 text-xs">
            <span className="font-bold text-manada-red">{stats.porVencer} miembro{stats.porVencer > 1 ? "s" : ""}</span> vence{stats.porVencer > 1 ? "n" : ""} en los próximos 3 días
          </p>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="text-center text-manada-gray text-sm py-10">Cargando...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-red-950 border border-manada-red border-opacity-30 rounded-xl p-4">
            <p className="text-xs text-red-400 uppercase tracking-widest mb-1">Miembros activos</p>
            <p className="text-3xl font-bold text-manada-red">{stats.activos}</p>
            <p className="text-xs text-manada-gray mt-1">{stats.porVencer} por vencer pronto</p>
          </div>
          <div className="bg-manada-dark border border-manada-border rounded-xl p-4">
            <p className="text-xs text-manada-gray uppercase tracking-widest mb-1">Ingresos mes</p>
            <p className="text-3xl font-bold text-white">${stats.ingresosMes.toLocaleString()}</p>
            <p className="text-xs text-manada-gray mt-1">Egresos: ${stats.egresosMes.toLocaleString()}</p>
          </div>
          <div className="bg-manada-dark border border-manada-border rounded-xl p-4">
            <p className="text-xs text-manada-gray uppercase tracking-widest mb-1">Asistencia hoy</p>
            <p className="text-3xl font-bold text-white">{stats.asistenciaHoy}</p>
            <p className="text-xs text-manada-gray mt-1">de {stats.activos} activos</p>
          </div>
          <div className="bg-manada-dark border border-manada-border rounded-xl p-4">
            <p className="text-xs text-manada-gray uppercase tracking-widest mb-1">Ganancia neta</p>
            <p className="text-3xl font-bold text-white">${(stats.ingresosMes - stats.egresosMes).toLocaleString()}</p>
            <p className="text-xs text-manada-gray mt-1">Este mes</p>
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <p className="text-manada-gray text-xs uppercase tracking-widest mb-3">Acciones rápidas</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/miembros")}
          className="bg-red-950 border border-manada-red border-opacity-40 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-opacity-100 transition-all"
        >
          <span className="text-2xl">👤</span>
          <span className="text-xs text-manada-light">Miembros</span>
        </button>
        <button
          onClick={() => navigate("/asistencia")}
          className="bg-manada-dark border border-manada-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-manada-red transition-all"
        >
          <span className="text-2xl">✅</span>
          <span className="text-xs text-manada-light">Registrar asistencia</span>
        </button>
        <button
          onClick={() => navigate("/finanzas")}
          className="bg-manada-dark border border-manada-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-manada-red transition-all"
        >
          <span className="text-2xl">💰</span>
          <span className="text-xs text-manada-light">Finanzas</span>
        </button>
        <button
          onClick={() => navigate("/inventario")}
          className="bg-manada-dark border border-manada-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-manada-red transition-all"
        >
          <span className="text-2xl">📦</span>
          <span className="text-xs text-manada-light">Inventario</span>
        </button>
      </div>

    </div>
  );
}