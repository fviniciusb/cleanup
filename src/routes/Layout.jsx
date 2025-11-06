import { Outlet } from 'react-router-dom';
import Header from '../components/Header'; // Nossa Navbar azul
import './layout.css'; // O CSS que já corrigimos

export default function Layout() {
  return (
    <div className="app-layout"> 

      {/* 1. Renderiza a nova Navbar (barra azul) no topo */}
      <Header /> 

      {/* 2. O conteúdo principal da página */}
      <main className="main-content">
        <div className="page-content-area">
          {/* O React Router renderiza a página (Home, Perfil) aqui */}
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}