import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";
import Select from "react-select";

const Home = () => {
    const { utenteDB } = useAuth();
    const isSegreteria = utenteDB?.ruolo === "segreteria";

    // Stati Generali
    const [classi, setClassi] = useState([]);
    const [classeSelezionata, setClasseSelezionata] = useState("");
    const [eventi, setEventi] = useState([]);
    
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
        const evento = clickInfo.event;
        setLezioneSelezionata({
            id: evento.id,
            title: evento.title,
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
            <div className="page-container centered-page">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <h2>Gestione Calendari</h2>
                    <p className="text-muted" style={{ marginBottom: '20px' }}>Seleziona una classe per gestire il calendario.</p>
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
                <div className="calendar-header">
                    {isSegreteria ? (
                        <div className="title-group">
                            <h2>Calendario Classe</h2>
                            <button onClick={() => setClasseSelezionata("")} className="btn-link">
                                (Cambia classe)
                            </button>
                        </div>
                    ) : "" }
                    
                    {isSegreteria && (
                        <button onClick={() => { setLezioneSelezionata(null); setIsModalOpen(true); }} className="login-btn">
                            + Nuova Lezione
                        </button>
                    )}
                </div>

                {/* CALENDARIO */}
                <FullCalendar
                    plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
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
                    eventMouseEnter={(info) => { info.el.style.cursor = 'pointer'; }}
                />
            </div>

            {/* MODALE CON IL FORM */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>
                            {!isSegreteria 
                                ? "Dettagli Lezione" 
                                : lezioneSelezionata ? "Modifica Lezione" : "Aggiungi Nuova Lezione"}
                        </h3>
                        
                        {!isSegreteria && lezioneSelezionata ? (
                            /* --- VISTA STUDENTE (SOLO LETTURA) --- */
                            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                    
                                    {/* Titolo - data */}
                                    <p style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: '600' }}>
                                        {lezioneSelezionata.title} - {new Date(lezioneSelezionata.inizio).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                    
                                    {/* Inizio */}
                                    <p style={{ margin: '8px 0', color: '#475569', fontSize: '0.95rem' }}>
                                        <strong>Inizio:</strong> {new Date(lezioneSelezionata.inizio).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    
                                    {/* Fine */}
                                    <p style={{ margin: '8px 0', color: '#475569', fontSize: '0.95rem' }}>
                                        <strong>Fine:</strong> {new Date(lezioneSelezionata.fine).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    
                                    {/* Aula */}
                                    <p style={{ margin: '8px 0', color: '#475569', fontSize: '0.95rem' }}>
                                        <strong>Aula:</strong> {lezioneSelezionata.aula || "Non specificata"}
                                    </p>
                                    
                                </div>
                                
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="login-btn">
                                        Chiudi
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSalvaLezione} className="modal-form">
                                <div className="input-group">
                                    <label>Materia, Docente e Classe</label>
                                    <Select
                                        // Mappiamo le tue opzioni nel formato richiesto da react-select
                                        options={opzioniModuli.map(opt => ({ value: opt.id, label: opt.label }))}
                                        
                                        // Cerchiamo l'oggetto completo corrispondente all'ID salvato nello stato
                                        value={opzioniModuli.map(opt => ({ value: opt.id, label: opt.label }))
                                            .find(opt => opt.value === formData.modulo_docente_id) || null}
                                        
                                        // Quando l'utente sceglie, salviamo solo l'ID (value) nello stato
                                        onChange={(selectedOption) => setFormData({
                                            ...formData, 
                                            modulo_docente_id: selectedOption ? selectedOption.value : ""
                                        })}
                                        
                                        placeholder="Cerca docente o materia..."
                                        isClearable={true}
                                        isSearchable={true}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label>Inizio</label>
                                        <input type="datetime-local" value={formData.inizio} onChange={(e) => setFormData({...formData, inizio: e.target.value})} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Fine</label>
                                        <input type="datetime-local" value={formData.fine} onChange={(e) => setFormData({...formData, fine: e.target.value})} required />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Aula (Opzionale)</label>
                                    <input type="text" placeholder="Es: Aula Magna" value={formData.aula} onChange={(e) => setFormData({...formData, aula: e.target.value})} />
                                </div>

                                <div className="modal-actions">
                                    {/* Tasto elimina appare solo in modifica */}
                                    {lezioneSelezionata && (
                                        <button type="button" onClick={handleElimina} className="btn-danger">
                                            Elimina
                                        </button>
                                    )}
                                    
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                                        Annulla
                                    </button>
                                    <button type="submit" className="login-btn">
                                        {lezioneSelezionata ? "Aggiorna" : "Salva"}
                                    </button>
                                </div>
                            </form>
                            )
                        }
                        </div>
                    </div>
                )
            };
        </div>
    )
}

export default Home;