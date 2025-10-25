import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Indice {
  // ✅ Base local da Netlify Function (sem CORS)
  private baseUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.';
  //https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados?formato=json&dataInicial=01/09/2025&dataFinal=30/09/2025

  // 🔹 Índices ativos e mapeados para códigos SGS (Banco Central)
  private codigos: Record<string, number> = {
    'IPCA (IBGE)': 433,
    'INPC (IBGE)': 188,
    'IGP-M (FGV)': 189,
    'IGP-DI (FGV)': 190,
    'INCC-DI (FGV)': 1178,
    'IPC-FIPE': 222,
    'ICV-DIEESE': 2857,
    'CUB-SINDUSCON/SP': 11426,
    'Salário mínimo': 1619
  };

  constructor(private http: HttpClient) { }

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
      console.warn(`[IndiceService] Índice não encontrado: ${nome}`);
      return of([]);
    }

    const dataInicialFmt = this.formatarData(dataInicial);
    const dataFinalFmt = this.formatarData(dataFinal);
    const url = `${this.baseUrl}${codigo}/dados?formato=json&dataInicial=${dataInicialFmt}&dataFinal=${dataFinalFmt}`;

    return this.http.get<any[]>(url).pipe(
      tap(raw => {
        console.groupCollapsed(`[IndiceService:getIndice] ${nome} (${codigo})`);
        console.log('URL:', url);
        console.log('Datas (enviadas p/ API):', { dataInicialFmt, dataFinalFmt });
        console.log('Payload bruto (API):', raw);
        console.groupEnd();
      }),
      map(res => res.map(item => ({
        data: item.data,                                      // string dd/MM/yyyy (sempre “01/MM/AAAA” no SGS)
        valor: parseFloat(String(item.valor).replace(',', '.')) // número em %
      }))),
      tap(parsed => {
        console.groupCollapsed(`[IndiceService:getIndice] Parsed ${nome} (${codigo})`);
        console.table(parsed); // data | valor
        // Observação útil:
        console.info('⚠️ Cada data "01/MM/AAAA" na API representa a variação do mês ANTERIOR.');
        console.groupEnd();
      }),
      catchError(err => {
        console.error('❌ Erro ao buscar índice:', err, { url });
        return of([]);
      })
    );
  }


  /**
   * 🔸 Calcula o fator acumulado de correção monetária entre as datas.
   * Exemplo: se IPCA total foi +8,64%, o fator retornado será 1.0864
   */
  getFatorAcumulado(
    nome: string,
    dataInicial: string,
    dataFinal: string,
    proRata: boolean = false
  ): Observable<number> {
    const codigo = this.codigos[nome];
    if (!codigo) return of(1);

    const parseISO = (s: string) => {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, (m || 1) - 1, d || 1);
    };
    const ddmmyyyy = (d: Date) => {
      if (!d || isNaN(d.getTime())) return '';
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();
      return `${dia}/${mes}/${ano}`;
    };
    const firstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDayOfPrevMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 0);
    const firstDayOfNextMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const iniUser = parseISO(dataInicial);
    const fimUser = parseISO(dataFinal);
    if (isNaN(iniUser.getTime()) || isNaN(fimUser.getTime())) {
      console.error('❌ Datas inválidas recebidas:', dataInicial, dataFinal);
      return of(1);
    }

    // Ajusta o fim conforme pró-rata
    // ===== Intervalo de consulta à API =====
    const fimMesConsiderado = proRata ? fimUser : lastDayOfPrevMonth(fimUser);

    // antes: +1  → faltava 1 mês
    const apiStart = firstDayOfMonth(new Date(iniUser.getFullYear(), iniUser.getMonth() - 1, 1));
    const apiEnd = new Date(fimMesConsiderado.getFullYear(), fimMesConsiderado.getMonth() + 2, 1);


    const dataInicialFmt = ddmmyyyy(apiStart);
    const dataFinalFmt = ddmmyyyy(apiEnd);
    if (!dataInicialFmt || !dataFinalFmt) {
      console.error('❌ Datas formatadas inválidas:', apiStart, apiEnd);
      return of(1);
    }

    const url = `${this.baseUrl}${codigo}/dados?formato=json&dataInicial=${dataInicialFmt}&dataFinal=${dataFinalFmt}`;

    return this.http.get<any[]>(url).pipe(
      tap(raw => {
        console.groupCollapsed(`[IndiceService:getFatorAcumulado] ${nome} (${codigo})`);
        console.log('URL:', url);
        console.log('Pró-rata?', proRata);
        console.log('Data inicial enviada:', dataInicialFmt);
        console.log('Data final enviada:', dataFinalFmt);
        console.log('Payload bruto (API):', raw);
        console.groupEnd();
      }),
      map(raw => {
        if (!raw || !raw.length) return 1;
        const parsed = raw.map(m => {
          const [dia, mes, ano] = String(m.data).split('/').map(Number);
          return {
            data: new Date(ano, mes - 1, dia),
            valorNum: parseFloat(String(m.valor).replace(',', '.'))
          };
        });

        console.groupCollapsed(`[IndiceService:getFatorAcumulado] Dados normalizados ${nome}`);
        console.table(parsed.map(p => ({ data: ddmmyyyy(p.data), valor: p.valorNum })));
        console.groupEnd();


        const inicioEfetivo = new Date(iniUser.getFullYear(), iniUser.getMonth(), 1);
        const fimEfetivo = new Date(fimMesConsiderado.getFullYear(), fimMesConsiderado.getMonth(), 1);



        const dentro = parsed.filter(p => p.data >= inicioEfetivo && p.data <= fimEfetivo);

        console.groupCollapsed(`[IndiceService:getFatorAcumulado] Filtro final`);
        console.log('Início efetivo:', ddmmyyyy(inicioEfetivo));
        console.log('Fim efetivo:', ddmmyyyy(fimEfetivo));
        console.table(dentro.map(p => ({ data: ddmmyyyy(p.data), valor: p.valorNum })));
        console.groupEnd();

        if (!dentro.length) return 1;
        const fator = dentro.reduce((acc, p) => acc * (1 + p.valorNum / 100), 1);
        console.log(`[IndiceService:getFatorAcumulado] Fator acumulado calculado:`, fator);
        return fator;
      }),
      catchError(err => {
        console.error('❌ Erro ao calcular fator acumulado:', err, { url });
        return of(1);
      })
    );
  }




}
