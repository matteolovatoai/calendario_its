import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./pages/Login";
import Home from "./pages/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./App.css"
import { AuthProvider } from "./AuthContext";

function App() {
    const [session, setSession] = useState(null);

    useEffect(() => {
        // Controlla se c'è già una sessione attiva
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Ascolta cambiamenti (login/logout)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthProvider>
            <Router>
                <div className="wrapper">
                    <Navbar session={session} />
                    <Routes>
                        <Route path="/" element={<Home session={session} />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<div>Dashboard</div>} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;