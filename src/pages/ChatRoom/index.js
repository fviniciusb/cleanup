import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { db } from '../../services/FirebaseConnection';
import { 
    doc, getDoc, collection, query, 
    orderBy, onSnapshot, addDoc, 
    serverTimestamp, updateDoc, setDoc 
} from 'firebase/firestore';
import { FiSend } from 'react-icons/fi';
import './chatroom.css'; // Usaremos o CSS da sua imagem
import { toast } from 'react-toastify';

export default function ChatRoom() {
    const { id: chatId } = useParams(); // Pega o ID da URL
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    // É ASSIM que pegamos os dados enviados pelo navigate
    const location = useLocation(); 

    const [chatInfo, setChatInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    
    // Ref para rolar a div de mensagens para o final
    const messagesEndRef = useRef(null); 

    // Efeito para buscar/CRIAR o chat
    useEffect(() => {
        async function loadChatInfo() {
            setLoading(true);
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);

            if (chatSnap.exists()) {
                // --- 1. CHAT JÁ EXISTE ---
                const chatData = chatSnap.data();
                
                // Validação de segurança
                if (!chatData.users.includes(user.uid)) {
                    toast.error("Acesso negado.");
                    navigate("/chat");
                    return;
                }
                
                const otherUserId = chatData.users.find(id => id !== user.uid);
                setChatInfo({
                    otherUserName: chatData.userNames[otherUserId]
                });

            } else {
                // --- 2. CHAT NÃO EXISTE, VAMOS CRIAR ---
                // Pega os dados que o Agendamento.js enviou
                const recipientData = location.state;

                if (!recipientData || !recipientData.recipientId) {
                    toast.error("Chat não encontrado ou dados inválidos.");
                    navigate("/chat");
                    return;
                }

                // Cria o novo chat no Firestore
                try {
                    await setDoc(chatRef, {
                        users: [user.uid, recipientData.recipientId],
                        userNames: {
                            [user.uid]: `${user.nome} ${user.sobrenome}`,
                            [recipientData.recipientId]: recipientData.recipientName
                        },
                        lastMessage: "Inicie a conversa!",
                        lastMessageAt: serverTimestamp()
                    });

                    setChatInfo({
                        otherUserName: recipientData.recipientName
                    });

                } catch (error) {
                    console.error("Erro ao criar chat:", error);
                    navigate("/chat");
                }
            }
        }
        loadChatInfo();
    }, [chatId, user, navigate, location.state]);

    // Efeito para carregar as mensagens em tempo real
    useEffect(() => {
        // Só começa a ouvir por mensagens DEPOIS que o chatInfo estiver pronto
        if (!chatInfo) return; 

        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const listaMensagens = [];
            snapshot.forEach(doc => {
                listaMensagens.push({ id: doc.id, ...doc.data() });
            });
            setMessages(listaMensagens);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId, chatInfo]); // Depende do chatInfo

    // Efeito para rolar para a última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Função para enviar mensagem
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "") return;

        const messagesRef = collection(db, "chats", chatId, "messages");
        
        try {
            await addDoc(messagesRef, {
                text: newMessage,
                senderId: user.uid,
                createdAt: serverTimestamp()
            });

            const chatRef = doc(db, "chats", chatId);
            await updateDoc(chatRef, {
                lastMessage: newMessage,
                lastMessageAt: serverTimestamp()
            });

            setNewMessage(""); 

        } catch (error) {
            toast.error("Erro ao enviar mensagem.");
        }
    };

    if (loading || !chatInfo) {
        return <div className="loading-container">Carregando...</div>
    }

    return (
        <div className="chat-page-container">
            {/* Cabeçalho */}
            <header className="chat-header">
                <button className="btn-voltar" onClick={() => navigate("/chat")}>
                    Voltar
                </button>
                <h2>{chatInfo.otherUserName}</h2>
            </header>

            {/* Lista de Mensagens */}
            <div className="message-list">
                {messages.map(msg => (
                    <div 
                        key={msg.id}
                        // Define a classe com base no remetente
                        className={`message ${msg.senderId === user.uid ? 'sent' : 'received'}`}
                    >
                        <div className="message-bubble">
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                {/* Div invisível para forçar a rolagem */}
                <div ref={messagesEndRef} />
            </div>

            {/* Formulário de Envio */}
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