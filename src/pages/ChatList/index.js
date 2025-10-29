import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/auth';
import { db } from '../../services/FirebaseConnection';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './chatlist.css';
// (Opcional) importe seu avatar padrão
// import avatarPadrao from '../../assets/avatar.png'; 

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
        return <div className="loading-container">Carregando conversas...</div>
    }

    return (
        <div className="chatlist-container">
            <h1 className="main-title">Minhas Conversas</h1>
            
            {chats.length === 0 ? (
                <div className="empty-container">
                    <p>Você ainda não tem conversas.</p>
                </div>
            ) : (
                <ul className="chat-list">
                    {chats.map(chat => (
                        <li key={chat.id} className="chat-item">
                            <Link to={`/chat/${chat.id}`}>
                                {/* <img src={chat.otherUserAvatar || avatarPadrao} alt="avatar" /> */}
                                <div className="chat-info">
                                    <h3>{chat.otherUserName}</h3>
                                    <p>{chat.lastMessage}</p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}