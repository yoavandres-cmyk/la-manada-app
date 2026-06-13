import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-manada-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-manada-red rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-4xl font-black">M</span>
          </div>
          <h1 className="text-white text-2xl font-black tracking-widest">LA MANADA</h1>
          <p className="text-manada-red text-xs tracking-widest mt-1">MMA · GYM</p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-manada-gray text-xs uppercase tracking-widest">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dueño@lamanada.com"
              required
              className="bg-manada-dark border border-manada-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-manada-red transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-manada-gray text-xs uppercase tracking-widest">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-manada-dark border border-manada-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-manada-red transition-colors"
            />
          </div>
          {error && (
            <p className="text-manada-red text-xs text-center bg-red-950 border border-red-900 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-manada-red hover:bg-manada-darkred text-white font-bold py-4 rounded-xl tracking-widest text-sm transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? "ENTRANDO..." : "ENTRAR"}
          </button>
        </form>
        <p className="text-manada-gray text-xs text-center mt-8">
          Acceso solo para administradores
        </p>
      </div>
    </div>
  );
}