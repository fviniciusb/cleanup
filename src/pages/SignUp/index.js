import { useState, useContext } from 'react';
import '../SignIn/signin.css';

import logo from '../../assets/logo-feia.png';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { toast } from 'react-toastify';

// 1. IMPORTS ADICIONADOS PARA A VERIFICAÇÃO DE E-MAIL
import { db } from '../../services/FirebaseConnection';
import { collection, query, where, getDocs } from 'firebase/firestore';


export default function SignUp() {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [objetivo, setObjetivo] = useState('');

  const { signUp, loadingAuth, signUpWithGoogle } = useContext(AuthContext);

  // 2. FUNÇÃO ATUALIZADA COM A PRÉ-VERIFICAÇÃO
  async function handleEmailSignUp(e) {
    e.preventDefault();

    // Validações de formulário (iguais)
    if (nome === '' || sobrenome === '' || email === '' || senha === '' || objetivo === '') {
      toast.info('Preencha todos os campos.');
      return;
    }
    if (senha !== confirmarSenha) {
      toast.error('As senhas não correspondem.');
      return;
    }
    if (senha.length < 8) {
      toast.info('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    // --- VERIFICAÇÃO DE E-MAIL EXISTENTE (RE-ADICIONADA) ---
    try {
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error("Este e-mail já está em uso. Por favor, faça login.");
        return; // Para o cadastro
      }
      
      // Se o e-mail estiver livre, chama o signUp do contexto
      await signUp(nome, sobrenome, email, senha, objetivo);

    } catch (error) {
      console.error("Erro no processo de cadastro:", error);
      toast.error("Ocorreu um erro ao verificar o e-mail.");
    }
    // --- FIM DA VERIFICAÇÃO ---
  }

  // Função para cadastro com o Google (igual)
  async function handleGoogleSignUp() {
    if (objetivo === '') {
      toast.info('Por favor, selecione seu objetivo (Cliente ou Prestador) antes de continuar.');
      return;
    }
    await signUpWithGoogle(objetivo);
  }

  return (
    <div className="container-center">
      <div className="login">
        <div className="login-area">
          <img src={logo} alt="Logo do sistema de chamados" />
        </div>

        <form onSubmit={handleEmailSignUp}>
          <h1>Cadastre-se</h1>

          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            type="text"
            placeholder="Sobrenome"
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)}
          />

          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Senha (mín. 8 caracteres)"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirme sua senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />

          {/* --- 3. MELHORIA VISUAL: <select> trocado por botões de rádio --- */}
          {/* (Isto agora vai combinar com o seu 'signin.css') */}
          <div className="select-profile">
            <input 
              type="radio" 
              id="cliente" 
              name="objetivo" 
              value="1"
              checked={objetivo === "1"}
              onChange={(e) => setObjetivo(e.target.value)}
            />
            <label className="radio-label" htmlFor="cliente">
              Sou Cliente
            </label>

            <input 
              type="radio" 
              id="prestador" 
              name="objetivo" 
              value="2" 
              checked={objetivo === "2"}
              onChange={(e) => setObjetivo(e.target.value)}
            />
            <label className="radio-label" htmlFor="prestador">
              Sou Prestador
            </label>
          </div>

          <button type="submit" className='botaoLogin' disabled={loadingAuth}>
            {loadingAuth ? 'Carregando...' : 'Cadastrar-se'}
          </button>
        </form>

        <div className='divisor'>
          <span>OU</span>
        </div>

        {/* Botão do Google (igual) */}
        <button
          className="gsi-material-button"
          onClick={handleGoogleSignUp}
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
            <span className="gsi-material-button-contents">Registrar com Google</span>
            <span style={{ display: 'none' }}>Entrar com Google</span>
          </div>
        </button>

        {/* --- 4. CORREÇÃO DO LINK --- */}
        <Link to="/login">Já possui uma conta? <span className="cadastre-se">Faça login</span></Link>
      </div>
    </div>
  );
}