import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Finanzas() {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [tipoMov, setTipoMov] = useState("ingreso");
  const [formaPago, setFormaPago] = useState("efectivo");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    cargarMovimientos();
  }, []);

  async function cargarMovimientos() {
    try {
      const q = query(collection(db, "movimientos"), orderBy("fecha", "desc"));
      const snap = await getDocs(q);
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMovimientos(lista);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuardar() {
    if (!concepto.trim() || !monto) return;
    setGuardando(true);
    try {
      await addDoc(collection(db, "movimientos"), {
        concepto: concepto.trim(),
        monto: parseFloat(monto),
        tipo: tipoMov,
        formaPago,
        fecha,
        creadoEn: new Date().toISOString(),
      });
      setConcepto("");
      setMonto("");
      setTipoMov("ingreso");
      setFormaPago("efectivo");
      setFecha(new Date().toISOString().split("T")[0]);
      setShowForm(false);
      cargarMovimientos();
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
    }
  }

  const mesActual = new Date().toISOString().slice(0, 7);
  const movMes = movimientos.filter(m => m.fecha?.startsWith(mesActual));
  const ingresos = movMes.filter(m => m.tipo === "ingreso").reduce((a, m) => a + m.monto, 0);
  const egresos = movMes.filter(m => m.tipo === "egreso").reduce((a, m) => a + m.monto, 0);
  const ganancia = ingresos - egresos;

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
          <h1 className="text-white font-bold tracking-widest text-sm">FINANZAS</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-manada-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-manada-darkred transition-colors"
        >
          + Nuevo
        </button>
      </div>

      {/* Balance */}
      <div className="bg-red-950 border border-manada-red border-opacity-40 rounded-xl p-5 text-center mb-4">
        <p className="text-red-400 text-xs uppercase tracking-widest mb-2">Ganancia neta del mes</p>
        <p className={`text-4xl font-bold mb-1 ${ganancia >= 0 ? "text-white" : "text-manada-red"}`}>
          ${ganancia.toLocaleString()}
        </p>
        <p className="text-red-400 text-xs">
          Ingresos ${ingresos.toLocaleString()} · Egresos ${egresos.toLocaleString()}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-manada-dark border border-manada-border rounded-xl p-4">
          <p className="text-manada-gray text-xs uppercase tracking-widest mb-1">Ingresos</p>
          <p className="text-2xl font-bold text-green-400">${ingresos.toLocaleString()}</p>
        </div>
        <div className="bg-manada-dark border border-manada-border rounded-xl p-4">
          <p className="text-manada-gray text-xs uppercase tracking-widest mb-1">Egresos</p>
          <p className="text-2xl font-bold text-manada-red">${egresos.toLocaleString()}</p>
        </div>
      </div>

      {/* Formulario nuevo movimiento */}
      {showForm && (
        <div className="bg-manada-dark border border-manada-red border-opacity-40 rounded-xl p-4 mb-4 flex flex-col gap-3">
          <p className="text-white text-xs uppercase tracking-widest font-bold">Nuevo movimiento</p>

          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            {["ingreso", "egreso"].map(t => (
              <button
                key={t}
                onClick={() => setTipoMov(t)}
                className={`rounded-xl border p-3 text-center text-sm font-bold capitalize transition-colors ${
                  tipoMov === t
                    ? t === "ingreso"
                      ? "border-green-600 bg-green-950 text-green-400"
                      : "border-manada-red bg-red-950 text-manada-red"
                    : "border-manada-border text-manada-gray"
                }`}
              >
                {t === "ingreso" ? "💰 Ingreso" : "📤 Egreso"}
              </button>
            ))}
          </div>

          {/* Concepto */}
          <div className="flex flex-col gap-1">
            <label className="text-manada-gray text-xs uppercase tracking-widest">Concepto</label>
            <input
              type="text"
              value={concepto}
              onChange={e => setConcepto(e.target.value)}
              placeholder="Ej: Mensualidad Carlos, Renta local..."
              className="bg-manada-black border border-manada-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-manada-red transition-colors"
            />
          </div>

          {/* Monto */}
          <div className="flex flex-col gap-1">
            <label className="text-manada-gray text-xs uppercase tracking-widest">Monto</label>
            <input
              type="number"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="$0.00"
              className="bg-manada-black border border-manada-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-manada-red transition-colors"
            />
          </div>

          {/* Forma de pago */}
          <div className="grid grid-cols-2 gap-2">
            {["efectivo", "transferencia"].map(p => (
              <button
                key={p}
                onClick={() => setFormaPago(p)}
                className={`rounded-xl border p-2 text-center text-xs font-bold capitalize transition-colors ${
                  formaPago === p
                    ? "border-manada-red bg-red-950 text-white"
                    : "border-manada-border text-manada-gray"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-1">
            <label className="text-manada-gray text-xs uppercase tracking-widest">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="bg-manada-black border border-manada-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-manada-red transition-colors"
            />
          </div>

          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="bg-manada-red hover:bg-manada-darkred text-white font-bold py-3 rounded-xl text-sm tracking-widest transition-colors disabled:opacity-50"
          >
            {guardando ? "GUARDANDO..." : "GUARDAR"}
          </button>
        </div>
      )}

      {/* Lista movimientos */}
      <p className="text-manada-gray text-xs uppercase tracking-widest mb-3">Movimientos del mes</p>
      {loading ? (
        <div className="text-center text-manada-gray text-sm mt-6">Cargando...</div>
      ) : movMes.length === 0 ? (
        <div className="text-center text-manada-gray text-sm mt-6">No hay movimientos este mes</div>
      ) : (
        <div className="flex flex-col gap-2">
          {movMes.map(m => (
            <div key={m.id} className="bg-manada-dark border border-manada-border rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-semibold">{m.concepto}</p>
                <p className="text-manada-gray text-xs mt-0.5">{m.fecha} · {m.formaPago}</p>
              </div>
              <p className={`text-sm font-bold ${m.tipo === "ingreso" ? "text-green-400" : "text-manada-red"}`}>
                {m.tipo === "ingreso" ? "+" : "-"}${m.monto.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}