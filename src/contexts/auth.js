import React, { useState, createContext, useEffect } from 'react';
// 1. Importe rtdb e funções do Realtime Database
import { auth, db, rtdb } from '../services/FirebaseConnection'; 
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    sendPasswordResetEmail,
    GoogleAuthProvider, 
    signInWithPopup       
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
// 2. Importe funções específicas do RTDB
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database'; 
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const AuthContext = createContext({});

function AuthProvider({ children }) {
    const [user, setUser] = useState(null); 
    const [loadingAuth, setLoadingAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    // Carrega usuário do localStorage (sem alterações)
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

    // --- 3. useEffect PARA GERENCIAR A PRESENÇA ONLINE/OFFLINE ---
    useEffect(() => {
        // Se não há usuário logado, ou se o usuário ainda não tem UID, sai
        if (!user || !user.uid) {
             console.log("AuthProvider Presence: Usuário não logado, limpando status.");
             // (Opcional) Limpar status anterior se houver
             // Talvez não necessário se o logout já limpa
            return;
        }

        console.log("AuthProvider Presence: Configurando status para usuário", user.uid);

        // Referência para o nó de status do usuário no RTDB (ex: /status/USER_ID_123)
        const userStatusDatabaseRef = ref(rtdb, `/status/${user.uid}`);

        // Objeto que será salvo no RTDB quando online
        const isOnlineForDatabase = {
            isOnline: true,
            lastSeen: serverTimestamp(), // Timestamp do servidor Firebase
        };

        // Objeto que será salvo no RTDB quando desconectar
        const isOfflineForDatabase = {
            isOnline: false,
            lastSeen: serverTimestamp(),
        };

        // Referência especial '.info/connected' que monitora o estado da conexão
        const connectedRef = ref(rtdb, '.info/connected');

        // Listener que reage às mudanças de conexão
        const unsubscribeConnected = onValue(connectedRef, (snapshot) => {
            // Se o valor for 'false', o Firebase já está desconectado.
            // O 'onDisconnect' que configuramos abaixo vai cuidar disso.
            if (snapshot.val() === false) {
                console.log("AuthProvider Presence: Firebase detectou desconexão.");
                return;
            }

            // --- ESTAMOS CONECTADOS ---
            console.log("AuthProvider Presence: Conectado. Configurando onDisconnect...");
            
            // Configura o 'onDisconnect': QUANDO a conexão CAIR,
            // execute esta operação de escrita (marcar como offline).
            onDisconnect(userStatusDatabaseRef)
                .set(isOfflineForDatabase)
                .then(() => {
                    // SÓ DEPOIS que o onDisconnect estiver pronto,
                    // marcamos o status atual como ONLINE.
                    console.log("AuthProvider Presence: onDisconnect configurado. Marcando como Online.");
                    set(userStatusDatabaseRef, isOnlineForDatabase);
                })
                .catch((error) => {
                     console.error("AuthProvider Presence: Erro ao configurar onDisconnect:", error);
                });
        });

        // --- FUNÇÃO DE LIMPEZA ---
        // Será chamada quando o 'user' mudar (logout) ou o componente desmontar
        return () => {
            console.log("AuthProvider Presence: Limpando listener e status para", user?.uid);
            unsubscribeConnected(); // Remove o listener de conexão

            // (Opcional, mas recomendado) Define como offline imediatamente ao deslogar/desmontar
            // para evitar um pequeno delay até o onDisconnect agir.
            if (user && user.uid) { // Verifica novamente se user ainda existe
                const manualOfflineRef = ref(rtdb, `/status/${user.uid}`);
                set(manualOfflineRef, isOfflineForDatabase)
                  .catch(err => console.error("AuthProvider Presence: Erro ao setar offline manualmente:", err));
            }
            // Cancela qualquer operação onDisconnect pendente para este ref
            onDisconnect(userStatusDatabaseRef).cancel(); 
        };

    }, [user]); // Roda sempre que o objeto 'user' mudar


    // --- SUAS FUNÇÕES EXISTENTES ---
    // (signIn, signUp, signUpWithGoogle, sendPasswordReset, storageUser)
    // Nenhuma alteração necessária na lógica interna delas.
    
    async function signIn(email, senha) {
    setLoadingAuth(true);
    try {
      const value = await signInWithEmailAndPassword(auth, email, senha);
      const uid = value.user.uid;
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      const data = { uid: uid, email: value.user.email, ...docSnap.data() };
      setUser(data);
      storageUser(data);
      toast.success('Bem-vindo(a) de volta!');
      navigate('/home'); // Navega para home após login
      return true; 
    } catch (error) {
      console.error("ERRO AO LOGAR:", error);
      toast.error('E-mail ou senha incorretos.');
      return false; 
    } finally {
      setLoadingAuth(false);
    }
  }

  async function signUp(nome, sobrenome, email, senha, objetivo) {
    // ... (código signUp sem alterações) ...
     setLoadingAuth(true);
    try {
      const value = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = value.user.uid;
      const userData = { nome, sobrenome, objetivo, email, avatarUrl: null, cpf: '', telefone: '', dataNascimento: '', genero: '' };
      await setDoc(doc(db, 'usuarios', uid), userData);
      const localData = { uid: uid, ...userData };
      setUser(localData);
      storageUser(localData);
      toast.success('Cadastro realizado com sucesso!');
      navigate('/perfil'); // Navega para perfil após cadastro
    } catch (error) {
      console.error("ERRO AO CADASTRAR:", error);
      if (error.code === 'auth/email-already-in-use') { toast.error('Este e-mail já está em uso.'); } 
      else { toast.error('Ocorreu um erro ao cadastrar.'); }
    } finally { setLoadingAuth(false); }
  }
  
  async function signUpWithGoogle(objetivo = "1") {
    // ... (código signUpWithGoogle sem alterações) ...
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
        const newUserData = { nome, sobrenome, objetivo, email: googleUser.email, avatarUrl: googleUser.photoURL, cpf: '', telefone: '', dataNascimento: '', genero: '' };
        await setDoc(docRef, newUserData);
        data = { uid, ...newUserData };
      } else {
        data = { uid: uid, email: googleUser.email, ...docSnap.data() };
      }
      setUser(data);
      storageUser(data);
      toast.success(`Bem-vindo(a), ${data.nome}!`);
      navigate('/perfil'); // Navega para perfil após login Google
    } catch (error) {
      console.error("ERRO COM O LOGIN DO GOOGLE: ", error);
      toast.error("Ocorreu um erro ao tentar login com Google.");
    } finally { setLoadingAuth(false); }
  }

  async function sendPasswordReset(email) {
    // ... (código sendPasswordReset sem alterações) ...
    setLoadingAuth(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Link enviado! Verifique sua caixa de entrada e spam.");
    } catch (error) {
      console.error("ERRO AO ENVIAR E-MAIL DE RESET:", error);
      if (error.code === 'auth/user-not-found') { toast.error("Nenhuma conta encontrada."); } 
      else { toast.error("Ocorreu um erro. Tente novamente."); }
    } finally { setLoadingAuth(false); }
  }

  function storageUser(data) {
    localStorage.setItem('@sistema', JSON.stringify(data));
  }

  async function logout() {
    await signOut(auth);
    localStorage.removeItem('@sistema');
    // Limpar o estado do usuário ACIONARÁ a função de limpeza do useEffect de presença
    setUser(null); 
    // (Opcional) Redirecionar para login após logout
    // navigate('/'); 
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