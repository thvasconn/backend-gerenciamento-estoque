const { PrismaClient } = require('@prisma/client');

console.log('Iniciando script de teste...');

// Adicione um timeout para garantir que não fique preso indefinidamente
setTimeout(() => {
  console.error('TIMEOUT: O script demorou muito para executar. Provavelmente há um problema de conexão com o MongoDB.');
  process.exit(1);
}, 10000); // 10 segundos

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

console.log('PrismaClient inicializado');

async function main() {
  console.log('Função main iniciada');
  
  try {
    console.log('Tentando conectar ao MongoDB...');
    console.log('URL do banco de dados:', process.env.DATABASE_URL);
    
    // Tenta listar produtos para testar a conexão
    console.log('Tentando listar produtos...');
    const products = await prisma.product.findMany({
      take: 1 // Limita a 1 resultado para ser rápido
    });
    
    console.log('Conexão bem-sucedida!');
    console.log('Produtos encontrados:', products.length);
    
  } catch (error) {
    console.error('ERRO CAPTURADO:');
    console.error(error);
  } finally {
    console.log('Tentando desconectar...');
    await prisma.$disconnect();
    console.log('Desconectado. Script finalizado.');
  }
}

// Captura erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('Chamando função main...');
main()
  .then(() => {
    console.log('Script concluído com sucesso');
    process.exit(0);
  })
  .catch(e => {
    console.error('Erro na execução do main:', e);
    process.exit(1);
  });

console.log('Script iniciado. Aguardando conclusão...');