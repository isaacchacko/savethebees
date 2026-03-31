'use client';

import type { IconType } from 'react-icons';
import {
  SiCloudflare,
  SiElectron,
  SiExpress,
  SiGithub,
  SiGo,
  SiGooglegemini,
  SiNextdotjs,
  SiNvidia,
  SiPython,
  SiReact,
  SiSocketdotio,
  SiTailwindcss,
  SiVite,
} from 'react-icons/si';

export type TechDefinition = {
  label: string;
  Icon: IconType;
};

const TECH_REGISTRY = {
  github: { label: 'GitHub', Icon: SiGithub },
  cloudflare: { label: 'Cloudflare', Icon: SiCloudflare },
  nextjs: { label: 'Next.js', Icon: SiNextdotjs },
  python: { label: 'Python', Icon: SiPython },
  nemotron: { label: 'Nemotron', Icon: SiNvidia },
  electron: { label: 'Electron', Icon: SiElectron },
  gemini: { label: 'Google Gemini', Icon: SiGooglegemini },
  express: { label: 'Express.js', Icon: SiExpress },
  go: { label: 'Go', Icon: SiGo },
  react: { label: 'React', Icon: SiReact },
  websockets: { label: 'WebSockets', Icon: SiSocketdotio },
  tailwindcss: { label: 'Tailwind CSS', Icon: SiTailwindcss },
  vite: { label: 'Vite', Icon: SiVite },
} as const satisfies Record<string, TechDefinition>;

export type TechChipName = keyof typeof TECH_REGISTRY;

export function getTechDefinition(name: TechChipName): TechDefinition {
  return TECH_REGISTRY[name];
}

const CHIP_CLASS =
  'inline-flex items-center gap-2';

export function TechnologyChip({ label, Icon }: TechDefinition) {
  return (
    <span className={CHIP_CLASS}>
      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
      {label}
    </span>
  );
}

export type TechnologyChipsProps = {
  /** Registry keys, in display order — mix and match per project. */
  chips: TechChipName[];
  className?: string;
  'aria-label'?: string;
};

export function TechnologyChips({
  chips,
  className,
  'aria-label': ariaLabel = 'Technologies used',
}: TechnologyChipsProps) {
  return (
    <div
      className={`flex flex-row flex-wrap gap-2 ${className ? ` ${className}` : ''}`}
      role="list"
      aria-label={ariaLabel}
    >
      {chips.map((name, i) => {
        const def = TECH_REGISTRY[name];
        return (
          <div key={`${name}-${i}`} role="listitem">
            <TechnologyChip {...def} />
          </div>
        );
      })}
    </div>
  );
}
