import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://liberture.com';
    const response = await fetch(`${baseUrl}/api/protocols/${slug}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return {
        title: 'Protocol Not Found | Liberture',
      };
    }
    
    const protocol = await response.json();
    const url = `${baseUrl}/protocols/${slug}`;
    const imageUrl = `${baseUrl}/og-image.png`;
    
    return {
      title: `${protocol.name} | ${protocol.pillar} Protocol | Liberture`,
      description: protocol.description.substring(0, 160),
      openGraph: {
        title: protocol.name,
        description: protocol.description.substring(0, 200),
        url,
        siteName: 'Liberture',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: protocol.name,
          },
        ],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: protocol.name,
        description: protocol.description.substring(0, 200),
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Protocol | Liberture',
    };
  }
}

export default function ProtocolLayout({ children }: Props) {
  return <>{children}</>;
}
