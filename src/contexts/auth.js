import { useState, createContext, useEffect } from 'react';
import { auth, db } from '../services/FirebaseConnection';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail, // Import já presente, ótimo!
  GoogleAuthProvider, 
  signInWithPopup      
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

  // --- FUNÇÃO AJUSTADA ---
  // Agora retorna 'true' para sucesso e 'false' para erro.
  async function signIn(email, senha) {
    setLoadingAuth(true);

    try {
      const value = await signInWithEmailAndPassword(auth, email, senha);
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
      return true; // 👈 SUCESSO

    } catch (error) {
      console.error("ERRO AO LOGAR:", error);
      toast.error('E-mail ou senha incorretos.');
      setLoadingAuth(false);
      return false; // 👈 FALHA
    }
  }

  // Função de cadastro (permanece a mesma)
  async function signUp(nome, sobrenome, email, senha, objetivo) {
    setLoadingAuth(true);

    try {
      const value = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = value.user.uid;

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
      };
      
      await setDoc(doc(db, 'usuarios', uid), userData);

      const localData = {
        uid: uid,
        ...userData
      };

      setUser(localData);
      storageUser(localData);
      toast.success('Cadastro realizado com sucesso!');
      navigate('/perfil');

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
  
  // Login/Cadastro com Google (permanece o mesmo)
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
          cpf: '',
          telefone: '',
          dataNascimento: '',
          genero: '',
        };
        
        await setDoc(docRef, newUserData);
        data = { uid, ...newUserData };
      
      } else {
        data = {
          uid: uid,
          email: googleUser.email,
          ...docSnap.data()
        };
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

  // --- NOVA FUNÇÃO ---
  // Envia o e-mail de redefinição de senha
  async function sendPasswordReset(email) {
    setLoadingAuth(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Link de redefinição enviado! Verifique sua caixa de entrada e spam.");
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
        loadingAuth,
        loading,
        storageUser,
        setUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;