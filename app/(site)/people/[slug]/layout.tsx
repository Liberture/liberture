import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://liberture.com';
    const response = await fetch(`${baseUrl}/api/people/${slug}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return {
        title: 'Person Not Found | Liberture',
      };
    }
    
    const person = await response.json();
    const url = `${baseUrl}/people/${slug}`;
    const imageUrl = person.imageUrl || `${baseUrl}/og-image.png`;
    
    return {
      title: `${person.name} | ${person.title} | Liberture`,
      description: person.bio.substring(0, 160),
      openGraph: {
        title: `${person.name} | ${person.title}`,
        description: person.bio.substring(0, 200),
        url,
        siteName: 'Liberture',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: person.name,
          },
        ],
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${person.name} | ${person.title}`,
        description: person.bio.substring(0, 200),
        images: [imageUrl],
        creator: person.twitter ? `@${person.twitter}` : undefined,
      },
    };
  } catch (error) {
    return {
      title: 'Person | Liberture',
    };
  }
}

export default function PersonLayout({ children }: Props) {
  return <>{children}</>;
}
