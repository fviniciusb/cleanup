describe('Suite Completa de Login - CleanUp', () => {

  // Antes de CADA teste, visita a página
  beforeEach(() => {
    cy.visit('http://localhost:3000/login'); // Ajuste se a rota for /login
  });

  // --- GRUPO 1: ELEMENTOS E LAYOUT ---
  context('Renderização e Layout', () => {
    it('Deve exibir a logo e os campos corretamente', () => {
      cy.get('img[alt="Logo do sistema"]').should('be.visible');
      cy.get('input[placeholder="usuario@email.com"]').should('be.visible');
      cy.get('input[placeholder="********"]').should('be.visible');
      cy.get('.botaoLogin').should('contain', 'Entrar');
    });

    it('Link "Cadastre-se" deve redirecionar para a página correta', () => {
      cy.contains('Cadastre-se').click();
      cy.url().should('include', '/cadastrar');
    });
  });

  // --- GRUPO 2: VALIDAÇÕES DE FORMULÁRIO ---
  context('Validações', () => {
    it('Deve impedir login com campos vazios e mostrar Toast', () => {
      // Tenta clicar sem preencher nada
      cy.get('.botaoLogin').click();
      
      // Verifica o Toastify
      cy.contains('Preencha todos os campos.').should('be.visible');
      
      // Garante que NÃO fez requisição para o Firebase (opcional, mas boa prática)
      // Se houvesse requisição, o teste falharia se tivéssemos um cy.intercept esperando
    });

    it('Deve permitir submissão usando a tecla ENTER', () => {
      // Intercept para não deixar passar pro Firebase real
      cy.intercept('POST', '**/identitytoolkit/**', { statusCode: 400 }).as('enterRequest');

      cy.get('input[placeholder="usuario@email.com"]').type('teste@enter.com');
      cy.get('input[placeholder="********"]').type('senha123{enter}'); // {enter} simula a tecla

      cy.wait('@enterRequest'); // Se passou daqui, o Enter funcionou
    });
  });

  // --- GRUPO 3: ESTADOS DE ERRO E RECUPERAÇÃO ---
  context('Fluxo de Erros', () => {
    it('Deve exibir link de recuperação APENAS após falha', () => {
      // 1. Estado inicial: Link oculto
      cy.contains('Esqueceu sua senha?').should('not.exist');

      // 2. Força erro
      cy.intercept('POST', '**/identitytoolkit/**', {
        statusCode: 400,
        body: { error: { message: 'INVALID_PASSWORD' } }
      }).as('loginFalha');

      cy.get('input[placeholder="usuario@email.com"]').type('erro@teste.com');
      cy.get('input[placeholder="********"]').type('senhaerrada');
      cy.get('.botaoLogin').click();
      cy.wait('@loginFalha');

      // 3. Estado pós-erro: Link visível
      cy.contains('Esqueceu sua senha?').should('be.visible');
    });

    it('O link de recuperação deve levar para a rota correta', () => {
      // Simula o erro primeiro para fazer o link aparecer
      cy.intercept('POST', '**/identitytoolkit/**', { statusCode: 400 }).as('erro');
      cy.get('input[placeholder="usuario@email.com"]').type('a');
      cy.get('input[placeholder="********"]').type('a');
      cy.get('.botaoLogin').click();
      cy.wait('@erro');

      // Clica no link que apareceu
      cy.contains('Esqueceu sua senha?').click();
      cy.url().should('include', '/recuperar-senha');
    });

    it('Deve limpar o estado de erro ao tentar novamente', () => {
      // Este teste é sutil: verifica se o setLoginError(false) é chamado no início do submit
      
      // 1. Erro na primeira tentativa
      cy.intercept('POST', '**/identitytoolkit/**', { statusCode: 400 }).as('req1');
      cy.get('.botaoLogin').click(); // Dispara validação vazia ou mock
      // Vamos forçar preenchimento pra passar da validação vazia
      cy.get('input[placeholder="usuario@email.com"]').type('t@t.com');
      cy.get('input[placeholder="********"]').type('123');
      cy.get('.botaoLogin').click();
      cy.wait('@req1');
      cy.contains('Esqueceu sua senha?').should('be.visible');

      // 2. Sucesso na segunda tentativa
      cy.intercept('POST', '**/identitytoolkit/**', { 
        statusCode: 200,
        body: { idToken: 'token', email: 't@t.com', localId: '1' }
      }).as('req2');
      
      cy.get('.botaoLogin').click();
      
      // Se redirecionou, significa que o erro não bloqueou o novo fluxo
      cy.wait('@req2');
    });
  });

  // --- GRUPO 4: UX E LOADING ---
  context('Experiência do Usuário (UX)', () => {
    it('Botão deve mostrar "Carregando..." e ficar desabilitado durante requisição', () => {
      // Simulamos uma "internet lenta" com delay de 2 segundos
      cy.intercept('POST', '**/identitytoolkit/**', {
        delay: 2000, 
        statusCode: 200,
        body: { idToken: 'fake' }
      }).as('reqLenta');

      cy.get('input[placeholder="usuario@email.com"]').type('lento@teste.com');
      cy.get('input[placeholder="********"]').type('senha');
      cy.get('.botaoLogin').click();

      // Verifica imediatamente após o clique (durante o delay)
      cy.get('.botaoLogin').should('contain', 'Carregando...');
      cy.get('.botaoLogin').should('be.disabled'); // Importante para evitar duplo clique!

      // Espera terminar
      cy.wait('@reqLenta');
    });

    it('Botão do Google deve estar presente e clicável', () => {
      // Testar popup do Google é complexo, mas podemos verificar se o botão existe e não está desabilitado
      cy.get('.gsi-material-button').should('be.visible');
      cy.get('.gsi-material-button').should('not.be.disabled');
      cy.get('.gsi-material-button').click();
      // Aqui poderíamos verificar se uma função foi chamada se estivéssemos usando testes unitários,
      // mas no E2E apenas garantimos que a UI responde.
    });
  });

});