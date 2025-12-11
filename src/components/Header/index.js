import { useContext, useState, useEffect, useRef } from 'react';
import avatarImg from '../../assets/avatar.png';
import { NavLink, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { FiUser, FiSettings, FiLogOut, FiHome, FiMenu, FiX, FiBell, FiMessageSquare } from 'react-icons/fi'; 
import { toast } from 'react-toastify';
import './header.css';

import ChatDropdown from '../ChatDropdown'; 

const navLinks = [
  { to: "/home", icon: <FiHome color="#FFF" size={24} />, text: "Home" },
  { to: "/agendamentos", icon: <FiUser color="#FFF" size={24} />, text: "Agendamentos" },
];

const userMenuLinks = [
  { to: "/perfil", text: "Meu Perfil" },
  { to: "/agendamentos", text: "Meus Agendamentos" },
  { to: "/chat", text: "Minhas Conversas" },
];

export default function Header() { 
    const { user, logout } = useContext(AuthContext);
    
    // CORREÇÃO 1: Adicionado o estado para controlar o Modal de Logout
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsDropdownOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [dropdownRef]);

    const closeMobileMenu = () => setIsMobileMenuOpen(false);
    const handleDropdownLinkClick = () => setIsDropdownOpen(false);

    const handleNotifications = () => {
      toast.info("Nenhuma notificação nova.");
    }

    const handleConfirmLogout = () => {
        logout(); 
        closeMobileMenu(); 
        setShowLogoutModal(false);
    }

    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    }

    return (
        <nav className="navbar"> 
            <div className="nav-container">
                
                <Link to="/home" className="nav-brand">
                    CleanUp
                </Link>

                {/* --- MENU MOBILE --- */}
                <div className={`nav-menu-mobile ${isMobileMenuOpen ? 'open' : ''}`}>
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
                    
                    <NavLink to="/chat" onClick={closeMobileMenu}>
                      <FiMessageSquare color="#FFF" size={24} />
                      <span>Chat</span>
                    </NavLink>
                    
                    <NavLink to="/perfil" onClick={closeMobileMenu}>
                      <FiSettings color="#FFF" size={24} />
                      <span>Meu Perfil</span>
                    </NavLink>

                    {/* CORREÇÃO 2: Botão abre o modal ao invés de deslogar direto */}
                    <button className="logout-btn" onClick={() => {
                        closeMobileMenu();
                        setShowLogoutModal(true);
                    }}>
                        <FiLogOut color="#FFF" size={24} />
                        <span>Sair</span>
                    </button>
                </div>

                {/* --- MENU DESKTOP --- */}
                <div className="nav-menu-desktop">
                    {navLinks.map((link) => (
                      <NavLink to={link.to} key={link.to}>
                        {link.icon}
                        <span>{link.text}</span>
                      </NavLink>
                    ))}

                    <ChatDropdown />

                    <button className="nav-icon-btn" onClick={handleNotifications} title="Notificações">
                      <FiBell size={22} color="#FFF" />
                    </button>

                    <div className="user-menu-container" ref={dropdownRef}>
                        <button className="nav-avatar-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)} aria-haspopup="true" aria-expanded={isDropdownOpen}>
                          <img 
                              src={user?.avatarUrl || avatarImg}
                              alt="Foto do usuário" 
                              className="nav-avatar-desktop"
                          />
                        </button>
                        
                        <div className={`user-dropdown-menu ${isDropdownOpen ? 'open' : ''}`}>
                            <div className="dropdown-user-info">
                              <strong>{user?.nome} {user?.sobrenome}</strong>
                              <small>{user?.email}</small>
                            </div>
                            
                            {userMenuLinks.map((link) => (
                              <NavLink to={link.to} key={link.to} onClick={handleDropdownLinkClick}>
                                {link.text}
                              </NavLink>
                            ))}
                            
                            {/* CORREÇÃO 3: Botão desktop agora abre o modal */}
                            <button onClick={() => {
                              setIsDropdownOpen(false);
                              setShowLogoutModal(true);
                            }}>Sair</button>
                        </div>
                    </div>
                </div>

                <button className="nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <FiX size={28} color="#FFF" /> : <FiMenu size={28} color="#FFF" />}
                </button>
            </div>

            {/* CORREÇÃO 4: Fechamento correto do JSX do Modal */}
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
                                className="btn-confirmar-perigo"
                                onClick={handleConfirmLogout}
                            >
                                Sim, Sair
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}