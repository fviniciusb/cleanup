import avatar from '../../assets/avatar.png';
import { useEffect, useState, useContext } from "react";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../services/FirebaseConnection";
import { AuthContext } from "../../contexts/auth";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";

import "../Home/home.css";

export default function Home() {
    const { user, setUser, storageUser } = useContext(AuthContext);
    const [faxineiras, setFaxineiras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFaxineira, setSelectedFaxineira] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");

    useEffect(() => {
        async function fetchFaxineiras() {
            try {
                const querySnapshot = await getDocs(collection(db, "usuarios"));
                const listaFaxineiras = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // Apenas faxineiras disponíveis
                    if (data.objetivo === "2" && data.disponivel) {
                        listaFaxineiras.push({
                            id: doc.id,
                            nome: `${data.nome} ${data.sobrenome}`,
                            servicos: data.servicos,
                            avatarUrl: data.avatarUrl || "",
                            telefone: data.telefone || "Não informado",
                            mediaAvaliacoes: data.mediaAvaliacoes || 0,
                            totalAvaliacoes: data.totalAvaliacoes || 0,
                        });
                    }
                });

                setFaxineiras(listaFaxineiras);
            } catch (error) {
                console.error("Erro ao buscar faxineiras:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchFaxineiras();
    }, []);

    const openModal = (faxineira) => {
        setSelectedFaxineira(faxineira);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedDate("");
        setSelectedTime("");
    };

const handleSchedule = async () => {
    // Validação de campos vazios (continua igual)
    if (!selectedDate || !selectedTime) {
        toast.error("Por favor, selecione uma data e horário.");
        return;
    }
    try {
        // --- INÍCIO DA NOVA LÓGICA DE VALIDAÇÃO ---

        // 'selectedDate' (do type="date") vem como "aaaa-mm-dd"
        // 'selectedTime' (do type="time") vem como "HH:mm"
        const combinedString = `${selectedDate}T${selectedTime}`;

        const selectDataTime = new Date(combinedString);

        // Pega a data e hora atuais, também no fuso local
        const now = new Date();
        now.setSeconds(0, 0);

        // 5. Compare as datas
        if (selectDataTime < now) {
            toast.error("Não é possível agendar em uma data ou horário passados.");
            return; // Bloqueia o agendamento
        }

        // 6. Crie o objeto de agendamento
        const agendamento = {
            timestamp: selectDataTime, 
            faxineiraId: selectedFaxineira.id,
            faxineiraNome: selectedFaxineira.nome,
            contratanteId: user.uid,
            contratanteNome: `${user.nome} ${user.sobrenome}`,
        };

        // Salva no banco de dados
        const contratanteRef = doc(db, "usuarios", user.uid);
        const contratanteSnapshot = await getDoc(contratanteRef);
        const agendamentosAtualizadosContratante =
            contratanteSnapshot.exists() && contratanteSnapshot.data().agendamentos
                ? [...contratanteSnapshot.data().agendamentos, agendamento]
                : [agendamento];

        await updateDoc(contratanteRef, {
            agendamentos: agendamentosAtualizadosContratante,
        });

        const faxineiraRef = doc(db, "usuarios", selectedFaxineira.id);
        const faxineiraSnapshot = await getDoc(faxineiraRef);
        const agendamentosAtualizadosFaxineira =
            faxineiraSnapshot.exists() && faxineiraSnapshot.data().agendamentos
                ? [...faxineiraSnapshot.data().agendamentos, agendamento]
                : [agendamento];

        await updateDoc(faxineiraRef, {
            agendamentos: agendamentosAtualizadosFaxineira,
        });

        const updatedUser = {
            ...user,
            agendamentos: agendamentosAtualizadosContratante,
        };
        setUser(updatedUser);
        storageUser(updatedUser);

        toast.success("Agendamento realizado com sucesso!");
        closeModal();

    // exibe os erros de validação ou de salvamento
    } catch (error) {
        console.error("Erro ao salvar agendamento:", error);
        // Pode ser um erro na combinação da data (se estiver inválida)
        // ou um erro do Firestore.
        toast.error("Erro ao salvar agendamento. Verifique os dados.");
    }
};

// No seu arquivo Home.js
// SUBSTITUA TODO O SEU 'return (...)' POR ISTO:

return (
    <div>
        <h1 className="main-title">Encontre Profissionais</h1>

        {loading ? (
            <div className="loading-container">Carregando...</div>
        
        ) : faxineiras.length === 0 ? (
            <div className="empty-container">
                <p>Nenhum profissional disponível no momento.</p>
            </div>

        ) : (
            // O container principal para os cards
            <div className="home-container">
                <div className="cards-container">
                    
                    {faxineiras.map((faxineira) => (
                        <div className="card" key={faxineira.id}>
                            <img
                                src={faxineira.avatarUrl || avatar} // Use o avatar padrão
                                alt={faxineira.nome}
                                className="avatar"
                            />
                            
                            <div className="info">
                                <h2>{faxineira.nome}</h2>

                                <div className="rating">
                                    <FaStar color="#F5B50A" size={14} />
                                    <strong>
                                        {faxineira.mediaAvaliacoes > 0 ? faxineira.mediaAvaliacoes.toFixed(1) : 'N/A'}
                                    </strong>
                                    <span>
                                        ({faxineira.totalAvaliacoes} {faxineira.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})
                                    </span>
                                </div>
                                
                                <p><strong>Serviços:</strong> {faxineira.servicos || "Não informado"}</p>
                                <p><strong>Contato:</strong> {faxineira.telefone}</p>
                            </div>
                            
                            {user.objetivo === "1" && (
                                <button
                                    className="btn-agendar"
                                    onClick={() => openModal(faxineira)}
                                >
                                    Agendar Faxina
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- MODAL DE AGENDAMENTO --- */}
        {/* O modal não muda, mas o estilo dele será atualizado no CSS */}
        {showModal && (
            <div className="modal-overlay">
                <div className="modal-content"> {/* Mudei de 'modal' para 'modal-content' */ }
                    <h2>Agendar com {selectedFaxineira.nome}</h2>
                    
                    <div className="modal-field">
                        <label>Data:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    
                    <div className="modal-field">
                        <label>Horário:</label>
                        <input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                        />
                    </div>

                    <div className="modal-actions">
                        <button className="btn-cancelar" onClick={closeModal}>
                            Cancelar
                        </button>
                        <button className="btn-confirmar" onClick={handleSchedule}>
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
);
}
