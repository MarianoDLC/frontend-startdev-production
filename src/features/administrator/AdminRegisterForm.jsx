import React, { useState } from "react";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import SuccessModal from "../../modal/SuccessModal";
import ErrorModal from "../../modal/ErrorModal";
const API_URL = import.meta.env.VITE_API_URL;

const AdminRegisterForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    contraseña: "",
    confirmarContraseña: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.correo.trim()) {
      newErrors.correo = "El correo es requerido";
    } else if (!emailRegex.test(formData.correo)) {
      newErrors.correo = "Ingresa un correo válido";
    }

    if (!formData.contraseña) {
      newErrors.contraseña = "La contraseña es requerida";
    } else if (formData.contraseña.length < 8) {
      newErrors.contraseña = "La contraseña debe tener al menos 8 caracteres";
    }

    if (!formData.confirmarContraseña) {
      newErrors.confirmarContraseña = "Debes confirmar la contraseña";
    } else if (formData.contraseña !== formData.confirmarContraseña) {
      newErrors.confirmarContraseña = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/administrators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            name_administrator: formData.nombre,
            email_administrator: formData.correo,
            pass_administrator: formData.contraseña,
            role: "Administrador",
          },
        }),
      });
      // console.log(response);
      if (response.ok) {
        setIsModalOpen(true);
        if (onSuccess) onSuccess(formData);
        setFormData({
          nombre: "",
          correo: "",
          contraseña: "",
          confirmarContraseña: "",
        });
      } else {
        setIsErrorOpen(true);
      }
    } catch (err) {
      // console.error("Error al conectar con Strapi:", err);
      setIsErrorOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserPlus className="text-white" size={36} />
          </div>
          <h2 className="text-3xl font-bold text-purple-900 mb-2">
            Registrar Nuevo Administrador
          </h2>
          <p className="text-gray-600">
            Completa el formulario para crear una cuenta de administrador
          </p>
        </div>

        <div className="space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre del Administrador
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                <User size={20} />
              </div>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all placeholder-gray-400 text-black ${
                  errors.nombre
                    ? "border-red-300 focus:border-red-500"
                    : "border-purple-200 focus:border-purple-500"
                }`}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            {errors.nombre && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errors.nombre}</span>
              </div>
            )}
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all placeholder-gray-400 text-black ${
                  errors.correo
                    ? "border-red-300 focus:border-red-500"
                    : "border-purple-200 focus:border-purple-500"
                }`}
                placeholder="admin@startdev.com"
              />
            </div>
            {errors.correo && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errors.correo}</span>
              </div>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="contraseña"
                value={formData.contraseña}
                onChange={handleChange}
                className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-all placeholder-gray-400 text-black ${
                  errors.contraseña
                    ? "border-red-300 focus:border-red-500"
                    : "border-purple-200 focus:border-purple-500"
                }`}
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.contraseña && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errors.contraseña}</span>
              </div>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                <Lock size={20} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmarContraseña"
                value={formData.confirmarContraseña}
                onChange={handleChange}
                className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-all placeholder-gray-400 text-black ${
                  errors.confirmarContraseña
                    ? "border-red-300 focus:border-red-500"
                    : "border-purple-200 focus:border-purple-500"
                }`}
                placeholder="Repite la contraseña"
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmarContraseña && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errors.confirmarContraseña}</span>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-purple-300 text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-all"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Registrar Administrador</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* === MODALES === */}
        <SuccessModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="¡Guardado!"
          message="El administrador se registró correctamente"
          duration={3000}
        />
        <ErrorModal
          isOpen={isErrorOpen}
          onClose={() => setIsErrorOpen(false)}
          title="Error de conexión"
          message="No se pudo conectar al servidor"
        />
      </div>
    </div>
  );
};

export default AdminRegisterForm;
