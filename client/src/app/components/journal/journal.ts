import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './journal.html',
  styleUrl: './journal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalComponent {
  featuredStory = {
    title: 'How Watchera Tests Precision Before Every Dispatch',
    category: 'Craftsmanship',
    excerpt:
      'Every movement is regulated, inspected, and tested through multi-point quality checks before shipping.',
    image:
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=1800&auto=format&fit=crop'
  };

  stories = [
    {
      title: 'Choosing Your First Mechanical Watch',
      category: 'Guide',
      excerpt: 'A practical guide to movement type, case size, and daily wear factors.',
      readTime: '6 min read'
    },
    {
      title: 'Watch Care for Indian Climate Conditions',
      category: 'Care',
      excerpt:
        'Humidity, dust, and heat can affect long-term performance. Here is the maintenance schedule we recommend.',
      readTime: '5 min read'
    },
    {
      title: 'Inside the Design Language of Mariner',
      category: 'Design',
      excerpt: 'From bezel profile to dial depth, the details that define the Mariner identity.',
      readTime: '4 min read'
    },
    {
      title: 'Best Everyday Watch Pairings for Formal Wear',
      category: 'Style',
      excerpt: 'A quick pairing guide for office, weddings, and festive occasions.',
      readTime: '3 min read'
    }
  ];
}
