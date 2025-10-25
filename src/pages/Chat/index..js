// src/pages/ChatPage/index.js
import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp} from 'firebase/firestore';
import { AuthContext } from '../../contexts/auth';
import { db } from '../../services/FirebaseConnection';
import { toast } from 'react-toastify';
import { FiSend } from 'react-icons/fi';
import { setDoc } from 'firebase/firestore';
import './chat.css'; // Vamos criar este CSS no próximo passo

export default function ChatPage() {
    const { user } = useContext(AuthContext);
    const { chatId } = useParams(); // Pega o ID do chat da URL (ex: uid1_uid2)
    const location = useLocation(); // Pega os dados passados pelo 'navigate'
    const navigate = useNavigate();

    const [recipientInfo, setRecipientInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef(null); // Ref para o final da lista (auto-scroll)

    // Efeito para pegar os dados do destinatário (que passamos via 'state')
    useEffect(() => {
        if (location.state && location.state.recipientName) {
            setRecipientInfo({
                name: location.state.recipientName,
                id: location.state.recipientId
            });
        } else {
            // Se o usuário recarregar a página, o 'state' se perde.
            // Aqui você poderia buscar os dados do destinatário no DB
            // usando o 'chatId' (dividindo os UIDs), mas por enquanto
            // vamos apenas redirecionar para a home para simplificar.
            toast.error("Erro ao carregar o chat. Voltando para Home.");
            navigate('/home');
        }
    }, [location.state, navigate]);

    // Efeito para "ouvir" as mensagens em tempo real
    useEffect(() => {
        if (!chatId) return; // Não faz nada se não tiver chatId

        setLoading(true);
        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = [];
            querySnapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() });
            });
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar mensagens: ", error);
            toast.error("Erro ao carregar mensagens.");
            setLoading(false);
        });

        // Limpa o listener quando o componente desmontar
        return () => unsubscribe();

    }, [chatId]);

    // Efeito para rolar para a última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    // Função para enviar uma nova mensagem
    async function handleSendMessage(e) {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const messagesRef = collection(db, "chats", chatId, "messages");
        
        try {
            // Adiciona a nova mensagem na subcoleção 'messages'
            await addDoc(messagesRef, {
                text: newMessage,
                senderId: user.uid,
                senderName: `${user.nome} ${user.sobrenome}`, // Salva o nome do remetente
                timestamp: serverTimestamp()
            });

            // Atualiza o documento "pai" (o chat) com a última mensagem
            const chatDocRef = doc(db, "chats", chatId);
            await setDoc(chatDocRef, {
                lastMessage: newMessage,
                lastSender: user.uid,
                lastUpdated: serverTimestamp()
            });

        } catch (error) {
            console.error("Erro ao enviar mensagem: ", error);
            toast.error("Não foi possível enviar a mensagem.");
        }
        setNewMessage('');
    }

    if (!recipientInfo) {
        // Mostra um loading enquanto o recipientInfo (do location.state) é carregado
        return <div className="loading-container">Carregando Chat...</div>;
    }

    return (
        <div className="chat-page-container">
            <div className="chat-header">
                <button onClick={() => navigate(-1)} className="btn-voltar">Voltar</button>
                <h2>{recipientInfo.name}</h2>
            </div>

            <div className="message-list">
                {loading && <div className="loading-chat">Carregando mensagens...</div>}
                
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`message ${msg.senderId === user.uid ? 'sent' : 'received'}`}
                    >
                        <div className="message-bubble">
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}

                {/* Div invisível para o auto-scroll */}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit"><FiSend size={20} /></button>
            </form>
        </div>
    );
}