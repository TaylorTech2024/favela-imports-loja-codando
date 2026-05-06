FAVELA IMPORTS PE - LOJA ONLINE COMPLETA

O que tem nesta versão:
- Layout premium preto/dourado com logo PNG no topo e início
- Aba Times com todos os kits enviados
- Aba Chinelos/Acessórios com os produtos que faltavam
- Imagens padronizadas sem distorcer o layout
- Animações: entrada, hover, brilho dourado, botão, carrinho e pedido concluído
- Carrinho completo com contador, alteração de quantidade e remoção
- Checkout salvando pedidos no banco SQLite
- Finalização com botão para enviar pedido no WhatsApp da loja
- Consulta de pedido por código
- Painel admin com login para ver pedidos, alterar status, cadastrar produto e controlar estoque

Como rodar:
1. Instale Node.js
2. Abra a pasta do projeto no terminal
3. Rode: npm install
4. Rode: npm start
5. Acesse: http://localhost:3000

Painel admin:
http://localhost:3000/admin.html
Usuário padrão: admin
Senha padrão: 123456

Para mudar login admin:
Crie/edite o arquivo .env:
ADMIN_USER=seu_usuario
ADMIN_PASSWORD=sua_senha
PORT=3000

Banco de dados:
O banco SQLite será criado automaticamente em:
data/loja.sqlite

Observação sobre pagamentos:
O checkout já salva pedidos e permite Pix/Cartão/Dinheiro como forma escolhida.
Para Pix automático/Mercado Pago real, será necessário colocar as credenciais oficiais da conta da loja e ativar o gateway.
