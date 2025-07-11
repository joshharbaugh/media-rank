import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/user/Menu';


export function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">FamRank</h1>
            <p className="text-sm italic text-gray-500 dark:text-gray-400">Your family's entertainment story</p>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
