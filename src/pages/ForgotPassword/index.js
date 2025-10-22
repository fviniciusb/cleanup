import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { toast } from 'react-toastify';
import logo from '../../assets/logo-feia.png';
// Reutilize o mesmo CSS da página de login
import '../SignIn/signin.css'; 

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const { sendPasswordReset, loadingAuth } = useContext(AuthContext);

  async function handleRequestReset(e) {
    e.preventDefault();

    if (email === '') {
      toast.info("Por favor, informe seu e-mail.");
      return;
    }

    await sendPasswordReset(email);
    setEmail(''); // Limpa o campo após o envio
  }

  return (
    <div className="container-center">
      <div className="login">
        <div className="login-area">
          <img src={logo} alt="Logo do sistema" />
        </div>

        <form onSubmit={handleRequestReset}>
          <h1>Recuperar Senha</h1>
          <p className="subtitle">Insira o e-mail da sua conta para receber o link de redefinição.</p>

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

        <Link to="/">
          Lembrou a senha? <span className='cadastre-se'>Faça login</span>
        </Link>
      </div>
    </div>
  );
}