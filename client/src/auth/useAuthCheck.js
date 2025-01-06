import axios from "axios";
import { useEffect, useState } from "react";

const useAuthCheck = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // When this hook runs, check the authorization
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      // No token means that definitely isn't authenticated
      if (!token) {
        setAuthChecked(true);
        return;
      }

      try {
        const response = await axios.get("http://localhost:3000/users/me", {
          headers: { Authorization: token },
        });
        setUser(response.data);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("token");
      } finally {
        setAuthChecked(true); // Auth check is complete
      }
    };

    checkAuth();
  }, []);

  return { user, isAuthenticated, authChecked };
};

export default useAuthCheck;
