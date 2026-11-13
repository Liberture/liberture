import { localizedPageUrl } from "@/lib/i18n/page-url.server"
import { getMessages } from "next-intl/server"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import type { Catalog } from "@/lib/translations"
import { PillarTag } from "@/components/habits/marketplace/pillar-tag"
import { profilePillars } from "@/lib/pillars"
import { DirectoryInfobox, DirectoryLayout } from "@/components/directory/layout"
import { BookCover } from "@/components/directory/book-cover"
import { ProfileMarkdown } from "@/components/people/profile-markdown"
import { sectionTrail } from "@/components/seo/section-breadcrumbs"
import { splitBookTitle } from "@/lib/directory/book-title"
import { bookContributors } from "@/lib/directory/book-contributors"
import { PersonCard } from "@/components/people/person-card"
import { BookAuthor } from "@/components/directory/book-author"
import { entries } from "@/lib/directory/organization-entries"
import { ExternalLink } from "lucide-react";
import { BookSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";

type Book = {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  pillars: string;
  year: number | null;
  pages: number | null;
  isbn: string | null;
  amazonUrl: string | null;
  rating: number | null;
  keyTakeaways: string | null;
  forWho: string | null;
  featured: boolean;
  imageUrl: string | null;
  Person?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export default async function BookDetails({ book }: { book: Book }) {
  const locale = await getRequestLocale()
  const { bookDetails: text, app: { protocolCard } } = (await getMessages() as unknown as Catalog).habits
  const contributors = await bookContributors(book.author, book.Person)
  const keyTakeaways = entries(book.keyTakeaways);
  const { title, subtitle } = splitBookTitle(book.title)
  const pillars = profilePillars(book.pillars);

  return (
    <DirectoryLayout>
      {/* JSON-LD Schema */}
      <BookSchema
        title={book.title}
        author={book.Person?.name || book.author}
        authorUrl={book.Person ? await localizedPageUrl(`/people/${book.Person.slug}`, locale) : undefined}
        description={book.description}
        isbn={book.isbn || undefined}
        url={await localizedPageUrl(`/books/${book.slug}`, locale)}
        image={book.imageUrl || undefined}
      />
      <BreadcrumbSchema compact items={[...sectionTrail("books"), {name:title, url:`https://liberture.com/books/${book.slug}`}]} />

      <header className="my-7">
        <h1 className="text-balance text-4xl font-bold sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-3xl text-pretty text-lg text-muted-foreground">{subtitle}</p>}
      </header>
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.42fr)]">
        <DirectoryInfobox label={text.heading}>
          <BookCover src={book.imageUrl} title={book.title} />
          <h2 className="text-lg font-semibold">{text.heading}</h2>
          <dl className="space-y-3 text-sm [&_dt]:text-muted-foreground">
            <div><dt>{text.author}</dt><dd><BookAuthor book={book} /></dd></div>
            {book.year != null && book.year > 0 && <div><dt>{text.published}</dt><dd>{book.year}</dd></div>}
            {book.pages != null && book.pages > 0 && <div><dt>{text.pages}</dt><dd>{book.pages}</dd></div>}
            {book.rating != null && book.rating > 0 && <div><dt>{text.rating}</dt><dd>{book.rating.toFixed(1)} / 5</dd></div>}
            {book.isbn && <div><dt>ISBN</dt><dd>{book.isbn}</dd></div>}
            {pillars.length > 0 && <div><dt>{text.verticals}</dt><dd className="mt-1 flex flex-wrap gap-1.5">{pillars.map(id => <PillarTag key={id} pillar={id} />)}</dd></div>}
          </dl>
          {book.amazonUrl && <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">{text.amazon} <ExternalLink className="size-3" /></a>}
        </DirectoryInfobox>
        <div className="min-w-0 space-y-6 md:col-start-1 md:row-start-1">
          {/* Description */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
            <h2 className="text-2xl font-bold mb-4">{text.about}</h2>
            <ProfileMarkdown>{book.description}</ProfileMarkdown>
          </div>

          {contributors.length > 0 && <section>
            <h2 className="mb-4 text-2xl font-bold">{text.contributors}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {contributors.map(({ name, role, profile }) => (
                <PersonCard key={name} person={profile ?? { name }} role={text[role]} featuredLabel={protocolCard.featured} />
              ))}
            </div>
          </section>}

          {/* Key Takeaways */}
          {keyTakeaways.length > 0 && (
            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
              <h2 className="text-2xl font-bold mb-4">{text.takeaways}</h2>
              <ul className="space-y-3">
                {keyTakeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-purple-400 mt-1">•</span>
                    <span className="text-slate-300">{takeaway.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* For Who */}
          {book.forWho && (
            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
              <h2 className="text-2xl font-bold mb-4">{text.audience}</h2>
              <p className="text-slate-300">{book.forWho}</p>
            </div>
          )}
        </div>

      </div>
    </DirectoryLayout>
  );
}
