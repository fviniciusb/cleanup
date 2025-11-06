// --- 1. IMPORTS MESCLADOS ---
import { useContext, useState, useRef, useCallback } from "react";
import { FiUpload, FiSettings, FiPlus, FiTrash2 } from "react-icons/fi";
import avatar from "../../assets/avatar.png";
import { AuthContext } from "../../contexts/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../services/FirebaseConnection";
import { sendPasswordResetEmail } from "firebase/auth";
import axios from "axios";
import { toast } from "react-toastify";
import InputMask from "react-input-mask";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // CSS do Calendário

// Componentes de Layout (Nossa melhoria)
import PageHeader from "../../components/PageHeader";
import Title from "../../components/Title";

// CSS da Página
import "./profile.css";

// Função helper (do seu colega)
const formatDate = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Profile() {
  const { user, setUser, storageUser } = useContext(AuthContext);

  // --- 2. STATES MESCLADOS ---
  const [activeTab, setActiveTab] = useState("pessoais");

  const [formData, setFormData] = useState({
    nome: user?.nome || "",
    sobrenome: user?.sobrenome || "",
    cpf: user?.cpf || "",
    telefone: user?.telefone || "",
    dataNascimento: user?.dataNascimento || "",
    genero: user?.genero || "",
    cep: user?.cep || "",
    bairro: user?.bairro || "",
    endereco: user?.endereco || "",
    estado: user?.estado || "",
    sobreDomicilio: user?.sobreDomicilio || "",
    servicos: (user && Array.isArray(user.servicos)) ? user.servicos : [], 
  });

  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl);
  const [imagemAvatar, setImagemAvatar] = useState(null);
  const [disponivel, setDisponivel] = useState(user?.disponivel || false);
  const [isSaving, setIsSaving] = useState(false); // (Sua melhoria)

  const [unavailableDates, setUnavailableDates] = useState(
    user && Array.isArray(user.unavailableDates) ? user.unavailableDates : []
  );

  const [novoServicoNome, setNovoServicoNome] = useState("");
  const [novoServicoPreco, setNovoServicoPreco] = useState("");

  const cpfRef = useRef(null);
  const telefoneRef = useRef(null);
  const cepRef = useRef(null);

  // --- 3. FUNÇÕES MESCLADAS ---

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const mudarFoto = useCallback((e) => {
    if (e.target.files[0]) {
      const image = e.target.files[0];
      if (image.type === "image/jpeg" || image.type === "image/png") {
        setImagemAvatar(image);
        setAvatarUrl(URL.createObjectURL(image));
      } else {
        toast.error("Envie uma imagem do tipo PNG ou JPEG");
        setImagemAvatar(null);
      }
    }
  }, []);

  const atualizarDados = useCallback(
    async (atualizacoes) => {
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
        throw error;
      }
    },
    [user, setUser, storageUser]
  );

  // --- 4. FUNÇÃO 'uploadFoto' (A SUA VERSÃO OTIMIZADA com Cloudinary) ---
  const uploadFoto = useCallback(async () => {
    // --- ⚠️ PREENCHA SUAS CREDENCIAIS AQUI ---
    const CLOUD_NAME = "dy11aoczl"; 
    const UPLOAD_PRESET = "CleanUp";
    // ----------------------------------------
    if (!CLOUD_NAME || !UPLOAD_PRESET || CLOUD_NAME === "SEU_CLOUD_NAME_AQUI") {
      toast.error("Credenciais do Cloudinary não configuradas.");
      return null;
    }
    const formDataCloud = new FormData();
    formDataCloud.append("file", imagemAvatar);
    formDataCloud.append("upload_preset", UPLOAD_PRESET);
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    try {
      toast.info("Enviando nova imagem...");
      const response = await axios.post(cloudinaryUrl, formDataCloud);
      return response.data.secure_url;
    } catch (error) {
      console.error("Erro no upload (Cloudinary): ", error);
      toast.error("Erro ao enviar a imagem.");
      return null;
    }
  }, [imagemAvatar]);

  // --- 5. FUNÇÃO 'salvar' (MESCLADA) ---
  const salvar = useCallback(
    async (e) => {
      e.preventDefault();
      if (!formData.cpf) {
        toast.error("Por favor, preencha seu CPF.");
        return;
      }
      setIsSaving(true); // (Nossa melhoria)
      try {
        const atualizacoes = { ...formData }; 
        if (user.objetivo === "2") {
          atualizacoes.disponivel = disponivel;
          atualizacoes.unavailableDates = unavailableDates; // (Lógica do colega)
        }

        if (imagemAvatar) {
          const novaAvatarUrl = await uploadFoto(); // (Nossa lógica do Cloudinary)
          if (novaAvatarUrl) {
            atualizacoes.avatarUrl = novaAvatarUrl;
          } else {
            throw new Error("Falha no upload da imagem.");
          }
        }
        await atualizarDados(atualizacoes);
      } catch (error) {
        console.error(error.message);
      } finally {
        setIsSaving(false); // (Nossa melhoria)
      }
    },
    [
      formData,
      disponivel,
      imagemAvatar,
      user.objetivo,
      unavailableDates,
      uploadFoto,
      atualizarDados,
    ]
  );

  // --- 6. RESTANTE DAS FUNÇÕES (do seu colega e nossas) ---

  const alternarDisponibilidade = useCallback(async () => {
    const novaDisponibilidade = !disponivel;
    setDisponivel(novaDisponibilidade);
    await atualizarDados({ disponivel: novaDisponibilidade });
  }, [disponivel, atualizarDados]);

  const handleCepBlur = useCallback(async () => {
    const cepLimpo = formData.cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );
      const data = await response.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
        setFormData((prev) => ({ ...prev, endereco: "", bairro: "", estado: "" }));
        return;
      }
      setFormData((prev) => ({ ...prev, endereco: data.logradouro, bairro: data.bairro, estado: data.uf }));
    } catch (error) {
      console.error("Erro ao buscar o CEP:", error);
      toast.error("Erro ao buscar o CEP. Tente novamente.");
    }
  }, [formData.cep]);

  const handleChangePassword = useCallback(async () => {
    if (
      window.confirm(
        "Você tem certeza que deseja alterar sua senha?\nUm e-mail de redefinição será enviado para você."
      )
    ) {
      try {
        await sendPasswordResetEmail(auth, user.email);
        toast.success("E-mail de redefinição de senha enviado!");
      } catch (error) {
        console.error("Erro ao enviar e-mail de redefinição:", error);
        toast.error("Erro ao enviar e-mail. Tente novamente.");
      }
    }
  }, [user.email]);

  const handleDateChange = (date) => {
    const dateString = formatDate(date);
    if (unavailableDates.includes(dateString)) {
      setUnavailableDates((prevDates) =>
        prevDates.filter((d) => d !== dateString)
      );
    } else {
      setUnavailableDates((prevDates) => [...prevDates, dateString]);
    }
  };
  
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const dateString = formatDate(date);
      if (unavailableDates.includes(dateString)) {
        return "unavailable-day";
      }
    }
    return null;
  };

  const handleAdicionarServico = () => {
      if (novoServicoNome.trim() === "") {
          toast.warn("Por favor, preencha o nome do serviço.");
          return;
      }
      const novoServico = {
          nome: novoServicoNome.trim(),
          preco: novoServicoPreco.trim() || 'A combinar' 
      };
      setFormData(prev => ({
          ...prev,
          servicos: [...prev.servicos, novoServico]
      }));
      setNovoServicoNome("");
      setNovoServicoPreco("");
  };

  const handleRemoverServico = (indexToRemove) => {
      setFormData(prev => ({
          ...prev,
          servicos: prev.servicos.filter((_, index) => index !== indexToRemove)
      }));
      toast.info("Serviço removido. Clique em 'Atualizar Perfil' para salvar a alteração."); 
  };
  
  const handlePrecoChange = (e) => {
      let value = e.target.value;
      if (value.toLowerCase().startsWith('a')) {
          setNovoServicoPreco("A combinar");
          return;
      }
      let numeros = value.replace(/\D/g, '');
      if (numeros === "") {
          setNovoServicoPreco("");
          return;
      }
      let valorNumerico = parseFloat(numeros);
      let valorFormatado = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
      }).format(valorNumerico / 100); 
      setNovoServicoPreco(valorFormatado);
  };

  // --- 7. JSX MESCLADO (com Abas e PageHeader) ---
  return (
    <div>
      {/* (Nossa melhoria) */}
      <PageHeader>
        <Title nome="Meu Perfil">
          <FiSettings size={25} />
        </Title>
      </PageHeader>

      <div className="profile-container">
        <div className="profile-sidebar">
          <label className="label-avatar">
            <span>
              <FiUpload color="#FFF" size={25} />
            </span>
            <img src={avatarUrl || avatar} alt="Foto de perfil" />
            <input type="file" accept="image/*" onChange={mudarFoto} hidden />
          </label>
          <div className="sidebar-info">
            <h2>
              {formData.nome} {formData.sobrenome}
            </h2>
            <p>{user.email}</p>
          </div>
          {user.objetivo === "2" && (
            <button
              type="button"
              className={`btn-disponibilidade ${
                disponivel ? "disponivel" : "indisponivel"
              }`}
              onClick={alternarDisponibilidade}
            >
              {disponivel ? "Disponível (Geral)" : "Indisponível (Geral)"}
            </button>
          )}
        </div>

        <div className="profile-form-container">
          {/* Navegação das Abas (do seu colega) */}
          <div className="profile-tabs-nav">
            <button
              type="button"
              className={`tab-button ${
                activeTab === "pessoais" ? "active" : ""
              }`}
              onClick={() => setActiveTab("pessoais")}
            >
              Dados Pessoais
            </button>
            <button
              type="button"
              className={`tab-button ${
                activeTab === "contato" ? "active" : ""
              }`}
              onClick={() => setActiveTab("contato")}
            >
              Contato & Endereço
            </button>
            {user.objetivo === "2" && (
              <button
                type="button"
                className={`tab-button ${
                  activeTab === "servicos" ? "active" : ""
                }`}
                onClick={() => setActiveTab("servicos")}
              >
                Serviços e Agenda
              </button>
            )}
          </div>

          <form className="form-profile" onSubmit={salvar}>
            {/* --- ABA 1: DADOS PESSOAIS --- */}
            <div
              className={`tab-content ${
                activeTab === "pessoais" ? "active" : ""
              }`}
            >
              <div className="form-grid">
                <div className="field-group">
                  <label>Nome</label>
                  <input
                    type="text" name="nome"
                    value={formData.nome} onChange={handleInputChange}
                  />
                </div>
                <div className="field-group">
                  <label>Sobrenome</label>
                  <input
                    type="text" name="sobrenome"
                    value={formData.sobrenome} onChange={handleInputChange}
                  />
                </div>
                <div className="field-group">
                  <label>CPF</label>
                  <InputMask
                    inputRef={cpfRef} className="styled-mask"
                    mask="999.999.999-99" name="cpf"
                    value={formData.cpf} onChange={handleInputChange}
                  />
                </div>
                <div className="field-group">
                  <label>Data de Nascimento</label>
                  <input
                    type="date" name="dataNascimento"
                    value={formData.dataNascimento} onChange={handleInputChange}
                  />
                </div>
                <div className="field-group">
                  <label>Gênero</label>
                  <select
                    name="genero" value={formData.genero} onChange={handleInputChange}
                >
                    <option value="" disabled>Selecione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Prefiro não informar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* --- ABA 2: CONTATO & ENDEREÇO --- */}
            <div
              className={`tab-content ${activeTab === "contato" ? "active" : ""}`}
            >
              <div className="form-grid">
                <div className="field-group full-width">
                  <label>Email</label>
                  <input type="text" value={user.email} disabled={true} />
                </div>
                <div className="field-group">
                  <label>Telefone</label>
                  <InputMask
                    inputRef={telefoneRef} className="styled-mask"
                  mask="(99) 99999-9999" name="telefone"
                    value={formData.telefone} onChange={handleInputChange}
                  />
                </div>

                <div className="field-group">
                  <label>CEP</label>
                  <InputMask
                    inputRef={cepRef} className="styled-mask"
                    mask="99999-999" name="cep"
                    value={formData.cep} onChange={handleInputChange}
                    onBlur={handleCepBlur}
                  />
                </div>
              <div className="field-group">
                  <label>Bairro</label>
                  <input
                    type="text" name="bairro"
                    value={formData.bairro} onChange={handleInputChange}
                  />
                </div>
                <div className="field-group">
                  <label>Endereço</label>
                    <input
                    type="text" name="endereco"
                    value={formData.endereco} onChange={handleInputChange}
                  />
                </div>
                <div className="field-group">
                  <label>Estado</label>
                  <input
                    type="text" name="estado"
                    value={formData.estado} onChange={handleInputChange}
                  />
                </div>

                {user.objetivo === "1" && (
                  <div className="field-group full-width">
                    <label>Sobre o seu domicílio</label>
                    <textarea
                      name="sobreDomicilio"
                      value={formData.sobreDomicilio}
                      onChange={handleInputChange}
                      placeholder="Ex: Casa com cachorro, Apto 301..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* --- ABA 3: SERVIÇOS E DISPONIBILIDADE --- */}
            {user.objetivo === "2" && (
              <div
                className={`tab-content ${
                  activeTab === "servicos" ? "active" : ""
                }`}
              >

                {/* Seção de Lista de Serviços (do seu colega) */}
                <div className="servicos-section">
                    <h3>Meus Serviços</h3>
                    <p>Liste os serviços que você oferece e o preço (opcional).</p>
                    
                    <div className="servicos-list">
                        {formData.servicos.length === 0 ? (
                            <p className="servico-item-empty">Nenhum serviço cadastrado.</p>
                       ) : (
                            formData.servicos.map((servico, index) => (
                                <div className="servico-item" key={index}>
                                    <div className="servico-item-info">
                                        <strong>{servico.nome}</strong>
                                        <span>{servico.preco}</span>
                                    </div>
                                  <button 
                                        type="button" 
                                        className="btn-remover-servico"
                                        onClick={() => handleRemoverServico(index)}
                                        title="Remover serviço"
                                    >
                                        <FiTrash2 size={18} />
                                  </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Formulário para adicionar novo serviço (do seu colega) */}
                    <div className="servico-add-form">
                        <div className="field-group">
                            <label>Novo Serviço</label>
                            <input 
                                type="text" 
                                placeholder="Nome do serviço (ex: Limpeza Padrão)"
                                value={novoServicoNome}
                                onChange={(e) => setNovoServicoNome(e.target.value)}
                            />
                        </div>
                        
                     <div className="field-group">
                            <label>Preço (Opcional)</label>
                            <input 
                                type="text"
                                className="styled-mask"
                                placeholder="Ex: R$ 150,00 ou A combinar"
                                value={novoServicoPreco}
                                onChange={handlePrecoChange}
                            />
                        </div>

                       <button 
                            type="button" 
                            className="btn-add-servico"
                            onClick={handleAdicionarServico}
                        >
                            <FiPlus size={20} /> Adicionar
                      </button>
                    </div>
                </div>
                
                {/* Seção do Calendário (do seu colega) */}
                <div className="availability-section">
                  <h3>Gerenciar Dias Indisponíveis</h3>
                  <p>
                    Clique nos dias para marcá-los como indisponíveis.
                  </p>
                  <div className="calendar-container">
                     <Calendar
                      onChange={handleDateChange}
                      tileClassName={tileClassName}
                      minDate={new Date()} // Não pode marcar datas passadas
                      locale="pt-BR"
                    />
                  </div>
                   </div>
              </div>
            )}

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
              {isSaving ? "Salvando..." : "Atualizar Perfil"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}