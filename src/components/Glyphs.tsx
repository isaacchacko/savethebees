import { FaLinkedin, FaGithub, FaEnvelope, FaFileAlt } from 'react-icons/fa';

const BASE_CLASS_NAME = "text-(--primary-color) transition-transform duration-200 ease-in-out transform scale-90 hover:scale-100 hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]";
const Glyphs = ({ size = 40 }: { size?: number }) => {
  return (
    <div className="w-[130%] md:w-[80%] 2xl:w-[50%] p-4 bg-(--spotify-background) rounded-lg shadow slide-down-fade-in wait-longer flex flex-row justify-between px-6"
    style={{ pointerEvents: 'auto' }}>
      <a
        title="LinkedIn"
        href="https://www.linkedin.com/in/isaacchacko"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
      >
        <FaLinkedin size={size} className={BASE_CLASS_NAME}/>
      </a>
      <a
        title="GitHub"
        href="https://github.com/isaacchacko"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
      >
        <FaGithub size={size} className={BASE_CLASS_NAME}/>
      </a>
      <a
        title="Snail Mail"
        href="mailto:isaac.chacko05@tamu.edu"
        aria-label="Email"
      >
        <FaEnvelope size={size} className={BASE_CLASS_NAME}/>
      </a>
      <a
        title="Resume"
        href="/Isaac_Chacko.pdf"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Résumé"
      >
        <FaFileAlt size={size} className={BASE_CLASS_NAME}/>
      </a>
    </div>
  );
};

export default Glyphs;
