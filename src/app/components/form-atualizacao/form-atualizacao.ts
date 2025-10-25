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

  constructor(private indiceService: Indice) {
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
    const valorBase = Number(this.valor());
    if (!valorBase) {
      alert("Informe o valor base!");
      return;
    }

    const juros = Number(this.juros());
    const multa = Number(this.multa());
    const honorarios = Number(this.honorarios());
    const tipo = this.tipoJuros();
    const periodo = this.periodoJuros();

    // 🔹 Datas
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
        case 'diario': fatorTempo = Math.floor(diffDias); break;
        case 'mensal': fatorTempo = Math.floor(diffMeses); break;
        case 'anual': fatorTempo = Math.floor(diffAnos); break;
      }
    }

    // 🔹 Busca o fator de correção monetária
    this.indiceService
      .getFatorAcumulado(this.indice(), this.dataInicial(), this.dataFinal(), this.proRata())
      .subscribe(fatorIndice => {

        // ================================
        // 🧮 ETAPA 1: Correção monetária
        // ================================
        const valorCorrigido = valorBase * fatorIndice;
        const variacaoPercentual = (fatorIndice - 1) * 100;

        // ================================
        // 🧮 ETAPA 2: Juros
        // ================================
        let valorJuros = 0;
        if (juros > 0) {
          if (tipo === 'simples') {
            valorJuros = valorCorrigido * (juros / 100) * fatorTempo;
          } else {
            const fatorJuros = Math.pow(1 + juros / 100, fatorTempo);
            valorJuros = valorCorrigido * (fatorJuros - 1);
          }
        }

        // ================================
        // 🧮 ETAPA 3: Multa (sobre o valor corrigido)
        // ================================
        const valorMulta = valorCorrigido * (multa / 100);

        // ================================
        // 🧮 ETAPA 4: Subtotal (corrigido + juros + multa)
        // ================================
        const subtotal = valorCorrigido + valorJuros + valorMulta;

        // ================================
        // 🧮 ETAPA 5: Honorários (sobre subtotal)
        // ================================
        const valorHonorarios = subtotal * (honorarios / 100);
        const valorFinal = subtotal + valorHonorarios;

        // ================================
        // 🧾 Resultado final
        // ================================
        this.resultado.set({
          descricao: this.descricao(),
          processo: this.processo(),
          credor: this.credor(),
          devedor: this.devedor(),
          valorBase,
          indice: this.indice(),
          fatorIndice: fatorIndice.toFixed(6),
          variacaoPercentual: variacaoPercentual.toFixed(4) + '%',
          valorCorrigido,
          valorJuros,
          valorMulta,
          valorHonorarios,
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

        // 🔍 Log opcional
        console.groupCollapsed('💰 [Cálculo detalhado]');
        console.log('Valor base:', valorBase.toFixed(2));
        console.log('Fator índice:', fatorIndice.toFixed(6));
        console.log('Valor corrigido:', valorCorrigido.toFixed(2));
        console.log('Juros:', valorJuros.toFixed(2));
        console.log('Multa:', valorMulta.toFixed(2));
        console.log('Subtotal:', subtotal.toFixed(2));
        console.log('Honorários:', valorHonorarios.toFixed(2));
        console.log('Valor final:', valorFinal.toFixed(2));
        console.groupEnd();
      });
  }
}
