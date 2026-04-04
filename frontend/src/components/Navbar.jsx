import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from '../AuthContext';

const Navbar = ({ session }) => {
    const { utenteDB } = useAuth()
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Errore durante il logout:", error.message);
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

                {/* Mostriamo l'email dell'utente e il tasto Logout se loggato */}
                {session && (
                    <div className="user-menu">
                        <span>
                            {utenteDB?.nome} {utenteDB?.cognome}
                        </span>
                        <button onClick={handleLogout} className="logout-btn">
                            Esci
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
