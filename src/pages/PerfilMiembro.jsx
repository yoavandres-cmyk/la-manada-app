import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate, useParams } from "react-router-dom";

export default function PerfilMiembro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [miembro, setMiembro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renovando, setRenovando] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const ref = doc(db, "miembros", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setMiembro({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [id]);

  function getEstado() {
    if (!miembro?.vencimiento) return "vencido";
    const hoy = new Date();
    const vence = new Date(miembro.vencimiento);
    const diff = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "vencido";
    if (diff <= 3) return "por_vencer";
    return "vigente";
  }

  function getDiasRestantes() {
    if (!miembro?.vencimiento) return 0;
    const hoy = new Date();
    const vence = new Date(miembro.vencimiento);
    return Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));
  }

  function getProgreso() {
    if (!miembro?.inscripcion || !miembro?.vencimiento) return 0;
    const inicio = new Date(miembro.inscripcion);
    const fin = new Date(miembro.vencimiento);
    const hoy = new Date();
    const total = fin - inicio;
    const transcurrido = hoy - inicio;
    return Math.min(100, Math.max(0, (transcurrido / total) * 100));
  }

  function getBadge() {
    const estado = getEstado();
    if (estado === "vigente") return <span className="text-xs font-bold px-2 py-1 rounded-md bg-green-950 text-green-400">Vigente</span>;
    if (estado === "por_vencer") return <span className="text-xs font-bold px-2 py-1 rounded-md bg-yellow-950 text-yellow-400">Vence en {getDiasRestantes()} días</span>;
    return <span className="text-xs font-bold px-2 py-1 rounded-md bg-red-950 text-manada-red">Vencido</span>;
  }

  function getInitials() {
    return miembro?.nombre?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?";
  }

  function handleWhatsApp() {
    const tel = miembro.telefono?.replace(/\D/g, "");
    const dias = getDiasRestantes();
    let msg = "";
    if (dias < 0) {
      msg = `Hola ${miembro.nombre}, tu membresía en La Manada MMA ha vencido. ¡Renueva para seguir entrenando!`;
    } else {
      msg = `Hola ${miembro.nombre}, tu membresía en La Manada MMA vence en ${dias} día(s). ¡No olvides renovar!`;
    }
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  async function handleRenovar() {
  if (!miembro) return;
  setRenovando(true);
  try {
    const base = new Date(miembro.vencimiento);
    const hoy = new Date();
    const desde = base > hoy ? base : hoy;
    const nuevaFecha = new Date(desde);

    if (miembro.tipoKey === "dia") nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    else if (miembro.tipoKey === "semana") nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    else nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);

    const nuevoVencimiento = nuevaFecha.toISOString().split("T")[0];

    await updateDoc(doc(db, "miembros", id), { vencimiento: nuevoVencimiento });

    await addDoc(collection(db, "movimientos"), {
      concepto: `Membresía ${miembro.tipo} — ${miembro.nombre}`,
      monto: miembro.precio,
      tipo: "ingreso",
      formaPago: miembro.pago,
      fecha: hoy.toISOString().split("T")[0],
      creadoEn: new Date().toISOString(),
    });

    setMiembro({ ...miembro, vencimiento: nuevoVencimiento });
  } catch (err) {
    console.error(err);
  } finally {
    setRenovando(false);
  }
}

  if (loading) return (
    <div className="min-h-screen bg-manada-black flex items-center justify-center">
      <p className="text-manada-gray text-sm">Cargando...</p>
    </div>
  );

  if (!miembro) return (
    <div className="min-h-screen bg-manada-black flex items-center justify-center">
      <p className="text-manada-gray text-sm">Miembro no encontrado</p>
    </div>
  );

  const estado = getEstado();
  const dias = getDiasRestantes();
  const progreso = getProgreso();

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
        <h1 className="text-white font-bold tracking-widest text-sm">PERFIL</h1>
      </div>

      {/* Header miembro */}
      <div className="bg-manada-dark border border-manada-border rounded-xl p-4 flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-red-950 border-2 border-manada-red flex items-center justify-center text-xl font-bold text-manada-red flex-shrink-0">
          {getInitials()}
        </div>
        <div className="flex-1">
          <p className="text-white text-base font-bold">{miembro.nombre}</p>
          <p className="text-manada-gray text-xs mt-1">{miembro.telefono}</p>
          <div className="mt-2">{getBadge()}</div>
        </div>
      </div>

      {/* Membresía activa */}
      <div className="bg-manada-dark border border-manada-border rounded-xl p-4 mb-4">
        <p className="text-manada-gray text-xs uppercase tracking-widest mb-3">Membresía activa</p>
        <div className="flex justify-between mb-2">
          <span className="text-manada-gray text-xs">Tipo</span>
          <span className="text-white text-xs font-semibold">{miembro.tipo}</span>
        </div>
        {miembro.tipoKey === "familiar" && (
          <div className="flex justify-between mb-2">
            <span className="text-manada-gray text-xs">Integrantes</span>
            <span className="text-white text-xs">{miembro.integrantes} personas (-${(miembro.integrantes - 1) * 100} desc.)</span>
          </div>
        )}
        <div className="flex justify-between mb-2">
          <span className="text-manada-gray text-xs">Inscripción</span>
          <span className="text-white text-xs font-semibold">{miembro.inscripcion}</span>
        </div>
        <div className="flex justify-between mb-3">
          <span className="text-manada-gray text-xs">Vencimiento</span>
          <span className={`text-xs font-bold ${estado === "vencido" ? "text-manada-red" : estado === "por_vencer" ? "text-yellow-400" : "text-green-400"}`}>
            {miembro.vencimiento}
          </span>
        </div>
        <div className="bg-manada-black rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-manada-red rounded-full transition-all"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <p className="text-manada-gray text-xs mt-2 text-right">
          {dias > 0 ? `${dias} días restantes` : "Membresía vencida"}
        </p>
      </div>

      {/* Pago */}
      <div className="bg-manada-dark border border-manada-border rounded-xl p-4 mb-4">
        <p className="text-manada-gray text-xs uppercase tracking-widest mb-3">Último pago</p>
        <div className="flex justify-between mb-2">
          <span className="text-manada-gray text-xs">Monto</span>
          <span className="text-green-400 text-sm font-bold">${miembro.precio}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-manada-gray text-xs">Forma de pago</span>
          <span className="text-white text-xs font-semibold capitalize">{miembro.pago}</span>
        </div>
      </div>

      {/* WhatsApp */}
      <button
        onClick={handleWhatsApp}
        className="w-full bg-green-950 border border-green-800 rounded-xl p-4 flex items-center gap-3 mb-3 hover:border-green-600 transition-colors"
      >
        <span className="text-2xl">💬</span>
        <div className="text-left">
          <p className="text-green-400 text-sm font-bold">Enviar recordatorio por WhatsApp</p>
          <p className="text-green-700 text-xs mt-0.5">Mensaje de vencimiento pre-escrito</p>
        </div>
      </button>

      {/* Renovar */}
      <button
        onClick={handleRenovar}
        disabled={renovando}
        className="w-full bg-manada-red hover:bg-manada-darkred text-white font-bold py-4 rounded-xl tracking-widest text-sm transition-colors disabled:opacity-50"
      >
        {renovando ? "RENOVANDO..." : "RENOVAR MEMBRESÍA"}
      </button>

    </div>
  );
}