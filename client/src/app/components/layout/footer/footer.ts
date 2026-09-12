import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  email = signal('');
  subscribed = signal(false);

  onSubscribe() {
    const value = this.email().trim();
    if (!value) {
      return;
    }

    this.subscribed.set(true);
    this.email.set('');
  }
}
