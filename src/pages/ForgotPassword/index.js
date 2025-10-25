import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { toast } from 'react-toastify';
import logo from '../../assets/logo-feia.png';
import '../SignIn/signin.css'; 

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const { sendPasswordReset, loadingAuth } = useContext(AuthContext);

  const navigate = useNavigate();

  async function handleRequestReset(e) {
    e.preventDefault();

    if (email === '') {
      toast.info("Por favor, informe seu e-mail.");
      return;
    }

    try {
        // 1. Tenta enviar o email (o context cuida do 'loading')
        await sendPasswordReset(email);
        
        // 2. Se a linha acima NÃO deu erro, foi um sucesso.
        //    Mostra o "papo" (o toast).

        // 3. Inicia o timer para redirecionar o usuário
        setTimeout(() => {
            navigate('/'); // Redireciona para a página de login
        }, 3000); // 3000ms = 3 segundos de espera

    } catch(error) {
        // 4. Se o 'await' falhar, o context (provavelmente) já
        //    mostrou um toast de erro. Apenas logamos no console.
        console.error("Erro ao tentar enviar o email:", error);
        // O 'loadingAuth' será resetado pelo seu context.
    }

    // (Remova o setEmail('') daqui, pois vamos redirecionar)
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