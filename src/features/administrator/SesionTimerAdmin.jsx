import { useEffect, useState, useRef } from "react";
const API_URL = import.meta.env.VITE_API_URL;
const SessionTimerAdmin = ({ administrator }) => {
  const [sessionData, setSessionData] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);
  const createdRef = useRef(false); // evita duplicaciones

  // === 🧠 Cargar o crear sesión ===
  useEffect(() => {
    if (!administrator?.id || createdRef.current) return;

    const fetchOrCreateSession = async () => {
      try {
        // Buscar si ya existe una sesión para este administrador
        const res = await fetch(
          `${API_URL}/api/session-admins?filters[administrator][id][$eq]=${administrator.id}&populate=*`
        );
        const result = await res.json();

        if (result.data && result.data.length > 0) {
          // console.log("⚡ Sesión existente encontrada:", result.data[0]);
          setSessionData(result.data[0]);
          setSeconds(result.data[0].attributes.sessionTime || 0);
        } else {
          // console.log("🆕 Creando nueva sesión para admin:", administrator.id);

          const createRes = await fetch(`${API_URL}/api/session-admins`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: {
                sessionTime: 0,
                administrator: {
                  connect: [administrator.id], // ✅ forma correcta Strapi v5
                },
              },
            }),
          });

          const created = await createRes.json();
          // console.log("✅ Sesión creada:", created);
          setSessionData(created.data);
          setSeconds(0);
        }

        createdRef.current = true; // evita que vuelva a ejecutarse
      } catch (err) {
        console.error("❌ Error al cargar o crear sesión:", err);
      }
    };

    fetchOrCreateSession();
  }, [administrator]);

  // === ⏱️ Actualizar contador cada segundo ===
  useEffect(() => {
    if (!sessionData) return;

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [sessionData]);

  // === 💾 Guardar tiempo en Strapi cada 10 segundos ===
  useEffect(() => {
    if (!sessionData) return;
    if (seconds % 10 !== 0) return; // guarda cada 10 seg

    const updateSessionTime = async () => {
      try {
        await fetch(`${API_URL}/api/session-admins/${sessionData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              sessionTime: seconds,
            },
          }),
        });
        console.log(`💾 Tiempo de sesión actualizado a ${seconds}s`);
      } catch (err) {
        console.error("❌ Error actualizando tiempo de sesión:", err);
      }
    };

    updateSessionTime();
  }, [seconds, sessionData]);

  // === 🚪 Reset al hacer logout ===
  const handleLogoutSession = async () => {
    if (!sessionData) return;

    try {
      await fetch(`${API_URL}/api/session-admins/${sessionData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            sessionTime: seconds,
          },
        }),
      });
      console.log("👋 Sesión finalizada correctamente.");
    } catch (err) {
      console.error("❌ Error finalizando sesión:", err);
    } finally {
      clearInterval(intervalRef.current);
      setSessionData(null);
      setSeconds(0);
    }
  };

};

export default SessionTimerAdmin;
