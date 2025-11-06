import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiPhone, FiMail, FiMenu, FiX } from 'react-icons/fi';
import './landing.css';

const carouselSlides = [
  { image: 'https://images.unsplash.com/photo-1596424222201-6c183b9c03b1?q=80&w=2070&auto=format&fit=crop', title: 'Limpeza Residencial Completa', description: 'Deixe sua casa brilhando com nossos profissionais de confiança.' },
  { image: 'https://images.unsplash.com/photo-1621905251918-4841a19f39ad?q=80&w=1932&auto=format&fit=crop', title: 'Limpeza Para Seu Negócio', description: 'Escritórios, lojas e consultórios limpos para receber seus clientes.' },
  { image: 'https://images.unsplash.com/photo-1626733981881-acb2b938002a?q=80&w=2070&auto=format&fit=crop', title: 'Cuidados com Roupas', description: 'Profissionais que também cuidam de lavar e passar suas roupas.' }
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const servicosRef = useRef(null);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide(prevSlide => 
        prevSlide === carouselSlides.length - 1 ? 0 : prevSlide + 1
      );
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  const nextSlide = () => setCurrentSlide(currentSlide === carouselSlides.length - 1 ? 0 : currentSlide + 1);
  const prevSlide = () => setCurrentSlide(currentSlide === 0 ? carouselSlides.length - 1 : currentSlide + 1);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      }, 
      { threshold: 0.1 }
    );
    const currentRef = servicosRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div className="landing-container">
      <header className="landing-header">
        <nav className="landing-nav">
          <div className="landing-logo">CleanUp</div>
          <div className="landing-nav-links-desktop">
            <a href="#servicos">Serviços</a>
            <Link to="/sobre">Sobre Nós</Link>
            <a href="#contato">Contato</a>
            <Link to="/login" className="btn-login">Entrar</Link>
          </div>
          <button className="landing-nav-toggle" onClick={() => setIsMobileMenuOpen(true)}>
            <FiMenu size={28} />
          </button>
        </nav>
      </header>

      <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <button className="mobile-nav-close" onClick={() => setIsMobileMenuOpen(false)}>
          <FiX size={30} />
        </button>
        <a href="#servicos" onClick={() => setIsMobileMenuOpen(false)}>Serviços</a>
        <Link to="/sobre" onClick={() => setIsMobileMenuOpen(false)}>Sobre Nós</Link>
        <a href="#contato" onClick={() => setIsMobileMenuOpen(false)}>Contato</a>
        <Link to="/login" className="btn-login" onClick={() => setIsMobileMenuOpen(false)}>
          Entrar
        </Link>
      </div>

      <section className="hero-section">
        <div className="hero-content">
          <h1>A faxina que você precisa, com a confiança que você merece.</h1>
          <p>Conectamos você aos melhores profissionais de limpeza da sua região.</p>
          <Link to="/cadastrar" className="btn-cta">Encontre um profissional agora</Link>
        </div>
      </section>

      <section id="servicos" className="carousel-section fade-in-section" ref={servicosRef}>
        <h2>Nossos Serviços</h2>
        <div className="carousel">
          <button onClick={prevSlide} className="carousel-btn prev"><FiChevronLeft size={30} /></button>
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