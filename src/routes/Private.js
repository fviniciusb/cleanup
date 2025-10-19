// Em: src/routes/Private.js

import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/auth';
import { Navigate } from 'react-router-dom';

// 1. IMPORTE OS COMPONENTES DE LAYOUT
import Header from '../components/Header';       // Sua Sidebar (Header.js)
import PageHeader from '../components/PageHeader'; // A barra do topo (nova)
import Title from '../components/Title';         // Seu componente de Título
        
// 2. IMPORTE O CSS DO LAYOUT
import './layout.css'; 

// 3. Receba { children, title, icon } como props
export default function Private({ children, title, icon }) {
  const { signed, loading } = useContext(AuthContext);

  // 4. O ESTADO DE 'ABRIR/FECHAR' VIVE AQUI
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) {
    // É bom ter um loading aqui
    return <div>Carregando...</div>; 
  }

  if (!signed) {
    return <Navigate to="/" />; // Redireciona para o login
  }

  // 5. SE ESTIVER LOGADO, RENDERIZA O LAYOUT COMPLETO
  return (
    <div className={`app-layout ${isSidebarOpen ? 'open' : ''}`}>
      
      {/* Sua Sidebar (components/Header) */}
      <Header isOpen={isSidebarOpen} />

      {/* O Conteúdo Principal */}
      <div className="main-content">
        
        {/* A Barra do Topo (PageHeader) */}
        <PageHeader toggleSidebar={toggleSidebar}>
            <Title nome={title}>
                {icon}
            </Title>
        </PageHeader>
        
        {/* O conteúdo da página (Home, Perfil, etc) */}
        <div className="page-content-area">
          {children}
        </div>
      </div>
    </div>
  );
}