import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../service/Api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true); 
  
  useEffect(() => {
    const storedToken = sessionStorage.getItem('authToken');
    const storedUser = sessionStorage.getItem('userdata');

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user data from session storage:", error);
        logout(); 
      }
    }

    setLoading(false); 
  }, []);

  const isLoggedIn = !!user;

  const login = async (email,password) => {
    try {

      const response = await apiClient.post(
            '/login', 
            {"email":email,"password":password}
          );

          sessionStorage.setItem('authToken', response.data.token);
          sessionStorage.setItem('userdata', JSON.stringify(response.data.user));

      } catch (error) {
        console.error("Login failed:", error);
        throw error; 
    }
  };

  const logout = () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userdata');
    setUser(null);
    alert("You have signed out.");
  };
  
  const getToken = () => {
      return sessionStorage.getItem('authToken');
  };

  const contextValue = {
    user,
    loading,
    isLoggedIn, 
    login,
    logout,
    getToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};