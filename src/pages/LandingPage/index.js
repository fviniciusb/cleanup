import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../services/FirebaseConnection';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { FiChevronLeft, FiChevronRight, FiStar, FiPhone, FiMail } from 'react-icons/fi';
import avatarPadrao from '../../assets/avatar.png'; // Use seu avatar padrão

import './landing.css'; // Criaremos este CSS no próximo passo

// --- Configuração do Carrossel ---
const carouselSlides = [
  {
    image: 'https://placehold.co/1200x500/5EA1BD/FFF?text=Limpeza+Residencial',
    title: 'Limpeza Residencial Completa',
    description: 'Deixe sua casa brilhando com nossos profissionais de confiança.'
  },
  {
    image: 'https://placehold.co/1200x500/1A4A5F/FFF?text=Serviços+Comerciais',
    title: 'Limpeza Para Seu Negócio',
    description: 'Escritórios, lojas e consultórios limpos para receber seus clientes.'
  },
  {
    image: 'https://placehold.co/1200x500/395e6e/FFF?text=Passar+Roupas',
    title: 'Roupas Passadas',
    description: 'Profissionais que também cuidam das suas roupas.'
  }
];

export default function LandingPage() {
  const [topPrestadores, setTopPrestadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- Lógica do Carrossel ---
  const nextSlide = () => {
    setCurrentSlide(currentSlide === carouselSlides.length - 1 ? 0 : currentSlide + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(currentSlide === 0 ? carouselSlides.length - 1 : currentSlide - 1);
  };

  // --- Lógica para Buscar Top Prestadores ---
  useEffect(() => {
    async function fetchTopPrestadores() {
      try {
        const usuariosRef = collection(db, "usuarios");
        // Query: Busca usuários que são "Prestadores" (objetivo 2),
        // ordena pela maior nota (mediaAvaliacoes)
        // e limita aos 3 primeiros.
        const q = query(usuariosRef,
          where("objetivo", "==", "2"),
          orderBy("mediaAvaliacoes", "desc"),
          limit(3)
        );

        const querySnapshot = await getDocs(q);
        const lista = [];
        querySnapshot.forEach((doc) => {
          lista.push({ id: doc.id, ...doc.data() });
        });

        setTopPrestadores(lista);
      } catch (error) {
        console.error("Erro ao buscar top prestadores: ", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTopPrestadores();
  }, []);


  return (
    <div className="landing-container">
      
      {/* --- 1. Header (Barra de Navegação da Landing Page) --- */}
      <header className="landing-header">
        <nav className="landing-nav">
          <div className="landing-logo">CleanUp</div>
          <div className="landing-nav-links">
            <a href="#servicos">Serviços</a>
            <a href="#prestadores">Destaques</a>
            <a href="#contato">Contato</a>
            <Link to="/login" className="btn-login">Entrar</Link>
          </div>
        </nav>
      </header>

      {/* --- 2. Seção Hero (Principal) --- */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>A faxina que você precisa, com a confiança que você merece.</h1>
          <p>Conectamos você aos melhores profissionais de limpeza da sua região.</p>
          <Link to="/cadastrar" className="btn-cta">Encontre um profissional agora</Link>
        </div>
      </section>

      {/* --- 3. Seção Carrossel de Serviços --- */}
      <section id="servicos" className="carousel-section">
        <h2>Nossos Serviços</h2>
        <div className="carousel">
          <button onClick={prevSlide} className="carousel-btn prev"><FiChevronLeft size={30} /></button>
          
          {/* Slides */}
          <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {carouselSlides.map((slide, index) => (
              <div className="carousel-slide" key={index}>
                <img src={slide.image} alt={slide.title} />
                <div className="slide-caption">
                  <h3>{slide.title}</h3>
                  <p>{slide.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={nextSlide} className="carousel-btn next"><FiChevronRight size={30} /></button>
          
          {/* Bolinhas de navegação */}
          <div className="carousel-dots">
            {carouselSlides.map((_, index) => (
              <button 
                key={index}
                className={`dot ${currentSlide === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              ></button>
            ))}
          </div>
        </div>
      </section>

      {/* --- 4. Seção Top Prestadores --- */}
      <section id="prestadores" className="prestadores-section">
        <h2>Profissionais em Destaque</h2>
        <div className="prestadores-grid">
          {loading ? (
            <p>Carregando profissionais...</p>
          ) : (
            topPrestadores.map(prestador => (
              <div className="prestador-card" key={prestador.id}>
                <img 
                  src={prestador.avatarUrl || avatarPadrao} 
                  alt={prestador.nome} 
                  className="prestador-avatar"
                />
                <h3>{prestador.nome} {prestador.sobrenome}</h3>
                <div className="prestador-rating">
                  <FiStar color="#F5B50A" />
                  <strong>{prestador.mediaAvaliacoes ? prestador.mediaAvaliacoes.toFixed(1) : 'N/A'}</strong>
                  <span>({prestador.totalAvaliacoes || 0} avaliações)</span>
                </div>
                <p className="prestador-servicos">{prestador.servicos || "Serviços não informados."}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* --- 5. Seção Contato / Footer --- */}
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