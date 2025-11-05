const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.criarAgendamento = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated", "Você precisa estar logado."
    );
  }

  const userId = context.auth.uid;
  const { prestadorId, dataAgendamento, horarioAgendamento } = data;

  if (!prestadorId || !dataAgendamento || !horarioAgendamento) {
    throw new functions.https.HttpsError(
      "invalid-argument", "Dados incompletos."
    );
  }

  try {
    await db.runTransaction(async (transaction) => {
      const agendamentosRef = db.collection("agendamentos");

      // VERIFICAÇÃO 1: O CLIENTE já tem algo nesse horário?
      const clienteQuery = agendamentosRef
        .where("clienteId", "==", userId)
        .where("data", "==", dataAgendamento)
        .where("horario", "==", horarioAgendamento);
        
      const clienteSnapshot = await transaction.get(clienteQuery);

      if (!clienteSnapshot.empty) {
        throw new Error("Você já possui outro agendamento neste mesmo dia e horário.");
      }

      // VERIFICAÇÃO 2: O PROFISSIONAL já está ocupado?
      const prestadorQuery = agendamentosRef
        .where("prestadorId", "==", prestadorId)
        .where("data", "==", dataAgendamento)
        .where("horario", "==", horarioAgendamento);

      const prestadorSnapshot = await transaction.get(prestadorQuery);

      if (!prestadorSnapshot.empty) {
        throw new Error("Este profissional já está ocupado neste horário.");
      }

      // 4. Se passou nas verificações, CRIA o agendamento
      const novoAgendamentoRef = db.collection("agendamentos").doc();
      transaction.set(novoAgendamentoRef, {
        clienteId: userId,
        status: "pendente",
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
        ...data
      });
    });

    return { success: true, message: "Agendamento criado com sucesso!" };

  } catch (error) {
    console.error("Falha ao criar agendamento:", error);
    throw new functions.https.HttpsError("already-exists", error.message);
  }
});