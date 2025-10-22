import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { RefreshCw } from 'lucide-react';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // ⏳ Espera a que el contexto termine de cargar con ReloadModal
  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Fondo con gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-500 to-purple-700 animate-gradient"></div>
        
        {/* Overlay con blur */}
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
        
        {/* Círculos decorativos animados */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-400/10 rounded-full blur-3xl animate-ping"></div>
        
        {/* Contenido principal */}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
          {/* Loader principal con anillos */}
          <div className="relative">
            {/* Anillo exterior girando */}
            <div className="absolute inset-0 w-32 h-32 border-8 border-white/30 border-t-white rounded-full animate-spin"></div>
            
            {/* Anillo medio girando al revés */}
            <div className="absolute inset-2 w-28 h-28 border-8 border-purple-200/40 border-b-purple-200 rounded-full animate-spin-reverse"></div>
            
            {/* Centro con icono */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <RefreshCw className="text-purple-600 animate-spin" size={40} strokeWidth={2.5} />
              </div>
            </div>
          </div>
          
          {/* Texto animado */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white animate-pulse">
              Cargando sesión...
            </h2>
            
            {/* Puntos animados */}
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>
            </div>
            
            <p className="text-purple-100 text-lg font-medium">
              Por favor espera un momento
            </p>
          </div>
          
          {/* Barra de progreso infinita */}
          <div className="w-80 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full animate-progress shadow-lg"></div>
          </div>
        </div>
        
        {/* Estilos CSS personalizados */}
        <style>{`
          @keyframes gradient {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }
          
          @keyframes spin-reverse {
            from {
              transform: rotate(360deg);
            }
            to {
              transform: rotate(0deg);
            }
          }
          
          .animate-spin-reverse {
            animation: spin-reverse 1.5s linear infinite;
          }
          
          @keyframes progress {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(400%);
            }
          }
          
          .animate-progress {
            animation: progress 1.5s ease-in-out infinite;
          }
          
          .delay-100 {
            animation-delay: 0.1s;
          }
          
          .delay-200 {
            animation-delay: 0.2s;
          }
          
          .delay-700 {
            animation-delay: 0.7s;
          }
        `}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role?.toLowerCase())
  ) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;