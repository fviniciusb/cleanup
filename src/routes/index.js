// Em: src/routes/index.js

import { Routes, Route } from 'react-router-dom';

import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import Home from '../pages/Home';
import Agendamento from '../pages/Agendamento';
import Private from './Private';
import Profile from '../pages/Profile';
import ForgotPassword from '../pages/ForgotPassword';
import ChatList from '../pages/ChatList';
import ChatRoom from '../pages/ChatRoom';

// 1. Importe os ícones que você vai usar nos títulos
import { FiHome, FiUser, FiSettings } from 'react-icons/fi';

function RoutesApp() {
    return (
        <Routes>
            {/* --- Rotas Públicas (sem layout) --- */}
            <Route path="/" element={<SignIn />} />
            <Route path="/faxinei" element={<SignIn />} />
            <Route path="/cadastrar" element={<SignUp />} /> {/* Corrigi para SignUp */}
            <Route path="/recuperar-senha" element={<ForgotPassword />} />
            <Route path="/chat" element={<Private><ChatList /></Private>} />
            <Route path="/chat/:id" element={<Private><ChatRoom/></Private>} />
            {/* --- Rotas Privadas (com layout) --- */}
            <Route
                path="/home"
                element={
                    <Private title="Home" icon={<FiHome size={25} />}>
                        <Home />
                    </Private>
                }
            />

            <Route
                path="/perfil"
                element={
                    <Private title="Meu Perfil" icon={<FiSettings size={25} />}>
                        <Profile />
                    </Private>
                }
            />

            <Route
                path="/agendamentos"
                element={
                    <Private title="Agendamentos" icon={<FiUser size={25} />}>
                        <Agendamento />
                    </Private>
                }
            />

            <Route path="*" element={<h1>Página não encontrada.</h1>} />
        </Routes>
    );
}

export default RoutesApp;