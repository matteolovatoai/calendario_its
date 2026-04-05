import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // il tuo file di config di supabase

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [utenteDB, setUtenteDB] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Funzione per scaricare i dati dal tuo DB FastAPI
    const fetchProfiloDB = async (token) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/utenti/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUtenteDB(data); // Salva: { id, email, nome, ruolo: "studente", ... }
        }
      } catch (error) {
        console.error("Errore nel recupero del profilo:", error);
      } finally {
        setLoading(false);
      }
    };

    // Ascolta i cambiamenti di sessione di Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfiloDB(session.access_token);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        fetchProfiloDB(session.access_token);
      } else {
        setUtenteDB(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ utenteDB, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook per usare il contesto facilmente in qualsiasi componente
export const useAuth = () => useContext(AuthContext);