import { FaLinkedin, FaGithub, FaEnvelope, FaFileAlt } from 'react-icons/fa';
import { VscGithubAlt } from 'react-icons/vsc';

const Glyphs = ({ size = 40 }: { size?: number }) => {
  return (
    <div className="w-[130%] md:w-[80%] 2xl:w-[50%] p-4 bg-(--spotify-background) rounded-lg shadow slide-down-fade-in wait-longer flex flex-row justify-between px-6"
    style={{ pointerEvents: 'auto' }}>
      <a
        tooltip="LinkedIn"
        href="https://www.linkedin.com/in/isaacchacko"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
      >
        <FaLinkedin size={size} />
      </a>
      <a
        tooltip="GitHub"
        href="https://github.com/isaacchacko"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
      >
        <FaGithub size={size} />
      </a>
      <a
        tooltip="Snail Mail"
        href="mailto:isaac.chacko05@tamu.edu"
        aria-label="Email"
      >
        <FaEnvelope size={size} />
      </a>
      <a
        tooltip="Resume"
        href="https://drive.google.com/file/d/1-NBdX32Opo2ajMpDpWgXaQkyOQ9KzdcP/view?usp=sharing"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Résumé"
      >
        <FaFileAlt size={size} />
      </a>
    </div>
  );
};

export default Glyphs;
