import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";

const TIPOS = [
  { key: "dia", label: "Día", precio: 50 },
  { key: "semana", label: "Semana", precio: 150 },
  { key: "mensual_sencilla", label: "Mensual sencilla", precio: 500 },
  { key: "mensual_completa", label: "Mensual completa", precio: 700 },
  { key: "familiar", label: "Familiar", precio: 900 },
];

export default function NuevoMiembro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipo, setTipo] = useState("mensual_sencilla");
  const [pago, setPago] = useState("efectivo");
  const [integrantes, setIntegrantes] = useState(1);
  const [inscripcion, setInscripcion] = useState(
    new Date().toISOString().split("T")[0]
  );

  function calcularVencimiento(fechaInicio, tipoMembresia) {
    const fecha = new Date(fechaInicio);
    if (tipoMembresia === "dia") fecha.setDate(fecha.getDate() + 1);
    else if (tipoMembresia === "semana") fecha.setDate(fecha.getDate() + 7);
    else fecha.setMonth(fecha.getMonth() + 1);
    return fecha.toISOString().split("T")[0];
  }

  function calcularPrecio() {
    const base = TIPOS.find(t => t.key === tipo)?.precio || 0;
    if (tipo === "familiar" && integrantes > 1) {
      return base - ((integrantes - 1) * 100);
    }
    return base;
  }

  async function handleGuardar() {
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    if (!telefono.trim()) { setError("El teléfono es obligatorio"); return; }
    setError("");
    setLoading(true);
    try {
      const vencimiento = calcularVencimiento(inscripcion, tipo);
      await addDoc(collection(db, "miembros"), {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        tipo: TIPOS.find(t => t.key === tipo)?.label,
        tipoKey: tipo,
        pago,
        integrantes: tipo === "familiar" ? integrantes : 1,
        inscripcion,
        vencimiento,
        precio: calcularPrecio(),
        activo: true,
        creadoEn: new Date().toISOString(),
      });
      navigate("/miembros");
    } catch (err) {
      setError("Error al guardar. Intenta de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-manada-black px-4 py-6">

      {/* Topbar */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/miembros")}
          className="w-8 h-8 border border-manada-border rounded-lg flex items-center justify-center text-manada-gray hover:border-manada-red hover:text-manada-red transition-colors"
        >
          ←
        </button>
        <h1 className="text-white font-bold tracking-widest text-sm">NUEVO MIEMBRO</h1>
      </div>

      <div className="flex flex-col gap-4">

        {/* Nombre */}
        <div className="flex flex-col gap-1">
          <label className="text-manada-gray text-xs uppercase tracking-widest">Nombre completo</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Juan Martínez Reyes"
            className="bg-manada-dark border border-manada-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-manada-red transition-colors"
          />
        </div>

        {/* Teléfono */}
        <div className="flex flex-col gap-1">
          <label className="text-manada-gray text-xs uppercase tracking-widest">Teléfono (WhatsApp)</label>
          <input
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="+52 664 000 0000"
            className="bg-manada-dark border border-manada-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-manada-red transition-colors"
          />
        </div>

        {/* Tipo de membresía */}
        <div className="flex flex-col gap-2">
          <label className="text-manada-gray text-xs uppercase tracking-widest">Tipo de membresía</label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map(t => (
              <button
                key={t.key}
                onClick={() => setTipo(t.key)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  tipo === t.key
                    ? "border-manada-red bg-red-950"
                    : "border-manada-border bg-manada-dark"
                } ${t.key === "familiar" ? "col-span-2" : ""}`}
              >
                <p className={`text-sm font-semibold ${tipo === t.key ? "text-white" : "text-manada-light"}`}>
                  {t.label}
                </p>
                <p className={`text-xs mt-0.5 ${tipo === t.key ? "text-manada-red" : "text-manada-gray"}`}>
                  ${t.precio}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Integrantes (solo familiar) */}
        {tipo === "familiar" && (
          <div className="flex flex-col gap-1">
            <label className="text-manada-gray text-xs uppercase tracking-widest">
              Integrantes <span className="text-manada-red">(-$100 por persona extra)</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIntegrantes(Math.max(1, integrantes - 1))}
                className="w-10 h-10 bg-manada-dark border border-manada-border rounded-lg text-white font-bold hover:border-manada-red transition-colors"
              >
                −
              </button>
              <span className="text-white text-lg font-bold w-8 text-center">{integrantes}</span>
              <button
                onClick={() => setIntegrantes(integrantes + 1)}
                className="w-10 h-10 bg-manada-dark border border-manada-border rounded-lg text-white font-bold hover:border-manada-red transition-colors"
              >
                +
              </button>
              <span className="text-manada-gray text-xs ml-2">
                Total: <span className="text-white font-bold">${calcularPrecio()}</span>
              </span>
            </div>
          </div>
        )}

        {/* Forma de pago */}
        <div className="flex flex-col gap-2">
          <label className="text-manada-gray text-xs uppercase tracking-widest">Forma de pago</label>
          <div className="grid grid-cols-2 gap-2">
            {["efectivo", "transferencia"].map(p => (
              <button
                key={p}
                onClick={() => setPago(p)}
                className={`rounded-xl border p-3 text-center transition-colors ${
                  pago === p
                    ? "border-manada-red bg-red-950 text-white"
                    : "border-manada-border bg-manada-dark text-manada-light"
                }`}
              >
                <p className="text-sm font-semibold capitalize">{p}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Fecha de inscripción */}
        <div className="flex flex-col gap-1">
          <label className="text-manada-gray text-xs uppercase tracking-widest">Fecha de inscripción</label>
          <input
            type="date"
            value={inscripcion}
            onChange={e => setInscripcion(e.target.value)}
            className="bg-manada-dark border border-manada-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-manada-red transition-colors"
          />
        </div>

        {/* Resumen */}
        <div className="bg-manada-dark border border-manada-border rounded-xl p-4">
          <p className="text-manada-gray text-xs uppercase tracking-widest mb-3">Resumen</p>
          <div className="flex justify-between mb-2">
            <span className="text-manada-gray text-xs">Membresía</span>
            <span className="text-white text-xs font-semibold">{TIPOS.find(t => t.key === tipo)?.label}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-manada-gray text-xs">Vencimiento</span>
            <span className="text-white text-xs font-semibold">{calcularVencimiento(inscripcion, tipo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-manada-gray text-xs">Total a cobrar</span>
            <span className="text-manada-red text-sm font-bold">${calcularPrecio()}</span>
          </div>
        </div>

        {error && (
          <p className="text-manada-red text-xs text-center bg-red-950 border border-red-900 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Botón guardar */}
        <button
          onClick={handleGuardar}
          disabled={loading}
          className="bg-manada-red hover:bg-manada-darkred text-white font-bold py-4 rounded-xl tracking-widest text-sm transition-colors disabled:opacity-50"
        >
          {loading ? "GUARDANDO..." : "REGISTRAR MIEMBRO"}
        </button>

      </div>
    </div>
  );
}