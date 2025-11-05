import { useContext } from 'react';
import { AuthContext } from '../contexts/auth';
import { Navigate } from 'react-router-dom';

import Header from '../components/Header'; // A NOVA navbar azul
import './layout.css'; // O CSS que acabamos de corrigir

export default function Private({ children }) {
  const { signed, loading } = useContext(AuthContext);

  // REMOVEMOS os estados [isSidebarOpen] e a função 'toggleSidebar'

  if (loading) {
    return <div>Carregando...</div>; 
  }

  if (!signed) {
    return <Navigate to="/" />;
  }

  // Renderiza o layout simplificado
  return (
    // A classe 'open' não é mais necessária
    <div className="app-layout"> 
      
      <Header /> {/* A navbar azul */}

      <main className="main-content">
        {/* O PageHeader e Title foram movidos para DENTRO de {children} */}
        <div className="page-content-area">
          {children}
        </div>
      </main>
    </div>
  );
}