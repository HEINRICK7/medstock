import { supabase } from "./supabase";
import dayjs from "dayjs";

interface Produto {
  id: string;
  nome_produto: string;
  codigo_barras: string;
  tipo_produto: string;
  categoria: string;
  unidade_medida: string;
  fabricante?: string;
  fornecedor?: string;
  numero_lote?: string;
  descricao?: string;
  data_fabricacao?: string;
  data_validade?: string;
  quantidade_recebida: number;
  numero_nota_fiscal?: string;
  quantidade_minima_estoque: number;
  data_entrada: string;
  responsavel: string;
}
/**
 * Busca produtos com estoque baixo ou em falta.
 */
export async function buscarProdutosEstoqueBaixo(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select(
      "id, nome_produto, codigo_barras, tipo_produto, categoria, unidade_medida, fabricante, fornecedor, numero_lote, descricao, data_fabricacao, data_validade, quantidade_recebida, numero_nota_fiscal, quantidade_minima_estoque, data_entrada, responsavel"
    );

  if (error) {
    console.error("Erro ao buscar produtos com estoque baixo:", error.message);
    return [];
  }

  return data.map((produto) => ({
    id: produto.id,
    nome_produto: produto.nome_produto,
    codigo_barras: produto.codigo_barras,
    tipo_produto: produto.tipo_produto || "",
    categoria: produto.categoria,
    unidade_medida: produto.unidade_medida || "",
    fabricante: produto.fabricante || "",
    fornecedor: produto.fornecedor || "",
    numero_lote: produto.numero_lote || "",
    descricao: produto.descricao || "",
    data_fabricacao: produto.data_fabricacao || "",
    data_validade: produto.data_validade || "",
    quantidade_recebida: produto.quantidade_recebida ?? 0,
    numero_nota_fiscal: produto.numero_nota_fiscal || "",
    quantidade_minima_estoque: produto.quantidade_minima_estoque ?? 0,
    data_entrada: produto.data_entrada || "",
    responsavel: produto.responsavel || "",
  }));
}

/**
 * Busca produtos com data de validade próxima.
 * Consideramos vencendo os produtos com menos de 30 dias para expirar.
 */
export async function buscarProdutosProximosVencimento(): Promise<Produto[]> {
  const { data, error } = await supabase.from("produtos").select("*");

  if (error) {
    console.error(
      "Erro ao buscar produtos próximos do vencimento:",
      error.message
    );
    return [];
  }

  const hoje = dayjs();
  const produtosVencendo = data.filter((produto) => {
    if (!produto.data_validade) return false; // Se não tem validade, ignora
    const diasParaVencer = dayjs(produto.data_validade).diff(hoje, "day");
    return diasParaVencer <= 30 && diasParaVencer >= 0; // Vencendo nos próximos 30 dias
  });

  return produtosVencendo;
}
