import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/auth';
import { db } from '../../services/FirebaseConnection';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import PageHeader from '../../components/PageHeader';
import Title from '../../components/Title';
import { FiCalendar, FiClock } from 'react-icons/fi';
import './agendamento.css';

// --- Função Helper para renderizar serviços (mesma da Home) ---
function renderServicoNome(servicos) {
  if (!servicos) return "Serviço Padrão";
  if (typeof servicos === 'string') return servicos;
  if (Array.isArray(servicos) && servicos.length > 0) return servicos[0].nome;
  if (typeof servicos === 'object' && servicos.nome) return servicos.nome;
  return "Serviço Padrão";
}

export default function Agendamento() {
  const { user } = useContext(AuthContext);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const agendamentosRef = collection(db, "agendamentos");
    
    // Busca agendamentos onde o usuário é cliente OU prestador
    // (O Firestore não permite 'OR' simples, então fazemos duas queries ou filtramos no cliente.
    //  Para simplificar, vamos buscar onde ele é CLIENTE primeiro).
    
    // Se quiser buscar os dois, o ideal é ter duas queries separadas e juntar,
    // mas vamos focar na visão do CLIENTE por enquanto.
    const q = query(
      agendamentosRef,
      where("clienteId", "==", user.uid),
      orderBy("dataAgendamento", "desc") // Ordena por data (mais recente primeiro)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        lista.push({
          id: doc.id,
          ...data
        });
      });
      setAgendamentos(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div>
      <PageHeader>
        <Title nome="Meus Agendamentos">
          <FiCalendar size={25} />
        </Title>
      </PageHeader>

      <div className="agendamento-container">
        {loading ? (
          <div className="loading-container">Carregando agendamentos...</div>
        ) : agendamentos.length === 0 ? (
          <div className="empty-container">
            <p>Você não tem nenhum agendamento marcado.</p>
          </div>
        ) : (
          <div className="agendamentos-list">
            {agendamentos.map((item) => (
              <div className="agendamento-card" key={item.id}>
                
                <div className="card-header">
                   {/* Aqui corrigimos o bug de objeto */}
                   <h3>{item.prestadorNome}</h3> 
                   <span className={`status-badge ${item.status || 'pendente'}`}>
                     {item.status || 'Pendente'}
                   </span>
                </div>

                <div className="card-content">
                  <div className="info-row">
                    <FiCalendar color="#5EA1BD" />
                    <span>{item.dataAgendamento ? new Date(item.dataAgendamento).toLocaleDateString('pt-BR') : 'Data inválida'}</span>
                  </div>
                  <div className="info-row">
                    <FiClock color="#5EA1BD" />
                    <span>{item.horarioAgendamento}</span>
                  </div>
                  
                  {/* Se houver serviços salvos, mostra aqui */}
                  {item.servicos && (
                     <p className="servico-info">
                       <strong>Serviço:</strong> {renderServicoNome(item.servicos)}
                     </p>
                  )}
                </div>

                {/* Você pode adicionar botões de ação aqui (Cancelar, Detalhes) */}
                {/* <div className="card-actions">
                    <button className="btn-cancelar">Cancelar</button>
                </div> */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}