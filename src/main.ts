import * as THREE from "three";
import "./style.css";

// Portfolio interactions and Three.js book-opening scene.
// The original animation timings and visual behaviour are preserved.
(function(){
const $ = (s: string): HTMLElement => document.querySelector<HTMLElement>(s)!;
const all = (s: string): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>(s));
var openAt=null,opened=false,gone=false;
/* clock */
function tk(){var d=new Date();$("#clk").textContent=d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})+" [IST]";$("#dt").textContent=d.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}).toUpperCase()}tk();setInterval(tk,30000);
/* loader -> closed book waits for a click */
var n=0,ln=$("#ln"),t=setInterval(function(){n+=2;if(n>=100){n=100;clearInterval(t);setTimeout(function(){$("#ld").classList.add("go")},250)}ln.textContent=String(n).padStart(3,"0")},22);
/* click the book */
function openBook(){
 if(opened)return;opened=true;
 $("#gate").classList.add("off");
 openAt=performance.now();                          /* 0s: book lays down flat */
                                                    /* 0.7s: cover opens (driven in the 3D loop) */
 setTimeout(function(){$("#beam").classList.add("fire");$("#halo").classList.add("fire")},2100); /* soft light rises */
 setTimeout(function(){                             /* then the whole website fades in, book fades out */
  gone=true;gl.style.transition="opacity 1.4s";$("#fallback").style.opacity="0";
  document.documentElement.classList.remove("lock");scrollTo(0,0);
  $("#hero").classList.add("show");$("#hero .mask").classList.add("show");sc();
  setTimeout(function(){gl.style.display="none";$("#fallback").style.display="none"},1600);
 },3700)}
$("#gate").addEventListener("click",openBook);
$("#gate").addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();openBook()}});
/* reveal + counters */
function cnt(el){var to=+el.dataset.to,dc=+(el.dataset.dec||0),s=null;(function f(x){s=s||x;var p=Math.min((x-s)/2000,1);el.textContent=(to*(1-Math.pow(1-p,4))).toFixed(dc);if(p<1)requestAnimationFrame(f)})(performance.now())}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!e.target.classList.contains("show")){e.target.classList.add("show");e.target.querySelectorAll(".rvm").forEach(function(m){m.classList.add("show")});e.target.querySelectorAll("[data-to]").forEach(cnt);var m=e.target.querySelector(".mask");if(m&&e.target.id!=="hero")m.classList.add("show")}})},{threshold:.25});
all(".rv,#work,#contact").forEach(function(s){io.observe(s)});
/* GitHub contribution total (GitHub's public contribution count, refreshed on page load) */
async function loadGithubContributions(){
 const totalEl=document.getElementById("github-total");
 if(!totalEl)return;
 try{
  const response=await fetch("https://github-contributions-api.jogruber.de/v4/omprakash20071125-a11y?y=last",{cache:"no-store"});
  if(!response.ok)throw new Error("GitHub contribution service unavailable");
  const data: {contributions?: Array<{count?: number}>; total?: {lastYear?: number}}=await response.json();
  const total=Array.isArray(data.contributions)
   ?data.contributions.reduce((sum,day)=>sum+(Number(day.count)||0),0)
   :Number(data.total?.lastYear);
  if(!Number.isFinite(total))throw new Error("Contribution total missing");
  totalEl.textContent=total.toLocaleString("en-IN");
 }catch(error){
  totalEl.textContent="—";
  totalEl.setAttribute("aria-label","Contribution count temporarily unavailable");
 }
}
void loadGithubContributions();

/* project cards: use each project's own gradient as its visual cover */
var pv=$("#pv"),px=0,py=0,cx=0,cy=0;
all(".row").forEach(function(r){
 const gradient=r.dataset.g;
 if(gradient)r.style.setProperty("--card-art",gradient);
});
/* magnetic */
var mg=$(".mg");mg.addEventListener("mousemove",function(e){var b=mg.getBoundingClientRect();(mg.firstElementChild as HTMLElement).style.transform="translate("+(e.clientX-b.left-b.width/2)*.3+"px,"+(e.clientY-b.top-b.height/2)*.4+"px)"});mg.addEventListener("mouseleave",function(){(mg.firstElementChild as HTMLElement).style.transform=""});
/* nav + progress + book drivers */
var links=all("nav a"),secs=["about","work","github","archive","contact"].map(function(x){return document.getElementById(x)}),hero=$("#hero"),con=$("#contact"),gl=$("#gl");
var op=1,mx=0,my=0,HS=0,CK=0;addEventListener("mousemove",function(e){mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5});
function sc(){var m=document.documentElement.scrollHeight-innerHeight,p=m>0?scrollY/m:0;$("#bar").style.transform="scaleX("+p+")";$("#rb").style.height=(50+p*150)+"px";$("#pc").textContent=String(Math.round(p*100)).padStart(2,"0");
 var cur=-1;secs.forEach(function(s,i){if(s.getBoundingClientRect().top<innerHeight*.5)cur=i});links.forEach(function(a,i){a.classList.toggle("on",i===cur)});
 var a=hero.getBoundingClientRect(),b=con.getBoundingClientRect();
 HS=Math.max(0,Math.min(1,-a.top/(innerHeight*.95)));
 CK=Math.max(0,Math.min(1,(.9-b.top/innerHeight)/.7));
 var oh=Math.max(0,Math.min(1,1-(-a.top-innerHeight*.95)/(innerHeight*.6))),oc=Math.max(0,Math.min(1,1-b.top/(innerHeight*.9)));op=gone?0:Math.max(oh,oc);gl.style.opacity=String(op);$("#fallback").style.opacity=String(op)}
addEventListener("scroll",sc,{passive:true});sc();

/* ---------- three.js: the book ---------- */
function startBook(){
try{

const Wd=2.2,Hd=3.1,N=4,gap=.014,TH=.008;
const canvas = gl as HTMLCanvasElement;
var R=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setClearColor(0x1a1b21,1);
var S=new THREE.Scene(),C=new THREE.PerspectiveCamera(40,1,.1,100);C.position.z=9;
S.add(new THREE.AmbientLight(0xe8e2ff,.9));
var dl=new THREE.DirectionalLight(0xffffff,1.2);dl.position.set(-3,5,6);S.add(dl);
var pl2=new THREE.PointLight(0x7a4dff,2.2,18);pl2.position.set(3,-1,4);S.add(pl2);
var pgl=new THREE.PointLight(0xcfc4ff,0,14);pgl.position.set(0,.6,3);S.add(pgl);
/* violet glow behind the book */
var bc=document.createElement("canvas");bc.width=bc.height=256;var bg=bc.getContext("2d"),rg=bg.createRadialGradient(128,128,10,128,128,128);rg.addColorStop(0,"rgba(139,109,255,.75)");rg.addColorStop(1,"rgba(26,27,33,0)");bg.fillStyle=rg;bg.fillRect(0,0,256,256);
var glow=new THREE.Mesh(new THREE.PlaneGeometry(14,9),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(bc),transparent:true}));glow.position.z=-3;S.add(glow);

var INK="#1a1b21",VIO="#5b35ff",LAV="#d0c6ff";
function tex(c){var t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
function paper(side,fn){var c=document.createElement("canvas");c.width=512;c.height=720;var g=c.getContext("2d");
 var b=g.createRadialGradient(256,360,60,256,360,460);b.addColorStop(0,"#f6f3ff");b.addColorStop(1,"#d9d0ff");g.fillStyle=b;g.fillRect(0,0,512,720);
 for(var k=0;k<700;k++){g.fillStyle="rgba(91,53,255,"+(Math.random()*.05)+")";g.fillRect(Math.random()*512,Math.random()*720,1+Math.random()*2,1+Math.random()*2)}
 g.strokeStyle="rgba(91,53,255,.35)";g.lineWidth=2;g.strokeRect(28,28,456,664);g.lineWidth=1;g.strokeRect(36,36,440,648);
 fn(g);
 var gr=side==="R"?g.createLinearGradient(0,0,90,0):g.createLinearGradient(512,0,422,0);gr.addColorStop(0,"rgba(26,14,80,.45)");gr.addColorStop(1,"rgba(26,14,80,0)");g.fillStyle=gr;g.fillRect(side==="R"?0:422,0,90,720);
 return tex(c)}
function tx(g,s,x,y,f,col=INK,al="center"){g.font=f;g.fillStyle=col;g.textAlign=al;g.fillText(s,x,y);}
function wrap(g,s,x,y,mw,lh,f,col=INK){
  g.font=f;
  g.fillStyle=col;
  g.textAlign="left";
  var ws=s.split(" "),l="";
  ws.forEach(function(w){
    var tt=l+w+" ";
    if(g.measureText(tt).width>mw&&l){
      g.fillText(l,x,y);
      l=w+" ";
      y+=lh;
    } else l=tt;
  });
  g.fillText(l,x,y);
  return y;
}
var GF='900 56px "Grenze Gotisch",serif',BF='17px "JetBrains Mono",monospace',IF='15px "JetBrains Mono",monospace';
function orn(g,y){tx(g,"✦",256,y,"30px serif",VIO)}
function num(g,n){tx(g,"— "+n+" —",256,668,IF,"rgba(26,27,33,.55)")}
function chap(g,k,t,d,n){tx(g,k,256,230,"14px 'JetBrains Mono',monospace","rgba(26,27,33,.6)");tx(g,t,256,320,'900 92px "Grenze Gotisch",serif',VIO);orn(g,380);wrap(g,d,76,450,360,30,BF);num(g,n)}

var coverF=(function(){var c=document.createElement("canvas");c.width=512;c.height=720;var g=c.getContext("2d");
 var b=g.createLinearGradient(0,0,512,720);b.addColorStop(0,"#3a1fa8");b.addColorStop(1,"#14123a");g.fillStyle=b;g.fillRect(0,0,512,720);
 for(var k=0;k<2500;k++){g.fillStyle="rgba(0,0,0,"+(Math.random()*.12)+")";g.fillRect(Math.random()*512,Math.random()*720,1+Math.random()*2,1)}
 g.strokeStyle=LAV;g.lineWidth=4;g.strokeRect(30,30,452,660);g.lineWidth=1.5;g.strokeRect(44,44,424,632);
 [[44,44],[468,44],[44,676],[468,676]].forEach(function(p){g.beginPath();g.arc(p[0],p[1],10,0,7);g.stroke()});
 tx(g,"A PORTFOLIO",256,170,"16px 'JetBrains Mono',monospace",LAV);
 tx(g,"OM",256,330,'900 150px "Grenze Gotisch",serif',LAV);tx(g,"GUPTA",256,450,'900 110px "Grenze Gotisch",serif',LAV);
 tx(g,"✦",256,530,"40px serif",LAV);tx(g,"AI & DATA SCIENCE",256,590,"15px 'JetBrains Mono',monospace",LAV);tx(g,"IIT JODHPUR · 2026",256,640,"13px 'JetBrains Mono',monospace","rgba(208,198,255,.7)");
 var gr=g.createLinearGradient(0,0,70,0);gr.addColorStop(0,"rgba(0,0,0,.55)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(0,0,70,720);
 return tex(c)})();
var coverB=paper("L",function(g){tx(g,"EX LIBRIS",256,230,'900 64px "Grenze Gotisch",serif',VIO);orn(g,300);tx(g,"This book belongs to",256,380,IF);tx(g,"the curious.",256,410,IF);tx(g,"Om Prakash Gupta",256,520,'900 46px "Grenze Gotisch",serif',INK)});
var F=[null,
 paper("R",function(g){tx(g,"Contents",256,130,GF,VIO);orn(g,180);[["I","Info","03"],["II","Work","07"],["III","GitHub","10"],["IV","Archive","14"],["V","Contact","19"]].forEach(function(r,k){var y=235+k*58;tx(g,r[0],70,y,'900 36px "Grenze Gotisch",serif',VIO,"left");tx(g,r[1],130,y,BF,INK,"left");tx(g,r[2],444,y,BF,INK,"right");g.strokeStyle="rgba(26,27,33,.3)";g.setLineDash([2,6]);g.beginPath();g.moveTo(240,y-6);g.lineTo(410,y-6);g.stroke();g.setLineDash([])});num(g,"i")}),
 paper("R",function(g){tx(g,"Skills",256,130,GF,VIO);orn(g,180);["Python","C / C++","LangChain","LangGraph","RAG","FastAPI","Streamlit"].forEach(function(s,k){tx(g,"· "+s+" ·",256,250+k*58,BF,INK)});num(g,"iii")}),
 paper("R",function(g){chap(g,"CHAPTER II","Work","Five selected projects in agentic AI, RAG and full-stack.","v")}),
 paper("R",function(g){chap(g,"CHAPTER V","Contact","Say hello. The next chapter is still unwritten.","vii")})];
var B=[null,
 paper("L",function(g){tx(g,"Prologue",256,130,GF,VIO);orn(g,180);var y=wrap(g,"B.Tech student in AI & Data Science at IIT Jodhpur, building agentic AI and RAG products.",76,260,360,30,BF);wrap(g,"CGPA 9.36 · JEE Advanced AIR 6876.",76,y+60,360,30,IF);num(g,"ii")}),
 paper("L",function(g){chap(g,"CHAPTER I","Info","AI & Data Science undergraduate at IIT Jodhpur, India.","iv")}),
 paper("L",function(g){chap(g,"CHAPTER IV","Archive","Education, honours and leadership, recorded in order.","vi")}),
 paper("L",function(g){orn(g,300);tx(g,"The story continues…",256,380,BF);tx(g,"keep scrolling",256,420,IF,"rgba(26,27,33,.6)")})];
var topR=paper("R",function(g){orn(g,300);tx(g,"Read on",256,380,'900 48px "Grenze Gotisch",serif',VIO);tx(g,"↓",256,450,"48px serif",VIO)});
var plain=paper("L",function(g){});

var edge=new THREE.MeshStandardMaterial({color:0xcfc4ff,roughness:.9}),ledge=new THREE.MeshStandardMaterial({color:0x1b1b4a,roughness:.7});
function mat(t){return new THREE.MeshStandardMaterial({map:t,roughness:.85})}
var root=new THREE.Group(),shift=new THREE.Group();root.add(shift);S.add(root);
var rb=new THREE.Mesh(new THREE.BoxGeometry(Wd-.04,Hd-.06,.14),[edge,edge,edge,edge,mat(topR),edge]);rb.geometry.translate(Wd/2,0,-.07);shift.add(rb);
var rl=new THREE.Mesh(new THREE.BoxGeometry(Wd+.06,Hd+.12,.04),ledge);rl.geometry.translate(Wd/2,0,-.16);shift.add(rl);
var lg=new THREE.Group();shift.add(lg);
var lb=new THREE.Mesh(new THREE.BoxGeometry(Wd-.04,Hd-.06,.14),[edge,edge,edge,edge,mat(plain),edge]);lb.geometry.translate(-Wd/2,0,-.07);lg.add(lb);
var ll=new THREE.Mesh(new THREE.BoxGeometry(Wd+.06,Hd+.12,.04),ledge);ll.geometry.translate(-Wd/2,0,-.16);lg.add(ll);
var leaves=[];
for(var i=0;i<=N;i++){
 var cov=i===0,w=cov?Wd+.06:Wd-.02,hh=cov?Hd+.12:Hd-.04,d=cov?.02:TH;
 var geo=new THREE.BoxGeometry(w,hh,d);geo.translate(w/2,0,0);
 var e=cov?ledge:edge,mf=cov?new THREE.MeshStandardMaterial({map:coverF,roughness:.5,metalness:.15}):mat(F[i]),mb=cov?mat(coverB):mat(B[i]);
 var m=new THREE.Mesh(geo,[e,e,e,e,mf,mb]);var pv2=new THREE.Group();pv2.add(m);shift.add(pv2);leaves.push(pv2)}
var pc=120,pa=new Float32Array(pc*3);for(var q=0;q<pc;q++){pa[q*3]=(Math.random()-.5)*14;pa[q*3+1]=(Math.random()-.5)*8;pa[q*3+2]=Math.random()*6-3}
var pg=new THREE.BufferGeometry();pg.setAttribute("position",new THREE.BufferAttribute(pa,3));
var dust=new THREE.Points(pg,new THREE.PointsMaterial({color:0xd0c6ff,size:.035,transparent:true,opacity:.7}));S.add(dust);

function rs(){var w=innerWidth,hh=innerHeight;R.setSize(w,hh,false);C.aspect=w/hh;C.updateProjectionMatrix()}rs();addEventListener("resize",rs);
function ez(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
function cl(x){return Math.max(0,Math.min(1,x))}
var cm=0,ch=0,gz=0;
(function loop(){requestAnimationFrame(loop);if(op<.02)return;
 var now=performance.now(),lay=openAt?ez(cl((now-openAt)/1000)):0,auto=openAt?cl((now-openAt-700)/1700):0,lk=openAt?ez(cl((now-openAt-1900)/1500)):0;
 var T=auto;
 var co=ez(cl(T));
 leaves.forEach(function(L,i){var a=ez(cl(T-i));L.rotation.y=-a*Math.PI;var rz=i===0?(N*gap+.02):((N-i)*gap+.004),lz=i===0?.012:(i*gap+.012);L.position.z=rz+(lz-rz)*a+Math.sin(a*Math.PI)*.55});
 shift.position.x=-Wd/2*(1-co);lg.scale.x=Math.max(.001,co);lg.visible=co>.02;
 cm+=(mx-cm)*.05;ch+=(my-ch)*.05;
 /* closed book on the gate is bigger; settles to normal size once opened */
 var big=opened?0:1,sz=innerWidth<820?.6:Math.min(1.05,.55+innerWidth/2400);
 gz+=(big-gz)*.06;var s=sz*(1+gz*.45)*(opened?1:1+Math.sin(now*.002)*.015);root.scale.setScalar(s);
 root.rotation.y=-.5*(1-co)*(1-lay)+cm*(.5-.35*lay);
 root.rotation.x=-.12-1.0*lay+ch*(.25-.12*lay);pgl.intensity=5*lk;
 root.position.y=-.15+.2*lay+Math.sin(now*.001)*.06;
 dust.rotation.y+=.0006;dust.position.y=Math.sin(now*.0004)*.15;
 R.render(S,C)})();
}catch(e: unknown){$("#gl").style.display="none";$("#fallback").style.display="block"}
}
var fl=Promise.race([Promise.all([document.fonts.load('900 40px "Grenze Gotisch"'),document.fonts.load('17px "JetBrains Mono"')]),new Promise(function(r){setTimeout(r,2500)})]);
fl.then(startBook,startBook);
/* preview follow */
(function f(){requestAnimationFrame(f);cx+=(px-cx)*.12;cy+=(py-cy)*.12;pv.style.transform="translate("+cx+"px,"+cy+"px)"})();
})();
