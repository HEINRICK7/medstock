"use client";

import { useEffect, useState } from "react";
import { Select, Button, Modal, Input, message, Table, Switch } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

const { Option } = Select;

interface GerenciadorListaProps {
  tabela: string;
  nomeCampo: string;
  label: string;
  valorSelecionado?: string;
  onSelecionar: (valor: string) => void;
}

export default function GerenciadorLista({
  tabela,
  nomeCampo,
  label,
  valorSelecionado,
  onSelecionar,
}: GerenciadorListaProps) {
  const [itens, setItens] = useState<{ id: number; nome: string; ativo: boolean }[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [novoItem, setNovoItem] = useState("");
  const [editando, setEditando] = useState<{ id: number; nome: string } | null>(null);

  // Carregar lista ao abrir o select
  const carregarItens = async () => {
    const { data, error } = await supabase.from(tabela).select("*");
    if (error) {
      message.error(`Erro ao carregar ${label.toLowerCase()}`);
    } else {
      setItens(data || []);
    }
  };

  // Adicionar ou editar um item
  const salvarItem = async () => {
    if (!novoItem.trim()) {
      message.warning("O nome não pode ser vazio!");
      return;
    }

    let erro = null;
    if (editando) {
      // Editar
      const { error } = await supabase.from(tabela).update({ nome: novoItem.trim() }).eq("id", editando.id);
      erro = error;
    } else {
      // Adicionar novo
      const { error } = await supabase.from(tabela).insert([{ nome: novoItem.trim(), ativo: true }]);
      erro = error;
    }

    if (erro) {
      message.error(`Erro ao salvar: ${erro.message}`);
    } else {
      message.success(`Item salvo com sucesso!`);
      setModalVisivel(false);
      setNovoItem("");
      setEditando(null);
      carregarItens();
    }
  };

  // Ativar/Inativar item
  const alternarAtivo = async (id: number, ativo: boolean) => {
    const { error } = await supabase.from(tabela).update({ ativo }).eq("id", id);
    if (error) {
      message.error(`Erro ao atualizar status: ${error.message}`);
    } else {
      message.success(`Item ${ativo ? "ativado" : "inativado"}!`);
      carregarItens();
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Select
          placeholder={`Selecione ${label}`}
          value={valorSelecionado}
          onChange={onSelecionar}
          onFocus={carregarItens}
          style={{ flex: 1 }}
        >
          {itens.filter((item) => item.ativo).map((item) => (
            <Option key={item.id} value={item.nome}>
              {item.nome}
            </Option>
          ))}
        </Select>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisivel(true)}
        />
      </div>

      {/* Modal para adicionar/editar itens */}
      <Modal
        title={editando ? `Editar ${label}` : `Adicionar ${label}`}
        open={modalVisivel}
        onOk={salvarItem}
        onCancel={() => {
          setModalVisivel(false);
          setEditando(null);
        }}
      >
        <Input
          placeholder={`Digite o nome do ${label.toLowerCase()}`}
          value={novoItem}
          onChange={(e) => setNovoItem(e.target.value)}
        />

        <Table
          dataSource={itens}
          rowKey="id"
          style={{ marginTop: 16 }}
          pagination={{ pageSize: 5 }}
          columns={[
            { title: "Nome", dataIndex: "nome", key: "nome" },
            {
              title: "Ativo",
              key: "ativo",
              align: "center",
              render: (_, record) => (
                <Switch
                  checked={record.ativo}
                  onChange={(checked) => alternarAtivo(record.id, checked)}
                />
              ),
            },
            {
              title: "Ações",
              key: "acoes",
              align: "center",
              render: (_, record) => (
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditando(record);
                    setNovoItem(record.nome);
                    setModalVisivel(true);
                  }}
                />
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
}
