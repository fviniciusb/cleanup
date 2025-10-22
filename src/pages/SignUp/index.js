import { useState, useContext } from 'react';

import logo from '../../assets/logo-feia.png';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { toast } from 'react-toastify';

//Adicionados imports do Firestore para a verificação do e-mail
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../services/FirebaseConnection'; 

export default function SignUp() {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [objetivo, setObjetivo] = useState('');

  const { signUp, loadingAuth, signUpWithGoogle } = useContext(AuthContext);

  async function handleEmailSignUp(e) {
    e.preventDefault();
  
    // 1. Validação dos campos do formulário
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
  
    // --- VERIFICAR SE O E-MAIL JÁ EXISTE ---
    try {
      const usuariosRef = collection(db, 'usuarios');
      // Cria uma query que busca na coleção 'usuarios' onde o campo 'email' é igual ao e-mail digitado
      const q = query(usuariosRef, where("email", "==", email));
      
      const querySnapshot = await getDocs(q);

      // Se 'querySnapshot.empty' for 'false', significa que encontrou pelo menos um documento
      if (!querySnapshot.empty) {
        toast.error("Este e-mail já está em uso. Faça login ou tente recuperar sua senha.");
        return; // Impede a continuação do cadastro
      }

    } catch (error) {
      console.error("Erro ao verificar e-mail no Firestore:", error);
      toast.error("Não foi possível verificar o e-mail. Tente novamente.");
      return; // Impede o cadastro se a verificação falhar
    }
    

    // 3. Se passou por todas as validações, chama a função de cadastro do contexto
    await signUp(nome, sobrenome, email, senha, objetivo);
  }

  // Função para cadastro com o Google 
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

          <select 
            className='select-profile'
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
          >
            <option value="" hidden>Selecione seu objetivo</option>
            <option value="1">Cliente</option>
            <option value="2">Prestador</option>
          </select>

          <button type="submit" className='botaoLogin' disabled={loadingAuth}>
            {loadingAuth ? 'Carregando...' : 'Cadastrar-se'}
          </button>
        </form>

        <div className='divisor'>
          <span>OU</span>
        </div>

        <button onClick={handleGoogleSignUp} className="google-btn" disabled={loadingAuth}>
           Cadastrar com Google
        </button>

        <Link to="/">Já possui uma conta? <span className="cadastre-se">Faça login</span></Link>
      </div>
    </div>
  );
}