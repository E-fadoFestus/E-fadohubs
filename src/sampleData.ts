import { MarketProduct } from './types';

export const SAMPLE_PRODUCTS: MarketProduct[] = [
  {
    id: 'edado-prime-laptop',
    vendorId: 'efado-official',
    title: 'EFADO Prime X1 Carbon - Ultimate Business UltraBook',
    categoryPath: {
      level1: 'Electronics & Computers',
      level2: 'Computing',
      level3: 'Laptops',
      level4: 'Windows Laptops'
    },
    brand: 'EFADO',
    condition: 'New',
    quantity: 50,
    price: 1899,
    currency: 'USD',
    description: 'The pinnacle of business engineering. Featuring a 14" 4K OLED display, i9 13th Gen processor, 32GB RAM, and 1TB SSD. Comes with EFADO Shield Protection for 2 years.',
    photos: ['https://picsum.photos/seed/prime-laptop/1200/800'],
    location: 'EFADO Central Hub, Lagos',
    warranty: '2 Year EFADO Shield Protection',
    complianceConfirmed: true,
    createdAt: new Date(),
    vendorPickupLocation: 'EFADO Central Warehouse Block D-3, Victoria Island, Lagos (Near Eko Hotel)'
  },
  {
    id: 'sample-1',
    vendorId: 'sample-vendor',
    title: 'iPhone 13 Pro Max - 256GB (Graphite)',
    categoryPath: {
      level1: 'Electronics & Computers',
      level2: 'Mobile Phones & Accessories',
      level3: 'Smartphones (iOS/Android)'
    },
    brand: 'Apple',
    condition: 'Like New',
    quantity: 1,
    price: 850,
    currency: 'USD',
    description: 'Barely used iPhone 13 Pro Max. Battery health 98%. Comes with original box and charger.',
    photos: ['https://picsum.photos/seed/iphone13/800/600'],
    location: 'New York, USA',
    complianceConfirmed: true,
    createdAt: new Date(),
    vendorPickupLocation: 'No. 12 Digital Plaza, Suite 4B, Broadway Street, NY'
  },
  {
    id: 'sample-2',
    vendorId: 'sample-vendor',
    title: 'Vintage Leather Jacket - Men\'s Large',
    categoryPath: {
      level1: 'Fashion (Men/Women/Unisex)',
      level2: 'Men’s Clothing',
      level3: 'Jackets & Coats'
    },
    brand: 'Levi\'s',
    condition: 'Good',
    quantity: 1,
    price: 120,
    currency: 'USD',
    description: 'Classic 90s leather jacket. Well-maintained with a beautiful patina.',
    photos: ['https://picsum.photos/seed/jacket/800/600'],
    location: 'London, UK',
    complianceConfirmed: true,
    createdAt: new Date(),
    vendorPickupLocation: 'Vintage Apparel Shop, 88 Portobello Road, London'
  },
  {
    id: 'sample-3',
    vendorId: 'sample-vendor',
    title: 'Professional DSLR Camera - Canon EOS R5',
    categoryPath: {
      level1: 'Electronics & Computers',
      level2: 'Cameras & Photography',
      level3: 'DSLR/Mirrorless Cameras'
    },
    brand: 'Canon',
    condition: 'New',
    quantity: 2,
    price: 3200,
    currency: 'USD',
    description: 'Brand new Canon EOS R5 body. Full warranty included.',
    photos: ['https://picsum.photos/seed/camera/800/600'],
    location: 'Tokyo, Japan',
    complianceConfirmed: true,
    createdAt: new Date(),
    vendorPickupLocation: 'Akihabara Camera Hub, Building B 3rd Floor, Tokyo'
  },
  {
    id: 'sample-4',
    vendorId: 'sample-vendor',
    title: 'Modern Coffee Table - Solid Oak',
    categoryPath: {
      level1: 'Home, Kitchen & Appliances',
      level2: 'Kitchenware',
      level3: 'Cookware (Pots/Pans)'
    },
    brand: 'HomeStyle',
    condition: 'Fair',
    quantity: 1,
    price: 45,
    currency: 'USD',
    description: 'Solid oak coffee table with some minor scratches. Very sturdy.',
    photos: ['https://picsum.photos/seed/table/800/600'],
    location: 'Lagos, Nigeria',
    complianceConfirmed: true,
    createdAt: new Date(),
    vendorPickupLocation: 'Alaba International Market, Block G Space 12, Ojo, Lagos'
  },
  {
    id: 'sample-5',
    vendorId: 'sample-vendor',
    title: 'Gaming Laptop - ASUS ROG Zephyrus G14',
    categoryPath: {
      level1: 'Electronics & Computers',
      level2: 'Laptops & Desktops',
      level3: 'Gaming Laptops'
    },
    brand: 'ASUS',
    condition: 'Used',
    quantity: 1,
    price: 950,
    currency: 'USD',
    description: 'Powerful gaming laptop. RTX 3060, 16GB RAM. Perfect for study and play.',
    photos: ['https://picsum.photos/seed/laptop/800/600'],
    location: 'Berlin, Germany',
    complianceConfirmed: true,
    createdAt: new Date(),
    vendorPickupLocation: 'Alexanderplatz Electronic Mart, Shop 18, Berlin'
  },
  {
    id: 'sample-6',
    vendorId: 'sample-vendor',
    title: 'Luxury Wristwatch - Silver Edition',
    categoryPath: {
      level1: 'Fashion (Men/Women/Unisex)',
      level2: 'Watches & Jewelry',
      level3: 'Wristwatches'
    },
    brand: 'Rolex',
    condition: 'Like New',
    quantity: 1,
    price: 12500,
    currency: 'USD',
    description: 'Exquisite silver wristwatch. Minimal signs of wear. Certified authentic.',
    photos: ['https://picsum.photos/seed/watch/800/600'],
    location: 'Dubai, UAE',
    complianceConfirmed: true,
    createdAt: new Date(),
    vendorPickupLocation: 'Gold Souk Luxury Pavilion, Shop No. 5-A, Deira, Dubai'
  },
  {
    id: 'sample-7',
    vendorId: 'sample-vendor',
    title: 'Smart Home Security Camera 4K',
    categoryPath: {
      level1: 'Electronics & Computers',
      level2: 'Networking & Smart Home',
      level3: 'Smart Cameras'
    },
    brand: 'Arlo',
    condition: 'New',
    quantity: 10,
    price: 199,
    currency: 'USD',
    description: 'Ultra HD 4K security camera with night vision and two-way audio.',
    photos: ['https://picsum.photos/seed/security/800/600'],
    location: 'San Francisco, USA',
    complianceConfirmed: true,
    createdAt: new Date(),
    vendorPickupLocation: 'SOMA Innovation Suites, Ground Floor Lobby Counter, San Francisco, CA'
  }
];
