import React, { useState } from "react";
import { loginUser } from "../../api/authService";
import { useAuth } from "../../features/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import SuccessModal from "../../modal/SuccessModal";
import ErrorModal from "../../modal/ErrorModal";
const API_URL = import.meta.env.VITE_API_URL;

export default function Formulario() {
  const [selectedRole, setSelectedRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estados para modales
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Estados para registro
  const [registerData, setRegisterData] = useState({
    name_pract: "",
    email_practicant: "",
    password_pract: "",
    confirmPassword: "",
  });

  const { login } = useAuth();
  const navigate = useNavigate();
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    if (role === "Administrador") {
      setEmail("jorgeEmilio@gmail.com");
      setPassword("Jorge123");
    } else if (role === "Practicante") {
      setEmail("joseemi@gmail.com");
      setPassword("1234567");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await loginUser(email, password);
      console.log("🔹 Respuesta login:", response);

      const roleFromAPI = response?.data?.role || response?.role;
      if (!roleFromAPI) {
        setModalMessage("Tu rol no está autorizado para acceder al sistema.");
        setShowErrorModal(true);
        setIsLoading(false);
        return;
      }

      // Normalizar roles
      let normalizedRole = "";
      if (roleFromAPI === "Administrador") normalizedRole = "administrator";
      else if (roleFromAPI === "Practicante") normalizedRole = "practicant";
      else normalizedRole = roleFromAPI.toLowerCase();

      // Crear estructura compatible con AuthContext
      const userData = {
        token: response.data.jwt,
        role: normalizedRole,
        user: {
          id: response.data.user.id,
          documentId: response.data.user.documentId,
          name:
            normalizedRole === "administrator"
              ? response.data.user.name_administrator
              : response.data.user.name_practicant,
          email:
            normalizedRole === "administrator"
              ? response.data.user.email_administrator
              : response.data.user.email_practicant,
        },
      };

      // Guardar sesión
      login(userData);

      // Redirigir según rol
      if (normalizedRole === "administrator") navigate("/admin/dashboard");
      else navigate("/practicant/dashboard");
    } catch (err) {
      // console.error("❌ Error al iniciar sesión:", err);
      setModalMessage("Error al iniciar sesión. Verifica tus datos.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (registerData.password_pract !== registerData.confirmPassword) {
      setModalMessage("Las contraseñas no coinciden");
      setShowErrorModal(true);
      return;
    }

    if (registerData.password_pract.length < 6) {
      setModalMessage("La contraseña debe tener al menos 6 caracteres");
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);

    try {
      // Crear el usuario en Strapi 5
      const response = await fetch(`${API_URL}/api/practicants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            name_pract: registerData.name_pract,
            email_practicant: registerData.email_practicant,
            password_pract: registerData.password_pract,
            role: "Practicante",
            registration_date: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "Error al registrar usuario"
        );
      }

      const data = await response.json();
      console.log("✅ Usuario registrado:", data);

      // Limpiar formulario
      setRegisterData({
        name_pract: "",
        email_practicant: "",
        password_pract: "",
        confirmPassword: "",
      });

      // Mostrar modal de éxito
      setModalMessage("¡Registro exitoso! Ahora puedes iniciar sesión.");
      setShowSuccessModal(true);

      // Cambiar a modo login después de cerrar el modal
      setTimeout(() => {
        setIsRegisterMode(false);
      }, 2000);
    } catch (err) {
      console.error("❌ Error al registrar:", err);
      setModalMessage(
        err.message || "Error al crear la cuenta. Intenta nuevamente."
      );
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError("");
    setEmail("");
    setPassword("");
    setRegisterData({
      name_pract: "",
      email_practicant: "",
      password_pract: "",
      confirmPassword: "",
    });
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-950 via-violet-900 to-fuchsia-900 p-4">
        {/* Efectos de fondo animados */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <style>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -50px) scale(1.1); }
            50% { transform: translate(-20px, 20px) scale(0.9); }
            75% { transform: translate(50px, 50px) scale(1.05); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          @keyframes slideInLeft {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .slide-in-left {
            animation: slideInLeft 0.6s ease-out;
          }
          .slide-in-right {
            animation: slideInRight 0.6s ease-out;
          }
        `}</style>

        <div className="w-full max-w-6xl flex flex-col md:flex-row bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-purple-300/20 relative z-10">
          {/* Panel Lateral - Información con animación */}
          <div
            className={`md:w-2/5 p-8 md:p-12 flex flex-col justify-center transition-all duration-700 ease-in-out transform ${
              isRegisterMode
                ? "bg-gradient-to-br from-fuchsia-600 via-purple-600 to-violet-700"
                : "bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700"
            } relative overflow-hidden ${
              isRegisterMode ? "slide-in-left" : "slide-in-right"
            }`}
          >
            {/* Decoración animada */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-300/20 rounded-full blur-2xl animate-pulse animation-delay-2000"></div>

            <div className="text-white relative z-10 animate-float">
              <div className="mb-6 transform transition-all duration-500 hover:scale-110">
                <svg
                  className="w-20 h-20 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-4 transition-all duration-500">
                {isRegisterMode ? "¿Ya eres parte?" : "¡Únete a nosotros!"}
              </h2>
              <p className="text-purple-50 mb-8 text-sm md:text-base leading-relaxed transition-all duration-500">
                {isRegisterMode
                  ? "Accede a tu cuenta para continuar aprendiendo y alcanzar tus metas."
                  : "Comienza tu aventura educativa hoy. Crea tu cuenta y descubre un mundo de conocimiento."}
              </p>
              <button
                onClick={toggleMode}
                className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-all duration-500 shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 hover:-translate-y-1 active:scale-95"
              >
                {isRegisterMode ? "Iniciar Sesión" : "Crear Cuenta"}
              </button>
            </div>
          </div>

          {/* Panel de Formulario */}
          <div
            className={`md:w-3/5 p-8 md:p-12 bg-white/95 backdrop-blur-sm transition-all duration-500 ${
              isRegisterMode ? "slide-in-right" : "slide-in-left"
            }`}
          >
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-violet-600 bg-clip-text text-transparent mb-2 transition-all duration-500">
                  {isRegisterMode ? "¡Bienvenido!" : "Hola de nuevo"}
                </h2>
                <p className="text-gray-500 transition-all duration-500">
                  {isRegisterMode
                    ? "Completa el formulario para comenzar"
                    : "Ingresa tus credenciales para continuar"}
                </p>
              </div>

              {/* Formulario de Login */}
              {!isRegisterMode && (
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Radio Buttons para seleccionar rol */}
                  <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 p-5 rounded-xl border-2 border-purple-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Selecciona tu rol
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="role"
                          value="Administrador"
                          checked={selectedRole === "Administrador"}
                          onChange={(e) => handleRoleChange(e.target.value)}
                          className="w-5 h-5 text-purple-600 border-gray-300 focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="ml-3 text-gray-700 font-medium group-hover:text-purple-600 transition-colors duration-300">
                          Administrador
                        </span>
                      </label>

                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="role"
                          value="Practicante"
                          checked={selectedRole === "Practicante"}
                          onChange={(e) => handleRoleChange(e.target.value)}
                          className="w-5 h-5 text-fuchsia-600 border-gray-300 focus:ring-fuchsia-500 cursor-pointer"
                        />
                        <span className="ml-3 text-gray-700 font-medium group-hover:text-fuchsia-600 transition-colors duration-300">
                          Practicante
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors duration-300 group-focus-within:text-purple-600">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:scale-110">
                        <svg
                          className="h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                      </div>
                      <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-gray-50 hover:bg-white hover:border-purple-300 transform hover:scale-[1.02] text-black placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors duration-300 group-focus-within:text-purple-600">
                      Contraseña
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:scale-110">
                        <svg
                          className="h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-gray-50 hover:bg-white hover:border-purple-300 transform hover:scale-[1.02] text-black placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center transition-transform duration-300 hover:scale-110"
                      >
                        {showPassword ? (
                          <svg
                            className="h-5 w-5 text-gray-400 hover:text-purple-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5 text-gray-400 hover:text-purple-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <a
                      href="#"
                      className="text-purple-600 hover:text-fuchsia-600 font-medium transition-all duration-300 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-violet-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:via-fuchsia-700 hover:to-violet-700 transition-all duration-500 shadow-2xl hover:shadow-purple-500/50 transform hover:scale-[1.03] hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-3"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Ingresando...
                      </span>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </button>
                </form>
              )}

              {/* Formulario de Registro */}
              {isRegisterMode && (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors duration-300 group-focus-within:text-fuchsia-600">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:scale-110">
                        <svg
                          className="h-5 w-5 text-gray-400 group-focus-within:text-fuchsia-600 transition-colors duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Juan Pérez"
                        value={registerData.name_pract}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            name_pract: e.target.value,
                          })
                        }
                        required
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all duration-300 bg-gray-50 hover:bg-white hover:border-fuchsia-300 transform hover:scale-[1.02] text-black placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors duration-300 group-focus-within:text-fuchsia-600">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:scale-110">
                        <svg
                          className="h-5 w-5 text-gray-400 group-focus-within:text-fuchsia-600 transition-colors duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                      </div>
                      <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={registerData.email_practicant}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email_practicant: e.target.value,
                          })
                        }
                        required
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all duration-300 bg-gray-50 hover:bg-white hover:border-fuchsia-300 transform hover:scale-[1.02] text-black placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors duration-300 group-focus-within:text-fuchsia-600">
                      Contraseña
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:scale-110">
                        <svg
                          className="h-5 w-5 text-gray-400 group-focus-within:text-fuchsia-600 transition-colors duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={registerData.password_pract}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password_pract: e.target.value,
                          })
                        }
                        required
                        minLength={6}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all duration-300 bg-gray-50 hover:bg-white hover:border-fuchsia-300 transform hover:scale-[1.02] text-black placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors duration-300 group-focus-within:text-fuchsia-600">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:scale-110">
                        <svg
                          className="h-5 w-5 text-gray-400 group-focus-within:text-fuchsia-600 transition-colors duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <input
                        type="password"
                        placeholder="Repite tu contraseña"
                        value={registerData.confirmPassword}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all duration-300 bg-gray-50 hover:bg-white hover:border-fuchsia-300 transform hover:scale-[1.02] text-black placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-violet-600 text-white py-4 rounded-xl font-bold hover:from-fuchsia-700 hover:via-purple-700 hover:to-violet-700 transition-all duration-500 shadow-2xl hover:shadow-fuchsia-500/50 transform hover:scale-[1.03] hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-3"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creando cuenta...
                      </span>
                    ) : (
                      "Crear Cuenta"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showSuccessModal && (
        <SuccessModal
          message={modalMessage}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {showErrorModal && (
        <ErrorModal
          message={modalMessage}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </>
  );
}
