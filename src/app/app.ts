import { Component, signal } from '@angular/core';
import { Resultado } from './components/resultado/resultado';
import { Header } from "./components/header/header";
import { RouterOutlet } from '@angular/router';
import { FormAtualizacao } from './components/form-atualizacao/form-atualizacao';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Resultado, Header, RouterOutlet, FormAtualizacao],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  
}
