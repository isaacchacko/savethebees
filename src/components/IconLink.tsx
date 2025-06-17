
import React from "react";
import Link from 'next/link';

interface T {
  className?: string;
}

export default function HeroLink(
  {
    className,
    IconComponent,
    href,
    isNewTab,
  }:
    {
      className: string;
      IconComponent: React.ComponentType<T>;
      href: string;
      isNewTab: boolean;
    }
) {
  return (
    <Link href={href} target={isNewTab ? "_blank" : ""}>
      <IconComponent className={` ${className} cursor-pointer scale-80 hover:scale-100 duration-300`} />
    </Link>
  )
}
