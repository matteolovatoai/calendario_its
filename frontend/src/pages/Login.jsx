import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import axios from "axios";
import "./Login.css";

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nome, setNome] = useState("");
    const [cognome, setCognome] = useState("");
    const [classe_id, setClasseId] = useState("");
    const [classi, setClassi] = useState([]);
    const [loading, setLoading] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);

    // Carica le classi per il menu a tendina (solo se stiamo registrando)
    useEffect(() => {
        if (isRegistering) {
            axios
                .get(`${import.meta.env.VITE_API_URL}/classi/`)
                .then((res) => setClassi(res.data))
                .catch((err) =>
                    console.error("Errore caricamento classi:", err),
                );
        }
    }, [isRegistering]);

    const handleAuth = async (e) => {
        e.preventDefault();

        if (isRegistering && !acceptTerms) {
            alert("Devi accettare l'informativa sulla privacy per proseguire.");
            return;
        }

        setLoading(true);

        if (isRegistering) {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: nome,
                        last_name: cognome,
                        classe_id: parseInt(classe_id)
                    },
                },
            });
            if (error) alert(error.message);
            else alert("Registrazione completata! Verifica la tua email.");
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) alert(error.message);
        }
        setLoading(false);
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-icon">📅</span>
                    <h1>{isRegistering ? "Crea Account" : "Bentornato"}</h1>
                </div>

                <form onSubmit={handleAuth} className="auth-form">
                    {isRegistering && (
                        <>
                            <div className="input-row">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="Nome"
                                        onChange={(e) =>
                                            setNome(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="Cognome"
                                        onChange={(e) =>
                                            setCognome(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <select
                                    className="modern-select"
                                    value={classe_id}
                                    onChange={(e) =>
                                        setClasseId(e.target.value)
                                    }
                                    required
                                >
                                    <option value="">
                                        Seleziona la tua classe
                                    </option>
                                    {classi.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="input-group">
                        <input
                            type="email"
                            placeholder="nome.cognome@allievi.scuola.com"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="••••••••"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {isRegistering && (
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="privacy"
                                checked={acceptTerms}
                                onChange={(e) =>
                                    setAcceptTerms(e.target.checked)
                                }
                                required
                            />
                            <label htmlFor="privacy">
                                Accetto l'{" "}
                                <a href="/privacy-policy" target="_blank">
                                    informativa sulla privacy
                                </a>{" "}
                                e il trattamento dei dati personali.
                            </label>
                        </div>
                    )}
                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Caricamento..."
                            : isRegistering
                              ? "Registrati"
                              : "Accedi"}
                    </button>
                </form>

                <div className="auth-footer">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="toggle-auth"
                    >
                        {isRegistering
                            ? "Hai già un account? Accedi"
                            : "Nuovo studente? Registrati"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
