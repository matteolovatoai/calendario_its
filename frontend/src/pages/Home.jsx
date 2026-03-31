import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient";

const Home = () => {
    const [eventi, setEventi] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [classi, setClassi] = useState([]);

    // Monitoriamo il ridimensionamento della finestra
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        axios
            .get("http://127.0.0.1:8000/classi/")
            .then((res) => setClassi(res.data))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        const fetchLezioni = async () => {
            // Recuperiamo il token dalla sessione di Supabase
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const token = session?.access_token;

            axios
                .get("http://127.0.0.1:8000/lezioni/", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .then((res) => {
                    const eventiFormattati = res.data.map((lezione) => ({
                        id: lezione.id,
                        title: lezione.docente_cognome,
                        start: lezione.inizio,
                        end: lezione.fine,
                        extendedProps: { materia: lezione.materia },
                    }));
                    setEventi(eventiFormattati);
                })
                .catch((err) =>
                    console.error("Errore nel caricamento lezioni:", err),
                );
        };

        fetchLezioni();
    }, []);

    return (
        <div className="page-container">
            <div className="calendar-card">
                <FullCalendar
                    plugins={[timeGridPlugin, dayGridPlugin]} // Aggiungi interactionPlugin per i click
                    views={{
                        timeGridThreeDay: {
                            type: "timeGrid",
                            duration: { days: 3 },
                            buttonText: "3 Giorni",
                        },
                    }}
                    titleFormat={
                        isMobile
                            ? { day: "numeric", month: "short" } // Es: "15 mar"
                            : { day: "numeric", month: "long", year: "numeric" } // Es: "15 marzo 2026"
                    }
                    initialView={
                        window.innerWidth < 768 ? "timeGridDay" : "timeGridWeek"
                    }
                    locale="it"
                    events={eventi}
                    slotMinTime="08:00:00" // Inizio ore 8:00 AM
                    slotMaxTime="19:00:00"
                    slotDuration="01:00:00" // Crea una riga ogni 60 minuti
                    slotLabelInterval="01:00:00"
                    allDaySlot={false}
                    expandRows={true}
                    height="100%" // Si adatta al div .calendar-card
                    handleWindowResize={true}
                    windowResizeDelay={100} // Aspetta un attimo prima di ricalcolare (più fluido)
                    windowResize={(arg) => {
                        // Se l'utente ruota il telefono o ridimensiona il browser
                        if (window.innerWidth < 768) {
                            arg.view.calendar.changeView("timeGridThreeDay");
                        } else {
                            arg.view.calendar.changeView("timeGridWeek");
                        }
                    }}
                    stickyHeaderDates={true}
                    headerToolbar={{
                        left: isMobile ? "prev,next" : "prev,next today",
                        center: "title", // Titolo (mese/anno) al centro
                        right: isMobile ? "today" : "dayGridMonth,timeGridWeek",
                    }}
                    // --- TRADUZIONE PULSANTI ---
                    buttonText={{
                        today: "Oggi",
                        month: "Mese",
                        week: "Settimana",
                        day: "Giorno",
                    }}
                />
            </div>
        </div>
    );
};

export default Home;
