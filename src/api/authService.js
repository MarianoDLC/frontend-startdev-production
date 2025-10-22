import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/practicant/auth/login`, {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    // console.error("❌ Error de login:", error.response?.data || error);
    throw new Error("Usuario o contraseña incorrectos");
  }
};
