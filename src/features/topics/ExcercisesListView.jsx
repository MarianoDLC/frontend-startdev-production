import React, { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL;
import {
  Code2,
  Plus,
  Edit,
  Trash2,
  Loader,
  CheckCircle,
  XCircle,
  Lightbulb,
} from "lucide-react";
import NewExercise from "../topics/NewExcercise";
import SuccessModal from "../../modal/SuccessModal";
import ErrorModal from "../../modal/ErrorModal";
import EditExercise from "../topics/EditExercise";
const ExercisesListView = () => {
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewExerciseOpen, setIsNewExerciseOpen] = useState(false);
  const [isEditExerciseOpen, setIsEditExerciseOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);

  // Estados para los modales
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/api/exercises?populate=*`
      );
      const data = await response.json();

      // Strapi 5 devuelve los datos en data.data
      if (data.data) {
        setExercises(data.data);
      }
    } catch (error) {
      console.error("Error al cargar ejercicios:", error);
      setModalMessage("Error al cargar los ejercicios");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (exercise) => {
    setExerciseToDelete(exercise);
    setShowDeleteConfirm(true);
  };

  const handleEditClick = (exercise) => {
    setSelectedExerciseId(exercise.documentId);
    setIsEditExerciseOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!exerciseToDelete) return;

    try {
      // En Strapi 5 se usa documentId para DELETE
      const response = await fetch(
        `${API_URL}/api/exercises/${exerciseToDelete.documentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setModalMessage("Ejercicio eliminado exitosamente");
        setShowSuccessModal(true);
        // Recargar la lista de ejercicios
        fetchExercises();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error al eliminar ejercicio:", error);
      setModalMessage("Error al eliminar el ejercicio");
      setShowErrorModal(true);
    } finally {
      setShowDeleteConfirm(false);
      setExerciseToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setExerciseToDelete(null);
  };

  const handleExerciseCreated = () => {
    // Recargar la lista de ejercicios después de crear uno nuevo
    fetchExercises();
    setModalMessage("¡Ejercicio creado exitosamente!");
    setShowSuccessModal(true);
  };

  const extractTextFromRichText = (richTextArray) => {
    if (!richTextArray || !Array.isArray(richTextArray)) return "";

    return richTextArray
      .map((block) => {
        if (block.children && Array.isArray(block.children)) {
          return block.children.map((child) => child.text || "").join("");
        }
        return "";
      })
      .join(" ");
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-[1600px] mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="text-purple-600 animate-spin mb-4" size={48} />
          <p className="text-gray-600 font-medium">Cargando ejercicios...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <Code2 className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-black">
                  Ejercicios de Programación
                </h2>
                <p className="text-gray-600">
                  {exercises.length}{" "}
                  {exercises.length === 1
                    ? "ejercicio disponible"
                    : "ejercicios disponibles"}
                </p>
              </div>
            </div>

            {/* Botón Nuevo Ejercicio */}
            <button
              type="button"
              onClick={() => setIsNewExerciseOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg"
            >
              <Plus size={20} />
              <span>Nuevo Ejercicio</span>
            </button>
          </div>
        </div>

        {/* Exercises Grid */}
        {exercises.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Code2 className="text-purple-400" size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Aún no se agregaron ejercicios
            </h3>
            <p className="text-gray-500 font-medium text-lg mb-2">
              Comienza creando tu primer ejercicio de programación
            </p>
            <p className="text-gray-400 text-sm">
              Haz clic en el botón "Nuevo Ejercicio" para comenzar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.map((exercise, index) => {
              const description = extractTextFromRichText(
                exercise.description_exercise
              );
              const gradients = [
                "from-violet-500 via-purple-500 to-fuchsia-500",
                "from-purple-500 via-violet-500 to-indigo-500",
                "from-fuchsia-500 via-purple-500 to-pink-500",
              ];
              const gradient = gradients[index % gradients.length];

              return (
                <div
                  key={exercise.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
                >
                  {/* Gradient top bar */}
                  <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>

                  {/* Card Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}
                      >
                        <Code2 className="text-white" size={28} />
                      </div>

                      {/* Status Badge */}
                      {exercise.isCorrect ? (
                        <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          <CheckCircle size={14} />
                          <span>Correcto</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                          <XCircle size={14} />
                          <span>Incorrecto</span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {exercise.name_exercise}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 mb-4">
                      {description}
                    </p>

                    {/* Code Preview */}
                    {exercise.example_code && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-gray-500 font-semibold mb-2">
                          CÓDIGO DE EJEMPLO:
                        </p>
                        <pre className="text-xs text-gray-700 font-mono line-clamp-3 overflow-hidden">
                          {exercise.example_code}
                        </pre>
                      </div>
                    )}

                    {/* Hints indicator */}
                    {exercise.hints && exercise.hints.length > 0 && (
                      <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
                        <Lightbulb size={16} />
                        <span>
                          {exercise.hints.length}{" "}
                          {exercise.hints.length === 1
                            ? "pista disponible"
                            : "pistas disponibles"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 pt-0 flex gap-3 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleEditClick(exercise)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all shadow-md"
                    >
                      <Edit size={18} />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(exercise)}
                      className="px-4 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Modal de Editar Ejercicio */}
      <EditExercise
        isOpen={isEditExerciseOpen}
        onClose={() => {
          setIsEditExerciseOpen(false);
          setSelectedExerciseId(null);
        }}
        onSuccess={handleExerciseCreated}
        exerciseId={selectedExerciseId}
      />
      {/* Modal de confirmación de eliminación - FONDO TRANSPARENTE */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 pointer-events-auto">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="text-red-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¿Eliminar ejercicio?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                ¿Estás seguro de que deseas eliminar el ejercicio "
                {exerciseToDelete?.name_exercise}"? Esta acción no se puede
                deshacer.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Ejercicio */}
      <NewExercise
        isOpen={isNewExerciseOpen}
        onClose={() => setIsNewExerciseOpen(false)}
        onSuccess={handleExerciseCreated}
      />

      {/* Modales de Success y Error */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={modalMessage}
      />
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={modalMessage}
      />
    </>
  );
};

export default ExercisesListView;
