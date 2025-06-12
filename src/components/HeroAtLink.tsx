import Link from 'next/link';

export default function HeroLink(
  {
    text,
    href,
    isNewTab = true,
    className = ""
  }:
    {
      text: string;
      href: string;
      isNewTab?: boolean;
      className?: string;
    }
) {
  return (
    <Link href={href} target={isNewTab ? "_blank" : ""} className={`${className} text-md sm:text-xl md:text-2xl lg:text-4xl font-bold text-(--primary-color) hover:text-white transition-colors duration-300`}>
      &#64;
      <p className='underline inline'>{text}</p>
    </Link>
  )
}
