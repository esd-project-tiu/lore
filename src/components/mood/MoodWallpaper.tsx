import React, { useRef, useState } from 'react';
import { MoodType, MOODS } from './moodConfigs';
import { Download, Check } from 'lucide-react';
import { CartographicCompass } from '../CartographicCompass';

interface MoodWallpaperProps {
  mood: MoodType;
  worldTitle: string;
}

export const MoodWallpaper: React.FC<MoodWallpaperProps> = ({ mood, worldTitle }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Client-side SVG-to-PNG download engine
  const handleDownloadPNG = async () => {
    if (!svgRef.current) return;
    setIsExporting(true);

    try {
      const svgElement = svgRef.current;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(image, 0, 0, 1920, 1080);
          canvas.toBlob((blob) => {
            if (blob) {
              const pngUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              const sanitizedTitle = worldTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              link.download = `lore-${sanitizedTitle}-${mood}-atlas-1080p.png`;
              link.href = pngUrl;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(pngUrl);

              setDownloadSuccess(true);
              setTimeout(() => setDownloadSuccess(false), 3500);
            }
            setIsExporting(false);
            URL.revokeObjectURL(blobURL);
          }, 'image/png');
        } else {
          setIsExporting(false);
          URL.revokeObjectURL(blobURL);
        }
      };

      image.onerror = () => {
        console.error('Failed to load SVG for conversion');
        setIsExporting(false);
        URL.revokeObjectURL(blobURL);
      };

      image.src = blobURL;
    } catch (err) {
      console.error('Error generating wallpaper PNG:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar on parchment */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#ead9b8] border-2 border-[#826a4c] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sc text-[#a2562b] uppercase tracking-widest font-bold">
              Cartographic Folio Wallpaper
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fbf4e4] border border-[#a89475] text-[#2b2118] font-notes">
              1920 × 1080 HD
            </span>
          </div>
          <p className="text-xs text-[#5a4632] mt-0.5 font-body">
            Procedural hand-drawn line art and watercolor wash for the <span className="font-semibold text-[#2b2118] capitalize">{mood}</span> disposition.
          </p>
        </div>

        <button
          onClick={handleDownloadPNG}
          disabled={isExporting}
          className="btn-seal w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-[#fbf4e4] border-t-transparent rounded-full animate-spin" />
              <span>Rendering PNG...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <Check size={14} className="text-emerald-200" />
              <span>Wallpaper Saved!</span>
            </>
          ) : (
            <>
              <Download size={14} />
              <span>Download as PNG</span>
            </>
          )}
        </button>
      </div>

      {/* SVG Wallpaper Display Frame */}
      <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden border-4 border-[#5a4632] shadow-2xl bg-[#f3e7cf] group">
        <svg
          ref={svgRef}
          viewBox="0 0 1920 1080"
          className="w-full h-full object-cover"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Paper Watercolor Washes */}
            {mood === 'cozy' && (
              <>
                <radialGradient id="cozy-paper-wash" cx="50%" cy="40%" r="75%">
                  <stop offset="0%" stopColor="#fbf0d9" />
                  <stop offset="50%" stopColor="#f3e2be" />
                  <stop offset="100%" stopColor="#e2caa0" />
                </radialGradient>
                <radialGradient id="hearth-candlelight" cx="65%" cy="65%" r="40%">
                  <stop offset="0%" stopColor="#e89838" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#a2562b" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#a2562b" stopOpacity="0" />
                </radialGradient>
              </>
            )}

            {mood === 'eerie' && (
              <>
                <linearGradient id="eerie-paper-wash" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#dbe8e3" />
                  <stop offset="45%" stopColor="#e3ede8" />
                  <stop offset="80%" stopColor="#d2e3dc" />
                  <stop offset="100%" stopColor="#c1d6ce" />
                </linearGradient>
                <radialGradient id="lichen-fog" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#43685e" stopOpacity="0.25" />
                  <stop offset="70%" stopColor="#43685e" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#43685e" stopOpacity="0" />
                </radialGradient>
              </>
            )}

            {mood === 'epic' && (
              <>
                <radialGradient id="epic-paper-wash" cx="50%" cy="30%" r="75%">
                  <stop offset="0%" stopColor="#f7e8e1" />
                  <stop offset="45%" stopColor="#eed4c8" />
                  <stop offset="85%" stopColor="#dfbeb0" />
                  <stop offset="100%" stopColor="#caa494" />
                </radialGradient>
                <linearGradient id="bronze-banner" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#9c2f2f" stopOpacity="0.28" />
                  <stop offset="60%" stopColor="#a2562b" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2b2118" stopOpacity="0" />
                </linearGradient>
              </>
            )}

            {mood === 'melancholy' && (
              <>
                <linearGradient id="melo-paper-wash" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e2ebef" />
                  <stop offset="40%" stopColor="#dce8ec" />
                  <stop offset="75%" stopColor="#cedee4" />
                  <stop offset="100%" stopColor="#bcd0d8" />
                </linearGradient>
                <linearGradient id="rain-wash" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4f7a8a" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#36535e" stopOpacity="0.35" />
                </linearGradient>
              </>
            )}

            {mood === 'hopeful' && (
              <>
                <linearGradient id="hope-paper-wash" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f5faee" />
                  <stop offset="40%" stopColor="#ebf5e3" />
                  <stop offset="75%" stopColor="#ddead3" />
                  <stop offset="100%" stopColor="#cddfc0" />
                </linearGradient>
                <radialGradient id="dawn-sunbeam" cx="50%" cy="65%" r="55%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#4a6b4f" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#4a6b4f" stopOpacity="0" />
                </radialGradient>
              </>
            )}

            {mood === 'chaotic' && (
              <>
                <radialGradient id="chaos-paper-wash" cx="50%" cy="50%" r="80%">
                  <stop offset="0%" stopColor="#f7e9e5" />
                  <stop offset="45%" stopColor="#eedad3" />
                  <stop offset="80%" stopColor="#e0c4bb" />
                  <stop offset="100%" stopColor="#cbaaa0" />
                </radialGradient>
                <linearGradient id="torn-ink" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#b3473b" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="#8a3328" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2b2118" stopOpacity="0" />
                </linearGradient>
              </>
            )}
          </defs>

          {/* 1. Base Aged Parchment & Watercolor Wash */}
          {mood === 'cozy' && <rect width="1920" height="1080" fill="url(#cozy-paper-wash)" />}
          {mood === 'eerie' && <rect width="1920" height="1080" fill="url(#eerie-paper-wash)" />}
          {mood === 'epic' && <rect width="1920" height="1080" fill="url(#epic-paper-wash)" />}
          {mood === 'melancholy' && <rect width="1920" height="1080" fill="url(#melo-paper-wash)" />}
          {mood === 'hopeful' && <rect width="1920" height="1080" fill="url(#hope-paper-wash)" />}
          {mood === 'chaotic' && <rect width="1920" height="1080" fill="url(#chaos-paper-wash)" />}

          {/* 2. Cartographic Latitude Grid and Constellation Rings */}
          <g opacity="0.35" stroke="#5a4632">
            <circle cx="960" cy="540" r="420" strokeWidth="1" strokeDasharray="6 6" fill="none" />
            <circle cx="960" cy="540" r="320" strokeWidth="0.8" fill="none" />
            <circle cx="960" cy="540" r="220" strokeWidth="1" strokeDasharray="3 3" fill="none" />
            <line x1="960" y1="60" x2="960" y2="1020" strokeWidth="0.8" strokeDasharray="4 4" />
            <line x1="120" y1="540" x2="1800" y2="540" strokeWidth="0.8" strokeDasharray="4 4" />
          </g>

          {/* 3. Hand-Drawn Inked Artwork per Mood */}

          {/* COZY: Hearth glow, timber cottage, curling chimney smoke, rolling autumn hills */}
          {mood === 'cozy' && (
            <g>
              <rect width="1920" height="1080" fill="url(#hearth-candlelight)" />
              {/* Rolling Inked Hills */}
              <path
                d="M-50,850 Q300,720 700,790 T1500,740 Q1750,720 2000,800 L2000,1080 L-50,1080 Z"
                fill="#ead9b8"
                stroke="#5a4632"
                strokeWidth="1.5"
              />
              <path
                d="M-50,920 Q400,840 900,890 T1920,860 L1920,1080 L-50,1080 Z"
                fill="#dfc99e"
                stroke="#3c2e22"
                strokeWidth="2"
              />
              {/* Timber Cottage with cross-hatching */}
              <polygon points="1200,770 1280,715 1360,770" fill="#fbf4e4" stroke="#2b2118" strokeWidth="2" />
              <rect x="1220" y="770" width="120" height="85" fill="#ead9b8" stroke="#2b2118" strokeWidth="2" />
              {/* Lit Window with warm amber glow */}
              <rect x="1255" y="790" width="45" height="45" rx="3" fill="#fbbf24" stroke="#2b2118" strokeWidth="2" />
              <line x1="1277" y1="790" x2="1277" y2="835" stroke="#2b2118" strokeWidth="2" />
              <line x1="1255" y1="812" x2="1300" y2="812" stroke="#2b2118" strokeWidth="2" />
              {/* Stone Chimney and Curling Ink Smoke */}
              <rect x="1320" y="710" width="22" height="38" fill="#d4be95" stroke="#2b2118" strokeWidth="2" />
              <path
                d="M1331,710 C1318,655 1365,615 1335,560 C1305,505 1365,450 1340,380"
                stroke="#a2562b"
                strokeWidth="2.5"
                strokeDasharray="5 7"
                fill="none"
              />
              {/* Stippled golden embers in the dusk */}
              <circle cx="650" cy="400" r="3" fill="#a2562b" />
              <circle cx="820" cy="350" r="4" fill="#c88647" />
              <circle cx="980" cy="450" r="3" fill="#a2562b" />
              <circle cx="1120" cy="380" r="3" fill="#c88647" />
            </g>
          )}

          {/* EERIE: Lichen grey-green fog wash, standing dolmen monoliths, cold ink runes */}
          {mood === 'eerie' && (
            <g>
              <rect width="1920" height="1080" fill="url(#lichen-fog)" />
              {/* Occult calibrated circles */}
              <g stroke="#43685e" strokeWidth="1.2" fill="none" opacity="0.6">
                <circle cx="960" cy="450" r="280" strokeDasharray="8 12" />
                <circle cx="960" cy="450" r="340" />
                <polygon points="960,110 1254,620 666,620" strokeDasharray="4 4" />
                <polygon points="960,790 1254,280 666,280" strokeDasharray="4 4" />
              </g>
              {/* Hand-drawn stone megalith / Dolmen */}
              <polygon points="930,240 990,240 1020,980 900,980" fill="#d0ded7" stroke="#1e2b26" strokeWidth="2.5" />
              <polygon points="930,240 960,185 990,240" fill="#b9cec5" stroke="#1e2b26" strokeWidth="2" />
              {/* Inked runes carved into megalith */}
              <line x1="960" y1="320" x2="960" y2="400" stroke="#43685e" strokeWidth="3" />
              <circle cx="960" cy="450" r="14" stroke="#43685e" strokeWidth="2.5" fill="none" />
              <line x1="945" y1="520" x2="975" y2="520" stroke="#43685e" strokeWidth="2.5" />
              <line x1="960" y1="510" x2="960" y2="570" stroke="#43685e" strokeWidth="2.5" />
              {/* Flanking stones */}
              <polygon points="680,480 730,480 750,980 660,980" fill="#d0ded7" stroke="#1e2b26" strokeWidth="2" />
              <polygon points="1210,480 1260,480 1280,980 1190,980" fill="#d0ded7" stroke="#1e2b26" strokeWidth="2" />
            </g>
          )}

          {/* EPIC: Banner crimson & bronze ochre, towering mountain spires, solar rays, soaring eagle */}
          {mood === 'epic' && (
            <g>
              <rect width="1920" height="1080" fill="url(#bronze-banner)" />
              {/* Radiating engraved sunburst */}
              <g stroke="#9c2f2f" strokeWidth="1.2" opacity="0.45">
                <line x1="960" y1="280" x2="200" y2="0" />
                <line x1="960" y1="280" x2="1720" y2="0" />
                <line x1="960" y1="280" x2="100" y2="400" />
                <line x1="960" y1="280" x2="1820" y2="400" />
                <line x1="960" y1="280" x2="500" y2="900" />
                <line x1="960" y1="280" x2="1420" y2="900" />
              </g>
              {/* Inked Sun Seal */}
              <circle cx="960" cy="280" r="85" fill="#fbf3ed" stroke="#9c2f2f" strokeWidth="2.5" />
              <circle cx="960" cy="280" r="115" stroke="#9c2f2f" strokeWidth="1.5" strokeDasharray="8 8" fill="none" opacity="0.7" />
              {/* Hand-drawn Craggy Mountain Peaks with cross-hatching */}
              <polygon points="960,420 600,950 1320,950" fill="#eed9cc" stroke="#2f1919" strokeWidth="2.5" />
              <polygon points="450,560 100,1020 800,1020" fill="#e2c5b5" stroke="#2f1919" strokeWidth="2" />
              <polygon points="1470,540 1100,1020 1850,1020" fill="#e2c5b5" stroke="#2f1919" strokeWidth="2" />
              {/* Mountain shading ridge */}
              <polygon points="960,420 960,950 1320,950" fill="#cfae9d" opacity="0.5" />
              {/* Soaring Heraldic Eagle */}
              <path
                d="M680,320 Q740,285 800,310 Q830,295 860,310 Q920,285 980,320 Q880,338 830,342 Q780,338 680,320 Z"
                fill="#9c2f2f"
              />
            </g>
          )}

          {/* MELANCHOLY: Sea blue-grey wash, fine rain streaks, submerged marble colonnades, crescent moon */}
          {mood === 'melancholy' && (
            <g>
              <rect width="1920" height="1080" fill="url(#rain-wash)" />
              {/* Crescent Moon in Ink */}
              <circle cx="1400" cy="280" r="50" fill="#fbf4e4" stroke="#36535e" strokeWidth="2" />
              <circle cx="1425" cy="270" r="45" fill="#dce8ec" />
              {/* Fine vertical rain streaks on parchment */}
              <g stroke="#4f7a8a" strokeWidth="1" opacity="0.45">
                {[...Array(26)].map((_, i) => (
                  <line
                    key={i}
                    x1={70 + i * 72}
                    y1={100 + (i % 5) * 45}
                    x2={40 + i * 72}
                    y2={380 + (i % 5) * 55}
                    strokeDasharray="12 16"
                  />
                ))}
              </g>
              {/* Submerged classical colonnades */}
              <g fill="#cedee4" stroke="#1a282e" strokeWidth="2">
                <rect x="300" y="620" width="45" height="260" />
                <rect x="430" y="600" width="45" height="280" />
                <rect x="560" y="650" width="45" height="230" />
                <rect x="690" y="580" width="45" height="300" />
                <rect x="260" y="590" width="510" height="25" />
                <path d="M810,880 Q880,710 980,880 Z" fill="#b9ced6" />
              </g>
              {/* Water waterline and mirror reflection */}
              <line x1="0" y1="880" x2="1920" y2="880" stroke="#36535e" strokeWidth="2" />
              <ellipse cx="1400" cy="940" rx="140" ry="12" fill="#4f7a8a" opacity="0.2" />
            </g>
          )}

          {/* HOPEFUL: Pale sage and dawn morning sunlight wash, soaring birds, floating sanctuaries */}
          {mood === 'hopeful' && (
            <g>
              <rect width="1920" height="1080" fill="url(#dawn-sunbeam)" />
              {/* Dawn Sunlight Sphere */}
              <circle cx="960" cy="680" r="160" fill="#fef08a" stroke="#7a9e70" strokeWidth="2" opacity="0.8" />
              {/* Floating Terraced Sanctuaries */}
              <g fill="#d8e8ce" stroke="#202b21" strokeWidth="2">
                <path d="M400,520 Q560,500 700,520 Q620,620 540,650 Q460,600 400,520 Z" />
                <path d="M1200,480 Q1380,450 1520,480 Q1420,590 1340,620 Q1260,560 1200,480 Z" />
                <path d="M820,380 Q960,350 1080,380 Q1000,470 940,490 Q880,450 820,380 Z" />
              </g>
              {/* Sanctuary Spire on Central Terraced Island */}
              <polygon points="940,360 960,250 980,360" fill="#4a6b4f" stroke="#202b21" strokeWidth="2" />
              {/* Migratory birds in ink */}
              <path d="M600,280 Q615,268 630,280 Q645,268 660,280" stroke="#202b21" strokeWidth="2.5" fill="none" />
              <path d="M720,240 Q732,230 745,240 Q758,230 770,240" stroke="#202b21" strokeWidth="2.5" fill="none" />
            </g>
          )}

          {/* CHAOTIC: Scratchy dry-brush ink hatching, torn deckled edges, erratic lightning */}
          {mood === 'chaotic' && (
            <g>
              <rect width="1920" height="1080" fill="url(#torn-ink)" />
              {/* Swirling Entropy Rings with scratchy dashes */}
              <g stroke="#b3473b" strokeWidth="1.5" fill="none">
                <ellipse cx="960" cy="540" rx="600" ry="240" transform="rotate(-25 960 540)" strokeDasharray="14 10" />
                <ellipse cx="960" cy="540" rx="420" ry="160" transform="rotate(35 960 540)" strokeDasharray="10 8" />
                <ellipse cx="960" cy="540" rx="260" ry="90" transform="rotate(-60 960 540)" strokeDasharray="6 6" />
              </g>
              {/* Erratic Inked Lightning Lines */}
              <polyline
                points="960,100 930,250 990,340 920,480 1020,620 950,780 1000,950"
                stroke="#8a3328"
                strokeWidth="3.5"
                fill="none"
              />
              <polyline
                points="500,200 580,320 540,410 650,560 610,720"
                stroke="#b3473b"
                strokeWidth="2.5"
                fill="none"
              />
              {/* Shattered Obsidian Shards */}
              <polygon points="780,380 840,320 860,400 810,430" fill="#eedad3" stroke="#8a3328" strokeWidth="2" />
              <polygon points="1120,360 1180,310 1220,390 1150,420" fill="#eedad3" stroke="#8a3328" strokeWidth="2" />
              <polygon points="920,640 1020,600 1050,680 940,710" fill="#eedad3" stroke="#8a3328" strokeWidth="2" />
            </g>
          )}

          {/* 4. Elegant Hand-Drawn Cartographic Border & Corner Flourishes */}
          <rect x="50" y="50" width="1820" height="980" stroke="#3c2e22" strokeWidth="2.5" fill="none" />
          <rect x="65" y="65" width="1790" height="950" stroke="#5a4632" strokeWidth="1" strokeDasharray="5 5" fill="none" />

          {/* Corner Cartographic Rosettes in Ink */}
          <g fill="#3c2e22">
            <circle cx="50" cy="50" r="6" />
            <line x1="50" y1="28" x2="50" y2="72" stroke="#3c2e22" strokeWidth="2" />
            <line x1="28" y1="50" x2="72" y2="50" stroke="#3c2e22" strokeWidth="2" />

            <circle cx="1870" cy="50" r="6" />
            <line x1="1870" y1="28" x2="1870" y2="72" stroke="#3c2e22" strokeWidth="2" />
            <line x1="1848" y1="50" x2="1892" y2="50" stroke="#3c2e22" strokeWidth="2" />

            <circle cx="50" cy="1030" r="6" />
            <line x1="50" y1="1008" x2="50" y2="1052" stroke="#3c2e22" strokeWidth="2" />
            <line x1="28" y1="1030" x2="72" y2="1030" stroke="#3c2e22" strokeWidth="2" />

            <circle cx="1870" cy="1030" r="6" />
            <line x1="1870" y1="1008" x2="1870" y2="1052" stroke="#3c2e22" strokeWidth="2" />
            <line x1="1848" y1="1030" x2="1892" y2="1030" stroke="#3c2e22" strokeWidth="2" />
          </g>

          {/* Inscriptions on Map Margin */}
          <text x="100" y="92" fill="#3c2e22" fontSize="13" fontFamily="'Cormorant SC', Georgia, serif" letterSpacing="4" fontWeight="600">
            L O R E   A T L A S   ·   H A N D - D R A W N   F O L I O
          </text>
          <text x="1820" y="92" textAnchor="end" fill="#5a4632" fontSize="13" fontFamily="'Special Elite', monospace" letterSpacing="2">
            45° 18' N  ·  12° 20' E
          </text>

          {/* Central Cartouche Title Scroll (Center Bottom) */}
          <g transform="translate(960, 960)" textAnchor="middle">
            <rect x="-380" y="-55" width="760" height="75" rx="8" fill="#fbf4e4" stroke="#3c2e22" strokeWidth="2" />
            <text y="-22" fill="#a2562b" fontSize="12" fontFamily="'Cormorant SC', Georgia, serif" letterSpacing="6" fontWeight="bold">
              {mood.toUpperCase()} DISPOSITION · REALM CARTOGRAPHY
            </text>
            <text y="12" fill="#2b2118" fontSize="26" fontFamily="'IM Fell English', Georgia, serif" fontWeight="600" letterSpacing="1">
              {worldTitle.toUpperCase()}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
