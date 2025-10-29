// src/pages/ChatRoom/index.js
import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
// --- ADIÇÃO: Importa rtdb ---
import { db, rtdb } from '../../services/FirebaseConnection';
import {
    doc, getDoc, collection, query,
    orderBy, onSnapshot, addDoc,
    serverTimestamp, updateDoc, setDoc
} from 'firebase/firestore';
// --- ADIÇÃO: Importa funções do RTDB ---
import { ref, onValue } from 'firebase/database';
import { FiSend } from 'react-icons/fi';
import './chatroom.css';
import { toast } from 'react-toastify';
import debounce from 'lodash.debounce';

const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

// --- ADIÇÃO: Função auxiliar para formatar "Visto por último" ---
function formatLastSeen(timestamp) {
    if (!timestamp) return 'Offline'; // Se não houver timestamp, assume offline
    const now = new Date();
    const lastSeenDate = new Date(timestamp);
    const diffSeconds = Math.round((now - lastSeenDate) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return 'Online agora'; // Considera online se visto nos últimos 60s
    if (diffMinutes < 60) return `Visto há ${diffMinutes} min`;
    if (diffHours < 24) return `Visto há ${diffHours} h`;
    if (diffDays === 1) return 'Visto ontem';
    // Mostra data completa para mais de 1 dia
    return `Visto em ${lastSeenDate.toLocaleDateString('pt-BR')}`;
}


export default function ChatRoom() {
    const { id: chatId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [chatInfo, setChatInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    // --- ADIÇÃO: State para status Online/Offline ---
    const [otherUserStatus, setOtherUserStatus] = useState({ isOnline: false, lastSeen: null });

    const messagesEndRef = useRef(null);
    // const typingTimeoutRef = useRef(null);

    // Efeito para carregar/criar info do chat (lógica existente)
    useEffect(() => {
        if (!user) return;
        async function loadAndCreateChat() { /* ... (código loadAndCreateChat sem alterações) ... */
             setLoading(true);
            const chatDocRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatDocRef);
            if (chatSnap.exists()) {
                const chatData = chatSnap.data();
                if (!chatData || !chatData.users) { toast.error("Chat corrompido..."); navigate("/chat"); return; }
                if (!chatData.users.includes(user.uid)) { toast.error("Acesso negado."); navigate("/chat"); return; }
                const otherUserId = chatData.users.find(id => id !== user.uid);
                const myAvatar = chatData.userAvatars?.[user.uid] || DEFAULT_AVATAR;
                const otherAvatar = chatData.userAvatars?.[otherUserId] || DEFAULT_AVATAR;
                setChatInfo({ name: chatData.userNames[otherUserId] || 'Usuário', id: otherUserId, myAvatar, otherAvatar });
            } else {
                const recipientData = location.state;
                if (!recipientData || !recipientData.recipientId) { toast.error("Erro. Inicie pela tela de agendamentos."); navigate("/chat"); return; }
                const meuNome = `${user.nome || ''} ${user.sobrenome || ''}`.trim() || 'Usuário';
                const outroNome = recipientData.recipientName || 'Usuário';
                const meuAvatar = user.avatarUrl || DEFAULT_AVATAR;
                const outroAvatar = DEFAULT_AVATAR; // Buscar avatar seria ideal aqui
                try {
                    await setDoc(chatDocRef, { users: [user.uid, recipientData.recipientId], userNames: { [user.uid]: meuNome, [recipientData.recipientId]: outroNome }, userAvatars: { [user.uid]: meuAvatar, [recipientData.recipientId]: outroAvatar }, lastMessage: "Inicie a conversa!", lastMessageAt: serverTimestamp(), typingIn: null }, { merge: true });
                    setChatInfo({ name: outroNome, id: recipientData.recipientId,
                     myAvatar: meuAvatar, otherAvatar: outroAvatar });
                } catch (error) { console.error("ERRO AO CRIAR CHAT:", error); navigate("/chat"); }
            }
        }
        loadAndCreateChat();
    }, [chatId, user, location.state, navigate]);

    // Efeito para ouvir o DOCUMENTO DO CHAT (Digitando...) (lógica existente)
    useEffect(() => {
        if (!user || !chatId) return;
        const chatDocRef = doc(db, "chats", chatId);
        const unsubscribeChatDoc = onSnapshot(chatDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const chatData = docSnap.data();
                const typingUserId = chatData.typingIn;
                setOtherUserTyping(typingUserId && typingUserId !== user.uid);
            }
        }, (error) => { console.error("Erro ao ouvir doc chat:", error); });
        return () => unsubscribeChatDoc();
    }, [chatId, user]);

    // --- ADIÇÃO: useEffect para OUVIR STATUS DO RTDB ---
    useEffect(() => {
        // Só começa a ouvir DEPOIS que temos as infos do chat (chatInfo)
        // e o ID do outro usuário (chatInfo.id)
        if (!chatInfo || !chatInfo.id) return;

        const otherUserId = chatInfo.id;
        // Referência para o nó de status do OUTRO usuário no RTDB
        const userStatusRef = ref(rtdb, `/status/${otherUserId}`);

        console.log(`ChatRoom: Ouvindo status de ${otherUserId}`);

        // Ouve mudanças no nó de status
        const unsubscribeStatus = onValue(userStatusRef, (snapshot) => {
            const statusData = snapshot.val();
            if (statusData) {
                console.log(`ChatRoom: Status recebido para ${otherUserId}:`, statusData);
                setOtherUserStatus({
                    isOnline: statusData.isOnline,
                    lastSeen: statusData.lastSeen // Guarda o timestamp
                });
            } else {
                // Se não houver dados, assume offline sem timestamp
                console.log(`ChatRoom: Sem status no RTDB para ${otherUserId}, assumindo offline.`);
                setOtherUserStatus({ isOnline: false, lastSeen: null });
            }
        }, (error) => {
            console.error(`ChatRoom: Erro ao ouvir status de ${otherUserId}:`, error);
             // Mesmo com erro, seta como offline para evitar estado inconsistente
             setOtherUserStatus({ isOnline: false, lastSeen: null });
        });

        // Limpa o listener ao sair ou quando chatInfo mudar
        return () => {
            console.log(`ChatRoom: Parando de ouvir status de ${otherUserId}`);
            unsubscribeStatus();
        }

    }, [chatInfo]); // Depende do chatInfo (principalmente chatInfo.id)


    // Efeito para carregar MENSAGENS (lógica existente)
    useEffect(() => {
        if (!chatInfo) return;
        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => { /* ... setMessages ... setLoading(false) ... */
             const listaMensagens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(listaMensagens);
            setLoading(false);
        }, (error) => { /* ... erro ... setLoading(false) ... */
             console.error("Erro ao buscar mensagens (snapshot):", error);
            toast.error("Erro ao carregar mensagens.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, [chatId, chatInfo]);

    // Efeito de auto-scroll (lógica existente)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Funções de controle de digitação (lógica existente)
    const updateTypingStatus = useCallback(async (isTyping) => { /* ... */
        if (!user || !chatId) return;
        const chatDocRef = doc(db, "chats", chatId);
        try { await updateDoc(chatDocRef, { typingIn: isTyping ? user.uid : null }); }
        catch (error) { console.error("Erro updateTypingStatus:", error); }
    }, [user, chatId]);
    const debouncedUpdateTyping = useCallback(debounce(() => { updateTypingStatus(false); }, 1500), [updateTypingStatus]);
    const handleInputChange = (e) => { /* ... */
        const text = e.target.value; setNewMessage(text);
        if (text.trim() !== '') { updateTypingStatus(true); debouncedUpdateTyping(); }
        else { debouncedUpdateTyping.cancel(); updateTypingStatus(false); }
    };

    // Função de enviar mensagem (lógica existente)
    const handleSendMessage = async (e) => { /* ... */
        e.preventDefault(); if (newMessage.trim() === "") return;
        debouncedUpdateTyping.cancel(); updateTypingStatus(false);
        const messagesRef = collection(db, "chats", chatId, "messages");
        try {
            await addDoc(messagesRef, { text: newMessage, senderId: user.uid, createdAt: serverTimestamp() });
            const chatRef = doc(db, "chats", chatId);
            await updateDoc(chatRef, { lastMessage: newMessage, lastMessageAt: serverTimestamp() });
            setNewMessage("");
        } catch (error) { toast.error("Erro ao enviar mensagem."); }
    };


    // --- RENDERIZAÇÃO ---
    if (loading && !chatInfo) {
        return <div className="loading-container">Carregando Chat...</div>;
    }

    return (
        <div className="chat-page-container">
            <header className="chat-header">
                <button className="btn-voltar" onClick={() => navigate("/chat")}>Voltar</button>
                <div className="header-info">
                    <h2>{chatInfo ? chatInfo.name : '...'}</h2>
                    {/* --- ADIÇÃO: Exibe Status Online/Offline OU Digitanto --- */}
                    {otherUserTyping ? (
                        <span className="typing-indicator">Digitando...</span>
                    ) : (
                        <span className={`status-indicator ${otherUserStatus.isOnline ? 'online' : 'offline'}`}>
                            {/* Usa a função formatLastSeen para exibir */}
                            {otherUserStatus.isOnline ? 'Online' : formatLastSeen(otherUserStatus.lastSeen)}
                        </span>
                    )}
                </div>
                 {/* Espaço vazio para centralizar o nome corretamente */}
                 <div style={{ width: '60px', flexShrink: 0 }}></div> 
            </header>

            {/* Lista de Mensagens */}
            <div className="message-list">
                 {/* Loading secundário */}
                {loading && messages.length === 0 && <div className="loading-chat">Carregando...</div>}
                
                {messages.map((msg) => {
                    const isSent = msg.senderId === user.uid;
                    const avatarToShow = isSent ? chatInfo?.myAvatar : chatInfo?.otherAvatar; 
                    return ( /* ... JSX da mensagem com avatar ... */ 
                         <div key={msg.id} className={`message-container ${isSent ? 'sent-container' : 'received-container'}`}>
                            {!isSent && ( <img src={avatarToShow || DEFAULT_AVATAR} alt="Avatar" className="message-avatar" /> )}
                            <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}> <p>{msg.text}</p> </div>
                            {isSent && ( <img src={avatarToShow || DEFAULT_AVATAR} alt="Avatar" className="message-avatar" /> )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Formulário */}
            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={handleInputChange} 
                />
                <button type="submit"><FiSend size={20} /></button>
            </form>
        </div>
    );
}