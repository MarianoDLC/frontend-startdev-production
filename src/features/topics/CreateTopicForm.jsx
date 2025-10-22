import React, { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;
import {
  BookOpen,
  Target,
  FileText,
  Plus,
  Trash2,
  Link,
  Code,
  Lightbulb,
  Image,
  X,
  Upload,
  CheckCircle,
} from "lucide-react";
import SuccessModal from "../../modal/SuccessModal";
import ErrorModal from "../../modal/ErrorModal";

const CreateTopicForm = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name_topic: "",
    description: "",
    objectives: "",
  });

  const [resources, setResources] = useState([
    {
      id: 1,
      title_resource: "",
      url_resource: "",
      description_resource: "",
      type_resource: [],
    },
  ]);

  const [examples, setExamples] = useState([
    { id: 1, title_example: "", code_snipped: "", explanation: "" },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResourceChange = (id, field, value) => {
    setResources(
      resources.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleExampleChange = (id, field, value) => {
    setExamples(
      examples.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleFileChange = (id, files) => {
    setResources(
      resources.map((r) =>
        r.id === id ? { ...r, type_resource: Array.from(files) } : r
      )
    );
  };

  const addResource = () => {
    setResources([
      ...resources,
      {
        id: Date.now(),
        title_resource: "",
        url_resource: "",
        description_resource: "",
        type_resource: [],
      },
    ]);
  };

  const removeResource = (id) => {
    if (resources.length > 1) {
      setResources(resources.filter((r) => r.id !== id));
    }
  };

  const addExample = () => {
    setExamples([
      ...examples,
      {
        id: Date.now(),
        title_example: "",
        code_snipped: "",
        explanation: "",
      },
    ]);
  };

  const removeExample = (id) => {
    if (examples.length > 1) {
      setExamples(examples.filter((e) => e.id !== id));
    }
  };

const handleSubmit = async () => {
  if (!formData.name_topic || !formData.description || !formData.objectives) {
    setIsErrorOpen(true);
    return;
  }

  setIsSubmitting(true);

  try {
    const payload = {
      data: {
        name_topic: formData.name_topic,
        description: [
          { type: "paragraph", children: [{ type: "text", text: formData.description }] },
        ],
        objectives: [
          { type: "paragraph", children: [{ type: "text", text: formData.objectives }] },
        ],
        Resources: resources.map((r) => ({
          title_resource: r.title_resource,
          url_resource: r.url_resource,
          description_resource: [
            { type: "paragraph", children: [{ type: "text", text: r.description_resource || "" }] },
          ],
        })),
        Examples: examples.map((e) => ({
          title_example: e.title_example,
          code_snipped: e.code_snipped,
          explanation: [
            { type: "paragraph", children: [{ type: "text", text: e.explanation || "" }] },
          ],
        })),
      },
    };

    console.log("📤 Payload enviado a Strapi 5:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${API_URL}/api/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    // console.log("📩 Respuesta RAW de Strapi:", responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("⚠️ No se pudo parsear la respuesta JSON:", parseError);
    }

    if (!response.ok) {
      console.error("❌ Error del servidor completo:", result);
      throw new Error(
        result?.error?.message ||
        result?.error?.details?.errors?.map((e) => e.message).join(", ") ||
        "Error desconocido al crear el topic"
      );
    }

    // console.log("✅ Topic creado correctamente:", result);
    const topicId = result.data?.id;

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      if (resource.type_resource && resource.type_resource.length > 0) {
        const formDataFiles = new FormData();
        resource.type_resource.forEach((file) => formDataFiles.append("files", file));
        formDataFiles.append("ref", "api::topic.topic");
        formDataFiles.append("refId", topicId);
        formDataFiles.append("field", `Resources[${i}].type_resource`);

        const uploadResponse = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          body: formDataFiles,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          console.error(`⚠️ Error al subir archivos del recurso #${i + 1}:`, uploadError);
        } else {
          const uploadResult = await uploadResponse.json();
          console.log(`✅ Archivos del recurso #${i + 1} subidos:`, uploadResult);
        }
      }
    }

    setFormData({ name_topic: "", description: "", objectives: "" });
    setResources([{ id: 1, title_resource: "", url_resource: "", description_resource: "", type_resource: [] }]);
    setExamples([{ id: 1, title_example: "", code_snipped: "", explanation: "" }]);
    setIsModalOpen(true);

  } catch (error) {
    console.error("❌ Error inesperado:", error);
    setIsErrorOpen(true);
  } finally {
    setIsSubmitting(false);
  }
};



  return (
    <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="text-white" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-black">Crear Nuevo Tema</h2>
            <p className="text-gray-600">
              Completa la información para agregar un nuevo tema de aprendizaje
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="space-y-8">
        {/* Información Básica */}
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border-2 border-purple-100">
          <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-3">
            <FileText className="text-purple-600" size={24} />
            Información Básica
          </h3>

          <div className="space-y-5">
            {/* Nombre del Tema */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Nombre del Tema *
              </label>
              <input
                type="text"
                name="name_topic"
                value={formData.name_topic}
                onChange={handleInputChange}
                placeholder="Ej: Variables y Tipos de Datos en JavaScript"
                className="w-full px-4 py-3.5 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-black font-medium transition-all"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Descripción *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Describe de qué trata este tema y qué aprenderán los estudiantes..."
                className="w-full px-4 py-3.5 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-black font-medium transition-all resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Soporta formato enriquecido (Rich text)
              </p>
            </div>

            {/* Objetivos */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Objetivos de Aprendizaje *
              </label>
              <textarea
                name="objectives"
                value={formData.objectives}
                onChange={handleInputChange}
                rows="5"
                placeholder="Define los objetivos que los estudiantes alcanzarán al completar este tema..."
                className="w-full px-4 py-3.5 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-black font-medium transition-all resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Soporta formato enriquecido (Rich text)
              </p>
            </div>
          </div>
        </div>

        {/* Recursos */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-black flex items-center gap-3">
              <Link className="text-blue-600" size={24} />
              Recursos Adicionales
            </h3>
            <button
              onClick={addResource}
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
            >
              <Plus size={18} />
              Agregar Recurso
            </button>
          </div>

          <div className="space-y-6">
            {resources.map((resource, index) => (
              <div
                key={resource.id}
                className="bg-white rounded-xl p-5 border-2 border-blue-100 relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-black bg-blue-100 px-3 py-1 rounded-full">
                    Recurso #{index + 1}
                  </span>
                  {resources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeResource(resource.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Título del Recurso
                    </label>
                    <input
                      type="text"
                      value={resource.title_resource}
                      onChange={(e) =>
                        handleResourceChange(
                          resource.id,
                          "title_resource",
                          e.target.value
                        )
                      }
                      placeholder="Ej: Documentación oficial de JavaScript"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      URL del Recurso
                    </label>
                    <input
                      type="url"
                      value={resource.url_resource}
                      onChange={(e) =>
                        handleResourceChange(
                          resource.id,
                          "url_resource",
                          e.target.value
                        )
                      }
                      placeholder="https://ejemplo.com/recurso"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Descripción del Recurso
                    </label>
                    <textarea
                      value={resource.description_resource}
                      onChange={(e) =>
                        handleResourceChange(
                          resource.id,
                          "description_resource",
                          e.target.value
                        )
                      }
                      rows="3"
                      placeholder="Describe brevemente este recurso..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black font-medium transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Tipo de Recurso (Multimedia)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf"
                        onChange={(e) =>
                          handleFileChange(resource.id, e.target.files)
                        }
                        className="hidden"
                        id={`file-${resource.id}`}
                      />
                      <label
                        htmlFor={`file-${resource.id}`}
                        className="flex flex-col items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-all bg-white"
                      >
                        <Upload className="text-gray-400 mb-3" size={40} />
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          {resource.type_resource.length > 0
                            ? `${resource.type_resource.length} archivo(s) seleccionado(s)`
                            : "Arrastra archivos o haz clic para seleccionar"}
                        </p>
                        <p className="text-xs text-gray-400">
                          Imágenes, videos, PDFs
                        </p>
                      </label>
                      {resource.type_resource.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {Array.from(resource.type_resource).map(
                            (file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded-lg"
                              >
                                <CheckCircle
                                  size={16}
                                  className="text-blue-600"
                                />
                                <span className="font-medium">{file.name}</span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ejemplos */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-black flex items-center gap-3">
              <Code className="text-green-600" size={24} />
              Ejemplos de Código
            </h3>
            <button
              onClick={addExample}
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
            >
              <Plus size={18} />
              Agregar Ejemplo
            </button>
          </div>

          <div className="space-y-6">
            {examples.map((example, index) => (
              <div
                key={example.id}
                className="bg-white rounded-xl p-5 border-2 border-green-100 relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-black bg-green-100 px-3 py-1 rounded-full">
                    Ejemplo #{index + 1}
                  </span>
                  {examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExample(example.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Título del Ejemplo
                    </label>
                    <input
                      type="text"
                      value={example.title_example}
                      onChange={(e) =>
                        handleExampleChange(
                          example.id,
                          "title_example",
                          e.target.value
                        )
                      }
                      placeholder="Ej: Declaración de variables con let y const"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-black font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Código de Ejemplo
                    </label>
                    <textarea
                      value={example.code_snipped}
                      onChange={(e) =>
                        handleExampleChange(
                          example.id,
                          "code_snipped",
                          e.target.value
                        )
                      }
                      rows="6"
                      placeholder="// Escribe tu código aquí&#10;let nombre = 'StartDev';&#10;const version = 1.0;"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-black font-mono text-sm transition-all resize-none bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Explicación del Código
                    </label>
                    <textarea
                      value={example.explanation}
                      onChange={(e) =>
                        handleExampleChange(
                          example.id,
                          "explanation",
                          e.target.value
                        )
                      }
                      rows="4"
                      placeholder="Explica qué hace este código y por qué es importante..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-black font-medium transition-all resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Soporta formato enriquecido (Rich text)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Información Adicional */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-100">
          <div className="flex items-start gap-3">
            <Lightbulb className="text-amber-600 mt-1" size={24} />
            <div>
              <h4 className="font-bold text-black mb-2">
                Nota sobre Relaciones
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Las relaciones con{" "}
                <span className="font-semibold">Ejercicios</span> y{" "}
                <span className="font-semibold">Progreso</span> se gestionarán
                automáticamente después de crear el tema. Podrás asignar
                ejercicios específicos desde la sección de ejercicios.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
          <button
            type="button"
            className="flex-1 px-8 py-4 border-2 border-gray-300 text-black font-bold rounded-xl hover:bg-gray-50 transition-all text-lg"
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
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creando...</span>
              </>
            ) : (
              "Crear Tema"
            )}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message="¡Tema creado exitosamente! Ya está disponible en la plataforma."
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={isErrorOpen}
        onClose={() => setIsErrorOpen(false)}
        message="Error al crear el tema. Verifica que todos los campos obligatorios estén completos."
      />
    </div>
  );
};

export default CreateTopicForm;
