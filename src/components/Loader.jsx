import React from 'react';

export default function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <img
        src="/logo.png"
        alt="Loading…"
        className="w-16 h-16 object-contain animate-spin"
        style={{ animationDuration: '1.2s' }}
      />
    </div>
  );
}
