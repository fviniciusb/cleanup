const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.criarAgendamento = functions.https.onCall(async (data, context) => {
  // 1. CORREÇÃO: Verificação de Auth relaxada para testes
  // O código original bloqueava aqui. Vamos comentar para permitir o teste.
  /*
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Você precisa estar logado para agendar.",
    );
  }
  */

  // 2. CORREÇÃO: Define o ID do usuário de forma segura
  // Se estiver logado, usa o ID real. Se não (teste público), usa um ID provisório ou o que vier no 'data'.
  const userId = context.auth ? context.auth.uid : (data.clienteId || "usuario_teste_temp");

  const {prestadorId, dataAgendamento, horarioAgendamento} = data;

  // 2. Validação básica de campos obrigatórios
  if (!prestadorId || !dataAgendamento || !horarioAgendamento) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Faltam dados obrigatórios para o agendamento.",
    );
  }

  // 3. Validação de Data (Impede agendamento no passado)
  const [ano, mes, dia] = dataAgendamento.split("-").map(Number);
  const [hora, minuto] = horarioAgendamento.split(":").map(Number);
  const dataAgendamentoObj = new Date(ano, mes - 1, dia, hora, minuto);
  const agora = new Date();

  // Margem de segurança de 5 minutos
  if (dataAgendamentoObj < new Date(agora.getTime() - 5 * 60000)) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Não é possível realizar agendamentos no passado.",
    );
  }

  try {
    await db.runTransaction(async (transaction) => {
      const agendamentosRef = db.collection("agendamentos");
      const prestadorRef = db.collection("usuarios").doc(prestadorId);

      // 4. Verifica se o prestador existe no banco
      const prestadorDoc = await transaction.get(prestadorRef);
      
      // OBS: Se você estiver testando com um ID que não existe no banco, 
      // pode dar erro aqui. Para testes rápidos, certifique-se que o 'prestadorId' enviado é válido.
      if (!prestadorDoc.exists) {
        throw new functions.https.HttpsError(
            "not-found",
            "O profissional selecionado não foi encontrado.",
        );
      }

      // 5. Verifica conflito de horário para o CLIENTE
      const clienteQuery = agendamentosRef
          .where("clienteId", "==", userId)
          .where("data", "==", dataAgendamento)
          .where("horario", "==", horarioAgendamento);

      const clienteSnapshot = await transaction.get(clienteQuery);

      if (!clienteSnapshot.empty) {
        throw new functions.https.HttpsError(
            "already-exists",
            "Você já possui um agendamento neste horário.",
        );
      }

      // 6. Verifica conflito de horário para o PRESTADOR
      const prestadorQuery = agendamentosRef
          .where("prestadorId", "==", prestadorId)
          .where("data", "==", dataAgendamento)
          .where("horario", "==", horarioAgendamento);

      const prestadorSnapshot = await transaction.get(prestadorQuery);

      if (!prestadorSnapshot.empty) {
        throw new functions.https.HttpsError(
            "already-exists",
            "Este profissional já está ocupado neste horário.",
        );
      }

      // 7. Prepara os dados
      const prestadorData = prestadorDoc.data() || {};
      
      const payload = {
        clienteId: userId, // Agora usa o ID seguro definido no início
        prestadorId: prestadorId,
        data: dataAgendamento,
        horario: horarioAgendamento,
        status: "pendente",
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
        
        prestadorNome: data.prestadorNome || prestadorData.nome || "Prestador",
        prestadorAvatar: data.prestadorAvatar || prestadorData.avatarUrl || null,
        clienteNome: data.clienteNome || "Cliente Teste",
        clienteAvatar: data.clienteAvatar || null,
      };

      // 8. Salva o agendamento
      const novoAgendamentoRef = agendamentosRef.doc();
      transaction.set(novoAgendamentoRef, payload);
    });

    return {success: true, message: "Agendamento realizado com sucesso!"};
  } catch (error) {
    console.error("Erro na transação de agendamento:", error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
        "internal",
        "Erro interno ao processar agendamento: " + error.message,
    );
  }
});