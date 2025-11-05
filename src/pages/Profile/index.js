// Hooks do React
import { useContext, useState, useRef, useCallback } from "react";

// Ícones
import { FiUpload, FiSettings } from "react-icons/fi";

// Imagem Padrão
import avatar from '../../assets/avatar.png';

// Contexto de Autenticação
import { AuthContext } from "../../contexts/auth";

// Firebase (Firestore e Auth)
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../services/FirebaseConnection'; // Importa 'auth' e 'db' do mesmo lugar
import { sendPasswordResetEmail } from "firebase/auth";

// Outras Bibliotecas
import axios from 'axios'; // Para o upload no Cloudinary
import { toast } from 'react-toastify';
import InputMask from 'react-input-mask';

// Componentes de Layout
import PageHeader from '../../components/PageHeader';
import Title from '../../components/Title';

// CSS da Página
import './profile.css';

// --- FIM DOS IMPORTS ---
export default function Profile() {
    const { user, setUser, storageUser } = useContext(AuthContext);

    // Estado consolidado (limpo)
    const [formData, setFormData] = useState({
        nome: user?.nome || '',
        sobrenome: user?.sobrenome || '',
        cpf: user?.cpf || '',
        telefone: user?.telefone || '',
        dataNascimento: user?.dataNascimento || '',
        genero: user?.genero || '',
        cep: user?.cep || '',
        bairro: user?.bairro || '',
        endereco: user?.endereco || '',
        estado: user?.estado || '',
        sobreDomicilio: user?.sobreDomicilio || '',
        servicos: user?.servicos || '',
    });

    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl);
    const [imagemAvatar, setImagemAvatar] = useState(null);
    const [disponivel, setDisponivel] = useState(user?.disponivel || false);
    const [isSaving, setIsSaving] = useState(false);
    const [cep, setCep] = useState((user && user.cep) || "")

    const cpfRef = useRef(null);
    const telefoneRef = useRef(null);
    const cepRef = useRef(null);

    // Handler único para inputs (otimizado)
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    // Handler para a foto (otimizado)
    const mudarFoto = useCallback((e) => {
        if (e.target.files[0]) {
            const image = e.target.files[0];
            if (image.type === 'image/jpeg' || image.type === 'image/png') {
                setImagemAvatar(image);
                setAvatarUrl(URL.createObjectURL(image));
            } else {
                toast.error("Envie uma imagem do tipo PNG ou JPEG");
                setImagemAvatar(null);
            }
        }
    }, []);

    // Atualiza o Firestore (otimizado)
    const atualizarDados = useCallback(async (atualizacoes) => {
        const docRef = doc(db, "usuarios", user.uid);
        try {
            await updateDoc(docRef, atualizacoes);
            const updatedUser = { ...user, ...atualizacoes };
            setUser(updatedUser);
            storageUser(updatedUser);
            toast.success("Atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar dados:", error);
            toast.error("Erro ao atualizar dados.");
            throw error; // Propaga o erro para o 'finally'
        }
    }, [user, setUser, storageUser]);

    // --- 3. CORREÇÃO DO BUG DA FOTO (Usando Cloudinary) ---
    const uploadFoto = useCallback(async () => {
        // Cloudinary
        const CLOUD_NAME = "dy11aoczl";
        const UPLOAD_PRESET = "CleanUp";
        // ----------------------------------------

        if (!CLOUD_NAME || !UPLOAD_PRESET || CLOUD_NAME === "SEU_CLOUD_NAME_AQUI") {
            toast.error("Credenciais do Cloudinary não configuradas.");
            return null;
        }

        const formData = new FormData();
        formData.append("file", imagemAvatar);
        formData.append("upload_preset", UPLOAD_PRESET);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

        try {
            toast.info("Enviando nova imagem...");
            const response = await axios.post(cloudinaryUrl, formData);
            return response.data.secure_url; // Retorna a URL segura
        } catch (error) {
            console.error("Erro no upload (Cloudinary): ", error);
            toast.error("Erro ao enviar a imagem.");
            return null;
        }
    }, [imagemAvatar]);

    // Função principal de salvar (COM FEEDBACK DE "SALVANDO")
    const salvar = useCallback(async (e) => {
        e.preventDefault();

        if (!formData.cpf) {
            toast.error("Por favor, preencha seu CPF.");
            return;
        }

        setIsSaving(true); // 👈 Inicia o loading

        try {
            const atualizacoes = { ...formData };

            if (user.objetivo === "2") {
                atualizacoes.disponivel = disponivel;
            }

            if (imagemAvatar) {
                const novaAvatarUrl = await uploadFoto();
                if (novaAvatarUrl) {
                    atualizacoes.avatarUrl = novaAvatarUrl;
                } else {
                    throw new Error("Falha no upload da imagem."); // Para o salvamento
                }
            }
            await atualizarDados(atualizacoes);

        } catch (error) {
            // O toast de erro já é mostrado dentro das funções (atualizarDados/uploadFoto)
            console.error(error.message);
        } finally {
            setIsSaving(false); // 👈 Para o loading, mesmo se der erro
        }

    }, [formData, disponivel, imagemAvatar, user.objetivo, uploadFoto, atualizarDados]);

    // Alterna a disponibilidade (otimizado)
    const alternarDisponibilidade = useCallback(async () => {
        const novaDisponibilidade = !disponivel;
        setDisponivel(novaDisponibilidade);
        await atualizarDados({ disponivel: novaDisponibilidade });
    }, [disponivel, atualizarDados]);

    // Busca o CEP (otimizado)
    const handleCepBlur = useCallback(async () => {
        const cepLimpo = formData.cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) return;
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await response.json();
            if (data.erro) {
                toast.error("CEP não encontrado.");
                setFormData(prev => ({ ...prev, endereco: '', bairro: '', estado: '' }));
                return;
            }
            setFormData(prev => ({
                ...prev,
                endereco: data.logradouro,
                bairro: data.bairro,
                estado: data.uf
            }));
        } catch (error) {
            console.error("Erro ao buscar o CEP:", error);
            toast.error("Erro ao buscar o CEP. Tente novamente.");
        }
    }, [formData.cep]);


    // --- 4. NOVA FUNÇÃO PARA "ALTERAR SENHA" ---
    const handleChangePassword = useCallback(async () => {
        if (window.confirm("Você tem certeza que deseja alterar sua senha?\nUm e-mail de redefinição será enviado para você.")) {
            try {
                await sendPasswordResetEmail(auth, user.email);
                toast.success("E-mail de redefinição de senha enviado!");
            } catch (error) {
                console.error("Erro ao enviar e-mail de redefinição:", error);
                toast.error("Erro ao enviar e-mail. Tente novamente.");
            }
        }
    }, [user.email]);


    // --- 5. JSX CORRIGIDO E COMPLETO ---
    return (
        <div>
            {/* Cabeçalho da Página */}
            <PageHeader>
                <Title nome="Meu Perfil">
                    <FiSettings size={25} />
                </Title>
            </PageHeader>

            <div className="profile-container">

                {/* Coluna da Esquerda (Sidebar do Perfil) */}
                <div className="profile-sidebar">
                    <label className="label-avatar">
                        <span>
                            <FiUpload color="#FFF" size={25} />
                        </span>
                        <img src={avatarUrl || avatar} alt="Foto de perfil" />
                        <input type="file" accept="image/*" onChange={mudarFoto} hidden />
                    </label>
                    <div className="sidebar-info">
                        <h2>{formData.nome} {formData.sobrenome}</h2>
                        <p>{user.email}</p>
                    </div>

                    {user.objetivo === "2" && (
                        <button
                            type="button"
                            className={`btn-disponibilidade ${disponivel ? "disponivel" : "indisponivel"}`}
                            onClick={alternarDisponibilidade}
                        >
                            {disponivel ? "Disponível" : "Indisponível"}
                        </button>
                    )}
                </div>

                {/* Coluna da Direita (Formulário) */}
                <div className="profile-form-container">
                    <form className="form-profile" onSubmit={salvar}>
                        <div className="form-grid">

                            {/* --- Todos os seus campos de formulário --- */}

                            <div className="field-group">
                                <label>Nome</label>
                                <input type="text" name="nome" value={formData.nome} onChange={handleInputChange} />
                            </div>

                            <div className="field-group">
                                <label>Sobrenome</label>
                                <input type="text" name="sobrenome" value={formData.sobrenome} onChange={handleInputChange} />
                            </div>

                            <div className="field-group full-width">
                                <label>Email</label>
                                <input type="text" value={user.email} disabled={true} />
                            </div>

                            <div className="field-group">
                                <label>CPF</label>
                                <InputMask
                                    inputRef={cpfRef}
                                    className="styled-mask"
                                    mask="999.999.999-99"
                                    name="cpf"
                                    value={formData.cpf}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="field-group">
                                <label>Telefone</label>
                                <InputMask
                                    inputRef={telefoneRef}
                                    className="styled-mask"
                                    mask="(99) 99999-9999"
                                    name="telefone"
                                    value={formData.telefone}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="field-group">
                                <label>CEP</label>
                                <InputMask
                                    inputRef={cepRef}
                                    className="styled-mask"
                                    mask={99999 - 999}
                                    value={cep}
                                    onChange={(e) => setCep(e.target.value)}
                                    onBluir={handleCepBlur}
                                />
                            </div>

                            <div className="field-group">
                                <label>Data de Nascimento</label>
                                <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleInputChange} />
                            </div>

                            <div className="field-group">
                                <label>Gênero</label>
                                <select name="genero" value={formData.genero} onChange={handleInputChange}>
                                    <option value="" disabled>Selecione</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                    <option value="Outro">Prefiro não informar</option>
                                </select>
                            </div>

                            {user.objetivo === "1" && (
                                <>
                                    <div className="field-group">
                                        <label>CEP</label>
                                        <InputMask
                                            inputRef={cepRef}
                                            className="styled-mask"
                                            mask="99999-999"
                                            name="cep"
                                            value={formData.cep}
                                            onChange={handleInputChange}
                                            onBlur={handleCepBlur}
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label>Bairro</label>
                                        <input type="text" name="bairro" value={formData.bairro} onChange={handleInputChange} />
                                    </div>
                                    <div className="field-group">
                                        <label>Endereço</label>
                                        <input type="text" name="endereco" value={formData.endereco} onChange={handleInputChange} />
                                    </div>
                                    <div className="field-group">
                                        <label>Estado</label>
                                        <input type="text" name="estado" value={formData.estado} onChange={handleInputChange} />
                                    </div>
                                    <div className="field-group full-width">
                                        <label>Sobre o seu domicílio</label>
                                        <textarea name="sobreDomicilio" value={formData.sobreDomicilio} onChange={handleInputChange} />
                                    </div>
                                </>
                            )}

                            {user.objetivo === "2" && (
                                <div className="field-group full-width">
                                    <label>Serviços</label>
                                    <textarea name="servicos" value={formData.servicos} onChange={handleInputChange} />
                                </div>
                            )}

                        </div> {/* Fim do .form-grid */}

                        {/* --- 6. BOTÕES ATUALIZADOS --- */}
                        <div className="form-actions">

                            <button
                                type="button"
                                className="btn-change-password"
                                onClick={handleChangePassword}
                            >
                                Alterar Senha
                            </button>

                            <button
                                className="btn-atualizar"
                                type="submit"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Salvando...' : 'Atualizar Perfil'}
                            </button>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}