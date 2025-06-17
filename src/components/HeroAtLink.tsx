import Link from 'next/link';

export default function HeroLink(
  {
    text,
    href,
    hasPeriod,
    isNewTab = true,
    className = ""
  }:
    {
      text: string;
      href: string;
      hasPeriod: boolean;
      isNewTab?: boolean;
      className?: string;
    }
) {
  return (
    <Link href={href} target={isNewTab ? "_blank" : ""} className={`${className} text-[length:inherit] font-bold text-(--primary-color) hover:text-white transition-colors duration-300`}>
      &#64;
      <p className='underline inline'>{text}</p>{hasPeriod ? "." : ""}
    </Link>
  )
}
