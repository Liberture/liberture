import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://liberture.com';
    const response = await fetch(`${baseUrl}/api/books/${slug}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return {
        title: 'Book Not Found | Liberture',
      };
    }
    
    const book = await response.json();
    const url = `${baseUrl}/books/${slug}`;
    const imageUrl = book.imageUrl || `${baseUrl}/og-image.jpg`;
    
    return {
      title: `${book.title} by ${book.author} | Liberture`,
      description: book.description.substring(0, 160),
      openGraph: {
        title: book.title,
        description: book.description.substring(0, 200),
        url,
        siteName: 'Liberture',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: book.title,
          },
        ],
        type: 'book',
      },
      twitter: {
        card: 'summary_large_image',
        title: book.title,
        description: book.description.substring(0, 200),
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Book | Liberture',
    };
  }
}

export default function BookLayout({ children }: Props) {
  return <>{children}</>;
}
