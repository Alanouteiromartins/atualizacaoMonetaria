import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Indice {
  // ✅ Base local da Netlify Function (sem CORS)
  private baseUrl = '/.netlify/functions/indice';

  // 🔹 Índices ativos e mapeados para códigos SGS (Banco Central)
  private codigos: Record<string, number> = {
    'IPCA (IBGE)': 433,
    'INPC (IBGE)': 188,
    'IGP-M (FGV)': 189,
    'IGP-DI (FGV)': 190,
    'INCC-DI (FGV)': 191,
    'IPC-FIPE': 222,
    'ICV-DIEESE': 2857,
    'CUB-SINDUSCON/SP': 7478,
    'Salário mínimo': 1619
  };

  constructor(private http: HttpClient) {}

  /**
   * 🔸 Retorna a lista de índices disponíveis
   */
  getIndicesDisponiveis(): string[] {
    return Object.keys(this.codigos);
  }

  /**
   * 🔸 Formata a data (yyyy-MM-dd → dd/MM/yyyy)
   */
  private formatarData(dataISO: string): string {
    const d = new Date(dataISO);
    if (isNaN(d.getTime())) return '';
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  /**
   * 🔸 Busca as variações mensais de um índice entre duas datas.
   * Usa a função serverless do Netlify para evitar CORS.
   */
  getIndice(nome: string, dataInicial: string, dataFinal: string): Observable<{ data: string; valor: number }[]> {
    const codigo = this.codigos[nome];
    if (!codigo) {
      console.warn(`Índice não encontrado: ${nome}`);
      return of([]);
    }

    const url = `${this.baseUrl}?codigo=${codigo}&dataInicial=${dataInicial}&dataFinal=${dataFinal}`;

    return this.http.get<any[]>(url).pipe(
      map(res =>
        res.map(item => ({
          data: item.data,
          valor: parseFloat(item.valor.replace(',', '.'))
        }))
      ),
      catchError(err => {
        console.error('❌ Erro ao buscar índice:', err);
        return of([]);
      })
    );
  }

  /**
   * 🔸 Calcula o fator acumulado de correção monetária entre as datas.
   * Exemplo: se IPCA total foi +8,64%, o fator retornado será 1.0864
   */
  getFatorAcumulado(nome: string, dataInicial: string, dataFinal: string): Observable<number> {
    const codigo = this.codigos[nome];
    if (!codigo) return of(1);

    const dataInicialFmt = this.formatarData(dataInicial);
    const dataFinalFmt = this.formatarData(dataFinal);
    const url = `${this.baseUrl}?codigo=${codigo}&dataInicial=${dataInicialFmt}&dataFinal=${dataFinalFmt}`;

    return this.http.get<any[]>(url).pipe(
      map(meses => {
        if (!meses.length) return 1;
        const fator = meses.reduce((acc, m) => acc * (1 + m.valor / 100), 1);
        return fator;
      }),
      catchError(err => {
        console.error('❌ Erro ao calcular fator acumulado:', err);
        return of(1);
      })
    );
  }
}
