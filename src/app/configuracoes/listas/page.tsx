"use client";

import GerenciadorLista from "@/components/GerenciadorLista";
import { Card } from "antd";

export default function ConfigurarListas() {
  return (
    <div style={{ padding: 24 }}>
      <Card title="Gerenciamento de Listas" style={{ marginBottom: 20 }}>
        <GerenciadorLista tabela="tipos_produto" nomeCampo="nome" titulo="Tipos de Produto" />
      </Card>

      <Card title="Categorias de Produto" style={{ marginBottom: 20 }}>
        <GerenciadorLista tabela="categorias" nomeCampo="nome" titulo="Categorias de Produto" />
      </Card>

      <Card title="Unidades de Medida">
        <GerenciadorLista tabela="unidades_medida" nomeCampo="nome" titulo="Unidades de Medida" />
      </Card>
    </div>
  );
}
