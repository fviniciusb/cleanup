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

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    }

    return (
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

                    <button className="logout-btn" onClick={() => {
                        logout();
                        closeMobileMenu();
                    }}>
                        <FiLogOut color="#FFF" size={24} />
                        <span>Sair</span>
                    </button>
                </div>

                <button className="nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <FiX size={28} color="#FFF" /> : <FiMenu size={28} color="#FFF" />}
                </button>

            </div>
        </nav>
    );
}