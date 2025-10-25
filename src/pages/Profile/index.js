import { useContext, useState, useEffect } from "react";
import { FiUpload } from "react-icons/fi";
import avatar from '../../assets/avatar.png';
import { AuthContext } from "../../contexts/auth";
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../services/FirebaseConnection';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './profile.css'; // <-- Certifique-se que o profile.css também está ATUALIZADO
import { toast } from 'react-toastify';
import InputMask from 'react-input-mask';

export default function Profile() {
    const { user, setUser, storageUser } = useContext(AuthContext);

    // Seus 'states' (estão corretos)
    const [avatarUrl, setAvatarUrl] = useState(user && user.avatarUrl);
    const [imagemAvatar, setImagemAvatar] = useState(null);
    const [nome, setNome] = useState(user && user.nome);
    const [sobrenome, setSobrenome] = useState(user && user.sobrenome);
    const [email] = useState(user && user.email);
    const [cpf, setCpf] = useState((user && user.cpf) || "");
    const [telefone, setTelefone] = useState((user && user.telefone) || "");
    const [dataNascimento, setDataNascimento] = useState(user && user.dataNascimento);
    const [genero, setGenero] = useState((user && user.genero) || "");
    const [disponivel, setDisponivel] = useState((user && user.disponivel) || false);
    const [endereco, setEndereco] = useState((user && user.endereco) || "");
    const [cep, setCep] = useState((user && user.cep) || "");
    const [bairro, setBairro] = useState((user && user.bairro) || "");
    const [estado, setEstado] = useState((user && user.estado) || "");
    const [sobreDomicilio, setSobreDomicilio] = useState((user && user.sobreDomicilio) || "");
    const [servicos, setServicos] = useState((user && user.servicos) || "");

    // Este useEffect é redundante, pois o useState já faz essa lógica inicial.
    // Pode remover se quiser, mas não causa problemas.
    useEffect(() => {
        if (user && user.genero) {
            setGenero(user.genero);
        }
        if (user && typeof user.disponivel !== "undefined") {
            setDisponivel(user.disponivel);
        }
    }, [user]);

    // Função 'mudarFoto' (está correta)
    function mudarFoto(e) {
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

    // Função 'uploadFoto' (corrigida para retornar a URL)
    async function uploadFoto() {
        const currentUid = user.uid;
        const uploadRef = ref(storage, `imagens/${currentUid}/${imagemAvatar.name}`);

        try {
            const snapshot = await uploadBytes(uploadRef, imagemAvatar);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL; // Retorna a URL de download
        } catch (error) {
            console.error("Erro no upload da foto: ", error);
            toast.error("Erro ao enviar a imagem.");
            return null; // Retorna null em caso de erro
        }
    }

    // Função 'atualizarDados' (está correta)
    async function atualizarDados(atualizacoes) {
        const docRef = doc(db, "usuarios", user.uid);
        await updateDoc(docRef, atualizacoes)
            .then(() => {
                const updatedUser = { ...user, ...atualizacoes };
                setUser(updatedUser);
                storageUser(updatedUser);
                toast.success("Atualizado com sucesso!");
            })
            .catch((error) => {
                console.error("Erro ao atualizar dados:", error);
                toast.error("Erro ao atualizar dados.");
            });
    }

    // --- FUNÇÃO 'SALVAR' COM A LÓGICA CORRIGIDA ---
    async function salvar(e) {
        e.preventDefault();

        // (Você tinha uma validação de Gênero, mudei para CPF que é mais comum)
        if (!cpf) {
            toast.error("Por favor, preencha seu CPF.");
            return;
        }

        // 1. Monta o objeto base com todas as atualizações de texto
        const atualizacoes = {
            nome,
            sobrenome,
            cpf,
            telefone,
            dataNascimento,
            genero,
            ...(user.objetivo === "1" && {
                cep, // Adicionei cep e bairro que faltavam
                bairro,
                endereco,
                estado,
                sobreDomicilio,
            }),
            ...(user.objetivo === "2" && {
                servicos,
            }),
        };

        // 2. Verifica se uma nova imagem foi selecionada
        if (imagemAvatar) {
            const novaAvatarUrl = await uploadFoto(); // Espera o upload terminar

            if (novaAvatarUrl) {
                // 3. Adiciona a URL da nova foto ao objeto de atualizações
                atualizacoes.avatarUrl = novaAvatarUrl;
            } else {
                // Se o upload falhar, impede o resto da atualização
                return;
            }
        }

        // 4. Chama o 'atualizarDados' UMA VEZ com TUDO
        await atualizarDados(atualizacoes);
    }

    // Função 'alternarDisponibilidade' (está correta)
    async function alternarDisponibilidade() {
        const novaDisponibilidade = !disponivel;
        setDisponivel(novaDisponibilidade);
        await atualizarDados({ disponivel: novaDisponibilidade });
    }

    // --- NOVO JSX PARA O LAYOUT MODERNO ---
    return (
        <div>
            
            <div className="profile-container">
                
                {/* COLUNA DA ESQUERDA: FOTO */}
                <div className="profile-sidebar">
                    <label className="label-avatar">
                        <span>
                            <FiUpload color="#FFF" size={25} />
                        </span>
                        {avatarUrl === null ? (
                            <img src={avatar} alt="Foto de perfil" />
                        ) : (
                            <img src={avatarUrl} alt="Foto de perfil" />
                        )}
                        <input type="file" accept="image/*" onChange={mudarFoto} hidden />
                    </label>
                    <div className="sidebar-info">
                        <h2>{nome} {sobrenome}</h2>
                        <p>{email}</p>
                    </div>

                    {/* Botão de Disponibilidade (só aparece para objetivo "2") */}
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

                {/* COLUNA DA DIREITA: FORMULÁRIO */}
                <div className="profile-form-container">
                    <form className="form-profile" onSubmit={salvar}>
                        
                        <div className="form-grid">
                            
                            <div className="field-group">
                                <label>Nome</label>
                                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} />
                            </div>
                            
                            <div className="field-group">
                                <label>Sobrenome</label>
                                <input type="text" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} />
                            </div>

                           <div className="field-group full-width">
                                <label>Email</label>
                                <input type="text" value={email} disabled={true} />
                            </div>

                            <div className="field-group">
                                <label>CPF</label>
                                <InputMask
                                    className="styled-mask"
                                    mask="999.999.999-99" 
                                    value={cpf} 
                                    onChange={(e) => setCpf(e.target.value)}
                                />
                            </div>

                            <div className="field-group">
                                <label>Telefone</label>
                                <InputMask 
                                    className="styled-mask"
                                    mask="(99) 99999-9999"
                                    value={telefone}
                                    onChange={(e) => setTelefone(e.target.value)}
                                />
                            </div>

                            <div className="field-group">
                                <label>Data de Nascimento</label>
                                <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
                            </div>

                            <div className="field-group">
                                <label>Gênero</label>
                                <select value={genero} onChange={(e) => setGenero(e.target.value)}>
                                    <option value="" disabled>Selecione</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                    <option value="Outro">Prefiro não informar</option>
                                </select>
                            </div>

                            {/* Campos de Endereço (Exemplo para objetivo "1") */}
                            {user.objetivo === "1" && (
                                <>
                                    <div className="field-group">
                                        <label>CEP</label>
                                        <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} />
                                    </div>
                                    <div className="field-group">
                                        <label>Bairro</label>
                                        <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} />
                                    </div>
                                    <div className="field-group">
                                        <label>Endereço</label>
                                        <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
                                    </div>
                                    <div className="field-group">
                                        <label>Estado</label>
                                        <input type="text" value={estado} onChange={(e) => setEstado(e.target.value)} />
                                    </div>
                                    <div className="field-group full-width">
                                        <label>Sobre o seu domicílio</label>
                                        <textarea value={sobreDomicilio} onChange={(e) => setSobreDomicilio(e.target.value)} />
                                    </div>
                                </>
                            )}
                            
                            {/* Campos de Serviços (Exemplo para objetivo "2") */}
                            {user.objetivo === "2" && (
                                <div className="field-group full-width">
                                    <label>Serviços</label>
                                    <textarea value={servicos} onChange={(e) => setServicos(e.target.value)} />
                                </div>
                            )}

                        </div> {/* Fim do .form-grid */}
                        
                        <div className="form-actions">
                            <button className="btn-atualizar" type="submit">
                                Atualizar Perfil
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}