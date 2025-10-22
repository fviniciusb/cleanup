import { useState, useContext } from 'react';
import './signin.css';

import logo from '../../assets/logo-feia.png';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { toast } from 'react-toastify';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 👇 Novo estado para controlar a exibição do link
  const [loginError, setLoginError] = useState(false); 

  const { signIn, loadingAuth, signUpWithGoogle } = useContext(AuthContext);

  async function handleLogin(e) {
    e.preventDefault();
    
    // Reseta o estado de erro a cada nova tentativa
    setLoginError(false); 

    if (email !== '' && password !== '') {
      // A função signIn agora precisa nos dizer se o login falhou
      const success = await signIn(email, password); 
      if (!success) {
        // Se o login falhou, ativamos o estado de erro
        setLoginError(true);
      }
    } else {
      toast.info('Preencha todos os campos.');
    }
  }

  async function handleGoogleLogin() {
    await signUpWithGoogle(); 
  }

  return (
    <div className="container-center">
      <div className="login">
        <div className="login-area">
          <img src={logo} alt="Logo do sistema de chamados" />
        </div>

        <form onSubmit={handleLogin}>
          <h1>Bem-vindo(a)</h1>
          <input 
            type="text" 
            placeholder="usuario@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className='botaoLogin' disabled={loadingAuth}>
            {loadingAuth ? 'Carregando...' : 'Entrar'}
          </button>
        </form>

        {/* --- NOVO CONTEÚDO --- */}
        {/* O link só aparece se 'loginError' for verdadeiro */}
        {loginError && (
          <Link to="/recuperar-senha" className="forgot-password-link">
            Esqueceu sua senha?
          </Link>
        )}
        {/* --- FIM DO NOVO CONTEÚDO --- */}

        <div className='divisor'>
          <span>OU</span>
        </div>
        <button onClick={handleGoogleLogin} className="google-btn" disabled={loadingAuth}>
           Entrar com Google
        </button>

        <Link to="/cadastrar">Não possui uma conta? <span className='cadastre-se'>Cadastre-se</span></Link>
      </div>
    </div>
  );
}