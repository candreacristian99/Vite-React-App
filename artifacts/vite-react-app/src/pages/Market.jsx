import { useState } from 'react';
import Browse from './Browse.jsx';
import Listings from './Listings.jsx';
import Deals from './Deals.jsx';

const SECTIONS = [
  ['browse', 'Browse'],
  ['mine', 'Your listings'],
  ['deals', 'Deals'],
];

export default function Market({ user, openDeals = false }) {
  const [section, setSection] = useState(openDeals ? 'deals' : 'browse');

  return (
    <section className="page-enter">
      <div className="mb-5 flex gap-1 rounded-2xl border border-[rgba(147,197,253,.22)] bg-white/[0.04] p-1">
        {SECTIONS.map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
              section === id
                ? 'bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white'
                : 'text-white/45 hover:text-white/80'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {section === 'browse' && <Browse user={user} onContact={() => setSection('deals')} />}
      {section === 'mine' && <Listings user={user} />}
      {section === 'deals' && <Deals user={user} />}
    </section>
  );
}
