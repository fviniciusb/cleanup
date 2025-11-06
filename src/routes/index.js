import { Routes, Route } from 'react-router-dom';

// Componentes de Página
import LandingPage from '../pages/LandingPage';
import AboutPage from '../pages/AboutPage';
import ChatList from '../pages/ChatList';
import ChatRoom from '../pages/ChatRoom';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import ForgotPassword from '../pages/ForgotPassword';
import Home from '../pages/Home';
import Agendamento from '../pages/Agendamento';
import Profile from '../pages/Profile';

// Componente de Rota
import Private from './Private'; // O único componente de rota que precisamos

// 1. REMOVEMOS o import do 'Layout' que não existe

function RoutesApp() {
    return (
        <Routes>
            {/* --- ROTAS PÚBLICAS --- */}
            <Route path="/" element={<LandingPage />} /> 
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="/login" element={<SignIn />} /> 
            <Route path="/cadastrar" element={<SignUp />} />
            <Route path="/recuperar-senha" element={<ForgotPassword />} />

            
            {/* --- 2. ROTAS PRIVADAS (Corrigidas) --- */}
            {/* Envolvemos cada rota com o <Private>
                porque o seu Private.js renderiza {children}
            */}
            <Route
                path="/home"
                element={ <Private> <Home /> </Private> }
            />
            <Route
                path="/perfil"
                element={ <Private> <Profile /> </Private> }
            />
            <Route
                path="/agendamentos"
                element={ <Private> <Agendamento /> </Private> }
            />
            <Route
                path="/chat"
                element={ <Private> <ChatList /> </Private> }
            />
            <Route
                path="/chat/:chatId"
                element={ <Private> <ChatRoom /> </Private> }
            />

            {/* Rota 404 */}
            <Route path="*" element={<LandingPage />} /> 
        </Routes>
    );
}

export default RoutesApp;