import Link from "@/components/i18n/localized-link"

type BookCredit = { author: string; Person?: { name: string; slug: string } | null }

export function BookAuthor({ book }: { book: BookCredit }) {
  const person = book.Person
  if (!person) return <>{book.author}</>
  const link = <Link href={`/people/${person.slug}`} className="hover:underline">{person.name}</Link>
  const offset = book.author.toLowerCase().indexOf(person.name.toLowerCase())
  if (offset < 0) return book.author ? <>{book.author} ({link})</> : link
  return <>{book.author.slice(0, offset)}{link}{book.author.slice(offset + person.name.length)}</>
}
