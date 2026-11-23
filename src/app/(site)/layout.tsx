import CityMap from "@/components/site/CityMap";
import { sans } from "../fonts/sans";
import "./site.css";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`site ${sans.variable}`}>
      {children}
      <CityMap />
    </div>
  );
}
