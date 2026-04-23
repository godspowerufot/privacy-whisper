export default function Footer() {
  return (
    <footer className="border-t border-zinc-900 mt-20 py-8 text-center text-zinc-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} ZamaPlay. All rights reserved.</p>
      </div>
    </footer>
  );
}
