import { useState } from "react";
import { Select, InputNumber, Space, Button } from "antd";

const { Option } = Select;

interface Medicamento {
  id: string;
  nome: string;
  quantidade_disponivel: number;
}

interface MedicamentoSelectorProps {
  medicamentos: Medicamento[];
  onChange?: (value: { produto_id: string; quantidade: number }[]) => void;
}

export default function MedicamentoSelector({ medicamentos, onChange }: MedicamentoSelectorProps) {
  const [itensSelecionados, setItensSelecionados] = useState<
    { produto_id: string; quantidade: number }[]
  >([]);

  const handleMedicamentoChange = (produto_id: string, quantidade: number) => {
    const novoItens = [...itensSelecionados];
    const index = novoItens.findIndex((item) => item.produto_id === produto_id);

    if (index !== -1) {
      novoItens[index].quantidade = quantidade;
    } else {
      novoItens.push({ produto_id, quantidade });
    }

    setItensSelecionados(novoItens);
    if (onChange) onChange(novoItens);
  };

  const removerMedicamento = (produto_id: string) => {
    const novoItens = itensSelecionados.filter((item) => item.produto_id !== produto_id);
    setItensSelecionados(novoItens);
    if (onChange) onChange(novoItens);
  };

  return (
    <div>
      {itensSelecionados.map((item) => (
        <Space key={item.produto_id} style={{ display: "flex", marginBottom: 8 }}>
          <Select value={item.produto_id} disabled style={{ width: 200 }}>
            {medicamentos.map((med) => (
              <Option key={med.id} value={med.id}>
                {med.nome} (Disp: {med.quantidade_disponivel})
              </Option>
            ))}
          </Select>
          <InputNumber
            min={1}
            max={medicamentos.find((med) => med.id === item.produto_id)?.quantidade_disponivel || 1}
            value={item.quantidade}
            onChange={(value) => handleMedicamentoChange(item.produto_id, value || 1)}
          />
          <Button type="primary" danger onClick={() => removerMedicamento(item.produto_id)}>
            Remover
          </Button>
        </Space>
      ))}

      <Select
        placeholder="Selecione um medicamento"
        onChange={(value) => handleMedicamentoChange(value, 1)}
        style={{ width: "100%", marginBottom: 8 }}
      >
        {medicamentos
          .filter((med) => !itensSelecionados.some((item) => item.produto_id === med.id))
          .map((med) => (
            <Option key={med.id} value={med.id}>
              {med.nome} (Disp: {med.quantidade_disponivel})
            </Option>
          ))}
      </Select>
    </div>
  );
}
