'use client';

import { useRef, useState } from 'react';
import { FaLinkedin, FaGithub, FaEnvelope, FaFileAlt } from 'react-icons/fa';
import gsap from 'gsap';

const getDefaultColor = () =>
  typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#181614'
    : '#181614';

const HOVER_COLORS = {
  resume: '#F59E0B',
  github: '#9d77e6',
  linkedin: '#0A66C2',
  email: '#EF4444',
};

const HeroGlyphs = () => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const resumeRef = useRef<HTMLAnchorElement>(null);
  const githubRef = useRef<HTMLAnchorElement>(null);
  const linkedinRef = useRef<HTMLAnchorElement>(null);
  const emailRef = useRef<HTMLButtonElement>(null);

  const enter = (el: HTMLElement | null, color: string) => {
    if (!el) return;
    gsap.to(el, { color, duration: 0.2, ease: 'power2.out' });
  };

  const leave = (el: HTMLElement | null) => {
    if (!el) return;
    // Tween back to the CSS-class default, then clear the inline style so the
    // class owns the color again (prevents React re-renders from fighting GSAP).
    gsap.to(el, {
      color: getDefaultColor(),
      duration: 0.35,
      ease: 'power2.out',
      onComplete: () => { el.style.color = ''; },
    });
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('isaac.chacko05@tamu.edu');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const iconSize = 28;
  // Color is set via CSS class (not inline style) so GSAP's inline style always wins on hover
  // and React re-renders can't override it.
  const glyphClass = "flex items-center cursor-pointer hero-glyph";

  return (
    <div
      className="flex flex-row gap-7 mt-6 text-reveal fixed bottom-5"
      style={{ animationDelay: '0.65s', pointerEvents: 'auto' }}
    >
      <a
        ref={resumeRef}
        href="/Isaac_Chacko.pdf"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Résumé"
        title="Résumé"
        className={glyphClass}
        onMouseEnter={() => enter(resumeRef.current, HOVER_COLORS.resume)}
        onMouseLeave={() => leave(resumeRef.current)}
      >
        <FaFileAlt size={iconSize} />
      </a>

      <a
        ref={githubRef}
        href="https://github.com/isaacchacko"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        title="GitHub"
        className={glyphClass}
        onMouseEnter={() => enter(githubRef.current, HOVER_COLORS.github)}
        onMouseLeave={() => leave(githubRef.current)}
      >
        <FaGithub size={iconSize} />
      </a>

      <a
        ref={linkedinRef}
        href="https://www.linkedin.com/in/isaacchacko"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
        title="LinkedIn"
        className={glyphClass}
        onMouseEnter={() => enter(linkedinRef.current, HOVER_COLORS.linkedin)}
        onMouseLeave={() => leave(linkedinRef.current)}
      >
        <FaLinkedin size={iconSize} />
      </a>

      <div className="relative flex items-center">
        <button
          ref={emailRef}
          aria-label="Copy email address"
          title="Copy email"
          className={`${glyphClass} bg-transparent border-none p-0`}
          onMouseEnter={() => enter(emailRef.current, HOVER_COLORS.email)}
          onMouseLeave={() => leave(emailRef.current)}
          onClick={copyEmail}
        >
          <FaEnvelope size={iconSize} />
        </button>
        <span
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-opacity duration-200"
          style={{ opacity: copiedEmail ? 1 : 0 }}
        >
          copied!
        </span>
      </div>
    </div>
  );
};

export default HeroGlyphs;
