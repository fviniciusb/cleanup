// Em: src/components/Header/index.js

import { useContext } from 'react';
import avatarImg from '../../assets/avatar.png';
import { Link, useLocation } from 'react-router-dom';

import { AuthContext } from '../../contexts/auth';
import { FiUser, FiSettings, FiLogOut, FiHome } from 'react-icons/fi';
import './header.css'; // O CSS que vamos modificar

// 1. Receba a prop { isOpen }
export default function Header({ isOpen }) {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    // 2. Crie a classe dinâmica baseada na prop
    const sidebarClasses = `sidebar ${isOpen ? 'open' : ''}`;

    return (
        // 3. Aplique a classe dinâmica
        <div className={sidebarClasses}>
            <div>
                <img 
                    src={user.avatarUrl === null ? avatarImg : user.avatarUrl} 
                    alt="Foto do usuário" 
                    className="sidebar-avatar" // Adicione esta classe para o CSS
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

            <Link to="/" onClick={logout}>
                <FiLogOut color="#FFF" size={24} />
                <span>Sair</span>
            </Link>
        </div>
    );
}