import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye, EyeOff, User, Mail, Lock, AlertTriangle, CheckCircle2, X, Calendar, Award } from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL;

const PracticantsListPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [practicantToDelete, setPracticantToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [practicantToEdit, setPracticantToEdit] = useState(null);
  const [practicants, setPracticants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // === FETCH PRACTICANTS ===
  const fetchPracticants = async () => {
    try {
      const res = await fetch(`${API_URL}/api/practicants`);
      if (!res.ok) throw new Error("Error en la conexión");
      const data = await res.json();
      console.log("📦 Data de Strapi:", data);
      const parsed = data.data.map((item) => ({
        id: item.id,
        strapiId: item.id,
        nombre: item.name_pract,
        correo: item.email_practicant,
        contraseña: item.password_pract || "—",
        fechaRegistro: item.registration_date?.split("T")[0] || item.createdAt?.split("T")[0],
        rol: item.role || "Practicante",
      }));
      setPracticants(parsed);
    } catch (err) {
      // console.error("❌ Error cargando practicantes:", err);
      setErrorMessage("Error al cargar los practicantes. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPracticants();
  }, []);

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDeleteClick = (practicant) => {
    setPracticantToDelete(practicant);
    setShowDeleteModal(true);
  };

  // === ELIMINAR PRACTICANT ===
  const confirmDelete = async () => {
    try {
      const strapiId = practicantToDelete.id;
      const res = await fetch(`${API_URL}/api/practicants/${strapiId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setPracticants(practicants.filter((p) => p.id !== practicantToDelete.id));
      setShowDeleteModal(false);
      setPracticantToDelete(null);
      setSuccessMessage("¡Practicante eliminado exitosamente!");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("❌ Error eliminando:", err);
      setShowDeleteModal(false);
      setErrorMessage("Error al eliminar el practicante. Por favor intenta nuevamente.");
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleEditClick = (practicant) => {
    setPracticantToEdit({ ...practicant });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setPracticantToEdit(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // === ACTUALIZAR PRACTICANT ===
  const saveEdit = async () => {
    try {
      const strapiId = practicantToEdit.id;
      const res = await fetch(`${API_URL}/api/practicants/${strapiId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            name_pract: practicantToEdit.nombre,
            email_practicant: practicantToEdit.correo,
            password_pract: practicantToEdit.contraseña,
          }
        }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      
      setPracticants(practicants.map(practicant => 
        practicant.id === practicantToEdit.id ? practicantToEdit : practicant
      ));
      setShowEditModal(false);
      setPracticantToEdit(null);
      setSuccessMessage("¡Practicante actualizado exitosamente!");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      // console.error("❌ Error actualizando:", err);
      setShowEditModal(false);
      setErrorMessage("Error al actualizar el practicante. Por favor intenta nuevamente.");
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const filteredPracticants = practicants.filter(practicant =>
    practicant.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    practicant.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(practicant.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-[1600px] mx-auto">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando practicantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-[1600px] mx-auto">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="text-green-600" size={24} />
          <p className="text-green-800 font-semibold">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-600" size={24} />
          <p className="text-red-800 font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-black mb-2">Practicantes Registrados</h2>
          <p className="text-gray-600">Gestiona y supervisa todos los practicantes del sistema</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-3 rounded-xl shadow-lg">
            <p className="text-white font-semibold text-sm">
              Total Practicantes
            </p>
            <p className="text-white text-3xl font-bold text-center">{practicants.length}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o ID del practicante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-black placeholder-gray-400 shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border-2 border-gray-100 shadow-sm">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 text-white">
            <tr>
              <th className="px-6 py-5 text-left font-bold text-sm uppercase tracking-wide">ID</th>
              <th className="px-6 py-5 text-left font-bold text-sm uppercase tracking-wide">Practicante</th>
              <th className="px-6 py-5 text-left font-bold text-sm uppercase tracking-wide">Correo</th>
              <th className="px-6 py-5 text-left font-bold text-sm uppercase tracking-wide">Contraseña</th>
              <th className="px-6 py-5 text-left font-bold text-sm uppercase tracking-wide">Rol</th>
              <th className="px-6 py-5 text-center font-bold text-sm uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredPracticants.length > 0 ? (
              filteredPracticants.map((practicant, index) => (
                <tr
                  key={practicant.id}
                  className={`border-b border-gray-100 hover:bg-indigo-50 transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                        <Award className="text-white" size={20} />
                      </div>
                      <span className="font-mono font-bold text-black text-sm">{practicant.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                        <User className="text-white" size={22} />
                      </div>
                      <div>
                        <p className="font-bold text-black">{practicant.nombre}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          Registrado: {practicant.fechaRegistro}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Mail className="text-indigo-500" size={18} />
                      <span className="text-black font-medium">{practicant.correo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <Lock className="text-indigo-500" size={18} />
                      <span className="font-mono text-sm text-black font-semibold">
                        {showPassword[practicant.id] ? practicant.contraseña : '••••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(practicant.id)}
                        className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        {showPassword[practicant.id] ? (
                          <EyeOff className="text-indigo-600" size={18} />
                        ) : (
                          <Eye className="text-indigo-600" size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-4 py-2 rounded-full text-xs font-bold shadow-sm bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {practicant.rol}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleEditClick(practicant)}
                        className="p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-md hover:shadow-lg"
                        title="Editar practicante"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(practicant)}
                        className="p-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md hover:shadow-lg"
                        title="Eliminar practicante"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="text-gray-400" size={40} />
                    </div>
                    <div>
                      <p className="text-black font-semibold text-lg">No se encontraron practicantes</p>
                      <p className="text-gray-500 text-sm">Intenta con otro término de búsqueda</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info Footer */}
      <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-indigo-600 mt-0.5" size={20} />
          <div>
            <p className="text-black font-semibold mb-1">Información importante</p>
            <p className="text-sm text-gray-700">
              Los cambios realizados en esta sección son permanentes y afectan directamente al sistema. Verifica cuidadosamente antes de eliminar o modificar cualquier practicante.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-gray-100 animate-in">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <AlertTriangle className="text-red-600" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">¿Eliminar Practicante?</h3>
              <p className="text-gray-700 leading-relaxed">
                Estás a punto de eliminar a <span className="font-bold text-black">{practicantToDelete?.nombre}</span>. Esta acción es irreversible y el practicante perderá todo acceso al sistema.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-black font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && practicantToEdit && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full border-2 border-gray-100 animate-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Edit2 className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black">Editar Practicante</h3>
                  <p className="text-gray-600">Actualiza la información del usuario</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="text-gray-500" size={24} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-black mb-2">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="nombre"
                    value={practicantToEdit.nombre}
                    onChange={handleEditChange}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-black font-medium transition-all"
                    placeholder="Nombre del practicante"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    name="correo"
                    value={practicantToEdit.correo}
                    onChange={handleEditChange}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-black font-medium transition-all"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="contraseña"
                    value={practicantToEdit.contraseña}
                    onChange={handleEditChange}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-black font-mono font-bold transition-all"
                    placeholder="Contraseña segura"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-black font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticantsListPanel;