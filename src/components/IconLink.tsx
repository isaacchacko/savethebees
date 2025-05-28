
import React from "react";
import Link from 'next/link';

export default function HeroLink(
  {
    IconComponent,
    href,
    isNewTab,
  }:
  {
    IconComponent: React.ComponentType<T>;
    href: string;
    isNewTab: boolean;
  }
) {
  return (
    <Link href={href} target={isNewTab ? "_blank" : ""}>
      <IconComponent className="w-10 h-10 cursor-pointer scale-80 hover:scale-100 duration-300" />
    </Link>
  )
}
