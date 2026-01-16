
import IconLink from "@/components/IconLink"

import { AiOutlineLinkedin } from "react-icons/ai";
import { FiGithub } from "react-icons/fi";
import {
  BiFile,          // Resume/file text
  BiMailSend,      // Mail/envelope
} from 'react-icons/bi';

const Footer = ({ ICON_WIDTH_HEIGHT }: { ICON_WIDTH_HEIGHT: string }) => (
  <div className='flex flex-row justify-center'>

    <div style={{ pointerEvents: "auto" }} className="h-30 contactInfo flex flex-col justify-end items-center py-5 gap-3">

      <div className='flex flex-row gap-5'>
        <IconLink className={ICON_WIDTH_HEIGHT} IconComponent={AiOutlineLinkedin} href='https://www.linkedin.com/in/isaacchacko' isNewTab={true} />
        <IconLink className={ICON_WIDTH_HEIGHT} IconComponent={BiFile} href='/Isaac_Chacko.pdf' isNewTab={true} />
        <IconLink className={ICON_WIDTH_HEIGHT} IconComponent={FiGithub} href='https://www.github.com/isaacchacko' isNewTab={true} />
        <IconLink className={ICON_WIDTH_HEIGHT} IconComponent={BiMailSend} href='mailto:isaac.chacko05@tamu.edu' isNewTab={true} />
      </div>
      <p className=''>Copyright &copy; 2026 Isaac Chacko</p>
    </div>
  </div>)

export default Footer;
