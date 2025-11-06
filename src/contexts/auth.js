import { useState, createContext, useEffect } from 'react';
import { auth, db } from '../services/FirebaseConnection';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider, 
  signInWithPopup,   
  sendEmailVerification 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const AuthContext = createContext({});

function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      const storageUser = localStorage.getItem('@sistema');
      if (storageUser) {
        setUser(JSON.parse(storageUser));
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  // --- FUNÇÃO 'signIn' ATUALIZADA ---
  async function signIn(email, senha) {
    setLoadingAuth(true);
    try {
      const value = await signInWithEmailAndPassword(auth, email, senha);

      // --- 1. LÓGICA DE VERIFICAÇÃO ADICIONADA ---
      // Verifica se o e-mail do usuário foi verificado
      if (!value.user.emailVerified) {
        toast.error("Sua conta ainda não foi ativada. Por favor, verifique o link no seu e-mail.");
        await signOut(auth); // Desloga o usuário
        setLoadingAuth(false);
        return false; // Retorna falha (para o <Link> "Esqueceu a senha?" aparecer)
      }
      // --- FIM DA VERIFICAÇÃO ---

      const uid = value.user.uid;
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      const data = {
        uid: uid,
        email: value.user.email,
        ...docSnap.data()
      };

      setUser(data);
      storageUser(data);
      toast.success('Bem-vindo(a) de volta!');
      navigate('/perfil');
      setLoadingAuth(false);
      return true; // Sucesso

    } catch (error) {
      console.error("ERRO AO LOGAR:", error);
      toast.error('E-mail ou senha incorretos.');
      setLoadingAuth(false);
      return false; // Falha
    }
  }

  // --- FUNÇÃO 'signUp' ATUALIZADA (O seu código já estava 99% correto) ---
  async function signUp(nome, sobrenome, email, senha, objetivo) {
    setLoadingAuth(true);
    try {
      const value = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = value.user.uid;

      // Envia o e-mail de verificação (como você já tinha feito)
      await sendEmailVerification(value.user);

      const userData = {
        nome: nome,
        sobrenome: sobrenome,
        objetivo: objetivo,
        email: email,
        avatarUrl: null,
        cpf: '',
        telefone: '',
        dataNascimento: '',
        genero: '',
        emailVerified: false // Salva o status de verificação no Firestore
      };
      
      await setDoc(doc(db, 'usuarios', uid), userData);
      
      // Envia o usuário para a tela de login para esperar a verificação
      toast.success('Cadastro realizado! Por favor, verifique sua caixa de entrada para ativar sua conta.');
      navigate('/');
    
    } catch (error) {
      console.error("ERRO AO CADASTRAR:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Este e-mail já está em uso.');
      } else {
        toast.error('Ocorreu um erro ao cadastrar.');
      }
    } finally {
      setLoadingAuth(false);
    }
  }
  
  // --- FUNÇÃO 'signUpWithGoogle' ATUALIZADA ---
  async function signUpWithGoogle(objetivo = "1") {
    setLoadingAuth(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      const uid = googleUser.uid;
      const docRef = doc(db, "usuarios", uid);
      const docSnap = await getDoc(docRef);
      let data;

      if (!docSnap.exists()) {
        const nomeCompleto = googleUser.displayName.split(' ');
        const nome = nomeCompleto[0];
        const sobrenome = nomeCompleto.slice(1).join(' ');
        const newUserData = {
          nome: nome,
          sobrenome: sobrenome,
          objetivo: objetivo,
          email: googleUser.email,
          avatarUrl: googleUser.photoURL,
          emailVerified: true, // 👈 O GOOGLE JÁ VERIFICOU O E-MAIL
          cpf: '',
          telefone: '',
          dataNascimento: '',
          genero: '',
        };
        await setDoc(docRef, newUserData);
        data = { uid, ...newUserData };
      } else {
        data = { uid: uid, email: googleUser.email, ...docSnap.data() };
      }

      setUser(data);
      storageUser(data);
      toast.success(`Bem-vindo(a), ${data.nome}!`);
      navigate('/perfil');
    } catch (error) {
      console.error("ERRO COM O LOGIN DO GOOGLE: ", error);
      toast.error("Ocorreu um erro ao tentar login com Google.");
    } finally {
      setLoadingAuth(false);
    }
  }

  // --- O RESTO DAS SUAS FUNÇÕES (JÁ ESTAVAM CORRETAS) ---
  async function sendPasswordReset(email) {
    setLoadingAuth(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Link de redefinição enviado! Verifique sua caixa de entrada.");
    } catch (error) {
      console.error("ERRO AO ENVIAR E-MAIL DE RESET:", error);
      if (error.code === 'auth/user-not-found') {
        toast.error("Nenhuma conta encontrada com este e-mail.");
      } else {
        toast.error("Ocorreu um erro. Tente novamente.");
      }
    } finally {
      setLoadingAuth(false);
    }
  }

  function storageUser(data) {
    localStorage.setItem('@sistema', JSON.stringify(data));
  }

  async function logout() {
    await signOut(auth);
    localStorage.removeItem('@sistema');
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        signIn,
        signUp,
        signUpWithGoogle,
        sendPasswordReset,
        logout,
        loadingAuth,
        loading,
        storageUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;