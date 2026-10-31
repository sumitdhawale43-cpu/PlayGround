/* Kingdom Builder — core building artwork. */
(function () {
  'use strict';
  const KB = window.KBArt;

  function houseSprite(roofA, roofB, roofC, accent, opts = {}) {
    const wallH = opts.tall ? 61 : 48;
    const eaveY = 145;
    const wallBottom = eaveY + wallH;
    const bottomShift = wallBottom - 145;
    const flowerBox = opts.flowers ? `
      <path d="M55 178h20v5H55z" fill="#6f4a2a"/>
      <circle cx="59" cy="176" r="2.5" fill="#e3b6b7"/><circle cx="65" cy="174" r="2.2" fill="#f0d086"/><circle cx="71" cy="176" r="2.3" fill="#cfa4c1"/>` : '';
    const upperWindow = opts.tall ? `
      <polygon points="61,155 76,163 76,177 61,169" fill="url(#glass)" stroke="#58422b" stroke-width="1.4"/>
      <path d="M68 158v17M61 162l15 8" stroke="#6e4a2b" stroke-width="1"/>` : '';
    return KB.wrap(`
      ${KB.defs}
      <defs>
        <linearGradient id="hroofA" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="${roofA[0]}"/><stop offset="1" stop-color="${roofA[1]}"/></linearGradient>
        <linearGradient id="hroofB" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="${roofB[0]}"/><stop offset="1" stop-color="${roofB[1]}"/></linearGradient>
        <linearGradient id="hroofC" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${roofC[0]}"/><stop offset="1" stop-color="${roofC[1]}"/></linearGradient>
      </defs>
      <ellipse cx="120" cy="234" rx="79" ry="17" fill="#20371f" opacity=".33"/>
      <path d="M44 219c4-13 15-15 24-9 7-9 21-8 25 2 10-4 20 2 23 11l-2 10H48l-4-14Z" fill="#54743f" opacity=".85"/>
      <path d="M170 222c-1-8 4-13 10-13 4-8 16-8 20 0 7 0 11 5 10 12l-3 9h-36l-1-8Z" fill="#4b6939" opacity=".8"/>
      <g>
        <polygon points="150,99 164,106 164,68 150,61" fill="#8f826e"/>
        <polygon points="150,61 157,57 171,64 164,68" fill="#b0a38a"/>
        <polygon points="164,68 171,64 171,102 164,106" fill="#6e6251"/>
        <path d="M152 78h10M152 88h10" stroke="#6d6250" stroke-width="1.4" opacity=".6"/>
      </g>
      <polygon points="43,145 120,182 120,${230} 43,${193}" fill="url(#wallL)"/>
      <polygon points="120,182 197,145 197,${193} 120,${230}" fill="url(#wallR)"/>
      <path d="M43 145 120 182l77-37M43 193 120 230l77-37" fill="none" stroke="#6b4a2a" stroke-width="3.5"/>
      <path d="M62 154v43M88 166v49M152 166v49M178 154v43" fill="none" stroke="#67482b" stroke-width="2.6" opacity=".85"/>
      <path d="M43 172l77 37M120 182l77-37" fill="none" stroke="#5e3e23" stroke-width="2.2" opacity=".7"/>
      ${upperWindow}
      <polygon points="56,177 75,186 75,205 56,196" fill="url(#glass)" stroke="#5f4228" stroke-width="1.6"/>
      <path d="M65.5 181v22M56 185l19 9" stroke="#704b2b" stroke-width="1"/>
      <polygon points="142,181 159,173 159,193 142,201" fill="url(#glass)" stroke="#5f4228" stroke-width="1.5"/>
      <path d="M150.5 177v23M142 185l17-8" stroke="#704b2b" stroke-width="1"/>
      ${flowerBox}
      <polygon points="84,188 103,197 103,227 84,218" fill="#604127" stroke="#3f2918" stroke-width="1.4"/>
      <path d="M86 191v25M93 194v25M100 197v24" stroke="#3c2617" stroke-width=".9" opacity=".7"/>
      <circle cx="100" cy="211" r="1.4" fill="#d4a458"/>
      <path d="M40 130 120 91l80 39-7 8-73-35-73 35-7-8Z" fill="#5c3b24"/>
      <polygon points="120,55 40,130 120,178" fill="url(#hroofA)"/>
      <polygon points="120,55 120,178 200,130" fill="url(#hroofB)"/>
      <polygon points="120,55 200,130 120,178" fill="url(#hroofC)" opacity=".84"/>
      <polygon points="120,55 40,130 120,178" fill="url(#hroofA)"/>
      <path d="M120 57 46 128M120 57 76 152M120 57 120 176M120 57 164 152M120 57 194 128" stroke="#6e2b1f" stroke-width="1" opacity=".35"/>
      <path d="M95 93c13 12 30 25 49 37M73 112c7 19 20 36 40 50" stroke="#f0a07e" stroke-width="1.2" opacity=".22" fill="none"/>
      <path d="M40 130 120 91l80 39-7 9-73-35-73 35-7-9Z" fill="none" stroke="#e4a082" stroke-width="2" opacity=".32"/>
      <path d="M120 55v-8" stroke="#d5ac59" stroke-width="2"/>
      <path d="M120 47c8-7 17-7 25 0-8 1-16 6-25 8v-8Z" fill="#d9b763" stroke="#8b6427" stroke-width=".8"/>
      <g fill="${accent}">
        <circle cx="49" cy="219" r="2"/><circle cx="56" cy="222" r="1.5"/><circle cx="183" cy="220" r="1.8"/><circle cx="176" cy="225" r="1.4"/>
      </g>
    `);
  }

  KB.sprites.house1 = houseSprite(
    ['#cf7452', '#8c3527'], ['#9c402c', '#5c1d16'], ['#e09570', '#bd6043'], '#d9b05e'
  );
  KB.sprites.house2 = houseSprite(
    ['#ba7c47', '#6f431d'], ['#85592c', '#4c2d12'], ['#d7a565', '#a36a35'], '#c79c52',
    { tall: true, flowers: true }
  );
  KB.sprites.house3 = houseSprite(
    ['#768b50', '#42562f'], ['#526b3d', '#2f4328'], ['#95a865', '#6c8046'], '#b5b977',
    { flowers: true }
  );

  KB.sprites.keep = KB.wrap(`
    ${KB.defs}
    <defs>
      <linearGradient id="keepRoof" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#be6548"/><stop offset=".5" stop-color="#99412f"/><stop offset="1" stop-color="#70281e"/></linearGradient>
      <linearGradient id="keepRoofD" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#8e3729"/><stop offset="1" stop-color="#4f1b15"/></linearGradient>
    </defs>
    <ellipse cx="120" cy="241" rx="105" ry="18" fill="#1e351f" opacity=".36"/>
    <path d="M20 230c0-10 8-17 18-15 7-11 23-11 31-1 9-5 21-1 25 10l-2 13H21l-1-7ZM177 231c1-10 9-16 18-14 5-11 22-12 29-2l-6 18h-41Z" fill="#4d6e3c"/>
    <path d="M60 207c-2-20 9-35 26-38l8 12v34H60Z" fill="#537244"/>
    <!-- rear towers -->
    <g>
      <polygon points="62,112 88,124 88,198 62,186" fill="url(#stoneR)"/>
      <polygon points="88,124 110,114 110,188 88,198" fill="url(#stoneL)"/>
      <path d="M62 132h48M62 151h48M62 170h48" stroke="#746a59" stroke-width="1.2" opacity=".48"/>
      <polygon points="56,113 86,127 116,113 86,99" fill="#9b927e"/>
      <polygon points="86,46 48,119 86,139" fill="url(#keepRoof)"/>
      <polygon points="86,46 86,139 124,119" fill="url(#keepRoofD)"/>
      <path d="M86 47v91M86 47 53 116M86 47 119 116" stroke="#612219" stroke-width="1" opacity=".4"/>
      <path d="M86 46V25" stroke="#d4aa57" stroke-width="1.6"/>
      <path d="M86 26c11-7 23-5 30 3-9 1-20 5-30 7V26Z" fill="#c24a35" stroke="#763023" stroke-width=".7"/>
    </g>
    <!-- central keep -->
    <g>
      <polygon points="78,108 120,130 120,214 78,192" fill="url(#stoneL)"/>
      <polygon points="120,130 162,108 162,192 120,214" fill="url(#stoneR)"/>
      <path d="M78 130h84M78 148h84M78 166h84M78 184h84" stroke="#746b5a" stroke-width="1.1" opacity=".4"/>
      <path d="M100 190v-27c0-12 20-12 20 0v27" fill="#3b2d20" stroke="#5e523f"/>
      <path d="M100 190v-27c0-12 20-12 20 0v27" fill="none" stroke="#d7b267" stroke-width="1.4" opacity=".5"/>
      <polygon points="90,153 99,158 99,175 90,170" fill="url(#glass)" stroke="#5d4e3b"/>
      <polygon points="141,158 150,153 150,170 141,175" fill="url(#glass)" stroke="#5d4e3b"/>
      <path d="M78 108 120 86l42 22v5l-42 22-42-22v-5Z" fill="#b3ab96"/>
      <path d="M78 108 120 86l42 22-42 22-42-22Z" fill="#c9c1aa"/>
      <path d="M78 108v7l42 22 42-22v-7" fill="#918875"/>
      <path d="M72 104 120 80l48 24-6 7-42-20-42 20-6-7Z" fill="#7f7664"/>
      <path d="M78 101v-8h9v4h9v-6h9v5h10v-5h9v6h9v-4h9v8" fill="#beb6a0"/>
      <polygon points="120,26 75,104 120,129" fill="url(#keepRoof)"/>
      <polygon points="120,26 120,129 165,104" fill="url(#keepRoofD)"/>
      <path d="M120 27v101M120 27 80 101M120 27 160 101" stroke="#5e2118" stroke-width="1" opacity=".4"/>
      <path d="M120 25v-10" stroke="#e2bd67" stroke-width="2"/>
      <path d="M120 16c9-5 20-4 26 4-9 0-18 4-26 5v-9Z" fill="#d8ad4d" stroke="#805d24" stroke-width=".8"/>
    </g>
    <!-- front wall and gatehouse -->
    <g>
      <polygon points="28,178 120,226 120,242 28,194" fill="url(#stoneR)"/>
      <polygon points="120,226 212,178 212,194 120,242" fill="url(#stoneL)" opacity=".82"/>
      <polygon points="28,178 120,132 212,178 120,226" fill="#c5bda7"/>
      <path d="M28 178 120 132l92 46-92 48-92-48Z" fill="none" stroke="#8d8472" stroke-width="2"/>
      <path d="M36 176v12h12v-6h12v8h12v-8h12v10h12v-10h12v8h12v-8h12v6h12v-12" fill="#bab29e"/>
      <path d="M94 226v-31c0-18 52-18 52 0v31" fill="#4a3b2a"/>
      <path d="M94 226v-31c0-18 52-18 52 0v31" fill="none" stroke="#d6ad5e" stroke-width="2"/>
      <path d="M100 226v-27c0-13 40-13 40 0v27" fill="#2e251b"/>
      <path d="M105 226v-27M115 226v-27M125 226v-27M135 226v-24" stroke="#5f4c36" stroke-width="1.5"/>
      <path d="M109 143v17M131 143v17" stroke="#665c4b" stroke-width="1.4"/>
      <path d="M120 132v-8M112 126h16" stroke="#9c8d72" stroke-width="2"/>
    </g>
    <!-- banners -->
    <g>
      <path d="M45 176v-34" stroke="#674526" stroke-width="2"/>
      <path d="M45 143c10-2 17 2 23 8v27c-7-6-15-8-23-6v-29Z" fill="#b14432" stroke="#762e22" stroke-width="1"/>
      <path d="M54 151l5 6 5-6M54 161l5 6 5-6" stroke="#e7c278" stroke-width="1.4" fill="none"/>
      <path d="M175 143c-10-2-17 2-23 8v27c7-6 15-8 23-6v-29Z" fill="#315d45" stroke="#203f2e" stroke-width="1"/>
    </g>
    <g fill="#d6b15d">
      <circle cx="36" cy="222" r="2"/><circle cx="45" cy="227" r="1.5"/><circle cx="199" cy="219" r="1.8"/><circle cx="191" cy="226" r="1.4"/>
    </g>
  `);

  KB.sprites.farm = KB.wrap(`
    <defs>
      <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#946b3c"/><stop offset="1" stop-color="#654725"/></linearGradient>
      <linearGradient id="wheat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3bf61"/><stop offset="1" stop-color="#a67c32"/></linearGradient>
    </defs>
    <ellipse cx="120" cy="220" rx="93" ry="17" fill="#1f391f" opacity=".27"/>
    <path d="M20 176 120 126l100 50-100 52L20 176Z" fill="#6f522e"/>
    <path d="M28 176 120 130l92 46-92 48-92-48Z" fill="url(#soil)"/>
    <g stroke="#b28a4c" stroke-width="2" opacity=".7">
      <path d="M42 171 120 210l78-39M51 166l69 35 69-35M60 162l60 30 60-30M69 158l51 25 51-25"/>
    </g>
    <g stroke="#d6aa4a" stroke-width="3" stroke-linecap="round">
      <path d="M47 168v-7M54 165v-7M61 162v-8M68 158v-8M75 155v-8M82 151v-8M89 148v-8M96 144v-8M103 141v-7"/>
      <path d="M47 201v7M54 204v7M61 208v7M68 211v7M75 215v7M82 218v7M89 221v7M96 225v7M103 228v7"/>
    </g>
    <g fill="url(#wheat)">
      <path d="M47 159c-4-2-5-6-3-9 4 0 6 3 6 8M54 156c-4-2-5-6-3-9 4 0 6 3 6 8M61 153c-4-2-5-6-3-9 4 0 6 3 6 8M68 149c-4-2-5-6-3-9 4 0 6 3 6 8M75 146c-4-2-5-6-3-9 4 0 6 3 6 8M82 142c-4-2-5-6-3-9 4 0 6 3 6 8M89 139c-4-2-5-6-3-9 4 0 6 3 6 8M96 135c-4-2-5-6-3-9 4 0 6 3 6 8M103 132c-4-2-5-6-3-9 4 0 6 3 6 8"/>
      <path d="M47 208c-4 2-5 6-3 9 4 0 6-3 6-8M54 211c-4 2-5 6-3 9 4 0 6-3 6-8M61 215c-4 2-5 6-3 9 4 0 6-3 6-8M68 218c-4 2-5 6-3 9 4 0 6-3 6-8M75 222c-4 2-5 6-3 9 4 0 6-3 6-8M82 225c-4 2-5 6-3 9 4 0 6-3 6-8M89 228c-4 2-5 6-3 9 4 0 6-3 6-8M96 232c-4 2-5 6-3 9 4 0 6-3 6-8M103 235c-4 2-5 6-3 9 4 0 6-3 6-8"/>
    </g>
    <!-- scarecrow -->
    <g transform="translate(166 154)">
      <path d="M0 30V0M0 12h-14M0 15h14" stroke="#6f4b2a" stroke-width="3"/>
      <path d="M-9 2h18l-4 12H-5L-9 2Z" fill="#d8c495"/>
      <path d="M-13 2h26L8-4h-16l-5 6Z" fill="#9e4d35"/>
      <path d="M-5 14h10l4 15h-18l4-15Z" fill="#7d5b3a"/>
      <path d="M-6 6h2M4 6h2" stroke="#5d4529" stroke-width="1.4"/>
    </g>
    <!-- fence and hay -->
    <path d="M22 190l10 5M30 184l10 5M183 201l21-10" stroke="#74502c" stroke-width="3"/>
    <path d="M24 181v18M34 186v17M187 184v18M197 179v18" stroke="#8b6539" stroke-width="2.8"/>
    <ellipse cx="194" cy="217" rx="13" ry="7" fill="#c69a46"/>
    <path d="M184 216c4-5 14-6 19-1M186 212c4-4 10-5 15-1" stroke="#e2be69" stroke-width="1.2"/>
    <ellipse cx="33" cy="216" rx="9" ry="6" fill="#c49b4c"/>
    <path d="M26 214c4-4 10-4 14 0" stroke="#e0bd6d" stroke-width="1.2"/>
  `);

  KB.sprites.lumber = KB.wrap(`
    ${KB.defs}
    <defs>
      <linearGradient id="logRoof" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#7c925e"/><stop offset="1" stop-color="#455e3a"/></linearGradient>
    </defs>
    <ellipse cx="120" cy="233" rx="81" ry="17" fill="#1f351e" opacity=".32"/>
    <path d="M55 211c0-8 7-12 13-10 4-9 17-10 22-2 8-4 15 1 16 9l-2 13H57l-2-10Z" fill="#527443"/>
    <polygon points="62,148 120,176 120,221 62,193" fill="#c9b28a"/>
    <polygon points="120,176 169,151 169,196 120,221" fill="#aa9068"/>
    <path d="M62 153 120 181l49-25M62 193l58 28 49-25" stroke="#6a4829" stroke-width="3"/>
    <path d="M78 161v39M99 171v45M140 174v42M158 165v39" stroke="#6d4a29" stroke-width="2.2" opacity=".7"/>
    <polygon points="86,176 101,183 101,203 86,196" fill="#f1bd64" stroke="#5f432a" stroke-width="1.2"/>
    <polygon points="125,183 141,176 141,197 125,204" fill="#eeb45d" stroke="#5f432a" stroke-width="1.2"/>
    <path d="M57 141 120 111l68 30-7 8-61-27-61 27-7-8Z" fill="#3f2b1b"/>
    <polygon points="120,109 55,141 120,173" fill="url(#logRoof)"/>
    <polygon points="120,109 185,141 120,173" fill="#3d5734"/>
    <path d="M120 110v62M120 110 62 140M120 110l56 30" stroke="#324a2d" stroke-width="1.1" opacity=".45"/>
    <path d="M120 104v-26" stroke="#5d4024" stroke-width="3"/>
    <path d="M120 78c9-7 18-6 26 1-9 1-17 5-26 8v-9Z" fill="#a74c35"/>
    <!-- log pile -->
    <g>
      <path d="M34 213h47" stroke="#6b4828" stroke-width="9" stroke-linecap="round"/>
      <path d="M35 224h39" stroke="#835c34" stroke-width="8" stroke-linecap="round"/>
      <path d="M42 204h44" stroke="#7c5530" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="34" cy="213" rx="5" ry="4.2" fill="#d2a86b"/>
      <ellipse cx="34" cy="213" rx="2.4" ry="1.9" fill="#9c713d"/>
      <ellipse cx="35" cy="224" rx="4.4" ry="3.8" fill="#c39a61"/>
      <ellipse cx="42" cy="204" rx="4.4" ry="3.8" fill="#d6ad70"/>
    </g>
    <!-- stump and axe -->
    <g transform="translate(177 213)">
      <ellipse cx="0" cy="9" rx="16" ry="6" fill="#3c2b18" opacity=".3"/>
      <path d="M-13 7V-2c0-4 26-4 26 0v9c0 4-26 4-26 0Z" fill="#70492a"/>
      <ellipse cx="0" cy="-2" rx="13" ry="5" fill="#b9894f"/>
      <ellipse cx="0" cy="-2" rx="7" ry="2.5" fill="none" stroke="#8d6337"/>
      <path d="M3-4 12-22" stroke="#5c3d21" stroke-width="3"/>
      <path d="M9-23 19-20l-4 9-8-4 2-8Z" fill="#9ba0a0"/>
    </g>
  `);

  KB.sprites.quarry = KB.wrap(`
    <defs>
      <linearGradient id="pit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b6b61"/><stop offset="1" stop-color="#393d38"/></linearGradient>
    </defs>
    <ellipse cx="120" cy="225" rx="93" ry="17" fill="#1e311d" opacity=".3"/>
    <path d="M23 185 68 162l48-7 54 18 38 23-38 25-61 15-62-13-24-18Z" fill="#858477"/>
    <path d="M37 185 75 169l44-4 46 14 24 12-35 17-52 10-48-11-17-22Z" fill="url(#pit)"/>
    <path d="M55 184 86 174l36-2 38 10-28 12-41 8-36-18Z" fill="#4c504a"/>
    <path d="M70 180 96 173l31 0 26 7-24 7-34 5-25-12Z" fill="#333a36"/>
    <g fill="#aaa99b" stroke="#63665e" stroke-width="1">
      <path d="M50 169h15l4 10-9 5-13-6 3-9Z"/>
      <path d="M150 168l17 3 4 11-11 5-14-8 4-11Z"/>
      <path d="M110 166h17l2 9-10 4-12-5 3-8Z"/>
      <path d="M30 199l12 3 2 8-10 4-9-6 5-9Z"/>
    </g>
    <!-- wooden crane -->
    <g>
      <path d="M167 184v-63M166 124l-35 30M168 124l29 6" stroke="#6f4b29" stroke-width="4" stroke-linecap="round"/>
      <path d="M132 153v48" stroke="#8a653d" stroke-width="1.2" stroke-dasharray="3 3"/>
      <path d="M126 201h13v8h-13z" fill="#8f8d7f"/>
      <path d="M163 124l5 19M160 143l13-8" stroke="#573b21" stroke-width="3"/>
      <path d="M168 117l-3-16 16-6 5 15-18 7Z" fill="#a64b35"/>
    </g>
    <!-- cart -->
    <g transform="translate(48 209)">
      <path d="M-15 0h30l-3 14h-24L-15 0Z" fill="#7d5734" stroke="#4e341d"/>
      <circle cx="-8" cy="17" r="6" fill="#4e3822" stroke="#2f2114"/><circle cx="11" cy="17" r="6" fill="#4e3822" stroke="#2f2114"/>
      <circle cx="-8" cy="17" r="2" fill="#9b7b50"/><circle cx="11" cy="17" r="2" fill="#9b7b50"/>
      <path d="M-13 3h25M-12 8h24" stroke="#a07a4a" stroke-width="1"/>
    </g>
    <path d="M94 223c4-8 14-11 22-7" fill="none" stroke="#556665" stroke-width="3"/>
  `);

  KB.sprites.factory = KB.wrap(`
    ${KB.defs}
    <defs>
      <linearGradient id="facRoof" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#586b6e"/><stop offset="1" stop-color="#2f4248"/></linearGradient>
      <linearGradient id="facRoof2" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#3d5257"/><stop offset="1" stop-color="#1f3137"/></linearGradient>
      <linearGradient id="wheel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b5864e"/><stop offset="1" stop-color="#604026"/></linearGradient>
    </defs>
    <ellipse cx="120" cy="235" rx="91" ry="18" fill="#1f351f" opacity=".34"/>
    <path d="M54 219c1-11 9-15 16-13 6-8 17-6 20 3 8-2 14 3 14 10l-1 10H55l-1-10Z" fill="#4f7042"/>
    <polygon points="34,158 92,187 92,228 34,199" fill="#c2b9a2"/>
    <polygon points="92,187 162,153 162,194 92,228" fill="#9e9581"/>
    <path d="M34 166 92 195l70-34M34 181l58 29 70-34M34 199l58 29 70-34" stroke="#6f6756" stroke-width="1.1" opacity=".4"/>
    <path d="M42 170v46M56 177v46M70 184v46M106 183v45M124 174v45M142 165v45" stroke="#89806c" stroke-width="1.2" opacity=".4"/>
    <path d="M41 158 92 133l70 20-70 34-51-29Z" fill="#bab19c"/>
    <path d="M41 151 92 126l70 20-70 35-51-30Z" fill="url(#facRoof)"/>
    <path d="M92 126 162 146v5l-70 35v-60Z" fill="url(#facRoof2)"/>
    <path d="M92 126v60M92 126 47 153M92 126l65 19" stroke="#20333a" stroke-width="1.1" opacity=".5"/>
    <!-- workshop windows -->
    <polygon points="46,188 64,197 64,212 46,203" fill="url(#glass)" stroke="#53442f"/>
    <path d="M55 192v20M46 196l18 9" stroke="#6e4b2a"/>
    <polygon points="113,196 132,187 132,208 113,217" fill="url(#glass)" stroke="#53442f"/>
    <path d="M122 191v22M113 202l19-10" stroke="#6e4b2a"/>
    <polygon points="139,183 152,176 152,194 139,201" fill="#e79f4f" stroke="#53442f"/>
    <path d="M146 179v18" stroke="#5d3d20"/>
    <!-- chimney -->
    <g>
      <polygon points="140,119 161,109 161,63 140,73" fill="#a69c88"/>
      <polygon points="161,109 173,115 173,69 161,63" fill="#7d7462"/>
      <path d="M140 84l33-15M140 100l33-15" stroke="#706756" stroke-width="1.3" opacity=".55"/>
      <path d="M137 72 161 60l15 8-24 12-15-8Z" fill="#c7bca4"/>
      <path d="M141 69v-5h20v4" fill="#847b69"/>
    </g>
    <!-- water wheel -->
    <g transform="translate(174 188)">
      <circle r="23" fill="none" stroke="#5a3a22" stroke-width="4"/>
      <circle r="18" fill="none" stroke="#8c6238" stroke-width="2"/>
      <path d="M0-23V23M-23 0h46M-16-16 16 16M16-16-16 16" stroke="#71502e" stroke-width="2.4"/>
      <circle r="5" fill="#c59a5e" stroke="#5b3b21" stroke-width="1.5"/>
      <path d="M-25 23v-9h50v9" fill="#6c5235" opacity=".7"/>
    </g>
    <!-- crates -->
    <g>
      <path d="M26 215h18v13H26z" fill="#91673c" stroke="#5e3f22"/>
      <path d="M26 215l9 6 9-6M35 221v7" stroke="#c1955c" stroke-width="1"/>
      <path d="M41 209h13v11H41z" fill="#7c5732" stroke="#5e3f22"/>
      <path d="M41 209l7 5 6-5" stroke="#b18751" stroke-width="1"/>
      <path d="M183 221h10v9h-10z" fill="#7d5731"/>
    </g>
    <path d="M150 205l12 6" stroke="#3f2c1b" stroke-width="2"/>
    <path d="M166 210l7-3" stroke="#3f2c1b" stroke-width="2"/>
  `);
})();
