import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { toast } from 'react-toastify';

// 1. IMPORTA O MESMO CSS DO LOGIN/CADASTRO
import '../SignIn/signin.css'; 
import logo from '../../assets/logo-feia.png'; 

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  // 2. PEGA A FUNÇÃO 'sendPasswordReset' DO SEU CONTEXTO
  const { sendPasswordReset, loadingAuth } = useContext(AuthContext);

  async function handleRequestReset(e) {
    e.preventDefault();
    if (email === '') {
      toast.info("Por favor, informe seu e-mail.");
      return;
    }
    // A função no seu auth.js já lida com o toast e o loading
    await sendPasswordReset(email); 
    setEmail(''); // Limpa o campo
  }

  return (
    // 3. USA A MESMA ESTRUTURA HTML DO SIGNIN
    <div className="container-center">
      <div className="login">
        
        <div className="login-area">
          <img src={logo} alt="Logo do sistema" />
        </div>

        <form onSubmit={handleRequestReset}>
          <h1>Recuperar Senha</h1>
          
          {/* Adicionei este parágrafo para instrução */}
          <p style={{textAlign: 'center', marginBottom: '1rem', color: '#555', fontSize: '14px'}}>
            Insira o e-mail da sua conta para receber o link de redefinição.
          </p>

          <input 
            type="email" 
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit" className='botaoLogin' disabled={loadingAuth}>
            {loadingAuth ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>

        {/* 4. LINK DE VOLTAR APONTA PARA A ROTA CORRETA (/login) */}
        <Link to="/login">
          Lembrou a senha? <span className='cadastre-se'>Faça login</span>
        </Link>
        
      </div>
    </div>
  );
}