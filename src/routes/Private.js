import { useContext } from 'react';
import { AuthContext } from '../contexts/auth';
import { Navigate } from 'react-router-dom';

import Header from '../components/Header'; // A NOVA navbar azul
import './layout.css'; // O CSS que já corrigimos (com padding-top)

export default function Private({ children }) {
  const { signed, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Carregando...</div>; 
  }

  if (!signed) {
    // --- CORREÇÃO AQUI ---
    // Se não estiver logado, redireciona para a NOVA página de login.
    return <Navigate to="/login" />; 
  }

  // Renderiza o layout simplificado
  return (
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