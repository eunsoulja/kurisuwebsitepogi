/* ---------- 3D ascii logo + fluid cursor smear (white only) ---------- */
export interface AsciiLogoOpt { t0?: number; center?: boolean }
export interface AsciiLogoHandle {
  hold(b: boolean): void;
  burst(px: number, py: number): void;
  getT(): number;
  morph(ms: number, cb?: () => void): void;
  destroy(): void;
}
export function asciiLogo(cv: HTMLCanvasElement, opt?: AsciiLogoOpt): AsciiLogoHandle {
opt=opt||{};
const c=cv.getContext("2d")!,off=document.createElement("canvas"),o=off.getContext("2d",{willReadFrequently:true})!;
const ramp=" .:-=+*#%@$&",RM=matchMedia("(prefers-reduced-motion:reduce)").matches;
const K=[[4,3],[8,3],[8,10],[15,3],[20,3],[12,12],[20,21],[15,21],[8,14],[8,21],[4,21]];
const AL=Array.from({length:17},(_,k)=>`rgba(255,255,255,${(.28+.72*k/16).toFixed(2)})`);
const LAYERS=18,R=74;
let W=0,H=0,fs=0,cw=0,ch=0,cols=0,rows=0,N=0,vx!:Float32Array,vy!:Float32Array,ink!:Float32Array,hol!:Float32Array,s1!:Float32Array,s2!:Float32Array,s3!:Float32Array,pr!:Float32Array,dv!:Float32Array,cu!:Float32Array,mx=-999,my=-999,sx: number | null=null,sy=0,gx=-999,gy=-999,t=opt.t0!=null?opt.t0:.6,on=true,held=false,dead=false,last=0,kk=opt.center?0:1,mt0: number | null=null,mms=1,fin: (() => void) | null=null;
function fit(){const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;c.setTransform(d,0,0,d,0,0);fs=W<700?10:13;cw=fs*.62;ch=fs*1.15;cols=Math.ceil(W/cw);rows=Math.ceil(H/ch);off.width=cols;off.height=rows;N=cols*rows;
 [vx,vy,ink,hol,s1,s2,s3,pr,dv,cu]=Array.from({length:10},()=>new Float32Array(N)) as Float32Array[]}
function samp(a: Float32Array,x: number,y: number){x=x<0?0:x>cols-1?cols-1:x;y=y<0?0:y>rows-1?rows-1:y;const x0=x|0,y0=y|0,x1=Math.min(x0+1,cols-1),y1=Math.min(y0+1,rows-1),fx=x-x0,fy=y-y0,r=y0*cols,s=y1*cols;return(a[r+x0]*(1-fx)+a[r+x1]*fx)*(1-fy)+(a[s+x0]*(1-fx)+a[s+x1]*fx)*fy}
function adv(src: Float32Array,dst: Float32Array,dt: number){
 const kx=dt/cw,ky=dt/ch;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x;s1[i]=samp(src,x-vx[i]*kx,y-vy[i]*ky)}
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const i=y*cols+x,bx=x-vx[i]*kx,by=y-vy[i]*ky,
   x0=Math.max(0,Math.min(cols-2,Math.floor(bx))),y0=Math.max(0,Math.min(rows-2,Math.floor(by))),j=y0*cols+x0,
   a=src[j],b=src[j+1],e=src[j+cols],f=src[j+cols+1],lo=Math.min(a,b,e,f),hi=Math.max(a,b,e,f),
   v=s1[i]+.5*(src[i]-samp(s1,x+vx[i]*kx,y+vy[i]*ky));
  dst[i]=v<lo?lo:v>hi?hi:v}}
function splat(px: number,py: number,ux: number,uy: number,amt: number){
 const rr=R*1.8,x0=Math.max(0,Math.floor((px-rr)/cw)),x1=Math.min(cols-1,Math.ceil((px+rr)/cw)),y0=Math.max(0,Math.floor((py-rr)/ch)),y1=Math.min(rows-1,Math.ceil((py+rr)/ch));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const dx=x*cw+cw/2-px,dy=y*ch+ch/2-py,w=Math.exp(-(dx*dx+dy*dy)/(R*R*.5)),i=y*cols+x;
  vx[i]+=(ux-vx[i])*w*.45;vy[i]+=(uy-vy[i])*w*.45;ink[i]=Math.min(1.4,ink[i]+amt*w)}}
function burst(px: number,py: number){
 if(!vx)return;
 const rr=R*5,x0=Math.max(0,Math.floor((px-rr)/cw)),x1=Math.min(cols-1,Math.ceil((px+rr)/cw)),y0=Math.max(0,Math.floor((py-rr)/ch)),y1=Math.min(rows-1,Math.ceil((py+rr)/ch));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const dx=x*cw+cw/2-px,dy=y*ch+ch/2-py,d=Math.hypot(dx,dy)+1e-3,w=Math.exp(-(d*d)/(rr*rr*.35)),i=y*cols+x;
  vx[i]+=dx/d*w*34;vy[i]+=dy/d*w*34;ink[i]=Math.min(1.4,ink[i]+.5*w)}}
function pointer(dt: number){
 if(mx>-500&&my>-60&&my<H+60){
  if(sx===null){sx=mx;sy=my}
  const ax=sx,ay=sy,e=1-Math.pow(.62,dt);sx+=(mx-sx)*e;sy+=(my-sy)*e;
  const dx=sx-ax,dy=sy-ay,dist=Math.hypot(dx,dy);
  if(dist>.15){const n=Math.max(1,Math.ceil(dist/(cw*1.1))),ux=Math.max(-45,Math.min(45,dx/dt*1.1)),uy=Math.max(-45,Math.min(45,dy/dt*1.1)),amt=.07+Math.min(.12,dist*.004);
   for(let s=1;s<=n;s++)splat(ax+dx*s/n,ay+dy*s/n,ux,uy,amt)}
 }else sx=null}
function vort(dt: number){
 const e=cw*.3*dt;
 for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){const i=y*cols+x;cu[i]=(vy[i+1]-vy[i-1])/(2*cw)-(vx[i+cols]-vx[i-cols])/(2*ch)}
 for(let y=2;y<rows-2;y++)for(let x=2;x<cols-2;x++){const i=y*cols+x,
  gxx=(Math.abs(cu[i+1])-Math.abs(cu[i-1]))/(2*cw),gyy=(Math.abs(cu[i+cols])-Math.abs(cu[i-cols]))/(2*ch),l=Math.hypot(gxx,gyy)+1e-6;
  vx[i]+=e*gyy/l*cu[i];vy[i]-=e*gxx/l*cu[i]}}
function project(){
 const ix=1/(cw*cw),iy=1/(ch*ch),den=2*(ix+iy);
 for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){const i=y*cols+x;dv[i]=(vx[i+1]-vx[i-1])/(2*cw)+(vy[i+cols]-vy[i-cols])/(2*ch)}
 for(let k=0;k<18;k++)for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){const i=y*cols+x;pr[i]=((pr[i-1]+pr[i+1])*ix+(pr[i-cols]+pr[i+cols])*iy-dv[i])/den}
 for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){const i=y*cols+x;vx[i]-=(pr[i+1]-pr[i-1])/(2*cw);vy[i]-=(pr[i+cols]-pr[i-cols])/(2*ch)}}
function step(dt: number,d: Uint8ClampedArray){
 adv(vx,s2,dt);adv(vy,s3,dt);vx.set(s2);vy.set(s3);
 pointer(dt);vort(dt);project();
 adv(ink,s2,dt);
 const df=.07,fd=Math.pow(.984,dt),hd=Math.pow(.92,dt),vd=Math.pow(.988,dt);
 for(let i=0;i<N;i++)ink[i]=s2[i]*fd;
 for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){const i=y*cols+x;ink[i]=(s2[i]*(1-4*df)+(s2[i-1]+s2[i+1]+s2[i-cols]+s2[i+cols])*df)*fd}
 for(let i=0;i<N;i++){const pk=Math.min(1,Math.hypot(vx[i],vy[i])/16);
  ink[i]=Math.min(1.5,ink[i]+d[i*4]/255*pk*.5*dt);hol[i]=Math.max(hol[i]*hd,pk*.9);vx[i]*=vd;vy[i]*=vd}}
function frame(dt: number){
 if(!RM)t+=.011*dt;
 if(mt0!==null){const q=Math.min(1,(performance.now()-mt0)/mms);kk=q<.5?4*q*q*q:1-Math.pow(-2*q+2,3)/2;if(q>=1){mt0=null;kk=1}}
 const cs=Math.cos(t),sn=Math.sin(t),L=(a: number,b: number)=>a+(b-a)*kk,
  S=L(Math.min(H*.72,W*.86),Math.min(H*.8,W*.9)),u=S/24,
  cx=L(W*.5,W>700?W*.56:W*.5),cy=L(H*.46,H*.44),D=S*.2;
 if(mx<-500){gx=gy=-999}else if(gx<-500){gx=mx;gy=my}else{gx+=(mx-gx)*.14;gy+=(my-gy)*.14}
 o.setTransform(1,0,0,1,0,0);o.clearRect(0,0,cols,rows);
 for(let j=0;j<LAYERS;j++){
  const k=cs>=0?j:LAYERS-1-j,z=(k/(LAYERS-1)-.5)*D;
  const v=j===LAYERS-1?Math.round(180+70*Math.abs(cs)):Math.round(60+80*j/LAYERS+30*Math.abs(sn));
  o.setTransform(cs/cw,0,0,1/ch,(cx+z*sn)/cw,cy/ch);
  o.fillStyle=`rgb(${v},${v},${v})`;o.beginPath();
  K.forEach(([x,y],i)=>{const X=(x-12)*u,Y=(y-12)*u;i?o.lineTo(X,Y):o.moveTo(X,Y)});
  o.closePath();o.fill()}
 const d=o.getImageData(0,0,cols,rows).data;
 step(dt,d);
 c.clearRect(0,0,W,H);
 if(gx>-500){const g=c.createRadialGradient(gx,gy,0,gx,gy,240);g.addColorStop(0,"rgba(255,255,255,.07)");g.addColorStop(1,"rgba(255,255,255,0)");c.fillStyle=g;c.fillRect(0,0,W,H)}
 c.font=`${fs}px "Space Mono",monospace`;c.textBaseline="top";
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const i=y*cols+x,v=Math.min(1,Math.max(d[i*4]/255*(1-Math.min(.9,hol[i])),ink[i]*.9));
  if(v<.05||(v<.3&&v<.05+((x*7+y*13)%8)*.03))continue;
  const idx=Math.max(1,Math.min(ramp.length-1,Math.floor(v*ramp.length+Math.sin(x*12.9+y*78.2+t*3)*.4)));
  c.fillStyle=AL[Math.round(v*16)];c.fillText(ramp[idx],x*cw,y*ch)}
 if(fin&&mt0===null){const f=fin;fin=null;f()}
}
function loop(ts: number){if(dead)return;const dt=last?Math.min(3,(ts-last)/16.667):1;last=ts;if(on&&!held)frame(dt);if(!RM)requestAnimationFrame(loop)}
const onMove=(e: PointerEvent)=>{const r=cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top};
const onUp=(e: PointerEvent)=>{if(e.pointerType==="touch"){mx=my=-999;sx=null}};
const onLeave=()=>{mx=my=-999;sx=null};
const onResize=()=>{fit();if(RM)frame(1)};
addEventListener("pointermove",onMove);addEventListener("pointerup",onUp);
document.documentElement.addEventListener("mouseleave",onLeave);addEventListener("resize",onResize);
const io=new IntersectionObserver(e=>on=e[0].isIntersecting);io.observe(cv);
document.fonts.ready.then(()=>{if(dead)return;fit();frame(1);if(!RM)requestAnimationFrame(loop)});
return{hold(b: boolean){held=b;if(!b)last=0},burst,getT:()=>t,morph(ms: number,cb?: () => void){mms=ms;mt0=performance.now();fin=cb||null},
 destroy(){dead=true;removeEventListener("pointermove",onMove);removeEventListener("pointerup",onUp);document.documentElement.removeEventListener("mouseleave",onLeave);removeEventListener("resize",onResize);io.disconnect()}}}
