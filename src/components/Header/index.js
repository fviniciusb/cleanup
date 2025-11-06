// Em: src/components/Header/index.js

import { useContext, useState } from 'react'; // 1. ERRO DE DIGITAÇÃO CORRIGIDO AQUI
import avatarImg from '../../assets/avatar.png';
import { NavLink, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { FiUser, FiSettings, FiLogOut, FiHome, FiMenu, FiX } from 'react-icons/fi';
import './header.css';

const navLinks = [
    { to: "/home", icon: <FiHome color="#FFF" size={24} />, text: "Home" },
    { to: "/agendamentos", icon: <FiUser color="#FFF" size={24} />, text: "Agendamentos" },
    { to: "/perfil", icon: <FiSettings color="#FFF" size={24} />, text: "Perfil" },
];

export default function Header() {
    const { user, logout } = useContext(AuthContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // 2. ADICIONA O ESTADO PARA CONTROLAR O MODAL
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    }

    // 3. FUNÇÕES PARA CONTROLAR O MODAL DE LOGOUT
    const handleConfirmLogout = () => {
        logout(); // Desloga o usuário
        closeMobileMenu(); // Fecha o menu mobile (se estiver aberto)
        setShowLogoutModal(false); // Fecha o modal
    }

    const handleCancelLogout = () => {
        setShowLogoutModal(false); // Apenas fecha o modal
    }

    return (
        // 4. USA UM FRAGMENT <> PARA CONTER A NAVBAR E O MODAL
        <>
            <nav className="navbar">
                <div className="nav-container">

                    <Link to="/home" className="nav-brand">
                        CleanUp
                    </Link>

                    <div className={`nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>

                        <div className="nav-user-info-mobile">
                            <img
                                src={user?.avatarUrl || avatarImg}
                                alt="Foto do usuário"
                                className="nav-avatar"
                            />
                            <span>Olá, {user?.nome}</span>
                        </div>

                        {navLinks.map((link) => (
                            <NavLink to={link.to} key={link.to} onClick={closeMobileMenu}>
                                {link.icon}
                                <span>{link.text}</span>
                            </NavLink>
                        ))}

                        {/* 5. BOTÃO DE SAIR AGORA ABRE O MODAL */}
                        <button className="logout-btn" onClick={() => {
                            setShowLogoutModal(true); // Abre o modal
                            closeMobileMenu(); // Fecha o menu (se estiver no mobile)
                        }}>
                            <FiLogOut color="#FFF" size={24} />
                            <span>Sair</span>
                        </button>
                        _           </div>

                    <button className="nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <FiX size={28} color="#FFF" /> : <FiMenu size={28} color="#FFF" />}
                    </button>

                </div>
            </nav>

            {/* --- 6. JSX DO MODAL ADICIONADO AQUI --- */}
            {showLogoutModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Confirmar Saída</h2>
                        <p>Você tem certeza que deseja sair da sua conta?</p>

                        <div className="modal-actions">
                            <button
                                className="btn-cancelar"
                                onClick={handleCancelLogout}
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
        </>
    );
}