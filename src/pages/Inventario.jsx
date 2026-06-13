import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Inventario() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [stock, setStock] = useState("");
  const [stockMin, setStockMin] = useState("5");
  const [precio, setPrecio] = useState("");

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      const q = query(collection(db, "inventario"), orderBy("nombre"));
      const snap = await getDocs(q);
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(lista);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuardar() {
    if (!nombre.trim() || !stock) return;
    setGuardando(true);
    try {
      await addDoc(collection(db, "inventario"), {
        nombre: nombre.trim(),
        stock: parseInt(stock),
        stockMin: parseInt(stockMin) || 5,
        precio: parseFloat(precio) || 0,
        creadoEn: new Date().toISOString(),
      });
      setNombre("");
      setStock("");
      setStockMin("5");
      setPrecio("");
      setShowForm(false);
      cargarProductos();
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
    }
  }

  async function handleAjustarStock(id, cantidad) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    const nuevoStock = Math.max(0, producto.stock + cantidad);
    try {
      await updateDoc(doc(db, "inventario", id), { stock: nuevoStock });
      setProductos(productos.map(p => p.id === id ? { ...p, stock: nuevoStock } : p));
    } catch (err) {
      console.error(err);
    }
  }

  const stockBajo = productos.filter(p => p.stock <= p.stockMin);

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
          <h1 className="text-white font-bold tracking-widest text-sm">INVENTARIO</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-manada-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-manada-darkred transition-colors"
        >
          + Nuevo
        </button>
      </div>

      {/* Alerta stock bajo */}
      {stockBajo.length > 0 && (
        <div className="bg-yellow-950 border border-yellow-700 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <p className="text-yellow-300 text-xs">
            <span className="font-bold">{stockBajo.length} producto{stockBajo.length > 1 ? "s" : ""}</span> con stock bajo
          </p>
        </div>
      )}

      {/* Formulario nuevo producto */}
      {showForm && (
        <div className="bg-manada-dark border border-manada-red border-opacity-40 rounded-xl p-4 mb-4 flex flex-col gap-3">
          <p className="text-white text-xs uppercase tracking-widest font-bold">Nuevo producto</p>

          <div className="flex flex-col gap-1">
            <label className="text-manada-gray text-xs uppercase tracking-widest">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Guantes MMA, Vendas..."
              className="bg-manada-black border border-manada-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-manada-red transition-colors"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-manada-gray text-xs uppercase tracking-widest">Stock</label>
              <input
                type="number"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="0"
                className="bg-manada-black border border-manada-border rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-manada-red transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-manada-gray text-xs uppercase tracking-widest">Mín.</label>
              <input
                type="number"
                value={stockMin}
                onChange={e => setStockMin(e.target.value)}
                placeholder="5"
                className="bg-manada-black border border-manada-border rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-manada-red transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-manada-gray text-xs uppercase tracking-widest">Precio</label>
              <input
                type="number"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                placeholder="$0"
                className="bg-manada-black border border-manada-border rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-manada-red transition-colors"
              />
            </div>
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

      {/* Lista productos */}
      {loading ? (
        <div className="text-center text-manada-gray text-sm mt-6">Cargando...</div>
      ) : productos.length === 0 ? (
        <div className="text-center text-manada-gray text-sm mt-6">No hay productos registrados</div>
      ) : (
        <div className="flex flex-col gap-3">
          {productos.map(p => {
            const bajo = p.stock <= p.stockMin;
            return (
              <div key={p.id} className={`bg-manada-dark border rounded-xl px-4 py-3 ${bajo ? "border-yellow-700" : "border-manada-border"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-950 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📦</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{p.nombre}</p>
                      <p className="text-manada-gray text-xs mt-0.5">
                        {p.precio > 0 ? `$${p.precio}` : "Sin precio"} · Mín: {p.stockMin}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${bajo ? "bg-yellow-950 text-yellow-400" : "bg-green-950 text-green-400"}`}>
                    {bajo ? "Stock bajo" : "OK"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAjustarStock(p.id, -1)}
                      className="w-8 h-8 bg-manada-black border border-manada-border rounded-lg text-white font-bold hover:border-manada-red transition-colors"
                    >
                      −
                    </button>
                    <span className="text-white font-bold text-lg w-8 text-center">{p.stock}</span>
                    <button
                      onClick={() => handleAjustarStock(p.id, 1)}
                      className="w-8 h-8 bg-manada-black border border-manada-border rounded-lg text-white font-bold hover:border-manada-red transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-manada-gray text-xs">unidades</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}