export default function NoirCartoonAvatar({ character, isTalking = false }) {
  const type = character.id; // 1: SpongeBob (Default Lvl 1), 2: Minion (Lvl 2), 3: Doraemon (Lvl 3), 4: Spider-Man (Lvl 4)

  return (
    <svg
      viewBox="0 0 340 320"
      className="h-full w-full"
      preserveAspectRatio="xMidYMax meet"
    >
      {/* =========================================================
          1. SPONGEBOB (LEVEL 1 // DEFAULT UNLOCKED)
      ========================================================== */}
      {type === 1 && (
        <g>
          {/* White Shirt & Brown Pants */}
          <rect x="80" y="215" width="180" height="42" fill="#ede2cf" stroke="#292522" strokeWidth="6" />
          <rect x="80" y="257" width="180" height="55" fill="#5c3f28" stroke="#292522" strokeWidth="6" />
          {/* Belt Dashes */}
          <rect x="98" y="264" width="22" height="7" fill="#24211e" />
          <rect x="135" y="264" width="22" height="7" fill="#24211e" />
          <rect x="183" y="264" width="22" height="7" fill="#24211e" />
          <rect x="220" y="264" width="22" height="7" fill="#24211e" />
          {/* Collar & Tie */}
          <path d="M145 215 L162 240 L170 215Z" fill="#ede2cf" stroke="#292522" strokeWidth="3.5" />
          <path d="M195 215 L178 240 L170 215Z" fill="#ede2cf" stroke="#292522" strokeWidth="3.5" />
          <path d="M164 226 L176 226 L182 272 L170 282 L158 272Z" fill="#8b1717" stroke="#292522" strokeWidth="3.5" />

          {/* Sponge Head */}
          <path
            d="M80 65
               Q76 102 80 140
               Q76 178 80 215
               L260 215
               Q264 178 260 140
               Q264 102 260 65Z"
            fill="#cfad48"
            stroke="#292522"
            strokeWidth="7"
          />

          {/* Pores */}
          <circle cx="102" cy="85" r="8" fill="#b39234" opacity="0.6" />
          <circle cx="238" cy="90" r="10" fill="#b39234" opacity="0.6" />
          <circle cx="98" cy="185" r="9" fill="#b39234" opacity="0.6" />
          <circle cx="242" cy="180" r="8" fill="#b39234" opacity="0.6" />
          <circle cx="170" cy="78" r="6" fill="#b39234" opacity="0.6" />

          {/* Big Cartoon Eyes */}
          <circle cx="138" cy="120" r="27" fill="#ede2cf" stroke="#292522" strokeWidth="5" />
          <circle cx="202" cy="120" r="27" fill="#ede2cf" stroke="#292522" strokeWidth="5" />
          <circle cx="138" cy="120" r="13" fill="#427891" />
          <circle cx="202" cy="120" r="13" fill="#427891" />
          <circle cx="138" cy="120" r="6" fill="#24211e" />
          <circle cx="202" cy="120" r="6" fill="#24211e" />
          <circle cx="135" cy="116" r="3" fill="#ffffff" />
          <circle cx="199" cy="116" r="3" fill="#ffffff" />

          {/* Eyelashes */}
          <path d="M124 92 L119 82 M138 89 L138 78 M152 92 L157 82" stroke="#292522" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M188 92 L183 82 M202 89 L202 78 M216 92 L221 82" stroke="#292522" strokeWidth="3.5" strokeLinecap="round" />

          {/* Monocle on Right Eye */}
          <circle cx="202" cy="120" r="31" fill="none" stroke="#8b1717" strokeWidth="4.5" />
          <path d="M233 120 Q248 150 230 215" fill="none" stroke="#8b1717" strokeWidth="2.5" strokeDasharray="3,3" />

          {/* Nose */}
          <ellipse cx="170" cy="136" rx="7" ry="14" fill="#cfad48" stroke="#292522" strokeWidth="4.5" />

          {/* Cheeks */}
          <ellipse cx="112" cy="146" rx="10" ry="7" fill="#8b1717" opacity="0.4" />
          <ellipse cx="228" cy="146" rx="10" ry="7" fill="#8b1717" opacity="0.4" />

          {/* Smile & Buck Teeth */}
          <path d="M125 156 Q170 188 215 156" fill="none" stroke="#292522" strokeWidth="4.5" strokeLinecap="round" />
          <rect x="159" y="168" width="10" height="13" fill="#ede2cf" stroke="#292522" strokeWidth="3.5" />
          <rect x="171" y="168" width="10" height="13" fill="#ede2cf" stroke="#292522" strokeWidth="3.5" />

          {/* Detective Fedora Hat */}
          <path d="M118 62 Q170 24 222 62Z" fill="#24211e" stroke="#292522" strokeWidth="6" />
          <path d="M122 58 Q170 52 218 58 L216 63 Q170 57 124 63Z" fill="#8b1717" />
          <path d="M72 62 Q170 42 268 62 Q170 74 72 62Z" fill="#24211e" stroke="#292522" strokeWidth="6" />
        </g>
      )}

      {/* =========================================================
          2. MINION (LEVEL 2 // UNLOCK AT 2 WINS)
      ========================================================== */}
      {type === 2 && (
        <g>
          {/* Main Yellow Body */}
          <path
            d="M90 310 L90 120 Q90 35 170 35 Q250 35 250 120 L250 310Z"
            fill="#d6a638"
            stroke="#292522"
            strokeWidth="6"
          />

          {/* Classic Denim Overalls */}
          <path
            d="M90 235 L90 315 L250 315 L250 235 L225 235 L225 205 L115 205 L115 235Z"
            fill="#2c4d6f"
            stroke="#292522"
            strokeWidth="6"
          />
          {/* Overall Straps */}
          <path d="M90 190 L125 220 L110 235 L90 205Z" fill="#2c4d6f" stroke="#292522" strokeWidth="5" />
          <path d="M250 190 L215 220 L230 235 L250 205Z" fill="#2c4d6f" stroke="#292522" strokeWidth="5" />
          {/* Strap Buttons */}
          <circle cx="118" cy="226" r="5" fill="#24211e" />
          <circle cx="222" cy="226" r="5" fill="#24211e" />
          {/* Front Pocket & Gru 'G' Logo */}
          <path d="M142 240 H198 V275 Q170 288 142 275Z" fill="#223d59" stroke="#292522" strokeWidth="4" />
          <circle cx="170" cy="258" r="9" fill="#24211e" />
          <path d="M166 253 H174 V263 H166Z" fill="#d6a638" />

          {/* Black Goggle Strap */}
          <rect x="75" y="105" width="190" height="20" fill="#24211e" rx="4" />

          {/* Double Metal Goggles */}
          <circle cx="138" cy="115" r="32" fill="#c4b8a5" stroke="#292522" strokeWidth="6" />
          <circle cx="202" cy="115" r="32" fill="#c4b8a5" stroke="#292522" strokeWidth="6" />
          <circle cx="138" cy="115" r="23" fill="#ede2cf" stroke="#292522" strokeWidth="4" />
          <circle cx="202" cy="115" r="23" fill="#ede2cf" stroke="#292522" strokeWidth="4" />

          {/* Brown Eyes & Pupils */}
          <circle cx="138" cy="115" r="9" fill="#5c3a21" />
          <circle cx="202" cy="115" r="9" fill="#5c3a21" />
          <circle cx="138" cy="115" r="4.5" fill="#24211e" />
          <circle cx="202" cy="115" r="4.5" fill="#24211e" />
          <circle cx="135" cy="112" r="2.5" fill="#ffffff" />
          <circle cx="199" cy="112" r="2.5" fill="#ffffff" />

          {/* Fedora Hat */}
          <path d="M118 48 Q170 10 222 48Z" fill="#24211e" stroke="#292522" strokeWidth="6" />
          <path d="M122 44 Q170 38 218 44 L216 49 Q170 43 124 49Z" fill="#8b1717" />
          <path d="M85 48 Q170 28 255 48 Q170 60 85 48Z" fill="#24211e" stroke="#292522" strokeWidth="6" />

          {/* Smile */}
          <path
            d={isTalking ? "M152 172 Q170 190 188 172" : "M152 170 Q170 182 188 170"}
            fill="none"
            stroke="#292522"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* =========================================================
          3. DORAEMON (LEVEL 3 // UNLOCK AT 5 WINS)
      ========================================================== */}
      {type === 3 && (
        <g>
          {/* Broad Chubby Blue Body & Arms */}
          <path
            d="M30 315
               Q40 200 115 188
               L225 188
               Q300 200 310 315Z"
            fill="#2c5173"
            stroke="#292522"
            strokeWidth="6"
          />
          {/* Big White Belly */}
          <path
            d="M95 315
               Q90 208 170 208
               Q250 208 245 315Z"
            fill="#ede2cf"
            stroke="#292522"
            strokeWidth="5"
          />
          {/* 4D Pocket */}
          <path
            d="M128 245 H212 Q212 292 170 292 Q128 292 128 245Z"
            fill="#ede2cf"
            stroke="#292522"
            strokeWidth="4"
          />

          {/* Big Round Head */}
          <circle cx="170" cy="115" r="92" fill="#2c5173" stroke="#292522" strokeWidth="6" />

          {/* Wide White Face */}
          <ellipse cx="170" cy="132" rx="78" ry="68" fill="#ede2cf" stroke="#292522" strokeWidth="5" />

          {/* Big Cartoon Eyes */}
          <ellipse cx="150" cy="85" rx="20" ry="26" fill="#ede2cf" stroke="#292522" strokeWidth="4.5" />
          <ellipse cx="190" cy="85" rx="20" ry="26" fill="#ede2cf" stroke="#292522" strokeWidth="4.5" />
          <ellipse cx="154" cy="87" rx="4.5" ry="7" fill="#24211e" />
          <ellipse cx="186" cy="87" rx="4.5" ry="7" fill="#24211e" />
          <circle cx="152" cy="83" r="2" fill="#ffffff" />
          <circle cx="184" cy="83" r="2" fill="#ffffff" />

          {/* Monocle over Right Eye */}
          <circle cx="190" cy="85" r="25" fill="none" stroke="#c99d34" strokeWidth="4.5" />
          <path d="M215 85 Q238 120 205 190" fill="none" stroke="#c99d34" strokeWidth="2.5" strokeDasharray="3,2" />

          {/* Red Nose & Whiskers */}
          <circle cx="170" cy="110" r="11" fill="#8b1717" stroke="#292522" strokeWidth="3.5" />
          <circle cx="166" cy="107" r="3" fill="#ede2cf" />
          <path d="M170 121 V162" stroke="#292522" strokeWidth="4" />

          {/* Whiskers */}
          <path d="M102 120 H152 M98 134 H148 M102 148 H152" stroke="#292522" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M188 120 H238 M192 134 H242 M188 148 H238" stroke="#292522" strokeWidth="3.5" strokeLinecap="round" />

          {/* Smile */}
          <path
            d={isTalking ? "M118 148 Q170 192 222 148" : "M122 150 Q170 184 218 150"}
            fill="none"
            stroke="#292522"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Red Collar & Golden Bell */}
          <path d="M98 186 Q170 204 242 186" stroke="#8b1717" strokeWidth="14" strokeLinecap="round" />
          <circle cx="170" cy="198" r="15" fill="#c99d34" stroke="#292522" strokeWidth="4" />
          <line x1="158" y1="195" x2="182" y2="195" stroke="#292522" strokeWidth="2.5" />
          <circle cx="170" cy="202" r="4" fill="#24211e" />

          {/* Detective Cap */}
          <path
            d="M110 50
               Q170 10 230 50
               L252 54
               Q170 36 88 54Z"
            fill="#24211e"
            stroke="#292522"
            strokeWidth="6"
          />
          <path d="M118 47 Q170 38 222 47" stroke="#8b1717" strokeWidth="4.5" fill="none" />
          <path d="M82 54 Q170 34 258 54 Q170 66 82 54Z" fill="#24211e" stroke="#292522" strokeWidth="6" />
        </g>
      )}

      {/* =========================================================
          4. SPIDER-MAN (LEVEL 4 // UNLOCK AT 10 WINS)
      ========================================================== */}
      {type === 4 && (
        <g>
          {/* Wide Athletic Shoulders & Dark Noir Coat */}
          <path
            d="M20 320
               Q45 195 120 178
               L220 178
               Q295 195 320 320Z"
            fill="#24211e"
            stroke="#292522"
            strokeWidth="6"
          />

          {/* Crimson Web Chest Inset */}
          <path
            d="M120 178 L170 240 L220 178Z"
            fill="#7a1818"
            stroke="#292522"
            strokeWidth="4"
          />
          {/* Vertical & Radial Web on Chest */}
          <path d="M170 178 V240" stroke="#292522" strokeWidth="3" />
          <path d="M136 198 Q170 210 204 198" stroke="#292522" strokeWidth="2.5" fill="none" />
          <path d="M148 218 Q170 228 192 218" stroke="#292522" strokeWidth="2.5" fill="none" />

          {/* Coat Lapels */}
          <path d="M120 178 L155 255 L168 220 L140 170Z" fill="#171513" stroke="#292522" strokeWidth="3" />
          <path d="M220 178 L185 255 L172 220 L200 170Z" fill="#171513" stroke="#292522" strokeWidth="3" />

          {/* Muscular Neck with Web Lines */}
          <path
            d="M138 135
               Q132 178 130 185
               H210
               Q208 178 202 135Z"
            fill="#7a1818"
            stroke="#292522"
            strokeWidth="5"
          />
          <path d="M170 135 V185" stroke="#292522" strokeWidth="2.5" />
          <path d="M135 155 Q170 168 205 155" stroke="#292522" strokeWidth="2.5" fill="none" />
          <path d="M132 175 Q170 188 208 175" stroke="#292522" strokeWidth="2.5" fill="none" />

          {/* Authentic Comic Spider-Man Head */}
          <path
            d="M170 32
               Q238 32 242 105
               Q245 158 170 178
               Q95 158 98 105
               Q102 32 170 32Z"
            fill="#7a1818"
            stroke="#292522"
            strokeWidth="6"
          />

          {/* Web Lines on Mask */}
          <path d="M170 32 V178" stroke="#292522" strokeWidth="3" />
          <path d="M98 105 H242" stroke="#292522" strokeWidth="3" />
          <path d="M112 55 L228 155" stroke="#292522" strokeWidth="2.5" />
          <path d="M228 55 L112 155" stroke="#292522" strokeWidth="2.5" />
          <path d="M135 38 L205 172" stroke="#292522" strokeWidth="2.5" />
          <path d="M205 38 L135 172" stroke="#292522" strokeWidth="2.5" />

          {/* Concentric Web Rings */}
          <ellipse cx="170" cy="105" rx="26" ry="32" fill="none" stroke="#292522" strokeWidth="2.5" />
          <ellipse cx="170" cy="105" rx="52" ry="62" fill="none" stroke="#292522" strokeWidth="2.5" />

          {/* Signature Comic White Lenses */}
          <path d="M120 78 Q152 64 162 110 Q132 120 120 78Z" fill="#24211e" />
          <path d="M123 82 Q149 70 157 108 Q133 116 123 82Z" fill="#ede2cf" stroke="#292522" strokeWidth="3" />

          <path d="M220 78 Q188 64 178 110 Q208 120 220 78Z" fill="#24211e" />
          <path d="M217 82 Q191 70 183 108 Q207 116 217 82Z" fill="#ede2cf" stroke="#292522" strokeWidth="3" />

          {/* Round Vintage Detective Eyeglasses over Mask */}
          <circle cx="140" cy="98" r="26" fill="none" stroke="#24211e" strokeWidth="5" />
          <circle cx="200" cy="98" r="26" fill="none" stroke="#24211e" strokeWidth="5" />
          <path d="M166 98 H174" stroke="#24211e" strokeWidth="5" />
          <path d="M114 98 L104 90" stroke="#24211e" strokeWidth="3.5" />
          <path d="M226 98 L236 90" stroke="#24211e" strokeWidth="3.5" />
        </g>
      )}
    </svg>
  );
}
