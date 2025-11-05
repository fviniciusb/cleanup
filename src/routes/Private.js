// Em: src/routes/Private.js

import { useContext } from 'react';
import { AuthContext } from '../contexts/auth';
import { Navigate } from 'react-router-dom';

// 1. REMOVEMOS O PageHeader e o Title dos imports
import Header from '../components/Header'; // Sua Navbar azul
import './layout.css';

// 2. REMOVEMOS as props 'title' e 'icon'
export default function Private({ children }) {
  const { signed, loading } = useContext(AuthContext);

  // 3. REMOVEMOS o estado 'isSidebarOpen' e a função 'toggleSidebar'
  // O novo Header.jsx cuida disso sozinho

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!signed) {
    return <Navigate to="/" />;
  }

  // 4. SE ESTIVER LOGADO, RENDERIZA O LAYOUT CORRIGIDO
  return (
    // A classe 'open' não é mais necessária aqui
    <div className="app-layout">

      {/* Renderiza a Navbar azul */}
      <Header />

      {/* O Conteúdo Principal */}
      <div className="main-content">

        {/* 5. REMOVEMOS O <PageHeader> E O <Title> DAQUI */}

        {/* O conteúdo da página (Home, Perfil, etc) */}
        <div className="page-content-area">
          {children}
        </div>
      </div>
    </div>
  );
}