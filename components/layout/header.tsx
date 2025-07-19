import Link from "next/link";
import { AuthButton } from "../auth/auth-button";
import { ThemeSwitcher } from "../shared/theme-switcher";
import { EnvVarWarning } from "../shared/env-var-warning";
import { hasEnvVars, APP_CONFIG } from "@/lib/constants";

/**
 * Header component for the application
 */
export function Header() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href="/">{APP_CONFIG.name}</Link>
        </div>
        <div className="flex items-center gap-4">
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
