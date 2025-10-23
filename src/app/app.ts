import { Component, signal } from '@angular/core';
import { FormAtualizacao } from './components/form-atualizacao/form-atualizacao';
import { Resultado } from './components/resultado/resultado';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormAtualizacao, Resultado],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  resultado = signal<any | null>(null);
}
