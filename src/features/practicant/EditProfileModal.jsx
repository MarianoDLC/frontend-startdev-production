// src/components/modals/EditProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { X, User, Lock, Eye, EyeOff, Loader } from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL;
const EditProfileModal = ({ isOpen, onClose, practicantData, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Cargar nombre del practicante cuando se abre el modal
  useEffect(() => {
    if (isOpen && practicantData) {
      setFormData(prev => ({
        ...prev,
        name: practicantData.name_pract || '',
      }));
    }
  }, [isOpen, practicantData]);

  // Reset form cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setValidationErrors({});
      setShowPasswords({ current: false, new: false, confirm: false });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo al escribir
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const errors = {};

    // Validar nombre
    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    }

    // Validar contraseñas solo si se intenta cambiar
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword = 'Ingresa tu contraseña actual';
      }
      
      if (!formData.newPassword) {
        errors.newPassword = 'Ingresa una nueva contraseña';
      } else if (formData.newPassword.length < 6) {
        errors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Confirma tu nueva contraseña';
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsLoading(true);

  try {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user"));

    if (!token || !userData) {
      throw new Error("Sesión no válida");
    }

    const isChangingPassword = formData.currentPassword && formData.newPassword;

    const updatePayload = {
      documentId: practicantData.documentId,
      name: formData.name,
    };

    if (isChangingPassword) {
      // console.log("🔐 Verificando contraseña actual...");
      updatePayload.currentPassword = formData.currentPassword;
      updatePayload.newPassword = formData.newPassword;
    }

    console.log("📤 Datos a enviar:", updatePayload);

    const response = await fetch(
      `${API_URL}/api/practicants/update-profile`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      }
    );

    // Muestra la respuesta cruda por si el JSON falla
    const rawResponse = await response.text();
    console.log("📩 Respuesta RAW de Strapi:", rawResponse);

    let result;
    try {
      result = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error("⚠️ No se pudo parsear la respuesta JSON:", parseError);
      throw new Error("Respuesta inválida del servidor");
    }

    if (!response.ok) {
      console.error("❌ Error del servidor completo:", result);

      if (result.error?.message === "La contraseña actual es incorrecta") {
        setValidationErrors({
          currentPassword: "La contraseña actual es incorrecta",
        });
        setIsLoading(false);
        return;
      }

      throw new Error(
        result.error?.message || "Error al actualizar el perfil"
      );
    }

    console.log("✅ Perfil actualizado:", result);

    const updatedUserData = {
      ...userData,
      user: {
        ...userData.user,
        name: formData.name,
      },
    };
    localStorage.setItem("user", JSON.stringify(updatedUserData));

    onClose();
    onSuccess(
      isChangingPassword
        ? "¡Perfil y contraseña actualizados exitosamente!"
        : "¡Perfil actualizado exitosamente!"
    );
  } catch (err) {
    console.error("❌ Error al actualizar perfil:", err);
    onError(err.message || "Error al actualizar el perfil. Inténtalo de nuevo.");
  } finally {
    setIsLoading(false);
  }
};


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay con fondo transparente oscuro */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User size={24} />
            Editar Perfil
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-all disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all text-black disabled:bg-gray-100 ${
                  validationErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ingresa tu nombre"
              />
            </div>
            {validationErrors.name && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-4">
              Si deseas cambiar tu contraseña, completa los siguientes campos:
            </p>
          </div>

          {/* Contraseña Actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña actual
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all text-black disabled:bg-gray-100 ${
                  validationErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validationErrors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.currentPassword}</p>
            )}
          </div>

          {/* Nueva Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all text-black disabled:bg-gray-100 ${
                  validationErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validationErrors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.newPassword}</p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all text-black disabled:bg-gray-100 ${
                  validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;