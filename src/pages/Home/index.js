import { useEffect, useState, useContext } from "react";
import avatar from '../../assets/avatar.png';
import { collection, getDocs, query, where } from "firebase/firestore"; // Import 'query' e 'where'
import { db, functions } from "../../services/FirebaseConnection"; // Import 'functions'
import { AuthContext } from "../../contexts/auth";
import { toast } from "react-toastify"; // 1. IMPORT DO TOAST (estava faltando)
import { FaStar } from "react-icons/fa";
import { httpsCallable } from "firebase/functions";

// Importe os componentes de Título
import PageHeader from '../../components/PageHeader';
import Title from '../../components/Title';
import { FiHome } from 'react-icons/fi';

import "./home.css"; // CSS com os cards e o modal

// --- 2. FUNÇÃO 'renderServicos' ATUALIZADA ---
// Esta função agora sabe lidar com ARRAYS
function renderServicos(servicos) {
  if (!servicos) {
    return "Não informado";
  }

  // A. Se for um array (o novo formato)
  if (Array.isArray(servicos) && servicos.length > 0) {
    // Pega o nome do primeiro serviço como exemplo
    return servicos[0].nome; 
  }

  // B. Se for um texto (o formato antigo)
  if (typeof servicos === 'string') {
    return servicos;
  }
  
  // C. Se for um objeto (o formato antigo que quebrou)
  if (typeof servicos === 'object' && !Array.isArray(servicos) && servicos.nome) {
    let precoFormatado = servicos.preco ? ` - ${servicos.preco}` : '';
    return `${servicos.nome}${precoFormatado}`;
  }

  return "Não informado";
}
// --- FIM DA FUNÇÃO ---


export default function Home() {
    const { user } = useContext(AuthContext);
    const [faxineiras, setFaxineiras] = useState([]);
    const [loading, setLoading] = useState(true);

    // States do Modal
    const [selectedFaxineira, setSelectedFaxineira] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");

    useEffect(() => {
        async function fetchFaxineiras() {
            try {
                const usuariosRef = collection(db, "usuarios");
                // 3. Query corrigida para buscar apenas prestadores disponíveis
                const q = query(usuariosRef, 
                  where("objetivo", "==", "2"), 
                  where("disponivel", "==", true)
                );
                
                const querySnapshot = await getDocs(q);
                const listaFaxineiras = [];
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    listaFaxineiras.push({
                        id: doc.id,
                        nome: `${data.nome} ${data.sobrenome}`,
                        servicos: data.servicos, // data.servicos pode ser string, objeto ou array
                        avatarUrl: data.avatarUrl || "",
                        telefone: data.telefone || "Não informado",
                        mediaAvaliacoes: data.mediaAvaliacoes || 0,
                        totalAvaliacoes: data.totalAvaliacoes || 0,
                    });
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

    // A FUNÇÃO DE AGENDAMENTO QUE CHAMA A CLOUD FUNCTION
    const handleSchedule = async () => {
        if (!selectedDate || !selectedTime) {
            toast.error("Por favor, selecione uma data e horário.");
            return;
        }

        try {
            const combinedString = `${selectedDate}T${selectedTime}`;
            const selectDataTime = new Date(combinedString);
            const now = new Date();
            now.setSeconds(0, 0);

            if (selectDataTime < now) {
                toast.error("Não é possível agendar em uma data ou horário passados.");
                return;
            }

            const dadosAgendamento = {
                prestadorId: selectedFaxineira.id,
                prestadorNome: selectedFaxineira.nome,
                prestadorAvatar: selectedFaxineira.avatarUrl,
                clienteNome: `${user.nome} ${user.sobrenome}`,
                clienteAvatar: user.avatarUrl,
                dataAgendamento: selectedDate,
                horarioAgendamento: selectedTime,
            };

            const criarAgendamento = httpsCallable(functions, "criarAgendamento");

            toast.info("Verificando disponibilidade...");

            const result = await criarAgendamento(dadosAgendamento);

            toast.success(result.data.message);
            closeModal();

        } catch (error) {
            console.error("Erro do servidor:", error);
            toast.error(error.message);
        }
    };

    return (
        <div>
            {/* --- CABEÇALHO DA PÁGINA --- */}
            <PageHeader>
                <Title nome="Encontre Profissionais">
                    <FiHome size={25} />
                </Title>
            </PageHeader>

            {/* --- O RESTO DA SUA PÁGINA --- */}
            {loading ? (
                <div className="loading-container">Carregando...</div>
            ) : faxineiras.length === 0 ? (
                <div className="empty-container">
                    <p>Nenhum profissional disponível no momento.</p>
                </div>
            ) : (
                <div className="home-container">
                    <div className="cards-container">
                        {faxineiras.map((faxineira) => (
                            <div className="card" key={faxineira.id}>
                                <img
                                    src={faxineira.avatarUrl || avatar}
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
                                    
                                    {/* --- 4. AQUI ESTÁ A CORREÇÃO --- */}
                                    <p><strong>Serviços:</strong> {renderServicos(faxineira.servicos)}</p>
                                    
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
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
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