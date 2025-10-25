import { useContext, useState, useEffect } from "react";
import { FiUpload } from "react-icons/fi";
import avatar from '../../assets/avatar.png';
import { AuthContext } from "../../contexts/auth";
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../services/FirebaseConnection';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './profile.css';
import { toast } from 'react-toastify';
import InputMask from 'react-input-mask'; // Você já estava importando!

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

    // ... (seu useEffect está aqui, tudo certo) ...
    useEffect(() => {
        if (user && user.genero) {
            setGenero(user.genero);
        }
        if (user && typeof user.disponivel !== "undefined") {
            setDisponivel(user.disponivel);
        }
    }, [user]);

    // ... (suas funções mudarFoto, uploadFoto, atualizarDados, salvar, alternarDisponibilidade estão aqui) ...
    // ... (não vou colar todas para economizar espaço, elas estão corretas) ...

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

    async function uploadFoto() {
        const currentUid = user.uid;
        const uploadRef = ref(storage, `imagens/${currentUid}/${imagemAvatar.name}`);
        try {
            const snapshot = await uploadBytes(uploadRef, imagemAvatar);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Erro no upload da foto: ", error);
            toast.error("Erro ao enviar a imagem.");
            return null; 
        }
    }

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

    async function salvar(e) {
        e.preventDefault();
        if (!cpf) {
            toast.error("Por favor, preencha seu CPF.");
            return;
        }
        const atualizacoes = {
            nome,
            sobrenome,
            cpf,
            telefone,
            dataNascimento,
            genero,
            ...(user.objetivo === "1" && {
                cep,
                bairro,
                endereco,
                estado,
                sobreDomicilio,
            }),
            ...(user.objetivo === "2" && {
                servicos,
            }),
        };
        if (imagemAvatar) {
            const novaAvatarUrl = await uploadFoto();
            if (novaAvatarUrl) {
                atualizacoes.avatarUrl = novaAvatarUrl;
            } else {
                return;
            }
        }
        await atualizarDados(atualizacoes);
    }

    async function alternarDisponibilidade() {
        const novaDisponibilidade = !disponivel;
        setDisponivel(novaDisponibilidade);
        await atualizarDados({ disponivel: novaDisponibilidade });
    }


    // ==========================================================
    // ======> 1. ADIÇÃO: FUNÇÃO DE BUSCAR CEP
    // ==========================================================
    const handleCepBlur = async (e) => {
        // Pega o valor do CEP do state, que já foi atualizado pelo onChange
        const cepLimpo = cep.replace(/\D/g, ''); 

        if (cepLimpo.length !== 8) {
          // Se o CEP (sem máscara) não tiver 8 dígitos, não faz nada
          return; 
        }

        try {
          // Faz a chamada para a API ViaCEP
          const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
          const data = await response.json();

          if (data.erro) {
            toast.error("CEP não encontrado.");
            // Limpa os campos caso o CEP seja inválido
            setEndereco('');
            setBairro('');
            setEstado('');
            return;
          }

          // Atualiza os states do seu componente com os dados da API
          // Os nomes já batem: setEndereco, setBairro, setEstado
          setEndereco(data.logradouro);
          setBairro(data.bairro);
          setEstado(data.uf);
          
          // Opcional: focar no campo de endereço após o preenchimento
          // document.getElementById('endereco-input').focus(); 
          // (Para isso, adicione o id="endereco-input" no input de Endereço)

        } catch (error) {
          console.error("Erro ao buscar o CEP:", error);
          toast.error("Erro ao buscar o CEP. Tente novamente.");
        }
      };


    // --- SEU JSX (COM A PEQUENA MUDANÇA NO CAMPO CEP) ---
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
                                    {/* ========================================================== */}
                                    {/* ======> 2. MUDANÇA: CAMPO CEP COM MÁSCARA E ONBLUR
                                    {/* ========================================================== */}
                                    <div className="field-group">
                                        <label>CEP</label>
                                        <InputMask 
                                            className="styled-mask"
                                            mask="99999-999"
                                            value={cep} 
                                            onChange={(e) => setCep(e.target.value)}
                                            onBlur={handleCepBlur} // <-- ISSO FOI ADICIONADO
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label>Bairro</label>
                                        {/* O 'value' e 'onChange' já estavam corretos! */}
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