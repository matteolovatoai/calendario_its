import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from '../AuthContext';

const Navbar = ({ session }) => {
    const { utenteDB } = useAuth();
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Errore durante il logout:", error.message);
        } else {
            // Forza il ricaricamento della pagina (o il reindirizzamento)
            // L'opzione migliore per pulire tutto è ricaricare dalla radice:
            window.location.href = "/"; 
        }
    };

    return (
        <nav className="navbar">
            <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="logo">
                    <span className="icon">📅</span>
                    <h1>Registro orario</h1>
                </div>
            </Link>
            
            <div className="nav-links">
                {session ? (
                    /* Utente loggato: mostra nome e tasto Esci */
                    <div className="user-menu">
                        <span>
                            {utenteDB?.nome} {utenteDB?.cognome}
                        </span>
                        <button onClick={handleLogout} className="logout-btn">
                            Esci
                        </button>
                    </div>
                ) : (
                    /* Utente NON loggato: mostra tasto Area Riservata */
                    <Link to="/login" className="login-btn" style={{ textDecoration: "none" }}>
                        Area Riservata
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;