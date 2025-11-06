import { useState, useContext } from 'react';
import './signin.css';

import logo from '../../assets/logo-feia.png';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { toast } from 'react-toastify';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // --- 1. ADICIONADO O ESTADO DE ERRO ---
  const [loginError, setLoginError] = useState(false); 

  const { signIn, loadingAuth, signUpWithGoogle } = useContext(AuthContext);

  // --- 2. FUNÇÃO handleSignIn ATUALIZADA ---
  async function handleSignIn(e) {
    e.preventDefault();
    
    setLoginError(false); // Reseta o erro a cada nova tentativa

    if (email !== '' && password !== '') {
      // O 'signIn' no seu auth.js já retorna true/false
      const success = await signIn(email, password); 
      
      if (!success) {
        setLoginError(true); // Ativa o erro se o login falhar
      }
    } else {
      toast.info('Preencha todos os campos.');
    }
  }

  async function handleGoogleSignIn() {
    await signUpWithGoogle();
  }

  return (
    <div className="container-center">
      <div className="login">
        <div className="login-area">
          <img src={logo} alt="Logo do sistema" />
        </div>

        <form onSubmit={handleSignIn}>
          <h1>Bem-vindo (a)</h1>
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

        {/* --- 3. BOTÃO DO GOOGLE (Seu código original) --- */}
        <button
          className="gsi-material-button"
          onClick={handleGoogleSignIn}
          type="button"
          disabled={loadingAuth}
        >
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper">
            <div className="gsi-material-button-icon">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{ display: 'block' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents">Entrar com Google</span>
            <span style={{ display: 'none' }}>Entrar com Google</span>
          </div>
        </button>

        {/* Link para /cadastrar (Já estava correto) */}
        <Link to="/cadastrar">Não possui uma conta? <span className='cadastre-se'>Cadastre-se</span></Link>
        
        {/* --- 4. LINK DE RECUPERAÇÃO CONDICIONAL --- */}
        {/* Agora só aparece se o login falhar */}
        {loginError && (
          <Link to="/recuperar-senha" className="forgot-password-link">
            Esqueceu sua senha?
          </Link>
        )}

      </div>
    </div>
  )
}