import React, { useState, useEffect } from 'react';

const ErrorModal = ({ isOpen, onClose, title = "¡Algo salió mal!", message = "Ha ocurrido un error inesperado", duration = null }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
      
      if (duration) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isAnimating ? 'backdrop-blur-md bg-black/40' : 'backdrop-blur-none bg-black/0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-gradient-to-br from-red-50 to-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300 transform ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-red-200 rounded-full blur-3xl opacity-30 -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-300 rounded-full blur-3xl opacity-20 translate-y-10 -translate-x-10"></div>
        
        {/* Contenido */}
        <div className="relative p-8">
          {/* Icono de error animado */}
          <div className="flex justify-center mb-6">
            <div className={`relative transition-all duration-500 ${isAnimating ? 'scale-100 rotate-0' : 'scale-0 -rotate-180'}`}>
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              {/* Anillo decorativo */}
              <div className={`absolute inset-0 border-4 border-red-300 rounded-full transition-all duration-700 ${isAnimating ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}></div>
            </div>
          </div>

          {/* Título */}
          <h2 className={`text-3xl font-bold text-center mb-4 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent transition-all duration-500 delay-100 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {title}
          </h2>

          {/* Mensaje */}
          <p className={`text-gray-700 text-center text-lg transition-all duration-500 delay-200 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {message}
          </p>

          {/* Botón de cerrar */}
          <button
            onClick={handleClose}
            className={`mt-6 w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
              isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '300ms' }}
          >
            Entendido
          </button>

          {/* Botón X en la esquina */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors duration-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Barra de progreso inferior (si tiene duración) */}
        {duration && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-100">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-700"
              style={{
                animation: `shrink ${duration}ms linear forwards`,
              }}
            ></div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default ErrorModal;
