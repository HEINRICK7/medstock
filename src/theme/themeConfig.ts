import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    fontSize: 16,
    colorPrimary: '#2D89FF', // Azul principal ajustado para o tom da imagem
    colorText: '#1A1A1A', // Cor do texto principal (preto suave)
    colorTextSecondary: '#666666', // Cor para textos secundários (como labels)
    colorBgBase: '#F2F2F2', // Fundo cinza claro
    colorBorder: '#E0E0E0', // Cor das bordas
    borderRadius: 8, // Arredondamento para inputs e botões
    colorBgContainer: '#FFFFFF', // Cor de fundo dos componentes (Cards, inputs)
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', // Sombra um pouco mais pronunciada
    controlHeight: 48, // Altura padrão para inputs e botões
    paddingContentHorizontal: 16, // Padding horizontal para inputs
    paddingContentVertical: 12, // Padding vertical para inputs
  },
  components: {
    Card: {
      paddingLG: 10, // Padding interno do Card (equivalente a 2.5rem)
    },
    Button: {
      borderRadius: 6,
      fontWeight: 500,
    },
    Input: {
      paddingBlock: 12, // Ajuste o padding vertical dos inputs
    },
    Form: {
      marginLG: 24, // Espaçamento entre os itens do formulário
    },
  },
};

export default theme;