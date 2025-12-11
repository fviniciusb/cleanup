import { useEffect, useState, useContext } from "react";
import avatar from '../../assets/avatar.png';
import { collection, getDocs, query, where } from "firebase/firestore";
// 1. IMPORTANTE: Importamos 'functions' do nosso arquivo de conexão
import { db, functions } from "../../services/FirebaseConnection"; 
import { AuthContext } from "../../contexts/auth";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import { httpsCallable } from "firebase/functions";
import PageHeader from '../../components/PageHeader';
import Title from '../../components/Title';
import { FiHome } from 'react-icons/fi';

import "./home.css"; 

function renderServicos(servicos) {
  if (!servicos) return "Não informado";
  if (Array.isArray(servicos)) {
    if (servicos.length === 0) return "Nenhum serviço cadastrado";
    const primeiroServico = servicos[0];
    let texto = primeiroServico.nome;
    if (primeiroServico.preco && primeiroServico.preco !== 'A combinar') {
        texto += ` (${primeiroServico.preco})`;
    }
    if (servicos.length > 1) {
        texto += ` e mais ${servicos.length - 1}...`;
    }
    return texto;
  }
  if (typeof servicos === 'string') return servicos;
  if (typeof servicos === 'object') {
     const nome = servicos.nome || "Serviço sem nome";
     const preco = servicos.preco ? ` - ${servicos.preco}` : "";
     return `${nome}${preco}`;
  }
  return "Formato inválido";
}

export default function Home() {
    const { user } = useContext(AuthContext);
    const [faxineiras, setFaxineiras] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedFaxineira, setSelectedFaxineira] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");

    useEffect(() => {
        async function fetchFaxineiras() {
            try {
                const usuariosRef = collection(db, "usuarios");
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
                        servicos: data.servicos,
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
        // Garantir que a faxineira selecionada tem ID
        console.log("Faxineira selecionada:", faxineira);
        setSelectedFaxineira(faxineira);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedDate("");
        setSelectedTime("");
    };

    // --- AQUI ESTÁ A MODIFICAÇÃO PRINCIPAL ---
    const handleSchedule = async () => {
        if (!selectedDate || !selectedTime) {
            toast.error("Por favor, selecione uma data e horário.");
            return;
        }

        // Verifica se o usuário está logado
        if (!user || !user.uid) {
            toast.error("Você precisa estar logado para agendar.");
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

            // Montagem do Objeto de Dados
            const dadosAgendamento = {
                prestadorId: selectedFaxineira.id,
                prestadorNome: selectedFaxineira.nome || "Prestador",
                prestadorAvatar: selectedFaxineira.avatarUrl || null,
                clienteNome: user.nome ? `${user.nome} ${user.sobrenome || ''}`.trim() : "Cliente",
                clienteAvatar: user.avatarUrl || null,
                dataAgendamento: selectedDate,
                horarioAgendamento: selectedTime,
            };

            // === ÁREA DE DEBUG ===
            console.log("=== INICIANDO AGENDAMENTO ===");
            console.log("Dados que serão enviados:", dadosAgendamento);
            
            // Verificação de segurança no Front antes de chamar o Back
            if (!dadosAgendamento.prestadorId) {
                console.error("ERRO CRÍTICO: ID do prestador está undefined ou null!");
                toast.error("Erro interno: Identificação do prestador falhou. Tente recarregar a página.");
                return; 
            }
            // ====================

            const criarAgendamento = httpsCallable(functions, "criarAgendamento");

            toast.info("Verificando disponibilidade...");

            const result = await criarAgendamento(dadosAgendamento);

            console.log("Sucesso no agendamento:", result.data);
            toast.success(result.data.message);
            closeModal();

        } catch (error) {
            console.error("Erro retornado pelo servidor:", error);
            // Tenta pegar a mensagem de erro específica do Firebase Functions ou usa uma genérica
            const mensagem = error.message || "Erro ao realizar agendamento.";
            toast.error(mensagem);
        }
    };
    // ----------------------------------------

    return (
        <div>
            <PageHeader>
                <Title nome="Encontre Profissionais">
                    <FiHome size={25} />
                </Title>
            </PageHeader>

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