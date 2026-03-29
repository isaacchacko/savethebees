'use client';

import { useState, useEffect, useRef } from 'react';

/** Types one path segment after the domain (Linktree internal link hover). */
export default function NavbarTypingPath({ segment }: { segment: string | null }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isVisible = segment !== null;
  const activePath = segment ?? '';

  useEffect(() => {
    if (!isVisible) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    let charIndex = 0;
    setIsTyping(true);
    setDisplayedText('');

    const typeChar = () => {
      if (charIndex < activePath.length) {
        setDisplayedText(activePath.slice(0, charIndex + 1));
        charIndex++;
        typingTimeoutRef.current = setTimeout(typeChar, 100);
      } else {
        setIsTyping(false);
      }
    };

    typeChar();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isVisible, activePath]);

  if (!isVisible) return null;

  return (
    <span className="font-black inline-block min-w-[60px]">
      /{displayedText}
      {isTyping && <span className="animate-pulse">|</span>}
    </span>
  );
}
