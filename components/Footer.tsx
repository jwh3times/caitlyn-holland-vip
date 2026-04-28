export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted">
            &copy; {new Date().getFullYear()} Caitlyn Holland. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
