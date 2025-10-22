// src/features/practicant/DashboardPract.jsx
import React, { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL;
import {
  User,
  Edit,
  BookOpen,
  TrendingUp,
  LogOut,
  Clock,
  Target,
  Award,
  ChevronRight,
  Loader,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import TopicDetailView from "./TopicDetailView";
import EditProfileModal from "./EditProfileModal";
import SuccessModal from "../../modal/SuccessModal";
import ErrorModal from "../../modal/ErrorModal";
const DashboardPract = () => {
  const [activeSection, setActiveSection] = useState("recursos");
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  
  // Estado para datos del practicante
  const [practicantData, setPracticantData] = useState(null);
  const [loadingPracticant, setLoadingPracticant] = useState(true);
  
  // Estados para modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Cargar datos del practicante al montar el componente
  useEffect(() => {
    fetchPracticantData();
  }, []);

  useEffect(() => {
    if (activeSection === "recursos") {
      fetchTopics();
    }
  }, [activeSection]);

  const fetchPracticantData = async () => {
    try {
      setLoadingPracticant(true);
      
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        throw new Error('No hay sesión activa');
      }

      const userData = JSON.parse(userStr);
      const email = userData.user?.email;
      
      if (!email) {
        throw new Error('No se encontró el email del usuario');
      }

      const response = await fetch(
        `${API_URL}/api/practicants?filters[email_practicant][$eq]=${email}`
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.data && result.data.length > 0) {
        setPracticantData(result.data[0]);
      } else {
        throw new Error('No se encontró el practicante con ese email');
      }
    } catch (err) {
      // console.error('❌ Error al cargar practicante:', err);
      setError(err.message);
    } finally {
      setLoadingPracticant(false);
    }
  };

  const fetchTopics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        `${API_URL}/api/topics?populate[exercises][populate]=*&populate[Resources][populate]=*`
      );
      
      if (!response.ok) {
        throw new Error('Error al cargar los temas');
      }

      const result = await response.json();
      
      const mappedTopics = result.data.map((topic, index) => {
        const gradients = [
          'from-purple-500 to-purple-600',
          'from-violet-500 to-violet-600',
          'from-purple-400 to-purple-500',
          'from-indigo-500 to-indigo-600',
          'from-purple-500 to-pink-500',
          'from-violet-600 to-purple-600',
        ];
        
        const description = extractTextFromRichText(topic.description);
        const totalExercises = topic.exercises?.length || 0;
        const completedExercises = 0;
        const progress = totalExercises > 0 
          ? Math.round((completedExercises / totalExercises) * 100) 
          : 0;
        
        return {
          id: topic.id,
          documentId: topic.documentId,
          title: topic.name_topic,
          description: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
          progress: progress,
          exercises: totalExercises,
          completed: completedExercises,
          color: gradients[index % gradients.length],
        };
      });
      
      setTopics(mappedTopics);
    } catch (err) {
      // console.error('❌ Error al cargar topics:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const extractTextFromRichText = (richTextArray) => {
    if (!richTextArray || !Array.isArray(richTextArray)) return '';
    
    return richTextArray
      .map(block => {
        if (block.children && Array.isArray(block.children)) {
          return block.children
            .map(child => child.text || '')
            .join('');
        }
        return '';
      })
      .join(' ');
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleTopicClick = (topicDocumentId) => {
    // console.log('🔍 Topic seleccionado:', topicDocumentId);
    setSelectedTopicId(topicDocumentId);
  };

  const handleBackToTopics = () => {
    // console.log('🔙 Regresando a topics...');
    setSelectedTopicId(null);
    fetchTopics();
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (message) => {
    setSuccessMessage(message);
    setIsSuccessOpen(true);
    fetchPracticantData();
  };

  const handleEditError = (message) => {
    setErrorMessage(message);
    setIsErrorOpen(true);
  };

  const stats = [
    {
      label: "Temas Completados",
      value: `0/${topics.length}`,
      icon: Award,
      color: "bg-purple-500",
    },
    {
      label: "Ejercicios Resueltos",
      value: "0",
      icon: Target,
      color: "bg-violet-500",
    },
    {
      label: "Tiempo de Sesión",
      value: "0h 0m",
      icon: Clock,
      color: "bg-purple-400",
    },
    {
      label: "Racha Actual",
      value: "0 días",
      icon: TrendingUp,
      color: "bg-indigo-500",
    },
  ];

  const progressDetails = topics.map((topic) => ({
    title: topic.title,
    progress: topic.progress,
    status:
      topic.progress === 100
        ? "Completado"
        : topic.progress > 0
        ? "En progreso"
        : "No iniciado",
  }));

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="text-white" size={24} />
                </div>
                <div>
                  {loadingPracticant ? (
                    <div className="animate-pulse">
                      <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </div>
                  ) : practicantData ? (
                    <>
                      <h2 className="font-bold text-purple-900 text-lg">
                        {practicantData.name_pract || 'Sin nombre'}
                      </h2>
                      <p className="text-sm text-gray-500">Practicante</p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-bold text-purple-900 text-lg">Usuario</h2>
                      <p className="text-sm text-gray-500">Practicante</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <nav className="flex items-center gap-1">
              <button
                onClick={() => setActiveSection("perfil")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeSection === "perfil"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-purple-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Edit size={18} />
                  <span>Perfil</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSection("recursos")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeSection === "recursos"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-purple-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={18} />
                  <span>Recursos</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSection("progreso")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeSection === "progreso"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-purple-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} />
                  <span>Progreso</span>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <LogOut size={18} />
                <span>Cerrar sesión</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Perfil Section */}
        {activeSection === "perfil" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-purple-900 mb-6">
              Mi Perfil
            </h1>
            
            {loadingPracticant ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader className="text-purple-600 animate-spin mb-4" size={48} />
                <p className="text-gray-600 font-medium">Cargando perfil...</p>
              </div>
            ) : practicantData ? (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                    <User className="text-white" size={40} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-purple-900 mb-2">
                      {practicantData.name_pract || 'Sin nombre'}
                    </h2>
                    <p className="text-gray-600">{practicantData.email_practicant || 'Sin email'}</p>
                    <p className="text-sm text-purple-600 mt-1">
                      Miembro desde: {formatDate(practicantData.registration_date)}
                    </p>
                  </div>
                  <button 
                    onClick={handleEditProfile}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md flex items-center gap-2"
                  >
                    <Edit size={18} />
                    Editar Perfil
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        value={practicantData.name_pract || ''}
                        readOnly
                        className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none text-black bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={practicantData.email_practicant || ''}
                        readOnly
                        className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none text-black bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rol
                      </label>
                      <input
                        type="text"
                        value={practicantData.role || 'Practicante'}
                        readOnly
                        className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none text-black bg-gray-100 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">El rol no puede ser modificado</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de registro
                      </label>
                      <input
                        type="text"
                        value={formatDate(practicantData.registration_date)}
                        readOnly
                        className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none text-black bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600 font-semibold">No se pudo cargar el perfil</p>
                <button 
                  onClick={fetchPracticantData}
                  className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recursos Section */}
        {activeSection === "recursos" && (
          <div>
            {selectedTopicId ? (
              <TopicDetailView topicId={selectedTopicId} onBack={handleBackToTopics} />
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-purple-900 mb-2">
                    Recursos de Aprendizaje
                  </h1>
                  <p className="text-gray-600">
                    Explora y completa los temas para mejorar tus habilidades de
                    programación
                  </p>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader className="text-purple-600 animate-spin mb-4" size={48} />
                    <p className="text-gray-600 font-medium">Cargando temas...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 font-semibold">Error: {error}</p>
                    <button 
                      onClick={fetchTopics}
                      className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : topics.length === 0 ? (
                  <div className="text-center py-20">
                    <BookOpen className="mx-auto text-gray-300 mb-4" size={64} />
                    <p className="text-gray-500 font-medium text-lg">No hay temas disponibles</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:-translate-y-2"
                      >
                        <div
                          className={`h-32 bg-gradient-to-br ${topic.color} relative overflow-hidden`}
                        >
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-xl font-bold text-white drop-shadow-lg">
                              {topic.title}
                            </h3>
                          </div>
                          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            <span className="text-white text-sm font-semibold">
                              {topic.completed}/{topic.exercises}
                            </span>
                          </div>
                        </div>

                        <div className="p-6">
                          <p className="text-gray-600 text-sm mb-4 h-12">
                            {topic.description}
                          </p>

                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Progreso
                              </span>
                              <span className="text-sm font-bold text-purple-600">
                                {topic.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${topic.color} transition-all duration-500 rounded-full`}
                                style={{ width: `${topic.progress}%` }}
                              ></div>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleTopicClick(topic.documentId)}
                            className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                          >
                            {topic.progress === 0
                              ? "Comenzar"
                              : topic.progress === 100
                              ? "Revisar"
                              : "Continuar"}
                            <ChevronRight
                              size={18}
                              className="group-hover:translate-x-1 transition-transform"
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Progreso Section */}
        {activeSection === "progreso" && (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold text-purple-900 mb-6">
              Mi Progreso
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6"
                >
                  <div
                    className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <stat.icon className="text-white" size={28} />
                  </div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-gray-800">
                    {stat.value}
                  </h3>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-purple-900 mb-6">
                Detalle por Tema
              </h2>
              {progressDetails.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay temas disponibles</p>
              ) : (
                <div className="space-y-4">
                  {progressDetails.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-purple-100 rounded-xl p-5 hover:border-purple-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.status === "Completado"
                                ? "bg-green-100 text-green-700"
                                : item.status === "En progreso"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-lg font-bold text-purple-600">
                            {item.progress}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">¡Sigue así!</h2>
              <p className="text-purple-100 mb-6">
                Has completado el 0% del programa. Continúa aprendiendo para
                desbloquear nuevas insignias y logros.
              </p>
              <div className="flex gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex-1 text-center">
                  <Award className="mx-auto mb-2 text-white" size={32} />
                  <p className="text-sm">Principiante</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex-1 text-center opacity-50">
                  <Award className="mx-auto mb-2 text-white" size={32} />
                  <p className="text-sm">Intermedio</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex-1 text-center opacity-50">
                  <Award className="mx-auto mb-2 text-white" size={32} />
                  <p className="text-sm">Experto</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modales */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        practicantData={practicantData}
        onSuccess={handleEditSuccess}
        onError={handleEditError}
      />

      <SuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        message={successMessage}
      />

      <ErrorModal
        isOpen={isErrorOpen}
        onClose={() => setIsErrorOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default DashboardPract;