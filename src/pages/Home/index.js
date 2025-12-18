import { useEffect, useState, useContext } from "react";
// 1. ADICIONE updateDoc e arrayUnion AOS IMPORTS
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"; 
import { db } from "../../services/FirebaseConnection";
import { AuthContext } from "../../contexts/auth";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import { FiHome } from 'react-icons/fi';

// --- IMPORTS DO FIREBASE FUNCTIONS ---
import { getFunctions, httpsCallable } from "firebase/functions";

// --- IMPORTS DO CALENDÁRIO ---
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import { ptBR } from 'date-fns/locale/pt-BR';

// Componentes e CSS
import PageHeader from '../../components/PageHeader';
import Title from '../../components/Title';
import avatar from '../../assets/avatar.png';
import "./home.css";

registerLocale('pt-BR', ptBR);
setDefaultLocale('pt-BR');

const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function renderServicos(servicos) {
  if (!servicos) return "Não informado";
  if (Array.isArray(servicos) && servicos.length > 0) return servicos[0].nome;
  if (typeof servicos === 'string') return servicos;
  if (typeof servicos === 'object' && servicos.nome) return servicos.nome;
  return "Não informado";
}

export default function Home() {
    const { user } = useContext(AuthContext);
    const [faxineiras, setFaxineiras] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedFaxineira, setSelectedFaxineira] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState("");
    const [unavailableDatesList, setUnavailableDatesList] = useState([]);

    useEffect(() => {
        async function fetchFaxineiras() {
            try {
                const querySnapshot = await getDocs(collection(db, "usuarios"));
                const listaFaxineiras = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
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

    const openModal = async (faxineira) => {
        setSelectedFaxineira(faxineira);
        setSelectedDate(null);
        setSelectedTime("");
        setUnavailableDatesList([]);

        try {
            const faxineiraRef = doc(db, "usuarios", faxineira.id);
            const faxineiraSnap = await getDoc(faxineiraRef);

            if (faxineiraSnap.exists()) {
                const faxineiraData = faxineiraSnap.data();
                if (Array.isArray(faxineiraData.unavailableDates)) {
                    const dates = faxineiraData.unavailableDates.map(dateString => {
                        return new Date(`${dateString}T00:00:00`);
                    });
                    setUnavailableDatesList(dates);
                }
            }
        } catch (error) {
            console.error("Erro ao buscar datas indisponíveis:", error);
        } finally {
            setShowModal(true);
        }
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const handleSchedule = async () => {
        if (!selectedDate || !selectedTime) {
            toast.error("Por favor, selecione uma data e horário.");
            return;
        }

        if (!selectedFaxineira) return;

        const dataSelecionada = new Date(selectedDate);
        const [horas, minutos] = selectedTime.split(':');
        dataSelecionada.setHours(parseInt(horas, 10));
        dataSelecionada.setMinutes(parseInt(minutos, 10));
        dataSelecionada.setSeconds(0, 0);

        const now = new Date();
        now.setSeconds(0, 0);

        if (dataSelecionada < now) {
            toast.error("Não é possível agendar em uma data ou horário passados.");
            return;
        }

        const dataSelecionadaString = formatDate(dataSelecionada);
        const indisponivelStrings = unavailableDatesList.map(formatDate);

        if (indisponivelStrings.includes(dataSelecionadaString)) {
            toast.error("O profissional não está disponível nesta data.");
            return;
        }

        // --- MODO DE AGENDAMENTO DIRETO (CLIENT-SIDE) ---
        // Isso salva o agendamento diretamente no banco, sem passar pela Cloud Function que está com erro.
        // Isso é ideal para testes ou se você não tiver o plano Blaze.
        const MODO_DIRETO_CLIENTE = true; 

        if (MODO_DIRETO_CLIENTE) {
            try {
                const novoAgendamento = {
                    timestamp: dataSelecionada, // Objeto Date (o Firestore converte para Timestamp)
                    faxineiraId: selectedFaxineira.id,
                    faxineiraNome: selectedFaxineira.nome,
                    contratanteId: user.uid,
                    contratanteNome: `${user.nome} ${user.sobrenome}`,
                    status: 'pendente', // Status inicial
                    horario: selectedTime
                };

                console.log("Salvando agendamento diretamente:", novoAgendamento);

                // 1. Adicionar ao array de agendamentos do CLIENTE
                const contratanteRef = doc(db, "usuarios", user.uid);
                await updateDoc(contratanteRef, {
                    agendamentos: arrayUnion(novoAgendamento)
                });

                // 2. Adicionar ao array de agendamentos do PRESTADOR
                const prestadorRef = doc(db, "usuarios", selectedFaxineira.id);
                await updateDoc(prestadorRef, {
                    agendamentos: arrayUnion(novoAgendamento)
                });
                
                toast.success("Agendamento realizado com sucesso!");
                closeModal();

            } catch (err) {
                console.error("Erro ao agendar diretamente:", err);
                toast.error("Erro ao salvar o agendamento. Tente novamente.");
            }
            return;
        }
        // --- FIM DO MODO DIRETO ---

        try {
            const dadosAgendamento = {
                prestadorId: selectedFaxineira.id || "",
                prestadorNome: selectedFaxineira.nome || "Prestador",
                prestadorAvatar: selectedFaxineira.avatarUrl || "",
                clienteNome: user ? `${user.nome} ${user.sobrenome}` : "Cliente",
                clienteAvatar: user?.avatarUrl || "",
                dataAgendamento: dataSelecionada.toISOString(), 
                horarioAgendamento: selectedTime || "",
            };

            const functions = getFunctions();
            const criarAgendamento = httpsCallable(functions, "criarAgendamento");

            toast.info("Verificando disponibilidade...");

            const result = await criarAgendamento(dadosAgendamento);

            toast.success(result.data.message || "Agendamento realizado!");
            closeModal();

        } catch (error) {
            console.error("Erro do servidor:", error);
            const msg = error.message === 'internal' 
                ? 'Erro interno no servidor. Verifique os dados e tente novamente.' 
                : error.message;
            toast.error(msg);
        }
    };

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

                                    <div className="servicos-preview">
                                        <strong>Serviços:</strong>
                                        {Array.isArray(faxineira.servicos) && faxineira.servicos.length > 0 ? (
                                            <ul className="servicos-preview-list">
                                                {faxineira.servicos.slice(0, 2).map((servico, index) => (
                                                    <li key={index}>
                                                        {servico.nome} {servico.preco && servico.preco !== 'A combinar' && `(${servico.preco})`}
                                                        {servico.preco === 'A combinar' && `(A combinar)`}
                                                    </li>
                                                ))}
                                                {faxineira.servicos.length > 2 && <li className="servico-mais">e mais...</li>}
                                            </ul>
                                        ) : (
                                            <span> {renderServicos(faxineira.servicos)}</span>
                                        )}
                                    </div>

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

            {showModal && selectedFaxineira && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Agendar com {selectedFaxineira.nome}</h2>
                        <div className="modal-field">
                            <label>Data:</label>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                dateFormat="dd/MM/yyyy"
                                minDate={new Date()}
                                excludeDates={unavailableDatesList}
                                placeholderText="Selecione a data"
                                className="datepicker-input"
                                locale="pt-BR"
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