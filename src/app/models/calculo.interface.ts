export interface Calculo {
  valorBase: number;
  dataInicial: Date;
  dataFinal: Date;
  indice: string;
  proRata: boolean;
  juros: number;
  periodoJuros: 'diario' | 'mensal' | 'anual';
  tipoJuros: 'simples' | 'composto';
  multa: number;
  honorarios: number;
}
