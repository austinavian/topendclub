// One source for every navigation surface: top bar, mobile tab bar, footer.
export const primaryNav = [
  { label: 'Events', href: '/events/' },
  { label: 'News', href: '/news/' },
  { label: 'D.R.A.W.', href: '/draw/' },
  { label: 'Sponsors', href: '/sponsors/' },
  { label: 'Branding', href: '/branding/' },
  { label: 'About', href: '/about/' },
] as const;

// Mobile tab bar, after the concept mockup (Home sits in the middle as the club icon).
export const tabBar = [
  { label: 'Events', href: '/events/', icon: 'events' },
  { label: 'D.R.A.W.', href: '/draw/', icon: 'draw' },
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'News', href: '/news/', icon: 'news' },
  { label: 'About', href: '/about/', icon: 'about' },
] as const;
