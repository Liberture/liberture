type JsonLdProps = {
  data: Record<string, any>;
};

/**
 * Renders structured data as a plain <script> tag so it lands in the
 * server-rendered HTML. next/script defers injection to the client, which
 * hides JSON-LD from crawlers that don't execute JavaScript, and dedupes by
 * `id` — so sibling schemas sharing an id silently drop.
 */
export function JsonLd({ data }: JsonLdProps) {
  // Escape `<` so DB-sourced strings can't break out of the script element.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

// Organization Schema
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Liberture',
    url: 'https://liberture.com',
    logo: 'https://liberture.com/icons/icon.svg',
    description: 'The unified platform for human optimization and biohacking',
    sameAs: [
      'https://twitter.com/liberture',
      'https://linkedin.com/company/liberture',
      'https://instagram.com/liberture',
    ],
  };

  return <JsonLd data={schema} />;
}

// WebSite Schema
export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Liberture',
    url: 'https://liberture.com',
    description: 'Master your biology. Unlock your potential. The unified platform for human optimization.',
    // No `potentialAction` / SearchAction until a real /search route exists —
    // declaring a sitelinks searchbox that 404s is an invalid markup signal.
  };

  return <JsonLd data={schema} />;
}

// Person Schema
export function PersonSchema({
  name,
  title,
  bio,
  url,
  website,
  twitter,
  image,
}: {
  name: string;
  title: string;
  bio: string;
  url: string;
  website?: string;
  twitter?: string;
  image?: string;
}) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: title,
    description: bio,
    url,
  };

  if (image) {
    schema.image = image;
  }

  if (website) {
    schema.sameAs = [website];
    if (twitter) {
      schema.sameAs.push(`https://twitter.com/${twitter}`);
    }
  } else if (twitter) {
    schema.sameAs = [`https://twitter.com/${twitter}`];
  }

  return <JsonLd data={schema} />;
}

// Book Schema
export function BookSchema({
  title,
  author,
  description,
  isbn,
  url,
  image,
}: {
  title: string;
  author: string;
  description: string;
  isbn?: string;
  url: string;
  image?: string;
}) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: title,
    author: {
      '@type': 'Person',
      name: author,
    },
    description,
    url,
  };

  if (isbn) {
    schema.isbn = isbn;
  }

  if (image) {
    schema.image = image;
  }

  return <JsonLd data={schema} />;
}

// Article Schema (for knowledge articles and protocols)
export function ArticleSchema({
  title,
  description,
  url,
  publishedAt,
  modifiedAt,
  author = 'Liberture',
  image,
}: {
  title: string;
  description: string;
  url: string;
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  image?: string;
}) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    publisher: {
      '@type': 'Organization',
      name: 'Liberture',
      logo: {
        '@type': 'ImageObject',
        url: 'https://liberture.com/icons/icon.svg',
      },
    },
    author: {
      '@type': 'Organization',
      name: author,
    },
  };

  if (publishedAt) {
    schema.datePublished = publishedAt;
  }

  if (modifiedAt) {
    schema.dateModified = modifiedAt;
  }

  if (image) {
    schema.image = image;
  }

  return <JsonLd data={schema} />;
}

// Breadcrumb Schema
export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={schema} />;
}

// WebApplication Schema (for games/interactive apps)
export function WebApplicationSchema({
  name,
  description,
  url,
  applicationCategory = 'HealthApplication',
  operatingSystem = 'Web Browser',
  offers,
  image,
}: {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price: number;
    priceCurrency: string;
  };
  image?: string;
}) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url,
    applicationCategory,
    operatingSystem,
    provider: {
      '@type': 'Organization',
      name: 'Liberture',
      url: 'https://liberture.com',
    },
  };

  if (offers) {
    schema.offers = {
      '@type': 'Offer',
      price: offers.price,
      priceCurrency: offers.priceCurrency,
    };
  } else {
    schema.offers = {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'USD',
    };
  }

  if (image) {
    schema.image = image;
  }

  return <JsonLd data={schema} />;
}

// Product Schema (for marketplace items)
export function ProductSchema({
  name,
  description,
  url,
  image,
  price,
  priceCurrency = 'USD',
  availability = 'InStock',
  brand,
  aggregateRating,
}: {
  name: string;
  description: string;
  url: string;
  image?: string;
  price: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  brand?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency,
      availability: `https://schema.org/${availability}`,
    },
  };

  if (image) {
    schema.image = image;
  }

  if (brand) {
    schema.brand = {
      '@type': 'Organization',
      name: brand,
    };
  }

  if (aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
    };
  }

  return <JsonLd data={schema} />;
}

// ItemList Schema (for collection pages like pillars, marketplace)
export function ItemListSchema({
  name,
  description,
  url,
  items,
}: {
  name: string;
  description: string;
  url: string;
  items: Array<{
    name: string;
    url: string;
    position?: number;
  }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    url,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position ?? index + 1,
      name: item.name,
      url: item.url,
    })),
  };

  return <JsonLd data={schema} />;
}

// FAQPage Schema (for pages with FAQ sections)
export function FAQSchema({
  questions,
}: {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return <JsonLd data={schema} />;
}
