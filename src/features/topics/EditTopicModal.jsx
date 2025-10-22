import React, { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL;
import {
  X,
  BookOpen,
  FileText,
  Link,
  Code,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  Save,
  Loader,
} from "lucide-react";
import SuccessModal from "../../modal/SuccessModal";
import ErrorModal from "../../modal/ErrorModal";

const EditTopicModal = ({ isOpen, onClose, topicId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [documentId, setDocumentId] = useState(null);
  const [numericId, setNumericId] = useState(null);

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

  useEffect(() => {
    if (isOpen && topicId) {
      fetchTopicData();
    }
  }, [isOpen, topicId]);

  const fetchTopicData = async () => {
    try {
      setIsLoading(true);
      console.log("📡 Fetching topic with ID:", topicId);
      console.log("📡 ID type:", typeof topicId, "Value:", topicId);

      let finalTopicId = topicId;

      // Si el ID es numérico, buscar el documentId correspondiente
      if (typeof topicId === "number" || !isNaN(topicId)) {
        console.log("🔍 Numeric ID detected, searching for documentId...");
        const searchResponse = await fetch(
          `${API_URL}/api/topics?filters[id][$eq]=${topicId}&populate[Resources][populate]=*&populate[Examples][populate]=*`
        );
        const searchData = await searchResponse.json();

        if (searchData.data && searchData.data.length > 0) {
          finalTopicId = searchData.data[0].documentId;
          console.log("✅ Found documentId:", finalTopicId);
        } else {
          throw new Error("Topic no encontrado");
        }
      }

      // Strapi 5: populate específico para componentes repetibles
      // Usar sintaxis de array para cargar TODOS los elementos
      const response = await fetch(
        `${API_URL}/api/topics/${finalTopicId}?populate[0]=Resources&populate[1]=Examples`
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Error al cargar el tema: ${response.status}`);
      }

      const result = await response.json();
      // console.log("✅ Topic data loaded:", result);
      // console.log("📦 Full Resources data:", result.data.Resources);
      // console.log("📚 Resources found:", result.data.Resources?.length || 0);
      // console.log("📦 Full Examples data:", result.data.Examples);
      // console.log("💻 Examples found:", result.data.Examples?.length || 0);

      const topic = result.data;

      // Guardar AMBOS IDs: el documentId Y el ID numérico
      setDocumentId(topic.documentId || finalTopicId);
      setNumericId(topic.id); // Este es el ID numérico que necesitamos para el PUT

      // console.log("🆔 Numeric ID:", topic.id);
      // console.log("📄 Document ID:", topic.documentId);

      // Extraer texto de richtext
      const extractText = (richTextArray) => {
        if (!richTextArray || !Array.isArray(richTextArray)) return "";
        return richTextArray
          .map((block) => {
            if (block.children && Array.isArray(block.children)) {
              return block.children.map((child) => child.text || "").join("");
            }
            return "";
          })
          .join("\n");
      };

      setFormData({
        name_topic: topic.name_topic || "",
        description: extractText(topic.description) || "",
        objectives: extractText(topic.objectives) || "",
      });

      if (topic.Resources && topic.Resources.length > 0) {
        setResources(
          topic.Resources.map((r, index) => ({
            id: r.id || Date.now() + index,
            title_resource: r.title_resource || "",
            url_resource: r.url_resource || "",
            description_resource: r.description_resource || "",
            type_resource: [],
          }))
        );
      } else {
        setResources([
          {
            id: 1,
            title_resource: "",
            url_resource: "",
            description_resource: "",
            type_resource: [],
          },
        ]);
      }

      if (topic.Examples && topic.Examples.length > 0) {
        setExamples(
          topic.Examples.map((e, index) => ({
            id: e.id || Date.now() + index,
            title_example: e.title_example || "",
            code_snipped: e.code_snipped || "",
            explanation: extractText(e.explanation) || "",
          }))
        );
      } else {
        setExamples([
          { id: 1, title_example: "", code_snipped: "", explanation: "" },
        ]);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      setErrorMessage(err.message);
      setIsErrorOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

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
      setErrorMessage("Por favor completa todos los campos obligatorios");
      setIsErrorOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Helper para convertir texto a estructura richtext segura
      const textToRichText = (text) => {
        if (typeof text !== "string" || text.trim() === "") {
          return [
            { type: "paragraph", children: [{ type: "text", text: "" }] },
          ];
        }

        const lines = text.split("\n").filter((line) => line.trim() !== "");
        if (lines.length === 0) {
          return [
            { type: "paragraph", children: [{ type: "text", text: "" }] },
          ];
        }

        return lines.map((line) => ({
          type: "paragraph",
          children: [{ type: "text", text: line }],
        }));
      };

      // Preparar payload
      const topicData = {
        data: {
          name_topic: formData.name_topic,
          description: textToRichText(formData.description),
          objectives: textToRichText(formData.objectives),
          Resources: resources.map((r) => ({
            title_resource: r.title_resource || "",
            url_resource: r.url_resource || "",
            description_resource: r.description_resource
              ? textToRichText(r.description_resource)
              : [{ type: "paragraph", children: [{ text: "" }] }],
          })),
          Examples: examples.map((e) => ({
            title_example: e.title_example || "",
            code_snipped: e.code_snipped || "",
            explanation: textToRichText(e.explanation || ""),
          })),
        },
      };

      console.log("📤 Payload enviado:", JSON.stringify(topicData, null, 2));

      // En Strapi 5, PUT usa documentId
      const updateId = documentId || finalTopicId;

      const response = await fetch(
        `${API_URL}/api/topics/${updateId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(topicData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update error:", errorText);
        throw new Error("Error al actualizar el tema");
      }

      const result = await response.json();
      console.log("✅ Tema actualizado:", result);

      // Subir archivos nuevos si existen
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        if (resource.type_resource && resource.type_resource.length > 0) {
          const formDataFiles = new FormData();

          resource.type_resource.forEach((file) => {
            formDataFiles.append("files", file);
          });

          formDataFiles.append("ref", "api::topic.topic");
          formDataFiles.append("refId", numericId); // Para archivos SÍ usar el ID numérico
          formDataFiles.append("field", `Resources[${i}].type_resource`);

          await fetch(`${API_URL}/api/upload`, {
            method: "POST",
            body: formDataFiles,
          });
        }
      }

      setIsSuccessOpen(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("❌ Error inesperado:", error);
      setErrorMessage("Error al actualizar el tema");
      setIsErrorOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay con fondo semi-transparente */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[1400px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-violet-600 p-6 flex items-center justify-between z-10 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <BookOpen className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Editar Tema</h2>
                <p className="text-purple-100 text-sm">
                  Modifica la información del tema
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              <X className="text-white" size={24} />
            </button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="text-purple-600 animate-spin mb-4" size={48} />
              <p className="text-gray-600 font-medium">
                Cargando datos del tema...
              </p>
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

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Descripción *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Describe de qué trata este tema..."
                      className="w-full px-4 py-3.5 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-black font-medium transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Objetivos de Aprendizaje *
                    </label>
                    <textarea
                      name="objectives"
                      value={formData.objectives}
                      onChange={handleInputChange}
                      rows="5"
                      placeholder="Define los objetivos..."
                      className="w-full px-4 py-3.5 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-black font-medium transition-all resize-none"
                    />
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
                            placeholder="Ej: Documentación oficial"
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
                            placeholder="https://ejemplo.com"
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
                            placeholder="Describe este recurso..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black font-medium transition-all resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-black mb-2">
                            Archivos Multimedia (Opcional)
                          </label>
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
                                ? `${resource.type_resource.length} archivo(s) nuevo(s)`
                                : "Seleccionar nuevos archivos"}
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
                                    <span className="font-medium">
                                      {file.name}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          )}
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
                            placeholder="Ej: Declaración de variables"
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
                            placeholder="// Escribe tu código aquí"
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
                            placeholder="Explica qué hace este código..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-black font-medium transition-all resize-none"
                          />
                        </div>
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
                      <Loader className="animate-spin" size={24} />
                      <span>Guardando...</span>
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
        message="¡Tema actualizado exitosamente!"
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

export default EditTopicModal;
