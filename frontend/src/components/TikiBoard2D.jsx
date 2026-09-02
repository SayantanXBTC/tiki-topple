import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'

// ══════════════════════════════════════════════════════════════════════════════
// TIKI TOPPLE 2D BOARD — Premium photorealistic canvas rendering
// ══════════════════════════════════════════════════════════════════════════════

// Static background/board assets disabled — r3f IslandJungleScene renders the
// environment; the 2D canvas draws a transparent overlay with the gold frame + gem tikis.
const ASSETS = {
  bg:    { complete: false, naturalWidth: 0 },
  board: { complete: false, naturalWidth: 0 },
}

const easeOutCubic   = t => 1 - Math.pow(1 - t, 3)
const easeInCubic    = t => Math.pow(t, 3)
const easeInOutCubic = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2
function easeOutBounce(t) {
  const n1=7.5625,d1=2.75
  if(t<1/d1) return n1*t*t
  if(t<2/d1) return n1*(t-=1.5/d1)*t+0.75
  if(t<2.5/d1) return n1*(t-=2.25/d1)*t+0.9375
  return n1*(t-=2.625/d1)*t+0.984375
}

class AnimationQueue {
  constructor(){this.animations=[]}
  add(a){this.animations.push({start:Date.now(),...a})}
  update(){
    const now=Date.now()
    this.animations=this.animations.filter(a=>{
      const t=Math.min(1,(now-a.start)/a.duration)
      a.update(t);if(t>=1){a.onComplete?.();return false}return true
    })
  }
  clear(){this.animations=[]}
}

// Ultra-vivid jewel palette — brighter body colors so faces read from across
// the room. Deeper shades for real 3D contrast.
const TIKI_DATA = {
  hookipa:{color:'#22c8ff', shade:'#003a70', light:'#d8f2ff', rim:'#66d8ff', name:'Hookipa'}, // sapphire
  lani:   {color:'#b840ff', shade:'#3d0070', light:'#eec8ff', rim:'#d078ff', name:'Lani'   }, // amethyst
  kai:    {color:'#ff2020', shade:'#5a0000', light:'#ffb0b0', rim:'#ff5555', name:'Kai'    }, // ruby
  malu:   {color:'#ff44b0', shade:'#70044c', light:'#ffc8e8', rim:'#ff78cc', name:'Malu'   }, // pink tourmaline
  nalu:   {color:'#ffd820', shade:'#7a5a00', light:'#fff4b0', rim:'#ffe855', name:'Nalu'   }, // topaz
  pele:   {color:'#ff6a1c', shade:'#7a1800', light:'#ffc898', rim:'#ff8f44', name:'Pele'   }, // fire opal
  honu:   {color:'#20e858', shade:'#005a18', light:'#b0ffc8', rim:'#55f080', name:'Honu'   }, // emerald
  mana:   {color:'#e8ecf2', shade:'#4a4c56', light:'#ffffff', rim:'#d0d8e8', name:'Mana'   }, // pearl / silver
  koa:    {color:'#8cff20', shade:'#2a6a00', light:'#d8ffb0', rim:'#a8ff55', name:'Koa'    }, // peridot
}
const NUM_SLOTS=9

// ── Colour utilities ──────────────────────────────────────────────────────────
function hex2rgb(h){
  if(h.length===4) return [parseInt(h[1]+h[1],16),parseInt(h[2]+h[2],16),parseInt(h[3]+h[3],16)];
  return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]
}
function shadeHex(h,a){const[r,g,b]=hex2rgb(h);const c=v=>Math.min(255,Math.max(0,v+a));return`rgb(${c(r||0)},${c(g||0)},${c(b||0)})`}
function hexA(h,a){const[r,g,b]=hex2rgb(h);return`rgba(${r||0},${g||0},${b||0},${a})`}

// Seeded pseudo-random for consistent stone textures
function seededRand(seed){let s=seed;return()=>{s=(s*16807+0)%2147483647;return(s-1)/2147483646}}

function rrect(ctx,x,y,w,h,r){
  ctx.beginPath()
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r)
  ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r)
  ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r)
  ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r)
  ctx.closePath()
}

// ── Layout ────────────────────────────────────────────────────────────────────
function computeLayout(W,H){
  // Extra bottom padding for clear breathing room between board and card tray
  const bottomTrayH = Math.min(260, Math.max(200, H*0.24))
  const shaftW  = Math.min(W*0.09, 130)
  const shaftX  = (W-shaftW)/2
  const shaftTop= H*0.11
  const shaftBot= H - bottomTrayH - 70 // Clear vertical gap above the cards tray
  const shaftH  = shaftBot-shaftTop
  const slotH   = shaftH/(NUM_SLOTS+0.4)
  // Tikis: narrower painted-wood blocks so each carved face reads clearly.
  // Height still fills the full slot for a continuous stacked-totem column.
  const tikiW   = shaftW*0.74
  const tikiH   = slotH*1.0
  const stoneR  = Math.min(W*0.024, H*0.028, shaftH/(14*2.4))
  const slotY   = i => shaftTop + slotH*(i+0.80)
  return{shaftX,shaftW,shaftTop,shaftBot,shaftH,slotH,tikiW,tikiH,stoneR,slotY}
}

function computeStonePositions(W,H,layout){
  const{shaftX,shaftW,shaftTop,shaftBot,shaftH,stoneR}=layout
  // Push stones outboard of the gold bezel (bezel width = shaftW*0.11 below)
  const bezelOut = shaftW * 0.13
  const positions=[]
  // Left 1–14: bottom→top
  for(let i=0;i<14;i++){
    const t=i/13
    const stagger=(i%2)*stoneR*0.5
    positions.push({n:i+1, x:shaftX - bezelOut - stoneR*1.6 - stagger, y:shaftBot-stoneR*0.4-t*(shaftH-stoneR)})
  }
  // Top arc 15–20
  for(let i=0;i<6;i++){
    const t=i/5
    positions.push({
      n:15+i,
      x:shaftX-stoneR+t*(shaftW+stoneR*2),
      y:shaftTop - bezelOut*1.2 - stoneR*1.9 - Math.sin(t*Math.PI)*stoneR*0.55
    })
  }
  // Right 21–35: top→bottom
  for(let i=0;i<15;i++){
    const t=i/14
    const stagger=(i%2)*stoneR*0.5
    positions.push({n:21+i, x:shaftX + shaftW + bezelOut + stoneR*1.6 + stagger, y:shaftTop+stoneR*0.4+t*(shaftH-stoneR)})
  }
  return positions
}

// ══════════════════════════════════════════════════════════════════════════════
// PHOTOREALISTIC BACKGROUND
// ══════════════════════════════════════════════════════════════════════════════
// Noise helpers — two-octave sine-based for grain/texture
function noiseVal(x,y,scale,seed){
  return Math.sin(x*scale*1.3+seed)*Math.cos(y*scale*0.9+seed*0.7)*0.5+0.5
}

function drawBackground(ctx,W,H,elapsed){
  // Transparent sky so VolcanicAtmosphere shows through


  // Drifting chunky clouds
  ctx.save()
  ctx.fillStyle='rgba(255,255,255,0.06)'
  const cloudT = elapsed * 0.02
  for(let i=0; i<3; i++){
    const cx = (W * (0.3 * i + cloudT) + W * i * 0.4) % (W * 1.5) - W*0.2
    const cy = H * (0.1 + i*0.05)
    const cr = W * (0.15 + i*0.05)
    ctx.beginPath()
    ctx.arc(cx, cy, cr, 0, Math.PI*2)
    ctx.arc(cx+cr*0.8, cy-cr*0.2, cr*0.8, 0, Math.PI*2)
    ctx.arc(cx-cr*0.7, cy+cr*0.1, cr*0.6, 0, Math.PI*2)
    ctx.fill()
  }
  ctx.restore()

  // Ground - thick stylized earth
  ctx.save()
  const gndG=ctx.createLinearGradient(0,H*0.35,0,H)
  gndG.addColorStop(0,'#5c4a21'); gndG.addColorStop(0.4,'#82632b'); gndG.addColorStop(0.8,'#a67f37'); gndG.addColorStop(1,'#8c6828')
  ctx.fillStyle=gndG
  ctx.beginPath()
  ctx.moveTo(0,H*0.45); ctx.bezierCurveTo(W*0.3,H*0.38, W*0.7,H*0.48, W,H*0.42); ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.fill()
  
  // Chunky stylized sand ridges (slowly shifting)
  ctx.fillStyle='rgba(255,255,255,0.04)'
  for(let i=0;i<4;i++){
    const offset = Math.sin(elapsed * 0.3 + i) * W * 0.02
    ctx.beginPath(); ctx.moveTo(0,H*(0.5+i*0.1)); ctx.bezierCurveTo(W*0.4+offset,H*(0.45+i*0.12), W*0.6-offset,H*(0.55+i*0.08), W,H*(0.48+i*0.1))
    ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.fill()
  }

  // Magic Lagoon on left
  ctx.beginPath()
  ctx.moveTo(0,H*0.5); ctx.bezierCurveTo(W*0.1,H*0.52, W*0.25,H*0.65, W*0.2,H*0.8)
  ctx.bezierCurveTo(W*0.15,H*0.9, W*0.05,H*0.95, 0,H); ctx.closePath(); ctx.clip()

  // Lagoon depths
  const waterG=ctx.createRadialGradient(0,H*0.7,0, 0,H*0.7,W*0.3)
  waterG.addColorStop(0,'#00ffff'); waterG.addColorStop(0.4,'#0088ff'); waterG.addColorStop(1,'#002266')
  ctx.fillStyle=waterG; ctx.fillRect(0,0,W,H)

  // Thick chunky foam edge (animating)
  ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=W*0.015; ctx.lineCap='round'
  for(let i=0;i<3;i++){
    const wave = Math.sin(elapsed * 1.5 + i * 1.2) * H * 0.01
    ctx.beginPath(); ctx.moveTo(-W*0.05,H*(0.55+i*0.15) + wave)
    ctx.bezierCurveTo(W*0.08,H*(0.57+i*0.15) + wave, W*0.15,H*(0.62+i*0.15) + wave, W*0.18,H*(0.7+i*0.15) + wave); ctx.stroke()
  }
  ctx.restore()

  // Global vignette for depth
  const vigG=ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,W*0.8)
  vigG.addColorStop(0,'rgba(0,0,0,0)'); vigG.addColorStop(1,'rgba(0,0,0,0.65)')
  ctx.fillStyle=vigG; ctx.fillRect(0,0,W,H)
}

// ══════════════════════════════════════════════════════════════════════════════
// FOLIAGE — photorealistic layered
// ══════════════════════════════════════════════════════════════════════════════
function drawCanopy(ctx,W,H,elapsed){
  // Big chunky overlapping leaf clusters at the top
  ctx.save()
  ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=20; ctx.shadowOffsetY=10
  const drawCluster = (cx, cy, r, baseColor) => {
    ctx.fillStyle='rgba(0,0,0,0.4)'
    ctx.beginPath(); ctx.arc(cx,cy+r*0.2,r*1.1,0,Math.PI*2); ctx.fill()
    const g=ctx.createRadialGradient(cx-r*0.3,cy-r*0.3,r*0.1, cx,cy,r*1.1)
    g.addColorStop(0,shadeHex(baseColor, 40)); g.addColorStop(0.4,baseColor)
    g.addColorStop(0.8,shadeHex(baseColor, -40)); g.addColorStop(1,shadeHex(baseColor, -60))
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill()
    ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=r*0.08
    ctx.beginPath(); ctx.arc(cx,cy,r-r*0.04,Math.PI*0.8,Math.PI*1.8); ctx.stroke()
  }
  const clusters = [
    {x:0.0,y:-0.05,r:0.18,c:'#124016'},{x:0.2,y:-0.02,r:0.15,c:'#18541e'},{x:0.4,y:-0.06,r:0.20,c:'#124016'},
    {x:0.6,y:-0.03,r:0.16,c:'#1e6b26'},{x:0.8,y:-0.07,r:0.19,c:'#18541e'},{x:1.0,y:-0.04,r:0.17,c:'#124016'},
    {x:0.1,y:0.05,r:0.12,c:'#1e6b26'},{x:0.3,y:0.08,r:0.10,c:'#25822e'},{x:0.7,y:0.06,r:0.11,c:'#25822e'},
    {x:0.9,y:0.07,r:0.13,c:'#1e6b26'}
  ]
  clusters.forEach(({x,y,r,c}) => {
    const sway = Math.sin(elapsed * 0.8 + x * 10) * W * 0.015
    drawCluster(W*x + sway, H*y, W*r, c)
  })
  ctx.restore()
}

function drawChunkyBush(ctx, bx, by, br, baseColor) {
  ctx.save()
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.shadowColor='rgba(0,0,0,0)'
  ctx.beginPath(); ctx.ellipse(bx,by+br*0.5,br*1.2,br*0.3,0,0,Math.PI*2); ctx.fill()
  const blobs = [{dx:-br*0.3,dy:0,r:br*0.8}, {dx:br*0.3,dy:br*0.1,r:br*0.75}, {dx:0,dy:-br*0.2,r:br}]
  blobs.forEach(({dx,dy,r})=>{
    const g=ctx.createRadialGradient(bx+dx-r*0.3,by+dy-r*0.3,r*0.1, bx+dx,by+dy,r*1.1)
    g.addColorStop(0,shadeHex(baseColor, 50)); g.addColorStop(0.4,baseColor)
    g.addColorStop(0.8,shadeHex(baseColor, -40)); g.addColorStop(1,shadeHex(baseColor, -70))
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(bx+dx,by+dy,r,0,Math.PI*2); ctx.fill()
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.ellipse(bx+dx-r*0.3,by+dy-r*0.4,r*0.3,r*0.15,Math.PI*0.1,0,Math.PI*2); ctx.fill()
  })
  ctx.restore()
}

function drawLeftFoliage(ctx,W,H,elapsed){
  const sway1 = Math.sin(elapsed * 1.1) * W * 0.01
  const sway2 = Math.sin(elapsed * 0.9 + 2) * W * 0.015
  
  drawChunkyBush(ctx, W*0.08 + sway1, H*0.85, W*0.06, '#288c30')
  drawChunkyBush(ctx, W*0.15 + sway2, H*0.92, W*0.045, '#1e6b26')
  drawChunkyBush(ctx, W*0.04 - sway1, H*0.96, W*0.05, '#32a83c')
  
  const px=W*0.06, py=H*0.75
  const treeSway = Math.sin(elapsed * 0.7) * 0.05
  ctx.save()
  const tg=ctx.createLinearGradient(px-W*0.02,0,px+W*0.02,0)
  tg.addColorStop(0,'#4a2a10'); tg.addColorStop(0.5,'#8a5222'); tg.addColorStop(1,'#2c1505')
  ctx.fillStyle=tg; ctx.beginPath(); ctx.moveTo(px-W*0.02,py); ctx.lineTo(px+W*0.015,py)
  ctx.quadraticCurveTo(px+W*0.01, py-H*0.1, px+W*0.01 + Math.sin(treeSway)*H*0.25, py-H*0.25)
  ctx.lineTo(px-W*0.01 + Math.sin(treeSway)*H*0.25, py-H*0.25)
  ctx.quadraticCurveTo(px-W*0.01, py-H*0.1, px-W*0.02, py); ctx.fill()
  
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=3; ctx.lineCap='round'
  for(let i=0;i<5;i++){
    const currY = py-H*0.05*i
    const offX = Math.sin(treeSway)*H*0.05*i
    ctx.beginPath(); ctx.moveTo(px-W*0.015 + offX, currY); ctx.lineTo(px+W*0.012 + offX, currY+H*0.01); ctx.stroke()
  }
  ctx.restore()
  
  const leaves=[{a:-2.2, r:0.12}, {a:-1.6, r:0.15}, {a:-1.0, r:0.13}, {a:-0.4, r:0.10}]
  const topX = px + Math.sin(treeSway)*H*0.25
  const topY = py - H*0.25
  leaves.forEach(({a,r}, i)=>{
    const leafSway = Math.sin(elapsed * 1.5 + i) * 0.1
    ctx.save(); ctx.translate(topX,topY); ctx.rotate(a + treeSway + leafSway)
    const lg=ctx.createLinearGradient(0,0,W*r,0)
    lg.addColorStop(0,'#25822e'); lg.addColorStop(0.5,'#44c452'); lg.addColorStop(1,'#18541e')
    ctx.fillStyle=lg; ctx.beginPath(); ctx.moveTo(0,0)
    ctx.quadraticCurveTo(W*r*0.5, -W*0.04, W*r, 0); ctx.quadraticCurveTo(W*r*0.5, W*0.02, 0, 0); ctx.fill()
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=2
    ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(W*r*0.5, -W*0.01, W*r, 0); ctx.stroke()
    ctx.restore()
  })

  ;[[W*0.1,H*0.82,'#ff3366',1],[W*0.14,H*0.9,'#ffaa00',2],[W*0.05,H*0.95,'#33ccff',3]].forEach(([fx,fy,fc,i])=>{
    drawFlower(ctx,fx + Math.sin(elapsed*1.2+i)*W*0.005, fy + Math.cos(elapsed*1.2+i)*H*0.005, W*0.015, fc)
  })
}

function drawRightFoliage(ctx,W,H,elapsed){
  const sway1 = Math.sin(elapsed * 1.1 + Math.PI) * W * 0.01
  const sway2 = Math.sin(elapsed * 0.9 + 4) * W * 0.015

  drawRealIdol(ctx,W*0.92,H*0.7,W*0.06,H*0.12)
  drawChunkyBush(ctx, W*0.95 + sway1, H*0.82, W*0.05, '#1e6b26')
  drawChunkyBush(ctx, W*0.88 + sway2, H*0.88, W*0.055, '#288c30')
  drawChunkyBush(ctx, W*0.97 - sway1, H*0.95, W*0.04, '#32a83c')
  ;[[W*0.91,H*0.85,'#ffaa00',4],[W*0.97,H*0.92,'#ff3366',5],[W*0.87,H*0.94,'#cc33ff',6]].forEach(([fx,fy,fc,i])=>{
    drawFlower(ctx,fx + Math.sin(elapsed*1.2+i)*W*0.005, fy + Math.cos(elapsed*1.2+i)*H*0.005, W*0.015, fc)
  })
}

function drawFlower(ctx,cx,cy,r,fc){
  ctx.save(); ctx.shadowColor='rgba(0,0,0,0.3)'; ctx.shadowBlur=4; ctx.shadowOffsetY=2; ctx.fillStyle=fc
  for(let i=0;i<5;i++){
    const a=(i/5)*Math.PI*2; ctx.beginPath(); ctx.arc(cx+Math.cos(a)*r*0.7,cy+Math.sin(a)*r*0.7,r*0.6,0,Math.PI*2); ctx.fill()
  }
  ctx.fillStyle='#ffea00'; ctx.beginPath(); ctx.arc(cx,cy,r*0.5,0,Math.PI*2); ctx.fill()
  ctx.restore()
}

function drawRealIdol(ctx,cx,topY,w,h){
  ctx.save(); ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=8; ctx.shadowOffsetY=5
  const bG=ctx.createLinearGradient(cx-w/2,0,cx+w/2,0)
  bG.addColorStop(0,'#3a1d0d'); bG.addColorStop(0.2,'#703c1d'); bG.addColorStop(0.8,'#542a12'); bG.addColorStop(1,'#261207')
  ctx.fillStyle=bG; rrect(ctx,cx-w/2,topY,w,h,w*0.15); ctx.fill()
  ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=3
  ctx.beginPath(); ctx.moveTo(cx-w/2+w*0.15,topY+2); ctx.lineTo(cx+w/2-w*0.15,topY+2); ctx.stroke()
  ;[-w*0.2, w*0.2].forEach(ex=>{
    ctx.fillStyle='#110804'; ctx.beginPath(); ctx.arc(cx+ex,topY+h*0.35,w*0.18,0,Math.PI*2); ctx.fill()
    ctx.fillStyle='#ffaa00'; ctx.shadowColor='#ff3300'; ctx.shadowBlur=15
    ctx.beginPath(); ctx.arc(cx+ex,topY+h*0.35,w*0.1,0,Math.PI*2); ctx.fill()
    ctx.shadowBlur=0
  })
  ctx.fillStyle='#110804'; rrect(ctx,cx-w*0.3,topY+h*0.65,w*0.6,h*0.15,w*0.05); ctx.fill()
  ctx.fillStyle='#e6d5b8'; ctx.fillRect(cx-w*0.2,topY+h*0.65,w*0.1,h*0.1); ctx.fillRect(cx+w*0.1,topY+h*0.65,w*0.1,h*0.1)
  ctx.restore()
}

// ══════════════════════════════════════════════════════════════════════════════
// SHAFT — premium mahogany wood
// ══════════════════════════════════════════════════════════════════════════════
// ── Carved wooden totem frame w/ gold inner bezel & rivets ────────────────
function drawShaft(ctx,W,H,layout){
  const{shaftX,shaftW,shaftTop,shaftBot,slotH,slotY}=layout
  const shaftH=shaftBot-shaftTop, R=shaftW*0.09
  const bezel = shaftW*0.13
  const outerX = shaftX - bezel, outerY = shaftTop - bezel*1.2
  const outerW = shaftW + bezel*2, outerH = shaftH + bezel*2.2

  ctx.save()
  // Narrow ground contact shadow only — no big square halo behind frame
  ctx.fillStyle='rgba(0,0,0,0.55)'
  ctx.beginPath(); ctx.ellipse(shaftX+shaftW/2, shaftBot+bezel*0.3, shaftW*0.85, shaftW*0.10, 0, 0, Math.PI*2); ctx.fill()
  ctx.restore()

  // ── Carved mahogany wooden frame ────────────────────────────────────────
  const woodG = ctx.createLinearGradient(outerX, outerY, outerX+outerW, outerY+outerH)
  woodG.addColorStop(0.00, '#2a1408')
  woodG.addColorStop(0.15, '#5a2e14')
  woodG.addColorStop(0.35, '#7a3f1c')
  woodG.addColorStop(0.55, '#6a3618')
  woodG.addColorStop(0.75, '#4a2510')
  woodG.addColorStop(1.00, '#1a0d05')
  ctx.fillStyle = woodG
  rrect(ctx,outerX,outerY,outerW,outerH,R*1.4); ctx.fill()

  // Wood grain — vertical streaks (clipped to frame area)
  ctx.save()
  rrect(ctx,outerX,outerY,outerW,outerH,R*1.4); ctx.clip()
  const grainRng = seededRand(42)
  const grainCount = Math.floor(outerW / 4)
  for (let i = 0; i < grainCount; i++) {
    const gx = outerX + i * (outerW / grainCount) + (grainRng() - 0.5) * 2
    const alpha = 0.05 + grainRng() * 0.10
    const width = 0.6 + grainRng() * 1.3
    ctx.strokeStyle = `rgba(${grainRng() > 0.5 ? '30,15,5' : '90,45,20'},${alpha})`
    ctx.lineWidth = width
    ctx.beginPath()
    // Slightly curved streak, warping across height
    const drift = (grainRng() - 0.5) * 8
    ctx.moveTo(gx, outerY - 4)
    ctx.bezierCurveTo(gx + drift, outerY + outerH * 0.33,
                      gx - drift, outerY + outerH * 0.66,
                      gx + drift * 0.4, outerY + outerH + 4)
    ctx.stroke()
  }
  // Wood knots — occasional darker ellipse blotches
  for (let i = 0; i < 5; i++) {
    const kx = outerX + grainRng() * outerW
    const ky = outerY + grainRng() * outerH
    const kr = 4 + grainRng() * 5
    const kg = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr)
    kg.addColorStop(0, 'rgba(20,10,4,0.55)')
    kg.addColorStop(1, 'rgba(20,10,4,0)')
    ctx.fillStyle = kg
    ctx.beginPath(); ctx.ellipse(kx, ky, kr, kr * 0.6, grainRng() * Math.PI, 0, Math.PI*2); ctx.fill()
  }
  ctx.restore()

  // Frame edge highlight (top-left lit, bottom-right dark)
  ctx.save()
  ctx.strokeStyle = 'rgba(255,200,140,0.28)'; ctx.lineWidth = Math.max(1, shaftW*0.010)
  rrect(ctx, outerX+1, outerY+1, outerW-2, outerH-2, R*1.4); ctx.stroke()
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1
  rrect(ctx, outerX, outerY, outerW, outerH, R*1.4); ctx.stroke()
  ctx.restore()

  // ── Inner deep-set well (recessed obsidian) w/ gold bezel ring ──────────
  const wellX = shaftX + shaftW*0.03
  const wellY = shaftTop
  const wellW = shaftW - shaftW*0.06
  const wellH = shaftH
  // Dark obsidian channel
  const wellG = ctx.createLinearGradient(wellX,0,wellX+wellW,0)
  wellG.addColorStop(0, '#040108'); wellG.addColorStop(0.5, '#100604'); wellG.addColorStop(1,'#040108')
  ctx.fillStyle = wellG
  rrect(ctx,wellX,wellY,wellW,wellH,R*0.5); ctx.fill()

  // Gold trim ring around the well (separates wood frame from dark well)
  const goldRingG = ctx.createLinearGradient(wellX, wellY, wellX+wellW, wellY+wellH)
  goldRingG.addColorStop(0.00, '#5a3f08')
  goldRingG.addColorStop(0.30, '#d4af37')
  goldRingG.addColorStop(0.55, '#fbe58a')
  goldRingG.addColorStop(0.80, '#8a6614')
  goldRingG.addColorStop(1.00, '#3f2c05')
  ctx.strokeStyle = goldRingG
  ctx.lineWidth = Math.max(2, shaftW*0.024)
  rrect(ctx, wellX, wellY, wellW, wellH, R*0.5); ctx.stroke()

  // Recessed shadow just inside the gold ring
  ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = 1
  rrect(ctx, wellX + ctx.lineWidth + Math.max(2, shaftW*0.024)*0.5,
             wellY + ctx.lineWidth + Math.max(2, shaftW*0.024)*0.5,
             wellW - (ctx.lineWidth + Math.max(2, shaftW*0.024)),
             wellH - (ctx.lineWidth + Math.max(2, shaftW*0.024)), R*0.5)
  ctx.stroke()

  // Beveled edge shadow inside
  const shadG = ctx.createLinearGradient(0,wellY,0,wellY+wellH*0.18)
  shadG.addColorStop(0,'rgba(0,0,0,0.6)'); shadG.addColorStop(1,'rgba(0,0,0,0)')
  ctx.save(); rrect(ctx,wellX,wellY,wellW,wellH,R*0.55); ctx.clip()
  ctx.fillStyle = shadG; ctx.fillRect(wellX,wellY,wellW,wellH*0.2)
  ctx.restore()

  // ── Filigree bezel motifs — small rivets/gems along the frame ─────────────
  const rivetR = Math.max(3, shaftW*0.035)
  const drawRivet = (cx,cy) => {
    const g = ctx.createRadialGradient(cx-rivetR*0.3, cy-rivetR*0.3, 0, cx, cy, rivetR)
    g.addColorStop(0,'#fff6c8'); g.addColorStop(0.4,'#e6b73a'); g.addColorStop(1,'#6a4a0a')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(cx,cy,rivetR,0,Math.PI*2); ctx.fill()
    ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=1
    ctx.beginPath(); ctx.arc(cx,cy,rivetR,0,Math.PI*2); ctx.stroke()
  }
  const insetX = outerX + bezel*0.5, insetY = outerY + bezel*0.5
  const insetW = outerW - bezel, insetH = outerH - bezel
  ;[[insetX,insetY],[insetX+insetW,insetY],[insetX,insetY+insetH],[insetX+insetW,insetY+insetH]]
    .forEach(([x,y]) => drawRivet(x,y))
  // Side rivets every ~120px
  const rivetGap = Math.max(60, shaftH/6)
  for (let y = insetY + rivetGap; y < insetY + insetH - rivetGap*0.4; y += rivetGap) {
    drawRivet(insetX, y); drawRivet(insetX + insetW, y)
  }

  // ── Crown finial atop the frame ────────────────────────────────────────────
  const crownCx = shaftX + shaftW/2
  const crownY  = outerY - bezel*0.15
  ctx.save()
  const crownGoldG = ctx.createLinearGradient(crownCx - bezel*0.5, crownY, crownCx + bezel*0.5, crownY)
  crownGoldG.addColorStop(0.0, '#5a3f08')
  crownGoldG.addColorStop(0.4, '#d4af37')
  crownGoldG.addColorStop(0.6, '#fbe58a')
  crownGoldG.addColorStop(1.0, '#5a3f08')
  ctx.fillStyle = crownGoldG
  ctx.beginPath()
  ctx.moveTo(crownCx, crownY - bezel*0.9)
  ctx.lineTo(crownCx - bezel*0.5, crownY + 2)
  ctx.lineTo(crownCx + bezel*0.5, crownY + 2)
  ctx.closePath(); ctx.fill()
  // Gem in crown
  const gemR = bezel*0.28
  const gemG = ctx.createRadialGradient(crownCx - gemR*0.3, crownY - bezel*0.35, 0, crownCx, crownY - bezel*0.3, gemR)
  gemG.addColorStop(0,'#ffffff'); gemG.addColorStop(0.35,'#ff3b3b'); gemG.addColorStop(1,'#4a0000')
  ctx.fillStyle = gemG
  ctx.beginPath(); ctx.arc(crownCx, crownY - bezel*0.3, gemR, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle='#4a2500'; ctx.lineWidth=1.5
  ctx.stroke()
  ctx.restore()

  // Slot dividers inside the well (thin engraved gold lines)
  for(let i=1;i<NUM_SLOTS;i++){
    const ly = slotY(i) - slotH*0.42
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(wellX+3, ly+1, wellW-6, 1.5)
    ctx.fillStyle='rgba(255,215,120,0.35)'; ctx.fillRect(wellX+3, ly-0.5, wellW-6, 1)
  }

  // Very subtle warm ambient glow (was creating a shiny diagonal sheen).
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  const sheen = ctx.createLinearGradient(outerX, outerY, outerX+outerW*0.6, outerY+outerH*0.6)
  sheen.addColorStop(0,'rgba(255,150,60,0)')
  sheen.addColorStop(0.5,'rgba(255,150,60,0.03)')
  sheen.addColorStop(1,'rgba(255,150,60,0)')
  ctx.fillStyle = sheen
  rrect(ctx,outerX,outerY,outerW,outerH,R*1.4); ctx.fill()
  ctx.restore()
}

// ══════════════════════════════════════════════════════════════════════════════
// TOTEM GATE — detailed carved wood face
// ══════════════════════════════════════════════════════════════════════════════
function drawTotemGate(ctx,W,H,layout,elapsed){
  const{shaftX,shaftW,shaftTop}=layout
  const cx=shaftX+shaftW/2, gW=shaftW*2.2, gH=shaftTop*0.95
  const gX=cx-gW/2, gTop=shaftTop*0.02
  const eyePulse=0.80+Math.sin(elapsed*3)*0.20

  ctx.save(); ctx.shadowColor='rgba(0,0,0,0.35)'; ctx.shadowBlur=6; ctx.shadowOffsetY=4

  const hG=ctx.createLinearGradient(gX,gTop,gX+gW,gTop+gH)
  hG.addColorStop(0,'#3a1e0a'); hG.addColorStop(0.25,'#6b3d1c'); hG.addColorStop(0.5,'#8a5228'); hG.addColorStop(0.75,'#5c3318'); hG.addColorStop(1,'#2a1208')
  ctx.fillStyle=hG; rrect(ctx,gX,gTop,gW,gH,gW*0.1); ctx.fill()

  // Carved wood edge highlight
  ctx.strokeStyle='rgba(212,175,55,0.55)'; ctx.lineWidth=gW*0.022
  rrect(ctx,gX+1,gTop+1,gW-2,gH-2,gW*0.1); ctx.stroke()
  ctx.restore()

  // Dark interior channel — lighter than before
  ctx.fillStyle='#1e0d05'; rrect(ctx,gX+gW*0.08,gTop+gH*0.08,gW*0.84,gH*0.8,gW*0.06); ctx.fill()
  // Top bevel highlight
  ctx.fillStyle='rgba(255,220,120,0.18)'; rrect(ctx,gX,gTop,gW,gH*0.04,gW*0.1); ctx.fill()

  const eyeR=gW*0.11, eyeY=gTop+gH*0.4
  ;[cx-gW*0.25, cx+gW*0.25].forEach(ex=>{
    ctx.save(); ctx.shadowColor=`rgba(255,50,0,${0.9*eyePulse})`; ctx.shadowBlur=25
    ctx.fillStyle='#ffaa00'; ctx.beginPath(); ctx.arc(ex,eyeY,eyeR,0,Math.PI*2); ctx.fill()
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(ex-eyeR*0.2,eyeY-eyeR*0.2,eyeR*0.3,0,Math.PI*2); ctx.fill()
    ctx.restore()
    ctx.fillStyle='#333'; ctx.beginPath()
    ctx.moveTo(ex-eyeR*1.5,eyeY-eyeR*1.5); ctx.lineTo(ex+eyeR*1.5,eyeY-eyeR*0.5)
    ctx.lineTo(ex+eyeR*1.5,eyeY-eyeR*1.5); ctx.fill()
  })

  const tY=gTop+gH*0.7, tW=gW*0.6, tH=gH*0.2
  ctx.fillStyle='#111'; rrect(ctx,cx-tW/2,tY,tW,tH,5); ctx.fill()
  ctx.fillStyle='#ffcc00'
  for(let i=0;i<5;i++){ctx.fillRect(cx-tW/2+tW*0.05+i*tW*0.19, tY, tW*0.14, tH*0.6)}
}

// ══════════════════════════════════════════════════════════════════════════════
// SCORE STONES — photorealistic granite with weathering
// ══════════════════════════════════════════════════════════════════════════════
// Score coins — polished gold-rimmed obsidian discs w/ engraved gold numerals
function drawScoreStones(ctx,W,H,layout,stonePositions){
  const{stoneR}=layout
  const rW=stoneR*1.35, rH=stoneR*1.35

  stonePositions.forEach(({n,x,y})=>{
    ctx.save()
    // Deep ground shadow
    ctx.fillStyle='rgba(0,0,0,0.55)'
    ctx.beginPath(); ctx.ellipse(x, y+rH*0.4, rW*1.05, rH*0.35, 0, 0, Math.PI*2); ctx.fill()

    // Coin body — dark polished obsidian
    ctx.shadowColor='rgba(0,0,0,0.7)'; ctx.shadowBlur=10; ctx.shadowOffsetY=4
    const bodyG = ctx.createRadialGradient(x - rW*0.35, y - rH*0.35, rH*0.1, x, y, rW*1.1)
    bodyG.addColorStop(0.00, '#3a3428')
    bodyG.addColorStop(0.45, '#1a140a')
    bodyG.addColorStop(1.00, '#050300')
    ctx.fillStyle = bodyG
    ctx.beginPath(); ctx.arc(x, y, rW, 0, Math.PI*2); ctx.fill()
    ctx.restore()

    // Outer gold rim (metallic gradient)
    ctx.save()
    const rimG = ctx.createLinearGradient(x - rW, y - rW, x + rW, y + rW)
    rimG.addColorStop(0.00, '#7a5810')
    rimG.addColorStop(0.30, '#d4af37')
    rimG.addColorStop(0.55, '#fbe58a')
    rimG.addColorStop(0.80, '#a67a10')
    rimG.addColorStop(1.00, '#3f2d05')
    ctx.strokeStyle = rimG
    ctx.lineWidth = Math.max(1.8, rW*0.16)
    ctx.beginPath(); ctx.arc(x, y, rW - ctx.lineWidth/2, 0, Math.PI*2); ctx.stroke()

    // Inner recessed shadow line
    ctx.strokeStyle='rgba(0,0,0,0.7)'; ctx.lineWidth=1
    ctx.beginPath(); ctx.arc(x, y, rW - ctx.lineWidth/2 - Math.max(1.8, rW*0.16), 0, Math.PI*2); ctx.stroke()

    // Top specular highlight arc
    ctx.strokeStyle='rgba(255,240,180,0.7)'; ctx.lineWidth = Math.max(1, rW*0.06)
    ctx.beginPath(); ctx.arc(x, y, rW - Math.max(1.8, rW*0.16)*0.55, Math.PI*1.1, Math.PI*1.85); ctx.stroke()
    ctx.restore()

    // Engraved gold numeral
    const fs = Math.round(rH * 1.05)
    ctx.textAlign='center'; ctx.textBaseline='middle'
    ctx.font = `900 ${fs}px "Cinzel Decorative", "Georgia", serif`

    // Deep shadow underneath
    ctx.fillStyle = 'rgba(0,0,0,0.85)'
    ctx.fillText(n.toString(), x + 1, y + 2)

    // Gold gradient fill on the numeral
    const numG = ctx.createLinearGradient(x, y - rH*0.6, x, y + rH*0.6)
    numG.addColorStop(0.00, '#fff2b8')
    numG.addColorStop(0.50, '#d4af37')
    numG.addColorStop(1.00, '#7a5810')
    ctx.fillStyle = numG
    ctx.fillText(n.toString(), x, y)

    // Sharp highlight edge on top of the numeral
    ctx.save()
    ctx.globalAlpha = 0.55
    ctx.fillStyle = '#fff8dc'
    ctx.fillText(n.toString(), x, y - 1)
    ctx.restore()
  })
}

// ══════════════════════════════════════════════════════════════════════════════
// TORCH POSTS — realistic fire
// ══════════════════════════════════════════════════════════════════════════════
function drawTorchPosts(ctx,W,H,layout,elapsed){
  const{shaftX,shaftW,shaftTop,shaftBot}=layout
  const shaftH=shaftBot-shaftTop
  const sz=shaftW*0.085
  const lx=shaftX-sz*1.5, rx=shaftX+shaftW+sz*1.5
  const fracs=[0.07,0.26,0.47,0.68,0.87]
  ;[lx,rx].forEach((tx,si)=>fracs.forEach((f,i)=>drawTorch(ctx,tx,shaftTop+shaftH*f,sz,elapsed,i+si*5)))
}

function drawTorch(ctx,cx,baseY,sz,elapsed,idx){
  const postH=sz*4.4, pt=baseY-postH
  // Post with natural taper
  ctx.save()
  // Dirt hole/shadow at the base
  ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.ellipse(cx, baseY, sz*0.4, sz*0.15, 0, 0, Math.PI*2); ctx.fill()

  ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=8; ctx.shadowOffsetX=3
  const pG=ctx.createLinearGradient(cx-sz*0.22,0,cx+sz*0.22,0)
  pG.addColorStop(0,'#1a0d05'); pG.addColorStop(0.25,'#402210'); pG.addColorStop(0.5,'#5c3218'); pG.addColorStop(0.75,'#2e180b'); pG.addColorStop(1,'#0d0602')
  ctx.fillStyle=pG
  ctx.beginPath()
  ctx.moveTo(cx-sz*0.22,baseY); ctx.lineTo(cx+sz*0.22,baseY)
  ctx.lineTo(cx+sz*0.11,pt+sz*0.6); ctx.lineTo(cx-sz*0.11,pt+sz*0.6); ctx.closePath(); ctx.fill()
  
  // Diagonal rope wraps
  ctx.strokeStyle='#d4b37d'; ctx.lineWidth=sz*0.06
  for(let i=1;i<6;i++){
    const ry=baseY-(postH*i/6)
    ctx.beginPath(); ctx.moveTo(cx-sz*0.18+sz*0.015*i, ry+sz*0.08); ctx.lineTo(cx+sz*0.18-sz*0.015*i, ry-sz*0.08); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx-sz*0.18+sz*0.015*i, ry-sz*0.08); ctx.lineTo(cx+sz*0.18-sz*0.015*i, ry+sz*0.08); ctx.stroke()
  }
  ctx.restore()

  // Iron bracket cup
  ctx.save(); ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=6; ctx.shadowOffsetY=3
  const cG=ctx.createLinearGradient(cx-sz*0.4,0,cx+sz*0.4,0)
  cG.addColorStop(0,'#111'); cG.addColorStop(0.3,'#444'); cG.addColorStop(0.7,'#222'); cG.addColorStop(1,'#000')
  ctx.fillStyle=cG
  ctx.beginPath()
  ctx.moveTo(cx-sz*0.38,pt+sz*0.6); ctx.lineTo(cx+sz*0.38,pt+sz*0.6)
  ctx.lineTo(cx+sz*0.26,pt+sz*0.15); ctx.lineTo(cx-sz*0.26,pt+sz*0.15); ctx.closePath(); ctx.fill()
  
  // Rivets on the bracket
  ctx.fillStyle='#888'
  ctx.beginPath(); ctx.arc(cx-sz*0.2, pt+sz*0.4, sz*0.05, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx+sz*0.2, pt+sz*0.4, sz*0.05, 0, Math.PI*2); ctx.fill()
  
  // Cup rim ring
  ctx.strokeStyle='#222'; ctx.lineWidth=sz*0.08
  ctx.beginPath(); ctx.moveTo(cx-sz*0.4,pt+sz*0.6); ctx.lineTo(cx+sz*0.4,pt+sz*0.6); ctx.stroke()
  ctx.strokeStyle='#666'; ctx.lineWidth=sz*0.03
  ctx.beginPath(); ctx.moveTo(cx-sz*0.4,pt+sz*0.56); ctx.lineTo(cx+sz*0.4,pt+sz*0.56); ctx.stroke()
  ctx.restore()

  // Fire — multi-layer physically-inspired
  const f1=Math.sin(elapsed*3.4+idx*1.1)*0.14+1.0
  const f2=Math.sin(elapsed*5.2+idx*0.8)*0.09
  const f3=Math.sin(elapsed*7.8+idx*1.4)*0.055
  const tipY=pt-sz*1.65*f1, tipX=cx+f2*sz+f3*sz*0.5

  // Outer flame (large, orange-red)
  ctx.save(); ctx.globalAlpha=0.75
  const fo=ctx.createRadialGradient(tipX,tipY,0,cx,pt+sz*0.15,sz*0.80*f1)
  fo.addColorStop(0,'rgba(255,245,180,0.95)'); fo.addColorStop(0.15,'rgba(255,200,50,0.9)')
  fo.addColorStop(0.40,'rgba(255,110,0,0.8)'); fo.addColorStop(0.70,'rgba(220,30,0,0.5)')
  fo.addColorStop(1,'rgba(200,20,0,0)')
  ctx.fillStyle=fo
  ctx.beginPath()
  ctx.moveTo(cx-sz*0.40,pt+sz*0.24)
  ctx.bezierCurveTo(cx-sz*0.28,pt-sz*0.6*f1,tipX-sz*0.06,tipY+sz*0.3,tipX,tipY)
  ctx.bezierCurveTo(tipX+sz*0.06,tipY+sz*0.3,cx+sz*0.28,pt-sz*0.6*f1,cx+sz*0.40,pt+sz*0.24)
  ctx.closePath(); ctx.fill()
  ctx.restore()

  // Middle flame (yellow)
  ctx.save(); ctx.globalAlpha=0.85
  const fm=ctx.createRadialGradient(cx+f2*sz*0.5,pt,0,cx,pt+sz*0.08,sz*0.42*f1)
  fm.addColorStop(0,'rgba(255,255,220,1)'); fm.addColorStop(0.3,'rgba(255,220,60,0.95)')
  fm.addColorStop(0.7,'rgba(255,140,0,0.7)'); fm.addColorStop(1,'rgba(255,80,0,0)')
  ctx.fillStyle=fm
  ctx.beginPath()
  ctx.moveTo(cx-sz*0.22,pt+sz*0.22)
  ctx.bezierCurveTo(cx-sz*0.14,pt-sz*0.5*f1,cx+f2*sz*0.5,pt-sz*0.9*f1,cx+f2*sz,tipY+sz*0.5)
  ctx.bezierCurveTo(cx+f2*sz+sz*0.04,tipY+sz*0.5,cx+sz*0.14,pt-sz*0.5*f1,cx+sz*0.22,pt+sz*0.22)
  ctx.closePath(); ctx.fill()
  ctx.restore()

  // Inner core (white-hot)
  ctx.save(); ctx.globalAlpha=0.92
  const fi=ctx.createRadialGradient(cx,pt,0,cx,pt+sz*0.06,sz*0.25)
  fi.addColorStop(0,'rgba(255,255,255,1)'); fi.addColorStop(0.5,'rgba(255,250,200,0.8)'); fi.addColorStop(1,'rgba(255,200,50,0)')
  ctx.fillStyle=fi; ctx.beginPath(); ctx.arc(cx,pt+sz*0.04,sz*0.25,0,Math.PI*2); ctx.fill()
  ctx.restore()

  // Ground glow
  ctx.save(); ctx.globalAlpha=0.12+f1*0.04
  const fg=ctx.createRadialGradient(cx,pt+sz*0.3,0,cx,pt+sz*0.3,sz*1.4)
  fg.addColorStop(0,'#ff8800'); fg.addColorStop(1,'rgba(255,80,0,0)')
  ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(cx,pt+sz*0.3,sz*1.4,0,Math.PI*2); ctx.fill()
  ctx.restore()
}

// ══════════════════════════════════════════════════════════════════════════════
// TIKI PIECES — chunky painted-block tikis matching the physical board game.
// Solid saturated color body, bold black carved face filling the block,
// beveled 3D edges + strong cast shadow. Each piece a distinct wooden totem.
// ══════════════════════════════════════════════════════════════════════════════
function drawTiki(ctx,cx,cy,w,h,tikId,data,opts){
  const{highlight=0,hovered=false,offsetY=0,angle=0,opacity=1,scale=1}=opts
  const{color,shade,light}=data

  ctx.save()
  ctx.globalAlpha=opacity
  ctx.translate(cx,cy+offsetY)
  ctx.rotate(angle)
  ctx.scale(scale,scale)

  const rx = w/2, ry = h/2
  // Near-square painted wooden block w/ small rounded corners (matches the
  // physical reference: slight bevel, not pill). Stacks cleanly into one
  // continuous totem column.
  const R  = Math.min(w, h) * 0.12
  const blockPath = () => rrect(ctx, -rx, -ry, w, h, R)

  // ── Deep cast shadow ─────────────────────────────────────────────────────
  ctx.save()
  ctx.shadowColor='rgba(0,0,0,0.85)'; ctx.shadowBlur=22; ctx.shadowOffsetY=14
  ctx.fillStyle='#000'
  blockPath(); ctx.fill()
  ctx.restore()

  // ── Painted body w/ layered shading — reads as a real 3D block ──────────
  ctx.save(); blockPath(); ctx.clip()

  // 1. Vertical body gradient — sky-lit top, shadow bottom
  const bodyG = ctx.createLinearGradient(0, -ry, 0, ry)
  bodyG.addColorStop(0.00, shadeHex(light, 25))
  bodyG.addColorStop(0.20, color)
  bodyG.addColorStop(0.75, color)
  bodyG.addColorStop(1.00, shadeHex(shade, -40))
  ctx.fillStyle = bodyG
  ctx.fillRect(-rx, -ry, w, h)

  // 2. Cylindrical horizontal shading — key-light from top-left
  const sideG = ctx.createLinearGradient(-rx, 0, rx, 0)
  sideG.addColorStop(0.00, 'rgba(255,255,255,0.32)')
  sideG.addColorStop(0.22, 'rgba(255,255,255,0.05)')
  sideG.addColorStop(0.70, 'rgba(0,0,0,0)')
  sideG.addColorStop(1.00, 'rgba(0,0,0,0.42)')
  ctx.fillStyle = sideG
  ctx.fillRect(-rx, -ry, w, h)

  // 3. Sharp top specular stripe — glossy paint highlight
  const topG = ctx.createLinearGradient(0, -ry, 0, -ry + h*0.20)
  topG.addColorStop(0.0, 'rgba(255,255,255,0.55)')
  topG.addColorStop(0.4, 'rgba(255,255,255,0.15)')
  topG.addColorStop(1.0, 'rgba(255,255,255,0)')
  ctx.fillStyle = topG
  ctx.fillRect(-rx, -ry, w, h*0.20)

  // 4. Bottom self-shadow (grounds the block, sells depth)
  const botG = ctx.createLinearGradient(0, ry - h*0.28, 0, ry)
  botG.addColorStop(0, 'rgba(0,0,0,0)')
  botG.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = botG
  ctx.fillRect(-rx, ry - h*0.28, w, h*0.28)

  // 5. Ambient-occlusion vignette in the 4 inner corners (fake AO)
  const corner = Math.min(w, h) * 0.28
  ;[[-rx, -ry], [rx, -ry], [-rx, ry], [rx, ry]].forEach(([px, py]) => {
    const ao = ctx.createRadialGradient(px, py, 0, px, py, corner)
    ao.addColorStop(0, 'rgba(0,0,0,0.35)')
    ao.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = ao
    ctx.fillRect(-rx, -ry, w, h)
  })
  ctx.restore()

  // Cast shadow BELOW the block on the frame well (real 3D contact shadow)
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.42)'
  ctx.beginPath()
  ctx.ellipse(0, ry + h*0.08, rx * 0.85, h * 0.06, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // ── Bold carved tiki face — fills 90% of block, monochrome ──────────────
  // Face helpers draw with CARVE (rgba(0,0,0,0.92)); scale up so features
  // read at a glance and match the reference photo's bold silkscreen carvings.
  ctx.save(); blockPath(); ctx.clip()
  drawTikiFace(ctx, 0, 0, w * 0.90, h * 1.10, tikId)
  ctx.restore()

  // ── Thick painted black border (silkscreen outline) ─────────────────────
  ctx.strokeStyle = 'rgba(0,0,0,0.95)'
  ctx.lineWidth = Math.max(2, w * 0.055)
  blockPath(); ctx.stroke()

  // ── Selection / hover states ──────────────────────────────────────────
  if (highlight > 0) {
    ctx.save()
    ctx.shadowColor = light; ctx.shadowBlur = 24 + highlight * 16
    ctx.strokeStyle = light; ctx.lineWidth = Math.max(2, w * 0.06)
    rrect(ctx, -rx - w*0.035, -ry - h*0.035, w * 1.07, h * 1.07, R * 1.2)
    ctx.stroke()
    ctx.restore()
  }
  if (hovered) {
    ctx.save()
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, w * 0.04)
    rrect(ctx, -rx - w*0.05, -ry - h*0.05, w * 1.10, h * 1.10, R * 1.3)
    ctx.stroke()
    ctx.restore()
  }

  ctx.restore()
}

function drawTikiFace(ctx,cx,cy,w,h,tikId){
  const s=Math.min(w,h)*0.08
  ctx.strokeStyle='rgba(0,0,0,0.9)'; ctx.fillStyle='rgba(0,0,0,0.9)'

  // Each tiki gets a headwear layer, brow accent, ears + jawline in addition
  // to the base mask features so the carving reads as a full 3D totem head.
  const faces={
    hookipa:()=>{
      fHairFeathers(ctx,cx,cy,w,h)
      fBand(ctx,cx,cy,w,h,s); fEyebrows(ctx,cx,cy,w,h)
      fOvalEyes(ctx,cx,cy,w,h,s,1.6,1.0)
      fNoseTri(ctx,cx,cy,s); fNostrils(ctx,cx,cy,s)
      fSmile(ctx,cx,cy,w,h,s); fChinDots(ctx,cx,cy,w,h,s,3)
      fEars(ctx,cx,cy,w,h); fJawline(ctx,cx,cy,w,h)
    },
    lani:   ()=>{
      fHairBraids(ctx,cx,cy,w,h)
      fBand(ctx,cx,cy,w,h,s); fEyebrows(ctx,cx,cy,w,h)
      fSpiralEyes(ctx,cx,cy,w,h,s)
      fNoseDia(ctx,cx,cy,s); fNostrils(ctx,cx,cy,s)
      fTeeth(ctx,cx,cy,w,h,s); fSideSlash(ctx,cx,cy,w,h,s)
      fEars(ctx,cx,cy,w,h)
    },
    kai:    ()=>{
      fHairSpikes(ctx,cx,cy,w,h)
      fAngryBrow(ctx,cx,cy,w,h,s)
      fSquareEyes(ctx,cx,cy,w,h,s)
      fNoseTri(ctx,cx,cy,s); fNostrils(ctx,cx,cy,s)
      fFrown(ctx,cx,cy,w,h,s); fChinLines(ctx,cx,cy,w,h,s)
      fEars(ctx,cx,cy,w,h); fJawline(ctx,cx,cy,w,h)
    },
    malu:   ()=>{
      fHairFeathers(ctx,cx,cy,w,h)
      fBand(ctx,cx,cy,w,h,s); fEyebrows(ctx,cx,cy,w,h)
      fOvalEyes(ctx,cx,cy,w,h,s,1.8,1.2)
      fNoseDots(ctx,cx,cy,s)
      fNeutral(ctx,cx,cy,w,h,s); fCheekDots(ctx,cx,cy,w,h,s)
      fEars(ctx,cx,cy,w,h)
    },
    nalu:   ()=>{
      fHairSpikes(ctx,cx,cy,w,h)
      fBand(ctx,cx,cy,w,h,s); fEyebrows(ctx,cx,cy,w,h)
      fRectEyes(ctx,cx,cy,w,h,s)
      fNoseTri(ctx,cx,cy,s); fNostrils(ctx,cx,cy,s)
      fTeeth(ctx,cx,cy,w,h,s); fForehead(ctx,cx,cy,w,h,s)
      fEars(ctx,cx,cy,w,h); fJawline(ctx,cx,cy,w,h)
    },
    pele:   ()=>{
      fHairSpikes(ctx,cx,cy,w,h)
      fAngryBrow(ctx,cx,cy,w,h,s)
      fRoundEyes(ctx,cx,cy,w,h,s,1.35)
      fNoseTri(ctx,cx,cy,s); fNostrils(ctx,cx,cy,s)
      fFrown(ctx,cx,cy,w,h,s); fChinDots(ctx,cx,cy,w,h,s,2)
      fEars(ctx,cx,cy,w,h); fJawline(ctx,cx,cy,w,h)
    },
    honu:   ()=>{
      fHairBraids(ctx,cx,cy,w,h)
      fBand(ctx,cx,cy,w,h,s); fEyebrows(ctx,cx,cy,w,h)
      fSpiralEyes(ctx,cx,cy,w,h,s)
      fNoseDots(ctx,cx,cy,s)
      fSmile(ctx,cx,cy,w,h,s); fChinLines(ctx,cx,cy,w,h,s)
      fEars(ctx,cx,cy,w,h); fJawline(ctx,cx,cy,w,h)
    },
    mana:   ()=>{
      fHairFeathers(ctx,cx,cy,w,h)
      fBand(ctx,cx,cy,w,h,s); fEyebrows(ctx,cx,cy,w,h)
      fRoundEyes(ctx,cx,cy,w,h,s,1.25)
      fNoseTri(ctx,cx,cy,s); fNostrils(ctx,cx,cy,s)
      fNeutral(ctx,cx,cy,w,h,s); fSideSlash(ctx,cx,cy,w,h,s)
      fEars(ctx,cx,cy,w,h)
    },
    koa:    ()=>{
      fHairSpikes(ctx,cx,cy,w,h)
      fAngryBrow(ctx,cx,cy,w,h,s)
      fOvalEyes(ctx,cx,cy,w,h,s,1.5,0.95)
      fNoseDia(ctx,cx,cy,s); fNostrils(ctx,cx,cy,s)
      fTeeth(ctx,cx,cy,w,h,s); fForehead(ctx,cx,cy,w,h,s)
      fEars(ctx,cx,cy,w,h); fJawline(ctx,cx,cy,w,h)
    },
  }
  ;(faces[tikId]||faces.mana)()
}
// ── Bold tribal totem-carving primitives — chunky, angular, high-contrast ───
// Big geometry to match the physical reference blocks: jagged brows spanning
// full width, chunky tooth rows, angular noses, radiating tribal marks.
const CARVE    = 'rgba(0,0,0,0.95)'
const CARVE_LT = 'rgba(0,0,0,0.65)'

function fBand(c,cx,cy,w,h,s){
  // Thicker tribal forehead band w/ triangular notches
  c.fillStyle=CARVE
  c.fillRect(cx-w*.44, cy-h*.40, w*.88, h*.09)
  // Triangular teeth hanging below the band
  for(let i=-3;i<=3;i++){
    c.beginPath()
    c.moveTo(cx+i*w*.13, cy-h*.31)
    c.lineTo(cx+i*w*.13+w*.055, cy-h*.31)
    c.lineTo(cx+i*w*.13+w*.028, cy-h*.24)
    c.closePath(); c.fill()
  }
}
function fAngryBrow(c,cx,cy,w,h,s){
  // Chunky jagged single unibrow spanning full width
  c.fillStyle=CARVE
  c.beginPath()
  c.moveTo(cx-w*.44, cy-h*.22)
  c.lineTo(cx-w*.10, cy-h*.32)
  c.lineTo(cx,       cy-h*.15)
  c.lineTo(cx+w*.10, cy-h*.32)
  c.lineTo(cx+w*.44, cy-h*.22)
  c.lineTo(cx+w*.44, cy-h*.14)
  c.lineTo(cx-w*.44, cy-h*.14)
  c.closePath(); c.fill()
}
function fRoundEyes(c,cx,cy,w,h,s,r){
  const ey=cy-h*0.02
  ;[cx-w*.24, cx+w*.24].forEach(ex=>{
    c.fillStyle=CARVE
    c.beginPath(); c.arc(ex,ey, s*r*1.7, 0, Math.PI*2); c.fill()
    // Center pupil dot
    c.fillStyle='rgba(255,255,255,0.15)'
    c.beginPath(); c.arc(ex-s*r*0.35, ey-s*r*0.35, s*r*0.35, 0, Math.PI*2); c.fill()
  })
}
function fOvalEyes(c,cx,cy,w,h,s,rw,rh){
  const ey=cy-h*0.02
  ;[cx-w*.24, cx+w*.24].forEach(ex=>{
    c.fillStyle=CARVE
    c.beginPath(); c.ellipse(ex, ey, s*rw*1.6, s*rh*1.7, 0, 0, Math.PI*2); c.fill()
  })
}
function fSpiralEyes(c,cx,cy,w,h,s){
  const ey=cy-h*0.02
  ;[cx-w*.24, cx+w*.24].forEach(ex=>{
    c.fillStyle=CARVE
    c.beginPath(); c.arc(ex, ey, s*2.1, 0, Math.PI*2); c.fill()
    c.fillStyle='rgba(255,255,255,0.15)'
    c.beginPath(); c.arc(ex, ey, s*0.65, 0, Math.PI*2); c.fill()
  })
}
function fSquareEyes(c,cx,cy,w,h,s){
  const ey=cy-h*0.02
  ;[cx-w*.30, cx+w*.05].forEach(ex=>{
    c.fillStyle=CARVE
    c.fillRect(ex, ey - s*1.5, s*3.0, s*3.0)
  })
}
function fRectEyes(c,cx,cy,w,h,s){
  const ey=cy-h*0.02
  ;[cx-w*.30, cx+w*.05].forEach(ex=>{
    c.fillStyle=CARVE
    c.fillRect(ex, ey - s*1.0, s*3.0, s*2.0)
  })
}
function fNoseTri(c,cx,cy,s){
  c.fillStyle=CARVE
  c.beginPath()
  c.moveTo(cx-s*1.4, cy+s*0.6)
  c.lineTo(cx,       cy+s*2.6)
  c.lineTo(cx+s*1.4, cy+s*0.6)
  c.closePath(); c.fill()
}
function fNoseDia(c,cx,cy,s){
  c.fillStyle=CARVE
  c.beginPath()
  c.moveTo(cx,       cy-s*0.4)
  c.lineTo(cx+s*1.1, cy+s*1.1)
  c.lineTo(cx,       cy+s*2.6)
  c.lineTo(cx-s*1.1, cy+s*1.1)
  c.closePath(); c.fill()
}
function fNoseDots(c,cx,cy,s){
  c.fillStyle=CARVE
  ;[cx-s*0.7, cx+s*0.7].forEach(nx=>{
    c.beginPath(); c.arc(nx, cy+s*1.2, s*0.75, 0, Math.PI*2); c.fill()
  })
}
function fSmile(c,cx,cy,w,h,s){
  // Chunky grinning mouth w/ visible teeth
  c.fillStyle=CARVE
  const my = cy+h*.20
  c.beginPath()
  c.arc(cx, my - s*0.5, w*.32, Math.PI*0.15, Math.PI*0.85); c.fill()
  // Tooth notches
  c.fillStyle='rgba(255,255,255,0.10)'
  for(let i=0;i<5;i++) c.fillRect(cx-w*.20+i*w*.10, my+s*0.1, 1.2, s*1.4)
}
function fFrown(c,cx,cy,w,h,s){
  c.lineWidth=s*1.8; c.lineCap='round'; c.strokeStyle=CARVE
  const my = cy+h*.22
  c.beginPath()
  c.arc(cx, my - s*1.4, w*.28, Math.PI*0.15, Math.PI*0.85)
  c.stroke()
}
function fNeutral(c,cx,cy,w,h,s){
  c.fillStyle=CARVE
  c.fillRect(cx-w*.26, cy+h*.16, w*.52, s*0.8)
}
function fTeeth(c,cx,cy,w,h,s){
  // Wide tooth bar w/ chunky individual teeth
  const my = cy+h*.16
  c.fillStyle=CARVE
  c.fillRect(cx-w*.32, my, w*.64, s*2.0)
  // Tooth divisions
  c.fillStyle='rgba(255,255,255,0.14)'
  for(let i=1;i<5;i++) c.fillRect(cx-w*.32 + i*(w*.64/5), my, 1.5, s*2.0)
}
function fChinDots(c,cx,cy,w,h,s,n){
  const dy=cy+h*.36, sp=w*.14
  c.fillStyle=CARVE
  for(let i=0;i<n;i++){
    const dx=cx+(i-(n-1)/2)*sp
    c.beginPath(); c.arc(dx, dy, s*.6, 0, Math.PI*2); c.fill()
  }
}
function fChinLines(c,cx,cy,w,h,s){
  c.lineWidth=s*1.2; c.lineCap='round'; c.strokeStyle=CARVE
  ;[-w*.20, -w*.07, w*.07, w*.20].forEach(dx=>{
    c.beginPath(); c.moveTo(cx+dx, cy+h*.28); c.lineTo(cx+dx, cy+h*.44); c.stroke()
  })
}
function fSideSlash(c,cx,cy,w,h,s){
  // Radiating tribal marks on both sides
  c.lineWidth=s*1.3; c.lineCap='round'; c.strokeStyle=CARVE
  ;[-1,1].forEach(side=>{
    const sx = cx + side*w*.44
    for(let i=-1;i<=1;i++){
      c.beginPath()
      c.moveTo(sx, cy + i*h*.14)
      c.lineTo(sx - side*w*.10, cy + i*h*.14)
      c.stroke()
    }
  })
}
function fCheekDots(c,cx,cy,w,h,s){
  c.fillStyle=CARVE_LT
  ;[-1,1].forEach(side=>{
    for(let i=0;i<3;i++){
      c.beginPath()
      c.arc(cx+side*w*.38, cy + (i-1)*s*1.2, s*.55, 0, Math.PI*2); c.fill()
    }
  })
}
function fForehead(c,cx,cy,w,h,s){
  // Sharper tribal arrow motif
  c.fillStyle=CARVE
  c.beginPath()
  c.moveTo(cx,       cy-h*.42)
  c.lineTo(cx-s*1.1, cy-h*.28)
  c.lineTo(cx-s*0.4, cy-h*.28)
  c.lineTo(cx,       cy-h*.18)
  c.lineTo(cx+s*0.4, cy-h*.28)
  c.lineTo(cx+s*1.1, cy-h*.28)
  c.closePath(); c.fill()
}

// ── Extra ornament primitives for richer carved-mask detail ──────────────
// Each tiki wires in one hair style + one ear detail + eyebrows / nostrils
// so faces read as full carved masks not just line drawings.

function fHairSpikes(c,cx,cy,w,h){
  // 5 tribal spike-crown fangs jutting from the top
  c.fillStyle = CARVE
  const spikeCount = 5
  const totalW = w * 0.7
  for (let i = 0; i < spikeCount; i++) {
    const t  = i / (spikeCount - 1)
    const sx = cx - totalW/2 + t * totalW
    const spikeH = h * (0.18 + Math.sin(t * Math.PI) * 0.10)
    c.beginPath()
    c.moveTo(sx - w*0.06, cy - h*0.44)
    c.lineTo(sx,          cy - h*0.44 - spikeH)
    c.lineTo(sx + w*0.06, cy - h*0.44)
    c.closePath(); c.fill()
  }
}
function fHairFeathers(c,cx,cy,w,h){
  // Fanned feather crown — 3 curved feathers on top
  c.strokeStyle = CARVE; c.lineWidth = Math.max(1.4, w*0.03); c.lineCap='round'
  ;[-1, 0, 1].forEach(side => {
    c.beginPath()
    const rootX = cx + side * w * 0.14
    c.moveTo(rootX, cy - h*0.40)
    c.quadraticCurveTo(rootX + side * w*0.12, cy - h*0.52,
                       rootX + side * w*0.06, cy - h*0.62)
    c.stroke()
    // Feather barbs
    for (let k = 0; k < 3; k++) {
      const bt = 0.35 + k*0.22
      const bx = rootX + side * w*0.08 * bt
      const by = cy - h*0.40 - h*0.22 * bt
      c.beginPath()
      c.moveTo(bx, by)
      c.lineTo(bx - side * w*0.05, by - h*0.03)
      c.stroke()
    }
  })
}
function fHairBraids(c,cx,cy,w,h){
  // Two twisted rope-braids hanging beside face
  c.strokeStyle = CARVE; c.lineWidth = Math.max(1.2, w*0.028); c.lineCap='round'
  ;[-1, 1].forEach(side => {
    const sx = cx + side * w * 0.42
    for (let i = 0; i < 4; i++) {
      const y1 = cy - h*0.28 + i * h*0.08
      const y2 = y1 + h*0.05
      c.beginPath()
      c.moveTo(sx - side * w*0.02, y1)
      c.quadraticCurveTo(sx + side * w*0.02, y1 + h*0.025, sx - side * w*0.02, y2)
      c.stroke()
    }
  })
}
function fEyebrows(c,cx,cy,w,h){
  // Furrowed brow arcs above the eyes
  c.strokeStyle = CARVE; c.lineWidth = Math.max(1.5, w*0.03); c.lineCap='round'
  ;[-1, 1].forEach(side => {
    c.beginPath()
    c.moveTo(cx + side * w*0.35, cy - h*0.20)
    c.quadraticCurveTo(cx + side * w*0.22, cy - h*0.26,
                       cx + side * w*0.11, cy - h*0.20)
    c.stroke()
  })
}
function fNostrils(c,cx,cy,s){
  // Two carved nostril slits at the base of the nose
  c.fillStyle = CARVE
  ;[-1, 1].forEach(side => {
    c.beginPath()
    c.ellipse(cx + side * s*0.4, cy + s*1.9, s*0.28, s*0.42, 0, 0, Math.PI*2)
    c.fill()
  })
}
function fEars(c,cx,cy,w,h){
  // Side ear plugs — carved circles on both cheeks (rendered edge to edge)
  c.strokeStyle = CARVE; c.lineWidth = Math.max(1.2, w*0.028)
  ;[-1, 1].forEach(side => {
    const sx = cx + side * w * 0.46
    c.beginPath(); c.arc(sx, cy - h*0.02, h*0.055, 0, Math.PI*2); c.stroke()
    // Inner dot
    c.fillStyle = CARVE
    c.beginPath(); c.arc(sx, cy - h*0.02, h*0.02, 0, Math.PI*2); c.fill()
  })
}
function fJawline(c,cx,cy,w,h){
  // Deep U jaw carving grounding the mask
  c.strokeStyle = CARVE; c.lineWidth = Math.max(1.6, w*0.035); c.lineCap='round'
  c.beginPath()
  c.moveTo(cx - w*0.30, cy + h*0.30)
  c.quadraticCurveTo(cx, cy + h*0.42, cx + w*0.30, cy + h*0.30)
  c.stroke()
}

// ── Pawn — small round painted wooden token (vintage board-piece feel) ────
function drawPawn(ctx,x,y,sz,color,label){
  ctx.save(); ctx.translate(x,y)

  // Ground shadow
  ctx.fillStyle='rgba(0,0,0,0.45)'
  ctx.beginPath(); ctx.ellipse(0, sz*0.85, sz*0.62, sz*0.14, 0, 0, Math.PI*2); ctx.fill()

  // Body — spherical wooden token
  ctx.save()
  ctx.shadowColor='rgba(0,0,0,0.7)'; ctx.shadowBlur=6; ctx.shadowOffsetY=3
  const bg = ctx.createRadialGradient(-sz*0.28, -sz*0.32, sz*0.05, 0, 0, sz)
  bg.addColorStop(0.00, shadeHex(color, 65))
  bg.addColorStop(0.35, color)
  bg.addColorStop(0.90, shadeHex(color, -35))
  bg.addColorStop(1.00, shadeHex(color, -70))
  ctx.fillStyle = bg
  ctx.beginPath(); ctx.arc(0, 0, sz*0.75, 0, Math.PI*2); ctx.fill()
  ctx.restore()

  // Dark rim
  ctx.strokeStyle = 'rgba(0,0,0,0.75)'
  ctx.lineWidth = Math.max(1, sz*0.06)
  ctx.beginPath(); ctx.arc(0, 0, sz*0.75, 0, Math.PI*2); ctx.stroke()

  // Fine gold accent ring inside dark rim
  ctx.strokeStyle = 'rgba(212,175,55,0.55)'
  ctx.lineWidth = Math.max(0.6, sz*0.025)
  ctx.beginPath(); ctx.arc(0, 0, sz*0.62, 0, Math.PI*2); ctx.stroke()

  // Top specular highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.beginPath(); ctx.ellipse(-sz*0.20, -sz*0.32, sz*0.28, sz*0.18, -0.4, 0, Math.PI*2); ctx.fill()

  // Small engraved letter
  ctx.fillStyle = 'rgba(0,0,0,0.85)'
  ctx.font = `900 ${Math.max(9, Math.round(sz*0.65))}px "Cinzel Decorative", serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText((label||'?')[0].toUpperCase(), 0.6, sz*0.05 + 0.6)
  ctx.fillStyle = 'rgba(255,240,180,0.95)'
  ctx.fillText((label||'?')[0].toUpperCase(), 0, sz*0.05)

  ctx.restore()
}

// ── START marker ──────────────────────────────────────────────────────────────
function drawStartMarker(ctx,W,H,layout){
  const{shaftX,shaftW,shaftBot}=layout
  const cx=shaftX+shaftW/2, mW=shaftW*1.28, mH=shaftW*0.30
  const mX=cx-mW/2, mY=shaftBot+H*0.014
  ctx.save(); ctx.shadowColor='rgba(0,0,0,0.45)'; ctx.shadowBlur=10; ctx.shadowOffsetY=3
  const wG=ctx.createLinearGradient(mX,mY,mX,mY+mH)
  wG.addColorStop(0,'#7a4018'); wG.addColorStop(0.5,'#9a5828'); wG.addColorStop(1,'#4a2208')
  ctx.fillStyle=wG; rrect(ctx,mX,mY,mW,mH,5); ctx.fill()
  ctx.restore()
  ctx.fillStyle='rgba(212,175,55,0.22)'; ctx.fillRect(mX+4,mY+mH*.18,mW-8,mH*.64)
  ctx.strokeStyle='#d4af37'; ctx.lineWidth=2; rrect(ctx,mX,mY,mW,mH,5); ctx.stroke()
  ctx.save(); ctx.shadowColor='rgba(0,0,0,0.7)'; ctx.shadowBlur=5
  ctx.fillStyle='#f0d060'; ctx.font=`900 ${Math.round(mH*.56)}px 'Georgia',serif`
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('START',cx,mY+mH/2)
  ctx.restore()
}

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATION HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function animateTikiMove2D(animQueue,ts,fromSlot,toSlot,layout){
  const fromY=layout.slotY(fromSlot),toY=layout.slotY(toSlot)
  const riseY=layout.shaftTop-layout.tikiH*2.4
  ts.animating=true
  animQueue.add({duration:1700,
    update:t=>{
      if(t<0.22){const e=easeOutCubic(t/0.22);ts.y=fromY+(riseY-fromY)*e;ts.angle=Math.sin(t*Math.PI*6)*.07;ts.scale=1+e*.10}
      else if(t<0.72){const e=easeInOutCubic((t-.22)/.50);ts.y=riseY+(toY-riseY)*e*.5+Math.sin(e*Math.PI)*layout.slotH*.28;ts.angle=Math.sin(t*Math.PI*8)*.05;ts.scale=1.10}
      else{const e=easeOutBounce((t-.72)/.28);ts.y=riseY+(toY-riseY)*(.5+e*.5);ts.angle=0;ts.scale=1.10-.10*((t-.72)/.28)}
    },
    onComplete:()=>{ts.y=toY;ts.slot=toSlot;ts.angle=0;ts.scale=1;ts.animating=false}
  })
}
function animateTopple2D(animQueue,ts,fromSlot,toSlot,layout){
  const fromY=layout.slotY(fromSlot),toY=layout.slotY(toSlot),riseY=layout.shaftTop-layout.tikiH*3.8
  ts.animating=true
  animQueue.add({duration:1950,
    update:t=>{
      if(t<0.28){const e=easeOutCubic(t/.28);ts.y=fromY+(riseY-fromY)*e;ts.angle=e*Math.PI*.65;ts.scale=1+e*.12}
      else if(t<0.72){const e=easeInOutCubic((t-.28)/.44);ts.y=riseY+(toY-riseY)*e;ts.angle=Math.PI*.65+e*Math.PI*3.0;ts.scale=1.12}
      else{const e=easeOutBounce((t-.72)/.28);ts.y=riseY+(toY-riseY)*Math.max(1,e);ts.y=toY;ts.angle=Math.PI*3.65*(1-(t-.72)/.28);ts.scale=1.12-.12*((t-.72)/.28)}
    },
    onComplete:()=>{ts.y=toY;ts.slot=toSlot;ts.angle=0;ts.scale=1;ts.animating=false}
  })
}
function animateToast2D(animQueue,ts,layout,onDone){
  const sy=ts.y;ts.animating=true
  animQueue.add({duration:1150,
    update:t=>{
      if(t<.18){const e=easeInCubic(t/.18);ts.scale=1-.08*e;ts.y=sy+e*layout.tikiH*.08}
      else if(t<.42){const e=easeOutCubic((t-.18)/.24);ts.scale=.92+.72*e;ts.y=sy-e*layout.tikiH*.55;ts.angle=e*.35}
      else{const e=easeInCubic((t-.42)/.58);ts.y=sy-layout.tikiH*.55-e*layout.shaftH*.55;ts.angle=.35+e*Math.PI*2.2;ts.scale=1.64*(1-e);ts.opacity=1-e}
    },
    onComplete:()=>{ts.visible=false;ts.animating=false;ts.opacity=1;onDone?.()}
  })
}
function animateParticles(animQueue,particlesRef,x,y){
  const cs=['#ff6b1a','#ffd700','#ff8c00','#ffaa00','#ff3300','#ffee44']
  const ps=[]
  for(let i=0;i<24;i++){const a=(i/24)*Math.PI*2,sp=90+Math.random()*70;ps.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-75,color:cs[i%cs.length],life:1,r:3.5+Math.random()*4})}
  particlesRef.current=[...(particlesRef.current||[]),...ps]
  animQueue.add({duration:950,
    update:t=>{ps.forEach(p=>{p.x+=p.vx*.016;p.y+=p.vy*.016;p.vy+=145*.016;p.life=1-t;p.r*=.994})},
    onComplete:()=>{particlesRef.current=(particlesRef.current||[]).filter(p=>!ps.includes(p))}
  })
}
function animatePawnToScore2D(animQueue,pawn,targetScore,stonePositions,layout){
  let tg=stonePositions.find(s=>s.n===targetScore)
  if(!tg){
    tg={x:(stonePositions[0]?.x??60)-layout.stoneR*1.8,y:(stonePositions[0]?.y??100)}
  } else {
    let dx = 0, dy = 0
    if(targetScore<=14) dx = -layout.stoneR*1.15
    else if(targetScore>=21) dx = layout.stoneR*1.15
    else dy = -layout.stoneR*1.15
    tg = {x: tg.x + dx, y: tg.y + dy}
  }
  const sx=pawn.x,sy=pawn.y;pawn.animating=true
  animQueue.add({duration:1100,
    update:t=>{const e=easeInOutCubic(t);pawn.x=sx+(tg.x-sx)*e;pawn.y=sy+(tg.y-sy)*e+Math.sin(t*Math.PI)*(-30)},
    onComplete:()=>{pawn.x=tg.x;pawn.y=tg.y;pawn.score=targetScore;pawn.animating=false}
  })
}

// ══════════════════════════════════════════════════════════════════════════════
// ATMOSPHERE — Dynamic Composite Effects
// ══════════════════════════════════════════════════════════════════════════════
function drawAtmosphere(ctx, W, H, elapsed) {
  // r3f scene handles ocean/moon/fireflies/torches. Canvas only adds a soft
  // warm torch bloom rising from the bottom to unify the play area with the
  // ambient scene behind it.
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  const flicker = Math.sin(elapsed * 7.2) * 0.04 + 0.10
  const heatG = ctx.createRadialGradient(W * 0.5, H * 1.05, 0, W * 0.5, H * 0.55, W * 0.6)
  heatG.addColorStop(0, `rgba(255, 130, 30, ${flicker})`)
  heatG.addColorStop(0.55, `rgba(200, 70, 10, ${flicker * 0.35})`)
  heatG.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = heatG
  ctx.fillRect(0, 0, W, H)
  ctx.restore()
}

// ══════════════════════════════════════════════════════════════════════════════
// BOARD SHADERS — Post-process lighting on the board column
// ══════════════════════════════════════════════════════════════════════════════
function drawBoardShaders(ctx, W, H, layout, elapsed) {
  const { shaftX, shaftW, shaftTop, shaftBot } = layout
  const shaftH = shaftBot - shaftTop
  ctx.save()

  // Gold rim glow at board top — pulses like torchlight
  const goldPulse = 0.80 + Math.sin(elapsed * 1.9) * 0.20
  ctx.globalCompositeOperation = 'screen'
  const topGlow = ctx.createLinearGradient(shaftX, shaftTop - 30, shaftX, shaftTop + 55)
  topGlow.addColorStop(0, `rgba(212, 175, 55, ${0.28 * goldPulse})`)
  topGlow.addColorStop(0.6, `rgba(180, 130, 20, ${0.08 * goldPulse})`)
  topGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = topGlow
  ctx.fillRect(shaftX - shaftW * 0.4, shaftTop - 30, shaftW * 1.8, 85)

  // Left torch rim — flickering warm light on board left edge
  const lFlicker = 0.10 + Math.sin(elapsed * 3.1 + 0.5) * 0.04
  const leftRim = ctx.createLinearGradient(shaftX - shaftW * 0.35, 0, shaftX + shaftW * 0.2, 0)
  leftRim.addColorStop(0, `rgba(255, 140, 30, ${lFlicker})`)
  leftRim.addColorStop(0.6, `rgba(255, 100, 15, ${lFlicker * 0.3})`)
  leftRim.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = leftRim
  ctx.fillRect(shaftX - shaftW * 0.35, shaftTop, shaftW * 0.55, shaftH)

  // Right torch rim — offset flicker phase
  const rFlicker = 0.10 + Math.sin(elapsed * 2.7 + 1.8) * 0.04
  const rightRim = ctx.createLinearGradient(shaftX + shaftW * 0.8, 0, shaftX + shaftW * 1.35, 0)
  rightRim.addColorStop(0, 'rgba(0, 0, 0, 0)')
  rightRim.addColorStop(0.4, `rgba(255, 100, 15, ${rFlicker * 0.3})`)
  rightRim.addColorStop(1, `rgba(255, 140, 30, ${rFlicker})`)
  ctx.fillStyle = rightRim
  ctx.fillRect(shaftX + shaftW * 0.8, shaftTop, shaftW * 0.55, shaftH)

  // Ambient occlusion at channel bottom — soft dark pooling
  ctx.globalCompositeOperation = 'multiply'
  const aoG = ctx.createLinearGradient(0, shaftBot - shaftH * 0.12, 0, shaftBot)
  aoG.addColorStop(0, 'rgba(0, 0, 0, 0)')
  aoG.addColorStop(1, 'rgba(0, 0, 0, 0.38)')
  ctx.fillStyle = aoG
  const chanPad = shaftW * 0.18
  ctx.fillRect(shaftX + chanPad, shaftBot - shaftH * 0.12, shaftW - chanPad * 2, shaftH * 0.12)

  // Subtle scanline-style channel texture (ambient occlusion between tiki slots)
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
  for (let i = 0; i < 9; i++) {
    const slotMidY = shaftTop + (shaftH / 9.6) * (i + 0.5)
    ctx.fillRect(shaftX + chanPad, slotMidY - 1, shaftW - chanPad * 2, 2)
  }

  ctx.restore()
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const TikiBoard2D = forwardRef(({
  board,boardState,validTargets=[],onTikiSelect,
  isInteractive=true,isMyTurn,selectedCard,
  onTikiClick,validTikiIds,roundNumber,players=[],
},ref)=>{
  const canvasRef=useRef(null),frameIdRef=useRef(null),startTimeRef=useRef(Date.now())
  const animQueueRef=useRef(new AnimationQueue()),layoutRef=useRef(null)
  const tikiStatesRef=useRef([]),pawnStatesRef=useRef([]),particlesRef=useRef([])
  const validIdsRef=useRef([]),hoveredIdRef=useRef(null),tikiClickCbRef=useRef(null)
  const mouseRef=useRef({x:-9999,y:-9999}),stonePositionsRef=useRef([])
  const boardPropRef=useRef([])

  const redraw=useCallback(()=>{
    const canvas=canvasRef.current;if(!canvas)return
    const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height
    const layout=layoutRef.current;if(!layout)return
    const elapsed=(Date.now()-startTimeRef.current)/1000

    ctx.clearRect(0,0,W,H)

    // r3f IslandJungleScene renders the full environment behind the canvas.
    // Only overlay the atmospheric shaders (torch bloom, cloud shadows, fireflies).
    drawAtmosphere(ctx, W, H, elapsed)

    drawScoreStones(ctx,W,H,layout,stonePositionsRef.current)
    pawnStatesRef.current.forEach(p=>drawPawn(ctx,p.x,p.y,layout.stoneR*0.85,p.color,p.label))
    
    // Draw photorealistic board asset
    if(ASSETS.board.complete && ASSETS.board.naturalWidth > 0){
      ctx.drawImage(ASSETS.board, layout.shaftX - layout.shaftW*0.35, layout.shaftTop - layout.shaftH*0.1, layout.shaftW*1.7, layout.shaftH*1.15)
    } else {
      drawShaft(ctx,W,H,layout)
    }
    
    // Torches on board removed — r3f scene has volumetric torches on either
    // side of the play area already.

    const validIds=validIdsRef.current
    tikiStatesRef.current.filter(t=>t.visible!==false).sort((a,b)=>b.slot-a.slot).forEach(t=>{
      const data=TIKI_DATA[t.id]||TIKI_DATA.mana
      const isValid=validIds.includes(t.id),isHov=hoveredIdRef.current===t.id
      const pulse=(Math.sin(elapsed*3.8+t.slot*.6)+1)*.5
      const hi=isValid?(isHov?1.0:.50+pulse*.50):0
      const bob=!t.animating?Math.sin(elapsed*1.5+t.slot*.42)*(isValid?3.5:1.2):0
      // Subtle idle head-nod rotation (~2°) so tikis feel alive and 3D
      const idleAngle=!t.animating?Math.sin(elapsed*0.9+t.slot*.5)*0.035*(isValid?1.5:1):0
      // Faint scale-pulse when valid target — breathes attention
      const idleScale=isValid&&!t.animating?1+Math.sin(elapsed*3+t.slot)*0.02:1
      const hov=isHov&&isValid?-layout.tikiH*.065:0
      drawTiki(ctx,layout.shaftX+layout.shaftW/2,t.y,layout.tikiW,layout.tikiH*.85,t.id,data,
        {highlight:hi,hovered:isHov,offsetY:(t.offsetY||0)+bob+hov,angle:(t.angle||0)+idleAngle,opacity:t.opacity??1,scale:(t.scale??1)*idleScale})
    })

    // Removing drawTotemGate(ctx,W,H,layout,elapsed)
    drawBoardShaders(ctx,W,H,layout,elapsed)

    particlesRef.current.forEach(p=>{
      ctx.save(); ctx.globalAlpha=Math.max(0,p.life)
      ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=5
      ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(.5,p.r),0,Math.PI*2); ctx.fill(); ctx.restore()
    })
  },[])

  useEffect(()=>{
    function loop(){
      animQueueRef.current.update()
      const layout=layoutRef.current
      if(layout&&isInteractive){
        const{x:mx,y:my}=mouseRef.current
        const hw=layout.tikiW/2,hh=layout.tikiH*.85/2,cx=layout.shaftX+layout.shaftW/2
        hoveredIdRef.current=null
        ;[...tikiStatesRef.current].reverse().forEach(t=>{
          if(t.visible===false)return
          const ty=t.y+(t.offsetY||0)
          if(mx>=cx-hw&&mx<=cx+hw&&my>=ty-hh&&my<=ty+hh)hoveredIdRef.current=t.id
        })
        const c=canvasRef.current
        if(c)c.style.cursor=validIdsRef.current.includes(hoveredIdRef.current)?'pointer':'default'
      }
      redraw()
      frameIdRef.current=requestAnimationFrame(loop)
    }
    frameIdRef.current=requestAnimationFrame(loop)
    return()=>cancelAnimationFrame(frameIdRef.current)
  },[redraw,isInteractive])

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return
    const container=canvas.parentElement
    const resize=()=>{
      const W=container.clientWidth,H=container.clientHeight
      if(W===0||H===0)return
      canvas.width=W;canvas.height=H
      layoutRef.current=computeLayout(W,H)
      stonePositionsRef.current=computeStonePositions(W,H,layoutRef.current)
      if(tikiStatesRef.current.length>0){
        tikiStatesRef.current.forEach(t=>{if(!t.animating)t.y=layoutRef.current.slotY(t.slot)})
      } else if(boardPropRef.current.length>0){
        const layout=layoutRef.current
        const sorted=[...boardPropRef.current].sort((a,b)=>a.position-b.position)
        tikiStatesRef.current=sorted.map((tiki,index)=>({id:tiki.id,slot:index,y:layout.slotY(index),angle:0,scale:1,opacity:1,visible:true,animating:false}))
      }
    }
    resize()
    const ro=new ResizeObserver(resize);ro.observe(container)
    return()=>ro.disconnect()
  },[])

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return
    const onMove=e=>{const r=canvas.getBoundingClientRect();mouseRef.current={x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)}}
    const onClick=()=>{
      if(!isInteractive)return
      const tid=hoveredIdRef.current
      if(tid&&validIdsRef.current.includes(tid)){tikiClickCbRef.current?.(tid);onTikiSelect?.(tid)}
    }
    canvas.addEventListener('mousemove',onMove);canvas.addEventListener('click',onClick)
    return()=>{canvas.removeEventListener('mousemove',onMove);canvas.removeEventListener('click',onClick)}
  },[isInteractive,onTikiSelect])

  const initBoard=useCallback(tikiList=>{
    const layout=layoutRef.current;if(!layout)return
    const sorted=[...tikiList].sort((a,b)=>a.position-b.position)
    tikiStatesRef.current=sorted.map((tiki,index)=>({id:tiki.id,slot:index,y:layout.slotY(index),angle:0,scale:1,opacity:1,visible:true,animating:false}))
  },[])
  const initPawns=useCallback(playersList=>{
    const layout=layoutRef.current;if(!layout)return
    const sp=stonePositionsRef.current
    // Position each pawn at the stone matching its current cumulative score
    // (or LEFT of stone 1 if score is 0). Preserves position across GameScreen
    // remounts between rounds so pawns don't teleport back to start.
    pawnStatesRef.current=playersList.map((p,i)=>{
      const score = p.score || 0
      const fanY  = (i - (playersList.length-1)/2) * layout.stoneR * 1.2
      let x, y
      if (score === 0) {
        x = (sp[0]?.x ?? 60) - layout.stoneR * 1.8
        y = (sp[0]?.y ?? layout.shaftBot) + fanY
      } else {
        const st = sp.find(s => s.n === Math.min(score, sp.length))
        // Offset from the stone so multiple pawns on same stone don't overlap
        let dx = 0, dy = 0
        if      (score <= 14) dx = -layout.stoneR * 1.15
        else if (score >= 21) dx =  layout.stoneR * 1.15
        else                  dy = -layout.stoneR * 1.15
        x = (st?.x ?? sp[0]?.x ?? 60) + dx + fanY * 0.25
        y = (st?.y ?? sp[0]?.y ?? layout.shaftBot) + dy + fanY * 0.75
      }
      return {
        id: p.id,
        color: p.color || '#ff8833',
        label: (p.name || p.id || '?')[0].toUpperCase(),
        x, y,
        score, animating: false,
      }
    })
  },[])
  const updatePawnScores=useCallback(playersList=>{
    const layout=layoutRef.current;if(!layout)return
    playersList.forEach(player=>{
      const pawn=pawnStatesRef.current.find(p=>p.id===player.id)
      if(pawn&&pawn.score!==player.score)animatePawnToScore2D(animQueueRef.current,pawn,player.score,stonePositionsRef.current,layout)
    })
  },[])
  const updateBoard=useCallback(newBoardState=>{
    if(!newBoardState||!Array.isArray(newBoardState))return
    const layout=layoutRef.current;if(!layout)return
    newBoardState.forEach((item,newIndex)=>{
      const tikId=typeof item==='string'?item:item.id
      const ts=tikiStatesRef.current.find(t=>t.id===tikId)
      if(!ts||ts.slot===newIndex)return
      const oldSlot=ts.slot,slots=Math.abs(newIndex-oldSlot)
      ts.slot=newIndex
      if(newIndex===newBoardState.length-1&&slots>3)animateTopple2D(animQueueRef.current,ts,oldSlot,newIndex,layout)
      else animateTikiMove2D(animQueueRef.current,ts,oldSlot,newIndex,layout)
    })
  },[])
  const toastTiki=useCallback((tikId,onDone)=>{
    const ts=tikiStatesRef.current.find(t=>t.id===tikId),layout=layoutRef.current
    if(ts&&layout){animateParticles(animQueueRef.current,particlesRef,layout.shaftX+layout.shaftW/2,ts.y);animateToast2D(animQueueRef.current,ts,layout,onDone)}
  },[])
  const highlightValidTargets=useCallback(ids=>{validIdsRef.current=ids||[]},[])
  const clearHighlights=useCallback(()=>{validIdsRef.current=[];hoveredIdRef.current=null},[])
  const onTikiClicked=useCallback(cb=>{tikiClickCbRef.current=cb},[])

  useImperativeHandle(ref,()=>({initBoard,initPawns,updatePawnScores,updateBoard,toastTiki,highlightValidTargets,clearHighlights,onTikiClicked}))

  useEffect(()=>{
    if(!board?.length)return
    boardPropRef.current=board.map((t,i)=>({id:t.id,name:t.name||t.id,position:i+1}))
    if(layoutRef.current)initBoard(boardPropRef.current)
  },[board,initBoard])
  useEffect(()=>{if(players?.length>0&&layoutRef.current)initPawns(players)},[players.length]) // eslint-disable-line
  useEffect(()=>{if(players?.length>0&&pawnStatesRef.current.length>0)updatePawnScores(players)},[players.map(p=>`${p.id}:${p.score}`).join(',')]) // eslint-disable-line
  useEffect(()=>{if(boardState&&tikiStatesRef.current.length>0)updateBoard(boardState)},[boardState,updateBoard])
  useEffect(()=>{if(onTikiClick)onTikiClicked(onTikiClick)},[onTikiClick,onTikiClicked])
  useEffect(()=>{if(isInteractive)highlightValidTargets(validTikiIds||validTargets||[]);else clearHighlights()},[validTikiIds,validTargets,isInteractive,highlightValidTargets,clearHighlights])

  return(
    <div style={{position:'absolute',inset:0,width:'100%',height:'100%',overflow:'hidden',background:'transparent'}}>
      <canvas ref={canvasRef} style={{display:'block',width:'100%',height:'100%',background:'transparent'}}/>
    </div>
  )
})

TikiBoard2D.displayName='TikiBoard2D'
export default TikiBoard2D
