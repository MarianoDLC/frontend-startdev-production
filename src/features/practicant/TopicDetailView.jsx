import React, { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL;
const JUDGE0_API_KEY = import.meta.env.JUDGE0_API_KEY;
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Video,
  Link2,
  Code,
  CheckCircle,
  Circle,
  Lightbulb,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  PlayCircle,
  Loader,
  AlertCircle,
  Send,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import SuccessModal from "../../modal/SuccessModal";
import ErrorModal from "../../modal/ErrorModal";

const TopicDetailView = ({ topicId, onBack }) => {
  const [topicData, setTopicData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("recursos");
  const [selectedResource, setSelectedResource] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [exerciseStates, setExerciseStates] = useState({});
  const [studentAnswers, setStudentAnswers] = useState({});
  const [codeOutputs, setCodeOutputs] = useState({});
  const [executionStatus, setExecutionStatus] = useState({});
  const [practicantId, setPracticantId] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [exercisePractRecords, setExercisePractRecords] = useState({});
  const [isProgressLoading, setIsProgressLoading] = useState(false);
  const progressCreatedRef = React.useRef(false);

  // Estados para los modales
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { user, loading: authLoading } = useAuth();

  // ============= MANTENER: Cargar practicante =============
  useEffect(() => {
    if (user && user.user && user.user.id) {
      setPracticantId(user.user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && topicData === null) {
      fetchTopicDetail();
    }
  }, [topicId, authLoading]);

  useEffect(() => {
    if (
      !authLoading &&
      user &&
      user.user &&
      user.user.id &&
      topicData !== null &&
      progressData === null &&
      !progressCreatedRef.current // <-- evita repetición
    ) {
      loadPracticantAndProgress();
    }
  }, [user, authLoading, topicData]);

  const [loadedOnce, setLoadedOnce] = useState(false);

  useEffect(() => {
    if (
      loadedOnce ||
      authLoading ||
      !user?.user?.documentId ||
      !topicData?.documentId
    )
      return;

    setLoadedOnce(true);

    (async () => {
      console.log("🔍 Cargando progreso una única vez (datos listos)");

      const res = await fetch(
        `${API_URL}/api/progresses?filters[practicant][documentId][$eq]=${user.user.documentId}&filters[topic][documentId][$eq]=${topicData.documentId}`
      );
      const data = await res.json();

      if (!data.data?.length) {
        await createInitialProgress(user.user.documentId, topicData.documentId);
      } else {
        setProgressData(data.data[0]);
      }
    })();
  }, [user?.user?.documentId, topicData?.documentId, authLoading]);

  // ============= CARGAR DETALLES DEL TOPIC =============
  const fetchTopicDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/topics?filters[documentId][$eq]=${topicId}&populate[exercises][populate]=*&populate[Resources][populate]=*`
      );

      if (!response.ok) {
        throw new Error("Error al cargar el tema");
        setError("Error al cargar el tema");
      }

      const result = await response.json();
      console.log("✅ Topic detail cargado:", result);

      if (result.data && result.data.length > 0) {
        const topic = result.data[0];
        setTopicData(topic);

        if (topic.Resources && topic.Resources.length > 0) {
          setSelectedResource(topic.Resources[0]);
        }

             
        // await createInitialProgress(practicantDocId, topicDocId);
        // Inicializar estados de ejercicios
        const initialStates = {};
        const initialAnswers = {};
        const initialOutputs = {};
        const initialExecutionStatus = {};
        topic.exercises?.forEach((ex) => {
          initialStates[ex.id] = {
            completed: false,
            showHints: false,
            userCode: "",
          };
          initialAnswers[ex.id] = "";
          initialOutputs[ex.id] = "";
          initialExecutionStatus[ex.id] = {
            loading: false,
            error: null,
            isCorrect: null,
          };
        });
        setExerciseStates(initialStates);
        setStudentAnswers(initialAnswers);
        setCodeOutputs(initialOutputs);
        setExecutionStatus(initialExecutionStatus);
      } else {
        throw new Error("Tema no encontrado");
      }
    } catch (err) {
      console.error("❌ Error al cargar topic detail:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============= CARGAR PROGRESO Y EJERCICIOS DEL USUARIO =============
  const loadPracticantAndProgress = async () => {
    if (progressCreatedRef.current) {
      console.log("⚠️ Progreso ya creado, saltando ejecución duplicada...");
      return;
    }
    progressCreatedRef.current = true;
    try {
      setIsProgressLoading(true);
      const currentPracticantId = user?.user?.id;

      if (!currentPracticantId) {
        console.warn("⚠️ No hay usuario autenticado");
        return;
      }

      const topicNumericId = topicData?.id;

      if (!topicNumericId) {
        console.error("❌ No se pudo obtener el ID numérico del topic");
        return;
      }

      console.log("🔍 Buscando progreso para:", {
        currentPracticantId,
        topicNumericId,
        topicName: topicData?.name_topic,
      });

      // Buscar progreso existente
      const progressResponse = await fetch(
        `${API_URL}/api/progresses?filters[practicant][id][$eq]=${currentPracticantId}&filters[topic][id][$eq]=${topicNumericId}&populate=*`
      );

      if (progressResponse.ok) {
        const progressResult = await progressResponse.json();
        if (progressResult.data && progressResult.data.length > 0) {
          setProgressData(progressResult.data[0]);
          progressCreatedRef.current = true;
          console.log(
            "✅ Progreso existente encontrado:",
            progressResult.data[0]
          );
        } else if (!progressCreatedRef.current) {
          // Crear progreso si no existe
          // await createInitialProgress(currentPracticantId, topicNumericId);
          progressCreatedRef.current = true;
        }
      }

      // Cargar registros de ejercicios practicados
      await loadExercisePractRecords(currentPracticantId);
    } catch (err) {
      console.error("❌ Error al cargar progreso:", err);
    } finally {
      setIsProgressLoading(false);
    }
  };

  // ============= CREAR PROGRESO INICIAL =============
  // ✅ Crea un progreso inicial para el practicante en un tema específico
  const createInitialProgress = async (practicantDocId, topicDocId) => {
    try {
      if (!practicantDocId || !topicDocId) {
        console.error("❌ Faltan documentIds para crear el progreso");
        return null;
      }

      const res = await fetch(`${API_URL}/api/progresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            progress: 0,
            practicant: {
              connect: [{ documentId: practicantDocId }],
            },
            topic: {
              connect: [{ documentId: topicDocId }],
            },
          },
        }),
      });

      if (!res.ok) throw new Error("Error al crear el progreso");

      const data = await res.json();
      console.log("✅ Progreso creado correctamente:", data);
      return data;
    } catch (err) {
      console.error("❌ Error creando progreso:", err);
      return null;
    }
  };

  // ============= CARGAR REGISTROS DE EJERCICIOS PRACTICADOS =============
  const loadExercisePractRecords = async (practicantId) => {
    try {
      if (!practicantId) {
        console.warn(
          "⚠️ No hay practicante autenticado para cargar registros."
        );
        return;
      }

      // console.log(
      //   "🔍 Cargando registros de ejercicios practicados para:",
      //   practicantId
      // );

      const res = await fetch(
        `${API_URL}/api/exercise-practs?filters[practicant][id][$eq]=${practicantId}&populate[exercise][populate]=*`
      );

      if (!res.ok)
        throw new Error("Error al obtener registros de ejercicios practicados");

      const data = await res.json();

      if (data.data && data.data.length > 0) {
        // console.log(
        //   "✅ Registros de ejercicios practicados encontrados:",
        //   data.data
        // );

        // Mapa por ID del ejercicio
        const recordsMap = {};
        data.data.forEach((record) => {
          const exerciseId = record.exercise?.id;
          if (exerciseId) recordsMap[exerciseId] = record;
        });

        setExercisePractRecords(recordsMap);
      } else {
        console.log("ℹ️ No hay registros previos de ejercicios practicados.");
      }
    } catch (err) {
      console.error(
        "❌ Error cargando registros de ejercicios practicados:",
        err
      );
    }
  };
  // ================== CREAR EJERCICIO PRACTICADO ==================
  const createExercisePractice = async (
    practicantDocId,
    exerciseDocId,
    isCorrect,
    codeSubmitted = ""
  ) => {
    try {
      if (!practicantDocId || !exerciseDocId) {
        console.error("❌ Faltan documentIds para crear el ejercicio práctico");
        return null;
      }

      const res = await fetch(`${API_URL}/api/exercise-practs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            isCorrectExercise: isCorrect,
            Status_Exercise: isCorrect ? "Completado" : "Pendiente",
            completed_at: isCorrect ? new Date().toISOString() : null,
            attemps: 1,
            practicant: { connect: [{ documentId: practicantDocId }] },
            exercise: { connect: [{ documentId: exerciseDocId }] },
          },
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`Error al crear ExercisePract: ${text}`);

      const data = JSON.parse(text);
      // console.log("✅ ExercisePract creado correctamente:", data);
      return data;
    } catch (err) {
      console.error("❌ Error creando ExercisePract:", err);
      return null;
    }
  };

  // ================== ACTUALIZAR PROGRESO ==================
const updateProgress = async (practicantDocId, topicDocId) => {
  try {
    // Buscar progreso existente
    const res = await fetch(
      `${API_URL}/api/progresses?filters[practicant][documentId][$eq]=${practicantDocId}&filters[topic][documentId][$eq]=${topicDocId}`
    );

    const result = await res.json();
    const existingProgress = result.data?.[0];

    if (!existingProgress) {
      // console.log("⚠️ No hay progreso previo, creando uno nuevo...");
      return await createInitialProgress(practicantDocId, topicDocId);
    }

    // ✅ Extraer valor correctamente
    const currentProgress = existingProgress.attributes?.progress || 0;

    const newProgressValue = Math.min(currentProgress + 20, 100); // ejemplo: sube 20%

    const updateRes = await fetch(
      `${API_URL}/api/progresses/${existingProgress.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            progress: newProgressValue,
          },
        }),
      }
    );

    if (!updateRes.ok) throw new Error("Error al actualizar progreso");

    const updated = await updateRes.json();
    // console.log("✅ Progreso actualizado correctamente:", updated);
    return updated;
  } catch (err) {
    console.error("❌ Error actualizando progreso:", err);
    return null;
  }
};

  // ================== EJECUTAR Y VERIFICAR CÓDIGO ==================
  const handleSubmitAnswer = async (exerciseId) => {
    setIsSuccessModalOpen(false);
    setIsErrorModalOpen(false);

    const code = studentAnswers[exerciseId];
    const exercise = topicData.exercises.find((ex) => ex.id === exerciseId);

    if (!code.trim()) {
      setErrorMessage("Por favor escribe tu código antes de enviar");
      setIsErrorModalOpen(true);
      return;
    }

    if (!exercise) {
      console.error("❌ No se encontró el ejercicio");
      setErrorMessage("No se encontró el ejercicio");
      setIsErrorModalOpen(true);
      return;
    }

    console.log("🎯 Ejecutando ejercicio:", {
      exerciseId: exercise.id,
      exerciseName: exercise.name_exercise,
    });

    setExecutionStatus((prev) => ({
      ...prev,
      [exerciseId]: { loading: true, error: null, isCorrect: null },
    }));

    try {
      // Codificar código en base64
      const encodedCode = btoa(unescape(encodeURIComponent(code)));

      const requestBody = {
        source_code: encodedCode,
        language_id: 71, // Python
        stdin: "",
        cpu_time_limit: 2,
        memory_limit: 128000,
      };

      console.log("📤 Enviando código a Judge0...");

      const submissionResponse = await fetch(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key":
              JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!submissionResponse.ok) {
        const errorText = await submissionResponse.text();
        console.error("❌ Error de Judge0:", errorText);
        throw new Error("Error al ejecutar el código");
      }

      const result = await submissionResponse.json();
      // console.log("✅ Resultado de Judge0:", result);

      // Procesar salida
      let output = "";
      let hasError = false;

      if (result.stderr) {
        output = atob(result.stderr);
        output = `Error:\n${output}`;
        hasError = true;
      } else if (result.compile_output) {
        output = atob(result.compile_output);
        output = `Error de compilación:\n${output}`;
        hasError = true;
      } else if (result.stdout) {
        output = atob(result.stdout);
      } else if (result.message) {
        output = `Mensaje: ${result.message}`;
      } else {
        output = "Sin salida";
      }

      // console.log("📝 Output obtenido:", output);

      setCodeOutputs((prev) => ({
        ...prev,
        [exerciseId]: output,
      }));

      // Verificar si la respuesta es correcta
      let isCorrect = false;
      if (!hasError && exercise.expected_output) {
        const expectedOutput = exercise.expected_output.trim();
        const actualOutput = output.trim();
        isCorrect = expectedOutput === actualOutput;

        console.log("🔍 Comparación:", {
          esperado: expectedOutput,
          obtenido: actualOutput,
          correcto: isCorrect,
        });
      }

      setExecutionStatus((prev) => ({
        ...prev,
        [exerciseId]: {
          loading: false,
          error: hasError ? "Error en ejecución" : null,
          isCorrect,
        },
      }));

      // Obtener documentIds
      const practicantDocId = user?.user?.documentId;
      const exerciseDocId = exercise.documentId;
      const topicDocId = topicData.documentId;

      // Guardar resultado
      await createExercisePractice(
        practicantDocId,
        exerciseDocId,
        isCorrect,
        code
      );

      // Si es correcto → actualiza progreso
      if (isCorrect) {
        setExerciseStates((prev) => ({
          ...prev,
          [exerciseId]: { ...prev[exerciseId], completed: true },
        }));

        setTimeout(() => {
          updateProgress(practicantDocId, topicDocId);
        }, 100);

        setSuccessMessage("🎉 ¡Excelente! Tu solución es correcta.");
        setIsSuccessModalOpen(true);
      } else if (!hasError) {
        setErrorMessage(
          "❌ La salida no coincide con la esperada. Revisa tu código."
        );
        setIsErrorModalOpen(true);
      }
    } catch (error) {
      console.error("❌ Error al ejecutar código:", error);
      setExecutionStatus((prev) => ({
        ...prev,
        [exerciseId]: { loading: false, error: error.message, isCorrect: null },
      }));
      setCodeOutputs((prev) => ({
        ...prev,
        [exerciseId]: `Error: ${error.message}\n\n⚠️ Verifica tu conexión a Judge0`,
      }));
    }
  };

  // ============= FUNCIONES AUXILIARES =============
  const extractTextFromRichText = (richTextArray) => {
    try {
      if (!richTextArray || !Array.isArray(richTextArray)) return "";
      return richTextArray
        .map((block) => {
          if (block.children && Array.isArray(block.children)) {
            return block.children.map((child) => child.text || "").join("");
          }
          return "";
        })
        .join(" ");
    } catch (error) {
      console.error("Error al extraer texto:", error);
      return "";
    }
  };

  const getResourceIcon = (resource) => {
    try {
      if (!resource) return <Link2 className="text-green-500" size={24} />;

      const descriptionText =
        typeof resource.description_resource === "string"
          ? resource.description_resource
          : extractTextFromRichText(resource.description_resource);

      const titleText =
        typeof resource.title_resource === "string"
          ? resource.title_resource
          : extractTextFromRichText(resource.title_resource);

      const description = descriptionText?.toLowerCase() || "";
      const title = titleText?.toLowerCase() || "";

      if (description.includes("video") || title.includes("video")) {
        return <Video className="text-purple-500" size={24} />;
      }
      if (description.includes("pdf") || description.includes("document")) {
        return <FileText className="text-blue-500" size={24} />;
      }
      return <Link2 className="text-green-500" size={24} />;
    } catch (error) {
      console.error("Error al obtener icono:", error);
      return <Link2 className="text-green-500" size={24} />;
    }
  };

  const toggleExercise = (exerciseId) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  const toggleHints = (exerciseId) => {
    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        showHints: !prev[exerciseId]?.showHints,
      },
    }));
  };

  const handleAnswerChange = (exerciseId, value) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [exerciseId]: value,
    }));
  };

  // ============= ESTADOS DE CARGA Y ERROR =============
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <Loader
            className="text-purple-600 animate-spin mx-auto mb-4"
            size={64}
          />
          <p className="text-gray-600 font-medium text-xl">Cargando tema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
          >
            Volver a temas
          </button>
        </div>
      </div>
    );
  }

  // ============= CALCULAR PROGRESO =============
  const completedExercises = Object.values(exerciseStates).filter(
    (s) => s.completed
  ).length;
  const totalExercises = topicData?.exercises?.length || 0;
  const progressPercentage =
    totalExercises > 0
      ? Math.round((completedExercises / totalExercises) * 100)
      : 0;

  // ============= RENDER =============
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50">
      {/* Header fijo */}
      <div className="bg-white shadow-lg sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-all hover:gap-3"
            >
              <ArrowLeft size={20} />
              <span>Volver a temas</span>
            </button>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">Progreso del tema</p>
                <p className="text-lg font-bold text-purple-600">
                  {completedExercises}/{totalExercises} ejercicios
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {progressPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen size={32} />
                <h1 className="text-4xl font-bold">{topicData?.name_topic}</h1>
              </div>
              <p className="text-purple-100 text-lg leading-relaxed">
                {extractTextFromRichText(topicData?.description)}
              </p>

              {topicData?.objectives && (
                <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="text-yellow-300" size={24} />
                    <h3 className="text-xl font-semibold">
                      Objetivos de aprendizaje
                    </h3>
                  </div>
                  <p className="text-purple-100">
                    {extractTextFromRichText(topicData.objectives)}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 min-w-[250px]">
              <h3 className="font-semibold mb-4 text-lg">Estadísticas</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-purple-100">Recursos</p>
                    <p className="font-bold text-xl">
                      {topicData?.Resources?.length || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Code size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-purple-100">Ejercicios</p>
                    <p className="font-bold text-xl">{totalExercises}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-purple-100">Completado</p>
                    <p className="font-bold text-xl">{progressPercentage}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[137px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("recursos")}
              className={`px-8 py-4 font-semibold transition-all border-b-4 ${
                activeTab === "recursos"
                  ? "border-purple-600 text-purple-600 bg-purple-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={20} />
                <span>Recursos ({topicData?.Resources?.length || 0})</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("ejercicios")}
              className={`px-8 py-4 font-semibold transition-all border-b-4 ${
                activeTab === "ejercicios"
                  ? "border-purple-600 text-purple-600 bg-purple-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Code size={20} />
                <span>Ejercicios ({totalExercises})</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* TAB RECURSOS */}
        {activeTab === "recursos" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Lista de recursos
              </h2>
              {topicData?.Resources && topicData.Resources.length > 0 ? (
                topicData.Resources.map((resource, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedResource(resource)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedResource === resource
                        ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg transform scale-105"
                        : "bg-white hover:bg-purple-50 text-gray-800 shadow-md hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          selectedResource === resource
                            ? "bg-white/20"
                            : "bg-purple-100"
                        }`}
                      >
                        {getResourceIcon(resource)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {resource.title_resource || `Recurso ${idx + 1}`}
                        </h3>
                        <p
                          className={`text-sm truncate ${
                            selectedResource === resource
                              ? "text-purple-100"
                              : "text-gray-500"
                          }`}
                        >
                          {typeof resource.description_resource === "string"
                            ? resource.description_resource
                            : extractTextFromRichText(
                                resource.description_resource
                              ) || "Sin descripción"}
                        </p>
                      </div>
                      {selectedResource === resource && (
                        <PlayCircle size={20} />
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="bg-white rounded-xl p-8 text-center shadow-md">
                  <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500">No hay recursos disponibles</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              {selectedResource ? (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getResourceIcon(selectedResource)}
                        <div>
                          <h3 className="text-2xl font-bold">
                            {selectedResource.title_resource || "Recurso"}
                          </h3>
                          <p className="text-purple-100 mt-1">
                            {typeof selectedResource.description_resource ===
                            "string"
                              ? selectedResource.description_resource
                              : extractTextFromRichText(
                                  selectedResource.description_resource
                                )}
                          </p>
                        </div>
                      </div>
                      {selectedResource.url_resource && (
                        <a
                          href={selectedResource.url_resource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                        >
                          <ExternalLink size={18} />
                          <span className="font-medium">Abrir</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {selectedResource.url_resource ? (
                    <div
                      className="relative bg-gray-100"
                      style={{ height: "600px" }}
                    >
                      <iframe
                        src={selectedResource.url_resource}
                        className="w-full h-full"
                        title={selectedResource.title_resource}
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 text-gray-400">
                      <div className="text-center">
                        <Link2 className="mx-auto mb-4" size={64} />
                        <p className="text-lg font-medium">
                          No hay URL disponible para este recurso
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <FileText
                      className="mx-auto text-gray-300 mb-4"
                      size={80}
                    />
                    <p className="text-gray-500 text-xl font-medium">
                      Selecciona un recurso para visualizarlo
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB EJERCICIOS */}
        {activeTab === "ejercicios" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Ejercicios prácticos
              </h2>
              <div className="flex items-center gap-3 bg-white rounded-xl px-6 py-3 shadow-md">
                <CheckCircle className="text-green-500" size={24} />
                <span className="font-semibold text-gray-700">
                  {completedExercises} de {totalExercises} completados
                </span>
              </div>
            </div>

            {topicData?.exercises && topicData.exercises.length > 0 ? (
              <div className="space-y-4">
                {topicData.exercises.map((exercise, idx) => {
                  const isExpanded = expandedExercise === exercise.id;
                  const state = exerciseStates[exercise.id] || {};
                  const studentAnswer = studentAnswers[exercise.id] || "";
                  const codeOutput = codeOutputs[exercise.id] || "";
                  const execStatus = executionStatus[exercise.id] || {
                    loading: false,
                    error: null,
                    isCorrect: null,
                  };

                  return (
                    <div
                      key={exercise.id}
                      className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${
                        state.completed ? "ring-4 ring-green-200" : ""
                      }`}
                    >
                      <button
                        onClick={() => toggleExercise(exercise.id)}
                        className="w-full p-6 flex items-center justify-between hover:bg-purple-50 transition-all"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                              state.completed
                                ? "bg-green-500 text-white"
                                : "bg-purple-100 text-purple-600"
                            }`}
                          >
                            {state.completed ? (
                              <CheckCircle size={24} />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <div className="text-left flex-1">
                            <h3 className="text-xl font-bold text-gray-800">
                              {exercise.name_exercise}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              {extractTextFromRichText(
                                exercise.description_exercise
                              ).substring(0, 100)}
                              ...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {state.completed && (
                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                              Completado
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="text-purple-600" size={24} />
                          ) : (
                            <ChevronDown
                              className="text-purple-600"
                              size={24}
                            />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-200 p-6 bg-gradient-to-br from-purple-50 to-violet-50">
                          {/* Descripción */}
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                              <Target size={20} />
                              Descripción
                            </h4>
                            <div className="bg-white rounded-xl p-5 shadow-sm">
                              <p className="text-gray-700 leading-relaxed">
                                {extractTextFromRichText(
                                  exercise.description_exercise
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Código de ejemplo */}
                          {exercise.example_code && (
                            <div className="mb-6">
                              <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                <Code size={20} />
                                Código de ejemplo
                              </h4>
                              <div className="bg-gray-900 rounded-xl p-5 shadow-lg overflow-x-auto">
                                <pre className="text-green-400 font-mono text-sm">
                                  <code>{exercise.example_code}</code>
                                </pre>
                              </div>
                            </div>
                          )}

                          {/* Editor de código */}
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                              <Code size={20} />
                              Tu solución
                            </h4>
                            <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border-2 border-gray-700">
                              <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">
                                  {studentAnswer.length} caracteres
                                </span>
                              </div>
                              <textarea
                                value={studentAnswer}
                                onChange={(e) =>
                                  handleAnswerChange(
                                    exercise.id,
                                    e.target.value
                                  )
                                }
                                placeholder="# Escribe tu código aquí..."
                                className="w-full bg-gray-900 text-green-400 font-mono text-sm p-5 focus:outline-none resize-none"
                                style={{
                                  minHeight: "300px",
                                  lineHeight: "1.6",
                                  fontFamily:
                                    '"Fira Code", "Consolas", "Monaco", monospace',
                                }}
                                spellCheck="false"
                              />
                            </div>
                          </div>

                          {/* Output */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                                <PlayCircle size={20} />
                                Salida del código
                              </h4>
                              {execStatus.isCorrect !== null && (
                                <div
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                                    execStatus.isCorrect
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {execStatus.isCorrect ? (
                                    <>
                                      <CheckCircle size={18} />
                                      ¡Correcto!
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle size={18} />
                                      Incorrecto
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border-2 border-gray-700">
                              <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">
                                  Output
                                </span>
                              </div>
                              <div className="relative">
                                <textarea
                                  value={codeOutput}
                                  readOnly
                                  placeholder="La salida de tu código aparecerá aquí..."
                                  className={`w-full bg-gray-900 font-mono text-sm p-5 focus:outline-none resize-none ${
                                    execStatus.error
                                      ? "text-red-400"
                                      : "text-blue-400"
                                  }`}
                                  style={{
                                    minHeight: "200px",
                                    lineHeight: "1.6",
                                    fontFamily:
                                      '"Fira Code", "Consolas", "Monaco", monospace',
                                  }}
                                />
                                {execStatus.loading && (
                                  <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                                    <div className="text-center">
                                      <Loader
                                        className="animate-spin text-purple-400 mx-auto mb-2"
                                        size={32}
                                      />
                                      <p className="text-purple-400 font-medium">
                                        Ejecutando código...
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            {exercise.expected_output && (
                              <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl p-4">
                                <p className="text-sm font-semibold text-blue-900 mb-1">
                                  Salida esperada:
                                </p>
                                <pre className="text-sm text-blue-800 font-mono">
                                  {exercise.expected_output}
                                </pre>
                              </div>
                            )}
                          </div>

                          {/* Pistas */}
                          {exercise.hints && exercise.hints.length > 0 && (
                            <div className="mb-6">
                              <button
                                onClick={() => toggleHints(exercise.id)}
                                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-3"
                              >
                                <Lightbulb size={20} />
                                {state.showHints
                                  ? "Ocultar pistas"
                                  : "Ver pistas"}
                              </button>
                              {state.showHints && (
                                <div className="space-y-2">
                                  {exercise.hints.map((hint, hintIdx) => (
                                    <div
                                      key={hintIdx}
                                      className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl p-4 shadow-sm"
                                    >
                                      <p className="text-gray-700">
                                        💡{" "}
                                        {hint.hint_text ||
                                          "Pista no disponible"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Solución */}
                          {exercise.solution_code && (
                            <div className="mb-6">
                              <details className="bg-white rounded-xl shadow-md overflow-hidden">
                                <summary className="cursor-pointer p-4 bg-purple-100 hover:bg-purple-200 transition-all font-semibold text-purple-900 flex items-center gap-2">
                                  <Award size={20} />
                                  Ver solución
                                </summary>
                                <div className="p-5 bg-gray-900">
                                  <pre className="text-green-400 font-mono text-sm overflow-x-auto">
                                    <code>{exercise.solution_code}</code>
                                  </pre>
                                </div>
                              </details>
                            </div>
                          )}

                          {/* Botón ejecutar */}
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleSubmitAnswer(exercise.id)}
                              disabled={execStatus.loading}
                              className={`px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 ${
                                execStatus.loading
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                              } text-white`}
                            >
                              {execStatus.loading ? (
                                <>
                                  <Loader className="animate-spin" size={20} />
                                  Ejecutando...
                                </>
                              ) : (
                                <>
                                  <Send size={20} />
                                  Ejecutar y verificar
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-16 text-center shadow-lg">
                <Code className="mx-auto text-gray-300 mb-4" size={80} />
                <p className="text-gray-500 text-xl font-medium">
                  No hay ejercicios disponibles para este tema
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
        duration={null} // 👈 Cambia a null para que no se cierre automáticamente
      />

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorMessage}
        duration={null} // 👈 Asegúrate que sea null
      />
    </div>
  );
};

export default TopicDetailView;
