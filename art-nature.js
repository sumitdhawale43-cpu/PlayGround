/* Kingdom Builder — flora and landscape props. */
(function () {
  'use strict';
  const KB = window.KBArt;

  KB.sprites.oak1 = KB.wrap(`
    <defs><radialGradient id="oakA" cx=".36" cy=".28" r=".8"><stop offset="0" stop-color="#87a45b"/><stop offset=".5" stop-color="#5f8548"/><stop offset="1" stop-color="#335632"/></radialGradient></defs>
    <ellipse cx="70" cy="170" rx="42" ry="10" fill="#20351f" opacity=".28"/>
    <path d="M66 168c-2-31 1-53 7-72l9 2c-9 27-7 47-5 69l-11 1Z" fill="#6b4828"/>
    <path d="M72 145c-12-10-19-10-29-17M73 127c11-11 22-11 32-22" fill="none" stroke="#644327" stroke-width="7" stroke-linecap="round"/>
    <g fill="url(#oakA)">
      <circle cx="47" cy="95" r="27"/><circle cx="73" cy="75" r="31"/><circle cx="102" cy="88" r="28"/><circle cx="91" cy="112" r="26"/><circle cx="58" cy="116" r="25"/><circle cx="83" cy="57" r="23"/>
    </g>
    <g fill="#80a057" opacity=".72">
      <circle cx="57" cy="69" r="13"/><circle cx="82" cy="54" r="12"/><circle cx="101" cy="78" r="11"/><circle cx="43" cy="88" r="9"/>
    </g>
    <g fill="#a6bd70" opacity=".45">
      <circle cx="72" cy="47" r="6"/><circle cx="97" cy="69" r="5"/><circle cx="51" cy="80" r="5"/><circle cx="87" cy="104" r="4"/>
    </g>
    <g fill="#2f512e" opacity=".35">
      <circle cx="62" cy="123" r="12"/><circle cx="102" cy="105" r="10"/><circle cx="37" cy="105" r="8"/>
    </g>
    <path d="M70 164c4 2 11 2 15 0" stroke="#4d321c" stroke-width="2" opacity=".5"/>
  `, 140, 180);

  KB.sprites.oak2 = KB.wrap(`
    <defs><radialGradient id="oakB" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#a0ac58"/><stop offset=".5" stop-color="#728c45"/><stop offset="1" stop-color="#3c5d31"/></radialGradient></defs>
    <ellipse cx="70" cy="170" rx="45" ry="10" fill="#20351f" opacity=".28"/>
    <path d="M68 166c-1-28 1-52 8-75l8 3c-8 25-7 47-5 72H68Z" fill="#735031"/>
    <path d="M75 137c-10-7-17-7-27-15M76 121c12-9 21-8 31-17" fill="none" stroke="#68472a" stroke-width="6" stroke-linecap="round"/>
    <g fill="url(#oakB)">
      <circle cx="61" cy="94" r="29"/><circle cx="90" cy="74" r="32"/><circle cx="108" cy="100" r="23"/><circle cx="84" cy="113" r="28"/><circle cx="47" cy="116" r="22"/><circle cx="92" cy="52" r="21"/>
    </g>
    <g fill="#b0ba68" opacity=".48">
      <circle cx="74" cy="65" r="10"/><circle cx="101" cy="82" r="9"/><circle cx="56" cy="84" r="8"/><circle cx="85" cy="101" r="7"/>
    </g>
    <g fill="#d6b84d" opacity=".7">
      <circle cx="92" cy="91" r="2.2"/><circle cx="66" cy="73" r="2"/><circle cx="105" cy="108" r="1.8"/><circle cx="51" cy="104" r="1.6"/>
    </g>
    <g fill="#34532d" opacity=".38"><circle cx="107" cy="112" r="10"/><circle cx="47" cy="122" r="9"/></g>
  `, 140, 180);

  KB.sprites.pine1 = KB.wrap(`
    <defs><linearGradient id="pineA" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#526e43"/><stop offset="1" stop-color="#253f2b"/></linearGradient></defs>
    <ellipse cx="70" cy="169" rx="33" ry="9" fill="#1c311d" opacity=".3"/>
    <path d="M68 169v-63h7v63" fill="#60422a"/>
    <path d="M72 25 34 95h30L43 122h25L46 145h52l-22-23h25l-21-27h30L72 25Z" fill="url(#pineA)"/>
    <path d="M72 25 50 80h22V25Z" fill="#668354" opacity=".7"/>
    <path d="M72 65 44 123h28V65ZM72 91 49 147h23V91Z" fill="#6c8858" opacity=".42"/>
    <path d="M72 27v-12M67 21h10" stroke="#57402a" stroke-width="2"/>
    <g fill="#d1a94d" opacity=".5"><circle cx="51" cy="113" r="1.5"/><circle cx="91" cy="133" r="1.4"/></g>
  `, 140, 180);

  KB.sprites.pine2 = KB.wrap(`
    <defs><linearGradient id="pineB" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#627b4b"/><stop offset="1" stop-color="#2e4b32"/></linearGradient></defs>
    <ellipse cx="70" cy="169" rx="31" ry="9" fill="#1c311d" opacity=".28"/>
    <path d="M68 169v-56h6v56" fill="#63452d"/>
    <path d="M71 34 42 92h23L43 118h22L46 141h50l-19-23h22l-22-26h23L71 34Z" fill="url(#pineB)"/>
    <path d="M71 34 54 79h17V34Z" fill="#77915e" opacity=".64"/>
    <path d="M71 74 50 121h21V74Z" fill="#789661" opacity=".4"/>
    <path d="M71 36V24" stroke="#503a26" stroke-width="2"/>
  `, 140, 180);

  KB.sprites.poplar = KB.wrap(`
    <defs><linearGradient id="popA" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="#8f9f54"/><stop offset=".5" stop-color="#657f43"/><stop offset="1" stop-color="#39552f"/></linearGradient></defs>
    <ellipse cx="60" cy="168" rx="25" ry="7" fill="#1f351f" opacity=".3"/>
    <path d="M58 168V96h8v72" fill="#6d4a2c"/>
    <path d="M62 15c-18 21-24 62-18 87 4 17 14 20 18 24 5-4 15-7 18-24 6-25 0-66-18-87Z" fill="url(#popA)"/>
    <path d="M62 20c-11 25-13 58-7 83 2 8 5 13 7 17V20Z" fill="#9bab62" opacity=".45"/>
    <path d="M62 48c-5 20-5 44-1 64" stroke="#455f34" stroke-width="1.4" opacity=".4" fill="none"/>
    <g fill="#d2b24f" opacity=".55"><circle cx="53" cy="79" r="1.5"/><circle cx="69" cy="105" r="1.4"/><circle cx="58" cy="122" r="1.2"/></g>
  `, 120, 180);

  KB.sprites.bush = KB.wrap(`
    <defs><radialGradient id="bushA" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#7d9a56"/><stop offset="1" stop-color="#3e6137"/></radialGradient></defs>
    <ellipse cx="60" cy="72" rx="40" ry="8" fill="#20351f" opacity=".25"/>
    <g fill="url(#bushA)">
      <circle cx="36" cy="55" r="17"/><circle cx="58" cy="43" r="20"/><circle cx="82" cy="56" r="16"/><circle cx="48" cy="64" r="15"/><circle cx="74" cy="65" r="14"/>
    </g>
    <g fill="#8fac63" opacity=".45"><circle cx="54" cy="39" r="7"/><circle cx="78" cy="50" r="5"/><circle cx="36" cy="50" r="5"/></g>
    <circle cx="44" cy="58" r="2" fill="#dfb0a6"/><circle cx="66" cy="51" r="1.8" fill="#e6cc79"/><circle cx="80" cy="61" r="1.6" fill="#d3a2c4"/>
  `, 120, 90);

  KB.sprites.rock = KB.wrap(`
    <defs><linearGradient id="rockA" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#b8b4a5"/><stop offset=".6" stop-color="#8a897d"/><stop offset="1" stop-color="#5b5d55"/></linearGradient></defs>
    <ellipse cx="64" cy="82" rx="45" ry="10" fill="#20351f" opacity=".28"/>
    <path d="M17 76 27 44l31-18 32 17 17 30-26 18-42 1-22-16Z" fill="url(#rockA)"/>
    <path d="M27 44 58 26l32 17-28 15-35-14Z" fill="#c6c2b2"/>
    <path d="m62 58 28-15 16 30-27 6-17-21Z" fill="#777a70"/>
    <path d="m17 76 45 15-13 7-30-8-2-14Z" fill="#686b62"/>
    <path d="M31 43 58 28l8 7-31 11-4-3Z" fill="#dad6c5" opacity=".55"/>
    <path d="M43 57l8-15 9 5-4 17-13-7Z" fill="#587447"/>
    <path d="M78 88c2-8 9-10 14-5" fill="none" stroke="#4e6f41" stroke-width="3"/>
  `, 140, 96);

  KB.sprites.flowers = KB.wrap(`
    <ellipse cx="50" cy="82" rx="42" ry="8" fill="#20351f" opacity=".2"/>
    <g stroke="#4e713b" stroke-width="2">
      <path d="M20 76V55M30 77V47M40 78V54M50 78V44M60 77V51M70 78V47M80 76V57"/>
    </g>
    <g>
      <circle cx="20" cy="53" r="4" fill="#e3a6a0"/><circle cx="30" cy="45" r="4.2" fill="#e9ce74"/><circle cx="40" cy="52" r="3.4" fill="#d4a8c7"/><circle cx="50" cy="42" r="4" fill="#e7b289"/><circle cx="60" cy="49" r="3.6" fill="#e5cf78"/><circle cx="70" cy="45" r="4" fill="#dba1bf"/><circle cx="80" cy="55" r="3.4" fill="#eab8a6"/>
      <circle cx="20" cy="53" r="1.6" fill="#f4df9b"/><circle cx="30" cy="45" r="1.6" fill="#b9863d"/><circle cx="50" cy="42" r="1.6" fill="#e8d58e"/><circle cx="70" cy="45" r="1.6" fill="#e8d58e"/>
    </g>
    <g fill="#81a35b"><path d="M13 72c4-8 9-10 13-9-4 6-8 9-13 9Z"/><path d="M66 73c4-7 9-9 13-8-3 6-7 8-13 8Z"/><path d="M50 74c4-8 10-10 16-8-5 6-10 8-16 8Z"/></g>
  `, 100, 88);

  KB.sprites.boat = KB.wrap(`
    <defs><linearGradient id="boatWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a47745"/><stop offset="1" stop-color="#5e3e24"/></linearGradient></defs>
    <path d="M12 55 20 68c28 10 62 8 82-2l8-10-98-1Z" fill="url(#boatWood)" stroke="#4b311c"/>
    <path d="M21 56c28 8 58 8 80 0" fill="none" stroke="#ca9e64" stroke-width="1.2" opacity=".5"/>
    <path d="M55 54V12" stroke="#6e4c2c" stroke-width="3"/>
    <path d="M57 16c15 10 18 22 20 34H57V16Z" fill="#ead9b3" stroke="#a78552"/>
    <path d="M53 24c-9 7-11 16-12 26h12V24Z" fill="#d8c69e" opacity=".8"/>
    <path d="M31 61h55" stroke="#d5b579" stroke-width="1.4" opacity=".6"/>
    <path d="M73 53c3-3 7-3 9 0" fill="none" stroke="#6b4828" stroke-width="1.4"/>
  `, 120, 86);

  KB.sprites.fence = KB.wrap(`
    <path d="M8 62c28-12 69-12 104 0" fill="none" stroke="#6e4b2a" stroke-width="3"/>
    <path d="M14 68c28-12 65-12 94 0" fill="none" stroke="#815d38" stroke-width="2"/>
    <path d="M18 57V34M42 52V29M68 51V28M94 54V31M112 58V35" stroke="#7d5936" stroke-width="5" stroke-linecap="round"/>
    <path d="M18 34l-3-6 3 2 3-4v8M42 29l-3-6 3 2 3-4v8M68 28l-3-6 3 2 3-4v8" fill="#9b7448"/>
  `, 120, 80);
})();
