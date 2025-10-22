import React, { useState, useEffect } from 'react';
import { X, Code2, FileText, Lightbulb, Plus, Trash2, Save, Loader, BookOpen } from 'lucide-react';
import SuccessModal from "../../modal/SuccessModal";
import ErrorModal from "../../modal/ErrorModal";
const API_URL = import.meta.env.VITE_API_URL;

const EditExercise = ({ isOpen, onClose, onSuccess, exerciseId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [topics, setTopics] = useState([]);

  const [formData, setFormData] = useState({
    name_exercise: '',
    description_exercise: '',
    example_code: '',
    solution_code: '',
    expected_output: '',
    isCorrect: false,
    topic: ''
  });

  const [hints, setHints] = useState([
    { id: 1, hint_text: '' }
  ]);

  // Cargar datos del ejercicio cuando se abre el modal
  useEffect(() => {
    if (isOpen && exerciseId) {
      fetchExerciseData();
      fetchTopics();
    }
  }, [isOpen, exerciseId]);

  const fetchExerciseData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/exercises/${exerciseId}?populate=*`);
      const data = await response.json();
      
      if (data.data) {
        const exercise = data.data;
        
        // Extraer texto del Rich Text
        const descriptionText = extractTextFromRichText(exercise.description_exercise);
        
        // Setear los datos del formulario
        setFormData({
          name_exercise: exercise.name_exercise || '',
          description_exercise: descriptionText,
          example_code: exercise.example_code || '',
          solution_code: exercise.solution_code || '',
          expected_output: exercise.expected_output || '',
          isCorrect: exercise.isCorrect || false,
          topic: exercise.topic?.documentId || ''
        });

        // Setear los hints
        if (exercise.hints && exercise.hints.length > 0) {
          setHints(exercise.hints.map((hint, index) => ({
            id: hint.id || Date.now() + index,
            hint_text: hint.hint_text || ''
          })));
        } else {
          setHints([{ id: 1, hint_text: '' }]);
        }
      }
    } catch (error) {
      console.error('Error al cargar ejercicio:', error);
      setErrorMessage('Error al cargar los datos del ejercicio');
      setIsErrorOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/topics`);
      const data = await response.json();
      
      if (data.data) {
        setTopics(data.data);
      }
    } catch (error) {
      console.error('Error al cargar topics:', error);
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
      .join('\n');
  };

  const convertToRichText = (text) => {
    if (!text || text.trim() === '') {
      return [];
    }

    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    
    return paragraphs.map(paragraph => ({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text: paragraph
        }
      ]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleHintChange = (id, value) => {
    setHints(hints.map(h => 
      h.id === id ? { ...h, hint_text: value } : h
    ));
  };

  const addHint = () => {
    setHints([...hints, { 
      id: Date.now(), 
      hint_text: '' 
    }]);
  };

  const removeHint = (id) => {
    if (hints.length > 1) {
      setHints(hints.filter(h => h.id !== id));
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.name_exercise || !formData.description_exercise || !formData.topic) {
      setErrorMessage('Por favor completa todos los campos obligatorios (Nombre, Descripción y Tema)');
      setIsErrorOpen(true);
      return;
    }

    if (!formData.example_code || !formData.solution_code) {
      setErrorMessage('Por favor completa el código de ejemplo y solución');
      setIsErrorOpen(true);
      return;
    }

    if (!formData.expected_output) {
      setErrorMessage('Por favor completa la salida esperada');
      setIsErrorOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar hints (solo los que tienen texto)
      const validHints = hints
        .filter(h => h.hint_text.trim() !== '')
        .map(h => ({
          hint_text: h.hint_text
        }));

      // Preparar el payload para Strapi 5
      const payload = {
        data: {
          name_exercise: formData.name_exercise,
          description_exercise: convertToRichText(formData.description_exercise),
          example_code: formData.example_code,
          solution_code: formData.solution_code,
          expected_output: formData.expected_output,
          isCorrect: formData.isCorrect,
          topic: formData.topic,
          hints: validHints
        }
      };

      console.log('📤 Payload a enviar (PUT):', payload);

      // PUT a Strapi
      const response = await fetch(`${API_URL}/api/exercises/${exerciseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Error al actualizar el ejercicio');
      }

      console.log('✅ Ejercicio actualizado:', result);

      // Mostrar modal de éxito
      setIsSuccessOpen(true);
      
      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        setIsSuccessOpen(false);
        onClose();
        
        // Llamar callback para recargar la lista
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);

    } catch (error) {
      console.error('❌ Error al actualizar ejercicio:', error);
      setErrorMessage(error.message || 'Error al actualizar el ejercicio');
      setIsErrorOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal con fondo transparente */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-[1400px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl pointer-events-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-violet-600 p-6 flex items-center justify-between z-10 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Code2 className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Editar Ejercicio</h2>
                <p className="text-purple-100 text-sm">Modifica el ejercicio de programación</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
              disabled={isSubmitting}
            >
              <X className="text-white" size={24} />
            </button>
          </div>

          {isLoading ? (
            <div className="p-20 flex flex-col items-center justify-center">
              <Loader className="text-purple-600 animate-spin mb-4" size={48} />
              <p className="text-gray-600 font-medium">Cargando datos del ejercicio...</p>
            </div>
          ) : (
            <div className="p-8 space-y-8">
              {/* Información Básica */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border-2 border-purple-100">
                <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-3">
                  <FileText className="text-purple-600" size={24} />
                  Información Básica
                </h3>
                
                <div className="space-y-5">
                  {/* Nombre del Ejercicio */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Nombre del Ejercicio *
                    </label>
                    <input
                      type="text"
                      name="name_exercise"
                      value={formData.name_exercise}
                      onChange={handleInputChange}
                      placeholder="Ej: Suma de dos números"
                      className="w-full px-4 py-3.5 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-black font-medium transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Descripción del Ejercicio *
                    </label>
                    <textarea
                      name="description_exercise"
                      value={formData.description_exercise}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Describe el ejercicio y qué se espera que el estudiante realice..."
                      className="w-full px-4 py-3.5 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-black font-medium transition-all resize-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Seleccionar Tema */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Tema Relacionado *
                    </label>
                    <div className="relative">
                      <select
                        name="topic"
                        value={formData.topic}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-black font-medium transition-all appearance-none cursor-pointer bg-white"
                        disabled={isSubmitting}
                      >
                        <option value="">Selecciona un tema...</option>
                        {topics.map(topic => (
                          <option key={topic.id} value={topic.documentId}>
                            {topic.name_topic}
                          </option>
                        ))}
                      </select>
                      <BookOpen className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 pointer-events-none" size={20} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Código */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
                <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-3">
                  <Code2 className="text-blue-600" size={24} />
                  Código del Ejercicio
                </h3>
                
                <div className="space-y-5">
                  {/* Código de Ejemplo */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Código de Ejemplo *
                    </label>
                    <textarea
                      name="example_code"
                      value={formData.example_code}
                      onChange={handleInputChange}
                      rows="8"
                      placeholder="// Escribe el código de ejemplo aquí"
                      className="w-full px-4 py-3.5 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 text-black font-mono text-sm transition-all resize-none bg-gray-50"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Código de Solución */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Código de Solución *
                    </label>
                    <textarea
                      name="solution_code"
                      value={formData.solution_code}
                      onChange={handleInputChange}
                      rows="8"
                      placeholder="// Escribe el código de solución aquí"
                      className="w-full px-4 py-3.5 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 text-black font-mono text-sm transition-all resize-none bg-gray-50"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Salida Esperada */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Salida Esperada *
                    </label>
                    <textarea
                      name="expected_output"
                      value={formData.expected_output}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="8&#10;// La salida que debe producir el código"
                      className="w-full px-4 py-3.5 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 text-black font-mono text-sm transition-all resize-none bg-gray-50"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Checkbox: Es Correcto */}
                  <div className="flex items-center gap-3 bg-white rounded-xl p-4 border-2 border-blue-100">
                    <input
                      type="checkbox"
                      id="isCorrect"
                      name="isCorrect"
                      checked={formData.isCorrect}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 border-2 border-blue-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="isCorrect" className="text-sm font-bold text-black cursor-pointer">
                      Marcar como solución correcta
                    </label>
                  </div>
                </div>
              </div>

              {/* Pistas (Hints) - Componente Repetible */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-black flex items-center gap-3">
                    <Lightbulb className="text-amber-600" size={24} />
                    Pistas para el Estudiante
                  </h3>
                  <button
                    onClick={addHint}
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    <Plus size={18} />
                    Agregar Pista
                  </button>
                </div>

                <div className="space-y-4">
                  {hints.map((hint, index) => (
                    <div key={hint.id} className="bg-white rounded-xl p-5 border-2 border-amber-100 relative">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-black bg-amber-100 px-3 py-1 rounded-full">
                          Pista #{index + 1}
                        </span>
                        {hints.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeHint(hint.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-black mb-2">Texto de la Pista</label>
                        <textarea
                          value={hint.hint_text}
                          onChange={(e) => handleHintChange(hint.id, e.target.value)}
                          rows="3"
                          placeholder="Escribe una pista que ayude al estudiante..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-black font-medium transition-all resize-none"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-8 py-4 border-2 border-gray-300 text-black font-bold rounded-xl hover:bg-gray-50 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin" size={24} />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={24} />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        message="¡Ejercicio actualizado exitosamente!"
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={isErrorOpen}
        onClose={() => setIsErrorOpen(false)}
        message={errorMessage}
      />
    </>
  );
};

export default EditExercise;