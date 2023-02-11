
// top-left index = 1,7 in test grid
// have to access like, wallMap[y][x] 
// -- y-index (row) goes first, then column (x)
let wallMap = [
  '_____________W_____________',
  '_____________W_____________',
  '__WWW__WWWW__W__WWWW__WWW__',
  '__WWW__WWWW__W__WWWW__WWW__',
  '___________________________',
  '___________________________',
  '__WWW__W__WWWWWWW__W__WWW__',
  '_______W_____W_____W_______',
  '_______W_____W_____W_______',
  'WWWWW__WWWW__W__WWWW__WWWWW',
  '____W__W___________W__W____',
  '____W__W___________W__W____',
  'WWWWW__W__WWWWWWW__W__WWWWW',
  '__________W_____W__________',
  '__________W_____W__________',
  'WWWWW__W__WWWWWWW__W__WWWWW',
  '____W__W___________W__W____',
  '____W__W___________W__W____',
  'WWWWW__W__WWWWWWW__W__WWWWW',
  '_____________W_____________',
  '_____________W_____________',
  '__WWW__WWWW__W__WWWW__WWW__',
  '____W_________________W____',
  '____W_________________W____',
  'WW__W__W__WWWWWWW__W__W__WW',
  '_______W_____W_____W_______',
  '_______W_____W_____W_______',
  '__WWWWWWWWW__W__WWWWWWWWW__',
  '___________________________',
  '___________________________'
];

// top-left pellet is index 2,8 in test grid
// each pellet is 2 grid squares diameter (8px original)
let pelletMap = [
  'pppppppppppp__pppppppppppp',
  'p____p_____p__p_____p____p',
  'P____p_____p__p_____p____P',
  'p____p_____p__p_____p____p',
  'pppppppppppppppppppppppppp',
  'p____p__p________p__p____p',
  'p____p__p________p__p____p',
  'pppppp__pppp__pppp__pppppp',
  '_____p______________p_____',
  '_____p______________p_____',
  '_____p______________p_____',
  '_____p______________p_____',
  '_____p______________p_____',
  '_____p______________p_____',
  '_____p______________p_____',
  '_____p______________p_____',
  '_____p______________p_____',
  '_____p______________p_____',
  '_____p______________p_____',
  'pppppppppppp__pppppppppppp',
  'p____p_____p__p_____p____p',
  'p____p_____p__p_____p____p',
  'Ppp__ppppppp__ppppppp__ppP',
  '__p__p__p________p__p__p__',
  '__p__p__p________p__p__p__',
  'pppppp__pppp__pppp__pppppp',
  'p__________p__p__________p',
  'p__________p__p__________p',
  'pppppppppppppppppppppppppp'  
];

function setupPellets() {
  // index test grid squares via calc((index * 100)cqh / 72);
  let pellets = document.querySelectorAll('.pellet:not(.power)');
  let powerPellets = document.querySelectorAll('.power.pellet');
  let pelletMapGridOffsetX = 2;
  let pelletMapGridOffsetY = 8;
  let pelletCounter = 0;
  let powerPelletCounter = 0;
  let gridX = 0;
  let gridY = 0;
  const GRID_ROWS = 72;
  let transformStringArray = [
    'translate(calc(',
    '[insert X-index * 100]',
    'cqh / ' + GRID_ROWS + '),calc(',
    '[insert Y-index * 100]',
    'cqh / ' + GRID_ROWS + '))'
  ];
  for(let i = 0; i < pelletMap.length; ++i) {
    for(let j = 0; j < pelletMap[0].length; ++j) {
      if (pelletMap[i][j] == 'p') {
        transformStringArray[1] = '' + (j * 2 * 100 + pelletMapGridOffsetX * 100);
        transformStringArray[3] = '' + (i * 2 * 100 + pelletMapGridOffsetY * 100);
        pellets[pelletCounter].style.transform = transformStringArray.join("");
        pelletCounter++;
      }
      else if (pelletMap[i][j] == 'P') {
        transformStringArray[1] = '' + (j * 2 * 100 + pelletMapGridOffsetX * 100);
        transformStringArray[3] = '' + (i * 2 * 100 + pelletMapGridOffsetY * 100);
        powerPellets[powerPelletCounter].style.transform = transformStringArray.join("");
        powerPelletCounter++;
      }
    }
  }
}
// setupPellets();
// ran once, then copied output HTML into index.html

// will contain all future collisions' timer handles (to be cancelled if necessary)
// this includes pellet collection, ghost death, ghost consume, wall collision, etc.
// the queue should be ordered chronologically, but I guess it doesn't have to be
let pacCollisionQueue = [];

// @params current x, y, s=speed, d=direction: 'N','E','S','W'
function pacDetectWallCollision(x, y, s, d) {
  // velocity = {speed(in grid spaces/sec), direction}
  let v = {s:  s, d: d};
  // pac-position
  let p = {x: x, y: y};
  // wallMap test-grid offset
  const WM_OFFSET_X = 1;
  const WM_OFFSET_Y = 7;
  // spaces measured in test-grid spaces (pac-man is 4x4, wall space is 2x2)
  let spacesUntilStop = 100; 
  let collisionDetected = false;
  let style = document.querySelector('style#pac-move');
  let pac = document.querySelector('.pac');
  let pacPath = document.querySelector('.pac > svg > path');
  let animStyleStrArray = [ // .join("") to convert to regular string
    '.pac{animation-duration:',
    '', // index [1] = duration
    's;} @keyframes pac-move {from{transform:translate(calc(',
    '', // index [3] = grid-start X * 100
    'cqh / 72),calc(', // FIXME: may want to do all math in JS (not CSS) to increase performance
    '', // index [5] = grid-start Y * 100
    'cqh / 72)) rotate(',
    '', // index [7] = 90 for down, -90 for up, 0 for right, 180 for left
    'deg);}to{transform:translate(calc(',
    '', // index [9] = grid-end X * 100
    'cqh / 72),calc(',
    '', // index [11] = grid-end Y * 100
    'cqh / 72)) rotate(',
    '', // index [13] = same as index [7]
    'deg);}}'
  ];
  animStyleStrArray[3] = p.x * 100;
  animStyleStrArray[5] = p.y * 100;
  if      (v.d == 'W') {
    animStyleStrArray[7] = animStyleStrArray[13] = 180;
    for(let i = p.x; i > (p.x - spacesUntilStop) || !collisionDetected; --i) {
      // keep in mind, the wallMap has 2 grid spaces per index!!!
      let x = Math.trunc((i - WM_OFFSET_X) / 2);
      let y = Math.trunc((p.y - WM_OFFSET_Y) / 2);
      console.log(x,y);
      console.log(wallMap);
      if (wallMap[y][x] == 'W') {
        collisionDetected = true;
        spacesUntilStop = p.x - i + 1;
        animStyleStrArray[1]  = spacesUntilStop / v.s;
        animStyleStrArray[9]  = (i+1) * 100;
        animStyleStrArray[11] = p.y * 100;
      }
    }
  }
  else if (v.d == 'N') {
    animStyleStrArray[7] = animStyleStrArray[13] = -90;
    for(let i = p.y; i > (p.y - spacesUntilStop) || !collisionDetected; --i) {
      let x = Math.trunc(p.x / 2) - WM_OFFSET_X;
      let y = Math.trunc(i / 2) - WM_OFFSET_Y;
      if (wallMap[y][x] == 'W') {
        collisionDetected = true;
        spacesUntilStop = p.y - i + 1;
        animStyleStrArray[1]  = spacesUntilStop / v.s;
        animStyleStrArray[9]  = p.x * 100;
        animStyleStrArray[11] = (i+1) * 100;
      }
    }
  }
  else if (v.d == 'E') {
    animStyleStrArray[7] = animStyleStrArray[13] = 0;
    for(let i = p.y; i < (p.y + spacesUntilStop) || !collisionDetected; ++i) {
      let x = Math.trunc(i / 2) - WM_OFFSET_X;
      let y = Math.trunc(p.y / 2) - WM_OFFSET_Y;
      if (wallMap[y][x] == 'W') {
        collisionDetected = true;
        spacesUntilStop = p.x + i - 1;
        animStyleStrArray[1]  = spacesUntilStop / v.s;
        animStyleStrArray[9]  = (i-1) * 100;
        animStyleStrArray[11] = p.y * 100;
      }
    }
  }
  else if (v.d == 'S') {
    animStyleStrArray[7] = animStyleStrArray[13] = 90;
    for(let i = p.y; i < (p.y + spacesUntilStop) || !collisionDetected; ++i) {
      let x = Math.trunc(p.x / 2) - WM_OFFSET_X;
      let y = Math.trunc(i / 2) - WM_OFFSET_Y;
      if (wallMap[y][x] == 'W') {
        collisionDetected = true;
        spacesUntilStop = p.y + i - 1;
        animStyleStrArray[1]  = spacesUntilStop / v.s;
        animStyleStrArray[9]  = p.x * 100;
        animStyleStrArray[11] = (i-1) * 100;
      }
    }
  }
  style.innerHTML = animStyleStrArray.join("");
}
pacDetectWallCollision(26, 51, 12.5, 'W');


