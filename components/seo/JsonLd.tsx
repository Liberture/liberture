import { JsonLd } from "./json-ld-script"
export { JsonLd } from "./json-ld-script"
export { BreadcrumbSchema } from "./breadcrumb-schema"

// Organization Schema
export function OrganizationSchema({ description }: { description: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Liberture',
    url: 'https://liberture.com',
    logo: 'https://liberture.com/icon.svg',
    description,
    sameAs: [
      'https://twitter.com/liberture',
      'https://linkedin.com/company/liberture',
      'https://instagram.com/liberture',
    ],
  };

  return <JsonLd data={schema} />;
}

// WebSite Schema
export function WebSiteSchema({ description, locale }: { description: string; locale: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Liberture',
    url: 'https://liberture.com',
    description,
    inLanguage: locale,
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

  const handle = twitter?.replace(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\//i,"").replace(/^@/,"").replace(/\/$/,"")
  const sameAs = [website, handle && /^\w{1,15}$/.test(handle) ? `https://x.com/${handle}` : undefined].filter(Boolean)
  if (sameAs.length) schema.sameAs = sameAs

  schema["@id"] = url + "#person";
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": url + "#profile",
    url,
    mainEntity: schema,
  }} />;
}

// Book Schema
export function BookSchema({
  title,
  author,
  authorUrl,
  description,
  isbn,
  url,
  image,
}: {
  title: string;
  author: string;
  authorUrl?: string;
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
      ...(authorUrl && { url:authorUrl, "@id":authorUrl+"#person" }),
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
  authors,
  citations,
  image,
}: {
  title: string;
  description: string;
  url: string;
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  authors?: { "@type":"Person"; name:string; sameAs?:string }[];
  citations?: string[];
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
        url: 'https://liberture.com/icon.svg',
      },
    },
    ...(citations?.length && {citation:citations}),
    author: authors?.length ? authors : {
      '@type': author === 'Liberture' ? 'Organization' : 'Person',
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
