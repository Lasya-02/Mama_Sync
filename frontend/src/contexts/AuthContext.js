import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const apiURL = process.env.REACT_APP_API_URL;
console.log("API_URL being used:", apiURL);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = sessionStorage.getItem('userToken');
    const userdata = sessionStorage.getItem('userdata');
    if (token && userdata) {
      return JSON.parse(userdata);
    }
    return null;
  });

  useEffect(() => {
    const token = sessionStorage.getItem('userToken');
    if (token) {
      setUser({ isLoggedIn: true }); // Simplified user object on load
    }
  }, []);

  const login = async (email, password) => {
    try {

      const response = await axios.post(
        `${apiURL}/login`, // Replace with your backend URL
        { "email": email, "password": password }
      );

      //headers: {
      //    Authorization: `Bearer ${token}`,
      //  }

      //console.log(response.data)
      // Assuming your backend returns a JWT token in response.data.token
      sessionStorage.setItem('userToken', response.data.token);


      sessionStorage.setItem('userdata', JSON.stringify(response.data.user));

      // For this example, we just set a mock user object
      setUser(response.data.userDetails || { isLoggedIn: true, email });

    } catch (error) {
      console.error("Login failed:", error);
      throw error; // Re-throw so your Login page can handle errors
    }
  };

  const logout = () => {
    sessionStorage.removeItem('userToken');
    setUser(null);
    alert("You have signed out.");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
