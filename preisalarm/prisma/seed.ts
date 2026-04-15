import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const shops = [
  // Switzerland
  {
    domain: 'digitec.ch',
    name: 'Digitec',
    priceSelector: '[class*="sc-"][class*="price"] strong, [data-testid*="price"]',
    currencySelector: null,
    availabilitySelector: '[data-testid*="availability"], [class*="availability"]',
    notes: 'JSON-LD usually works; this is a fallback',
  },
  {
    domain: 'galaxus.ch',
    name: 'Galaxus',
    priceSelector: '[class*="sc-"][class*="price"] strong, [data-testid*="price"]',
    currencySelector: null,
    availabilitySelector: null,
    notes: 'Same platform as Digitec',
  },
  {
    domain: 'interdiscount.ch',
    name: 'Interdiscount',
    priceSelector: '.price-tag .value, .product-price .amount, [class*="price"]',
    currencySelector: null,
    availabilitySelector: '[class*="availability"], [class*="stock"]',
  },
  {
    domain: 'microspot.ch',
    name: 'Microspot',
    priceSelector: '.product-price, .price-amount, [class*="price"]',
    currencySelector: null,
    availabilitySelector: null,
  },
  {
    domain: 'brack.ch',
    name: 'Brack',
    priceSelector: '.price-value, .product-price, [class*="price"]',
    currencySelector: null,
    availabilitySelector: '[class*="availability"]',
  },
  {
    domain: 'fust.ch',
    name: 'Fust',
    priceSelector: '.product-price__price, [class*="price"]',
    currencySelector: null,
    availabilitySelector: null,
  },
  {
    domain: 'manor.ch',
    name: 'Manor',
    priceSelector: '[data-testid="product-price"], [class*="price"]',
    currencySelector: null,
    availabilitySelector: null,
  },
  {
    domain: 'mediamarkt.ch',
    name: 'MediaMarkt CH',
    priceSelector: '[data-test="product-price"], [class*="price"]',
    currencySelector: null,
    availabilitySelector: '[data-test="availability"]',
  },
  {
    domain: 'steg-electronics.ch',
    name: 'Steg Electronics',
    priceSelector: '.price, [class*="product-price"]',
    currencySelector: null,
    availabilitySelector: null,
  },
  {
    domain: 'toppreise.ch',
    name: 'Toppreise (Vergleich)',
    priceSelector: '.price, .best-price',
    currencySelector: null,
    availabilitySelector: null,
    notes: 'Price comparison aggregator',
  },
  // Germany / EU → CH
  {
    domain: 'amazon.de',
    name: 'Amazon.de',
    priceSelector: '.a-price-whole',
    currencySelector: '.a-price-symbol',
    availabilitySelector: '#availability span',
    notes: 'Fraction (.a-price-fraction) not included — use JSON-LD first',
  },
  {
    domain: 'amazon.fr',
    name: 'Amazon.fr',
    priceSelector: '.a-price-whole',
    currencySelector: '.a-price-symbol',
    availabilitySelector: '#availability span',
  },
  {
    domain: 'amazon.co.uk',
    name: 'Amazon.co.uk',
    priceSelector: '.a-price-whole',
    currencySelector: '.a-price-symbol',
    availabilitySelector: '#availability span',
  },
  {
    domain: 'alternate.de',
    name: 'Alternate.de',
    priceSelector: '.price, [class*="product-price"]',
    currencySelector: null,
    availabilitySelector: '[class*="availability"]',
  },
  {
    domain: 'cyberport.de',
    name: 'Cyberport',
    priceSelector: '.price, [class*="product-price"]',
    currencySelector: null,
    availabilitySelector: null,
  },
  {
    domain: 'saturn.de',
    name: 'Saturn',
    priceSelector: '[data-test="price"], [class*="price"]',
    currencySelector: null,
    availabilitySelector: null,
  },
  {
    domain: 'mediamarkt.de',
    name: 'MediaMarkt DE',
    priceSelector: '[data-test="product-price"], [class*="price"]',
    currencySelector: null,
    availabilitySelector: null,
  },
  // Manufacturer direct
  {
    domain: 'samsung.com',
    name: 'Samsung',
    priceSelector: '[class*="price"], .pd-price',
    currencySelector: null,
    availabilitySelector: null,
  },
  {
    domain: 'apple.com',
    name: 'Apple Store',
    priceSelector: '[class*="price"], .rc-prices-fullprice',
    currencySelector: null,
    availabilitySelector: null,
  },
  {
    domain: 'store.google.com',
    name: 'Google Store',
    priceSelector: '[class*="price"]',
    currencySelector: null,
    availabilitySelector: null,
  },
];

async function main() {
  console.log('Seeding shop profiles...');
  for (const shop of shops) {
    await prisma.shopProfile.upsert({
      where: { domain: shop.domain },
      update: shop,
      create: shop,
    });
    console.log(`  ✓ ${shop.name} (${shop.domain})`);
  }
  console.log(`Seeded ${shops.length} shop profiles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
