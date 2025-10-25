import { useEffect, useState, useContext } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/FirebaseConnection";
import { AuthContext } from "../../contexts/auth";
import { toast } from "react-toastify";
import "./agendamento.css";
import { useNavigate } from "react-router-dom"; // 1. IMPORTADO

export default function Agendamento() {
    const { user } = useContext(AuthContext);
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // 2. INICIALIZADO

    useEffect(() => {
        async function fetchAgendamentos() {
            if (!user) return;

            try {
                const userRef = doc(db, "usuarios", user.uid);
                const userSnapshot = await getDoc(userRef);

                if (userSnapshot.exists()) {
                    const data = userSnapshot.data();
                    if (data.agendamentos) {
                        setAgendamentos(data.agendamentos);
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar agendamentos:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAgendamentos();
    }, [user]);

    const handleDelete = async (agendamentoParaExcluir) => {
        try {
            // Pega o OBJETO timestamp do agendamento que queremos excluir
            const timestampParaExcluir = agendamentoParaExcluir?.timestamp;

            // Se o item clicado não tiver timestamp, não podemos excluí-lo
            if (!timestampParaExcluir) {
                toast.error("Não é possível excluir este agendamento (dados antigos).");
                return;
            }

            // 1. Remover agendamento do contratante
            const contratanteRef = doc(db, "usuarios", agendamentoParaExcluir.contratanteId);
            const contratanteSnapshot = await getDoc(contratanteRef);
            if (contratanteSnapshot.exists()) {
                const contratanteData = contratanteSnapshot.data();

                // A LÓGICA CORRETA ESTÁ AQUI:
                // Nós mantemos (return true) todos os itens
                // cujo timestamp NÃO SEJA igual (.isEqual()) ao que queremos excluir.
                const updatedAgendamentos = contratanteData.agendamentos.filter(
                    (item) => {
                        // Se o item não tiver timestamp, mantenha
                        if (!item.timestamp) return true;
                        // Se for diferente, mantenha
                        return !item.timestamp.isEqual(timestampParaExcluir);
                    }
                );
                await updateDoc(contratanteRef, { agendamentos: updatedAgendamentos });
            }

            // 2. Remover agendamento da faxineira
            const faxineiraRef = doc(db, "usuarios", agendamentoParaExcluir.faxineiraId);
            const faxineiraSnapshot = await getDoc(faxineiraRef);
            if (faxineiraSnapshot.exists()) {
                const faxineiraData = faxineiraSnapshot.data();

                // MESMA LÓGICA AQUI
                const updatedAgendamentos = faxineiraData.agendamentos.filter(
                    (item) => {
                        if (!item.timestamp) return true;
                        return !item.timestamp.isEqual(timestampParaExcluir);
                    }
                );
                await updateDoc(faxineiraRef, { agendamentos: updatedAgendamentos });
            }

            // 3. Atualiza localmente o estado
            setAgendamentos((prev) =>
                prev.filter(
                    // MESMA LÓGICA AQUI
                    (item) => {
                        if (!item.timestamp) return true; return !item.timestamp.isEqual(timestampParaExcluir);
                    }
                )
            );

            toast.success("Agendamento excluído com sucesso!");

        } catch (error) {
            console.error("Erro ao excluir agendamento:", error);
            toast.error("Erro ao excluir o agendamento. Tente novamente.");
        }
    };

    // 3. NOVA FUNÇÃO ADICIONADA
    function handleStartChat(agendamento) {
        // Define quem é a "outra pessoa" no agendamento
        const otherUserId = user.objetivo === "1" ? agendamento.faxineiraId : agendamento.contratanteId;
        const otherUserName = user.objetivo === "1" ? agendamento.faxineiraNome : agendamento.contratanteNome;

        // Cria um ID de chat único combinando os dois UIDs (ordenados)
        const chatId = [user.uid, otherUserId].sort().join('_');

        // Navega para a (futura) página de chat
        navigate(`/chat/${chatId}`, {
            state: {
                recipientId: otherUserId,
                recipientName: otherUserName
            }
        });
    }


    // --- AQUI COMEÇA O CÓDIGO DE EXIBIÇÃO ---
    return (
        <div>
            <h1 className="main-title">Agendamentos</h1> {/* TÍTULO ADICIONADO */}

            {loading ? (
                <div className="loading-container">Carregando...</div>

            ) : agendamentos.length === 0 ? (
                <div className="empty-container">
                    <p>Você não possui agendamentos</p>
                </div>

            ) : (
                <div className="agendamentos-container">
                    <div className="agendamento-list">

                        {agendamentos.map((agendamento, index) => {

                            const dataHora = agendamento.timestamp?.toDate();
                            const dataFormatada = dataHora
                                ? dataHora.toLocaleDateString('pt-BR')
                                : 'Data não informada';
                            const horaFormatada = dataHora
                                ? dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                : '--:--';

                            return (
                                <div className="agendamento-card" key={index}>

                                    <div className="card-info">
                                        <h3>
                                            {user.objetivo === "1"
                                                ? agendamento.faxineiraNome
                                                : agendamento.contratanteNome}
                                        </h3>
                                        <div className="card-details">
                                            <span className="detail-item">
                                                Data: <strong>{dataFormatada}</strong>
                                            </span>
                                            <span className="detail-item">
                                                Horário: <strong>{horaFormatada}</strong>
                                            </span>
                                        </div>
                                    </div>

                                    {/* 4. BOTÕES ATUALIZADOS */}
                                    <div className="card-actions">
                                        <button
                                            className="btn-chat"
                                            onClick={() => handleStartChat(agendamento)}
                                        >
                                            Chat
                                        </button>
                                        <button
                                            className="btn-excluir"
                                            onClick={() => handleDelete(agendamento)}
                                        >
                                            Excluir
                                        </button>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}