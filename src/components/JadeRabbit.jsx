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
          <ellipse cx="120" cy="212" rx="70" ry="10" fill="#1B1B3A" opacity="0.15" />
          {/* mortar bowl */}
          <path d="M83,176 L157,176 L146,206 Q120,217 94,206 Z" fill="#B9812E" />
          <ellipse cx="120" cy="178" rx="36" ry="9" fill="#7A5228" />
          {/* tail */}
          <circle cx="168" cy="158" r="11" fill="#FFFDF8" />
          {/* body */}
          <ellipse cx="120" cy="148" rx="46" ry="40" fill="#FCEFD9" />
          {/* feet */}
          <ellipse cx="98" cy="184" rx="14" ry="9" fill="#FCEFD9" />
          <ellipse cx="142" cy="184" rx="14" ry="9" fill="#FCEFD9" />
          {/* pestle + paws — animated as one "pounding" group */}
          <g className="rabbit-pestle">
            <line x1="126" y1="106" x2="118" y2="177" stroke="#8B5E34" strokeWidth="13" strokeLinecap="round" />
            <ellipse cx="104" cy="124" rx="16" ry="11" fill="#F7E7C7" stroke="#E8C88F" strokeWidth="1.5" transform="rotate(-22 104 124)" />
            <ellipse cx="138" cy="122" rx="16" ry="11" fill="#F7E7C7" stroke="#E8C88F" strokeWidth="1.5" transform="rotate(20 138 122)" />
          </g>
          {/* ears */}
          <ellipse cx="101" cy="86" rx="11" ry="37" fill="#FCEFD9" transform="rotate(-14 101 86)" />
          <ellipse cx="139" cy="86" rx="11" ry="37" fill="#FCEFD9" transform="rotate(14 139 86)" />
          <ellipse cx="102" cy="90" rx="5" ry="26" fill="#F2A9A0" transform="rotate(-14 102 90)" />
          <ellipse cx="138" cy="90" rx="5" ry="26" fill="#F2A9A0" transform="rotate(14 138 90)" />
          {/* head */}
          <circle cx="120" cy="96" r="33" fill="#FCEFD9" />
          {/* blush */}
          <circle cx="96" cy="104" r="6" fill="#F2A9A0" opacity="0.7" />
          <circle cx="144" cy="104" r="6" fill="#F2A9A0" opacity="0.7" />
          {/* face */}
          <ellipse cx="109" cy="94" rx="3.2" ry="4.4" fill="#3A2A1E" />
          <ellipse cx="131" cy="94" rx="3.2" ry="4.4" fill="#3A2A1E" />
          <ellipse cx="120" cy="104" rx="3" ry="2.2" fill="#D98A6B" />
          <path d="M113,110 Q120,115 127,110" stroke="#3A2A1E" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </button>
  )
})

export default JadeRabbit
