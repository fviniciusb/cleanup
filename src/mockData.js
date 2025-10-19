// Em: src/mockData.js

// Importe as imagens que você tem na pasta assets
import avatarMario from './assets/mario-bandeira.jpg';
import avatarMaria from './assets/maria-fernandes.jpg';
import avatarTeste13 from './assets/teste13.jpg';

export const mockFaxineiras = [
  {
    id: "1",
    nome: "Mário Bandeira",
    servicos: "Busco apartamentos de até 150m2 para limpar, limpo vidros e faço almoço",
    telefone: "(27) 00000-0000",
    avatarUrl: avatarMario,
    mediaAvaliacoes: 4.8,
    totalAvaliacoes: 32,
    objetivo: "2",
  },
  {
    id: "2",
    nome: "Maria Fernandes",
    servicos: "Limpo os quartos, o banheiro, a cozinha, a sala e passo pano em todos os cômodos.",
    telefone: "(27) 99999-9999",
    avatarUrl: avatarMaria,
    mediaAvaliacoes: 4.5,
    totalAvaliacoes: 12,
    objetivo: "2",
  },
  {
    id: "3",
    nome: "teste 13",
    servicos: "1111111111",
    telefone: "11111111111",
    avatarUrl: avatarTeste13,
    mediaAvaliacoes: 0, // Simula uma faxineira nova
    totalAvaliacoes: 0,
    objetivo: "2",
  },
  // ... adicione as outras
];

// Simula um usuário "Contratante" logado
export const mockUserContratante = {
    uid: "user_contratante_123",
    nome: "João",
    sobrenome: "Silva",
    email: "joao@teste.com",
    avatarUrl: null,
    objetivo: "1", // 1 = Contratante
    agendamentos: [
      {
        faxineiraId: "2",
        faxineiraNome: "Maria Fernandes",
        data: "2025-10-20",
        horario: "14:00",
        avaliado: false, // <-- Importante
      },
      {
        faxineiraId: "1",
        faxineiraNome: "Mário Bandeira",
        data: "2025-10-15",
        horario: "09:00",
        avaliado: true, // <-- Importante
      }
    ]
};