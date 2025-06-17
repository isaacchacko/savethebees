import { useEffect } from "react";
import { BiSun, BiMoon } from "react-icons/bi";

const DarkModeToggle = ({ ICON_WIDTH_HEIGHT }: { ICON_WIDTH_HEIGHT: string }) => {

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  return (
    <button
      aria-label="Toggle theme"
      onClick={toggleTheme}
    >
      <BiMoon className={`hidden dark:block ${ICON_WIDTH_HEIGHT} cursor-pointer scale-80 hover:scale-100 duration-300`} />
      <BiSun className={`dark:hidden block ${ICON_WIDTH_HEIGHT} cursor-pointer scale-80 hover:scale-100 duration-300`} />
    </button>
  );
};

export default DarkModeToggle;
