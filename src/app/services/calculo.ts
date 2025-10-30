import { Injectable } from '@angular/core';
import { Calculo } from '../models/calculo.interface';

@Injectable({ providedIn: 'root' })
export class CalculoService {

  calcularFatorTempo(params: Calculo) {
    const diffMs = params.dataFinal.getTime() - params.dataInicial.getTime();
    const diffDias = diffMs / (1000 * 60 * 60 * 24);
    const diffMeses = diffDias / 30.4375;
    const diffAnos = diffMeses / 12;

    if (params.proRata) {
      return {
        fatorTempo: params.periodoJuros === 'diario' ? diffDias :
          params.periodoJuros === 'mensal' ? diffMeses : diffAnos,
        diasExibir: Math.round(diffDias),
        mesesExibir: diffMeses.toFixed(2),
        anosExibir: diffAnos.toFixed(2),
      };
    }

    const di = params.dataInicial;
    const df = params.dataFinal;

    let mesesCheios = (df.getFullYear() - di.getFullYear()) * 12 +
      (df.getMonth() - di.getMonth());

    if (df.getDate() < di.getDate()) {
      mesesCheios -= 1;
    }

    const anosCheios = mesesCheios / 12;
    const diasEquivalentes = mesesCheios * 30.4375;

    return {
      fatorTempo:
        params.periodoJuros === 'mensal' ? mesesCheios :
          params.periodoJuros === 'anual' ? anosCheios :
            diasEquivalentes,

      diasExibir: Math.round(diasEquivalentes),
      mesesExibir: mesesCheios,
      anosExibir: anosCheios.toFixed(2),
    };
  }

  calcularJuros(valorCorrigido: number, params: Calculo) {
    if (params.juros <= 0) return 0;

    // DRCalc: juros contam a partir do dia seguinte
    const inicio = new Date(params.dataInicial);
    inicio.setDate(inicio.getDate() + 1);

    // DRCalc: até o dia da data final inclusive
    const fim = new Date(params.dataFinal);
    fim.setDate(fim.getDate() + 1);

    const diffMs = fim.getTime() - inicio.getTime();
    const diasJuros = diffMs / (1000 * 60 * 60 * 24);

    // Converte dias → meses pró-rata
    const mesesProRata = diasJuros / 30.4375;

    if (params.tipoJuros === 'simples') {
      return valorCorrigido * (params.juros / 100) * mesesProRata;
    }

    const fator = Math.pow(1 + params.juros / 100, mesesProRata);
    return valorCorrigido * (fator - 1);
  }


  calcularMulta(valorCorrigido: number, multa: number) {
    return valorCorrigido * (multa / 100);
  }

  calcularHonorarios(subtotal: number, honorarios: number) {
    return subtotal * (honorarios / 100);
  }
}
