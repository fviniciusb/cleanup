describe('Comparativo de Performance: Registo Manual vs Google', () => {

  // Cenário 1: O Caminho Lento e Doloroso (Registo Manual)
  it('Cenário A: Medir tempo de Registo Manual Completo (Simulação Humana)', () => {
    const startTime = Date.now(); // ⏱️ Inicia o cronómetro

    // Vamos assumir que a rota de registo é /cadastrar
    cy.visit('http://localhost:3000/cadastrar');

    // CONFIGURAÇÃO DO HUMANO
    // delay: 150ms por tecla (simula uma pessoa a digitar com calma/atenção)
    const humanTypingSpeed = { delay: 500 }; 

    // 1. Preenchimento do Formulário Extenso
    // Ajuste os seletores ('input[...]') conforme o seu código React real
    
    // Nome e Apelido
    cy.get('input[placeholder="Nome"]').type('Maria', humanTypingSpeed);
    cy.get('input[placeholder="Sobrenome"]').type('Ferreira Santos', humanTypingSpeed);

    // Dados de Contacto (Simulando pausas entre campos)
    cy.wait(500); // Pequena pausa para "pensar" ou mudar de campo
    cy.get('input[type="email"]').first().type('maria.ferreira.teste@cleanup.com', humanTypingSpeed);
    
    cy.wait(500);
    // // Muitos formulários pedem confirmação de email
    // cy.get('input[placeholder="Confirmar Email"]').type('maria.ferreira.teste@cleanup.com', humanTypingSpeed);

    cy.wait(500);

    cy.wait(1000); 

    // eq(0) pega o PRIMEIRO input password encontrado (Senha)
    cy.get('input[type="password"]').eq(0)
      .type('SenhaSegura@2024', humanTypingSpeed);

    // eq(1) pega o SEGUNDO input password encontrado (Confirmação)
    cy.get('input[type="password"]').eq(1)
      .type('SenhaSegura@2024', humanTypingSpeed);
    // Definição de Segurança

   cy.contains('Sou Cliente').click();


    // 2. Submissão
    cy.intercept('POST', '**/identitytoolkit/**').as('registoManual');
    cy.get('button[type="submit"]').click();    

    // 3. Espera e Cálculo
    cy.wait('@registoManual').then(() => {
      const duration = (Date.now() - startTime) / 1000; // Segundos
      
      cy.log(`---------------------------------------------------`);
      cy.log(`🛑 TEMPO TOTAL REGISTO MANUAL: ${duration} segundos`);
      cy.log(`---------------------------------------------------`);
      
      // Validação: Esperamos que demore bastante (ex: > 15s no teste, representando minutos na vida real)
      expect(duration).to.be.greaterThan(10); 
    });
  });

  // Cenário 2: O Caminho Rápido (Google Auth)
  it('Cenário B: Medir tempo de Login com Google (1 Clique)', () => {
    const startTime = Date.now();

    cy.visit('http://localhost:3000/login');

    // Mock do Google para simular resposta instantânea da API
    cy.intercept('POST', '**/identitytoolkit/**', {
      statusCode: 200,
      body: {
        idToken: 'fake-google-token',
        email: 'maria.google@teste.com',
        localId: 'google-user-123'
      }
    }).as('googleLogin');

    // Apenas 1 clique
    cy.get('.gsi-material-button').click();

    cy.wait('@googleLogin').then(() => {
      const duration = (Date.now() - startTime) / 1000;

      cy.log(`---------------------------------------------------`);
      cy.log(`🚀 TEMPO TOTAL GOOGLE AUTH: ${duration} segundos`);
      cy.log(`---------------------------------------------------`);

      // Validação: Deve ser extremamente rápido
      expect(duration).to.be.lessThan(5);
    });
  });

});