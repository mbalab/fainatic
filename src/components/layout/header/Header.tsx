import Link from "next/link";
import Image from "next/image";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="Fainatic"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="ml-2 text-xl font-semibold">Fainatic</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/how-it-works"
              className="text-gray-600 hover:text-gray-900"
            >
              How it Works
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/faq" className="text-gray-600 hover:text-gray-900">
              FAQ
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
