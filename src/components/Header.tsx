import logo from "@/assets/logo.png";
import { Github, Search } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCount: number;
}

const Header = ({ searchQuery, onSearchChange, activeCount }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b bg-card px-4 py-2 shadow-sm">
      <a href="/" className="flex items-center gap-2 shrink-0">
        <img
          src={logo}
          alt="বিরিয়ানি দিবে"
          className="h-10 w-10 rounded-full object-cover"
        />
        <span className="hidden sm:block font-bold text-primary text-lg">
          বিরিয়ানিদিবে
        </span>
      </a>

      <div className="relative mx-auto w-full max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="মসজিদ বা এলাকা খুঁজুন…"
          className="w-full rounded-full border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          <span className="pulse-dot" />
          সরাসরি
        </span>
        <a
          href="https://github.com/monir6163"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full p-2 hover:bg-accent transition-colors"
          aria-label="GitHub Profile"
        >
          <Github className="h-5 w-5" />
        </a>
      </div>
    </header>
  );
};

export default Header;
