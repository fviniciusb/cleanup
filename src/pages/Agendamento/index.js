// src/pages/Agendamento/index.js
import { useEffect, useState, useContext } from "react";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../../services/FirebaseConnection";
import { AuthContext } from "../../contexts/auth";
import { toast } from "react-toastify";
import "./agendamento.css";
import { useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";

export default function Agendamento() {
  const { user } = useContext(AuthContext);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- NOVOS ESTADOS PARA O MODAL ---
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [modalRating, setModalRating] = useState(0);
  const [modalHover, setModalHover] = useState(0);
  
  // --- ALTERAÇÃO 1: Novo estado para o texto do feedback ---
  const [feedbackText, setFeedbackText] = useState("");

  // Carrega os agendamentos (sem alterações)
  useEffect(() => {
    async function fetchAgendamentos() {
      if (!user) return;
      try {
        const userRef = doc(db, "usuarios", user.uid);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
          const data = userSnapshot.data();
          setAgendamentos(
            Array.isArray(data.agendamentos) ? data.agendamentos : []
          );
        }
      } catch (error) {
        console.error("Erro fetchAgendamentos:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAgendamentos();
  }, [user]);

  // Excluir agendamento (sem alterações)
  const handleDelete = async (agendamentoParaExcluir) => {
    try {
      const timestampParaExcluir = agendamentoParaExcluir?.timestamp;
      if (!timestampParaExcluir) {
        toast.error("Não é possível excluir (dados antigos).");
        return;
      }
      const contratanteRef = doc(db, "usuarios", agendamentoParaExcluir.contratanteId);
      const contratanteSnapshot = await getDoc(contratanteRef);
      if (contratanteSnapshot.exists()) {
        const contratanteData = contratanteSnapshot.data();
        const updatedAgendamentos = (contratanteData.agendamentos || []).filter(
          (item) => !item.timestamp?.isEqual(timestampParaExcluir)
        );
        await updateDoc(contratanteRef, { agendamentos: updatedAgendamentos });
      }
      const faxineiraRef = doc(db, "usuarios", agendamentoParaExcluir.faxineiraId);
      const faxineiraSnapshot = await getDoc(faxineiraRef);
      if (faxineiraSnapshot.exists()) {
        const faxineiraData = faxineiraSnapshot.data();
        const updatedAgendamentos = (faxineiraData.agendamentos || []).filter(
          (item) => !item.timestamp?.isEqual(timestampParaExcluir)
        );
        await updateDoc(faxineiraRef, { agendamentos: updatedAgendamentos });
      }
      setAgendamentos((prev) =>
        prev.filter((item) => !item.timestamp?.isEqual(timestampParaExcluir))
      );
      toast.success("Agendamento finalizado/excluído!");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir.");
    }
  };

  function handleStartChat(agendamento) {
    const otherUserId = user.objetivo === "1" ? agendamento.faxineiraId : agendamento.contratanteId;
    const otherUserName = user.objetivo === "1" ? agendamento.faxineiraNome : agendamento.contratanteNome;
    
    if (!user || !user.uid || !otherUserId) {
      toast.error("Não foi possível iniciar o chat: dados ausentes.");
      return;
    }
    const chatId = [user.uid, otherUserId].sort().join("_");
    navigate(`/chat/${chatId}`, {
      state: { recipientId: otherUserId, recipientName: otherUserName || "Usuário" },
    });
  }

  // --- FUNÇÕES DO MODAL ---
  const openRatingModal = (agendamento) => {
    setRatingTarget(agendamento);
    setModalRating(0);
    setModalHover(0);
    setFeedbackText(""); // --- ALTERAÇÃO 2: Limpa o texto ao abrir ---
    setShowRatingModal(true);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setRatingTarget(null);
  };

  const handleRating = async () => {
    const agendamentoParaAvaliar = ratingTarget;
    const rating = modalRating;
    // Captura o texto do estado
    const comentario = feedbackText; 

    if (!agendamentoParaAvaliar || rating === 0) {
      toast.warn("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    const timestampParaAvaliar = agendamentoParaAvaliar.timestamp;
    const faxineiraId = agendamentoParaAvaliar.faxineiraId;

    if (!timestampParaAvaliar || !faxineiraId) {
      toast.error("Não é possível avaliar (dados incompletos).");
      closeRatingModal();
      return;
    }

    try {
      // 1. Atualiza Faxineira (Média e Total)
      const faxineiraRef = doc(db, "usuarios", faxineiraId);
      const faxineiraSnap = await getDoc(faxineiraRef);
      if (faxineiraSnap.exists()) {
        const faxineiraData = faxineiraSnap.data();
        const novoTotal = (faxineiraData.totalAvaliacoes || 0) + 1;
        const novaSoma = (faxineiraData.somaAvaliacoes || 0) + rating;
        const novaMedia = novaSoma / novoTotal;
        
        await updateDoc(faxineiraRef, {
          totalAvaliacoes: increment(1),
          somaAvaliacoes: increment(rating),
          mediaAvaliacoes: novaMedia
        });
      } else { throw new Error("Profissional não encontrado."); }

      // 2. Marca Agendamento no Contratante
      const contratanteRef = doc(db, "usuarios", user.uid);
      const contratanteSnap = await getDoc(contratanteRef);
      
      if (contratanteSnap.exists()) {
        const contratanteData = contratanteSnap.data();
        const agendamentosAtuais = Array.isArray(contratanteData.agendamentos) ? contratanteData.agendamentos : [];
        
        const agendamentosAtualizados = agendamentosAtuais.map(item => {
          if (item.timestamp?.isEqual(timestampParaAvaliar)) {
            // --- ALTERAÇÃO 3: Salva a nota E o feedback ---
            return { 
              ...item, 
              avaliacao: rating,
              comentario: comentario // Salvando o comentário
            };
          } 
          return item;
        });

        // Atualiza no Firestore
        await updateDoc(contratanteRef, { agendamentos: agendamentosAtualizados });
        
        // Atualiza localmente
        setAgendamentos(agendamentosAtualizados);

        toast.success(`Avaliação enviada com sucesso!`);
        closeRatingModal();

        // 3. Chama a função de exclusão
        // IMPORTANTE: Se o handleDelete apagar o item do array, o comentário será perdido 
        // a menos que você tenha uma lógica de histórico separada.
        await handleDelete(agendamentoParaAvaliar);
      }

    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      toast.error("Erro ao registrar avaliação.");
      closeRatingModal();
    }
  };

  return (
    <div>
      <h1 className="main-title">Agendamentos</h1>
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
              const dataFormatada = dataHora ? dataHora.toLocaleDateString("pt-BR") : "Inválida";
              const horaFormatada = dataHora ? dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--";
              const isPast = dataHora ? dataHora < new Date() : false;
              const isRated = agendamento.avaliacao > 0;
              const isContratante = user.objetivo === "1";

              return (
                <div className="agendamento-card" key={agendamento.timestamp?.toMillis() || index}>
                  <div className="card-info">
                    <h3>{isContratante ? agendamento.faxineiraNome : agendamento.contratanteNome}</h3>
                    <div className="card-details">
                      <span className="detail-item">Data: <strong>{dataFormatada}</strong></span>
                      <span className="detail-item">Horário: <strong>{horaFormatada}</strong></span>
                    </div>

                    {isContratante && isPast && isRated && (
                      <div className="rating-display">
                        Sua Avaliação: {[...Array(agendamento.avaliacao)].map((_, i) => (
                          <FaStar key={i} color="#ffc107" size={20} />
                        ))}
                      </div>
                    )}
                    {!isContratante && isRated && (
                      <div className="rating-display">
                        Avaliação Recebida: {[...Array(agendamento.avaliacao)].map((_, i) => (
                          <FaStar key={i} color="#ffc107" size={20} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    <button className="btn-chat" onClick={() => handleStartChat(agendamento)}>Chat</button>
                    <button className="btn-excluir" onClick={() => handleDelete(agendamento)}>Excluir</button>
                    {isContratante && isPast && !isRated && (
                      <button className="btn-finalizar" onClick={() => openRatingModal(agendamento)}>
                        Finalizar e Avaliar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- MODAL DE AVALIAÇÃO --- */}
      {showRatingModal && ratingTarget && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Avaliar Serviço de {ratingTarget.faxineiraNome}</h2>
            <p>Como foi sua experiência? (Selecione 1 a 5 estrelas)</p>

            <div className="modal-stars">
              {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                  <label key={index}>
                    <input
                      type="radio"
                      name="modalRatingRadio"
                      value={ratingValue}
                      onClick={() => setModalRating(ratingValue)}
                      style={{ display: "none" }}
                    />
                    <FaStar
                      className="star"
                      color={ratingValue <= (modalHover || modalRating) ? "#ffc107" : "#e4e5e9"}
                      size={35}
                      onMouseEnter={() => setModalHover(ratingValue)}
                      onMouseLeave={() => setModalHover(0)}
                      style={{ cursor: "pointer" }}
                    />
                  </label>
                );
              })}
            </div>

            {/* --- ALTERAÇÃO 4: TEXTAREA PARA FEEDBACK --- */}
            <div className="modal-feedback-area">
              <textarea 
                placeholder="Deixe um comentário sobre o serviço (opcional)..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                maxLength={300} // Limite de caracteres opcional
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancelar" onClick={closeRatingModal}>
                Cancelar
              </button>
              <button
                className="btn-confirmar"
                onClick={handleRating}
                disabled={modalRating === 0}
              >
                Confirmar Avaliação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}