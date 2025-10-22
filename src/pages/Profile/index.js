import { useContext, useState } from "react";
import { FiUpload } from "react-icons/fi";
import avatar from '../../assets/avatar.png';
import { AuthContext } from "../../contexts/auth";
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../services/FirebaseConnection';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './profile.css';
import { toast } from 'react-toastify';
import InputMask from 'react-input-mask';

export default function Profile() {
    const { user, setUser, storageUser } = useContext(AuthContext);

    // Estados para o formulário, inicializados de forma segura com optional chaining (?.)
    const [imagemAvatar, setImagemAvatar] = useState(null); // Armazena o arquivo da nova imagem
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl);
    const [nome, setNome] = useState(user?.nome || '');
    const [sobrenome, setSobrenome] = useState(user?.sobrenome || '');
    const [email, setEmail] = useState(user?.email || '');
    const [cpf, setCpf] = useState(user?.cpf || '');
    const [telefone, setTelefone] = useState(user?.telefone || '');
    const [dataNascimento, setDataNascimento] = useState(user?.dataNascimento || '');
    const [genero, setGenero] = useState(user?.genero || '');
    const [disponivel, setDisponivel] = useState(user?.disponivel || false);
    const [endereco, setEndereco] = useState(user?.endereco || '');
    const [cep, setCep] = useState(user?.cep || '');
    const [bairro, setBairro] = useState(user?.bairro || '');
    const [estado, setEstado] = useState(user?.estado || '');
    const [sobreDomicilio, setSobreDomicilio] = useState(user?.sobreDomicilio || '');
    const [servicos, setServicos] = useState(user?.servicos || '');

    // Função para pré-visualizar a imagem selecionada
    function handleFile(e) {
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
    }

    // --- LÓGICA DE SALVAMENTO UNIFICADA ---
    async function handleSubmit(e) {
        e.preventDefault();

        // Validação simples
        if (!nome.trim() || !sobrenome.trim()) {
            toast.info("O nome e o sobrenome são obrigatórios.");
            return;
        }

        try {
            let dataToUpdate = {
                nome: nome.trim(),
                sobrenome: sobrenome.trim(),
                cpf,
                telefone,
                dataNascimento,
                genero,
            };

            // 1. Se uma nova imagem foi selecionada, faz o upload primeiro
            if (imagemAvatar) {
                const currentUid = user.uid;
                const uploadRef = ref(storage, `imagens/${currentUid}/${imagemAvatar.name}`);
                const snapshot = await uploadBytes(uploadRef, imagemAvatar);
                const downloadURL = await getDownloadURL(snapshot.ref);
                
                // Adiciona a URL da nova imagem aos dados que serão atualizados
                dataToUpdate.avatarUrl = downloadURL;
            }

            // 2. Adiciona campos específicos do tipo de usuário (Cliente ou Prestador)
            if (user.objetivo === "1") { // Cliente
                Object.assign(dataToUpdate, { endereco, cep, bairro, estado, sobreDomicilio });
            } else if (user.objetivo === "2") { // Prestador
                Object.assign(dataToUpdate, { servicos, disponivel });
            }

            // 3. Atualiza o documento no Firestore com todos os dados de uma vez
            const docRef = doc(db, "usuarios", user.uid);
            await updateDoc(docRef, dataToUpdate);

            // 4. Atualiza o estado local e o localStorage
            const updatedUser = { ...user, ...dataToUpdate };
            setUser(updatedUser);
            storageUser(updatedUser);
            toast.success("Perfil atualizado com sucesso!");

        } catch (error) {
            console.error("Erro ao atualizar o perfil:", error);
            toast.error("Ops! Algo deu errado ao salvar as alterações.");
        }
    }

    // Função para o botão de disponibilidade (Prestador)
    async function alternarDisponibilidade() {
        const novaDisponibilidade = !disponivel;
        
        try {
            const docRef = doc(db, "usuarios", user.uid);
            await updateDoc(docRef, { disponivel: novaDisponibilidade });

            const updatedUser = { ...user, disponivel: novaDisponibilidade };
            setUser(updatedUser);
            storageUser(updatedUser);
            setDisponivel(novaDisponibilidade); // Atualiza o estado local do botão
            toast.success(`Status alterado para ${novaDisponibilidade ? 'Disponível' : 'Indisponível'}`);
        } catch(error) {
            console.error("Erro ao alterar disponibilidade:", error);
            toast.error("Erro ao alterar o status.");
        }
    }

    return (
        <div>
            {/* O SEU CÓDIGO JSX PERMANECE O MESMO AQUI */}
            <div className="content">
                <div className="container">
                    {/* 👇 Apenas a função do onSubmit foi renomeada */}
                    <form className="form-profile" onSubmit={handleSubmit}>
                        <label className="label-avatar">
                            <span><FiUpload color="#FFF" size={25} /></span>
                            {/* 👇 E a função do onChange foi renomeada */}
                            <input type="file" accept="image/*" onChange={handleFile} className="foto" /> <br />
                            <img 
                                src={avatarUrl || avatar} // Usa avatarUrl ou o placeholder padrão
                                alt="Foto de perfil" 
                                width={250} 
                                height={250} 
                            />
                        </label>
                        
                        {/* O restante do seu formulário (inputs, selects, etc.) continua aqui, sem alterações. */}
                        {/* Exemplo: */}
                        <div className="profile-fields">
                            <div className="field">
                               <label>Nome</label>
                                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} />
                           </div>
                           <div className="field">
                               <label>Sobrenome</label>
                                <input type="text" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} />
                           </div>
                           <div className="field">
                               <label>Email</label>
                               {/* O campo de e-mail geralmente não deve ser editável */}
                                <input type="email" value={email} disabled={true} />
                           </div>
                           {/* ... todos os outros campos ... */}
                           <div className="field">
                                <label>CPF</label>
                                <InputMask 
                                    mask="999.999.999-99" 
                                    value={cpf} 
                                    onChange={(e) => setCpf(e.target.value)}
                                />
                            </div>

                            <div className="field">
                                <label>Telefone</label>
                                <InputMask 
                                    mask="(99) 99999-9999"
                                    value={telefone}
                                    onChange={(e) => setTelefone(e.target.value)}
                                />
                            </div>

                            <div className="field">
                                <label>Data de Nascimento</label>
                                <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
                            </div>

                            <div className="field">
                                <label>Gênero</label>
                                <select value={genero} onChange={(e) => setGenero(e.target.value)}>
                                    <option value="" disabled>Selecione</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                    <option value="Outro">Prefiro não informar</option>
                                </select>
                            </div>

                            {user.objetivo === "1" && (
                                <>
                                    <div className="field">
                                        <label>CEP</label>
                                        <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} />
                                    </div>
                                    <div className="field">
                                        <label>Bairro</label>
                                        <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} />
                                    </div>
                                    <div className="field">
                                        <label>Endereço</label>
                                        <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
                                    </div>
                                    <div className="field">
                                        <label>Estado</label>
                                        <input type="text" value={estado} onChange={(e) => setEstado(e.target.value)} />
                                    </div>
                                    <div className="field">
                                        <label>Sobre o seu domicílio</label>
                                        <textarea value={sobreDomicilio} onChange={(e) => setSobreDomicilio(e.target.value)} />
                                    </div>
                                </>
                            )}

                            {user.objetivo === "2" && (
                                <>
                                    <div className="field">
                                        <label>Serviços</label>
                                        <textarea value={servicos} onChange={(e) => setServicos(e.target.value)} />
                                    </div>
                                    <button
                                        type="button"
                                        className={`btn-disponibilidade ${disponivel ? "disponivel" : "indisponivel"}`}
                                        onClick={alternarDisponibilidade}
                                    >
                                        {disponivel ? "Disponível" : "Indisponível"}
                                    </button>
                                </>
                            )}
                        </div>
                        
                        <button className="botaoPerfil" type="submit">Salvar Alterações</button>
                    </form>
                </div>
            </div>
        </div>
    );
}