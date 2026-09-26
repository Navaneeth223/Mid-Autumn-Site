import { forwardRef } from 'react'

// ---------------------------------------------------------------------------
// Jade Rabbit (玉兔) — inlined from jade-rabbit.svg so the pestle + paws can
// carry their own CSS animation (the "pounding" wobble, see index.css).
// The rabbit hops in from a random corner (parent handles the tween), idles,
// and every tap bursts osmanthus petals via onPound(x, y).
// ---------------------------------------------------------------------------
const JadeRabbit = forwardRef(function JadeRabbit({ onPound, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label="jade rabbit — tap me"
      onPointerDown={(e) => onPound?.(e.clientX, e.clientY)}
      className="absolute z-20 block cursor-pointer border-0 bg-transparent p-0"
      style={{ width: 'clamp(84px, 19vw, 132px)', opacity: 0, visibility: 'hidden' }}
      {...rest}
    >
      <div className="floaty">
        <svg viewBox="0 0 240 240" className="block h-auto w-full drop-shadow-[0_12px_24px_var(--shadow)]">
          <defs>
            <radialGradient id="jrBody" cx="38%" cy="30%" r="85%">
              <stop offset="0%" stopColor="#FFFEFA" />
              <stop offset="48%" stopColor="#F8EDD9" />
              <stop offset="100%" stopColor="#E0C6A0" />
            </radialGradient>
            <radialGradient id="jrHead" cx="40%" cy="32%" r="80%">
              <stop offset="0%" stopColor="#FFFEFB" />
              <stop offset="55%" stopColor="#F9EEDA" />
              <stop offset="100%" stopColor="#E6CFA9" />
            </radialGradient>
            <linearGradient id="jrEar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F8CFC5" />
              <stop offset="100%" stopColor="#E89990" />
            </linearGradient>
            <linearGradient id="jrGold" gradientUnits="userSpaceOnUse" x1="94" y1="178" x2="150" y2="214">
              <stop offset="0%" stopColor="#F3CE7B" />
              <stop offset="55%" stopColor="#D9A94E" />
              <stop offset="100%" stopColor="#A87A2E" />
            </linearGradient>
            <linearGradient id="jrWood" gradientUnits="userSpaceOnUse" x1="125" y1="112" x2="137" y2="115">
              <stop offset="0%" stopColor="#C69055" />
              <stop offset="100%" stopColor="#8F6437" />
            </linearGradient>
            <radialGradient id="jrBlush" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F6ACA1" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#F6ACA1" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ground shadow */}
          <ellipse cx="121" cy="212" rx="58" ry="9" fill="#14102A" opacity="0.3" />

          {/* osmanthus sprig tucked behind the right ear */}
          <g>
            <path d="M136,64 C146,52 156,44 164,36" stroke="#8C6B3F" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="149" cy="51" rx="5.5" ry="2.4" fill="#A8B48A" transform="rotate(-42 149 51)" />
            <g fill="#F0C767">
              <circle cx="150" cy="48" r="1.9" /><circle cx="154.5" cy="46.5" r="1.9" /><circle cx="151" cy="43.5" r="1.9" /><circle cx="146.5" cy="45" r="1.9" />
              <circle cx="161" cy="39" r="1.9" /><circle cx="165.5" cy="37.5" r="1.9" /><circle cx="162" cy="34.5" r="1.9" /><circle cx="157.5" cy="36" r="1.9" />
              <circle cx="168" cy="31" r="1.9" /><circle cx="171" cy="28.5" r="1.9" /><circle cx="168.5" cy="26" r="1.9" /><circle cx="165.5" cy="28.5" r="1.9" />
            </g>
            <circle cx="150.8" cy="45.8" r="1.2" fill="#C89B4B" />
            <circle cx="161.8" cy="36.8" r="1.2" fill="#C89B4B" />
            <circle cx="168.8" cy="28.8" r="1.2" fill="#C89B4B" />
          </g>

          {/* ears */}
          <ellipse cx="103" cy="52" rx="12.5" ry="36" fill="url(#jrBody)" transform="rotate(-12 103 52)" />
          <ellipse cx="104" cy="56" rx="6.5" ry="25" fill="url(#jrEar)" transform="rotate(-12 104 56)" />
          <ellipse cx="141" cy="52" rx="12.5" ry="36" fill="url(#jrBody)" transform="rotate(12 141 52)" />
          <ellipse cx="140" cy="56" rx="6.5" ry="25" fill="url(#jrEar)" transform="rotate(12 140 56)" />

          {/* tail */}
          <circle cx="166" cy="152" r="11.5" fill="#FFFDF6" />

          {/* body */}
          <ellipse cx="121" cy="150" rx="45" ry="42" fill="url(#jrBody)" />

          {/* hind feet */}
          <ellipse cx="92" cy="196" rx="14" ry="8.5" fill="url(#jrHead)" />
          <ellipse cx="152" cy="196" rx="14" ry="8.5" fill="url(#jrHead)" />
          <ellipse cx="90" cy="197.5" rx="9" ry="4" fill="#E9D2AC" opacity="0.55" />
          <ellipse cx="154" cy="197.5" rx="9" ry="4" fill="#E9D2AC" opacity="0.55" />

          {/* rim light */}
          <path d="M84,132 A45,42 0 0 1 106,113" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* head */}
          <circle cx="121" cy="97" r="36" fill="url(#jrHead)" />
          <path d="M90,82 A36,36 0 0 1 106,64" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* face */}
          <ellipse cx="107" cy="100" rx="3.4" ry="4.6" fill="#38271B" />
          <ellipse cx="135" cy="100" rx="3.4" ry="4.6" fill="#38271B" />
          <circle cx="108.4" cy="98.2" r="1.25" fill="#FFFDF6" />
          <circle cx="136.4" cy="98.2" r="1.25" fill="#FFFDF6" />
          <path d="M117.8,109 Q121,106.4 124.2,109 Q121,112.6 117.8,109 Z" fill="#DE9480" />
          <path d="M121,112.5 L121,115 M121,115 Q117.5,118.5 114.2,115.6 M121,115 Q124.5,118.5 127.8,115.6" stroke="#38271B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="99" cy="110" r="7" fill="url(#jrBlush)" />
          <circle cx="143" cy="110" r="7" fill="url(#jrBlush)" />
          <g stroke="#C7A276" strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round">
            <path d="M93,107 L79,103.5" fill="none" />
            <path d="M93,111 L80,114" fill="none" />
            <path d="M149,107 L163,103.5" fill="none" />
            <path d="M149,111 L162,114" fill="none" />
          </g>

          {/* mortar — painted before the pestle so the shaft sits inside it */}
          <path d="M94,186 Q94,212 122,213 Q150,212 150,186 Z" fill="url(#jrGold)" />
          <ellipse cx="122" cy="186" rx="28" ry="7.5" fill="#6E4A22" stroke="#E9BE6A" strokeWidth="1.5" />
          <path d="M97,183.5 A28,7.5 0 0 1 147,183.5" stroke="#FFE9B0" strokeOpacity="0.85" strokeWidth="1.6" fill="none" strokeLinecap="round" />

          {/* pestle + paws — animated as one "pounding" group; the grip sits at
              the shoulder so the shaft clears the face */}
          <g className="rabbit-pestle">
            <line x1="146" y1="134" x2="120" y2="185" stroke="url(#jrWood)" strokeWidth="11.5" strokeLinecap="round" />
            <ellipse cx="139.5" cy="146.5" rx="10.5" ry="8" fill="url(#jrHead)" transform="rotate(-16 139.5 146.5)" />
            <ellipse cx="131.5" cy="162.5" rx="10.5" ry="8" fill="url(#jrHead)" transform="rotate(-24 131.5 162.5)" />
            <ellipse cx="125" cy="175" rx="7" ry="3" fill="#F0C767" transform="rotate(-13 125 175)" />
          </g>

          {/* near rim of the mortar, drawn over the pestle tip */}
          <path d="M96,186 Q122,198 148,186 L145.5,193.5 Q122,204 98.5,193.5 Z" fill="url(#jrGold)" />
        </svg>
      </div>
    </button>
  )
})

export default JadeRabbit
