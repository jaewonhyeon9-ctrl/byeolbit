const STARS = (() => {
  let seed = 1234567;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: 40 }, (_, i) => ({
    id: i,
    top: rand() * 100,
    left: rand() * 100,
    size: 1 + rand() * 1.8,
    delay: rand() * 4,
    duration: 3 + rand() * 2.5,
    opacity: 0.15 + rand() * 0.35,
    hue: rand() > 0.6 ? 'gold' : 'warm',
  }));
})();

export function StarryBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {STARS.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full star-twinkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            background: s.hue === 'gold' ? '#c8943f' : '#b8956c',
            boxShadow: `0 0 ${s.size * 2}px rgba(184, 149, 108, 0.4)`,
          }}
        />
      ))}
    </div>
  );
}
