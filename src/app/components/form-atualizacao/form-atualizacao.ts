import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Indice } from '../../services/indice';
import { Resultado } from '../resultado/resultado';
import { CalculoService } from '../../services/calculo';
import { Calculo } from '../../models/calculo.interface';

@Component({
  selector: 'app-form-atualizacao',
  standalone: true,
  imports: [CommonModule, Resultado],
  templateUrl: './form-atualizacao.html',
  styleUrls: ['./form-atualizacao.css']
})
export class FormAtualizacao {
  resultado = signal<any | null>(null);

  descricao = signal('');
  processo = signal('');
  credor = signal('');
  devedor = signal('');
  valor = signal<number | null>(null);
  dataInicial = signal('');
  dataFinal = signal('');
  indice = signal('IPCA (IBGE)');
  juros = signal<number | null>(null);
  periodoJuros = signal<'diario' | 'mensal' | 'anual'>('mensal');
  tipoJuros = signal<'simples' | 'composto'>('simples');
  multa = signal<number | null>(null);
  honorarios = signal<number | null>(null);
  proRata = signal(false)
  indicesDisponiveis: string[] = [];

  constructor(private indiceService: Indice, private calculoService: CalculoService) {
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
  const params: Calculo = {
    valorBase: Number(this.valor()),
    dataInicial: new Date(this.dataInicial()),
    dataFinal: new Date(this.dataFinal()),
    indice: this.indice(),
    proRata: this.proRata(),
    juros: Number(this.juros()),
    periodoJuros: this.periodoJuros(),
    tipoJuros: this.tipoJuros(),
    multa: Number(this.multa()),
    honorarios: Number(this.honorarios())
  };

  if (!params.valorBase) return alert("Informe o valor base!");
  if(isNaN(params.dataInicial.getTime()) || isNaN(params.dataFinal.getTime())) return alert("Informe as datas")

  this.indiceService.getFatorAcumulado(params.indice, this.dataInicial(), this.dataFinal(), false)
    .subscribe(fatorIndice => {

      const valorCorrigido = params.valorBase * fatorIndice;
      const { fatorTempo, diasExibir, mesesExibir, anosExibir } = this.calculoService.calcularFatorTempo(params);

      const valorJuros = this.calculoService.calcularJuros(valorCorrigido, params);
      const valorMulta = this.calculoService.calcularMulta(valorCorrigido, params.multa);

      const subtotal = valorCorrigido + valorJuros + valorMulta;
      const valorHonorarios = this.calculoService.calcularHonorarios(subtotal, params.honorarios);
      const valorFinal = subtotal + valorHonorarios;

      this.resultado.set({
        ...params,
        fatorIndice,
        valorCorrigido,
        valorJuros,
        valorMulta,
        valorHonorarios,
        diasDecorridos: diasExibir,
        mesesDecorridos: mesesExibir,
        anosDecorridos: anosExibir,
        valorAtualizado: valorFinal,
        variacaoPercentual: (((fatorIndice - 1) * 100).toFixed(6)) + '%'
      });
    });
}



  valorFormatado = computed(() => {
    if (this.valor() == null) return '';
    return this.valor()?.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  });

  onValorInput(event: any) {
    let raw = event.target.value;

    // Remove tudo que não for número
    raw = raw.replace(/[^\d]/g, '');

    // Converte p/ centavos → número
    const numero = Number(raw) / 100;

    // Atualiza signal
    this.valor.set(numero);

    // Reescreve formatado no input
    event.target.value = this.valorFormatado();
  }
}
