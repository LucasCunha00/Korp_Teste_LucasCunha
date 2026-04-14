export interface ItemNota {
  produtoId: number;
  produtoDescricao: string;
  quantidade: number;
}

export interface NotaFiscal {
  id?: number;
  numeracao?: number;
  status?: string;
  criadaEm?: string;
  itens: ItemNota[];
}
