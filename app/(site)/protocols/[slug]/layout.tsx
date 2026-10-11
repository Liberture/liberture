import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, protocolImage } from "@/lib/habits/protocols/images";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const protocol = await prisma.protocol.findUnique({
      where: { slug },
      select: {
        name: true,
        description: true,
        pillar: true,
        published: true,
      },
    });
    
    if (!protocol) {
      return {
        title: 'Protocol Not Found | Liberture',
      };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://liberture.com';
    const url = `${baseUrl}/protocols/${slug}`;
    // The protocol's own picture when it has one (catalog protocols), else the site image.
    const picture = protocolImage(slug);
    const imageUrl = picture ? absoluteUrl(baseUrl, picture.png) : `${baseUrl}/og-image.jpg`;
    
    const metadata: Metadata = {
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
            alt: picture?.alt ?? protocol.name,
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
    
    // Exclude unpublished protocols from search engine indexing
    if (!protocol.published) {
      metadata.robots = {
        index: false,
        follow: false,
      };
    }
    
    return metadata;
  } catch (error) {
    return {
      title: 'Protocol | Liberture',
    };
  }
}

export default function ProtocolLayout({ children }: Props) {
  return <>{children}</>;
}
