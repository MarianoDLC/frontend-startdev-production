import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye, EyeOff, Shield, Mail, User, Lock, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import SuccessModal from "../../modal/SuccessModal";
import ErrorModal from "../../modal/ErrorModal";
const API_URL = import.meta.env.VITE_API_URL;
const AdminListPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  // === FETCH ADMINS ===
  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_URL}/api/administrators`);
      if (!res.ok) throw new Error("Error en la conexión");
      const data = await res.json();
      console.log("📦 Data de Strapi:", data);
      const parsed = data.data.map((item) => ({
        id: item.id,
        strapiId: item.id,
        nombre: item.name_administrator,
        correo: item.email_administrator,
        contraseña: item.pass_administrator || "—",
        fechaRegistro: item.createdAt?.split("T")[0],
        rol: item.role || "Admin",
      }));
      setAdmins(parsed);
    } catch (err) {
      console.error("❌ Error cargando administradores:", err);
      setIsErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDeleteClick = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  // === ELIMINAR ADMIN ===
  const confirmDelete = async () => {
    try {
      const strapiId = adminToDelete.id;
      const res = await fetch(`${API_URL}/api/administrators/${strapiId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setAdmins(admins.filter((a) => a.id !== adminToDelete.id));
      setShowDeleteModal(false);
      setAdminToDelete(null);
      setIsModalOpen(true);
    } catch (err) {
      console.error("❌ Error eliminando:", err);
      setShowDeleteModal(false);
      setIsErrorOpen(true);
    }
  };

  const handleEditClick = (admin) => {
    setAdminToEdit({ ...admin });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setAdminToEdit(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // === ACTUALIZAR ADMIN ===
  const saveEdit = async () => {
    try {
      const strapiId = adminToEdit.id;
      const res = await fetch(`${API_URL}/api/administrators/${strapiId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            name_administrator: adminToEdit.nombre,
            email_administrator: adminToEdit.correo,
            pass_administrator: adminToEdit.contraseña,
          }
        }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      
      setAdmins(admins.map(admin => 
        admin.id === adminToEdit.id ? adminToEdit : admin
      ));
      setShowEditModal(false);
      setAdminToEdit(null);
      setIsModalOpen(true);
    } catch (err) {
      console.error("❌ Error actualizando:", err);
      setShowEditModal(false);
      setIsErrorOpen(true);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-[1600px] mx-auto">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando administradores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-black mb-2">Administradores del Sistema</h2>
          <p className="text-gray-600">Gestiona y supervisa todos los administradores registrados</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-purple-500 to-violet-600 px-6 py-3 rounded-xl shadow-lg">
            <p className="text-white font-semibold text-sm">
              Total Administradores
            </p>
            <p className="text-white text-3xl font-bold text-center">{admins.length}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o ID del administrador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-all text-black placeholder-gray-400 shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border-2 border-gray-100 shadow-sm">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-purple-600 via-purple-700 to-violet-600 text-white">
            <tr>
              <th className="px-6 py-5 text-left font-bold text-sm uppercase tracking-wide">ID Admin</th>
              <th className="px-6 py-5 text-left font-bold text-sm uppercase tracking-wide">Administrador</th>
              <th className="px-6 py-5 text-left font-bold text-sm uppercase tracking-wide">Correo</th>
              <th className="px-6 py-5 text-left font-bold text-sm uppercase tracking-wide">Contraseña</th>
              <th className="px-6 py-5 text-left font-bold text-sm uppercase tracking-wide">Rol</th>
              <th className="px-6 py-5 text-center font-bold text-sm uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredAdmins.length > 0 ? (
              filteredAdmins.map((admin, index) => (
                <tr
                  key={admin.id}
                  className={`border-b border-gray-100 hover:bg-purple-50 transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md">
                        <Shield className="text-white" size={20} />
                      </div>
                      <span className="font-mono font-bold text-black text-sm">{admin.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                        <User className="text-white" size={22} />
                      </div>
                      <div>
                        <p className="font-bold text-black">{admin.nombre}</p>
                        <p className="text-xs text-gray-500">Registrado: {admin.fechaRegistro}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Mail className="text-purple-500" size={18} />
                      <span className="text-black font-medium">{admin.correo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <Lock className="text-purple-500" size={18} />
                      <span className="font-mono text-sm text-black font-semibold">
                        {showPassword[admin.id] ? admin.contraseña : '••••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(admin.id)}
                        className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        {showPassword[admin.id] ? (
                          <EyeOff className="text-purple-600" size={18} />
                        ) : (
                          <Eye className="text-purple-600" size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
                      admin.rol === 'Super Admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      admin.rol === 'Admin' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    }`}>
                      {admin.rol}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleEditClick(admin)}
                        className="p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-md hover:shadow-lg"
                        title="Editar administrador"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(admin)}
                        className="p-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md hover:shadow-lg"
                        title="Eliminar administrador"
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
                      <p className="text-black font-semibold text-lg">No se encontraron administradores</p>
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
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-100">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-purple-600 mt-0.5" size={20} />
          <div>
            <p className="text-black font-semibold mb-1">Información importante</p>
            <p className="text-sm text-gray-700">
              Los cambios realizados en esta sección son permanentes y afectan directamente al sistema. Verifica cuidadosamente antes de eliminar o modificar cualquier administrador.
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
              <h3 className="text-2xl font-bold text-black mb-3">¿Eliminar Administrador?</h3>
              <p className="text-gray-700 leading-relaxed">
                Estás a punto de eliminar a <span className="font-bold text-black">{adminToDelete?.nombre}</span>. Esta acción es irreversible y el administrador perderá todo acceso al sistema.
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
      {showEditModal && adminToEdit && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full border-2 border-gray-100 animate-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Edit2 className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black">Editar Administrador</h3>
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
                    value={adminToEdit.nombre}
                    onChange={handleEditChange}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-black font-medium transition-all"
                    placeholder="Nombre del administrador"
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
                    value={adminToEdit.correo}
                    onChange={handleEditChange}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-black font-medium transition-all"
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
                    value={adminToEdit.contraseña}
                    onChange={handleEditChange}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-black font-mono font-bold transition-all"
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
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message="¡Operación realizada exitosamente!"
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={isErrorOpen}
        onClose={() => setIsErrorOpen(false)}
        message="Hubo un error al procesar la solicitud. Por favor intenta nuevamente."
      />
    </div>
  );
};

export default AdminListPanel;