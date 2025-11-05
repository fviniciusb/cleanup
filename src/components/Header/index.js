import { useContext, useState, useEffect, useRef } from 'react';
import avatarImg from '../../assets/avatar.png';
import { NavLink, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
// 1. Importado o FiMessageSquare (ícone de chat)
import { FiUser, FiSettings, FiLogOut, FiHome, FiMenu, FiX, FiBell, FiMessageSquare } from 'react-icons/fi'; 
import { toast } from 'react-toastify';
import './header.css';

// 2. IMPORTAR O NOVO COMPONENTE DE CHAT
// (Aponta para a pasta /index.js)
import ChatDropdown from '../ChatDropdown'; 

// Links principais da navegação
const navLinks = [
  { to: "/home", icon: <FiHome color="#FFF" size={24} />, text: "Home" },
  { to: "/agendamentos", icon: <FiUser color="#FFF" size={24} />, text: "Agendamentos" },
];

// 3. ADICIONADO "CHAT" AOS LINKS DO MENU DO USUÁRIO
const userMenuLinks = [
  { to: "/perfil", text: "Meu Perfil" },
  { to: "/agendamentos", text: "Meus Agendamentos" },
  { to: "/chat", text: "Minhas Conversas" }, // 👈 Adicionado
];

export default function Header() { 
    const { user, logout } = useContext(AuthContext);
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Efeito para fechar o dropdown (lógica existente)
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
                    
                    {/* Links principais */}
                    {navLinks.map((link) => (
                      <NavLink to={link.to} key={link.to} onClick={closeMobileMenu}>
                        {link.icon}
                        <span>{link.text}</span>
                      </NavLink>
                    ))}
                    
                    {/* 4. ADICIONADO LINK DE CHAT NO MOBILE */}
                    <NavLink to="/chat" onClick={closeMobileMenu}>
                      <FiMessageSquare color="#FFF" size={24} />
                      <span>Chat</span>
                    </NavLink>
                    
                    {/* Link de Perfil */}
                    <NavLink to="/perfil" onClick={closeMobileMenu}>
                      <FiSettings color="#FFF" size={24} />
                      <span>Meu Perfil</span>
                    </NavLink>

                    <button className="logout-btn" onClick={() => {
                        logout();
                        closeMobileMenu();
                    }}>
                        <FiLogOut color="#FFF" size={24} />
                        <span>Sair</span>
                    </button>
                </div>

                {/* --- MENU DESKTOP --- */}
                <div className="nav-menu-desktop">
                    {/* Links principais */}
                    {navLinks.map((link) => (
                      <NavLink to={link.to} key={link.to}>
                        {link.icon}
                        <span>{link.text}</span>
                      </NavLink>
                    ))}

                    {/* 5. ADICIONADO O COMPONENTE <ChatDropdown /> */}
                    <ChatDropdown />

                    {/* Botão de Notificação */}
                    <button className="nav-icon-btn" onClick={handleNotifications} title="Notificações">
                      <FiBell size={22} color="#FFF" />
                    </button>

                    {/* Área do Menu Dropdown do Perfil */}
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
                            
                            {/* 6. Mapeia os links do menu (que agora inclui "Chat") */}
                            {userMenuLinks.map((link) => (
                              <NavLink to={link.to} key={link.to} onClick={handleDropdownLinkClick}>
                                {link.text}
                              </NavLink>
                            ))}
                            <button onClick={() => {
                              logout();
                              setIsDropdownOpen(false);
                            }}>Sair</button>
                        </div>
                    </div>
                </div>

                {/* Botão Hambúrguer */}
                <button className="nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <FiX size={28} color="#FFF" /> : <FiMenu size={28} color="#FFF" />}
                </button>
                
            </div>
        </nav>
    );
}