import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {

  open = false;

  toggleMenu() {
    console.log(this.open);
    this.open = !this.open;
    console.log("depois de clicado",this.open);
  }

  
}
