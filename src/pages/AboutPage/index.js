import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMenu, FiX, FiCheckCircle, FiHeart, FiShield } from 'react-icons/fi';
import { useState } from 'react';

// 1. Importa o CSS da LandingPage (para o header/footer)
import '../LandingPage'; 
// 2. Importa o CSS próprio da página Sobre
import './about.css';

export default function AboutPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="about-container">
      
      {/* --- 1. Header (Reutilizado da LandingPage) --- */}
      <header className="landing-header">
        <nav className="landing-nav">
          <div className="landing-logo">CleanUp</div>
          
          <div className="landing-nav-links-desktop">
            <Link to="/">Início</Link>
            <a href="#contato">Contato</a>
            <Link to="/login" className="btn-login">Entrar</Link>
          </div>

          <button className="landing-nav-toggle" onClick={() => setIsMobileMenuOpen(true)}>
            <FiMenu size={28} />
          </button>
        </nav>
      </header>

      {/* --- Menu Mobile (Reutilizado) --- */}
      <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <button className="mobile-nav-close" onClick={() => setIsMobileMenuOpen(false)}>
          <FiX size={30} />
        </button>
        <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Início</Link>
        <a href="#contato" onClick={() => setIsMobileMenuOpen(false)}>Contato</a>
        <Link to="/login" className="btn-login" onClick={() => setIsMobileMenuOpen(false)}>
          Entrar
        </Link>
      </div>

      {/* --- 2. Conteúdo Principal da Página "Sobre" --- */}
      <main className="about-main">
        <section className="about-hero">
          <h1>Sobre o CleanUp</h1>
          <p>Nossa missão é conectar você aos melhores profissionais de limpeza, com segurança e praticidade.</p>
        </section>

        <section className="about-content">
          <h2>O que é o CleanUp?</h2>
          <p>
            O CleanUp nasceu da necessidade de encontrar profissionais de limpeza de confiança de forma simples e rápida. Em vez de depender de indicações ou longas buscas, nossa plataforma centraliza os melhores prestadores de serviço da sua região, permitindo que você agende uma faxina com apenas alguns cliques.
          </p>
          
          <h3>Nossos Pilares</h3>
          <div className="pilares-grid">
            <div className="pilar-card">
              <FiShield size={40} color="#5EA1BD" />
              <h4>Segurança</h4>
              <p>Verificamos os profissionais para garantir que você possa agendar com total tranquilidade.</p>
            </div>
            <div className="pilar-card">
              <FiCheckCircle size={40} color="#5EA1BD" />
              <h4>Qualidade</h4>
              <p>Nosso sistema de avaliação garante que apenas os profissionais mais bem qualificados permaneçam na plataforma.</p>
            </div>
            <div className="pilar-card">
              <FiHeart size={40} color="#5EA1BD" />
              <h4>Praticidade</h4>
              <p>Encontre, agende e gerencie seus serviços de limpeza em um só lugar, direto do seu celular ou computador.</p>
            </div>
          </div>
        </section>
      </main>

      {/* --- 3. Footer (Reutilizado da LandingPage) --- */}
      <footer id="contato" className="footer-section">
        <div className="footer-content">
          <div className="footer-col">
            <h3>CleanUp</h3>
            <p>Conectando lares e profissionais.</p>
          </div>
          <div className="footer-col">
            <h3>Contato</h3>
            <p><FiMail /> contato@cleanup.com</p>
            <p><FiPhone /> (27) 99999-9999</p>
          </div>
          <div className="footer-col">
            <h3>Endereço</h3>
            <p>Rua Fictícia, 123 - Centro</p>
            <p>Vitória, ES - Brasil</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 CleanUp. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}