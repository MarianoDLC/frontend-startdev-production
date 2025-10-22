import React, { useState, useEffect } from "react";
import AdminRegisterForm from '../administrator/AdminRegisterForm';
import AdminListPanel from "../administrator/AdminListPanel";
import CreateTopicForm from "../topics/CreateTopicForm";
import TopicsListView from "../topics/TopicsListView";
import ExercisesListView from "../topics/ExcercisesListView";
import PracticantsListPanel from "../administrator/PracticantsListPanel";
import SessionTimerAdmin from "../administrator/SesionTimerAdmin";
const API_URL = import.meta.env.VITE_API_URL;
import {
  LayoutDashboard,
  Users,
  UserPlus,
  List,
  BarChart3,
  PlusCircle,
  FileText,
  Target,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [administratorData, setAdministratorData] = useState(null);
  const [loadingAdministrator, setLoadingAdministrator] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalPracticantes: 0,
    totalTopics: 0,
    totalExercises: 0,
    completedExercises: 0,
    successRate: 0,
  });
  const [recentTopics, setRecentTopics] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Función para obtener los datos del administrador
  const fetchAdministratorData = async () => {
    try {
      setLoadingAdministrator(true);
      
      const userStr = localStorage.getItem('user');
      
      if (!userStr) {
        throw new Error('No hay sesión activa');
      }
      
      const userData = JSON.parse(userStr);
      const email = userData.user?.email;
      
      if (!email) {
        throw new Error('No se encontró el email del usuario');
      }
      
      // console.log('🔍 Buscando administrador con email:', email);
      
      const response = await fetch(
        `${API_URL}/api/administrators?filters[email_administrator][$eq]=${email}`
      );
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      // console.log('📦 Respuesta completa de la API:', result);
      
      if (result.data && result.data.length > 0) {
        // console.log('✅ Administrador encontrado:', result.data[0]);
        setAdministratorData(result.data[0]);
      } else {
        // console.log('⚠️ No se encontró administrador con ese email');
        throw new Error('No se encontró el administrador con ese email');
      }
    } catch (err) {
      // console.error('❌ Error al cargar administrador:', err);
      setError(err.message);
    } finally {
      setLoadingAdministrator(false);
    }
  };

  // Función para obtener estadísticas del dashboard
  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      
      // Obtener total de practicantes
      const practicantsRes = await fetch(`${API_URL}/api/practicants`);
      const practicantsData = await practicantsRes.json();
      const totalPracticantes = practicantsData.data?.length || 0;
      
      // Obtener total de temas
      const topicsRes = await fetch(`${API_URL}/api/topics`);
      const topicsData = await topicsRes.json();
      const totalTopics = topicsData.data?.length || 0;
      
      // Obtener temas recientes (últimos 4)
      const recentTopicsData = topicsData.data?.slice(0, 4).map(topic => ({
        id: topic.id,
        name: topic.name_topic || topic.attributes?.name_topic || 'Sin nombre',
      })) || [];
      
      // Obtener total de ejercicios
      const exercisesRes = await fetch(`${API_URL}/api/exercises`);
      const exercisesData = await exercisesRes.json();
      const totalExercises = exercisesData.data?.length || 0;
      
      // Obtener ejercicios completados (ExercisePract con isCorrectExercise = true)
      const exercisePractsRes = await fetch(`${API_URL}/api/exercise-practs`);
      const exercisePractsData = await exercisePractsRes.json();
      
      const completedExercises = exercisePractsData.data?.filter(ep => 
        ep.isCorrectExercise === true || ep.attributes?.isCorrectExercise === true
      ).length || 0;
      
      const totalAttempts = exercisePractsData.data?.length || 0;
      const successRate = totalAttempts > 0 ? Math.round((completedExercises / totalAttempts) * 100) : 0;
      
      setDashboardStats({
        totalPracticantes,
        totalTopics,
        totalExercises,
        completedExercises,
        successRate,
      });
      
      setRecentTopics(recentTopicsData);
      
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Cargar datos del administrador al montar el componente
useEffect(() => {
  const loadDashboard = async () => {
    await fetchAdministratorData(); // primero carga el admin
    await fetchDashboardStats(); // luego carga las estadísticas
  };
  loadDashboard();
}, []);

  const menuSections = [
    {
      title: "CONTROL",
      items: [
        { id: "nuevo-admin", label: "Agregar nuevo admin", icon: UserPlus },
        { id: "administradores", label: "Administradores", icon: Users },
        { id: "detalles", label: "Detalles", icon: FileText },
      ],
    },
    {
      title: "TEMAS",
      items: [
        { id: "nuevo-tema", label: "Nuevo tema", icon: PlusCircle },
        { id: "lista-temas", label: "Lista de temas", icon: List },
        { id: "ejercicios-temas", label: "Ejercicios por temas", icon: Target },
      ],
    },
    {
      title: "PRACTICANTES",
      items: [
        { id: "lista-practicantes", label: "Lista", icon: Users },
        { id: "graficas-progreso", label: "Gráficas (progresos)", icon: BarChart3 },
        { id: "ranking", label: "Ranking", icon: Award },
      ],
    },
  ];

  const statsCards = [
    {
      title: "Total Practicantes",
      value: loadingStats ? "..." : dashboardStats.totalPracticantes.toString(),
      change: `${dashboardStats.totalPracticantes} activos`,
      color: "bg-purple-500",
    },
    {
      title: "Temas Activos",
      value: loadingStats ? "..." : dashboardStats.totalTopics.toString(),
      change: `${dashboardStats.totalTopics} temas`,
      color: "bg-violet-500",
    },
    {
      title: "Ejercicios Completados",
      value: loadingStats ? "..." : dashboardStats.completedExercises.toString(),
      change: `de ${dashboardStats.totalExercises}`,
      color: "bg-purple-400",
    },
    {
      title: "Tasa de Éxito",
      value: loadingStats ? "..." : `${dashboardStats.successRate}%`,
      change: `${dashboardStats.successRate}% correcto`,
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
       {administratorData && (
        <SessionTimerAdmin administrator={administratorData} />
      )}
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-72" : "w-0"
        } transition-all duration-300 bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 text-white overflow-hidden flex flex-col`}
      >
        <div className="flex flex-col h-full">
          {/* Parte superior con scroll */}
          <div className="p-6 flex-1 flex flex-col overflow-y-auto">
            {/* User Profile */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-3 shadow-lg">
                {loadingAdministrator ? (
                  <span className="text-sm">...</span>
                ) : administratorData ? (
                  <span className="text-2xl font-bold">
                    {(() => {
                      const name = administratorData.name_administrator || administratorData.attributes?.name_administrator || '';
                      return name
                        .split(' ')
                        .map(word => word[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'AD';
                    })()}
                  </span>
                ) : (
                  <span className="text-2xl font-bold">AD</span>
                )}
              </div>
              <h3 className="font-semibold text-lg">
                {loadingAdministrator 
                  ? 'Cargando...' 
                  : administratorData 
                    ? (administratorData.name_administrator || administratorData.attributes?.name_administrator || 'Administrador')
                    : 'Administrador'}
              </h3>
              <p className="text-purple-300 text-sm">
                {loadingAdministrator 
                  ? 'Cargando...' 
                  : administratorData 
                    ? (administratorData.email_administrator || administratorData.attributes?.email_administrator || 'admin@example.com')
                    : 'admin@example.com'}
              </p>
              {error && (
                <p className="text-red-300 text-xs mt-2">
                  {error}
                </p>
              )}
            </div>

            {/* Dashboard Overview */}
            <div
              onClick={() => setActiveSection("dashboard")}
              className={`flex items-center gap-3 p-3 rounded-lg mb-6 cursor-pointer transition-all ${
                activeSection === "dashboard"
                  ? "bg-purple-700 shadow-lg"
                  : "hover:bg-purple-800"
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </div>

            {/* Menu Sections */}
            <nav className="space-y-6">
              {menuSections.map((section, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-purple-700"></div>
                    <span className="text-xs font-bold text-purple-300 px-2">
                      {section.title}
                    </span>
                    <div className="h-px flex-1 bg-purple-700"></div>
                  </div>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                            activeSection === item.id
                              ? "bg-purple-700 shadow-md"
                              : "hover:bg-purple-800/50"
                          }`}
                        >
                          <item.icon size={18} />
                          <span className="text-sm">{item.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Parte fija abajo */}
          <div className="p-6 border-t border-purple-700 space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-800 transition-all">
              <Settings size={18} />
              <span className="text-sm">Configuración</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-800 transition-all text-purple-300"
            >
              <LogOut size={18} />
              <span className="text-sm">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
              >
                {isSidebarOpen ? (
                  <X className="text-purple-700" size={24} />
                ) : (
                  <Menu className="text-purple-700" size={24} />
                )}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-purple-900">StartDev</h1>
                <p className="text-sm text-gray-500">Panel de Administración</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
                />
                <LayoutDashboard
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {/* === DASHBOARD PRINCIPAL === */}
          {activeSection === "dashboard" && (
            <div>
              <h2 className="text-2xl font-bold text-purple-900 mb-6">
                Vista General
              </h2>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsCards.map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6"
                  >
                    <div
                      className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}
                    >
                      <BarChart3 className="text-white" size={24} />
                    </div>
                    <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                    <div className="flex items-end justify-between">
                      <h3 className="text-3xl font-bold text-gray-800">
                        {stat.value}
                      </h3>
                      <span className="text-green-500 text-sm font-medium">
                        {stat.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-xl font-bold text-purple-900 mb-4">
                    Estadísticas Generales
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <Users className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Total Practicantes</p>
                          <p className="text-sm text-gray-500">Usuarios registrados</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">
                        {loadingStats ? "..." : dashboardStats.totalPracticantes}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-violet-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-500 rounded-full flex items-center justify-center">
                          <Target className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Total Ejercicios</p>
                          <p className="text-sm text-gray-500">Ejercicios disponibles</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-violet-600">
                        {loadingStats ? "..." : dashboardStats.totalExercises}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                          <Award className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Ejercicios Completados</p>
                          <p className="text-sm text-gray-500">Resueltos correctamente</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-indigo-600">
                        {loadingStats ? "..." : dashboardStats.completedExercises}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-xl font-bold text-purple-900 mb-4">
                    Temas Recientes
                  </h3>
                  <div className="space-y-3">
                    {loadingStats ? (
                      <p className="text-gray-500 text-center py-8">Cargando temas...</p>
                    ) : recentTopics.length > 0 ? (
                      recentTopics.map((topic, idx) => (
                        <div
                          key={topic.id}
                          className="flex items-center justify-between p-4 border border-purple-100 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                              <FileText className="text-white" size={20} />
                            </div>
                            <span className="font-medium text-gray-700">
                              {topic.name}
                            </span>
                          </div>
                          <span className="text-purple-600 font-semibold text-sm">
                            Tema #{idx + 1}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No hay temas disponibles</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === NUEVO ADMIN === */}
          {activeSection === "nuevo-admin" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-purple-900 mb-4">
                Agregar nuevo administrador
              </h2>
              <AdminRegisterForm />
            </div>
          )}
          {/* === LISTA ADMINISTRADORES === */}
          {activeSection === "administradores" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <AdminListPanel />
            </div>
          )}
          {/* === AGREGAR NUEVO TEMA === */}
          {activeSection === "nuevo-tema" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <CreateTopicForm />
            </div>
          )}
          {/* === LISTA TEMAS === */}
          {activeSection === "lista-temas" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <TopicsListView />
            </div>
          )}

          {/* === LISTA EJERCICIOS === */}
          {activeSection === "ejercicios-temas" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <ExercisesListView />
            </div>
          )}


          {/* === LISTA PRACTICANTES === */}
          {activeSection === "lista-practicantes" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <PracticantsListPanel />
            </div>
          )}
          {/* === OTRAS SECCIONES === */}
          {activeSection !== "dashboard" && activeSection !== "nuevo-admin" && activeSection !== "administradores" && activeSection !== "nuevo-tema" &&
          activeSection !== "lista-temas" &&  activeSection !== "ejercicios-temas" && activeSection !== "lista-practicantes" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-purple-900 mb-4">
                {
                  menuSections
                    .flatMap((s) => s.items)
                    .find((i) => i.id === activeSection)?.label
                }
              </h2>
              <p className="text-gray-600">
                Contenido de esta sección próximamente...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;