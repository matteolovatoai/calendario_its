import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

const Home = () => {
    const { utenteDB } = useAuth();
    const isSegreteria = utenteDB?.ruolo === "segreteria";

    // Stati Generali
    const [classi, setClassi] = useState([]);
    const [classeSelezionata, setClasseSelezionata] = useState("");
    const [eventi, setEventi] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Stati Modale e Form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lezioneSelezionata, setLezioneSelezionata] = useState(null);
    const [opzioniModuli, setOpzioniModuli] = useState([]);
    
    const [formData, setFormData] = useState({
        inizio: "",
        fine: "",
        aula: "",
        modulo_docente_id: ""
    });

    // 1. Inizializzazione base (Resize e lista Classi)
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        
        axios.get(`${import.meta.env.VITE_API_URL}/classi/`)
             .then((res) => setClassi(res.data))
             .catch((err) => console.error(err));
             
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // 2. Caricamento Lezioni (scatta quando cambia la classe o entri)
    const fetchLezioni = async () => {
        if (isSegreteria && !classeSelezionata) return;

        const { data: { session } } = await supabase.auth.getSession();
        const url = classeSelezionata 
            ? `${import.meta.env.VITE_API_URL}/lezioni/?classe_id=${classeSelezionata}`
            : `${import.meta.env.VITE_API_URL}/lezioni/`;

        axios.get(url, {
            headers: { Authorization: `Bearer ${session?.access_token}` },
        })
        .then((res) => {
            const eventiFormattati = res.data.map((lezione) => ({
                id: lezione.id,
                title: lezione.docente_cognome,
                start: lezione.inizio,
                end: lezione.fine,
                extendedProps: { ...lezione },
            }));
            setEventi(eventiFormattati);
        })
        .catch((err) => console.error("Errore lezioni:", err));
    };

    useEffect(() => { fetchLezioni(); }, [classeSelezionata, isSegreteria]);

    // 3. Caricamento Opzioni Tendina quando apri la modale
    useEffect(() => {
        const fetchOpzioni = async () => {
            if (!isModalOpen || !isSegreteria) return;
            const { data: { session } } = await supabase.auth.getSession();
            axios.get(`${import.meta.env.VITE_API_URL}/opzioni-moduli-docenti/`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            })
            .then(res => setOpzioniModuli(res.data))
            .catch(err => console.error("Errore opzioni:", err));
        };
        fetchOpzioni();
    }, [isModalOpen, isSegreteria]);

    // 4. Popola il form se stai modificando, svuotalo se è una nuova lezione
    useEffect(() => {
        if (lezioneSelezionata) {
            setFormData({
                inizio: lezioneSelezionata.inizio.slice(0, 16), // Taglia i secondi per l'input datetime-local
                fine: lezioneSelezionata.fine.slice(0, 16),
                aula: lezioneSelezionata.aula || "",
                modulo_docente_id: lezioneSelezionata.modulo_docente_id || ""
            });
        } else {
            setFormData({ inizio: "", fine: "", aula: "", modulo_docente_id: "" });
        }
    }, [lezioneSelezionata]);

    // --- AZIONI ---

    const handleEventClick = (clickInfo) => {
        if (!isSegreteria) return;
        const evento = clickInfo.event;
        setLezioneSelezionata({
            id: evento.id,
            inizio: evento.startStr,
            fine: evento.endStr,
            aula: evento.extendedProps.aula,
            modulo_docente_id: evento.extendedProps.modulo_docente_id
        });
        setIsModalOpen(true);
    };

    const handleSalvaLezione = async (e) => {
        e.preventDefault();
        const { data: { session } } = await supabase.auth.getSession();
        
        try {
            if (lezioneSelezionata) {
                // MODIFICA (PATCH)
                await axios.patch(`${import.meta.env.VITE_API_URL}/lezioni/${lezioneSelezionata.id}`, formData, {
                    headers: { Authorization: `Bearer ${session?.access_token}` }
                });
            } else {
                // INSERIMENTO (POST)
                await axios.post(`${import.meta.env.VITE_API_URL}/lezioni/`, formData, {
                    headers: { Authorization: `Bearer ${session?.access_token}` }
                });
            }
            setIsModalOpen(false);
            fetchLezioni();
        } catch (error) {
            alert(`Errore: ${error.response?.data?.detail || "Errore sconosciuto"}`);
        }
    };

    const handleElimina = async () => {
        if (!window.confirm("Sei sicuro di voler eliminare questa lezione?")) return;
        const { data: { session } } = await supabase.auth.getSession();
        
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/lezioni/${lezioneSelezionata.id}`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            setIsModalOpen(false);
            fetchLezioni();
        } catch (error) {
            alert("Errore durante l'eliminazione");
        }
    };

    // --- RENDER SCHERMATE ---

    // Schermata Selezione Classe (Solo Segreteria)
    if (isSegreteria && !classeSelezionata) {
        return (
            <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <h2>Gestione Calendari</h2>
                    <p style={{ color: '#64748b', marginBottom: '20px' }}>Seleziona una classe per gestire il calendario.</p>
                    <select 
                        className="modern-select"
                        value={classeSelezionata}
                        onChange={(e) => setClasseSelezionata(e.target.value)}
                    >
                        <option value="">-- Seleziona una classe --</option>
                        {classi.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                </div>
            </div>
        );
    }

    // Calendario e Modale
    return (
        <div className="page-container">
            <div className="calendar-card">
                
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    {isSegreteria ? (
                        <div>
                            <h2 style={{ margin: 0, display: 'inline-block', marginRight: '15px' }}>Calendario Classe</h2>
                            <button onClick={() => setClasseSelezionata("")} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline' }}>
                                (Cambia classe)
                            </button>
                        </div>
                    ) : (
                        <h2 style={{ margin: 0 }}>Il Mio Calendario</h2>
                    )}
                    
                    {isSegreteria && (
                        <button onClick={() => { setLezioneSelezionata(null); setIsModalOpen(true); }} className="login-btn">
                            + Nuova Lezione
                        </button>
                    )}
                </div>

                {/* CALENDARIO */}
                <FullCalendar
                    plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                    initialView={"timeGridWeek"}
                    locale="it"
                    events={eventi}
                    slotMinTime="08:00:00"
                    slotMaxTime="19:00:00"
                    allDaySlot={false}
                    expandRows={true}
                    height="100%"
                    handleWindowResize={true}
                    headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek",
                    }}
                    buttonText={{ today: "Oggi", month: "Mese", week: "Settimana", day: "Giorno" }}
                    eventClick={handleEventClick}
                    eventMouseEnter={(info) => { if (isSegreteria) info.el.style.cursor = 'pointer'; }}
                />
            </div>

            {/* MODALE CON IL FORM */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{lezioneSelezionata ? "Modifica Lezione" : "Aggiungi Nuova Lezione"}</h3>
                        
                        <form onSubmit={handleSalvaLezione} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                            <div className="input-group">
                                <label>Materia, Docente e Classe</label>
                                <select 
                                    className="modern-select"
                                    value={formData.modulo_docente_id}
                                    onChange={(e) => setFormData({...formData, modulo_docente_id: e.target.value})}
                                    required
                                >
                                    <option value="">Seleziona un'opzione...</option>
                                    {opzioniModuli.map(opzione => (
                                        <option key={opzione.id} value={opzione.id}>
                                            {opzione.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label>Inizio</label>
                                    <input type="datetime-local" value={formData.inizio} onChange={(e) => setFormData({...formData, inizio: e.target.value})} required />
                                </div>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label>Fine</label>
                                    <input type="datetime-local" value={formData.fine} onChange={(e) => setFormData({...formData, fine: e.target.value})} required />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Aula (Opzionale)</label>
                                <input type="text" placeholder="Es: Aula Magna" value={formData.aula} onChange={(e) => setFormData({...formData, aula: e.target.value})} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                                {/* Tasto elimina appare solo in modifica */}
                                {lezioneSelezionata && (
                                    <button type="button" onClick={handleElimina} style={{ marginRight: 'auto', padding: '8px 16px', borderRadius: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}>
                                        Elimina
                                    </button>
                                )}
                                
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                                    Annulla
                                </button>
                                <button type="submit" className="login-btn">
                                    {lezioneSelezionata ? "Aggiorna" : "Salva"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;