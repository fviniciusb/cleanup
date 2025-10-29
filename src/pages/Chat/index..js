// src/pages/ChatPage/index.js
import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
    doc, collection, addDoc, query, 
    orderBy, onSnapshot, serverTimestamp, 
    setDoc, getDoc, updateDoc  // <-- Importe getDoc, updateDoc
} from 'firebase/firestore';
import { AuthContext } from '../../contexts/auth';
import { db } from '../../services/FirebaseConnection';
import { toast } from 'react-toastify';
import { FiSend } from 'react-icons/fi';
import './chat.css'; 

export default function ChatPage() {
    const { user } = useContext(AuthContext);
    const { chatId } = useParams(); 
    const location = useLocation(); 
    const navigate = useNavigate();

    // Renomeei para 'chatInfo' para ser mais claro
    const [chatInfo, setChatInfo] = useState(null); 
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef(null); 

    // --- ESTE É O NOVO useEffect MESTRE ---
    // Ele verifica se o chat existe e, se não, o cria.
    useEffect(() => {
        // Espera o usuário carregar
        if (!user || !chatId) return; 

        async function loadAndCreateChat() {
            setLoading(true);
            const chatDocRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatDocRef);

            if (chatSnap.exists()) {
                // --- 1. CHAT JÁ EXISTE ---
                const chatData = chatSnap.data();
                // Validação de segurança
                if (!chatData.users.includes(user.uid)) {
                    toast.error("Acesso negado.");
                    navigate("/chat"); // (Ou /home)
                    return;
                }
                // Pega o nome do outro usuário
                const otherUserId = chatData.users.find(id => id !== user.uid);
                setChatInfo({
                    name: chatData.userNames[otherUserId] || 'Usuário',
                    id: otherUserId
                });
                
            } else {
                // --- 2. CHAT NÃO EXISTE, VAMOS CRIAR ---
                const recipientData = location.state;
                
                // Se não temos os dados (ex: F5 na página), não podemos criar
                if (!recipientData || !recipientData.recipientId) {
                    toast.error("Erro ao carregar o chat. Inicie pela tela de agendamentos.");
                    navigate("/chat"); // (Ou /home)
                    return;
                }

                // Garante que os nomes não sejam 'undefined' (causa erro 400)
                const meuNome = `${user.nome || ''} ${user.sobrenome || ''}`.trim() || 'Usuário';
                const outroNome = recipientData.recipientName || 'Usuário';

                try {
                    // Cria o documento principal do chat
                    await setDoc(chatDocRef, {
                        users: [user.uid, recipientData.recipientId],
                        userNames: {
                            [user.uid]: meuNome,
                            [recipientData.recipientId]: outroNome
                        },
                        lastMessage: "Inicie a conversa!",
                        lastMessageAt: serverTimestamp() // Padronizado
                    });
                    
                    // Define as informações para a tela
                    setChatInfo({
                        name: outroNome,
                        id: recipientData.recipientId
                    });

                } catch (error) {
                    console.error("Erro ao CRIAR o chat: ", error);
                    toast.error("Não foi possível criar o chat.");
                    navigate("/chat");
                }
            }
        }

        loadAndCreateChat();

    }, [chatId, user, location.state, navigate]);


    // Efeito para "ouvir" as mensagens
    // SÓ RODA DEPOIS QUE O 'chatInfo' ESTIVER PRONTO
    useEffect(() => {
        // Se o chatInfo não carregou, não faça nada
        if (!chatInfo) return; 

        // Agora é seguro ouvir as mensagens
        const messagesRef = collection(db, "chats", chatId, "messages");
        // Padronizado para 'createdAt'
        const q = query(messagesRef, orderBy("createdAt", "asc")); 

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = [];
            querySnapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() });
            });
            setMessages(msgs);
            setLoading(false); // Para o loading AQUI
        }, (error) => {
            console.error("Erro ao buscar mensagens: ", error);
            toast.error("Erro ao carregar mensagens.");
            setLoading(false);
        });

        return () => unsubscribe();

    }, [chatId, chatInfo]); // Depende do chatInfo

    // Efeito de auto-scroll (continua igual)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    // Função para enviar mensagem (CORRIGIDA)
    async function handleSendMessage(e) {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const messagesRef = collection(db, "chats", chatId, "messages");
        
        try {
            // 1. Adiciona a nova mensagem
            await addDoc(messagesRef, {
                text: newMessage,
                senderId: user.uid,
                createdAt: serverTimestamp() // Padronizado
            });

            // 2. ATUALIZA (updateDoc) o documento "pai"
            const chatDocRef = doc(db, "chats", chatId);
            await updateDoc(chatDocRef, { // <-- CORRIGIDO para updateDoc
                lastMessage: newMessage,
                lastSender: user.uid,
                lastMessageAt: serverTimestamp() // Padronizado
            });

        } catch (error) {
            console.error("Erro ao enviar mensagem: ", error);
            toast.error("Não foi possível enviar a mensagem.");
        }
        setNewMessage('');
    }

    // Se o loading principal (o da criação) ainda está rodando
    if (loading && !chatInfo) { 
        return <div className="loading-container">Carregando Chat...</div>;
    }

    return (
        <div className="chat-page-container">
            <div className="chat-header">
                {/* Use /chat (lista) ou -1 (voltar) */}
                <button onClick={() => navigate("/chat")} className="btn-voltar">Voltar</button>
                <h2>{chatInfo ? chatInfo.name : '...'}</h2>
            </div>

            <div className="message-list">
                {/* Mostra um loading secundário SÓ para as mensagens */}
                {loading && messages.length === 0 && <div className="loading-chat">Carregando...</div>}
                
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