import { supabase } from "./supabase";

interface EntradaProduto {
  id?: string;
  nome_produto?: string;
  codigo_barras?: string;
  tipo_produto?: string;
  categoria?: string;
  unidade_medida: string;
  fabricante?: string;
  fornecedor?: string;
  numero_lote?: string;
  descricao?: string;
  data_fabricacao?: string;
  data_validade?: string;
  numero_nota_fiscal?: string;
  quantidade_minima_estoque?: number;
  qunatidade?: number;
  responsavel?: string;
}
interface SaidaProduto {
  produto_id: string;
  codigo_barras: string;
  nome_produto: string;
  unidade_medida: string;
  quantidade: number;
  data_saida: string;
  responsavel: string;
}
/**
 * Busca produtos com estoque baixo ou em falta.
 */

export async function buscarProdutosEstoque(): Promise<EntradaProduto[]> {
  const { data, error } = await supabase.from("estoque_produtos") // 🔹 Mudamos de "produtos" para "estoque_produtos"
    .select(`
      id, 
      nome_produto, 
      codigo_barras, 
      categoria, 
      unidade_medida, 
      quantidade, 
      estoque_minimo, 
      data_validade
    `);

  if (error) {
    console.error("Erro ao buscar produtos em estoque:", error.message);
    return [];
  }

  return data.map((produto) => ({
    id: produto.id,
    nome_produto: produto.nome_produto,
    codigo_barras: produto.codigo_barras,
    categoria: produto.categoria,
    unidade_medida: produto.unidade_medida,
    quantidade: produto.quantidade ?? 0, // 🔹 Aqui era "quantidade", agora usamos "quantidade"
    quantidade_minima_estoque: produto.estoque_minimo ?? 1, // 🔹 Ajustamos para refletir "estoque_minimo"
    data_validade: produto.data_validade || "",
  }));
}
export async function registrarSaidaProduto(produto: SaidaProduto) {
  const { error } = await supabase
    .from("movimentacoes_estoque")
    .insert([
      {
        produto_id: produto.produto_id,
        tipo_movimentacao: "saida",
        codigo_barras: produto.codigo_barras,
        nome_produto: produto.nome_produto,
        unidade_medida: produto.unidade_medida,
        quantidade: produto.quantidade,
        data_entrada: produto.data_saida,
        responsavel: produto.responsavel,
      },
    ]);

  if (error) {
    throw new Error(`Erro ao registrar saída: ${error.message}`);
  }
}