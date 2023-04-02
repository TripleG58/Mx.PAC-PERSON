// HELPER METHODS // 
// Shorten querySelector
// usage: elem.querySelector(param) => qs(elem, param);
function qs(elem, param) { return elem.querySelector(param); }
// Shorten document.querySelector
function dqs(param) { return document.querySelector(param); }
// Shorten document.querySelectorAll
function dqsa(param) { return document.querySelectorAll(param); }
// sleep utility function
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }


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
  for (let i = 0; i < pelletMap.length; ++i) {
    for (let j = 0; j < pelletMap[0].length; ++j) {
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
async function pacDetectWallCollision(xi, yi, s, d) {
  // velocity = {speed(in grid spaces/sec), direction}
  let v = { s: s, d: d };
  // pac-position
  let p = { x: xi, y: yi };
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
  // keep in mind, the wallMap has 2 grid spaces per index!!!
  if (v.d == 'W') {
    animStyleStrArray[7] = animStyleStrArray[13] = 180;
    for (let i = p.x; i > (p.x - spacesUntilStop) && !collisionDetected; --i) {
      let x = Math.trunc((i - WM_OFFSET_X) / 2);
      let y = Math.trunc((p.y - WM_OFFSET_Y) / 2);
      if (wallMap[y][x] == 'W' || i < WM_OFFSET_X) {
        collisionDetected = true;
        spacesUntilStop = p.x - i + 1;
        animStyleStrArray[1] = spacesUntilStop / v.s;
        animStyleStrArray[9] = (i + 1) * 100;
        animStyleStrArray[11] = p.y * 100;
      }
    }
  }
  else if (v.d == 'N') {
    animStyleStrArray[7] = animStyleStrArray[13] = -90;
    for (let i = p.y; i > (p.y - spacesUntilStop) && !collisionDetected; --i) {
      let x = Math.trunc((p.x - WM_OFFSET_X) / 2);
      let y = Math.trunc((i - WM_OFFSET_Y) / 2);
      if (wallMap[y][x] == 'W' || i < WM_OFFSET_Y) {
        collisionDetected = true;
        spacesUntilStop = p.y - i + 1;
        animStyleStrArray[1] = spacesUntilStop / v.s;
        animStyleStrArray[9] = p.x * 100;
        animStyleStrArray[11] = (i + 1) * 100;
      }
    }
  }
  else if (v.d == 'E') {
    animStyleStrArray[7] = animStyleStrArray[13] = 0;
    for (let i = p.x; i < (p.x + spacesUntilStop) && !collisionDetected; ++i) {
      let x = Math.trunc((i - WM_OFFSET_X) / 2);
      let y = Math.trunc((p.y - WM_OFFSET_Y) / 2);
      if (wallMap[y][x] == 'W' || i + 1 > 55) { // math should match 'S' case, but exploiting divisibility I guess? (not sure why this works) 
        collisionDetected = true;
        spacesUntilStop = i - p.x - 1 - 3; // 3 = pac-width
        animStyleStrArray[1] = spacesUntilStop / v.s;
        animStyleStrArray[9] = (i - 1 - 3) * 100;
        animStyleStrArray[11] = p.y * 100;
      }
    }
  }
  else if (v.d == 'S') {
    animStyleStrArray[7] = animStyleStrArray[13] = 90;
    for (let i = p.y; !collisionDetected; ++i) {
      let x = Math.trunc((p.x - WM_OFFSET_X) / 2);
      let y = Math.trunc((i - WM_OFFSET_Y) / 2);
      console.log(y);
      if (wallMap[y][x] == 'W' || i + 3 > 66) {
        collisionDetected = true;
        spacesUntilStop = i - p.y - 1 - 3; // 3 = pac-height
        if (i + 3 > 66) spacesUntilStop = i - p.y - 1;
        animStyleStrArray[1] = spacesUntilStop / v.s;
        animStyleStrArray[9] = p.x * 100;
        animStyleStrArray[11] = (i - 1 - 3) * 100;
        if (i + 3 > 66) animStyleStrArray[11] = (i - 1) * 100;
      }
    }
  }
  // console.log(animStyleStrArray.join(""));
  // document.querySelector('.pac').offsetHeight;
  // document.querySelector('.pac').classList.add('resetAnimation');
  document.querySelector('.pac').style.animationName = "none";
  document.querySelector('.pac').style.animationDuration = "0s";
  // await sleep(1);
  style.innerHTML = animStyleStrArray.join("");
  // await sleep(1);
  // document.querySelector('.pac').classList.remove('resetAnimation');
  document.querySelector('.pac').offsetHeight; // trigger reflow after changing animation
  
  document.querySelector('.pac').style.animationName = "";
  document.querySelector('.pac').style.animationDuration = "";
}
let pac = document.querySelector('.pac');
let animCounter = 1;

let anims = 'WNESESWSESWNENWSESWS';
pac.onanimationend = async e => {
  let x = 0;
  let y = 0;
  let w = 0;
  let h = 0;
  let m = document.querySelector('main');
  // get current coordinates from transform & grid conversion math
  let matrix = window.getComputedStyle(e.target).transform;
  matrix = matrix.match(/matrix.*\((.+)\)/)[1].split(', ');
  x = matrix[4];
  y = matrix[5];
  // console.log(matrix);
  w = m.offsetWidth;
  // FIXME: .offsetHeight causes reflow - could be cause of future performance issues
  h = m.offsetHeight;
  // console.log(w,h);
  x = Math.round(x / w * 56);
  y = Math.round(y / h * 72);
  // console.log(x,y);
  // document.querySelector('.pac').classList.add('resetAnimation');
  // document.querySelector('.pac').offsetHeight;
  // await sleep(3000);
  // if      (animCounter == 0) pacDetectWallCollision(x, y, 12.5, 'N');
  // else if (animCounter == 1) pacDetectWallCollision(x, y, 12.5, 'E');
  // else if (animCounter == 2) pacDetectWallCollision(x, y, 12.5, 'S');
  // else if (animCounter == 3) pacDetectWallCollision(x, y, 12.5, 'E');
  // else if (animCounter == 4) pacDetectWallCollision(x, y, 12.5, 'S');

  if (animCounter < anims.length) {
    pacDetectWallCollision(x, y, 12.5, anims[animCounter]);
  }
  animCounter++;
};

// begin static demo animations //
pacDetectWallCollision(26, 51, 12.5, 'W');

// FIXME: figure out how to stop animation mid-way
// algorithm:
// pause both animation on '.pac' and '.pac > svg > path'
// -- path animation should only need to be paused when pac hits a wall/ghost
// 


// @param dir = case-insensitive char enum: 'N', 'S', 'E', 'W'
function changePacDirection(dir) {
  dir = dir.toUpperCase();
  
  switch(dir) {
    case 'N':
      
      break;
    case 'S':
      
      break;
    case 'E':
      
      break;
    case 'W':
      
      break;
    default:
      break;
  }
}


// Add an event listener to the document to listen for the space bar key
document.addEventListener("keydown", function(event) {
  // Check if the key pressed is the space bar
  if (event.code === "Space") {
    // Toggle the value of the animation-play-state property
    if (pac.style.animationPlayState === "paused") {
      pac.style.animationPlayState = "running";
    } else {
      pac.style.animationPlayState = "paused";
    }
  }
});




