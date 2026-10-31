/* Kingdom Builder — illustrated SVG asset library. */
(function () {
  'use strict';
  const KB = window.KBArt = window.KBArt || { sprites: {}, cardIcons: {}, resIcons: {} };

  KB.wrap = (inner, w = 240, h = 260) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`;

  KB.defs = `
    <defs>
      <linearGradient id="wallL" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#faefd4"/><stop offset=".55" stop-color="#ead8b3"/><stop offset="1" stop-color="#cfb98e"/></linearGradient>
      <linearGradient id="wallR" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#ddc8a0"/><stop offset="1" stop-color="#b39970"/></linearGradient>
      <linearGradient id="stoneL" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#ddd5c0"/><stop offset=".55" stop-color="#bcb39d"/><stop offset="1" stop-color="#978d79"/></linearGradient>
      <linearGradient id="stoneR" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#b9b19a"/><stop offset="1" stop-color="#7f7663"/></linearGradient>
      <linearGradient id="slateL" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#5c6f70"/><stop offset="1" stop-color="#37494e"/></linearGradient>
      <linearGradient id="slateR" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#405458"/><stop offset="1" stop-color="#25373d"/></linearGradient>
      <linearGradient id="woodL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a17247"/><stop offset="1" stop-color="#664126"/></linearGradient>
      <linearGradient id="woodR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7b5332"/><stop offset="1" stop-color="#4c2f1b"/></linearGradient>
      <linearGradient id="goldL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5d889"/><stop offset=".5" stop-color="#d4a747"/><stop offset="1" stop-color="#8f6723"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe5a0"/><stop offset="1" stop-color="#d68e3b"/></linearGradient>
      <linearGradient id="roofA" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#cf7452"/><stop offset=".55" stop-color="#ab4c34"/><stop offset="1" stop-color="#7f3024"/></linearGradient>
      <linearGradient id="roofB" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#91412e"/><stop offset="1" stop-color="#5f2019"/></linearGradient>
      <linearGradient id="roofC" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#e39470"/><stop offset="1" stop-color="#b85c40"/></linearGradient>
      <radialGradient id="windowGlow"><stop offset="0" stop-color="#fff3b7"/><stop offset=".7" stop-color="#f0b356"/><stop offset="1" stop-color="#b66d2e"/></radialGradient>
    </defs>`;

  KB.resIcons.wood = `<svg viewBox="0 0 24 24"><g stroke="#5d3a20" stroke-width="1"><path d="M6 4.3 17.5 6 19 11.2 7.5 9.5z" fill="#b77c43"/><path d="M4.5 8.5 16 10.2 17.5 15.4 6 13.7z" fill="#d19859"/><ellipse cx="6" cy="9.1" rx="2.4" ry="2.3" fill="#ead09a" transform="rotate(8 6 9)"/><ellipse cx="6" cy="9.1" rx="1.2" ry="1.15" fill="#a96e3b" transform="rotate(8 6 9)"/><path d="M4.5 8.5 16 10.2" stroke="#f0d59e" stroke-opacity=".5"/></g></svg>`;
  KB.resIcons.stone = `<svg viewBox="0 0 24 24"><g stroke="#4f5960" stroke-width="1"><path d="m4 15.4 2.7-6.2 7.4-1 3.6 5.1-3 6.1H6.5L4 15.4Z" fill="#a7aa9f"/><path d="m4 15.4 2.5 4H14.7l-3-5.8L4 15.4Z" fill="#7d837b"/><path d="m13.5 8.2 1.2-3.5 5 1.7 1.1 4.2-3.8 1.4-3.5-3.8Z" fill="#c5c7ba"/><path d="m10.1 10.8 2.4-2.6 2.7 2.7-1.1 4.3-4.4 1.2-2-4.5 2.4-1.1Z" fill="#90968b"/></g></svg>`;
  KB.resIcons.food = `<svg viewBox="0 0 24 24"><g stroke="#6e4f1b" stroke-width="1"><path d="M12 22V7" stroke="#b5883c" stroke-width="2"/><path d="M12 9c-3.5 0-5-2.2-5.1-4.7C9.4 4 11.5 5.7 12 9ZM12 12c3.4 0 5-2 5.2-4.5C14.6 7.1 12.5 8.7 12 12ZM12 15c-3.2 0-4.7-1.8-5-4 2.3-.2 4.3 1.1 5 4ZM12 18c3.1 0 4.7-1.8 5-4-2.4-.2-4.3 1.1-5 4Z" fill="#e3ba5c"/><path d="M12 4.2c-1.6-1.5-1.5-3.1-.5-4.2M12 4.2c1.7-1.3 3.3-1.1 4.4.2" fill="none" stroke="#8c6c2f"/></g></svg>`;
  KB.resIcons.gold = `<svg viewBox="0 0 24 24"><g stroke="#6e4b15" stroke-width="1"><ellipse cx="12" cy="14.4" rx="8.4" ry="6.6" fill="#b58125"/><ellipse cx="12" cy="12.2" rx="8.4" ry="6.6" fill="#e0ad42"/><ellipse cx="12" cy="12.2" rx="6.7" ry="5.1" fill="none" stroke="#f2d58b" stroke-opacity=".65"/><path d="M8.4 10.4 9.7 8l2.3 1.6L14.3 8l1.3 2.4" fill="#f5da8b" stroke="#936b24"/><path d="M9.8 14.7h4.4" stroke="#936b24"/></g></svg>`;
  KB.resIcons.pop = `<svg viewBox="0 0 24 24"><g stroke="#385a59" stroke-width="1"><circle cx="12" cy="7.2" r="3.5" fill="#9fc7b5"/><path d="M5.4 21c.4-5 2.6-7.7 6.6-7.7s6.2 2.7 6.6 7.7H5.4Z" fill="#7aa99a"/><path d="M9.2 14.3 12 18l2.8-3.7" fill="none" stroke="#d9ead7" stroke-opacity=".6"/></g></svg>`;
  KB.resIcons.happy = `<svg viewBox="0 0 24 24"><g stroke="#78571d" stroke-width="1"><circle cx="12" cy="12" r="8.3" fill="#e6bd5e"/><path d="M8.2 9.3h.2M15.6 9.3h.2" stroke="#684618" stroke-width="2.4" stroke-linecap="round"/><path d="M8.4 13.5c1.2 2 2.4 2.8 3.6 2.8s2.4-.8 3.6-2.8" fill="none" stroke="#684618" stroke-width="1.5" stroke-linecap="round"/></g></svg>`;

  function cardIcon(inner) {
    return `<svg viewBox="0 0 64 52">${inner}</svg>`;
  }

  KB.cardIcons.house = cardIcon(`
    <ellipse cx="32" cy="46" rx="23" ry="5" fill="#203320" opacity=".3"/>
    <path d="M14 27 32 17l18 10v16H14V27Z" fill="#e5d2a9"/>
    <path d="M32 17 50 27v16H32V17Z" fill="#cbb78c"/>
    <path d="M11 27 32 10l21 17-4 4-17-13-17 13-4-4Z" fill="#a84b34"/>
    <path d="M30 14 32 10l21 17-3 3-20-16Z" fill="#d37752"/>
    <path d="M19 31v8h5v-8M35 33h7v6h-7z" fill="#f2bd65" stroke="#6b4527" stroke-width="1"/>
    <path d="M38 14V8h5v12" fill="#9c907c" stroke="#665a4b" stroke-width="1"/>
    <path d="M24 43v-8l5-3v11" fill="#6b4226"/>`);

  KB.cardIcons.farm = cardIcon(`
    <ellipse cx="32" cy="46" rx="26" ry="5" fill="#203320" opacity=".3"/>
    <path d="M8 34 32 23l24 11-24 12L8 34Z" fill="#8d6435"/>
    <path d="M12 34 32 25l20 9-20 10-20-10Z" fill="#6a4b2c"/>
    <path d="M16 34 32 27l16 7M14 38l18 8 18-8" fill="none" stroke="#c69b53" stroke-width="2"/>
    <path d="M22 32v7M28 30v8M38 30v8M44 32v7" stroke="#d9b45b" stroke-width="2.5"/>
    <path d="M31 22v-9M28 16h6" stroke="#6c4728" stroke-width="1.6"/>
    <circle cx="31" cy="14" r="3" fill="#d9b45b"/>`);

  KB.cardIcons.lumber = cardIcon(`
    <ellipse cx="32" cy="46" rx="23" ry="5" fill="#203320" opacity=".3"/>
    <path d="M16 28 32 20l16 8v15H16V28Z" fill="#d8c195"/>
    <path d="M32 20 48 28v15H32V20Z" fill="#bca47a"/>
    <path d="M12 29 32 17l20 12-3 3-17-10-17 10-3-3Z" fill="#5d7446"/>
    <path d="M19 31v8h5v-8M38 33h6v6h-6z" fill="#8b6a45"/>
    <path d="M12 43h17M11 46h17" stroke="#7c512c" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="12" cy="43" rx="3" ry="2.5" fill="#d0a261"/>
    <ellipse cx="12" cy="46" rx="3" ry="2.5" fill="#bd8e4e"/>`);

  KB.cardIcons.road = cardIcon(`
    <ellipse cx="32" cy="44" rx="27" ry="6" fill="#203320" opacity=".25"/>
    <path d="M5 39 32 26l27 13-27 13L5 39Z" fill="#b7a580"/>
    <path d="M10 39 32 28l22 11-22 10-22-10Z" fill="#96866b"/>
    <path d="M16 38h7M28 33h7M39 38h7M23 42h7M34 43h7" stroke="#d0c09d" stroke-width="2.5" stroke-linecap="round" opacity=".65"/>`);

  KB.cardIcons.quarry = cardIcon(`
    <ellipse cx="32" cy="46" rx="25" ry="5" fill="#203320" opacity=".3"/>
    <path d="M7 39 22 29l14 4 9-6 12 8-4 11H11L7 39Z" fill="#7c7c72"/>
    <path d="M7 39 22 29l8 9-5 13H11L7 39Z" fill="#9b9b8d"/>
    <path d="M30 33l6-5 9 7-5 9-10-1v-10Z" fill="#68695f"/>
    <path d="M18 36h5v5h-5zM42 36h4v5h-4z" fill="#b8b7a8"/>
    <path d="M41 31V15l10 5" fill="none" stroke="#6b4829" stroke-width="2.5"/>
    <path d="M48 20v10" stroke="#7a5b37" stroke-width="1.5"/>`);

  KB.cardIcons.well = cardIcon(`
    <ellipse cx="32" cy="45" rx="18" ry="4.5" fill="#203320" opacity=".3"/>
    <path d="M18 33h28v7c0 4-6 7-14 7s-14-3-14-7v-7Z" fill="#9b9382"/>
    <path d="M18 33h28v3H18z" fill="#b9b09b"/>
    <path d="M22 28h20v6H22z" fill="#42656c"/>
    <path d="M20 28 32 19l12 9" fill="none" stroke="#6d4829" stroke-width="3"/>
    <path d="M24 27V14M40 27V14M23 14h18" stroke="#6d4829" stroke-width="2.5"/>
    <path d="M31 14v8" stroke="#a28151" stroke-width="1.4"/>
    <path d="M28 22h7v5h-7z" fill="#8d6c42"/>`);

  KB.cardIcons.factory = cardIcon(`
    <ellipse cx="32" cy="46" rx="24" ry="5" fill="#203320" opacity=".3"/>
    <path d="M12 25 30 16l20 9v19H12V25Z" fill="#cdc4ae"/>
    <path d="M30 16 50 25v19H30V16Z" fill="#a9a08d"/>
    <path d="M9 27 30 15l23 12v4L30 19 10 31l-1-4Z" fill="#455960"/>
    <path d="M18 32h6v7h-6zM35 33h8v6h-8z" fill="#f1b35f" stroke="#5a4125"/>
    <path d="M39 18V5h7v19" fill="#9d9280" stroke="#5f584d"/>
    <circle cx="46" cy="34" r="8" fill="none" stroke="#6d4a29" stroke-width="2.5"/>
    <path d="M46 26v16M38 34h16M40 28l12 12M52 28 40 40" stroke="#7d5731" stroke-width="1.1"/>`);

  KB.cardIcons.market = cardIcon(`
    <ellipse cx="32" cy="46" rx="26" ry="5" fill="#203320" opacity=".3"/>
    <path d="M10 30h15v14H10zM33 28h16v16H33z" fill="#d8c49b"/>
    <path d="M8 30 17 22l10 8H8ZM31 28 40 20l11 8H31Z" fill="#a84a34"/>
    <path d="M11 30h6l2-8H9l2 8ZM29 28h6l2-8H27l2 8Z" fill="#f0debb"/>
    <path d="M13 34h7v7h-7zM37 33h7v8h-7z" fill="#755334"/>
    <circle cx="20" cy="45" r="4" fill="#b7803c"/><path d="M17 44h6" stroke="#7a5125"/>
    <path d="M48 43v-5l5-2v7" fill="#95714a"/>`);

  KB.cardIcons.chapel = cardIcon(`
    <ellipse cx="32" cy="46" rx="22" ry="5" fill="#203320" opacity=".3"/>
    <path d="M18 27 34 19l16 8v20H18V27Z" fill="#d4ccb7"/>
    <path d="M34 19 50 27v20H34V19Z" fill="#ada592"/>
    <path d="M16 28 34 18l18 10v3L34 22 17 31l-1-3Z" fill="#4d5f63"/>
    <path d="M44 21V8l7 4v13" fill="#c5bda8" stroke="#7e7563"/>
    <path d="M43 8 47 2l5 6-5 3-4-3Z" fill="#81402e"/>
    <path d="M47 2V-3" stroke="#7d6d48" stroke-width="1.5"/>
    <circle cx="27" cy="34" r="4" fill="#e7ad58" stroke="#6c5230"/>
    <path d="M27 30v8M23 34h8" stroke="#8d6330" stroke-width="1"/>
    <path d="M19 40h5v7h-5z" fill="#593922"/>`);

  KB.cardIcons.garden = cardIcon(`
    <ellipse cx="32" cy="46" rx="26" ry="5" fill="#203320" opacity=".3"/>
    <path d="M7 38 32 26l25 12-25 12L7 38Z" fill="#5d7c44"/>
    <path d="M12 38 32 28l20 10-20 10-20-10Z" fill="#789b57"/>
    <circle cx="32" cy="36" r="6" fill="#7fa9a3"/><circle cx="32" cy="35" r="3" fill="#a9cdc3"/>
    <path d="M32 29v-5M29 33l-4 3M35 33l4 3" stroke="#c4d8ce" stroke-width="1.2"/>
    <circle cx="18" cy="36" r="2" fill="#e2b4a3"/><circle cx="45" cy="39" r="2" fill="#e2c277"/><circle cx="24" cy="42" r="1.6" fill="#c99bb4"/><circle cx="39" cy="34" r="1.5" fill="#e2b4a3"/>`);

  KB.cardIcons.tavern = cardIcon(`
    <ellipse cx="32" cy="46" rx="23" ry="5" fill="#203320" opacity=".3"/>
    <path d="M14 25 32 16l18 9v21H14V25Z" fill="#dfcaa2"/>
    <path d="M32 16 50 25v21H32V16Z" fill="#c0a87d"/>
    <path d="M11 26 32 13l21 13-3 3-18-11-18 11-3-3Z" fill="#76513a"/>
    <path d="M18 31h6v6h-6zM35 31h7v6h-7zM18 28h6v2h-6zM35 28h7v2h-7z" fill="#f0b55e" stroke="#674728"/>
    <path d="M24 46V36h6v10" fill="#5e3d24"/>
    <path d="M50 27v9" stroke="#4d3522" stroke-width="1.5"/><path d="M47 30h7v6h-7z" fill="#b88a42"/>
    <circle cx="49" cy="38" r="3" fill="#d7a54c"/>`);

  KB.cardIcons.watchtower = cardIcon(`
    <ellipse cx="32" cy="46" rx="18" ry="5" fill="#203320" opacity=".3"/>
    <path d="M22 15h20l-2 31H24L22 15Z" fill="#cbc3ae"/>
    <path d="M32 15h10l-2 31h-8V15Z" fill="#a69e8b"/>
    <path d="M19 16h26v5H19zM20 12h4v5h-4zM28 12h4v5h-4zM36 12h4v5h-4zM43 12h3v5h-3z" fill="#8a8270"/>
    <path d="M27 25h5v6h-5zM35 35h4v5h-4z" fill="#5a4b39"/>
    <path d="M46 13V2l9 4-9 4Z" fill="#a64b36"/>
    <path d="M27 44h10v4H27z" fill="#645a49"/>`);

  KB.cardIcons.barracks = cardIcon(`
    <ellipse cx="32" cy="46" rx="26" ry="5" fill="#203320" opacity=".3"/>
    <path d="M8 27 32 17l24 10v19H8V27Z" fill="#c9c1ab"/>
    <path d="M32 17 56 27v19H32V17Z" fill="#9f9784"/>
    <path d="M5 28 32 15l27 13-3 3-24-11L8 31l-3-3Z" fill="#8e3b2c"/>
    <path d="M12 32h43v2H12z" fill="#f0d49a" opacity=".45"/>
    <path d="M26 35h12v11H26z" fill="#4f3420"/>
    <path d="M20 31 24 27l4 4-2 8-5-1-1-7ZM40 30l4-3 4 4-2 8-5-1-1-8Z" fill="#b8a06c" stroke="#64512f"/>
    <path d="M47 9V22M43 13h8" stroke="#6d472a" stroke-width="2"/>`);

  KB.cardIcons.monument = cardIcon(`
    <ellipse cx="32" cy="46" rx="18" ry="5" fill="#203320" opacity=".3"/>
    <path d="M20 43h24v4H20zM23 38h18v5H23zM27 17h10v21H27z" fill="#c7bea5"/>
    <path d="M32 17h5v21h-5z" fill="#a39a83"/>
    <path d="M25 16 32 6l7 10-7 4-7-4Z" fill="#d6ab50"/>
    <path d="M32 10v8M28 14h8" stroke="#8c5c28" stroke-width="1.4"/>
    <circle cx="32" cy="33" r="4" fill="#8c672c"/><path d="M32 29v8M28 33h8" stroke="#eacb7e" stroke-width="1"/>`);

  KB.cardIcons.bulldoze = cardIcon(`
    <path d="M18 16h20v21H18z" fill="#9d5c48"/>
    <path d="M14 16 28 9l14 7-14 8-14-8Z" fill="#c47b5e"/>
    <path d="M24 21v10M31 18v15" stroke="#e4bda5" stroke-width="2"/>
    <path d="M42 35 52 45M52 35 42 45" stroke="#6d372a" stroke-width="3" stroke-linecap="round"/>`);
})();
