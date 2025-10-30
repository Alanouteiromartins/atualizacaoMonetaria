import { Routes } from '@angular/router';
import { FormAtualizacao } from './components/form-atualizacao/form-atualizacao';
import { Teste } from './components/teste/teste';

export const routes: Routes = [
    { path: '', redirectTo: 'atualizacao', pathMatch: 'full' },
    { path: 'atualizacao', component: FormAtualizacao },
    {path: 'teste', component: Teste}
];
