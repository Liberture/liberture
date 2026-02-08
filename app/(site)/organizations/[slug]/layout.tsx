import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://liberture.com';
    const response = await fetch(`${baseUrl}/api/organizations/${slug}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return {
        title: 'Organization Not Found | Liberture',
      };
    }
    
    const org = await response.json();
    const url = `${baseUrl}/organizations/${slug}`;
    const imageUrl = org.imageUrl || `${baseUrl}/og-image.png`;
    
    return {
      title: `${org.name} | ${org.type} | Liberture`,
      description: org.description.substring(0, 160),
      openGraph: {
        title: org.name,
        description: org.description.substring(0, 200),
        url,
        siteName: 'Liberture',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: org.name,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: org.name,
        description: org.description.substring(0, 200),
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Organization | Liberture',
    };
  }
}

export default function OrganizationLayout({ children }: Props) {
  return <>{children}</>;
}
