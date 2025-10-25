// Em: src/components/Header/index.js
import { useContext, useState } from 'react'; // 1. Importe o useState
import avatarImg from '../../assets/avatar.png';
import { Link, useLocation } from 'react-router-dom';

import { AuthContext } from '../../contexts/auth';
import { FiUser, FiSettings, FiLogOut, FiHome } from 'react-icons/fi';
import './header.css'; 

export default function Header({ isOpen }) {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    // 2. Adicione o estado para controlar o modal
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const sidebarClasses = `sidebar ${isOpen ? 'open' : ''}`;

    // 3. Crie a função que realmente faz o logout
    async function handleConfirmLogout() {
        await logout();
    }
    
    // 4. Crie a função para abrir o modal
    // Usamos 'e.preventDefault()' para impedir o <Link> de navegar para "/"
    function handleOpenModal(e) {
        e.preventDefault();
        setShowLogoutModal(true);
    }

    return (
        // O 'div' container principal precisa de um fragmento <> para o modal
        <>
            <div className={sidebarClasses}>
                <div>
                    <img 
                        src={user.avatarUrl === null ? avatarImg : user.avatarUrl} 
                        alt="Foto do usuário" 
                        className="sidebar-avatar"
                    />
                </div>

                <Link
                    to="/home"
                    className={location.pathname === '/home' ? 'active' : ''}
                >
                    <FiHome color="#FFF" size={24} />
                    <span>Home</span>
                </Link>

                <Link
                    to="/agendamentos"
                    className={location.pathname === '/agendamentos' ? 'active' : ''}
                >
                    <FiUser color="#FFF" size={24} />
                    <span>Agendamentos</span>
                </Link>

                <Link
                    to="/perfil"
                    className={location.pathname === '/perfil' ? 'active' : ''}
                >
                    <FiSettings color="#FFF" size={24} />
                    <span>Perfil</span>
                </Link>
                
                {/* 5. Mude o onClick para abrir o modal */}
                <Link to="/" onClick={handleOpenModal}>
                    <FiLogOut color="#FFF" size={24} />
                    <span>Sair</span>
                </Link>
            </div>

            {/* --- 6. ADICIONE O JSX DO MODAL --- */}
            {showLogoutModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Confirmar Saída</h2>
                        <p>Você tem certeza que deseja sair da sua conta?</p>
                        
                        <div className="modal-actions">
                            <button 
                                className="btn-cancelar" 
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn-confirmar-perigo" // Botão vermelho
                                onClick={handleConfirmLogout}
                            >
                                Sim, Sair
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- FIM DO MODAL --- */}
        </>
    );
}