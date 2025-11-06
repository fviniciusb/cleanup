import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/auth';
import { db } from '../../services/FirebaseConnection';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './chatlist.css';

import avatarPadrao from '../../assets/avatar.png';

export default function ChatList() {
    const { user } = useContext(AuthContext);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // 1. A query busca todos os 'chats' onde o 'users' (array)
        //    contenha o ID do usuário logado.
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef,
            where("users", "array-contains", user.uid),
            orderBy("lastMessageAt", "desc") // Ordena pelos mais recentes
        );

        // 2. onSnapshot ouve em tempo real
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const listaChats = [];
            snapshot.forEach((doc) => {

                const data = doc.data();
                // Encontra o ID do "outro" usuário
                const otherUserId = data.users.find(id => id !== user.uid);

                listaChats.push({
                    id: doc.id,
                    otherUserName: data.userNames[otherUserId],
                    lastMessage: data.lastMessage,
                    // (Opcional) Pegue o avatar da outra pessoa
                    // otherUserAvatar: data.userAvatars[otherUserId] 
                });
            });
            setChats(listaChats);
            setLoading(false);
        });

        // 3. Limpa o listener ao sair da tela
        return () => unsubscribe();

    }, [user]);

    if (loading) {
        // Usa a classe CSS para loading
        return <div className="loading-container">Carregando conversas...</div>;
    }

    return (
        // Container principal da página
        <div className="chatlist-container">
            <h1 className="main-title">Minhas Conversas</h1>

            {chats.length === 0 ? (
                // Container para mensagem de vazio
                <div className="empty-container">
                    <p>Você ainda não tem conversas.</p>
                    <p>Inicie uma pela tela de Agendamentos.</p>
                </div>
            ) : (
                // Lista UL
                <ul className="chat-list">
                    {chats.map(chat => (
                        // Item LI
                        <li key={chat.id} className="chat-item">
                            {/* Link A */}
                            <Link
                                to={`/chat/${chat.id}`} // CORRIGIDO: usa /chat/ em vez de /chatpage/
                                state={{
                                    recipientId: chat.otherUserId,
                                    recipientName: chat.otherUserName
                                }}
                            >
                                {/* Container do Avatar */}
                                <div className="chat-avatar-container">
                                    <img
                                        src={chat.otherUserAvatar || DEFAULT_AVATAR}
                                        alt="Avatar"
                                        className="chat-avatar"
                                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
                                    />
                                </div>
                                {/* Container de Infos */}
                                <div className="chat-info">
                                    <h3>{chat.otherUserName}</h3>
                                    <p>{chat.lastMessage}</p>
                                </div>
                                {/* Timestamp */}
                                <span className="chat-timestamp">
                                    {/* Formata a hora se lastMessageAt existir */}
                                    {chat.lastMessageAt?.toDate()
                                        ? chat.lastMessageAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                        : ''}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
const DEFAULT_AVATAR = avatarPadrao;