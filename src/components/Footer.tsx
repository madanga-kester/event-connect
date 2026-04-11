const Footer = () => (
  <footer className="border-t border-border py-10">
    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
      <span className="text-gradient font-display font-bold text-sm">LinkUp254</span>
      <p>&copy; 2026 LinkUp254. All rights reserved.</p>
      <div className="flex gap-4">
        <a href="#" className="hover:text-foreground transition-colors">About</a>
        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
      </div>
    </div>
  </footer>
);

export default Footer;
