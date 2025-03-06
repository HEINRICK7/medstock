## TESTE SISTEMA

============================= TESTE SISTEMA =====================================

### ENTRADA: Tela Cadastro:

- [x] Campos: Quantidade Recebida / Qnt. Mínima em Estoque / Número da Nota Fiscal => Agora aceitam apenas valores numéricos.
- [x] Exemplo: **Os campos agora aceitam apenas números, impedindo a entrada de strings.**
- [x] Adicionar busca nos selects como mencionado por vocês nas conversas anteriores.
- [x] Remover ou traduzir mensagem de erro dos campos de cadastro.
  - _Mensagem corrigida:_ "Por favor, insira um valor válido"
- [x] Traduzir placeholder.

============================= ====================================================

### ENTRADA: Tela Listar:

- [x] Filtro por produto -> Ele ir filtrando ao começar a digitar (Todos devem avaliar essa situação), acho mais viável do que digitar e só depois dar um clique no botão de filtrar.
- [x] Ao selecionar a categoria, ele já filtrar sem ter que acionar o botão de filtro.
- [x] Ao selecionar a data, ele já filtrar sem ter que acionar o botão de filtro.
- [x] Formato da data está YYYY/MM/DD, alterar para DD/MM/YYYY -> _Mencionado antes pelo Jeremy._
- [x] Ao procurar um produto que não existe, alterar para "Produto não encontrado". Hoje está "NO DATA".
- [x] Ao procurar uma data que não existe produtos com as datas escolhidas, alterar para "Produto não encontrado". Hoje está "NO DATA".
- [ ] Adicionar tooltip nos ícones de Ações.
- [x] Os nomes compostos na categoria estão vindo separados por "_", sendo que o campo é um select.
- [x] Data de entrada na tabela resumo está no formato americano (YYYY/MM/DD), alterar para DD/MM/YYYY.
- [x] Se possível, adicionar quantidade de linhas a serem exibidas por página.
x  - _Exemplo:_ Cadastrei um produto e ele foi para o último da lista.
- [x] **Relatório de produto:** Não tem as informações de origem quando gero o PDF, como demonstrado na tela do sistema.
- [x] **Botão de deletar não está deletando.**
  - Ao deletar, deve aparecer uma caixinha perguntando se tem certeza que quer deletar.
  - _(Sugestão)_ Seria bom pensar em algo que não delete, apenas desabilite o produto da lista, mas que mantenhamos o registro e principalmente o controle do usuário que executou a ação.
- [x] A gente vai precisar da data de fabricação do produto? Não seria melhor a data de vencimento?
- [x] Verificar os campos de data, pelo que parece eles estão aceitando datas anteriores ao dia de hoje em todos os campos. Acho que a data de entrada não pode aceitar datas anteriores à data do dia do cadastro.

============================= ====================================================

### SAÍDA: Cadastrar

- [ ] Criar tela de cadastro de Destino, caso contrário, teremos que cadastrar para cliente.
- [x] Campo data aceitando datas anteriores ao dia de hoje.
- [x] Acho que seria bom uma coluna com usuário que executou a ação de saída do produto, assim como já tem no PDF, com isso adicionaria mais um filtro por usuário.
- [x] Opção de definir a quantidade de linhas a serem exibidas por página.

============================= ====================================================

### ESTOQUE: Tela Estoque

- [x] Botão Navbar sobrepondo filtro de categoria.
- [x] Adicionar busca no filtro de categoria.

