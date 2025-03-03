import { supabase } from "./supabase";
import dayjs from "dayjs";

/**
 * Busca produtos com estoque baixo ou em falta.
 */
export async function buscarProdutosEstoqueBaixo() {
  const { data, error } = await supabase
    .from("produtos")
    .select("id, nome_produto, codigo_barras, categoria, quantidade_recebida, quantidade_minima_estoque, data_validade");

  if (error) {
    console.error("Erro ao buscar produtos com estoque baixo:", error.message);
    return [];
  }

  return data.filter(
    (produto) =>
      produto.quantidade_recebida <= produto.quantidade_minima_estoque || produto.quantidade_recebida === 0
  );
}

/**
 * Busca produtos com data de validade próxima.
 * Consideramos vencendo os produtos com menos de 30 dias para expirar.
 */
export async function buscarProdutosProximosVencimento() {
  const { data, error } = await supabase
    .from("produtos")
    .select("*");

  if (error) {
    console.error("Erro ao buscar produtos próximos do vencimento:", error.message);
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
