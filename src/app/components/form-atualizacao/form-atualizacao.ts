import { Component, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Indice } from '../../services/indice';

@Component({
  selector: 'app-form-atualizacao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-atualizacao.html',
  styleUrls: ['./form-atualizacao.css']
})
export class FormAtualizacao {
  @Input() resultado: any; // signal vindo do app.ts

  descricao = signal('');
  processo = signal('');
  credor = signal('');
  devedor = signal('');
  valor = signal<number | null>(null);
  dataInicial = signal('');
  dataFinal = signal('');
  indice = signal('IPCA (IBGE)');
  juros = signal<number>(0);
  periodoJuros = signal('mensal');
  tipoJuros = signal('simples');
  multa = signal<number>(0);
  honorarios = signal<number>(0);
  proRata = signal(false)
  indicesDisponiveis: string[] = [];

  constructor(private indiceService: Indice){
    this.indicesDisponiveis = this.indiceService.getIndicesDisponiveis();
  }

  limpar() {
    this.descricao.set('');
    this.processo.set('');
    this.credor.set('');
    this.devedor.set('');
    this.valor.set(null);
    this.dataInicial.set('');
    this.dataFinal.set('');
    this.indice.set('IPCA (IBGE)');
    this.juros.set(0);
    this.periodoJuros.set('mensal');
    this.tipoJuros.set('simples');
    this.multa.set(0);
    this.honorarios.set(0);
    this.resultado.set(null);
  }

  calcular() {
  const valor = Number(this.valor());
  if (!valor) {
    alert("Informe o valor base!");
    return;
  }

  const juros = Number(this.juros());
  const periodo = this.periodoJuros();
  const tipo = this.tipoJuros();
  const multa = Number(this.multa());
  const honorarios = Number(this.honorarios());

  // 🔹 Validação de datas
  const dataInicial = new Date(this.dataInicial());
  const dataFinal = new Date(this.dataFinal());
  if (isNaN(dataInicial.getTime()) || isNaN(dataFinal.getTime())) {
    alert("Informe as datas inicial e final corretamente!");
    return;
  }
  if (dataFinal <= dataInicial) {
    alert("A data final deve ser posterior à data inicial!");
    return;
  }

  // 🔹 Cálculo do tempo decorrido
  const diffMs = dataFinal.getTime() - dataInicial.getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);
  const diffMeses = diffDias / 30.4375;
  const diffAnos = diffMeses / 12;

  let fatorTempo = 0;
  if (this.proRata()) {
    switch (periodo) {
      case 'diario': fatorTempo = diffDias; break;
      case 'mensal': fatorTempo = diffMeses; break;
      case 'anual': fatorTempo = diffAnos; break;
    }
  } else {
    switch (periodo) {
      case 'diario': fatorTempo = Math.ceil(diffDias); break;
      case 'mensal': fatorTempo = Math.ceil(diffMeses); break;
      case 'anual': fatorTempo = Math.ceil(diffAnos); break;
    }
  }

  // 🔹 Busca o fator de correção monetária do Banco Central
  this.indiceService.getFatorAcumulado(this.indice(), this.dataInicial(), this.dataFinal())
    .subscribe(fatorIndice => {
      // fatorIndice = multiplicador de correção (ex: 1.087 -> 8,7% acumulado)
      const valorCorrigido = valor * fatorIndice;

      // 🔹 Aplica juros
      let valorComJuros = valorCorrigido;
      if (juros > 0) {
        if (tipo === 'simples') {
          valorComJuros = valorCorrigido + (valorCorrigido * juros / 100 * fatorTempo);
        } else {
          valorComJuros = valorCorrigido * Math.pow(1 + juros / 100, fatorTempo);
        }
      }

      // 🔹 Multa e honorários
      const valorComMulta = valorComJuros + (valorComJuros * multa / 100);
      const valorFinal = valorComMulta + (valorComMulta * honorarios / 100);

      // 🔹 Atualiza o resultado final
      this.resultado.set({
        descricao: this.descricao(),
        processo: this.processo(),
        credor: this.credor(),
        devedor: this.devedor(),
        valorBase: valor,
        indice: this.indice(),
        fatorIndice: fatorIndice.toFixed(6),
        variacaoPercentual: ((fatorIndice - 1) * 100).toFixed(2) + '%',
        juros,
        periodo,
        tipo,
        multa,
        honorarios,
        diasDecorridos: Math.round(diffDias),
        mesesDecorridos: diffMeses.toFixed(2),
        anosDecorridos: diffAnos.toFixed(2),
        valorAtualizado: valorFinal
      });
    });
}


}
