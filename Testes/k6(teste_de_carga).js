import http from 'k6/http';
import { check, sleep } from 'k6';

// Configurações do Teste (Cenário do CleanUp)
export const options = {
  // Define os estágios de carga de usuários
  stages: [
    { duration: '30s', target: 50 },   // Aquecimento: sobe para 50 usuários em 30s
    { duration: '1m', target: 1000 },  // Carga Pesada: sobe para 1000 usuários (Simulação do Relatório)
    { duration: '30s', target: 0 },    // Resfriamento: desce para 0 usuários
  ],

  // Critérios de Aceitação (Baseados no seu texto)
  thresholds: {
    // "Latência média inferior a 2 segundos" (2000ms)
    // p(95) significa: 95% das requisições devem ser mais rápidas que 2s
    http_req_duration: ['avg<2000', 'p(95)<2000'], 
    
    // Taxa de falha deve ser menor que 1% (sucesso > 99%)
    http_req_failed: ['rate<0.01'], 
  },
};

export default function () {
  // 1. Simula uma chamada à sua Cloud Function ou API do Firebase
  // Troque pela URL real da sua função de listagem de serviços ou login
  const res = http.get('https://cleanup-af26e.web.app/');

  // 2. Verificações (Checks) - Isso não falha o teste, apenas conta nos stats
  check(res, {
    'status é 200': (r) => r.status === 200,
    'tempo resposta < 2s': (r) => r.timings.duration < 2000,
  });

  // 3. Pausa aleatória entre 1s e 3s (Simula comportamento humano ("Think Time"))
  // Isso é importante para não fazer um ataque DDoS irrealista
  sleep(1);
}