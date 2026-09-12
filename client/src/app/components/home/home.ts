import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  NgZone
} from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';

interface HeroSlide {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  image: string;
  position?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnDestroy {
  private products = inject(ProductService);
  private ngZone = inject(NgZone);
  private autoSliderId?: number | ReturnType<typeof setInterval>;
  private isBrowser: boolean;

  slides: HeroSlide[] = [
    {
      title: "Precision for India's Modern Collectors",
      subtitle: 'Explore contemporary Swiss-inspired watchmaking refined for Indian lifestyle and style.',
      cta: 'Explore Collections',
      link: '/collections',
      image: 'https://i.pinimg.com/1200x/9a/b1/2c/9ab12cc297b2da1203cf11e0e9d7012e.jpg?q=80&w=2200&auto=format&fit=crop',
      position: 'center'
    },
    {
      title: 'Mariner Series for Everyday Power',
      subtitle: 'Water-ready engineering, clean dial language, and handcrafted finishing in every detail.',
      cta: 'Shop Mariner',
      link: '/collections/Men',
      image: 'https://i.pinimg.com/736x/aa/ce/81/aace812c9d0b336d6dff53df74f38546.jpg?q=80&w=2200&auto=format&fit=crop',
      position: 'center'
    },
    {
      title: 'Celestial Icons for Elevated Evenings',
      subtitle: 'Slim profiles, warm metal tones, and elegant proportions for timeless dressing.',
      cta: 'Shop Women',
      link: '/collections/Women',
      image: 'https://i.pinimg.com/1200x/3e/ac/dc/3eacdc1da3a9e119ce98d5087033b919.jpg?q=80&w=2200&auto=format&fit=crop',
      position: 'center'
    }
  ];

  // Added High-End Brands Array
  brands = [
    { name: 'Rolex', image: 'https://i.pinimg.com/1200x/ba/7c/36/ba7c3630c53e0536c7f0b409504317f1.jpg?q=80&w=500&auto=format&fit=crop' },
    { name: 'Casio', image: 'https://i.pinimg.com/736x/92/85/ba/9285ba97ab443472e2a4ced35adf0aba.jpg?q=80&w=500&auto=format&fit=crop'},
    { name: 'Patek Philippe', image: 'https://i.pinimg.com/736x/11/df/bd/11dfbddf7638ee12339da7a7b6fbedb7.jpg?q=80&w=500&auto=format&fit=crop' },
    { name: 'Omega', image: 'https://i.pinimg.com/736x/ff/df/ac/ffdfac6a0b250535677391c59645c936.jpg?q=80&w=500&auto=format&fit=crop' },
    { name: 'Fossil', image: 'https://i.pinimg.com/736x/76/06/b1/7606b15ea8243b30adaea63c8e362db3.jpg?q=80&w=500&auto=format&fit=crop' },
    { name: 'Cartier', image: 'https://i.pinimg.com/736x/44/ed/57/44ed5720ddf5371ce4e27cf2c70fb798.jpg?q=80&w=500&auto=format&fit=crop' },
    { name: 'Breitling', image: 'https://i.pinimg.com/1200x/a8/ea/92/a8ea92326305669b32c91ef12d326b85.jpg?q=80&w=500&auto=format&fit=crop' },
    { name: 'Tag Heuer', image: 'https://i.pinimg.com/736x/9f/3f/25/9f3f25aeaa84a34137cea5802968f0f6.jpg?q=80&w=500&auto=format&fit=crop' },
    { name: 'Seiko', image: 'https://i.pinimg.com/736x/da/c1/92/dac192eae7491abde174f3cb36dd59db.jpg?q=80&w=500&auto=format&fit=crop' },
  ];

  activeSlide = signal(0);

  newArrivals = computed(() => {
    const arrivals = this.products.products().filter((product) => product.isNewArrival);
    return arrivals.length > 0 ? arrivals.slice(0, 4) : this.products.products().slice(0, 4);
  });

  bestSellers = computed(() => {
    const best = this.products.products().filter((product) => product.isBestSeller);
    return best.length > 0 ? best.slice(0, 4) : this.products.products().slice(0, 4);
  });

  categories = [
    {
      title: 'Men',
      description: 'Performance-first silhouettes with mechanical depth.',
      link: '/collections/Men',
      image: 'https://i.pinimg.com/736x/76/b4/54/76b4546824560d01c0b83d2b98b9bb07.jpg?q=80&w=1400&auto=format&fit=crop'
    },
    {
      title: 'Women',
      description: 'Balanced, expressive designs with premium materials.',
      link: '/collections/Women',
      image: 'https://i.pinimg.com/736x/d6/e3/c3/d6e3c3284d82069227cd45bdca4521fc.jpg?q=80&w=1400&auto=format&fit=crop'
    },
    {
      title: 'All Collections',
      description: 'See every Watchera release in one complete catalogue.',
      link: '/collections',
      image: 'https://i.pinimg.com/736x/a5/1c/42/a51c422de81283ad1436b47260c1231b.jpg?q=80&w=1400&auto=format&fit=crop'
    }
  ];

  trustPoints = [
    {
      title: 'Verified Authenticity',
      description: 'Every watch includes invoice, serial verification, and official support access.'
    },
    {
      title: 'Pan India Delivery',
      description: 'Insured delivery coverage with careful packaging and secure handling.'
    },
    {
      title: 'Concierge Assistance',
      description: 'Dedicated support for product advice, gifting, servicing, and upgrades.'
    }
  ];

  editorialStories = [
    {
      title: 'How to Choose Your First Luxury Watch',
      excerpt: 'Case size, movement, and everyday wear guidance for first-time buyers.',
      image: 'https://i.pinimg.com/1200x/a5/14/b8/a514b8163483e0acb97559b3236ab08d.jpg?q=80&w=1400&auto=format&fit=crop'
    },
    {
      title: 'Care Guide for Automatic Movements',
      excerpt: 'Best practices to maintain precision and durability in Indian conditions.',
      image: 'https://i.pinimg.com/736x/c3/7a/84/c37a8441b798d917defa413de43a72a6.jpg?q=80&w=1400&auto=format&fit=crop'
    }
  ];

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.ngZone.runOutsideAngular(() => {
        this.autoSliderId = setInterval(() => {
          this.ngZone.run(() => this.nextSlide());
        }, 5500);
      });
    }
  }

  ngOnDestroy() {
    if (this.autoSliderId && typeof window !== 'undefined') {
      clearInterval(this.autoSliderId as number);
    }
  }

  goToSlide(index: number) {
    this.activeSlide.set(index);
  }

  nextSlide() {
    this.activeSlide.update((index) => (index + 1) % this.slides.length);
  }

  previousSlide() {
    this.activeSlide.update((index) => (index - 1 + this.slides.length) % this.slides.length);
  }
}