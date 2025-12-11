import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../contexts/auth';
import { db } from '../../services/FirebaseConnection';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { FiMessageSquare } from 'react-icons/fi';
import './chatdropdown.css'; 
import avatarPadrao from '../../assets/avatar.png'; 

// A CONSTANTE DEVE FICAR AQUI, NO TOPO
const DEFAULT_AVATAR = avatarPadrao;

export default function ChatDropdown() {
    const { user } = useContext(AuthContext);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Efeito para buscar os chats
    useEffect(() => {
        if (!user) return;

        const chatsRef = collection(db, "chats");
        const q = query(chatsRef,
            where("users", "array-contains", user.uid),
            orderBy("lastMessageAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const listaChats = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const otherUserId = data.users.find(id => id !== user.uid);

                const otherUserAvatar = data.userAvatars ? data.userAvatars[otherUserId] : null;

                listaChats.push({
                    id: doc.id,
                    otherUserName: data.userNames[otherUserId],
                    lastMessage: data.lastMessage,
                    otherUserAvatar: otherUserAvatar || DEFAULT_AVATAR,
                    otherUserId: otherUserId,
                    lastMessageAt: data.lastMessageAt, // Adicionado para formatação
                });
            });
            setChats(listaChats);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Efeito para fechar o dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsChatOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <div className="chat-menu-container" ref={dropdownRef}>
            {/* 1. O Ícone de Chat (Gatilho) */}
            <button className="nav-icon-btn" onClick={() => setIsChatOpen(!isChatOpen)} title="Conversas">
                <FiMessageSquare size={22} color="#FFF" />
                {/* <span className="notification-badge">3</span> */}
            </button>

            {/* 2. O Menu Dropdown */}
            <div className={`chat-dropdown-menu ${isChatOpen ? 'open' : ''}`}>
                <div className="chat-dropdown-header">
                    <strong>Minhas Conversas</strong>
                </div>

                <div className="chat-dropdown-list">
                    {loading && <div className="chat-dropdown-message">Carregando...</div>}
                    
                    {!loading && chats.length === 0 && (
                        <div className="chat-dropdown-message">Nenhuma conversa.</div>
                    )}

                    {!loading && chats.map(chat => (
                        <Link 
                            to={`/chat/${chat.id}`} // Rota para a página de chat
                            key={chat.id} 
                            className="chat-dropdown-item"
                            onClick={() => setIsChatOpen(false)} // Fecha ao clicar
                            state={{ // Passa os dados para a página de chat
                                recipientId: chat.otherUserId,
                                recipientName: chat.otherUserName
                            }}
                        >
                            <img 
                                src={chat.otherUserAvatar} 
                                alt="avatar" 
                                className="chat-dropdown-avatar"
                                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
                            />
                            <div className="chat-dropdown-info">
                                <strong>{chat.otherUserName}</strong>
                                <small>{chat.lastMessage}</small>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}