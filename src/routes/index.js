// Em: src/routes/index.js

import { Routes, Route } from 'react-router-dom';

import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import ForgotPassword from '../pages/ForgotPassword'; // Adicionei esta
import Home from '../pages/Home';
import Agendamento from '../pages/Agendamento';
import Private from './Private';
import Profile from '../pages/Profile';

// REMOVEMOS os imports dos ícones daqui

function RoutesApp() {
    return (
        <Routes>
            {/* --- Rotas Públicas (sem layout) --- */}
            <Route path="/" element={<SignIn />} />
            <Route path="/cadastrar" element={<SignUp />} />
            <Route path="/recuperar-senha" element={<ForgotPassword />} />

            {/* --- Rotas Privadas (com layout) --- */}
            {/* Agora elas estão muito mais limpas */}
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

            <Route path="*" element={<h1>Página não encontrada.</h1>} />
        </Routes>
    );
}

export default RoutesApp;