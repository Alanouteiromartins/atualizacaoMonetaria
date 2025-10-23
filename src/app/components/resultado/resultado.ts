import { Component, effect, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resultado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resultado.html',
  styleUrls: ['./resultado.css']
})
export class Resultado {
  @Input() dados: any;

  constructor(){
    effect(() => {
      const dados = this.dados;

      console.log(dados.valorAtualizado)
    })
  }
}
