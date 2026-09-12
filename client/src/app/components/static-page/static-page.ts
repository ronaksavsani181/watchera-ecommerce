import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface StaticSection {
  title: string;
  description: string;
  bullets?: string[];
}

interface StaticHighlight {
  title: string;
  value: string;
}

interface StaticPageContent {
  eyebrow: string;
  title: string;
  intro: string;
  heroImage: string;
  heroAlt: string;
  highlights: StaticHighlight[];
  sections: StaticSection[];
}

const pages: Record<string, StaticPageContent> = {
  faq: {
    eyebrow: 'Support',
    title: 'Frequently Asked Questions',
    intro: 'Answers about orders, warranty, delivery, and service for Watchera India.',
    // Guaranteed Working Image: Macro of a luxury dial
    heroImage: 'https://i.pinimg.com/736x/b0/59/66/b059660e5b9916d33598728b9d8bdca1.jpg?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 
    heroAlt: 'Luxury watch dial close-up',
    highlights: [
      { title: 'Support Hours', value: '10 AM - 7 PM, Mon-Sat' },
      { title: 'Avg Response', value: 'Within 24 Hours' },
      { title: 'Concierge', value: '+91 22 5555 0123' }
    ],
    sections: [
      {
        title: 'Are all products authentic?',
        description: 'Yes. Every timepiece listed on Watchera is sourced through authorized channels and delivered with verification.',
        bullets: ['Serial and model verification', 'Invoice and warranty included']
      },
      {
        title: 'How soon will my order ship?',
        description: 'Most orders dispatch within 24-72 hours after confirmation.',
        bullets: ['Metro cities: 2-4 business days', 'Non-metro: 4-7 business days']
      },
      {
        title: 'Do you offer after-sales service?',
        description: 'Yes. Our service desk supports strap changes, inspection, and repair requests through concierge support.'
      },
      {
        title: 'Can I cancel an order?',
        description: 'Orders can be cancelled before dispatch. Once dispatched, cancellation follows shipping and returns terms.'
      }
    ]
  },
  tracking: {
    eyebrow: 'Orders',
    title: 'Track Your Watchera Order',
    intro: 'Use your order ID from email confirmation to get delivery status through your dashboard or support team.',
    // Guaranteed Working Image: Minimalist watch aesthetic
    heroImage: 'https://i.pinimg.com/736x/1d/ef/87/1def87256d6e7e5a79adf8d86df2bb74.jpg?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    heroAlt: 'Watch in transit aesthetic visual',
    highlights: [
      { title: 'Dashboard Tracking', value: 'Live status updates' },
      { title: 'Insured Shipping', value: 'All India coverage' },
      { title: 'Support Contact', value: 'support@watchera.in' }
    ],
    sections: [
      {
        title: 'How to track',
        description: 'Go to your dashboard order history for live status updates, or contact concierge with your order ID.',
        bullets: ['Dashboard > Orders', 'Email: support@watchera.in', 'Phone: +91 22 5555 0123']
      },
      {
        title: 'Typical statuses',
        description: 'Pending, Processing, Shipped, Delivered, or Cancelled. Status updates appear as your order progresses.'
      },
      {
        title: 'Delayed shipment support',
        description: 'If delivery is delayed, our team coordinates directly with courier partners and updates you proactively.'
      }
    ]
  },
  shipping: {
    eyebrow: 'Delivery',
    title: 'Shipping & Returns',
    intro: 'Watchera offers insured shipping across India with secure packaging and careful handling.',
    // Guaranteed Working Image: Dark sleek watch
    heroImage: 'https://i.pinimg.com/1200x/4c/61/b9/4c61b986f73de8b4fb71ce6491677b83.jpg?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    heroAlt: 'Premium packaging and delivery',
    highlights: [
      { title: 'Dispatch Window', value: '24 - 72 Hours' },
      { title: 'Shipping Coverage', value: 'Pan India' },
      { title: 'Return Window', value: '7 Days (Eligible Items)' }
    ],
    sections: [
      {
        title: 'Shipping policy',
        description: 'All deliveries are insured and handled with secure courier partners. Delivery timeline varies by location.',
        bullets: ['Metro: 2-4 business days', 'Non-metro: 4-7 business days']
      },
      {
        title: 'Packaging standards',
        description: 'Products are delivered in branded protective packaging with invoice and warranty details inside.'
      },
      {
        title: 'Returns policy',
        description: 'Returns are accepted only for eligible items in unused condition as per policy terms.',
        bullets: ['Return request within 7 days', 'Original packaging mandatory']
      },
      {
        title: 'Refund timeline',
        description: 'After return quality check approval, refunds are processed to original payment method within 5-7 business days.'
      }
    ]
  },
  warranty: {
    eyebrow: 'Protection',
    title: 'Warranty Coverage',
    intro: 'Your Watchera purchase includes manufacturer-backed protection and service support.',
    // Guaranteed Working Image: Watchmaker gears
    heroImage: 'https://i.pinimg.com/736x/24/22/29/24222926f7e233124fab5d607ddb8d4d.jpg?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    heroAlt: 'Watchmaker mechanism',
    highlights: [
      { title: 'Warranty Term', value: 'As listed per model' },
      { title: 'Service Support', value: 'Authorized channels only' },
      { title: 'Claim Help', value: 'Dedicated concierge support' }
    ],
    sections: [
      {
        title: 'What is covered',
        description: 'Manufacturing defects in movement and internal parts are covered as per the model warranty terms.'
      },
      {
        title: 'What is not covered',
        description: 'Damage due to misuse, impact, unauthorized repairs, water misuse, or cosmetic wear is excluded.'
      },
      {
        title: 'How to claim warranty',
        description: 'Share invoice, serial number, and issue details with concierge. We guide inspection and next steps.'
      }
    ]
  },
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    intro: 'How Watchera collects and uses your information for account and order fulfillment.',
    // Guaranteed Working Image: Elegant luxury presentation
    heroImage: 'https://i.pinimg.com/474x/bc/be/28/bcbe28e46f0bf5c4b067719626648a7f.jpg?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    heroAlt: 'Secure data concept',
    highlights: [
      { title: 'Data Security', value: 'Protected transmission' },
      { title: 'Usage Scope', value: 'Order and support only' },
      { title: 'User Control', value: 'Update profile anytime' }
    ],
    sections: [
      {
        title: 'Data collected',
        description: 'We collect contact details, shipping information, and order history to deliver our services.'
      },
      {
        title: 'Data usage',
        description: 'Information is used for account access, checkout, delivery communication, and customer support.'
      },
      {
        title: 'Third-party sharing',
        description: 'Only essential logistics and payment processing partners receive limited information for order completion.'
      }
    ]
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms of Service',
    intro: 'Please review these terms before using Watchera website, placing an order, or creating an account.',
    // Guaranteed Working Image: Classic watch setting
    heroImage: 'https://i.pinimg.com/1200x/9c/2e/48/9c2e48726d47299aa8910b6ab1b01758.jpg?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    heroAlt: 'Document and pen aesthetic',
    highlights: [
      { title: 'Order Policy', value: 'Subject to verification' },
      { title: 'Payment Terms', value: 'Secure gateway processing' },
      { title: 'Use Agreement', value: 'Platform usage standards' }
    ],
    sections: [
      {
        title: 'Orders and payments',
        description: 'All orders are subject to product availability, payment verification, and confirmation.'
      },
      {
        title: 'Product information',
        description: 'We strive for accurate listing details, but minor specification changes may occur without prior notice.'
      },
      {
        title: 'Liability',
        description: 'Watchera is not liable for indirect damages, delays from courier disruption, or user misuse.'
      }
    ]
  }
};

@Component({
  selector: 'app-static-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './static-page.html',
  styleUrl: './static-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaticPageComponent {
  private route = inject(ActivatedRoute);

  content = signal<StaticPageContent>(pages['faq']);

  constructor() {
    this.route.data.subscribe((data) => {
      const key = (data['page'] || 'faq') as string;
      this.content.set(pages[key] || pages['faq']);
    });
  }
}