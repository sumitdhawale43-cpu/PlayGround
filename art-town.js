/* Kingdom Builder — town building artwork. */
(function () {
  'use strict';
  const KB = window.KBArt;

  KB.sprites.market = KB.wrap(`
    ${KB.defs}
    <defs>
      <linearGradient id="awningA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d67051"/><stop offset="1" stop-color="#9c3b2a"/></linearGradient>
      <linearGradient id="awningB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#66845d"/><stop offset="1" stop-color="#38553c"/></linearGradient>
      <linearGradient id="awningC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0bf73"/><stop offset="1" stop-color="#aa7e32"/></linearGradient>
    </defs>
    <ellipse cx="120" cy="233" rx="99" ry="19" fill="#1f351f" opacity=".33"/>
    <path d="M20 199 120 151l100 48-100 52-100-52Z" fill="#a69a80" opacity=".9"/>
    <path d="M27 199 120 155l93 44-93 48-93-48Z" fill="#b8aa8c"/>
    <path d="M27 199 120 155l93 44-93 48-93-48Z" fill="none" stroke="#8e8069" stroke-width="1"/>
    <g stroke="#8f8067" stroke-width="1.2">
      <path d="M42 198v9M58 206v9M74 214v9M91 222v9M124 230v9M141 222v9M158 214v9M174 206v9M190 198v9"/>
      <path d="M34 191l16 6M50 184l16 6M66 177l16 6M82 170l16 6M104 162l16 6M128 164l16 6M148 172l16 6M164 180l16 6M180 188l16 6" opacity=".5"/>
    </g>
    <!-- main stall -->
    <g>
      <path d="M47 166v42" stroke="#6b4829" stroke-width="4"/>
      <path d="M119 166v42" stroke="#6b4829" stroke-width="4"/>
      <path d="M42 168 83 148l40 20-41 20-40-20Z" fill="#7c5735"/>
      <path d="M43 162 83 142l41 20-7 7-34-17-34 17-6-7Z" fill="url(#awningA)"/>
      <path d="M48 166 83 149l35 17-2 4-33-16-33 16-2-4Z" fill="#f0dcb2"/>
      <path d="M56 174v27M78 174v27M99 174v27" stroke="#5f4227" stroke-width="2"/>
      <path d="M47 188h67v7H47z" fill="#a77c48" stroke="#654728"/>
      <circle cx="59" cy="194" r="5" fill="#ba8338"/><circle cx="74" cy="194" r="5" fill="#c99b48"/><circle cx="90" cy="194" r="5" fill="#a75439"/><circle cx="105" cy="194" r="4.5" fill="#b98a3f"/>
      <path d="M55 179h6v5h-6zM70 178h7v5h-7zM87 179h6v5h-6z" fill="#e0c37b"/>
    </g>
    <!-- green stall -->
    <g>
      <path d="M139 183v36M188 162v35" stroke="#694628" stroke-width="3.5"/>
      <path d="M134 183 165 167l31 15-31 16-31-15Z" fill="#765230"/>
      <path d="M135 177 165 161l32 16-6 6-26-13-26 13-5-6Z" fill="url(#awningB)"/>
      <path d="M139 182 165 169l27 13-2 4-25-12-25 12-2-4Z" fill="#e8d8b0"/>
      <path d="M141 196h45v6h-45z" fill="#9f7544" stroke="#5d4025"/>
      <path d="M146 188h8v6h-8zM158 188h8v6h-8zM170 188h8v6h-8z" fill="#7a9a55"/>
      <path d="M177 202v-9l10-4v13" fill="#825a34"/>
    </g>
    <!-- gold stall -->
    <g>
      <path d="M70 204v27M116 185v25" stroke="#674527" stroke-width="3"/>
      <path d="M65 203 92 190l26 13-27 14-26-14Z" fill="#815b34"/>
      <path d="M67 197 93 184l26 13-5 5-21-10-21 10-5-5Z" fill="url(#awningC)"/>
      <path d="M71 202 93 191l21 10-1 3-20-10-20 10-1-3Z" fill="#f2e2b9"/>
      <path d="M72 214h41v5H72z" fill="#8f6a3d"/>
      <path d="M80 207h5v6h-5zM90 207h5v6h-5zM100 207h5v6h-5z" fill="#cda54e"/>
    </g>
    <!-- barrels and crates -->
    <g>
      <ellipse cx="37" cy="217" rx="10" ry="4" fill="#4b341d" opacity=".4"/>
      <path d="M28 207h18v16H28z" fill="#8a5d35" stroke="#5b3d21"/>
      <path d="M28 211h18M28 218h18" stroke="#4a301b"/>
      <path d="M29 207c0-4 16-4 16 0" fill="none" stroke="#b68b55"/>
      <path d="M187 214h16v15h-16z" fill="#986d3f" stroke="#5d3d22"/>
      <path d="M187 214l8 6 8-6M195 220v9" stroke="#c19258"/>
    </g>
    <g>
      <path d="M120 143v-17" stroke="#694629" stroke-width="2"/>
      <path d="M120 127c10-4 20 0 25 7l-26 4v-11Z" fill="#b34e36"/>
      <path d="M69 148l-8 8M171 148l8 8" stroke="#7e5a33" stroke-width="1.5"/>
    </g>
    <g fill="#d5b362"><circle cx="28" cy="226" r="2"/><circle cx="211" cy="220" r="1.8"/><circle cx="202" cy="229" r="1.4"/></g>
  `);

  KB.sprites.chapel = KB.wrap(`
    ${KB.defs}
    <defs>
      <linearGradient id="chapRoof" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#596d74"/><stop offset="1" stop-color="#2d4148"/></linearGradient>
      <radialGradient id="rose"><stop offset="0" stop-color="#f4d88f"/><stop offset=".5" stop-color="#b95d46"/><stop offset="1" stop-color="#63304c"/></radialGradient>
    </defs>
    <ellipse cx="120" cy="236" rx="83" ry="16" fill="#1d331f" opacity=".33"/>
    <path d="M43 220c0-10 8-14 15-12 5-8 17-7 20 2 8-1 13 5 12 12l-2 8H45l-2-10Z" fill="#4e7042"/>
    <polygon points="43,153 112,187 112,228 43,194" fill="url(#stoneL)"/>
    <polygon points="112,187 160,164 160,205 112,228" fill="url(#stoneR)"/>
    <path d="M43 160 112 194l48-23M43 176l69 34 48-23" stroke="#817865" stroke-width="1.2" opacity=".48"/>
    <path d="M55 159v43M75 169v45M96 180v46M126 179v44M144 171v43" stroke="#8c836f" stroke-width="1.2" opacity=".38"/>
    <path d="M39 141 112 106l58 27-58 30-73-22Z" fill="#7d7563"/>
    <path d="M39 137 112 101l58 27-58 31-73-22Z" fill="url(#chapRoof)"/>
    <path d="M112 101v58M112 101l52 26" stroke="#1f343b" stroke-width="1.2" opacity=".5"/>
    <!-- side lancet windows -->
    <g>
      <path d="M57 176c0-13 20-13 20 0v21l-10 5-10-5v-21Z" fill="url(#rose)" stroke="#5c4d3a" stroke-width="1.4"/>
      <path d="M67 169v31M58 183h19" stroke="#6c543a" stroke-width="1"/>
      <path d="M83 185c0-11 18-11 18 0v18l-9 4-9-4v-18Z" fill="url(#glass)" stroke="#5c4d3a" stroke-width="1.3"/>
      <path d="M92 179v25" stroke="#6c543a" stroke-width="1"/>
    </g>
    <path d="M43 205h68v5H43z" fill="#a79e89" opacity=".6"/>
    <path d="M51 224v-16c0-10 25-10 25 0v16" fill="#4d3622" stroke="#5d4b37"/>
    <path d="M56 224v-15c0-7 14-7 14 0v15" fill="#2f2418"/>
    <!-- steeple -->
    <g>
      <polygon points="151,165 178,178 178,218 151,205" fill="url(#stoneR)"/>
      <polygon points="178,178 192,171 192,212 178,218" fill="#8c8370"/>
      <path d="M151 173h41M151 187h41" stroke="#6f6755" stroke-width="1.1" opacity=".4"/>
      <polygon points="150,164 178,150 199,160 178,174" fill="#b9b09c"/>
      <polygon points="150,156 178,141 199,151 178,165" fill="#c9c0ab"/>
      <path d="M151 152 178 138l21 10-21 13-21-13Z" fill="#7d7563"/>
      <path d="M170 155h11v27h-11z" fill="#433525"/>
      <path d="M176 101 152 150l26 19" fill="url(#chapRoof)"/>
      <path d="M176 101 176 169 202 151" fill="#2d4148"/>
      <path d="M176 100v-8M170 97h12" stroke="#d3aa54" stroke-width="2.4"/>
      <path d="M176 90V44" stroke="#4a3e2e" stroke-width="3"/>
      <path d="M176 45v-17M169 37h14" stroke="#cba452" stroke-width="2.2"/>
      <path d="M176 20c7-4 14-2 19 4-7 0-13 2-19 3v-7Z" fill="#b94933"/>
    </g>
    <!-- bird and shrubs -->
    <path d="M33 198c6-5 12-5 18 0M189 222c5-5 11-5 16 0" fill="none" stroke="#d8c7a0" stroke-width="1.8" opacity=".6"/>
    <path d="M29 222c2-9 11-11 16-5 5-5 12 0 11 7l-2 7H30l-1-9Z" fill="#5c7c49"/>
  `);

  KB.sprites.garden = KB.wrap(`
    <defs>
      <linearGradient id="hedge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e9252"/><stop offset="1" stop-color="#3c5e36"/></linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#83aaa2"/><stop offset="1" stop-color="#3b7278"/></linearGradient>
    </defs>
    <ellipse cx="120" cy="226" rx="94" ry="18" fill="#1e351f" opacity=".28"/>
    <path d="M22 188 120 140l98 48-98 52-98-52Z" fill="#4c6f3d"/>
    <path d="M31 188 120 145l89 43-89 47-89-47Z" fill="url(#hedge)"/>
    <path d="M31 188 120 145l89 43-89 47-89-47Z" fill="none" stroke="#789960" stroke-width="2"/>
    <path d="M47 191 120 156l73 35-73 38-73-38Z" fill="#88a866"/>
    <path d="M58 191 120 162l62 29-62 33-62-33Z" fill="#9eb878"/>
    <!-- central fountain -->
    <g>
      <ellipse cx="120" cy="196" rx="34" ry="16" fill="#8c816d"/>
      <ellipse cx="120" cy="193" rx="29" ry="13" fill="url(#water)" stroke="#d5c8a8" stroke-width="2"/>
      <path d="M120 192v-20" stroke="#a8a18d" stroke-width="4"/>
      <path d="M120 173c-4 0-6 4-3 7h7c3-4 1-7-3-7Z" fill="#cfc4a8"/>
      <path d="M120 173v-8" stroke="#7fa6a0" stroke-width="2"/>
      <path d="M112 177c-8 6-10 12-8 17M128 177c8 6 10 12 8 17" fill="none" stroke="#a7cbc0" stroke-width="1.5" opacity=".8"/>
      <ellipse cx="120" cy="193" rx="20" ry="8" fill="#b9d4c9" opacity=".25"/>
    </g>
    <!-- hedge topiary -->
    <g fill="#507241" stroke="#3e5e34" stroke-width="1">
      <circle cx="53" cy="188" r="10"/><circle cx="64" cy="194" r="8"/><circle cx="184" cy="191" r="10"/><circle cx="173" cy="198" r="8"/>
      <circle cx="80" cy="172" r="7"/><circle cx="159" cy="175" r="7"/>
    </g>
    <!-- arbor -->
    <g>
      <path d="M36 210V154M72 226V170M37 154c11-15 27-15 36 0" fill="none" stroke="#6c4b2c" stroke-width="3"/>
      <path d="M34 151c10-18 30-18 41 0" fill="none" stroke="#496f3e" stroke-width="6"/>
      <path d="M42 151c6-11 18-11 24 0" fill="none" stroke="#6e9556" stroke-width="3"/>
      <circle cx="45" cy="148" r="2" fill="#e5b7b3"/><circle cx="58" cy="145" r="1.7" fill="#e7cd7e"/><circle cx="65" cy="150" r="2" fill="#d6a7c6"/>
    </g>
    <!-- flowers -->
    <g>
      <circle cx="91" cy="217" r="2.3" fill="#df8f8c"/><circle cx="100" cy="222" r="2" fill="#e9cf77"/><circle cx="109" cy="226" r="1.7" fill="#cda1c6"/>
      <circle cx="132" cy="228" r="2.2" fill="#dd918d"/><circle cx="143" cy="223" r="1.8" fill="#f0d184"/><circle cx="152" cy="218" r="2" fill="#b99ccb"/>
      <circle cx="77" cy="204" r="1.8" fill="#f0cf7e"/><circle cx="165" cy="205" r="1.7" fill="#df9b95"/>
    </g>
    <path d="M82 201c3-5 8-5 11 0M147 207c3-5 8-5 11 0" fill="none" stroke="#5d7e47" stroke-width="1.5"/>
    <g fill="#dfb75e"><circle cx="28" cy="218" r="1.6"/><circle cx="211" cy="208" r="1.4"/><circle cx="200" cy="221" r="1.5"/></g>
  `);

  KB.sprites.tavern = KB.wrap(`
    ${KB.defs}
    <defs>
      <linearGradient id="tavRoof" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#7c5a39"/><stop offset="1" stop-color="#4b3120"/></linearGradient>
      <linearGradient id="tavRoof2" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#5f4229"/><stop offset="1" stop-color="#352218"/></linearGradient>
    </defs>
    <ellipse cx="120" cy="235" rx="83" ry="17" fill="#1d321e" opacity=".33"/>
    <path d="M43 220c0-9 7-13 14-11 5-8 16-7 20 2 7-1 12 4 12 10l-2 9H45l-2-10Z" fill="#527141"/>
    <polygon points="47,143 120,180 120,227 47,190" fill="url(#wallL)"/>
    <polygon points="120,180 182,148 182,195 120,227" fill="url(#wallR)"/>
    <path d="M47 150 120 187l62-32M47 165l73 37 62-32M47 180l73 37 62-32" stroke="#67462a" stroke-width="2.4" opacity=".88"/>
    <path d="M66 158v37M93 171v45M146 171v44M166 160v41" stroke="#624327" stroke-width="2.1" opacity=".7"/>
    <!-- upper windows -->
    <polygon points="57,157 75,166 75,181 57,172" fill="url(#glass)" stroke="#5c4027"/>
    <polygon points="137,173 154,165 154,183 137,191" fill="url(#glass)" stroke="#5c4027"/>
    <path d="M66 162v18M57 166l18 9M145 169v18M137 178l17-8" stroke="#6a492b" stroke-width=".9"/>
    <!-- ground floor inn windows + door -->
    <polygon points="79,188 101,199 101,218 79,207" fill="url(#glass)" stroke="#5a3e26" stroke-width="1.4"/>
    <path d="M90 194v22M79 198l22 10" stroke="#674629" stroke-width="1"/>
    <polygon points="137,193 157,183 157,207 137,217" fill="url(#glass)" stroke="#5a3e26" stroke-width="1.4"/>
    <path d="M147 188v25M137 201l20-10" stroke="#674629" stroke-width="1"/>
    <polygon points="107,198 123,190 123,222 107,230" fill="#573a24" stroke="#3d2918" stroke-width="1.3"/>
    <path d="M109 201v25M115 198v25M121 195v25" stroke="#382516" stroke-width=".8"/>
    <circle cx="120" cy="213" r="1.4" fill="#d6aa57"/>
    <!-- roof -->
    <path d="M42 136 120 98l67 32-5 8-62-28-62 28-6-8Z" fill="#4a2f1e"/>
    <polygon points="120,46 42,136 120,180" fill="url(#tavRoof)"/>
    <polygon points="120,46 187,130 120,180" fill="url(#tavRoof2)"/>
    <path d="M120 48v130M120 48l-75 86M120 48l63 83" stroke="#2f1e13" stroke-width="1" opacity=".45"/>
    <path d="M78 94c18 14 34 28 48 43M150 88c-8 26-24 48-44 64" stroke="#a87c52" stroke-width="1" opacity=".2" fill="none"/>
    <!-- chimney -->
    <polygon points="147,96 159,102 159,74 147,68" fill="#8b7963"/>
    <polygon points="159,102 167,98 167,70 159,74" fill="#635446"/>
    <path d="M147 74 159 68l8 4-8 4-12-2Z" fill="#b5a48d"/>
    <!-- hanging sign -->
    <g>
      <path d="M183 154v22" stroke="#4d3320" stroke-width="2.5"/>
      <path d="M183 156h24" stroke="#4d3320" stroke-width="2"/>
      <path d="M195 157v7" stroke="#a2814f" stroke-width="1.2"/>
      <path d="M186 164h18v15h-18z" fill="#9f6e3a" stroke="#533721" stroke-width="1.2"/>
      <path d="M190 169h10v6h-10z" fill="#6f4a29"/><path d="M192 169v6M197 169v6" stroke="#d1a45e" stroke-width="1"/>
    </g>
    <!-- lantern + barrels -->
    <circle cx="181" cy="213" r="5" fill="#e9b55d" opacity=".35"/>
    <circle cx="181" cy="213" r="3" fill="#f3c875" stroke="#654325" stroke-width=".8"/>
    <path d="M44 209h17v17H44z" fill="#8d6037" stroke="#56391f"/><path d="M44 214h17M44 221h17" stroke="#4b301a"/>
    <path d="M64 214h13v13H64z" fill="#79502f" stroke="#4e331d"/><path d="M64 218h13" stroke="#4b301a"/>
    <g><path d="M31 226c2-7 9-9 14-4" stroke="#547443" stroke-width="3" fill="none"/><circle cx="34" cy="220" r="2" fill="#e0b5a8"/><circle cx="42" cy="219" r="1.7" fill="#e8ce7c"/></g>
  `);

  KB.sprites.well = KB.wrap(`
    <defs>
      <linearGradient id="wellStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7bfa9"/><stop offset="1" stop-color="#7e7766"/></linearGradient>
      <linearGradient id="wellWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#487d82"/><stop offset="1" stop-color="#1f4e5a"/></linearGradient>
    </defs>
    <ellipse cx="120" cy="227" rx="67" ry="15" fill="#1f361f" opacity=".3"/>
    <path d="M60 186c0-11 26-20 60-20s60 9 60 20v20c0 13-27 23-60 23s-60-10-60-23v-20Z" fill="url(#wellStone)"/>
    <ellipse cx="120" cy="186" rx="60" ry="20" fill="#bdb49f"/>
    <ellipse cx="120" cy="186" rx="49" ry="15" fill="#3d6e75"/>
    <ellipse cx="120" cy="186" rx="42" ry="12" fill="url(#wellWater)"/>
    <path d="M70 193c12 11 29 16 50 16s38-5 50-16M64 201c14 14 34 20 56 20s42-6 56-20" fill="none" stroke="#918876" stroke-width="1.4" opacity=".6"/>
    <g fill="#a49b87" stroke="#7f7766" stroke-width=".8">
      <path d="M63 191h18v9H58Z"/><path d="M144 190h19l5 10h-20Z"/><path d="M86 207h18v9H83Z"/><path d="M130 209h17l2 8h-19Z"/>
    </g>
    <ellipse cx="120" cy="186" rx="30" ry="8" fill="#b9d6cd" opacity=".18"/>
    <path d="M73 188V128M167 188V128" stroke="#6d4a2b" stroke-width="5"/>
    <path d="M66 129c28-22 80-22 108 0" fill="none" stroke="#6b492c" stroke-width="5"/>
    <path d="M73 125c24-16 69-16 94 0" fill="none" stroke="#9a7145" stroke-width="2"/>
    <path d="M60 130 120 99l60 31-7 9-53-27-53 27-7-9Z" fill="#7f3c2c"/>
    <path d="M60 130 120 99l60 31-8 8-52-25-52 25-8-8Z" fill="#a8533a"/>
    <path d="M74 130c29-11 64-11 92 0" fill="none" stroke="#d18a65" stroke-width="1" opacity=".5"/>
    <path d="M120 130v21" stroke="#a98450" stroke-width="1.5"/>
    <path d="M112 150h16v4h-16z" fill="#8e6c3e"/>
    <path d="M114 154c0 7 12 7 12 0" fill="none" stroke="#84633c" stroke-width="2"/>
    <path d="M120 153v9" stroke="#c4a15f" stroke-width="1"/>
    <path d="M113 150c0-8 14-8 14 0v4h-14v-4Z" fill="#7c5a32" stroke="#5b3e24"/>
    <path d="M72 227c0-8 7-12 13-10 4-6 13-4 15 3l-1 11H73l-1-4Z" fill="#557544"/>
    <path d="M167 225c0-7 6-10 11-8 4-5 11-2 12 4l-1 9h-22v-5Z" fill="#4e6d40"/>
  `);

  KB.sprites.watchtower = KB.wrap(`
    ${KB.defs}
    <defs>
      <linearGradient id="twRoof" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#a24a35"/><stop offset="1" stop-color="#64251c"/></linearGradient>
    </defs>
    <ellipse cx="120" cy="236" rx="60" ry="14" fill="#1e341e" opacity=".33"/>
    <path d="M62 219c0-8 7-11 12-9 4-6 14-4 16 3l-1 11H64l-2-5Z" fill="#557443"/>
    <polygon points="81,102 120,122 120,226 81,206" fill="url(#stoneL)"/>
    <polygon points="120,122 159,102 159,206 120,226" fill="url(#stoneR)"/>
    <path d="M81 121h78M81 140h78M81 159h78M81 178h78M81 197h78" stroke="#7d7461" stroke-width="1.1" opacity=".5"/>
    <path d="M89 148h13l1 20H90l-1-20ZM139 169h11l1 17h-12v-17Z" fill="#4c4132" stroke="#6d6250"/>
    <path d="M89 157h13M89 164h13M139 178h11" stroke="#8f826a" stroke-width="1" opacity=".6"/>
    <polygon points="81 101 120 81l39 20v8l-39 20-39-20v-8Z" fill="#897f6b"/>
    <path d="M74 101 120 78l46 23-5 7-41-20-41 20-5-7Z" fill="#6f6553"/>
    <path d="M79 96v-8h8v5h9v-6h8v6h9v-6h8v6h9v-5h8v8" fill="#b1a890"/>
    <path d="M78 94 120 72l42 22v7l-42 21-42-21v-7Z" fill="#c1b8a2"/>
    <path d="M84 92 120 74l36 18-36 19-36-19Z" fill="#d0c7b0"/>
    <path d="M84 92 120 111l36-19-2-2-34 18-34-18-2 2Z" fill="#8d8370"/>
    <polygon points="120,14 76,94 120,119" fill="url(#twRoof)"/>
    <polygon points="120,14 120,119 164,94" fill="#752c21"/>
    <path d="M120 15v104M120 15 82 92M120 15l37 77" stroke="#551c15" stroke-width="1" opacity=".4"/>
    <path d="M120 13V-3" stroke="#d8b15e" stroke-width="2"/>
    <path d="M120-2c8-4 17-3 23 4-8 0-15 2-23 3V-2Z" fill="#c7a24f"/>
    <!-- wooden hoarding -->
    <path d="M78 105h84v13H78z" fill="#74502e" stroke="#4f351f"/>
    <path d="M82 105v13M94 105v13M106 105v13M118 105v13M130 105v13M142 105v13M154 105v13" stroke="#9b7042" stroke-width="1"/>
    <path d="M92 118v8M148 118v8" stroke="#6d4b2c" stroke-width="2"/>
    <!-- ladder -->
    <path d="M165 221V158M174 218V155" stroke="#7d5731" stroke-width="2.3"/>
    <path d="M165 165h9M165 177h9M165 189h9M165 201h9M165 213h9" stroke="#9f7545" stroke-width="1.5"/>
  `);

  KB.sprites.barracks = KB.wrap(`
    ${KB.defs}
    <defs>
      <linearGradient id="barRoof" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#a94d35"/><stop offset="1" stop-color="#6b281e"/></linearGradient>
      <linearGradient id="barRoof2" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#833725"/><stop offset="1" stop-color="#4d1b14"/></linearGradient>
    </defs>
    <ellipse cx="120" cy="237" rx="105" ry="18" fill="#1e331e" opacity=".33"/>
    <path d="M22 222c0-9 7-13 13-11 5-7 16-5 18 3 7-2 12 4 11 10l-1 8H24l-2-10Z" fill="#4d6d3f"/>
    <polygon points="24,159 91,192 91,230 24,197" fill="url(#stoneL)"/>
    <polygon points="91,192 194,144 194,182 91,230" fill="url(#stoneR)"/>
    <path d="M24 168 91 201l103-48M24 184l67 33 103-48" stroke="#77705f" stroke-width="1.1" opacity=".45"/>
    <path d="M38 164v43M56 173v44M74 182v45M108 182v44M128 171v44M150 162v44M172 152v44" stroke="#89816e" stroke-width="1.1" opacity=".34"/>
    <path d="M20 148 94 111l101 47-101 49-74-33Z" fill="#655e4e"/>
    <path d="M20 143 94 105l101 47-101 50-74-34Z" fill="url(#barRoof)"/>
    <path d="M94 105 195 152v5l-101 50v-102Z" fill="url(#barRoof2)"/>
    <path d="M94 106v100M94 106 25 139M94 106l96 44" stroke="#501b13" stroke-width="1.1" opacity=".42"/>
    <path d="M37 154h108v6H37z" fill="#d3ab5f" opacity=".35"/>
    <!-- gate -->
    <path d="M67 202v-20c0-17 34-17 34 0v20" fill="#4c3521" stroke="#5d4a35"/>
    <path d="M72 202v-17c0-12 24-12 24 0v17" fill="#2f2417"/>
    <path d="M78 202v-17M89 202v-17M95 202v-17" stroke="#624c35" stroke-width="1.5"/>
    <!-- shields -->
    <g>
      <path d="M110 187h16v14c0 7-8 10-8 10s-8-3-8-10v-14Z" fill="#315c48" stroke="#d4ac5d" stroke-width="1.6"/>
      <path d="M118 188v19M111 195h14" stroke="#d9b768" stroke-width="1.2"/>
      <path d="M149 174h15v13c0 7-7 10-7 10s-8-3-8-10v-13Z" fill="#8d3b2b" stroke="#d4ac5d" stroke-width="1.5"/>
      <path d="M156 174v19M150 181h13" stroke="#e1c174" stroke-width="1.1"/>
    </g>
    <!-- weapon rack -->
    <g transform="translate(176 204)">
      <path d="M-14 16V0M14 16V0M-14 2h28" stroke="#6f4b2b" stroke-width="2.5"/>
      <path d="M-10 4 0-13 10 4M0-13v26" stroke="#8c7f68" stroke-width="1.6"/>
      <path d="M-7 5h14" stroke="#6c5f4b" stroke-width="2"/>
      <path d="M-4 4v22M4 4v22" stroke="#a78852" stroke-width="1.5"/>
    </g>
    <path d="M201 224h20v-17" stroke="#74502f" stroke-width="2.5"/>
    <path d="M203 207c0-8 13-8 13 0" fill="#6f4d2f"/>
    <path d="M204 211h13v12h-13z" fill="#8b653d" stroke="#5a3c22"/>
    <g fill="#d8b35e"><circle cx="24" cy="227" r="1.5"/><circle cx="210" cy="217" r="1.5"/></g>
  `);

  KB.sprites.monument = KB.wrap(`
    ${KB.defs}
    <defs>
      <linearGradient id="monStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0d8c2"/><stop offset="1" stop-color="#9c927d"/></linearGradient>
      <radialGradient id="monGlow"><stop offset="0" stop-color="#f4d77d" stop-opacity=".8"/><stop offset="1" stop-color="#d4a94e" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="120" cy="233" rx="76" ry="16" fill="#1f351f" opacity=".33"/>
    <path d="M47 203 120 166l73 37-73 39-73-39Z" fill="#b5ab94"/>
    <path d="M58 203 120 171l62 32-62 34-62-34Z" fill="#c7bda6"/>
    <path d="M58 203v8l62 34 62-34v-8l-62 33-62-33Z" fill="#8d8370"/>
    <path d="M70 202 120 177l50 25-50 28-50-28Z" fill="#d3c9b2"/>
    <path d="M84 200v-12h72v12l-36 18-36-18Z" fill="url(#monStone)"/>
    <path d="M84 188h72v5H84z" fill="#f0e7d0"/>
    <path d="M99 176h42v13H99z" fill="#b0a48d"/>
    <path d="M107 176v-8h26v8" fill="#c7bca4"/>
    <path d="M112 168v-13h16v13" fill="#b7ab93"/>
    <!-- statue -->
    <g>
      <circle cx="120" cy="139" r="10" fill="#c6b99d" stroke="#91866f"/>
      <path d="M111 137c2-9 16-9 18 0" fill="#d8b55f" stroke="#89652a"/>
      <path d="M120 129v-7M115 126h10" stroke="#8d6a2e" stroke-width="2"/>
      <path d="M108 161c1-12 7-18 12-18s11 6 12 18l-3 8h-18l-3-8Z" fill="#c6b99d" stroke="#91866f"/>
      <path d="M108 153c-8 1-13 8-12 15l9 3 5-9M132 153c8 1 13 8 12 15l-9 3-5-9" fill="#b9ad94" stroke="#91866f"/>
      <path d="M113 167v9M127 167v9" stroke="#a79b83" stroke-width="5"/>
      <path d="M114 140c2 4 10 4 12 0" fill="none" stroke="#8a7e67" stroke-width="1.4"/>
    </g>
    <circle cx="120" cy="147" r="36" fill="url(#monGlow)" opacity=".45"/>
    <!-- gold trim -->
    <path d="M84 198h72M84 203h72" stroke="#bf9340" stroke-width="1.6"/>
    <path d="M94 215h52" stroke="#c79a43" stroke-width="1.4"/>
    <g>
      <path d="M52 199v-19" stroke="#6a4829" stroke-width="2"/>
      <path d="M52 181c8-3 14 0 18 5l-18 3v-8Z" fill="#a44a35"/>
      <path d="M188 199v-19" stroke="#6a4829" stroke-width="2"/>
      <path d="M188 181c-8-3-14 0-18 5l18 3v-8Z" fill="#3d6349"/>
    </g>
    <g fill="#d7b258"><circle cx="41" cy="223" r="2"/><circle cx="52" cy="228" r="1.5"/><circle cx="198" cy="222" r="1.7"/><circle cx="188" cy="228" r="1.3"/></g>
  `);
})();
