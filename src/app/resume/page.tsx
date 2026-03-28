'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ICON_WIDTH_HEIGHT = 'w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:w-10 ';

export default function Resume() {
  return (
    <div className="bg-(--background)">
      <Navbar />

      <div className="relative flex flex-col min-h-screen justify-start">
        <div className="flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 my-8 relative bg-(--surface) rounded-lg shadow">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Resume</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg mb-4">
              You can download my resume as a PDF:
            </p>
            <a
              href="/Isaac_Chacko.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-(--primary-color) text-white rounded-lg hover:bg-(--secondary-color) transition-colors font-semibold"
            >
              Download Resume (PDF)
            </a>
          </div>
        </div>
      </div>

      <Footer ICON_WIDTH_HEIGHT={ICON_WIDTH_HEIGHT} />
    </div>
  );
}
