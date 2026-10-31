(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ya="170",Xh=0,pc=1,qh=2,Dl=1,Il=2,ii=3,Ai=0,xn=1,le=2,bi=0,As=1,ge=2,mc=3,gc=4,Yh=5,Gi=100,$h=101,Kh=102,Zh=103,Jh=104,jh=200,Qh=201,td=202,ed=203,Jo=204,jo=205,nd=206,id=207,sd=208,rd=209,od=210,ad=211,cd=212,ld=213,hd=214,Qo=0,ta=1,ea=2,Ls=3,na=4,ia=5,sa=6,ra=7,Ul=0,dd=1,ud=2,Ei=0,fd=1,pd=2,md=3,Nl=4,gd=5,xd=6,_d=7,Fl=300,Ds=301,Is=302,oa=303,aa=304,ro=306,ca=1e3,Wi=1001,la=1002,Ve=1003,vd=1004,gr=1005,Vn=1006,po=1007,Xi=1008,di=1009,Ol=1010,zl=1011,hr=1012,$a=1013,$i=1014,Wn=1015,ur=1016,Ka=1017,Za=1018,Us=1020,Bl=35902,kl=1021,Hl=1022,_n=1023,Gl=1024,Vl=1025,Cs=1026,Ns=1027,Ja=1028,ja=1029,Wl=1030,Qa=1031,tc=1033,qr=33776,Yr=33777,$r=33778,Kr=33779,ha=35840,da=35841,ua=35842,fa=35843,pa=36196,ma=37492,ga=37496,xa=37808,_a=37809,va=37810,ya=37811,Ma=37812,Sa=37813,wa=37814,ba=37815,Ea=37816,Ta=37817,Aa=37818,Ca=37819,Ra=37820,Pa=37821,Zr=36492,La=36494,Da=36495,Xl=36283,Ia=36284,Ua=36285,Na=36286,yd=3200,Md=3201,ql=0,Sd=1,Mi="",ln="srgb",Bs="srgb-linear",oo="linear",ve="srgb",rs=7680,xc=519,wd=512,bd=513,Ed=514,Yl=515,Td=516,Ad=517,Cd=518,Rd=519,Fa=35044,_c="300 es",ri=2e3,jr=2001;class ks{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const s=this._listeners[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}}const rn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],mo=Math.PI/180,Oa=180/Math.PI;function Ti(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(rn[i&255]+rn[i>>8&255]+rn[i>>16&255]+rn[i>>24&255]+"-"+rn[t&255]+rn[t>>8&255]+"-"+rn[t>>16&15|64]+rn[t>>24&255]+"-"+rn[e&63|128]+rn[e>>8&255]+"-"+rn[e>>16&255]+rn[e>>24&255]+rn[n&255]+rn[n>>8&255]+rn[n>>16&255]+rn[n>>24&255]).toLowerCase()}function nn(i,t,e){return Math.max(t,Math.min(e,i))}function Pd(i,t){return(i%t+t)%t}function go(i,t,e){return(1-e)*i+e*t}function Gn(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function ye(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class bt{constructor(t=0,e=0){bt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(nn(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class te{constructor(t,e,n,s,r,o,a,c,l){te.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,c,l)}set(t,e,n,s,r,o,a,c,l){const h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=r,h[5]=c,h[6]=n,h[7]=o,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],h=n[4],d=n[7],m=n[2],p=n[5],x=n[8],v=s[0],g=s[3],u=s[6],S=s[1],A=s[4],w=s[7],B=s[2],D=s[5],N=s[8];return r[0]=o*v+a*S+c*B,r[3]=o*g+a*A+c*D,r[6]=o*u+a*w+c*N,r[1]=l*v+h*S+d*B,r[4]=l*g+h*A+d*D,r[7]=l*u+h*w+d*N,r[2]=m*v+p*S+x*B,r[5]=m*g+p*A+x*D,r[8]=m*u+p*w+x*N,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8];return e*o*h-e*a*l-n*r*h+n*a*c+s*r*l-s*o*c}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8],d=h*o-a*l,m=a*c-h*r,p=l*r-o*c,x=e*d+n*m+s*p;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/x;return t[0]=d*v,t[1]=(s*l-h*n)*v,t[2]=(a*n-s*o)*v,t[3]=m*v,t[4]=(h*e-s*c)*v,t[5]=(s*r-a*e)*v,t[6]=p*v,t[7]=(n*c-l*e)*v,t[8]=(o*e-n*r)*v,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+t,-s*l,s*c,-s*(-l*o+c*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(xo.makeScale(t,e)),this}rotate(t){return this.premultiply(xo.makeRotation(-t)),this}translate(t,e){return this.premultiply(xo.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const xo=new te;function $l(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Qr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Ld(){const i=Qr("canvas");return i.style.display="block",i}const vc={};function sr(i){i in vc||(vc[i]=!0,console.warn(i))}function Dd(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function Id(i){const t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Ud(i){const t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const ce={enabled:!0,workingColorSpace:Bs,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===ve&&(i.r=ai(i.r),i.g=ai(i.g),i.b=ai(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===ve&&(i.r=Rs(i.r),i.g=Rs(i.g),i.b=Rs(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Mi?oo:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function ai(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Rs(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}const yc=[.64,.33,.3,.6,.15,.06],Mc=[.2126,.7152,.0722],Sc=[.3127,.329],wc=new te().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),bc=new te().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);ce.define({[Bs]:{primaries:yc,whitePoint:Sc,transfer:oo,toXYZ:wc,fromXYZ:bc,luminanceCoefficients:Mc,workingColorSpaceConfig:{unpackColorSpace:ln},outputColorSpaceConfig:{drawingBufferColorSpace:ln}},[ln]:{primaries:yc,whitePoint:Sc,transfer:ve,toXYZ:wc,fromXYZ:bc,luminanceCoefficients:Mc,outputColorSpaceConfig:{drawingBufferColorSpace:ln}}});let os;class Nd{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{os===void 0&&(os=Qr("canvas")),os.width=t.width,os.height=t.height;const n=os.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=os}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Qr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=ai(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(ai(e[n]/255)*255):e[n]=ai(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Fd=0;class Kl{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Fd++}),this.uuid=Ti(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(_o(s[o].image)):r.push(_o(s[o]))}else r=_o(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function _o(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Nd.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Od=0;class dn extends ks{constructor(t=dn.DEFAULT_IMAGE,e=dn.DEFAULT_MAPPING,n=Wi,s=Wi,r=Vn,o=Xi,a=_n,c=di,l=dn.DEFAULT_ANISOTROPY,h=Mi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Od++}),this.uuid=Ti(),this.name="",this.source=new Kl(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new bt(0,0),this.repeat=new bt(1,1),this.center=new bt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new te,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Fl)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case ca:t.x=t.x-Math.floor(t.x);break;case Wi:t.x=t.x<0?0:1;break;case la:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case ca:t.y=t.y-Math.floor(t.y);break;case Wi:t.y=t.y<0?0:1;break;case la:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}dn.DEFAULT_IMAGE=null;dn.DEFAULT_MAPPING=Fl;dn.DEFAULT_ANISOTROPY=1;class Me{constructor(t=0,e=0,n=0,s=1){Me.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const c=t.elements,l=c[0],h=c[4],d=c[8],m=c[1],p=c[5],x=c[9],v=c[2],g=c[6],u=c[10];if(Math.abs(h-m)<.01&&Math.abs(d-v)<.01&&Math.abs(x-g)<.01){if(Math.abs(h+m)<.1&&Math.abs(d+v)<.1&&Math.abs(x+g)<.1&&Math.abs(l+p+u-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const A=(l+1)/2,w=(p+1)/2,B=(u+1)/2,D=(h+m)/4,N=(d+v)/4,F=(x+g)/4;return A>w&&A>B?A<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(A),s=D/n,r=N/n):w>B?w<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(w),n=D/s,r=F/s):B<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(B),n=N/r,s=F/r),this.set(n,s,r,e),this}let S=Math.sqrt((g-x)*(g-x)+(d-v)*(d-v)+(m-h)*(m-h));return Math.abs(S)<.001&&(S=1),this.x=(g-x)/S,this.y=(d-v)/S,this.z=(m-h)/S,this.w=Math.acos((l+p+u-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class zd extends ks{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new Me(0,0,t,e),this.scissorTest=!1,this.viewport=new Me(0,0,t,e);const s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Vn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new dn(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new Kl(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ki extends zd{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Zl extends dn{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Ve,this.minFilter=Ve,this.wrapR=Wi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Bd extends dn{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Ve,this.minFilter=Ve,this.wrapR=Wi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class oi{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let c=n[s+0],l=n[s+1],h=n[s+2],d=n[s+3];const m=r[o+0],p=r[o+1],x=r[o+2],v=r[o+3];if(a===0){t[e+0]=c,t[e+1]=l,t[e+2]=h,t[e+3]=d;return}if(a===1){t[e+0]=m,t[e+1]=p,t[e+2]=x,t[e+3]=v;return}if(d!==v||c!==m||l!==p||h!==x){let g=1-a;const u=c*m+l*p+h*x+d*v,S=u>=0?1:-1,A=1-u*u;if(A>Number.EPSILON){const B=Math.sqrt(A),D=Math.atan2(B,u*S);g=Math.sin(g*D)/B,a=Math.sin(a*D)/B}const w=a*S;if(c=c*g+m*w,l=l*g+p*w,h=h*g+x*w,d=d*g+v*w,g===1-a){const B=1/Math.sqrt(c*c+l*l+h*h+d*d);c*=B,l*=B,h*=B,d*=B}}t[e]=c,t[e+1]=l,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,r,o){const a=n[s],c=n[s+1],l=n[s+2],h=n[s+3],d=r[o],m=r[o+1],p=r[o+2],x=r[o+3];return t[e]=a*x+h*d+c*p-l*m,t[e+1]=c*x+h*m+l*d-a*p,t[e+2]=l*x+h*p+a*m-c*d,t[e+3]=h*x-a*d-c*m-l*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,c=Math.sin,l=a(n/2),h=a(s/2),d=a(r/2),m=c(n/2),p=c(s/2),x=c(r/2);switch(o){case"XYZ":this._x=m*h*d+l*p*x,this._y=l*p*d-m*h*x,this._z=l*h*x+m*p*d,this._w=l*h*d-m*p*x;break;case"YXZ":this._x=m*h*d+l*p*x,this._y=l*p*d-m*h*x,this._z=l*h*x-m*p*d,this._w=l*h*d+m*p*x;break;case"ZXY":this._x=m*h*d-l*p*x,this._y=l*p*d+m*h*x,this._z=l*h*x+m*p*d,this._w=l*h*d-m*p*x;break;case"ZYX":this._x=m*h*d-l*p*x,this._y=l*p*d+m*h*x,this._z=l*h*x-m*p*d,this._w=l*h*d+m*p*x;break;case"YZX":this._x=m*h*d+l*p*x,this._y=l*p*d+m*h*x,this._z=l*h*x-m*p*d,this._w=l*h*d-m*p*x;break;case"XZY":this._x=m*h*d-l*p*x,this._y=l*p*d-m*h*x,this._z=l*h*x+m*p*d,this._w=l*h*d+m*p*x;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],c=e[9],l=e[2],h=e[6],d=e[10],m=n+a+d;if(m>0){const p=.5/Math.sqrt(m+1);this._w=.25/p,this._x=(h-c)*p,this._y=(r-l)*p,this._z=(o-s)*p}else if(n>a&&n>d){const p=2*Math.sqrt(1+n-a-d);this._w=(h-c)/p,this._x=.25*p,this._y=(s+o)/p,this._z=(r+l)/p}else if(a>d){const p=2*Math.sqrt(1+a-n-d);this._w=(r-l)/p,this._x=(s+o)/p,this._y=.25*p,this._z=(c+h)/p}else{const p=2*Math.sqrt(1+d-n-a);this._w=(o-s)/p,this._x=(r+l)/p,this._y=(c+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(nn(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,c=e._y,l=e._z,h=e._w;return this._x=n*h+o*a+s*l-r*c,this._y=s*h+o*c+r*a-n*l,this._z=r*h+o*l+n*c-s*a,this._w=o*h-n*a-s*c-r*l,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,o=this._w;let a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;const c=1-a*a;if(c<=Number.EPSILON){const p=1-e;return this._w=p*o+e*this._w,this._x=p*n+e*this._x,this._y=p*s+e*this._y,this._z=p*r+e*this._z,this.normalize(),this}const l=Math.sqrt(c),h=Math.atan2(l,a),d=Math.sin((1-e)*h)/l,m=Math.sin(e*h)/l;return this._w=o*d+this._w*m,this._x=n*d+this._x*m,this._y=s*d+this._y*m,this._z=r*d+this._z*m,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class C{constructor(t=0,e=0,n=0){C.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Ec.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Ec.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,c=t.w,l=2*(o*s-a*n),h=2*(a*e-r*s),d=2*(r*n-o*e);return this.x=e+c*l+o*d-a*h,this.y=n+c*h+a*l-r*d,this.z=s+c*d+r*h-o*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,c=e.z;return this.x=s*c-r*a,this.y=r*o-n*c,this.z=n*a-s*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return vo.copy(this).projectOnVector(t),this.sub(vo)}reflect(t){return this.sub(vo.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(nn(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const vo=new C,Ec=new oi;class ts{constructor(t=new C(1/0,1/0,1/0),e=new C(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(In.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(In.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=In.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,In):In.fromBufferAttribute(r,o),In.applyMatrix4(t.matrixWorld),this.expandByPoint(In);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),xr.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),xr.copy(n.boundingBox)),xr.applyMatrix4(t.matrixWorld),this.union(xr)}const s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,In),In.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter($s),_r.subVectors(this.max,$s),as.subVectors(t.a,$s),cs.subVectors(t.b,$s),ls.subVectors(t.c,$s),mi.subVectors(cs,as),gi.subVectors(ls,cs),Ii.subVectors(as,ls);let e=[0,-mi.z,mi.y,0,-gi.z,gi.y,0,-Ii.z,Ii.y,mi.z,0,-mi.x,gi.z,0,-gi.x,Ii.z,0,-Ii.x,-mi.y,mi.x,0,-gi.y,gi.x,0,-Ii.y,Ii.x,0];return!yo(e,as,cs,ls,_r)||(e=[1,0,0,0,1,0,0,0,1],!yo(e,as,cs,ls,_r))?!1:(vr.crossVectors(mi,gi),e=[vr.x,vr.y,vr.z],yo(e,as,cs,ls,_r))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,In).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(In).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Jn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Jn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Jn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Jn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Jn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Jn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Jn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Jn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Jn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Jn=[new C,new C,new C,new C,new C,new C,new C,new C],In=new C,xr=new ts,as=new C,cs=new C,ls=new C,mi=new C,gi=new C,Ii=new C,$s=new C,_r=new C,vr=new C,Ui=new C;function yo(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){Ui.fromArray(i,r);const a=s.x*Math.abs(Ui.x)+s.y*Math.abs(Ui.y)+s.z*Math.abs(Ui.z),c=t.dot(Ui),l=e.dot(Ui),h=n.dot(Ui);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>a)return!1}return!0}const kd=new ts,Ks=new C,Mo=new C;class Hs{constructor(t=new C,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):kd.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ks.subVectors(t,this.center);const e=Ks.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Ks,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Mo.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ks.copy(t.center).add(Mo)),this.expandByPoint(Ks.copy(t.center).sub(Mo))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const jn=new C,So=new C,yr=new C,xi=new C,wo=new C,Mr=new C,bo=new C;class Jl{constructor(t=new C,e=new C(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,jn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=jn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(jn.copy(this.origin).addScaledVector(this.direction,e),jn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){So.copy(t).add(e).multiplyScalar(.5),yr.copy(e).sub(t).normalize(),xi.copy(this.origin).sub(So);const r=t.distanceTo(e)*.5,o=-this.direction.dot(yr),a=xi.dot(this.direction),c=-xi.dot(yr),l=xi.lengthSq(),h=Math.abs(1-o*o);let d,m,p,x;if(h>0)if(d=o*c-a,m=o*a-c,x=r*h,d>=0)if(m>=-x)if(m<=x){const v=1/h;d*=v,m*=v,p=d*(d+o*m+2*a)+m*(o*d+m+2*c)+l}else m=r,d=Math.max(0,-(o*m+a)),p=-d*d+m*(m+2*c)+l;else m=-r,d=Math.max(0,-(o*m+a)),p=-d*d+m*(m+2*c)+l;else m<=-x?(d=Math.max(0,-(-o*r+a)),m=d>0?-r:Math.min(Math.max(-r,-c),r),p=-d*d+m*(m+2*c)+l):m<=x?(d=0,m=Math.min(Math.max(-r,-c),r),p=m*(m+2*c)+l):(d=Math.max(0,-(o*r+a)),m=d>0?r:Math.min(Math.max(-r,-c),r),p=-d*d+m*(m+2*c)+l);else m=o>0?-r:r,d=Math.max(0,-(o*m+a)),p=-d*d+m*(m+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(So).addScaledVector(yr,m),p}intersectSphere(t,e){jn.subVectors(t.center,this.origin);const n=jn.dot(this.direction),s=jn.dot(jn)-n*n,r=t.radius*t.radius;if(s>r)return null;const o=Math.sqrt(r-s),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,c;const l=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,m=this.origin;return l>=0?(n=(t.min.x-m.x)*l,s=(t.max.x-m.x)*l):(n=(t.max.x-m.x)*l,s=(t.min.x-m.x)*l),h>=0?(r=(t.min.y-m.y)*h,o=(t.max.y-m.y)*h):(r=(t.max.y-m.y)*h,o=(t.min.y-m.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),d>=0?(a=(t.min.z-m.z)*d,c=(t.max.z-m.z)*d):(a=(t.max.z-m.z)*d,c=(t.min.z-m.z)*d),n>c||a>s)||((a>n||n!==n)&&(n=a),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,jn)!==null}intersectTriangle(t,e,n,s,r){wo.subVectors(e,t),Mr.subVectors(n,t),bo.crossVectors(wo,Mr);let o=this.direction.dot(bo),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;xi.subVectors(this.origin,t);const c=a*this.direction.dot(Mr.crossVectors(xi,Mr));if(c<0)return null;const l=a*this.direction.dot(wo.cross(xi));if(l<0||c+l>o)return null;const h=-a*xi.dot(bo);return h<0?null:this.at(h/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class he{constructor(t,e,n,s,r,o,a,c,l,h,d,m,p,x,v,g){he.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,c,l,h,d,m,p,x,v,g)}set(t,e,n,s,r,o,a,c,l,h,d,m,p,x,v,g){const u=this.elements;return u[0]=t,u[4]=e,u[8]=n,u[12]=s,u[1]=r,u[5]=o,u[9]=a,u[13]=c,u[2]=l,u[6]=h,u[10]=d,u[14]=m,u[3]=p,u[7]=x,u[11]=v,u[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new he().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/hs.setFromMatrixColumn(t,0).length(),r=1/hs.setFromMatrixColumn(t,1).length(),o=1/hs.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(s),l=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(t.order==="XYZ"){const m=o*h,p=o*d,x=a*h,v=a*d;e[0]=c*h,e[4]=-c*d,e[8]=l,e[1]=p+x*l,e[5]=m-v*l,e[9]=-a*c,e[2]=v-m*l,e[6]=x+p*l,e[10]=o*c}else if(t.order==="YXZ"){const m=c*h,p=c*d,x=l*h,v=l*d;e[0]=m+v*a,e[4]=x*a-p,e[8]=o*l,e[1]=o*d,e[5]=o*h,e[9]=-a,e[2]=p*a-x,e[6]=v+m*a,e[10]=o*c}else if(t.order==="ZXY"){const m=c*h,p=c*d,x=l*h,v=l*d;e[0]=m-v*a,e[4]=-o*d,e[8]=x+p*a,e[1]=p+x*a,e[5]=o*h,e[9]=v-m*a,e[2]=-o*l,e[6]=a,e[10]=o*c}else if(t.order==="ZYX"){const m=o*h,p=o*d,x=a*h,v=a*d;e[0]=c*h,e[4]=x*l-p,e[8]=m*l+v,e[1]=c*d,e[5]=v*l+m,e[9]=p*l-x,e[2]=-l,e[6]=a*c,e[10]=o*c}else if(t.order==="YZX"){const m=o*c,p=o*l,x=a*c,v=a*l;e[0]=c*h,e[4]=v-m*d,e[8]=x*d+p,e[1]=d,e[5]=o*h,e[9]=-a*h,e[2]=-l*h,e[6]=p*d+x,e[10]=m-v*d}else if(t.order==="XZY"){const m=o*c,p=o*l,x=a*c,v=a*l;e[0]=c*h,e[4]=-d,e[8]=l*h,e[1]=m*d+v,e[5]=o*h,e[9]=p*d-x,e[2]=x*d-p,e[6]=a*h,e[10]=v*d+m}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Hd,t,Gd)}lookAt(t,e,n){const s=this.elements;return yn.subVectors(t,e),yn.lengthSq()===0&&(yn.z=1),yn.normalize(),_i.crossVectors(n,yn),_i.lengthSq()===0&&(Math.abs(n.z)===1?yn.x+=1e-4:yn.z+=1e-4,yn.normalize(),_i.crossVectors(n,yn)),_i.normalize(),Sr.crossVectors(yn,_i),s[0]=_i.x,s[4]=Sr.x,s[8]=yn.x,s[1]=_i.y,s[5]=Sr.y,s[9]=yn.y,s[2]=_i.z,s[6]=Sr.z,s[10]=yn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],h=n[1],d=n[5],m=n[9],p=n[13],x=n[2],v=n[6],g=n[10],u=n[14],S=n[3],A=n[7],w=n[11],B=n[15],D=s[0],N=s[4],F=s[8],T=s[12],M=s[1],I=s[5],H=s[9],V=s[13],$=s[2],st=s[6],tt=s[10],rt=s[14],Y=s[3],yt=s[7],xt=s[11],Ut=s[15];return r[0]=o*D+a*M+c*$+l*Y,r[4]=o*N+a*I+c*st+l*yt,r[8]=o*F+a*H+c*tt+l*xt,r[12]=o*T+a*V+c*rt+l*Ut,r[1]=h*D+d*M+m*$+p*Y,r[5]=h*N+d*I+m*st+p*yt,r[9]=h*F+d*H+m*tt+p*xt,r[13]=h*T+d*V+m*rt+p*Ut,r[2]=x*D+v*M+g*$+u*Y,r[6]=x*N+v*I+g*st+u*yt,r[10]=x*F+v*H+g*tt+u*xt,r[14]=x*T+v*V+g*rt+u*Ut,r[3]=S*D+A*M+w*$+B*Y,r[7]=S*N+A*I+w*st+B*yt,r[11]=S*F+A*H+w*tt+B*xt,r[15]=S*T+A*V+w*rt+B*Ut,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],c=t[9],l=t[13],h=t[2],d=t[6],m=t[10],p=t[14],x=t[3],v=t[7],g=t[11],u=t[15];return x*(+r*c*d-s*l*d-r*a*m+n*l*m+s*a*p-n*c*p)+v*(+e*c*p-e*l*m+r*o*m-s*o*p+s*l*h-r*c*h)+g*(+e*l*d-e*a*p-r*o*d+n*o*p+r*a*h-n*l*h)+u*(-s*a*h-e*c*d+e*a*m+s*o*d-n*o*m+n*c*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8],d=t[9],m=t[10],p=t[11],x=t[12],v=t[13],g=t[14],u=t[15],S=d*g*l-v*m*l+v*c*p-a*g*p-d*c*u+a*m*u,A=x*m*l-h*g*l-x*c*p+o*g*p+h*c*u-o*m*u,w=h*v*l-x*d*l+x*a*p-o*v*p-h*a*u+o*d*u,B=x*d*c-h*v*c-x*a*m+o*v*m+h*a*g-o*d*g,D=e*S+n*A+s*w+r*B;if(D===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const N=1/D;return t[0]=S*N,t[1]=(v*m*r-d*g*r-v*s*p+n*g*p+d*s*u-n*m*u)*N,t[2]=(a*g*r-v*c*r+v*s*l-n*g*l-a*s*u+n*c*u)*N,t[3]=(d*c*r-a*m*r-d*s*l+n*m*l+a*s*p-n*c*p)*N,t[4]=A*N,t[5]=(h*g*r-x*m*r+x*s*p-e*g*p-h*s*u+e*m*u)*N,t[6]=(x*c*r-o*g*r-x*s*l+e*g*l+o*s*u-e*c*u)*N,t[7]=(o*m*r-h*c*r+h*s*l-e*m*l-o*s*p+e*c*p)*N,t[8]=w*N,t[9]=(x*d*r-h*v*r-x*n*p+e*v*p+h*n*u-e*d*u)*N,t[10]=(o*v*r-x*a*r+x*n*l-e*v*l-o*n*u+e*a*u)*N,t[11]=(h*a*r-o*d*r-h*n*l+e*d*l+o*n*p-e*a*p)*N,t[12]=B*N,t[13]=(h*v*s-x*d*s+x*n*m-e*v*m-h*n*g+e*d*g)*N,t[14]=(x*a*s-o*v*s-x*n*c+e*v*c+o*n*g-e*a*g)*N,t[15]=(o*d*s-h*a*s+h*n*c-e*d*c-o*n*m+e*a*m)*N,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,c=t.z,l=r*o,h=r*a;return this.set(l*o+n,l*a-s*c,l*c+s*a,0,l*a+s*c,h*a+n,h*c-s*o,0,l*c-s*a,h*c+s*o,r*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,o=e._y,a=e._z,c=e._w,l=r+r,h=o+o,d=a+a,m=r*l,p=r*h,x=r*d,v=o*h,g=o*d,u=a*d,S=c*l,A=c*h,w=c*d,B=n.x,D=n.y,N=n.z;return s[0]=(1-(v+u))*B,s[1]=(p+w)*B,s[2]=(x-A)*B,s[3]=0,s[4]=(p-w)*D,s[5]=(1-(m+u))*D,s[6]=(g+S)*D,s[7]=0,s[8]=(x+A)*N,s[9]=(g-S)*N,s[10]=(1-(m+v))*N,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=hs.set(s[0],s[1],s[2]).length();const o=hs.set(s[4],s[5],s[6]).length(),a=hs.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],Un.copy(this);const l=1/r,h=1/o,d=1/a;return Un.elements[0]*=l,Un.elements[1]*=l,Un.elements[2]*=l,Un.elements[4]*=h,Un.elements[5]*=h,Un.elements[6]*=h,Un.elements[8]*=d,Un.elements[9]*=d,Un.elements[10]*=d,e.setFromRotationMatrix(Un),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=ri){const c=this.elements,l=2*r/(e-t),h=2*r/(n-s),d=(e+t)/(e-t),m=(n+s)/(n-s);let p,x;if(a===ri)p=-(o+r)/(o-r),x=-2*o*r/(o-r);else if(a===jr)p=-o/(o-r),x=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=h,c[9]=m,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=x,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=ri){const c=this.elements,l=1/(e-t),h=1/(n-s),d=1/(o-r),m=(e+t)*l,p=(n+s)*h;let x,v;if(a===ri)x=(o+r)*d,v=-2*d;else if(a===jr)x=r*d,v=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-m,c[1]=0,c[5]=2*h,c[9]=0,c[13]=-p,c[2]=0,c[6]=0,c[10]=v,c[14]=-x,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const hs=new C,Un=new he,Hd=new C(0,0,0),Gd=new C(1,1,1),_i=new C,Sr=new C,yn=new C,Tc=new he,Ac=new oi;class qn{constructor(t=0,e=0,n=0,s=qn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],o=s[4],a=s[8],c=s[1],l=s[5],h=s[9],d=s[2],m=s[6],p=s[10];switch(e){case"XYZ":this._y=Math.asin(nn(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(m,l),this._z=0);break;case"YXZ":this._x=Math.asin(-nn(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(nn(m,-1,1)),Math.abs(m)<.9999999?(this._y=Math.atan2(-d,p),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-nn(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(m,p),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(nn(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-nn(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(m,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Tc.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Tc,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Ac.setFromEuler(this),this.setFromQuaternion(Ac,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}qn.DEFAULT_ORDER="XYZ";class jl{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Vd=0;const Cc=new C,ds=new oi,Qn=new he,wr=new C,Zs=new C,Wd=new C,Xd=new oi,Rc=new C(1,0,0),Pc=new C(0,1,0),Lc=new C(0,0,1),Dc={type:"added"},qd={type:"removed"},us={type:"childadded",child:null},Eo={type:"childremoved",child:null};class We extends ks{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Vd++}),this.uuid=Ti(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=We.DEFAULT_UP.clone();const t=new C,e=new qn,n=new oi,s=new C(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new he},normalMatrix:{value:new te}}),this.matrix=new he,this.matrixWorld=new he,this.matrixAutoUpdate=We.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=We.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new jl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ds.setFromAxisAngle(t,e),this.quaternion.multiply(ds),this}rotateOnWorldAxis(t,e){return ds.setFromAxisAngle(t,e),this.quaternion.premultiply(ds),this}rotateX(t){return this.rotateOnAxis(Rc,t)}rotateY(t){return this.rotateOnAxis(Pc,t)}rotateZ(t){return this.rotateOnAxis(Lc,t)}translateOnAxis(t,e){return Cc.copy(t).applyQuaternion(this.quaternion),this.position.add(Cc.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Rc,t)}translateY(t){return this.translateOnAxis(Pc,t)}translateZ(t){return this.translateOnAxis(Lc,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Qn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?wr.copy(t):wr.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),Zs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Qn.lookAt(Zs,wr,this.up):Qn.lookAt(wr,Zs,this.up),this.quaternion.setFromRotationMatrix(Qn),s&&(Qn.extractRotation(s.matrixWorld),ds.setFromRotationMatrix(Qn),this.quaternion.premultiply(ds.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Dc),us.child=t,this.dispatchEvent(us),us.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(qd),Eo.child=t,this.dispatchEvent(Eo),Eo.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Qn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Qn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Qn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Dc),us.child=t,this.dispatchEvent(us),us.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Zs,t,Wd),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Zs,Xd,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const c=a.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const d=c[l];r(t.shapes,d)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(t.materials,this.material[c]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const c=this.animations[a];s.animations.push(r(t.animations,c))}}if(e){const a=o(t.geometries),c=o(t.materials),l=o(t.textures),h=o(t.images),d=o(t.shapes),m=o(t.skeletons),p=o(t.animations),x=o(t.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),m.length>0&&(n.skeletons=m),p.length>0&&(n.animations=p),x.length>0&&(n.nodes=x)}return n.object=s,n;function o(a){const c=[];for(const l in a){const h=a[l];delete h.metadata,c.push(h)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}We.DEFAULT_UP=new C(0,1,0);We.DEFAULT_MATRIX_AUTO_UPDATE=!0;We.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Nn=new C,ti=new C,To=new C,ei=new C,fs=new C,ps=new C,Ic=new C,Ao=new C,Co=new C,Ro=new C,Po=new Me,Lo=new Me,Do=new Me;class Rn{constructor(t=new C,e=new C,n=new C){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Nn.subVectors(t,e),s.cross(Nn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Nn.subVectors(s,e),ti.subVectors(n,e),To.subVectors(t,e);const o=Nn.dot(Nn),a=Nn.dot(ti),c=Nn.dot(To),l=ti.dot(ti),h=ti.dot(To),d=o*l-a*a;if(d===0)return r.set(0,0,0),null;const m=1/d,p=(l*c-a*h)*m,x=(o*h-a*c)*m;return r.set(1-p-x,x,p)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,ei)===null?!1:ei.x>=0&&ei.y>=0&&ei.x+ei.y<=1}static getInterpolation(t,e,n,s,r,o,a,c){return this.getBarycoord(t,e,n,s,ei)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,ei.x),c.addScaledVector(o,ei.y),c.addScaledVector(a,ei.z),c)}static getInterpolatedAttribute(t,e,n,s,r,o){return Po.setScalar(0),Lo.setScalar(0),Do.setScalar(0),Po.fromBufferAttribute(t,e),Lo.fromBufferAttribute(t,n),Do.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(Po,r.x),o.addScaledVector(Lo,r.y),o.addScaledVector(Do,r.z),o}static isFrontFacing(t,e,n,s){return Nn.subVectors(n,e),ti.subVectors(t,e),Nn.cross(ti).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Nn.subVectors(this.c,this.b),ti.subVectors(this.a,this.b),Nn.cross(ti).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Rn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Rn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return Rn.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return Rn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Rn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let o,a;fs.subVectors(s,n),ps.subVectors(r,n),Ao.subVectors(t,n);const c=fs.dot(Ao),l=ps.dot(Ao);if(c<=0&&l<=0)return e.copy(n);Co.subVectors(t,s);const h=fs.dot(Co),d=ps.dot(Co);if(h>=0&&d<=h)return e.copy(s);const m=c*d-h*l;if(m<=0&&c>=0&&h<=0)return o=c/(c-h),e.copy(n).addScaledVector(fs,o);Ro.subVectors(t,r);const p=fs.dot(Ro),x=ps.dot(Ro);if(x>=0&&p<=x)return e.copy(r);const v=p*l-c*x;if(v<=0&&l>=0&&x<=0)return a=l/(l-x),e.copy(n).addScaledVector(ps,a);const g=h*x-p*d;if(g<=0&&d-h>=0&&p-x>=0)return Ic.subVectors(r,s),a=(d-h)/(d-h+(p-x)),e.copy(s).addScaledVector(Ic,a);const u=1/(g+v+m);return o=v*u,a=m*u,e.copy(n).addScaledVector(fs,o).addScaledVector(ps,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Ql={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},vi={h:0,s:0,l:0},br={h:0,s:0,l:0};function Io(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class Ht{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=ln){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ce.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=ce.workingColorSpace){return this.r=t,this.g=e,this.b=n,ce.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=ce.workingColorSpace){if(t=Pd(t,1),e=nn(e,0,1),n=nn(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=Io(o,r,t+1/3),this.g=Io(o,r,t),this.b=Io(o,r,t-1/3)}return ce.toWorkingColorSpace(this,s),this}setStyle(t,e=ln){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=ln){const n=Ql[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=ai(t.r),this.g=ai(t.g),this.b=ai(t.b),this}copyLinearToSRGB(t){return this.r=Rs(t.r),this.g=Rs(t.g),this.b=Rs(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=ln){return ce.fromWorkingColorSpace(on.copy(this),t),Math.round(nn(on.r*255,0,255))*65536+Math.round(nn(on.g*255,0,255))*256+Math.round(nn(on.b*255,0,255))}getHexString(t=ln){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ce.workingColorSpace){ce.fromWorkingColorSpace(on.copy(this),e);const n=on.r,s=on.g,r=on.b,o=Math.max(n,s,r),a=Math.min(n,s,r);let c,l;const h=(a+o)/2;if(a===o)c=0,l=0;else{const d=o-a;switch(l=h<=.5?d/(o+a):d/(2-o-a),o){case n:c=(s-r)/d+(s<r?6:0);break;case s:c=(r-n)/d+2;break;case r:c=(n-s)/d+4;break}c/=6}return t.h=c,t.s=l,t.l=h,t}getRGB(t,e=ce.workingColorSpace){return ce.fromWorkingColorSpace(on.copy(this),e),t.r=on.r,t.g=on.g,t.b=on.b,t}getStyle(t=ln){ce.fromWorkingColorSpace(on.copy(this),t);const e=on.r,n=on.g,s=on.b;return t!==ln?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(vi),this.setHSL(vi.h+t,vi.s+e,vi.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(vi),t.getHSL(br);const n=go(vi.h,br.h,e),s=go(vi.s,br.s,e),r=go(vi.l,br.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const on=new Ht;Ht.NAMES=Ql;let Yd=0;class es extends ks{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Yd++}),this.uuid=Ti(),this.name="",this.blending=As,this.side=Ai,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Jo,this.blendDst=jo,this.blendEquation=Gi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ht(0,0,0),this.blendAlpha=0,this.depthFunc=Ls,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=xc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=rs,this.stencilZFail=rs,this.stencilZPass=rs,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==As&&(n.blending=this.blending),this.side!==Ai&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Jo&&(n.blendSrc=this.blendSrc),this.blendDst!==jo&&(n.blendDst=this.blendDst),this.blendEquation!==Gi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ls&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==xc&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==rs&&(n.stencilFail=this.stencilFail),this.stencilZFail!==rs&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==rs&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const o=[];for(const a in r){const c=r[a];delete c.metadata,o.push(c)}return o}if(e){const r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class re extends es{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new Ht(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qn,this.combine=Ul,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const ze=new C,Er=new bt;class un{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Fa,this.updateRanges=[],this.gpuType=Wn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Er.fromBufferAttribute(this,e),Er.applyMatrix3(t),this.setXY(e,Er.x,Er.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)ze.fromBufferAttribute(this,e),ze.applyMatrix3(t),this.setXYZ(e,ze.x,ze.y,ze.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)ze.fromBufferAttribute(this,e),ze.applyMatrix4(t),this.setXYZ(e,ze.x,ze.y,ze.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ze.fromBufferAttribute(this,e),ze.applyNormalMatrix(t),this.setXYZ(e,ze.x,ze.y,ze.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ze.fromBufferAttribute(this,e),ze.transformDirection(t),this.setXYZ(e,ze.x,ze.y,ze.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Gn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=ye(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Gn(e,this.array)),e}setX(t,e){return this.normalized&&(e=ye(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Gn(e,this.array)),e}setY(t,e){return this.normalized&&(e=ye(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Gn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=ye(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Gn(e,this.array)),e}setW(t,e){return this.normalized&&(e=ye(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=ye(e,this.array),n=ye(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=ye(e,this.array),n=ye(n,this.array),s=ye(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=ye(e,this.array),n=ye(n,this.array),s=ye(s,this.array),r=ye(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Fa&&(t.usage=this.usage),t}}class th extends un{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class eh extends un{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Se extends un{constructor(t,e,n){super(new Float32Array(t),e,n)}}let $d=0;const Cn=new he,Uo=new We,ms=new C,Mn=new ts,Js=new ts,Je=new C;class qe extends ks{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:$d++}),this.uuid=Ti(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new($l(t)?eh:th)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new te().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Cn.makeRotationFromQuaternion(t),this.applyMatrix4(Cn),this}rotateX(t){return Cn.makeRotationX(t),this.applyMatrix4(Cn),this}rotateY(t){return Cn.makeRotationY(t),this.applyMatrix4(Cn),this}rotateZ(t){return Cn.makeRotationZ(t),this.applyMatrix4(Cn),this}translate(t,e,n){return Cn.makeTranslation(t,e,n),this.applyMatrix4(Cn),this}scale(t,e,n){return Cn.makeScale(t,e,n),this.applyMatrix4(Cn),this}lookAt(t){return Uo.lookAt(t),Uo.updateMatrix(),this.applyMatrix4(Uo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ms).negate(),this.translate(ms.x,ms.y,ms.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,r=t.length;s<r;s++){const o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Se(n,3))}else{for(let n=0,s=e.count;n<s;n++){const r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ts);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new C(-1/0,-1/0,-1/0),new C(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];Mn.setFromBufferAttribute(r),this.morphTargetsRelative?(Je.addVectors(this.boundingBox.min,Mn.min),this.boundingBox.expandByPoint(Je),Je.addVectors(this.boundingBox.max,Mn.max),this.boundingBox.expandByPoint(Je)):(this.boundingBox.expandByPoint(Mn.min),this.boundingBox.expandByPoint(Mn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Hs);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new C,1/0);return}if(t){const n=this.boundingSphere.center;if(Mn.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){const a=e[r];Js.setFromBufferAttribute(a),this.morphTargetsRelative?(Je.addVectors(Mn.min,Js.min),Mn.expandByPoint(Je),Je.addVectors(Mn.max,Js.max),Mn.expandByPoint(Je)):(Mn.expandByPoint(Js.min),Mn.expandByPoint(Js.max))}Mn.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)Je.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Je));if(e)for(let r=0,o=e.length;r<o;r++){const a=e[r],c=this.morphTargetsRelative;for(let l=0,h=a.count;l<h;l++)Je.fromBufferAttribute(a,l),c&&(ms.fromBufferAttribute(t,l),Je.add(ms)),s=Math.max(s,n.distanceToSquared(Je))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new un(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],c=[];for(let F=0;F<n.count;F++)a[F]=new C,c[F]=new C;const l=new C,h=new C,d=new C,m=new bt,p=new bt,x=new bt,v=new C,g=new C;function u(F,T,M){l.fromBufferAttribute(n,F),h.fromBufferAttribute(n,T),d.fromBufferAttribute(n,M),m.fromBufferAttribute(r,F),p.fromBufferAttribute(r,T),x.fromBufferAttribute(r,M),h.sub(l),d.sub(l),p.sub(m),x.sub(m);const I=1/(p.x*x.y-x.x*p.y);isFinite(I)&&(v.copy(h).multiplyScalar(x.y).addScaledVector(d,-p.y).multiplyScalar(I),g.copy(d).multiplyScalar(p.x).addScaledVector(h,-x.x).multiplyScalar(I),a[F].add(v),a[T].add(v),a[M].add(v),c[F].add(g),c[T].add(g),c[M].add(g))}let S=this.groups;S.length===0&&(S=[{start:0,count:t.count}]);for(let F=0,T=S.length;F<T;++F){const M=S[F],I=M.start,H=M.count;for(let V=I,$=I+H;V<$;V+=3)u(t.getX(V+0),t.getX(V+1),t.getX(V+2))}const A=new C,w=new C,B=new C,D=new C;function N(F){B.fromBufferAttribute(s,F),D.copy(B);const T=a[F];A.copy(T),A.sub(B.multiplyScalar(B.dot(T))).normalize(),w.crossVectors(D,T);const I=w.dot(c[F])<0?-1:1;o.setXYZW(F,A.x,A.y,A.z,I)}for(let F=0,T=S.length;F<T;++F){const M=S[F],I=M.start,H=M.count;for(let V=I,$=I+H;V<$;V+=3)N(t.getX(V+0)),N(t.getX(V+1)),N(t.getX(V+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new un(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let m=0,p=n.count;m<p;m++)n.setXYZ(m,0,0,0);const s=new C,r=new C,o=new C,a=new C,c=new C,l=new C,h=new C,d=new C;if(t)for(let m=0,p=t.count;m<p;m+=3){const x=t.getX(m+0),v=t.getX(m+1),g=t.getX(m+2);s.fromBufferAttribute(e,x),r.fromBufferAttribute(e,v),o.fromBufferAttribute(e,g),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),a.fromBufferAttribute(n,x),c.fromBufferAttribute(n,v),l.fromBufferAttribute(n,g),a.add(h),c.add(h),l.add(h),n.setXYZ(x,a.x,a.y,a.z),n.setXYZ(v,c.x,c.y,c.z),n.setXYZ(g,l.x,l.y,l.z)}else for(let m=0,p=e.count;m<p;m+=3)s.fromBufferAttribute(e,m+0),r.fromBufferAttribute(e,m+1),o.fromBufferAttribute(e,m+2),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),n.setXYZ(m+0,h.x,h.y,h.z),n.setXYZ(m+1,h.x,h.y,h.z),n.setXYZ(m+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Je.fromBufferAttribute(t,e),Je.normalize(),t.setXYZ(e,Je.x,Je.y,Je.z)}toNonIndexed(){function t(a,c){const l=a.array,h=a.itemSize,d=a.normalized,m=new l.constructor(c.length*h);let p=0,x=0;for(let v=0,g=c.length;v<g;v++){a.isInterleavedBufferAttribute?p=c[v]*a.data.stride+a.offset:p=c[v]*h;for(let u=0;u<h;u++)m[x++]=l[p++]}return new un(m,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new qe,n=this.index.array,s=this.attributes;for(const a in s){const c=s[a],l=t(c,n);e.setAttribute(a,l)}const r=this.morphAttributes;for(const a in r){const c=[],l=r[a];for(let h=0,d=l.length;h<d;h++){const m=l[h],p=t(m,n);c.push(p)}e.morphAttributes[a]=c}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,c=o.length;a<c;a++){const l=o[a];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const c in n){const l=n[c];t.data.attributes[c]=l.toJSON(t.data)}const s={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let d=0,m=l.length;d<m;d++){const p=l[d];h.push(p.toJSON(t.data))}h.length>0&&(s[c]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const s=t.attributes;for(const l in s){const h=s[l];this.setAttribute(l,h.clone(e))}const r=t.morphAttributes;for(const l in r){const h=[],d=r[l];for(let m=0,p=d.length;m<p;m++)h.push(d[m].clone(e));this.morphAttributes[l]=h}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let l=0,h=o.length;l<h;l++){const d=o[l];this.addGroup(d.start,d.count,d.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Uc=new he,Ni=new Jl,Tr=new Hs,Nc=new C,Ar=new C,Cr=new C,Rr=new C,No=new C,Pr=new C,Fc=new C,Lr=new C;class K extends We{constructor(t=new qe,e=new re){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const a=this.morphTargetInfluences;if(r&&a){Pr.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const h=a[c],d=r[c];h!==0&&(No.fromBufferAttribute(d,t),o?Pr.addScaledVector(No,h):Pr.addScaledVector(No.sub(e),h))}e.add(Pr)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Tr.copy(n.boundingSphere),Tr.applyMatrix4(r),Ni.copy(t.ray).recast(t.near),!(Tr.containsPoint(Ni.origin)===!1&&(Ni.intersectSphere(Tr,Nc)===null||Ni.origin.distanceToSquared(Nc)>(t.far-t.near)**2))&&(Uc.copy(r).invert(),Ni.copy(t.ray).applyMatrix4(Uc),!(n.boundingBox!==null&&Ni.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Ni)))}_computeIntersections(t,e,n){let s;const r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,m=r.groups,p=r.drawRange;if(a!==null)if(Array.isArray(o))for(let x=0,v=m.length;x<v;x++){const g=m[x],u=o[g.materialIndex],S=Math.max(g.start,p.start),A=Math.min(a.count,Math.min(g.start+g.count,p.start+p.count));for(let w=S,B=A;w<B;w+=3){const D=a.getX(w),N=a.getX(w+1),F=a.getX(w+2);s=Dr(this,u,t,n,l,h,d,D,N,F),s&&(s.faceIndex=Math.floor(w/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{const x=Math.max(0,p.start),v=Math.min(a.count,p.start+p.count);for(let g=x,u=v;g<u;g+=3){const S=a.getX(g),A=a.getX(g+1),w=a.getX(g+2);s=Dr(this,o,t,n,l,h,d,S,A,w),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let x=0,v=m.length;x<v;x++){const g=m[x],u=o[g.materialIndex],S=Math.max(g.start,p.start),A=Math.min(c.count,Math.min(g.start+g.count,p.start+p.count));for(let w=S,B=A;w<B;w+=3){const D=w,N=w+1,F=w+2;s=Dr(this,u,t,n,l,h,d,D,N,F),s&&(s.faceIndex=Math.floor(w/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{const x=Math.max(0,p.start),v=Math.min(c.count,p.start+p.count);for(let g=x,u=v;g<u;g+=3){const S=g,A=g+1,w=g+2;s=Dr(this,o,t,n,l,h,d,S,A,w),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}}}function Kd(i,t,e,n,s,r,o,a){let c;if(t.side===xn?c=n.intersectTriangle(o,r,s,!0,a):c=n.intersectTriangle(s,r,o,t.side===Ai,a),c===null)return null;Lr.copy(a),Lr.applyMatrix4(i.matrixWorld);const l=e.ray.origin.distanceTo(Lr);return l<e.near||l>e.far?null:{distance:l,point:Lr.clone(),object:i}}function Dr(i,t,e,n,s,r,o,a,c,l){i.getVertexPosition(a,Ar),i.getVertexPosition(c,Cr),i.getVertexPosition(l,Rr);const h=Kd(i,t,e,n,Ar,Cr,Rr,Fc);if(h){const d=new C;Rn.getBarycoord(Fc,Ar,Cr,Rr,d),s&&(h.uv=Rn.getInterpolatedAttribute(s,a,c,l,d,new bt)),r&&(h.uv1=Rn.getInterpolatedAttribute(r,a,c,l,d,new bt)),o&&(h.normal=Rn.getInterpolatedAttribute(o,a,c,l,d,new C),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const m={a,b:c,c:l,normal:new C,materialIndex:0};Rn.getNormal(Ar,Cr,Rr,m.normal),h.face=m,h.barycoord=d}return h}class Lt extends qe{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};const a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);const c=[],l=[],h=[],d=[];let m=0,p=0;x("z","y","x",-1,-1,n,e,t,o,r,0),x("z","y","x",1,-1,n,e,-t,o,r,1),x("x","z","y",1,1,t,n,e,s,o,2),x("x","z","y",1,-1,t,n,-e,s,o,3),x("x","y","z",1,-1,t,e,n,s,r,4),x("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new Se(l,3)),this.setAttribute("normal",new Se(h,3)),this.setAttribute("uv",new Se(d,2));function x(v,g,u,S,A,w,B,D,N,F,T){const M=w/N,I=B/F,H=w/2,V=B/2,$=D/2,st=N+1,tt=F+1;let rt=0,Y=0;const yt=new C;for(let xt=0;xt<tt;xt++){const Ut=xt*I-V;for(let Yt=0;Yt<st;Yt++){const Nt=Yt*M-H;yt[v]=Nt*S,yt[g]=Ut*A,yt[u]=$,l.push(yt.x,yt.y,yt.z),yt[v]=0,yt[g]=0,yt[u]=D>0?1:-1,h.push(yt.x,yt.y,yt.z),d.push(Yt/N),d.push(1-xt/F),rt+=1}}for(let xt=0;xt<F;xt++)for(let Ut=0;Ut<N;Ut++){const Yt=m+Ut+st*xt,Nt=m+Ut+st*(xt+1),q=m+(Ut+1)+st*(xt+1),pt=m+(Ut+1)+st*xt;c.push(Yt,Nt,pt),c.push(Nt,q,pt),Y+=6}a.addGroup(p,Y,T),p+=Y,m+=rt}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Lt(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Fs(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function pn(i){const t={};for(let e=0;e<i.length;e++){const n=Fs(i[e]);for(const s in n)t[s]=n[s]}return t}function Zd(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function nh(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ce.workingColorSpace}const Jd={clone:Fs,merge:pn};var jd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Qd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Pn extends es{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=jd,this.fragmentShader=Qd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Fs(t.uniforms),this.uniformsGroups=Zd(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class ih extends We{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new he,this.projectionMatrix=new he,this.projectionMatrixInverse=new he,this.coordinateSystem=ri}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const yi=new C,Oc=new bt,zc=new bt;class Sn extends ih{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Oa*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(mo*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Oa*2*Math.atan(Math.tan(mo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){yi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(yi.x,yi.y).multiplyScalar(-t/yi.z),yi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(yi.x,yi.y).multiplyScalar(-t/yi.z)}getViewSize(t,e){return this.getViewBounds(t,Oc,zc),e.subVectors(zc,Oc)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(mo*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*s/c,e-=o.offsetY*n/l,s*=o.width/c,n*=o.height/l}const a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const gs=-90,xs=1;class tu extends We{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Sn(gs,xs,t,e);s.layers=this.layers,this.add(s);const r=new Sn(gs,xs,t,e);r.layers=this.layers,this.add(r);const o=new Sn(gs,xs,t,e);o.layers=this.layers,this.add(o);const a=new Sn(gs,xs,t,e);a.layers=this.layers,this.add(a);const c=new Sn(gs,xs,t,e);c.layers=this.layers,this.add(c);const l=new Sn(gs,xs,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,c]=e;for(const l of e)this.remove(l);if(t===ri)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===jr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,c,l,h]=this.children,d=t.getRenderTarget(),m=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),x=t.xr.enabled;t.xr.enabled=!1;const v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,c),t.setRenderTarget(n,4,s),t.render(e,l),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(d,m,p),t.xr.enabled=x,n.texture.needsPMREMUpdate=!0}}class sh extends dn{constructor(t,e,n,s,r,o,a,c,l,h){t=t!==void 0?t:[],e=e!==void 0?e:Ds,super(t,e,n,s,r,o,a,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class eu extends Ki{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new sh(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Vn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Lt(5,5,5),r=new Pn({name:"CubemapFromEquirect",uniforms:Fs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:xn,blending:bi});r.uniforms.tEquirect.value=e;const o=new K(s,r),a=e.minFilter;return e.minFilter===Xi&&(e.minFilter=Vn),new tu(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){const r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}}const Fo=new C,nu=new C,iu=new te;class ki{constructor(t=new C(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=Fo.subVectors(n,e).cross(nu.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(Fo),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||iu.getNormalMatrix(t),s=this.coplanarPoint(Fo).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Fi=new Hs,Ir=new C;class ec{constructor(t=new ki,e=new ki,n=new ki,s=new ki,r=new ki,o=new ki){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=ri){const n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],c=s[3],l=s[4],h=s[5],d=s[6],m=s[7],p=s[8],x=s[9],v=s[10],g=s[11],u=s[12],S=s[13],A=s[14],w=s[15];if(n[0].setComponents(c-r,m-l,g-p,w-u).normalize(),n[1].setComponents(c+r,m+l,g+p,w+u).normalize(),n[2].setComponents(c+o,m+h,g+x,w+S).normalize(),n[3].setComponents(c-o,m-h,g-x,w-S).normalize(),n[4].setComponents(c-a,m-d,g-v,w-A).normalize(),e===ri)n[5].setComponents(c+a,m+d,g+v,w+A).normalize();else if(e===jr)n[5].setComponents(a,d,v,A).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Fi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Fi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Fi)}intersectsSprite(t){return Fi.center.set(0,0,0),Fi.radius=.7071067811865476,Fi.applyMatrix4(t.matrixWorld),this.intersectsSphere(Fi)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(Ir.x=s.normal.x>0?t.max.x:t.min.x,Ir.y=s.normal.y>0?t.max.y:t.min.y,Ir.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Ir)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function rh(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function su(i){const t=new WeakMap;function e(a,c){const l=a.array,h=a.usage,d=l.byteLength,m=i.createBuffer();i.bindBuffer(c,m),i.bufferData(c,l,h),a.onUploadCallback();let p;if(l instanceof Float32Array)p=i.FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?p=i.HALF_FLOAT:p=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)p=i.SHORT;else if(l instanceof Uint32Array)p=i.UNSIGNED_INT;else if(l instanceof Int32Array)p=i.INT;else if(l instanceof Int8Array)p=i.BYTE;else if(l instanceof Uint8Array)p=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)p=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:m,type:p,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:d}}function n(a,c,l){const h=c.array,d=c.updateRanges;if(i.bindBuffer(l,a),d.length===0)i.bufferSubData(l,0,h);else{d.sort((p,x)=>p.start-x.start);let m=0;for(let p=1;p<d.length;p++){const x=d[m],v=d[p];v.start<=x.start+x.count+1?x.count=Math.max(x.count,v.start+v.count-x.start):(++m,d[m]=v)}d.length=m+1;for(let p=0,x=d.length;p<x;p++){const v=d[p];i.bufferSubData(l,v.start*h.BYTES_PER_ELEMENT,h,v.start,v.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);const c=t.get(a);c&&(i.deleteBuffer(c.buffer),t.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const l=t.get(a);if(l===void 0)t.set(a,e(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,a,c),l.version=a.version}}return{get:s,remove:r,update:o}}class Fe extends qe{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,o=e/2,a=Math.floor(n),c=Math.floor(s),l=a+1,h=c+1,d=t/a,m=e/c,p=[],x=[],v=[],g=[];for(let u=0;u<h;u++){const S=u*m-o;for(let A=0;A<l;A++){const w=A*d-r;x.push(w,-S,0),v.push(0,0,1),g.push(A/a),g.push(1-u/c)}}for(let u=0;u<c;u++)for(let S=0;S<a;S++){const A=S+l*u,w=S+l*(u+1),B=S+1+l*(u+1),D=S+1+l*u;p.push(A,w,D),p.push(w,B,D)}this.setIndex(p),this.setAttribute("position",new Se(x,3)),this.setAttribute("normal",new Se(v,3)),this.setAttribute("uv",new Se(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Fe(t.width,t.height,t.widthSegments,t.heightSegments)}}var ru=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,ou=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,au=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,cu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,lu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,hu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,du=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,uu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,fu=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,pu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,mu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,gu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,xu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,_u=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,vu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,yu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Mu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Su=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,wu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,bu=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Eu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Tu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Au=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Cu=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Ru=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Pu=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Lu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Du=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Iu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Uu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Nu="gl_FragColor = linearToOutputTexel( gl_FragColor );",Fu=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ou=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,zu=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Bu=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,ku=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Hu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Gu=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Vu=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Wu=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Xu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,qu=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Yu=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,$u=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Ku=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Zu=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Ju=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,ju=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Qu=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,tf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ef=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,nf=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,sf=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,rf=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,of=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,af=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,cf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,lf=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,hf=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,df=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,uf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,ff=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,pf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,mf=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,gf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,xf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,_f=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,vf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,yf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Mf=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Sf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,wf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,bf=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Ef=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Tf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Af=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Cf=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Rf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Pf=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Lf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Df=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,If=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Uf=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Nf=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ff=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Of=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,zf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Bf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,kf=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Hf=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Gf=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Vf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Wf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Xf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,qf=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Yf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,$f=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Kf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Zf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Jf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,jf=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Qf=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,tp=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,ep=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,np=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,ip=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,sp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const rp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,op=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ap=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cp=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,lp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,hp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,dp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,up=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,fp=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,pp=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,mp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,gp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,xp=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,_p=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,vp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,yp=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Mp=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Sp=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wp=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,bp=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ep=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Tp=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Ap=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Cp=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Rp=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Pp=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Lp=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Dp=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ip=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Up=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Np=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Fp=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Op=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,zp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ne={alphahash_fragment:ru,alphahash_pars_fragment:ou,alphamap_fragment:au,alphamap_pars_fragment:cu,alphatest_fragment:lu,alphatest_pars_fragment:hu,aomap_fragment:du,aomap_pars_fragment:uu,batching_pars_vertex:fu,batching_vertex:pu,begin_vertex:mu,beginnormal_vertex:gu,bsdfs:xu,iridescence_fragment:_u,bumpmap_pars_fragment:vu,clipping_planes_fragment:yu,clipping_planes_pars_fragment:Mu,clipping_planes_pars_vertex:Su,clipping_planes_vertex:wu,color_fragment:bu,color_pars_fragment:Eu,color_pars_vertex:Tu,color_vertex:Au,common:Cu,cube_uv_reflection_fragment:Ru,defaultnormal_vertex:Pu,displacementmap_pars_vertex:Lu,displacementmap_vertex:Du,emissivemap_fragment:Iu,emissivemap_pars_fragment:Uu,colorspace_fragment:Nu,colorspace_pars_fragment:Fu,envmap_fragment:Ou,envmap_common_pars_fragment:zu,envmap_pars_fragment:Bu,envmap_pars_vertex:ku,envmap_physical_pars_fragment:Ju,envmap_vertex:Hu,fog_vertex:Gu,fog_pars_vertex:Vu,fog_fragment:Wu,fog_pars_fragment:Xu,gradientmap_pars_fragment:qu,lightmap_pars_fragment:Yu,lights_lambert_fragment:$u,lights_lambert_pars_fragment:Ku,lights_pars_begin:Zu,lights_toon_fragment:ju,lights_toon_pars_fragment:Qu,lights_phong_fragment:tf,lights_phong_pars_fragment:ef,lights_physical_fragment:nf,lights_physical_pars_fragment:sf,lights_fragment_begin:rf,lights_fragment_maps:of,lights_fragment_end:af,logdepthbuf_fragment:cf,logdepthbuf_pars_fragment:lf,logdepthbuf_pars_vertex:hf,logdepthbuf_vertex:df,map_fragment:uf,map_pars_fragment:ff,map_particle_fragment:pf,map_particle_pars_fragment:mf,metalnessmap_fragment:gf,metalnessmap_pars_fragment:xf,morphinstance_vertex:_f,morphcolor_vertex:vf,morphnormal_vertex:yf,morphtarget_pars_vertex:Mf,morphtarget_vertex:Sf,normal_fragment_begin:wf,normal_fragment_maps:bf,normal_pars_fragment:Ef,normal_pars_vertex:Tf,normal_vertex:Af,normalmap_pars_fragment:Cf,clearcoat_normal_fragment_begin:Rf,clearcoat_normal_fragment_maps:Pf,clearcoat_pars_fragment:Lf,iridescence_pars_fragment:Df,opaque_fragment:If,packing:Uf,premultiplied_alpha_fragment:Nf,project_vertex:Ff,dithering_fragment:Of,dithering_pars_fragment:zf,roughnessmap_fragment:Bf,roughnessmap_pars_fragment:kf,shadowmap_pars_fragment:Hf,shadowmap_pars_vertex:Gf,shadowmap_vertex:Vf,shadowmask_pars_fragment:Wf,skinbase_vertex:Xf,skinning_pars_vertex:qf,skinning_vertex:Yf,skinnormal_vertex:$f,specularmap_fragment:Kf,specularmap_pars_fragment:Zf,tonemapping_fragment:Jf,tonemapping_pars_fragment:jf,transmission_fragment:Qf,transmission_pars_fragment:tp,uv_pars_fragment:ep,uv_pars_vertex:np,uv_vertex:ip,worldpos_vertex:sp,background_vert:rp,background_frag:op,backgroundCube_vert:ap,backgroundCube_frag:cp,cube_vert:lp,cube_frag:hp,depth_vert:dp,depth_frag:up,distanceRGBA_vert:fp,distanceRGBA_frag:pp,equirect_vert:mp,equirect_frag:gp,linedashed_vert:xp,linedashed_frag:_p,meshbasic_vert:vp,meshbasic_frag:yp,meshlambert_vert:Mp,meshlambert_frag:Sp,meshmatcap_vert:wp,meshmatcap_frag:bp,meshnormal_vert:Ep,meshnormal_frag:Tp,meshphong_vert:Ap,meshphong_frag:Cp,meshphysical_vert:Rp,meshphysical_frag:Pp,meshtoon_vert:Lp,meshtoon_frag:Dp,points_vert:Ip,points_frag:Up,shadow_vert:Np,shadow_frag:Fp,sprite_vert:Op,sprite_frag:zp},Mt={common:{diffuse:{value:new Ht(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new te},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new te}},envmap:{envMap:{value:null},envMapRotation:{value:new te},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new te}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new te}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new te},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new te},normalScale:{value:new bt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new te},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new te}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new te}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new te}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ht(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ht(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0},uvTransform:{value:new te}},sprite:{diffuse:{value:new Ht(16777215)},opacity:{value:1},center:{value:new bt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new te},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0}}},Hn={basic:{uniforms:pn([Mt.common,Mt.specularmap,Mt.envmap,Mt.aomap,Mt.lightmap,Mt.fog]),vertexShader:ne.meshbasic_vert,fragmentShader:ne.meshbasic_frag},lambert:{uniforms:pn([Mt.common,Mt.specularmap,Mt.envmap,Mt.aomap,Mt.lightmap,Mt.emissivemap,Mt.bumpmap,Mt.normalmap,Mt.displacementmap,Mt.fog,Mt.lights,{emissive:{value:new Ht(0)}}]),vertexShader:ne.meshlambert_vert,fragmentShader:ne.meshlambert_frag},phong:{uniforms:pn([Mt.common,Mt.specularmap,Mt.envmap,Mt.aomap,Mt.lightmap,Mt.emissivemap,Mt.bumpmap,Mt.normalmap,Mt.displacementmap,Mt.fog,Mt.lights,{emissive:{value:new Ht(0)},specular:{value:new Ht(1118481)},shininess:{value:30}}]),vertexShader:ne.meshphong_vert,fragmentShader:ne.meshphong_frag},standard:{uniforms:pn([Mt.common,Mt.envmap,Mt.aomap,Mt.lightmap,Mt.emissivemap,Mt.bumpmap,Mt.normalmap,Mt.displacementmap,Mt.roughnessmap,Mt.metalnessmap,Mt.fog,Mt.lights,{emissive:{value:new Ht(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ne.meshphysical_vert,fragmentShader:ne.meshphysical_frag},toon:{uniforms:pn([Mt.common,Mt.aomap,Mt.lightmap,Mt.emissivemap,Mt.bumpmap,Mt.normalmap,Mt.displacementmap,Mt.gradientmap,Mt.fog,Mt.lights,{emissive:{value:new Ht(0)}}]),vertexShader:ne.meshtoon_vert,fragmentShader:ne.meshtoon_frag},matcap:{uniforms:pn([Mt.common,Mt.bumpmap,Mt.normalmap,Mt.displacementmap,Mt.fog,{matcap:{value:null}}]),vertexShader:ne.meshmatcap_vert,fragmentShader:ne.meshmatcap_frag},points:{uniforms:pn([Mt.points,Mt.fog]),vertexShader:ne.points_vert,fragmentShader:ne.points_frag},dashed:{uniforms:pn([Mt.common,Mt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ne.linedashed_vert,fragmentShader:ne.linedashed_frag},depth:{uniforms:pn([Mt.common,Mt.displacementmap]),vertexShader:ne.depth_vert,fragmentShader:ne.depth_frag},normal:{uniforms:pn([Mt.common,Mt.bumpmap,Mt.normalmap,Mt.displacementmap,{opacity:{value:1}}]),vertexShader:ne.meshnormal_vert,fragmentShader:ne.meshnormal_frag},sprite:{uniforms:pn([Mt.sprite,Mt.fog]),vertexShader:ne.sprite_vert,fragmentShader:ne.sprite_frag},background:{uniforms:{uvTransform:{value:new te},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ne.background_vert,fragmentShader:ne.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new te}},vertexShader:ne.backgroundCube_vert,fragmentShader:ne.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ne.cube_vert,fragmentShader:ne.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ne.equirect_vert,fragmentShader:ne.equirect_frag},distanceRGBA:{uniforms:pn([Mt.common,Mt.displacementmap,{referencePosition:{value:new C},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ne.distanceRGBA_vert,fragmentShader:ne.distanceRGBA_frag},shadow:{uniforms:pn([Mt.lights,Mt.fog,{color:{value:new Ht(0)},opacity:{value:1}}]),vertexShader:ne.shadow_vert,fragmentShader:ne.shadow_frag}};Hn.physical={uniforms:pn([Hn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new te},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new te},clearcoatNormalScale:{value:new bt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new te},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new te},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new te},sheen:{value:0},sheenColor:{value:new Ht(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new te},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new te},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new te},transmissionSamplerSize:{value:new bt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new te},attenuationDistance:{value:0},attenuationColor:{value:new Ht(0)},specularColor:{value:new Ht(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new te},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new te},anisotropyVector:{value:new bt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new te}}]),vertexShader:ne.meshphysical_vert,fragmentShader:ne.meshphysical_frag};const Ur={r:0,b:0,g:0},Oi=new qn,Bp=new he;function kp(i,t,e,n,s,r,o){const a=new Ht(0);let c=r===!0?0:1,l,h,d=null,m=0,p=null;function x(S){let A=S.isScene===!0?S.background:null;return A&&A.isTexture&&(A=(S.backgroundBlurriness>0?e:t).get(A)),A}function v(S){let A=!1;const w=x(S);w===null?u(a,c):w&&w.isColor&&(u(w,1),A=!0);const B=i.xr.getEnvironmentBlendMode();B==="additive"?n.buffers.color.setClear(0,0,0,1,o):B==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||A)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function g(S,A){const w=x(A);w&&(w.isCubeTexture||w.mapping===ro)?(h===void 0&&(h=new K(new Lt(1,1,1),new Pn({name:"BackgroundCubeMaterial",uniforms:Fs(Hn.backgroundCube.uniforms),vertexShader:Hn.backgroundCube.vertexShader,fragmentShader:Hn.backgroundCube.fragmentShader,side:xn,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(B,D,N){this.matrixWorld.copyPosition(N.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Oi.copy(A.backgroundRotation),Oi.x*=-1,Oi.y*=-1,Oi.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(Oi.y*=-1,Oi.z*=-1),h.material.uniforms.envMap.value=w,h.material.uniforms.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=A.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Bp.makeRotationFromEuler(Oi)),h.material.toneMapped=ce.getTransfer(w.colorSpace)!==ve,(d!==w||m!==w.version||p!==i.toneMapping)&&(h.material.needsUpdate=!0,d=w,m=w.version,p=i.toneMapping),h.layers.enableAll(),S.unshift(h,h.geometry,h.material,0,0,null)):w&&w.isTexture&&(l===void 0&&(l=new K(new Fe(2,2),new Pn({name:"BackgroundMaterial",uniforms:Fs(Hn.background.uniforms),vertexShader:Hn.background.vertexShader,fragmentShader:Hn.background.fragmentShader,side:Ai,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(l)),l.material.uniforms.t2D.value=w,l.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,l.material.toneMapped=ce.getTransfer(w.colorSpace)!==ve,w.matrixAutoUpdate===!0&&w.updateMatrix(),l.material.uniforms.uvTransform.value.copy(w.matrix),(d!==w||m!==w.version||p!==i.toneMapping)&&(l.material.needsUpdate=!0,d=w,m=w.version,p=i.toneMapping),l.layers.enableAll(),S.unshift(l,l.geometry,l.material,0,0,null))}function u(S,A){S.getRGB(Ur,nh(i)),n.buffers.color.setClear(Ur.r,Ur.g,Ur.b,A,o)}return{getClearColor:function(){return a},setClearColor:function(S,A=1){a.set(S),c=A,u(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(S){c=S,u(a,c)},render:v,addToRenderList:g}}function Hp(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=m(null);let r=s,o=!1;function a(M,I,H,V,$){let st=!1;const tt=d(V,H,I);r!==tt&&(r=tt,l(r.object)),st=p(M,V,H,$),st&&x(M,V,H,$),$!==null&&t.update($,i.ELEMENT_ARRAY_BUFFER),(st||o)&&(o=!1,w(M,I,H,V),$!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get($).buffer))}function c(){return i.createVertexArray()}function l(M){return i.bindVertexArray(M)}function h(M){return i.deleteVertexArray(M)}function d(M,I,H){const V=H.wireframe===!0;let $=n[M.id];$===void 0&&($={},n[M.id]=$);let st=$[I.id];st===void 0&&(st={},$[I.id]=st);let tt=st[V];return tt===void 0&&(tt=m(c()),st[V]=tt),tt}function m(M){const I=[],H=[],V=[];for(let $=0;$<e;$++)I[$]=0,H[$]=0,V[$]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:I,enabledAttributes:H,attributeDivisors:V,object:M,attributes:{},index:null}}function p(M,I,H,V){const $=r.attributes,st=I.attributes;let tt=0;const rt=H.getAttributes();for(const Y in rt)if(rt[Y].location>=0){const xt=$[Y];let Ut=st[Y];if(Ut===void 0&&(Y==="instanceMatrix"&&M.instanceMatrix&&(Ut=M.instanceMatrix),Y==="instanceColor"&&M.instanceColor&&(Ut=M.instanceColor)),xt===void 0||xt.attribute!==Ut||Ut&&xt.data!==Ut.data)return!0;tt++}return r.attributesNum!==tt||r.index!==V}function x(M,I,H,V){const $={},st=I.attributes;let tt=0;const rt=H.getAttributes();for(const Y in rt)if(rt[Y].location>=0){let xt=st[Y];xt===void 0&&(Y==="instanceMatrix"&&M.instanceMatrix&&(xt=M.instanceMatrix),Y==="instanceColor"&&M.instanceColor&&(xt=M.instanceColor));const Ut={};Ut.attribute=xt,xt&&xt.data&&(Ut.data=xt.data),$[Y]=Ut,tt++}r.attributes=$,r.attributesNum=tt,r.index=V}function v(){const M=r.newAttributes;for(let I=0,H=M.length;I<H;I++)M[I]=0}function g(M){u(M,0)}function u(M,I){const H=r.newAttributes,V=r.enabledAttributes,$=r.attributeDivisors;H[M]=1,V[M]===0&&(i.enableVertexAttribArray(M),V[M]=1),$[M]!==I&&(i.vertexAttribDivisor(M,I),$[M]=I)}function S(){const M=r.newAttributes,I=r.enabledAttributes;for(let H=0,V=I.length;H<V;H++)I[H]!==M[H]&&(i.disableVertexAttribArray(H),I[H]=0)}function A(M,I,H,V,$,st,tt){tt===!0?i.vertexAttribIPointer(M,I,H,$,st):i.vertexAttribPointer(M,I,H,V,$,st)}function w(M,I,H,V){v();const $=V.attributes,st=H.getAttributes(),tt=I.defaultAttributeValues;for(const rt in st){const Y=st[rt];if(Y.location>=0){let yt=$[rt];if(yt===void 0&&(rt==="instanceMatrix"&&M.instanceMatrix&&(yt=M.instanceMatrix),rt==="instanceColor"&&M.instanceColor&&(yt=M.instanceColor)),yt!==void 0){const xt=yt.normalized,Ut=yt.itemSize,Yt=t.get(yt);if(Yt===void 0)continue;const Nt=Yt.buffer,q=Yt.type,pt=Yt.bytesPerElement,Et=q===i.INT||q===i.UNSIGNED_INT||yt.gpuType===$a;if(yt.isInterleavedBufferAttribute){const mt=yt.data,St=mt.stride,Vt=yt.offset;if(mt.isInstancedInterleavedBuffer){for(let $t=0;$t<Y.locationSize;$t++)u(Y.location+$t,mt.meshPerAttribute);M.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=mt.meshPerAttribute*mt.count)}else for(let $t=0;$t<Y.locationSize;$t++)g(Y.location+$t);i.bindBuffer(i.ARRAY_BUFFER,Nt);for(let $t=0;$t<Y.locationSize;$t++)A(Y.location+$t,Ut/Y.locationSize,q,xt,St*pt,(Vt+Ut/Y.locationSize*$t)*pt,Et)}else{if(yt.isInstancedBufferAttribute){for(let mt=0;mt<Y.locationSize;mt++)u(Y.location+mt,yt.meshPerAttribute);M.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=yt.meshPerAttribute*yt.count)}else for(let mt=0;mt<Y.locationSize;mt++)g(Y.location+mt);i.bindBuffer(i.ARRAY_BUFFER,Nt);for(let mt=0;mt<Y.locationSize;mt++)A(Y.location+mt,Ut/Y.locationSize,q,xt,Ut*pt,Ut/Y.locationSize*mt*pt,Et)}}else if(tt!==void 0){const xt=tt[rt];if(xt!==void 0)switch(xt.length){case 2:i.vertexAttrib2fv(Y.location,xt);break;case 3:i.vertexAttrib3fv(Y.location,xt);break;case 4:i.vertexAttrib4fv(Y.location,xt);break;default:i.vertexAttrib1fv(Y.location,xt)}}}}S()}function B(){F();for(const M in n){const I=n[M];for(const H in I){const V=I[H];for(const $ in V)h(V[$].object),delete V[$];delete I[H]}delete n[M]}}function D(M){if(n[M.id]===void 0)return;const I=n[M.id];for(const H in I){const V=I[H];for(const $ in V)h(V[$].object),delete V[$];delete I[H]}delete n[M.id]}function N(M){for(const I in n){const H=n[I];if(H[M.id]===void 0)continue;const V=H[M.id];for(const $ in V)h(V[$].object),delete V[$];delete H[M.id]}}function F(){T(),o=!0,r!==s&&(r=s,l(r.object))}function T(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:F,resetDefaultState:T,dispose:B,releaseStatesOfGeometry:D,releaseStatesOfProgram:N,initAttributes:v,enableAttribute:g,disableUnusedAttributes:S}}function Gp(i,t,e){let n;function s(l){n=l}function r(l,h){i.drawArrays(n,l,h),e.update(h,n,1)}function o(l,h,d){d!==0&&(i.drawArraysInstanced(n,l,h,d),e.update(h,n,d))}function a(l,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,h,0,d);let p=0;for(let x=0;x<d;x++)p+=h[x];e.update(p,n,1)}function c(l,h,d,m){if(d===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let x=0;x<l.length;x++)o(l[x],h[x],m[x]);else{p.multiDrawArraysInstancedWEBGL(n,l,0,h,0,m,0,d);let x=0;for(let v=0;v<d;v++)x+=h[v]*m[v];e.update(x,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function Vp(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const N=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(N.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(N){return!(N!==_n&&n.convert(N)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(N){const F=N===ur&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(N!==di&&n.convert(N)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&N!==Wn&&!F)}function c(N){if(N==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";N="mediump"}return N==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp";const h=c(l);h!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);const d=e.logarithmicDepthBuffer===!0,m=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),p=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),u=i.getParameter(i.MAX_VERTEX_ATTRIBS),S=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),A=i.getParameter(i.MAX_VARYING_VECTORS),w=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),B=x>0,D=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:d,reverseDepthBuffer:m,maxTextures:p,maxVertexTextures:x,maxTextureSize:v,maxCubemapSize:g,maxAttributes:u,maxVertexUniforms:S,maxVaryings:A,maxFragmentUniforms:w,vertexTextures:B,maxSamples:D}}function Wp(i){const t=this;let e=null,n=0,s=!1,r=!1;const o=new ki,a=new te,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(d,m){const p=d.length!==0||m||n!==0||s;return s=m,n=d.length,p},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,m){e=h(d,m,0)},this.setState=function(d,m,p){const x=d.clippingPlanes,v=d.clipIntersection,g=d.clipShadows,u=i.get(d);if(!s||x===null||x.length===0||r&&!g)r?h(null):l();else{const S=r?0:n,A=S*4;let w=u.clippingState||null;c.value=w,w=h(x,m,A,p);for(let B=0;B!==A;++B)w[B]=e[B];u.clippingState=w,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=S}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(d,m,p,x){const v=d!==null?d.length:0;let g=null;if(v!==0){if(g=c.value,x!==!0||g===null){const u=p+v*4,S=m.matrixWorldInverse;a.getNormalMatrix(S),(g===null||g.length<u)&&(g=new Float32Array(u));for(let A=0,w=p;A!==v;++A,w+=4)o.copy(d[A]).applyMatrix4(S,a),o.normal.toArray(g,w),g[w+3]=o.constant}c.value=g,c.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,g}}function Xp(i){let t=new WeakMap;function e(o,a){return a===oa?o.mapping=Ds:a===aa&&(o.mapping=Is),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===oa||a===aa)if(t.has(o)){const c=t.get(o).texture;return e(c,o.mapping)}else{const c=o.image;if(c&&c.height>0){const l=new eu(c.height);return l.fromEquirectangularTexture(i,o),t.set(o,l),o.addEventListener("dispose",s),e(l.texture,o.mapping)}else return null}}return o}function s(o){const a=o.target;a.removeEventListener("dispose",s);const c=t.get(a);c!==void 0&&(t.delete(a),c.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class oh extends ih{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,o=n+t,a=s+e,c=s-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=h*this.view.offsetY,c=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Ts=4,Bc=[.125,.215,.35,.446,.526,.582],Vi=20,Oo=new oh,kc=new Ht;let zo=null,Bo=0,ko=0,Ho=!1;const Hi=(1+Math.sqrt(5))/2,_s=1/Hi,Hc=[new C(-Hi,_s,0),new C(Hi,_s,0),new C(-_s,0,Hi),new C(_s,0,Hi),new C(0,Hi,-_s),new C(0,Hi,_s),new C(-1,1,-1),new C(1,1,-1),new C(-1,1,1),new C(1,1,1)];class Gc{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){zo=this._renderer.getRenderTarget(),Bo=this._renderer.getActiveCubeFace(),ko=this._renderer.getActiveMipmapLevel(),Ho=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Xc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Wc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(zo,Bo,ko),this._renderer.xr.enabled=Ho,t.scissorTest=!1,Nr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ds||t.mapping===Is?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),zo=this._renderer.getRenderTarget(),Bo=this._renderer.getActiveCubeFace(),ko=this._renderer.getActiveMipmapLevel(),Ho=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Vn,minFilter:Vn,generateMipmaps:!1,type:ur,format:_n,colorSpace:Bs,depthBuffer:!1},s=Vc(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Vc(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=qp(r)),this._blurMaterial=Yp(r,t,e)}return s}_compileMaterial(t){const e=new K(this._lodPlanes[0],t);this._renderer.compile(e,Oo)}_sceneToCubeUV(t,e,n,s){const a=new Sn(90,1,e,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,m=h.toneMapping;h.getClearColor(kc),h.toneMapping=Ei,h.autoClear=!1;const p=new re({name:"PMREM.Background",side:xn,depthWrite:!1,depthTest:!1}),x=new K(new Lt,p);let v=!1;const g=t.background;g?g.isColor&&(p.color.copy(g),t.background=null,v=!0):(p.color.copy(kc),v=!0);for(let u=0;u<6;u++){const S=u%3;S===0?(a.up.set(0,c[u],0),a.lookAt(l[u],0,0)):S===1?(a.up.set(0,0,c[u]),a.lookAt(0,l[u],0)):(a.up.set(0,c[u],0),a.lookAt(0,0,l[u]));const A=this._cubeSize;Nr(s,S*A,u>2?A:0,A,A),h.setRenderTarget(s),v&&h.render(x,a),h.render(t,a)}x.geometry.dispose(),x.material.dispose(),h.toneMapping=m,h.autoClear=d,t.background=g}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===Ds||t.mapping===Is;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Xc()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Wc());const r=s?this._cubemapMaterial:this._equirectMaterial,o=new K(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;const c=this._cubeSize;Nr(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(o,Oo)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Hc[(s-r-1)%Hc.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,d=new K(this._lodPlanes[s],l),m=l.uniforms,p=this._sizeLods[n]-1,x=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*Vi-1),v=r/x,g=isFinite(r)?1+Math.floor(h*v):Vi;g>Vi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${Vi}`);const u=[];let S=0;for(let N=0;N<Vi;++N){const F=N/v,T=Math.exp(-F*F/2);u.push(T),N===0?S+=T:N<g&&(S+=2*T)}for(let N=0;N<u.length;N++)u[N]=u[N]/S;m.envMap.value=t.texture,m.samples.value=g,m.weights.value=u,m.latitudinal.value=o==="latitudinal",a&&(m.poleAxis.value=a);const{_lodMax:A}=this;m.dTheta.value=x,m.mipInt.value=A-n;const w=this._sizeLods[s],B=3*w*(s>A-Ts?s-A+Ts:0),D=4*(this._cubeSize-w);Nr(e,B,D,3*w,2*w),c.setRenderTarget(e),c.render(d,Oo)}}function qp(i){const t=[],e=[],n=[];let s=i;const r=i-Ts+1+Bc.length;for(let o=0;o<r;o++){const a=Math.pow(2,s);e.push(a);let c=1/a;o>i-Ts?c=Bc[o-i+Ts-1]:o===0&&(c=0),n.push(c);const l=1/(a-2),h=-l,d=1+l,m=[h,h,d,h,d,d,h,h,d,d,h,d],p=6,x=6,v=3,g=2,u=1,S=new Float32Array(v*x*p),A=new Float32Array(g*x*p),w=new Float32Array(u*x*p);for(let D=0;D<p;D++){const N=D%3*2/3-1,F=D>2?0:-1,T=[N,F,0,N+2/3,F,0,N+2/3,F+1,0,N,F,0,N+2/3,F+1,0,N,F+1,0];S.set(T,v*x*D),A.set(m,g*x*D);const M=[D,D,D,D,D,D];w.set(M,u*x*D)}const B=new qe;B.setAttribute("position",new un(S,v)),B.setAttribute("uv",new un(A,g)),B.setAttribute("faceIndex",new un(w,u)),t.push(B),s>Ts&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Vc(i,t,e){const n=new Ki(i,t,e);return n.texture.mapping=ro,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Nr(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Yp(i,t,e){const n=new Float32Array(Vi),s=new C(0,1,0);return new Pn({name:"SphericalGaussianBlur",defines:{n:Vi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:nc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:bi,depthTest:!1,depthWrite:!1})}function Wc(){return new Pn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:nc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:bi,depthTest:!1,depthWrite:!1})}function Xc(){return new Pn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:nc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:bi,depthTest:!1,depthWrite:!1})}function nc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function $p(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const c=a.mapping,l=c===oa||c===aa,h=c===Ds||c===Is;if(l||h){let d=t.get(a);const m=d!==void 0?d.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==m)return e===null&&(e=new Gc(i)),d=l?e.fromEquirectangular(a,d):e.fromCubemap(a,d),d.texture.pmremVersion=a.pmremVersion,t.set(a,d),d.texture;if(d!==void 0)return d.texture;{const p=a.image;return l&&p&&p.height>0||h&&p&&s(p)?(e===null&&(e=new Gc(i)),d=l?e.fromEquirectangular(a):e.fromCubemap(a),d.texture.pmremVersion=a.pmremVersion,t.set(a,d),a.addEventListener("dispose",r),d.texture):null}}}return a}function s(a){let c=0;const l=6;for(let h=0;h<l;h++)a[h]!==void 0&&c++;return c===l}function r(a){const c=a.target;c.removeEventListener("dispose",r);const l=t.get(c);l!==void 0&&(t.delete(c),l.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function Kp(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&sr("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Zp(i,t,e,n){const s={},r=new WeakMap;function o(d){const m=d.target;m.index!==null&&t.remove(m.index);for(const x in m.attributes)t.remove(m.attributes[x]);for(const x in m.morphAttributes){const v=m.morphAttributes[x];for(let g=0,u=v.length;g<u;g++)t.remove(v[g])}m.removeEventListener("dispose",o),delete s[m.id];const p=r.get(m);p&&(t.remove(p),r.delete(m)),n.releaseStatesOfGeometry(m),m.isInstancedBufferGeometry===!0&&delete m._maxInstanceCount,e.memory.geometries--}function a(d,m){return s[m.id]===!0||(m.addEventListener("dispose",o),s[m.id]=!0,e.memory.geometries++),m}function c(d){const m=d.attributes;for(const x in m)t.update(m[x],i.ARRAY_BUFFER);const p=d.morphAttributes;for(const x in p){const v=p[x];for(let g=0,u=v.length;g<u;g++)t.update(v[g],i.ARRAY_BUFFER)}}function l(d){const m=[],p=d.index,x=d.attributes.position;let v=0;if(p!==null){const S=p.array;v=p.version;for(let A=0,w=S.length;A<w;A+=3){const B=S[A+0],D=S[A+1],N=S[A+2];m.push(B,D,D,N,N,B)}}else if(x!==void 0){const S=x.array;v=x.version;for(let A=0,w=S.length/3-1;A<w;A+=3){const B=A+0,D=A+1,N=A+2;m.push(B,D,D,N,N,B)}}else return;const g=new($l(m)?eh:th)(m,1);g.version=v;const u=r.get(d);u&&t.remove(u),r.set(d,g)}function h(d){const m=r.get(d);if(m){const p=d.index;p!==null&&m.version<p.version&&l(d)}else l(d);return r.get(d)}return{get:a,update:c,getWireframeAttribute:h}}function Jp(i,t,e){let n;function s(m){n=m}let r,o;function a(m){r=m.type,o=m.bytesPerElement}function c(m,p){i.drawElements(n,p,r,m*o),e.update(p,n,1)}function l(m,p,x){x!==0&&(i.drawElementsInstanced(n,p,r,m*o,x),e.update(p,n,x))}function h(m,p,x){if(x===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,p,0,r,m,0,x);let g=0;for(let u=0;u<x;u++)g+=p[u];e.update(g,n,1)}function d(m,p,x,v){if(x===0)return;const g=t.get("WEBGL_multi_draw");if(g===null)for(let u=0;u<m.length;u++)l(m[u]/o,p[u],v[u]);else{g.multiDrawElementsInstancedWEBGL(n,p,0,r,m,0,v,0,x);let u=0;for(let S=0;S<x;S++)u+=p[S]*v[S];e.update(u,n,1)}}this.setMode=s,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function jp(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Qp(i,t,e){const n=new WeakMap,s=new Me;function r(o,a,c){const l=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=h!==void 0?h.length:0;let m=n.get(a);if(m===void 0||m.count!==d){let M=function(){F.dispose(),n.delete(a),a.removeEventListener("dispose",M)};var p=M;m!==void 0&&m.texture.dispose();const x=a.morphAttributes.position!==void 0,v=a.morphAttributes.normal!==void 0,g=a.morphAttributes.color!==void 0,u=a.morphAttributes.position||[],S=a.morphAttributes.normal||[],A=a.morphAttributes.color||[];let w=0;x===!0&&(w=1),v===!0&&(w=2),g===!0&&(w=3);let B=a.attributes.position.count*w,D=1;B>t.maxTextureSize&&(D=Math.ceil(B/t.maxTextureSize),B=t.maxTextureSize);const N=new Float32Array(B*D*4*d),F=new Zl(N,B,D,d);F.type=Wn,F.needsUpdate=!0;const T=w*4;for(let I=0;I<d;I++){const H=u[I],V=S[I],$=A[I],st=B*D*4*I;for(let tt=0;tt<H.count;tt++){const rt=tt*T;x===!0&&(s.fromBufferAttribute(H,tt),N[st+rt+0]=s.x,N[st+rt+1]=s.y,N[st+rt+2]=s.z,N[st+rt+3]=0),v===!0&&(s.fromBufferAttribute(V,tt),N[st+rt+4]=s.x,N[st+rt+5]=s.y,N[st+rt+6]=s.z,N[st+rt+7]=0),g===!0&&(s.fromBufferAttribute($,tt),N[st+rt+8]=s.x,N[st+rt+9]=s.y,N[st+rt+10]=s.z,N[st+rt+11]=$.itemSize===4?s.w:1)}}m={count:d,texture:F,size:new bt(B,D)},n.set(a,m),a.addEventListener("dispose",M)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let x=0;for(let g=0;g<l.length;g++)x+=l[g];const v=a.morphTargetsRelative?1:1-x;c.getUniforms().setValue(i,"morphTargetBaseInfluence",v),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",m.texture,e),c.getUniforms().setValue(i,"morphTargetsTextureSize",m.size)}return{update:r}}function tm(i,t,e,n){let s=new WeakMap;function r(c){const l=n.render.frame,h=c.geometry,d=t.get(c,h);if(s.get(d)!==l&&(t.update(d),s.set(d,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),s.get(c)!==l&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,l))),c.isSkinnedMesh){const m=c.skeleton;s.get(m)!==l&&(m.update(),s.set(m,l))}return d}function o(){s=new WeakMap}function a(c){const l=c.target;l.removeEventListener("dispose",a),e.remove(l.instanceMatrix),l.instanceColor!==null&&e.remove(l.instanceColor)}return{update:r,dispose:o}}class ah extends dn{constructor(t,e,n,s,r,o,a,c,l,h=Cs){if(h!==Cs&&h!==Ns)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===Cs&&(n=$i),n===void 0&&h===Ns&&(n=Us),super(null,s,r,o,a,c,h,n,l),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:Ve,this.minFilter=c!==void 0?c:Ve,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const ch=new dn,qc=new ah(1,1),lh=new Zl,hh=new Bd,dh=new sh,Yc=[],$c=[],Kc=new Float32Array(16),Zc=new Float32Array(9),Jc=new Float32Array(4);function Gs(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=Yc[s];if(r===void 0&&(r=new Float32Array(s),Yc[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function Ye(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function $e(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function ao(i,t){let e=$c[t];e===void 0&&(e=new Int32Array(t),$c[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function em(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function nm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ye(e,t))return;i.uniform2fv(this.addr,t),$e(e,t)}}function im(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ye(e,t))return;i.uniform3fv(this.addr,t),$e(e,t)}}function sm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ye(e,t))return;i.uniform4fv(this.addr,t),$e(e,t)}}function rm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ye(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),$e(e,t)}else{if(Ye(e,n))return;Jc.set(n),i.uniformMatrix2fv(this.addr,!1,Jc),$e(e,n)}}function om(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ye(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),$e(e,t)}else{if(Ye(e,n))return;Zc.set(n),i.uniformMatrix3fv(this.addr,!1,Zc),$e(e,n)}}function am(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ye(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),$e(e,t)}else{if(Ye(e,n))return;Kc.set(n),i.uniformMatrix4fv(this.addr,!1,Kc),$e(e,n)}}function cm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function lm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ye(e,t))return;i.uniform2iv(this.addr,t),$e(e,t)}}function hm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ye(e,t))return;i.uniform3iv(this.addr,t),$e(e,t)}}function dm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ye(e,t))return;i.uniform4iv(this.addr,t),$e(e,t)}}function um(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function fm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ye(e,t))return;i.uniform2uiv(this.addr,t),$e(e,t)}}function pm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ye(e,t))return;i.uniform3uiv(this.addr,t),$e(e,t)}}function mm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ye(e,t))return;i.uniform4uiv(this.addr,t),$e(e,t)}}function gm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(qc.compareFunction=Yl,r=qc):r=ch,e.setTexture2D(t||r,s)}function xm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||hh,s)}function _m(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||dh,s)}function vm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||lh,s)}function ym(i){switch(i){case 5126:return em;case 35664:return nm;case 35665:return im;case 35666:return sm;case 35674:return rm;case 35675:return om;case 35676:return am;case 5124:case 35670:return cm;case 35667:case 35671:return lm;case 35668:case 35672:return hm;case 35669:case 35673:return dm;case 5125:return um;case 36294:return fm;case 36295:return pm;case 36296:return mm;case 35678:case 36198:case 36298:case 36306:case 35682:return gm;case 35679:case 36299:case 36307:return xm;case 35680:case 36300:case 36308:case 36293:return _m;case 36289:case 36303:case 36311:case 36292:return vm}}function Mm(i,t){i.uniform1fv(this.addr,t)}function Sm(i,t){const e=Gs(t,this.size,2);i.uniform2fv(this.addr,e)}function wm(i,t){const e=Gs(t,this.size,3);i.uniform3fv(this.addr,e)}function bm(i,t){const e=Gs(t,this.size,4);i.uniform4fv(this.addr,e)}function Em(i,t){const e=Gs(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Tm(i,t){const e=Gs(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Am(i,t){const e=Gs(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Cm(i,t){i.uniform1iv(this.addr,t)}function Rm(i,t){i.uniform2iv(this.addr,t)}function Pm(i,t){i.uniform3iv(this.addr,t)}function Lm(i,t){i.uniform4iv(this.addr,t)}function Dm(i,t){i.uniform1uiv(this.addr,t)}function Im(i,t){i.uniform2uiv(this.addr,t)}function Um(i,t){i.uniform3uiv(this.addr,t)}function Nm(i,t){i.uniform4uiv(this.addr,t)}function Fm(i,t,e){const n=this.cache,s=t.length,r=ao(e,s);Ye(n,r)||(i.uniform1iv(this.addr,r),$e(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||ch,r[o])}function Om(i,t,e){const n=this.cache,s=t.length,r=ao(e,s);Ye(n,r)||(i.uniform1iv(this.addr,r),$e(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||hh,r[o])}function zm(i,t,e){const n=this.cache,s=t.length,r=ao(e,s);Ye(n,r)||(i.uniform1iv(this.addr,r),$e(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||dh,r[o])}function Bm(i,t,e){const n=this.cache,s=t.length,r=ao(e,s);Ye(n,r)||(i.uniform1iv(this.addr,r),$e(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||lh,r[o])}function km(i){switch(i){case 5126:return Mm;case 35664:return Sm;case 35665:return wm;case 35666:return bm;case 35674:return Em;case 35675:return Tm;case 35676:return Am;case 5124:case 35670:return Cm;case 35667:case 35671:return Rm;case 35668:case 35672:return Pm;case 35669:case 35673:return Lm;case 5125:return Dm;case 36294:return Im;case 36295:return Um;case 36296:return Nm;case 35678:case 36198:case 36298:case 36306:case 35682:return Fm;case 35679:case 36299:case 36307:return Om;case 35680:case 36300:case 36308:case 36293:return zm;case 36289:case 36303:case 36311:case 36292:return Bm}}class Hm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=ym(e.type)}}class Gm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=km(e.type)}}class Vm{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,o=s.length;r!==o;++r){const a=s[r];a.setValue(t,e[a.id],n)}}}const Go=/(\w+)(\])?(\[|\.)?/g;function jc(i,t){i.seq.push(t),i.map[t.id]=t}function Wm(i,t,e){const n=i.name,s=n.length;for(Go.lastIndex=0;;){const r=Go.exec(n),o=Go.lastIndex;let a=r[1];const c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===s){jc(e,l===void 0?new Hm(a,i,t):new Gm(a,i,t));break}else{let d=e.map[a];d===void 0&&(d=new Vm(a),jc(e,d)),e=d}}}class Jr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);Wm(r,o,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){const a=e[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(t,c.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const o=t[s];o.id in e&&n.push(o)}return n}}function Qc(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const Xm=37297;let qm=0;function Ym(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}const tl=new te;function $m(i){ce._getMatrix(tl,ce.workingColorSpace,i);const t=`mat3( ${tl.elements.map(e=>e.toFixed(4))} )`;switch(ce.getTransfer(i)){case oo:return[t,"LinearTransferOETF"];case ve:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function el(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+Ym(i.getShaderSource(t),o)}else return s}function Km(i,t){const e=$m(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function Zm(i,t){let e;switch(t){case fd:e="Linear";break;case pd:e="Reinhard";break;case md:e="Cineon";break;case Nl:e="ACESFilmic";break;case xd:e="AgX";break;case _d:e="Neutral";break;case gd:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const Fr=new C;function Jm(){ce.getLuminanceCoefficients(Fr);const i=Fr.x.toFixed(4),t=Fr.y.toFixed(4),e=Fr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function jm(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(rr).join(`
`)}function Qm(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function t0(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),o=r.name;let a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function rr(i){return i!==""}function nl(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function il(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const e0=/^[ \t]*#include +<([\w\d./]+)>/gm;function za(i){return i.replace(e0,i0)}const n0=new Map;function i0(i,t){let e=ne[t];if(e===void 0){const n=n0.get(t);if(n!==void 0)e=ne[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return za(e)}const s0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function sl(i){return i.replace(s0,r0)}function r0(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function rl(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function o0(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Dl?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Il?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===ii&&(t="SHADOWMAP_TYPE_VSM"),t}function a0(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ds:case Is:t="ENVMAP_TYPE_CUBE";break;case ro:t="ENVMAP_TYPE_CUBE_UV";break}return t}function c0(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Is:t="ENVMAP_MODE_REFRACTION";break}return t}function l0(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Ul:t="ENVMAP_BLENDING_MULTIPLY";break;case dd:t="ENVMAP_BLENDING_MIX";break;case ud:t="ENVMAP_BLENDING_ADD";break}return t}function h0(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function d0(i,t,e,n){const s=i.getContext(),r=e.defines;let o=e.vertexShader,a=e.fragmentShader;const c=o0(e),l=a0(e),h=c0(e),d=l0(e),m=h0(e),p=jm(e),x=Qm(r),v=s.createProgram();let g,u,S=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x].filter(rr).join(`
`),g.length>0&&(g+=`
`),u=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x].filter(rr).join(`
`),u.length>0&&(u+=`
`)):(g=[rl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(rr).join(`
`),u=[rl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",m?"#define CUBEUV_TEXEL_WIDTH "+m.texelWidth:"",m?"#define CUBEUV_TEXEL_HEIGHT "+m.texelHeight:"",m?"#define CUBEUV_MAX_MIP "+m.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Ei?"#define TONE_MAPPING":"",e.toneMapping!==Ei?ne.tonemapping_pars_fragment:"",e.toneMapping!==Ei?Zm("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",ne.colorspace_pars_fragment,Km("linearToOutputTexel",e.outputColorSpace),Jm(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(rr).join(`
`)),o=za(o),o=nl(o,e),o=il(o,e),a=za(a),a=nl(a,e),a=il(a,e),o=sl(o),a=sl(a),e.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,g=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,u=["#define varying in",e.glslVersion===_c?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===_c?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+u);const A=S+g+o,w=S+u+a,B=Qc(s,s.VERTEX_SHADER,A),D=Qc(s,s.FRAGMENT_SHADER,w);s.attachShader(v,B),s.attachShader(v,D),e.index0AttributeName!==void 0?s.bindAttribLocation(v,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function N(I){if(i.debug.checkShaderErrors){const H=s.getProgramInfoLog(v).trim(),V=s.getShaderInfoLog(B).trim(),$=s.getShaderInfoLog(D).trim();let st=!0,tt=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(st=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,v,B,D);else{const rt=el(s,B,"vertex"),Y=el(s,D,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+H+`
`+rt+`
`+Y)}else H!==""?console.warn("THREE.WebGLProgram: Program Info Log:",H):(V===""||$==="")&&(tt=!1);tt&&(I.diagnostics={runnable:st,programLog:H,vertexShader:{log:V,prefix:g},fragmentShader:{log:$,prefix:u}})}s.deleteShader(B),s.deleteShader(D),F=new Jr(s,v),T=t0(s,v)}let F;this.getUniforms=function(){return F===void 0&&N(this),F};let T;this.getAttributes=function(){return T===void 0&&N(this),T};let M=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return M===!1&&(M=s.getProgramParameter(v,Xm)),M},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=qm++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=B,this.fragmentShader=D,this}let u0=0;class f0{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new p0(t),e.set(t,n)),n}}class p0{constructor(t){this.id=u0++,this.code=t,this.usedTimes=0}}function m0(i,t,e,n,s,r,o){const a=new jl,c=new f0,l=new Set,h=[],d=s.logarithmicDepthBuffer,m=s.vertexTextures;let p=s.precision;const x={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(T){return l.add(T),T===0?"uv":`uv${T}`}function g(T,M,I,H,V){const $=H.fog,st=V.geometry,tt=T.isMeshStandardMaterial?H.environment:null,rt=(T.isMeshStandardMaterial?e:t).get(T.envMap||tt),Y=rt&&rt.mapping===ro?rt.image.height:null,yt=x[T.type];T.precision!==null&&(p=s.getMaxPrecision(T.precision),p!==T.precision&&console.warn("THREE.WebGLProgram.getParameters:",T.precision,"not supported, using",p,"instead."));const xt=st.morphAttributes.position||st.morphAttributes.normal||st.morphAttributes.color,Ut=xt!==void 0?xt.length:0;let Yt=0;st.morphAttributes.position!==void 0&&(Yt=1),st.morphAttributes.normal!==void 0&&(Yt=2),st.morphAttributes.color!==void 0&&(Yt=3);let Nt,q,pt,Et;if(yt){const Bt=Hn[yt];Nt=Bt.vertexShader,q=Bt.fragmentShader}else Nt=T.vertexShader,q=T.fragmentShader,c.update(T),pt=c.getVertexShaderID(T),Et=c.getFragmentShaderID(T);const mt=i.getRenderTarget(),St=i.state.buffers.depth.getReversed(),Vt=V.isInstancedMesh===!0,$t=V.isBatchedMesh===!0,fe=!!T.map,Qt=!!T.matcap,de=!!rt,k=!!T.aoMap,Ie=!!T.lightMap,ie=!!T.bumpMap,Kt=!!T.normalMap,Tt=!!T.displacementMap,xe=!!T.emissiveMap,nt=!!T.metalnessMap,E=!!T.roughnessMap,_=T.anisotropy>0,O=T.clearcoat>0,X=T.dispersion>0,Q=T.iridescence>0,j=T.sheen>0,Ft=T.transmission>0,lt=_&&!!T.anisotropyMap,ut=O&&!!T.clearcoatMap,Ct=O&&!!T.clearcoatNormalMap,ot=O&&!!T.clearcoatRoughnessMap,gt=Q&&!!T.iridescenceMap,Ot=Q&&!!T.iridescenceThicknessMap,Gt=j&&!!T.sheenColorMap,ht=j&&!!T.sheenRoughnessMap,Zt=!!T.specularMap,Wt=!!T.specularColorMap,pe=!!T.specularIntensityMap,z=Ft&&!!T.transmissionMap,vt=Ft&&!!T.thicknessMap,J=!!T.gradientMap,at=!!T.alphaMap,At=T.alphaTest>0,wt=!!T.alphaHash,jt=!!T.extensions;let we=Ei;T.toneMapped&&(mt===null||mt.isXRRenderTarget===!0)&&(we=i.toneMapping);const Le={shaderID:yt,shaderType:T.type,shaderName:T.name,vertexShader:Nt,fragmentShader:q,defines:T.defines,customVertexShaderID:pt,customFragmentShaderID:Et,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:p,batching:$t,batchingColor:$t&&V._colorsTexture!==null,instancing:Vt,instancingColor:Vt&&V.instanceColor!==null,instancingMorph:Vt&&V.morphTexture!==null,supportsVertexTextures:m,outputColorSpace:mt===null?i.outputColorSpace:mt.isXRRenderTarget===!0?mt.texture.colorSpace:Bs,alphaToCoverage:!!T.alphaToCoverage,map:fe,matcap:Qt,envMap:de,envMapMode:de&&rt.mapping,envMapCubeUVHeight:Y,aoMap:k,lightMap:Ie,bumpMap:ie,normalMap:Kt,displacementMap:m&&Tt,emissiveMap:xe,normalMapObjectSpace:Kt&&T.normalMapType===Sd,normalMapTangentSpace:Kt&&T.normalMapType===ql,metalnessMap:nt,roughnessMap:E,anisotropy:_,anisotropyMap:lt,clearcoat:O,clearcoatMap:ut,clearcoatNormalMap:Ct,clearcoatRoughnessMap:ot,dispersion:X,iridescence:Q,iridescenceMap:gt,iridescenceThicknessMap:Ot,sheen:j,sheenColorMap:Gt,sheenRoughnessMap:ht,specularMap:Zt,specularColorMap:Wt,specularIntensityMap:pe,transmission:Ft,transmissionMap:z,thicknessMap:vt,gradientMap:J,opaque:T.transparent===!1&&T.blending===As&&T.alphaToCoverage===!1,alphaMap:at,alphaTest:At,alphaHash:wt,combine:T.combine,mapUv:fe&&v(T.map.channel),aoMapUv:k&&v(T.aoMap.channel),lightMapUv:Ie&&v(T.lightMap.channel),bumpMapUv:ie&&v(T.bumpMap.channel),normalMapUv:Kt&&v(T.normalMap.channel),displacementMapUv:Tt&&v(T.displacementMap.channel),emissiveMapUv:xe&&v(T.emissiveMap.channel),metalnessMapUv:nt&&v(T.metalnessMap.channel),roughnessMapUv:E&&v(T.roughnessMap.channel),anisotropyMapUv:lt&&v(T.anisotropyMap.channel),clearcoatMapUv:ut&&v(T.clearcoatMap.channel),clearcoatNormalMapUv:Ct&&v(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ot&&v(T.clearcoatRoughnessMap.channel),iridescenceMapUv:gt&&v(T.iridescenceMap.channel),iridescenceThicknessMapUv:Ot&&v(T.iridescenceThicknessMap.channel),sheenColorMapUv:Gt&&v(T.sheenColorMap.channel),sheenRoughnessMapUv:ht&&v(T.sheenRoughnessMap.channel),specularMapUv:Zt&&v(T.specularMap.channel),specularColorMapUv:Wt&&v(T.specularColorMap.channel),specularIntensityMapUv:pe&&v(T.specularIntensityMap.channel),transmissionMapUv:z&&v(T.transmissionMap.channel),thicknessMapUv:vt&&v(T.thicknessMap.channel),alphaMapUv:at&&v(T.alphaMap.channel),vertexTangents:!!st.attributes.tangent&&(Kt||_),vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!st.attributes.color&&st.attributes.color.itemSize===4,pointsUvs:V.isPoints===!0&&!!st.attributes.uv&&(fe||at),fog:!!$,useFog:T.fog===!0,fogExp2:!!$&&$.isFogExp2,flatShading:T.flatShading===!0,sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:St,skinning:V.isSkinnedMesh===!0,morphTargets:st.morphAttributes.position!==void 0,morphNormals:st.morphAttributes.normal!==void 0,morphColors:st.morphAttributes.color!==void 0,morphTargetsCount:Ut,morphTextureStride:Yt,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:T.dithering,shadowMapEnabled:i.shadowMap.enabled&&I.length>0,shadowMapType:i.shadowMap.type,toneMapping:we,decodeVideoTexture:fe&&T.map.isVideoTexture===!0&&ce.getTransfer(T.map.colorSpace)===ve,decodeVideoTextureEmissive:xe&&T.emissiveMap.isVideoTexture===!0&&ce.getTransfer(T.emissiveMap.colorSpace)===ve,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===le,flipSided:T.side===xn,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:jt&&T.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(jt&&T.extensions.multiDraw===!0||$t)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return Le.vertexUv1s=l.has(1),Le.vertexUv2s=l.has(2),Le.vertexUv3s=l.has(3),l.clear(),Le}function u(T){const M=[];if(T.shaderID?M.push(T.shaderID):(M.push(T.customVertexShaderID),M.push(T.customFragmentShaderID)),T.defines!==void 0)for(const I in T.defines)M.push(I),M.push(T.defines[I]);return T.isRawShaderMaterial===!1&&(S(M,T),A(M,T),M.push(i.outputColorSpace)),M.push(T.customProgramCacheKey),M.join()}function S(T,M){T.push(M.precision),T.push(M.outputColorSpace),T.push(M.envMapMode),T.push(M.envMapCubeUVHeight),T.push(M.mapUv),T.push(M.alphaMapUv),T.push(M.lightMapUv),T.push(M.aoMapUv),T.push(M.bumpMapUv),T.push(M.normalMapUv),T.push(M.displacementMapUv),T.push(M.emissiveMapUv),T.push(M.metalnessMapUv),T.push(M.roughnessMapUv),T.push(M.anisotropyMapUv),T.push(M.clearcoatMapUv),T.push(M.clearcoatNormalMapUv),T.push(M.clearcoatRoughnessMapUv),T.push(M.iridescenceMapUv),T.push(M.iridescenceThicknessMapUv),T.push(M.sheenColorMapUv),T.push(M.sheenRoughnessMapUv),T.push(M.specularMapUv),T.push(M.specularColorMapUv),T.push(M.specularIntensityMapUv),T.push(M.transmissionMapUv),T.push(M.thicknessMapUv),T.push(M.combine),T.push(M.fogExp2),T.push(M.sizeAttenuation),T.push(M.morphTargetsCount),T.push(M.morphAttributeCount),T.push(M.numDirLights),T.push(M.numPointLights),T.push(M.numSpotLights),T.push(M.numSpotLightMaps),T.push(M.numHemiLights),T.push(M.numRectAreaLights),T.push(M.numDirLightShadows),T.push(M.numPointLightShadows),T.push(M.numSpotLightShadows),T.push(M.numSpotLightShadowsWithMaps),T.push(M.numLightProbes),T.push(M.shadowMapType),T.push(M.toneMapping),T.push(M.numClippingPlanes),T.push(M.numClipIntersection),T.push(M.depthPacking)}function A(T,M){a.disableAll(),M.supportsVertexTextures&&a.enable(0),M.instancing&&a.enable(1),M.instancingColor&&a.enable(2),M.instancingMorph&&a.enable(3),M.matcap&&a.enable(4),M.envMap&&a.enable(5),M.normalMapObjectSpace&&a.enable(6),M.normalMapTangentSpace&&a.enable(7),M.clearcoat&&a.enable(8),M.iridescence&&a.enable(9),M.alphaTest&&a.enable(10),M.vertexColors&&a.enable(11),M.vertexAlphas&&a.enable(12),M.vertexUv1s&&a.enable(13),M.vertexUv2s&&a.enable(14),M.vertexUv3s&&a.enable(15),M.vertexTangents&&a.enable(16),M.anisotropy&&a.enable(17),M.alphaHash&&a.enable(18),M.batching&&a.enable(19),M.dispersion&&a.enable(20),M.batchingColor&&a.enable(21),T.push(a.mask),a.disableAll(),M.fog&&a.enable(0),M.useFog&&a.enable(1),M.flatShading&&a.enable(2),M.logarithmicDepthBuffer&&a.enable(3),M.reverseDepthBuffer&&a.enable(4),M.skinning&&a.enable(5),M.morphTargets&&a.enable(6),M.morphNormals&&a.enable(7),M.morphColors&&a.enable(8),M.premultipliedAlpha&&a.enable(9),M.shadowMapEnabled&&a.enable(10),M.doubleSided&&a.enable(11),M.flipSided&&a.enable(12),M.useDepthPacking&&a.enable(13),M.dithering&&a.enable(14),M.transmission&&a.enable(15),M.sheen&&a.enable(16),M.opaque&&a.enable(17),M.pointsUvs&&a.enable(18),M.decodeVideoTexture&&a.enable(19),M.decodeVideoTextureEmissive&&a.enable(20),M.alphaToCoverage&&a.enable(21),T.push(a.mask)}function w(T){const M=x[T.type];let I;if(M){const H=Hn[M];I=Jd.clone(H.uniforms)}else I=T.uniforms;return I}function B(T,M){let I;for(let H=0,V=h.length;H<V;H++){const $=h[H];if($.cacheKey===M){I=$,++I.usedTimes;break}}return I===void 0&&(I=new d0(i,M,T,r),h.push(I)),I}function D(T){if(--T.usedTimes===0){const M=h.indexOf(T);h[M]=h[h.length-1],h.pop(),T.destroy()}}function N(T){c.remove(T)}function F(){c.dispose()}return{getParameters:g,getProgramCacheKey:u,getUniforms:w,acquireProgram:B,releaseProgram:D,releaseShaderCache:N,programs:h,dispose:F}}function g0(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,c){i.get(o)[a]=c}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function x0(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function ol(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function al(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(d,m,p,x,v,g){let u=i[t];return u===void 0?(u={id:d.id,object:d,geometry:m,material:p,groupOrder:x,renderOrder:d.renderOrder,z:v,group:g},i[t]=u):(u.id=d.id,u.object=d,u.geometry=m,u.material=p,u.groupOrder=x,u.renderOrder=d.renderOrder,u.z=v,u.group=g),t++,u}function a(d,m,p,x,v,g){const u=o(d,m,p,x,v,g);p.transmission>0?n.push(u):p.transparent===!0?s.push(u):e.push(u)}function c(d,m,p,x,v,g){const u=o(d,m,p,x,v,g);p.transmission>0?n.unshift(u):p.transparent===!0?s.unshift(u):e.unshift(u)}function l(d,m){e.length>1&&e.sort(d||x0),n.length>1&&n.sort(m||ol),s.length>1&&s.sort(m||ol)}function h(){for(let d=t,m=i.length;d<m;d++){const p=i[d];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:c,finish:h,sort:l}}function _0(){let i=new WeakMap;function t(n,s){const r=i.get(n);let o;return r===void 0?(o=new al,i.set(n,[o])):s>=r.length?(o=new al,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function v0(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new C,color:new Ht};break;case"SpotLight":e={position:new C,direction:new C,color:new Ht,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new C,color:new Ht,distance:0,decay:0};break;case"HemisphereLight":e={direction:new C,skyColor:new Ht,groundColor:new Ht};break;case"RectAreaLight":e={color:new Ht,position:new C,halfWidth:new C,halfHeight:new C};break}return i[t.id]=e,e}}}function y0(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new bt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new bt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new bt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let M0=0;function S0(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function w0(i){const t=new v0,e=y0(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new C);const s=new C,r=new he,o=new he;function a(l){let h=0,d=0,m=0;for(let T=0;T<9;T++)n.probe[T].set(0,0,0);let p=0,x=0,v=0,g=0,u=0,S=0,A=0,w=0,B=0,D=0,N=0;l.sort(S0);for(let T=0,M=l.length;T<M;T++){const I=l[T],H=I.color,V=I.intensity,$=I.distance,st=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)h+=H.r*V,d+=H.g*V,m+=H.b*V;else if(I.isLightProbe){for(let tt=0;tt<9;tt++)n.probe[tt].addScaledVector(I.sh.coefficients[tt],V);N++}else if(I.isDirectionalLight){const tt=t.get(I);if(tt.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){const rt=I.shadow,Y=e.get(I);Y.shadowIntensity=rt.intensity,Y.shadowBias=rt.bias,Y.shadowNormalBias=rt.normalBias,Y.shadowRadius=rt.radius,Y.shadowMapSize=rt.mapSize,n.directionalShadow[p]=Y,n.directionalShadowMap[p]=st,n.directionalShadowMatrix[p]=I.shadow.matrix,S++}n.directional[p]=tt,p++}else if(I.isSpotLight){const tt=t.get(I);tt.position.setFromMatrixPosition(I.matrixWorld),tt.color.copy(H).multiplyScalar(V),tt.distance=$,tt.coneCos=Math.cos(I.angle),tt.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),tt.decay=I.decay,n.spot[v]=tt;const rt=I.shadow;if(I.map&&(n.spotLightMap[B]=I.map,B++,rt.updateMatrices(I),I.castShadow&&D++),n.spotLightMatrix[v]=rt.matrix,I.castShadow){const Y=e.get(I);Y.shadowIntensity=rt.intensity,Y.shadowBias=rt.bias,Y.shadowNormalBias=rt.normalBias,Y.shadowRadius=rt.radius,Y.shadowMapSize=rt.mapSize,n.spotShadow[v]=Y,n.spotShadowMap[v]=st,w++}v++}else if(I.isRectAreaLight){const tt=t.get(I);tt.color.copy(H).multiplyScalar(V),tt.halfWidth.set(I.width*.5,0,0),tt.halfHeight.set(0,I.height*.5,0),n.rectArea[g]=tt,g++}else if(I.isPointLight){const tt=t.get(I);if(tt.color.copy(I.color).multiplyScalar(I.intensity),tt.distance=I.distance,tt.decay=I.decay,I.castShadow){const rt=I.shadow,Y=e.get(I);Y.shadowIntensity=rt.intensity,Y.shadowBias=rt.bias,Y.shadowNormalBias=rt.normalBias,Y.shadowRadius=rt.radius,Y.shadowMapSize=rt.mapSize,Y.shadowCameraNear=rt.camera.near,Y.shadowCameraFar=rt.camera.far,n.pointShadow[x]=Y,n.pointShadowMap[x]=st,n.pointShadowMatrix[x]=I.shadow.matrix,A++}n.point[x]=tt,x++}else if(I.isHemisphereLight){const tt=t.get(I);tt.skyColor.copy(I.color).multiplyScalar(V),tt.groundColor.copy(I.groundColor).multiplyScalar(V),n.hemi[u]=tt,u++}}g>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Mt.LTC_FLOAT_1,n.rectAreaLTC2=Mt.LTC_FLOAT_2):(n.rectAreaLTC1=Mt.LTC_HALF_1,n.rectAreaLTC2=Mt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=m;const F=n.hash;(F.directionalLength!==p||F.pointLength!==x||F.spotLength!==v||F.rectAreaLength!==g||F.hemiLength!==u||F.numDirectionalShadows!==S||F.numPointShadows!==A||F.numSpotShadows!==w||F.numSpotMaps!==B||F.numLightProbes!==N)&&(n.directional.length=p,n.spot.length=v,n.rectArea.length=g,n.point.length=x,n.hemi.length=u,n.directionalShadow.length=S,n.directionalShadowMap.length=S,n.pointShadow.length=A,n.pointShadowMap.length=A,n.spotShadow.length=w,n.spotShadowMap.length=w,n.directionalShadowMatrix.length=S,n.pointShadowMatrix.length=A,n.spotLightMatrix.length=w+B-D,n.spotLightMap.length=B,n.numSpotLightShadowsWithMaps=D,n.numLightProbes=N,F.directionalLength=p,F.pointLength=x,F.spotLength=v,F.rectAreaLength=g,F.hemiLength=u,F.numDirectionalShadows=S,F.numPointShadows=A,F.numSpotShadows=w,F.numSpotMaps=B,F.numLightProbes=N,n.version=M0++)}function c(l,h){let d=0,m=0,p=0,x=0,v=0;const g=h.matrixWorldInverse;for(let u=0,S=l.length;u<S;u++){const A=l[u];if(A.isDirectionalLight){const w=n.directional[d];w.direction.setFromMatrixPosition(A.matrixWorld),s.setFromMatrixPosition(A.target.matrixWorld),w.direction.sub(s),w.direction.transformDirection(g),d++}else if(A.isSpotLight){const w=n.spot[p];w.position.setFromMatrixPosition(A.matrixWorld),w.position.applyMatrix4(g),w.direction.setFromMatrixPosition(A.matrixWorld),s.setFromMatrixPosition(A.target.matrixWorld),w.direction.sub(s),w.direction.transformDirection(g),p++}else if(A.isRectAreaLight){const w=n.rectArea[x];w.position.setFromMatrixPosition(A.matrixWorld),w.position.applyMatrix4(g),o.identity(),r.copy(A.matrixWorld),r.premultiply(g),o.extractRotation(r),w.halfWidth.set(A.width*.5,0,0),w.halfHeight.set(0,A.height*.5,0),w.halfWidth.applyMatrix4(o),w.halfHeight.applyMatrix4(o),x++}else if(A.isPointLight){const w=n.point[m];w.position.setFromMatrixPosition(A.matrixWorld),w.position.applyMatrix4(g),m++}else if(A.isHemisphereLight){const w=n.hemi[v];w.direction.setFromMatrixPosition(A.matrixWorld),w.direction.transformDirection(g),v++}}}return{setup:a,setupView:c,state:n}}function cl(i){const t=new w0(i),e=[],n=[];function s(h){l.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function o(h){n.push(h)}function a(){t.setup(e)}function c(h){t.setupView(e,h)}const l={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:l,setupLights:a,setupLightsView:c,pushLight:r,pushShadow:o}}function b0(i){let t=new WeakMap;function e(s,r=0){const o=t.get(s);let a;return o===void 0?(a=new cl(i),t.set(s,[a])):r>=o.length?(a=new cl(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}class E0 extends es{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=yd,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class T0 extends es{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const A0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,C0=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function R0(i,t,e){let n=new ec;const s=new bt,r=new bt,o=new Me,a=new E0({depthPacking:Md}),c=new T0,l={},h=e.maxTextureSize,d={[Ai]:xn,[xn]:Ai,[le]:le},m=new Pn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new bt},radius:{value:4}},vertexShader:A0,fragmentShader:C0}),p=m.clone();p.defines.HORIZONTAL_PASS=1;const x=new qe;x.setAttribute("position",new un(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new K(x,m),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Dl;let u=this.type;this.render=function(D,N,F){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||D.length===0)return;const T=i.getRenderTarget(),M=i.getActiveCubeFace(),I=i.getActiveMipmapLevel(),H=i.state;H.setBlending(bi),H.buffers.color.setClear(1,1,1,1),H.buffers.depth.setTest(!0),H.setScissorTest(!1);const V=u!==ii&&this.type===ii,$=u===ii&&this.type!==ii;for(let st=0,tt=D.length;st<tt;st++){const rt=D[st],Y=rt.shadow;if(Y===void 0){console.warn("THREE.WebGLShadowMap:",rt,"has no shadow.");continue}if(Y.autoUpdate===!1&&Y.needsUpdate===!1)continue;s.copy(Y.mapSize);const yt=Y.getFrameExtents();if(s.multiply(yt),r.copy(Y.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/yt.x),s.x=r.x*yt.x,Y.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/yt.y),s.y=r.y*yt.y,Y.mapSize.y=r.y)),Y.map===null||V===!0||$===!0){const Ut=this.type!==ii?{minFilter:Ve,magFilter:Ve}:{};Y.map!==null&&Y.map.dispose(),Y.map=new Ki(s.x,s.y,Ut),Y.map.texture.name=rt.name+".shadowMap",Y.camera.updateProjectionMatrix()}i.setRenderTarget(Y.map),i.clear();const xt=Y.getViewportCount();for(let Ut=0;Ut<xt;Ut++){const Yt=Y.getViewport(Ut);o.set(r.x*Yt.x,r.y*Yt.y,r.x*Yt.z,r.y*Yt.w),H.viewport(o),Y.updateMatrices(rt,Ut),n=Y.getFrustum(),w(N,F,Y.camera,rt,this.type)}Y.isPointLightShadow!==!0&&this.type===ii&&S(Y,F),Y.needsUpdate=!1}u=this.type,g.needsUpdate=!1,i.setRenderTarget(T,M,I)};function S(D,N){const F=t.update(v);m.defines.VSM_SAMPLES!==D.blurSamples&&(m.defines.VSM_SAMPLES=D.blurSamples,p.defines.VSM_SAMPLES=D.blurSamples,m.needsUpdate=!0,p.needsUpdate=!0),D.mapPass===null&&(D.mapPass=new Ki(s.x,s.y)),m.uniforms.shadow_pass.value=D.map.texture,m.uniforms.resolution.value=D.mapSize,m.uniforms.radius.value=D.radius,i.setRenderTarget(D.mapPass),i.clear(),i.renderBufferDirect(N,null,F,m,v,null),p.uniforms.shadow_pass.value=D.mapPass.texture,p.uniforms.resolution.value=D.mapSize,p.uniforms.radius.value=D.radius,i.setRenderTarget(D.map),i.clear(),i.renderBufferDirect(N,null,F,p,v,null)}function A(D,N,F,T){let M=null;const I=F.isPointLight===!0?D.customDistanceMaterial:D.customDepthMaterial;if(I!==void 0)M=I;else if(M=F.isPointLight===!0?c:a,i.localClippingEnabled&&N.clipShadows===!0&&Array.isArray(N.clippingPlanes)&&N.clippingPlanes.length!==0||N.displacementMap&&N.displacementScale!==0||N.alphaMap&&N.alphaTest>0||N.map&&N.alphaTest>0){const H=M.uuid,V=N.uuid;let $=l[H];$===void 0&&($={},l[H]=$);let st=$[V];st===void 0&&(st=M.clone(),$[V]=st,N.addEventListener("dispose",B)),M=st}if(M.visible=N.visible,M.wireframe=N.wireframe,T===ii?M.side=N.shadowSide!==null?N.shadowSide:N.side:M.side=N.shadowSide!==null?N.shadowSide:d[N.side],M.alphaMap=N.alphaMap,M.alphaTest=N.alphaTest,M.map=N.map,M.clipShadows=N.clipShadows,M.clippingPlanes=N.clippingPlanes,M.clipIntersection=N.clipIntersection,M.displacementMap=N.displacementMap,M.displacementScale=N.displacementScale,M.displacementBias=N.displacementBias,M.wireframeLinewidth=N.wireframeLinewidth,M.linewidth=N.linewidth,F.isPointLight===!0&&M.isMeshDistanceMaterial===!0){const H=i.properties.get(M);H.light=F}return M}function w(D,N,F,T,M){if(D.visible===!1)return;if(D.layers.test(N.layers)&&(D.isMesh||D.isLine||D.isPoints)&&(D.castShadow||D.receiveShadow&&M===ii)&&(!D.frustumCulled||n.intersectsObject(D))){D.modelViewMatrix.multiplyMatrices(F.matrixWorldInverse,D.matrixWorld);const V=t.update(D),$=D.material;if(Array.isArray($)){const st=V.groups;for(let tt=0,rt=st.length;tt<rt;tt++){const Y=st[tt],yt=$[Y.materialIndex];if(yt&&yt.visible){const xt=A(D,yt,T,M);D.onBeforeShadow(i,D,N,F,V,xt,Y),i.renderBufferDirect(F,null,V,xt,D,Y),D.onAfterShadow(i,D,N,F,V,xt,Y)}}}else if($.visible){const st=A(D,$,T,M);D.onBeforeShadow(i,D,N,F,V,st,null),i.renderBufferDirect(F,null,V,st,D,null),D.onAfterShadow(i,D,N,F,V,st,null)}}const H=D.children;for(let V=0,$=H.length;V<$;V++)w(H[V],N,F,T,M)}function B(D){D.target.removeEventListener("dispose",B);for(const F in l){const T=l[F],M=D.target.uuid;M in T&&(T[M].dispose(),delete T[M])}}}const P0={[Qo]:ta,[ea]:sa,[na]:ra,[Ls]:ia,[ta]:Qo,[sa]:ea,[ra]:na,[ia]:Ls};function L0(i,t){function e(){let z=!1;const vt=new Me;let J=null;const at=new Me(0,0,0,0);return{setMask:function(At){J!==At&&!z&&(i.colorMask(At,At,At,At),J=At)},setLocked:function(At){z=At},setClear:function(At,wt,jt,we,Le){Le===!0&&(At*=we,wt*=we,jt*=we),vt.set(At,wt,jt,we),at.equals(vt)===!1&&(i.clearColor(At,wt,jt,we),at.copy(vt))},reset:function(){z=!1,J=null,at.set(-1,0,0,0)}}}function n(){let z=!1,vt=!1,J=null,at=null,At=null;return{setReversed:function(wt){if(vt!==wt){const jt=t.get("EXT_clip_control");vt?jt.clipControlEXT(jt.LOWER_LEFT_EXT,jt.ZERO_TO_ONE_EXT):jt.clipControlEXT(jt.LOWER_LEFT_EXT,jt.NEGATIVE_ONE_TO_ONE_EXT);const we=At;At=null,this.setClear(we)}vt=wt},getReversed:function(){return vt},setTest:function(wt){wt?mt(i.DEPTH_TEST):St(i.DEPTH_TEST)},setMask:function(wt){J!==wt&&!z&&(i.depthMask(wt),J=wt)},setFunc:function(wt){if(vt&&(wt=P0[wt]),at!==wt){switch(wt){case Qo:i.depthFunc(i.NEVER);break;case ta:i.depthFunc(i.ALWAYS);break;case ea:i.depthFunc(i.LESS);break;case Ls:i.depthFunc(i.LEQUAL);break;case na:i.depthFunc(i.EQUAL);break;case ia:i.depthFunc(i.GEQUAL);break;case sa:i.depthFunc(i.GREATER);break;case ra:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}at=wt}},setLocked:function(wt){z=wt},setClear:function(wt){At!==wt&&(vt&&(wt=1-wt),i.clearDepth(wt),At=wt)},reset:function(){z=!1,J=null,at=null,At=null,vt=!1}}}function s(){let z=!1,vt=null,J=null,at=null,At=null,wt=null,jt=null,we=null,Le=null;return{setTest:function(Bt){z||(Bt?mt(i.STENCIL_TEST):St(i.STENCIL_TEST))},setMask:function(Bt){vt!==Bt&&!z&&(i.stencilMask(Bt),vt=Bt)},setFunc:function(Bt,Qe,En){(J!==Bt||at!==Qe||At!==En)&&(i.stencilFunc(Bt,Qe,En),J=Bt,at=Qe,At=En)},setOp:function(Bt,Qe,En){(wt!==Bt||jt!==Qe||we!==En)&&(i.stencilOp(Bt,Qe,En),wt=Bt,jt=Qe,we=En)},setLocked:function(Bt){z=Bt},setClear:function(Bt){Le!==Bt&&(i.clearStencil(Bt),Le=Bt)},reset:function(){z=!1,vt=null,J=null,at=null,At=null,wt=null,jt=null,we=null,Le=null}}}const r=new e,o=new n,a=new s,c=new WeakMap,l=new WeakMap;let h={},d={},m=new WeakMap,p=[],x=null,v=!1,g=null,u=null,S=null,A=null,w=null,B=null,D=null,N=new Ht(0,0,0),F=0,T=!1,M=null,I=null,H=null,V=null,$=null;const st=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let tt=!1,rt=0;const Y=i.getParameter(i.VERSION);Y.indexOf("WebGL")!==-1?(rt=parseFloat(/^WebGL (\d)/.exec(Y)[1]),tt=rt>=1):Y.indexOf("OpenGL ES")!==-1&&(rt=parseFloat(/^OpenGL ES (\d)/.exec(Y)[1]),tt=rt>=2);let yt=null,xt={};const Ut=i.getParameter(i.SCISSOR_BOX),Yt=i.getParameter(i.VIEWPORT),Nt=new Me().fromArray(Ut),q=new Me().fromArray(Yt);function pt(z,vt,J,at){const At=new Uint8Array(4),wt=i.createTexture();i.bindTexture(z,wt),i.texParameteri(z,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(z,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let jt=0;jt<J;jt++)z===i.TEXTURE_3D||z===i.TEXTURE_2D_ARRAY?i.texImage3D(vt,0,i.RGBA,1,1,at,0,i.RGBA,i.UNSIGNED_BYTE,At):i.texImage2D(vt+jt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,At);return wt}const Et={};Et[i.TEXTURE_2D]=pt(i.TEXTURE_2D,i.TEXTURE_2D,1),Et[i.TEXTURE_CUBE_MAP]=pt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Et[i.TEXTURE_2D_ARRAY]=pt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Et[i.TEXTURE_3D]=pt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),mt(i.DEPTH_TEST),o.setFunc(Ls),ie(!1),Kt(pc),mt(i.CULL_FACE),k(bi);function mt(z){h[z]!==!0&&(i.enable(z),h[z]=!0)}function St(z){h[z]!==!1&&(i.disable(z),h[z]=!1)}function Vt(z,vt){return d[z]!==vt?(i.bindFramebuffer(z,vt),d[z]=vt,z===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=vt),z===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=vt),!0):!1}function $t(z,vt){let J=p,at=!1;if(z){J=m.get(vt),J===void 0&&(J=[],m.set(vt,J));const At=z.textures;if(J.length!==At.length||J[0]!==i.COLOR_ATTACHMENT0){for(let wt=0,jt=At.length;wt<jt;wt++)J[wt]=i.COLOR_ATTACHMENT0+wt;J.length=At.length,at=!0}}else J[0]!==i.BACK&&(J[0]=i.BACK,at=!0);at&&i.drawBuffers(J)}function fe(z){return x!==z?(i.useProgram(z),x=z,!0):!1}const Qt={[Gi]:i.FUNC_ADD,[$h]:i.FUNC_SUBTRACT,[Kh]:i.FUNC_REVERSE_SUBTRACT};Qt[Zh]=i.MIN,Qt[Jh]=i.MAX;const de={[jh]:i.ZERO,[Qh]:i.ONE,[td]:i.SRC_COLOR,[Jo]:i.SRC_ALPHA,[od]:i.SRC_ALPHA_SATURATE,[sd]:i.DST_COLOR,[nd]:i.DST_ALPHA,[ed]:i.ONE_MINUS_SRC_COLOR,[jo]:i.ONE_MINUS_SRC_ALPHA,[rd]:i.ONE_MINUS_DST_COLOR,[id]:i.ONE_MINUS_DST_ALPHA,[ad]:i.CONSTANT_COLOR,[cd]:i.ONE_MINUS_CONSTANT_COLOR,[ld]:i.CONSTANT_ALPHA,[hd]:i.ONE_MINUS_CONSTANT_ALPHA};function k(z,vt,J,at,At,wt,jt,we,Le,Bt){if(z===bi){v===!0&&(St(i.BLEND),v=!1);return}if(v===!1&&(mt(i.BLEND),v=!0),z!==Yh){if(z!==g||Bt!==T){if((u!==Gi||w!==Gi)&&(i.blendEquation(i.FUNC_ADD),u=Gi,w=Gi),Bt)switch(z){case As:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ge:i.blendFunc(i.ONE,i.ONE);break;case mc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case gc:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",z);break}else switch(z){case As:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ge:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case mc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case gc:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",z);break}S=null,A=null,B=null,D=null,N.set(0,0,0),F=0,g=z,T=Bt}return}At=At||vt,wt=wt||J,jt=jt||at,(vt!==u||At!==w)&&(i.blendEquationSeparate(Qt[vt],Qt[At]),u=vt,w=At),(J!==S||at!==A||wt!==B||jt!==D)&&(i.blendFuncSeparate(de[J],de[at],de[wt],de[jt]),S=J,A=at,B=wt,D=jt),(we.equals(N)===!1||Le!==F)&&(i.blendColor(we.r,we.g,we.b,Le),N.copy(we),F=Le),g=z,T=!1}function Ie(z,vt){z.side===le?St(i.CULL_FACE):mt(i.CULL_FACE);let J=z.side===xn;vt&&(J=!J),ie(J),z.blending===As&&z.transparent===!1?k(bi):k(z.blending,z.blendEquation,z.blendSrc,z.blendDst,z.blendEquationAlpha,z.blendSrcAlpha,z.blendDstAlpha,z.blendColor,z.blendAlpha,z.premultipliedAlpha),o.setFunc(z.depthFunc),o.setTest(z.depthTest),o.setMask(z.depthWrite),r.setMask(z.colorWrite);const at=z.stencilWrite;a.setTest(at),at&&(a.setMask(z.stencilWriteMask),a.setFunc(z.stencilFunc,z.stencilRef,z.stencilFuncMask),a.setOp(z.stencilFail,z.stencilZFail,z.stencilZPass)),xe(z.polygonOffset,z.polygonOffsetFactor,z.polygonOffsetUnits),z.alphaToCoverage===!0?mt(i.SAMPLE_ALPHA_TO_COVERAGE):St(i.SAMPLE_ALPHA_TO_COVERAGE)}function ie(z){M!==z&&(z?i.frontFace(i.CW):i.frontFace(i.CCW),M=z)}function Kt(z){z!==Xh?(mt(i.CULL_FACE),z!==I&&(z===pc?i.cullFace(i.BACK):z===qh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):St(i.CULL_FACE),I=z}function Tt(z){z!==H&&(tt&&i.lineWidth(z),H=z)}function xe(z,vt,J){z?(mt(i.POLYGON_OFFSET_FILL),(V!==vt||$!==J)&&(i.polygonOffset(vt,J),V=vt,$=J)):St(i.POLYGON_OFFSET_FILL)}function nt(z){z?mt(i.SCISSOR_TEST):St(i.SCISSOR_TEST)}function E(z){z===void 0&&(z=i.TEXTURE0+st-1),yt!==z&&(i.activeTexture(z),yt=z)}function _(z,vt,J){J===void 0&&(yt===null?J=i.TEXTURE0+st-1:J=yt);let at=xt[J];at===void 0&&(at={type:void 0,texture:void 0},xt[J]=at),(at.type!==z||at.texture!==vt)&&(yt!==J&&(i.activeTexture(J),yt=J),i.bindTexture(z,vt||Et[z]),at.type=z,at.texture=vt)}function O(){const z=xt[yt];z!==void 0&&z.type!==void 0&&(i.bindTexture(z.type,null),z.type=void 0,z.texture=void 0)}function X(){try{i.compressedTexImage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Q(){try{i.compressedTexImage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function j(){try{i.texSubImage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Ft(){try{i.texSubImage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function lt(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function ut(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Ct(){try{i.texStorage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function ot(){try{i.texStorage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function gt(){try{i.texImage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Ot(){try{i.texImage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Gt(z){Nt.equals(z)===!1&&(i.scissor(z.x,z.y,z.z,z.w),Nt.copy(z))}function ht(z){q.equals(z)===!1&&(i.viewport(z.x,z.y,z.z,z.w),q.copy(z))}function Zt(z,vt){let J=l.get(vt);J===void 0&&(J=new WeakMap,l.set(vt,J));let at=J.get(z);at===void 0&&(at=i.getUniformBlockIndex(vt,z.name),J.set(z,at))}function Wt(z,vt){const at=l.get(vt).get(z);c.get(vt)!==at&&(i.uniformBlockBinding(vt,at,z.__bindingPointIndex),c.set(vt,at))}function pe(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},yt=null,xt={},d={},m=new WeakMap,p=[],x=null,v=!1,g=null,u=null,S=null,A=null,w=null,B=null,D=null,N=new Ht(0,0,0),F=0,T=!1,M=null,I=null,H=null,V=null,$=null,Nt.set(0,0,i.canvas.width,i.canvas.height),q.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:mt,disable:St,bindFramebuffer:Vt,drawBuffers:$t,useProgram:fe,setBlending:k,setMaterial:Ie,setFlipSided:ie,setCullFace:Kt,setLineWidth:Tt,setPolygonOffset:xe,setScissorTest:nt,activeTexture:E,bindTexture:_,unbindTexture:O,compressedTexImage2D:X,compressedTexImage3D:Q,texImage2D:gt,texImage3D:Ot,updateUBOMapping:Zt,uniformBlockBinding:Wt,texStorage2D:Ct,texStorage3D:ot,texSubImage2D:j,texSubImage3D:Ft,compressedTexSubImage2D:lt,compressedTexSubImage3D:ut,scissor:Gt,viewport:ht,reset:pe}}function ll(i,t,e,n){const s=D0(n);switch(e){case kl:return i*t;case Gl:return i*t;case Vl:return i*t*2;case Ja:return i*t/s.components*s.byteLength;case ja:return i*t/s.components*s.byteLength;case Wl:return i*t*2/s.components*s.byteLength;case Qa:return i*t*2/s.components*s.byteLength;case Hl:return i*t*3/s.components*s.byteLength;case _n:return i*t*4/s.components*s.byteLength;case tc:return i*t*4/s.components*s.byteLength;case qr:case Yr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case $r:case Kr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case da:case fa:return Math.max(i,16)*Math.max(t,8)/4;case ha:case ua:return Math.max(i,8)*Math.max(t,8)/2;case pa:case ma:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case ga:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case xa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case _a:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case va:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case ya:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Ma:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Sa:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case wa:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case ba:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Ea:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Ta:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Aa:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Ca:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Ra:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Pa:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case Zr:case La:case Da:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Xl:case Ia:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Ua:case Na:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function D0(i){switch(i){case di:case Ol:return{byteLength:1,components:1};case hr:case zl:case ur:return{byteLength:2,components:1};case Ka:case Za:return{byteLength:2,components:4};case $i:case $a:case Wn:return{byteLength:4,components:1};case Bl:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function I0(i,t,e,n,s,r,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new bt,h=new WeakMap;let d;const m=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function x(E,_){return p?new OffscreenCanvas(E,_):Qr("canvas")}function v(E,_,O){let X=1;const Q=nt(E);if((Q.width>O||Q.height>O)&&(X=O/Math.max(Q.width,Q.height)),X<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){const j=Math.floor(X*Q.width),Ft=Math.floor(X*Q.height);d===void 0&&(d=x(j,Ft));const lt=_?x(j,Ft):d;return lt.width=j,lt.height=Ft,lt.getContext("2d").drawImage(E,0,0,j,Ft),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+j+"x"+Ft+")."),lt}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),E;return E}function g(E){return E.generateMipmaps}function u(E){i.generateMipmap(E)}function S(E){return E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?i.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function A(E,_,O,X,Q=!1){if(E!==null){if(i[E]!==void 0)return i[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let j=_;if(_===i.RED&&(O===i.FLOAT&&(j=i.R32F),O===i.HALF_FLOAT&&(j=i.R16F),O===i.UNSIGNED_BYTE&&(j=i.R8)),_===i.RED_INTEGER&&(O===i.UNSIGNED_BYTE&&(j=i.R8UI),O===i.UNSIGNED_SHORT&&(j=i.R16UI),O===i.UNSIGNED_INT&&(j=i.R32UI),O===i.BYTE&&(j=i.R8I),O===i.SHORT&&(j=i.R16I),O===i.INT&&(j=i.R32I)),_===i.RG&&(O===i.FLOAT&&(j=i.RG32F),O===i.HALF_FLOAT&&(j=i.RG16F),O===i.UNSIGNED_BYTE&&(j=i.RG8)),_===i.RG_INTEGER&&(O===i.UNSIGNED_BYTE&&(j=i.RG8UI),O===i.UNSIGNED_SHORT&&(j=i.RG16UI),O===i.UNSIGNED_INT&&(j=i.RG32UI),O===i.BYTE&&(j=i.RG8I),O===i.SHORT&&(j=i.RG16I),O===i.INT&&(j=i.RG32I)),_===i.RGB_INTEGER&&(O===i.UNSIGNED_BYTE&&(j=i.RGB8UI),O===i.UNSIGNED_SHORT&&(j=i.RGB16UI),O===i.UNSIGNED_INT&&(j=i.RGB32UI),O===i.BYTE&&(j=i.RGB8I),O===i.SHORT&&(j=i.RGB16I),O===i.INT&&(j=i.RGB32I)),_===i.RGBA_INTEGER&&(O===i.UNSIGNED_BYTE&&(j=i.RGBA8UI),O===i.UNSIGNED_SHORT&&(j=i.RGBA16UI),O===i.UNSIGNED_INT&&(j=i.RGBA32UI),O===i.BYTE&&(j=i.RGBA8I),O===i.SHORT&&(j=i.RGBA16I),O===i.INT&&(j=i.RGBA32I)),_===i.RGB&&O===i.UNSIGNED_INT_5_9_9_9_REV&&(j=i.RGB9_E5),_===i.RGBA){const Ft=Q?oo:ce.getTransfer(X);O===i.FLOAT&&(j=i.RGBA32F),O===i.HALF_FLOAT&&(j=i.RGBA16F),O===i.UNSIGNED_BYTE&&(j=Ft===ve?i.SRGB8_ALPHA8:i.RGBA8),O===i.UNSIGNED_SHORT_4_4_4_4&&(j=i.RGBA4),O===i.UNSIGNED_SHORT_5_5_5_1&&(j=i.RGB5_A1)}return(j===i.R16F||j===i.R32F||j===i.RG16F||j===i.RG32F||j===i.RGBA16F||j===i.RGBA32F)&&t.get("EXT_color_buffer_float"),j}function w(E,_){let O;return E?_===null||_===$i||_===Us?O=i.DEPTH24_STENCIL8:_===Wn?O=i.DEPTH32F_STENCIL8:_===hr&&(O=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===$i||_===Us?O=i.DEPTH_COMPONENT24:_===Wn?O=i.DEPTH_COMPONENT32F:_===hr&&(O=i.DEPTH_COMPONENT16),O}function B(E,_){return g(E)===!0||E.isFramebufferTexture&&E.minFilter!==Ve&&E.minFilter!==Vn?Math.log2(Math.max(_.width,_.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?_.mipmaps.length:1}function D(E){const _=E.target;_.removeEventListener("dispose",D),F(_),_.isVideoTexture&&h.delete(_)}function N(E){const _=E.target;_.removeEventListener("dispose",N),M(_)}function F(E){const _=n.get(E);if(_.__webglInit===void 0)return;const O=E.source,X=m.get(O);if(X){const Q=X[_.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&T(E),Object.keys(X).length===0&&m.delete(O)}n.remove(E)}function T(E){const _=n.get(E);i.deleteTexture(_.__webglTexture);const O=E.source,X=m.get(O);delete X[_.__cacheKey],o.memory.textures--}function M(E){const _=n.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),n.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(_.__webglFramebuffer[X]))for(let Q=0;Q<_.__webglFramebuffer[X].length;Q++)i.deleteFramebuffer(_.__webglFramebuffer[X][Q]);else i.deleteFramebuffer(_.__webglFramebuffer[X]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[X])}else{if(Array.isArray(_.__webglFramebuffer))for(let X=0;X<_.__webglFramebuffer.length;X++)i.deleteFramebuffer(_.__webglFramebuffer[X]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let X=0;X<_.__webglColorRenderbuffer.length;X++)_.__webglColorRenderbuffer[X]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[X]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}const O=E.textures;for(let X=0,Q=O.length;X<Q;X++){const j=n.get(O[X]);j.__webglTexture&&(i.deleteTexture(j.__webglTexture),o.memory.textures--),n.remove(O[X])}n.remove(E)}let I=0;function H(){I=0}function V(){const E=I;return E>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+s.maxTextures),I+=1,E}function $(E){const _=[];return _.push(E.wrapS),_.push(E.wrapT),_.push(E.wrapR||0),_.push(E.magFilter),_.push(E.minFilter),_.push(E.anisotropy),_.push(E.internalFormat),_.push(E.format),_.push(E.type),_.push(E.generateMipmaps),_.push(E.premultiplyAlpha),_.push(E.flipY),_.push(E.unpackAlignment),_.push(E.colorSpace),_.join()}function st(E,_){const O=n.get(E);if(E.isVideoTexture&&Tt(E),E.isRenderTargetTexture===!1&&E.version>0&&O.__version!==E.version){const X=E.image;if(X===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{q(O,E,_);return}}e.bindTexture(i.TEXTURE_2D,O.__webglTexture,i.TEXTURE0+_)}function tt(E,_){const O=n.get(E);if(E.version>0&&O.__version!==E.version){q(O,E,_);return}e.bindTexture(i.TEXTURE_2D_ARRAY,O.__webglTexture,i.TEXTURE0+_)}function rt(E,_){const O=n.get(E);if(E.version>0&&O.__version!==E.version){q(O,E,_);return}e.bindTexture(i.TEXTURE_3D,O.__webglTexture,i.TEXTURE0+_)}function Y(E,_){const O=n.get(E);if(E.version>0&&O.__version!==E.version){pt(O,E,_);return}e.bindTexture(i.TEXTURE_CUBE_MAP,O.__webglTexture,i.TEXTURE0+_)}const yt={[ca]:i.REPEAT,[Wi]:i.CLAMP_TO_EDGE,[la]:i.MIRRORED_REPEAT},xt={[Ve]:i.NEAREST,[vd]:i.NEAREST_MIPMAP_NEAREST,[gr]:i.NEAREST_MIPMAP_LINEAR,[Vn]:i.LINEAR,[po]:i.LINEAR_MIPMAP_NEAREST,[Xi]:i.LINEAR_MIPMAP_LINEAR},Ut={[wd]:i.NEVER,[Rd]:i.ALWAYS,[bd]:i.LESS,[Yl]:i.LEQUAL,[Ed]:i.EQUAL,[Cd]:i.GEQUAL,[Td]:i.GREATER,[Ad]:i.NOTEQUAL};function Yt(E,_){if(_.type===Wn&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===Vn||_.magFilter===po||_.magFilter===gr||_.magFilter===Xi||_.minFilter===Vn||_.minFilter===po||_.minFilter===gr||_.minFilter===Xi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(E,i.TEXTURE_WRAP_S,yt[_.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,yt[_.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,yt[_.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,xt[_.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,xt[_.minFilter]),_.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,Ut[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Ve||_.minFilter!==gr&&_.minFilter!==Xi||_.type===Wn&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){const O=t.get("EXT_texture_filter_anisotropic");i.texParameterf(E,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function Nt(E,_){let O=!1;E.__webglInit===void 0&&(E.__webglInit=!0,_.addEventListener("dispose",D));const X=_.source;let Q=m.get(X);Q===void 0&&(Q={},m.set(X,Q));const j=$(_);if(j!==E.__cacheKey){Q[j]===void 0&&(Q[j]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,O=!0),Q[j].usedTimes++;const Ft=Q[E.__cacheKey];Ft!==void 0&&(Q[E.__cacheKey].usedTimes--,Ft.usedTimes===0&&T(_)),E.__cacheKey=j,E.__webglTexture=Q[j].texture}return O}function q(E,_,O){let X=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(X=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(X=i.TEXTURE_3D);const Q=Nt(E,_),j=_.source;e.bindTexture(X,E.__webglTexture,i.TEXTURE0+O);const Ft=n.get(j);if(j.version!==Ft.__version||Q===!0){e.activeTexture(i.TEXTURE0+O);const lt=ce.getPrimaries(ce.workingColorSpace),ut=_.colorSpace===Mi?null:ce.getPrimaries(_.colorSpace),Ct=_.colorSpace===Mi||lt===ut?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ct);let ot=v(_.image,!1,s.maxTextureSize);ot=xe(_,ot);const gt=r.convert(_.format,_.colorSpace),Ot=r.convert(_.type);let Gt=A(_.internalFormat,gt,Ot,_.colorSpace,_.isVideoTexture);Yt(X,_);let ht;const Zt=_.mipmaps,Wt=_.isVideoTexture!==!0,pe=Ft.__version===void 0||Q===!0,z=j.dataReady,vt=B(_,ot);if(_.isDepthTexture)Gt=w(_.format===Ns,_.type),pe&&(Wt?e.texStorage2D(i.TEXTURE_2D,1,Gt,ot.width,ot.height):e.texImage2D(i.TEXTURE_2D,0,Gt,ot.width,ot.height,0,gt,Ot,null));else if(_.isDataTexture)if(Zt.length>0){Wt&&pe&&e.texStorage2D(i.TEXTURE_2D,vt,Gt,Zt[0].width,Zt[0].height);for(let J=0,at=Zt.length;J<at;J++)ht=Zt[J],Wt?z&&e.texSubImage2D(i.TEXTURE_2D,J,0,0,ht.width,ht.height,gt,Ot,ht.data):e.texImage2D(i.TEXTURE_2D,J,Gt,ht.width,ht.height,0,gt,Ot,ht.data);_.generateMipmaps=!1}else Wt?(pe&&e.texStorage2D(i.TEXTURE_2D,vt,Gt,ot.width,ot.height),z&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ot.width,ot.height,gt,Ot,ot.data)):e.texImage2D(i.TEXTURE_2D,0,Gt,ot.width,ot.height,0,gt,Ot,ot.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Wt&&pe&&e.texStorage3D(i.TEXTURE_2D_ARRAY,vt,Gt,Zt[0].width,Zt[0].height,ot.depth);for(let J=0,at=Zt.length;J<at;J++)if(ht=Zt[J],_.format!==_n)if(gt!==null)if(Wt){if(z)if(_.layerUpdates.size>0){const At=ll(ht.width,ht.height,_.format,_.type);for(const wt of _.layerUpdates){const jt=ht.data.subarray(wt*At/ht.data.BYTES_PER_ELEMENT,(wt+1)*At/ht.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,J,0,0,wt,ht.width,ht.height,1,gt,jt)}_.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,J,0,0,0,ht.width,ht.height,ot.depth,gt,ht.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,J,Gt,ht.width,ht.height,ot.depth,0,ht.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Wt?z&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,J,0,0,0,ht.width,ht.height,ot.depth,gt,Ot,ht.data):e.texImage3D(i.TEXTURE_2D_ARRAY,J,Gt,ht.width,ht.height,ot.depth,0,gt,Ot,ht.data)}else{Wt&&pe&&e.texStorage2D(i.TEXTURE_2D,vt,Gt,Zt[0].width,Zt[0].height);for(let J=0,at=Zt.length;J<at;J++)ht=Zt[J],_.format!==_n?gt!==null?Wt?z&&e.compressedTexSubImage2D(i.TEXTURE_2D,J,0,0,ht.width,ht.height,gt,ht.data):e.compressedTexImage2D(i.TEXTURE_2D,J,Gt,ht.width,ht.height,0,ht.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Wt?z&&e.texSubImage2D(i.TEXTURE_2D,J,0,0,ht.width,ht.height,gt,Ot,ht.data):e.texImage2D(i.TEXTURE_2D,J,Gt,ht.width,ht.height,0,gt,Ot,ht.data)}else if(_.isDataArrayTexture)if(Wt){if(pe&&e.texStorage3D(i.TEXTURE_2D_ARRAY,vt,Gt,ot.width,ot.height,ot.depth),z)if(_.layerUpdates.size>0){const J=ll(ot.width,ot.height,_.format,_.type);for(const at of _.layerUpdates){const At=ot.data.subarray(at*J/ot.data.BYTES_PER_ELEMENT,(at+1)*J/ot.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,at,ot.width,ot.height,1,gt,Ot,At)}_.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ot.width,ot.height,ot.depth,gt,Ot,ot.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Gt,ot.width,ot.height,ot.depth,0,gt,Ot,ot.data);else if(_.isData3DTexture)Wt?(pe&&e.texStorage3D(i.TEXTURE_3D,vt,Gt,ot.width,ot.height,ot.depth),z&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ot.width,ot.height,ot.depth,gt,Ot,ot.data)):e.texImage3D(i.TEXTURE_3D,0,Gt,ot.width,ot.height,ot.depth,0,gt,Ot,ot.data);else if(_.isFramebufferTexture){if(pe)if(Wt)e.texStorage2D(i.TEXTURE_2D,vt,Gt,ot.width,ot.height);else{let J=ot.width,at=ot.height;for(let At=0;At<vt;At++)e.texImage2D(i.TEXTURE_2D,At,Gt,J,at,0,gt,Ot,null),J>>=1,at>>=1}}else if(Zt.length>0){if(Wt&&pe){const J=nt(Zt[0]);e.texStorage2D(i.TEXTURE_2D,vt,Gt,J.width,J.height)}for(let J=0,at=Zt.length;J<at;J++)ht=Zt[J],Wt?z&&e.texSubImage2D(i.TEXTURE_2D,J,0,0,gt,Ot,ht):e.texImage2D(i.TEXTURE_2D,J,Gt,gt,Ot,ht);_.generateMipmaps=!1}else if(Wt){if(pe){const J=nt(ot);e.texStorage2D(i.TEXTURE_2D,vt,Gt,J.width,J.height)}z&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,gt,Ot,ot)}else e.texImage2D(i.TEXTURE_2D,0,Gt,gt,Ot,ot);g(_)&&u(X),Ft.__version=j.version,_.onUpdate&&_.onUpdate(_)}E.__version=_.version}function pt(E,_,O){if(_.image.length!==6)return;const X=Nt(E,_),Q=_.source;e.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+O);const j=n.get(Q);if(Q.version!==j.__version||X===!0){e.activeTexture(i.TEXTURE0+O);const Ft=ce.getPrimaries(ce.workingColorSpace),lt=_.colorSpace===Mi?null:ce.getPrimaries(_.colorSpace),ut=_.colorSpace===Mi||Ft===lt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ut);const Ct=_.isCompressedTexture||_.image[0].isCompressedTexture,ot=_.image[0]&&_.image[0].isDataTexture,gt=[];for(let at=0;at<6;at++)!Ct&&!ot?gt[at]=v(_.image[at],!0,s.maxCubemapSize):gt[at]=ot?_.image[at].image:_.image[at],gt[at]=xe(_,gt[at]);const Ot=gt[0],Gt=r.convert(_.format,_.colorSpace),ht=r.convert(_.type),Zt=A(_.internalFormat,Gt,ht,_.colorSpace),Wt=_.isVideoTexture!==!0,pe=j.__version===void 0||X===!0,z=Q.dataReady;let vt=B(_,Ot);Yt(i.TEXTURE_CUBE_MAP,_);let J;if(Ct){Wt&&pe&&e.texStorage2D(i.TEXTURE_CUBE_MAP,vt,Zt,Ot.width,Ot.height);for(let at=0;at<6;at++){J=gt[at].mipmaps;for(let At=0;At<J.length;At++){const wt=J[At];_.format!==_n?Gt!==null?Wt?z&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At,0,0,wt.width,wt.height,Gt,wt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At,Zt,wt.width,wt.height,0,wt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Wt?z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At,0,0,wt.width,wt.height,Gt,ht,wt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At,Zt,wt.width,wt.height,0,Gt,ht,wt.data)}}}else{if(J=_.mipmaps,Wt&&pe){J.length>0&&vt++;const at=nt(gt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,vt,Zt,at.width,at.height)}for(let at=0;at<6;at++)if(ot){Wt?z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,0,0,gt[at].width,gt[at].height,Gt,ht,gt[at].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,Zt,gt[at].width,gt[at].height,0,Gt,ht,gt[at].data);for(let At=0;At<J.length;At++){const jt=J[At].image[at].image;Wt?z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At+1,0,0,jt.width,jt.height,Gt,ht,jt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At+1,Zt,jt.width,jt.height,0,Gt,ht,jt.data)}}else{Wt?z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,0,0,Gt,ht,gt[at]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,Zt,Gt,ht,gt[at]);for(let At=0;At<J.length;At++){const wt=J[At];Wt?z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At+1,0,0,Gt,ht,wt.image[at]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At+1,Zt,Gt,ht,wt.image[at])}}}g(_)&&u(i.TEXTURE_CUBE_MAP),j.__version=Q.version,_.onUpdate&&_.onUpdate(_)}E.__version=_.version}function Et(E,_,O,X,Q,j){const Ft=r.convert(O.format,O.colorSpace),lt=r.convert(O.type),ut=A(O.internalFormat,Ft,lt,O.colorSpace),Ct=n.get(_),ot=n.get(O);if(ot.__renderTarget=_,!Ct.__hasExternalTextures){const gt=Math.max(1,_.width>>j),Ot=Math.max(1,_.height>>j);Q===i.TEXTURE_3D||Q===i.TEXTURE_2D_ARRAY?e.texImage3D(Q,j,ut,gt,Ot,_.depth,0,Ft,lt,null):e.texImage2D(Q,j,ut,gt,Ot,0,Ft,lt,null)}e.bindFramebuffer(i.FRAMEBUFFER,E),Kt(_)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,X,Q,ot.__webglTexture,0,ie(_)):(Q===i.TEXTURE_2D||Q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,X,Q,ot.__webglTexture,j),e.bindFramebuffer(i.FRAMEBUFFER,null)}function mt(E,_,O){if(i.bindRenderbuffer(i.RENDERBUFFER,E),_.depthBuffer){const X=_.depthTexture,Q=X&&X.isDepthTexture?X.type:null,j=w(_.stencilBuffer,Q),Ft=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,lt=ie(_);Kt(_)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,lt,j,_.width,_.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,lt,j,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,j,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Ft,i.RENDERBUFFER,E)}else{const X=_.textures;for(let Q=0;Q<X.length;Q++){const j=X[Q],Ft=r.convert(j.format,j.colorSpace),lt=r.convert(j.type),ut=A(j.internalFormat,Ft,lt,j.colorSpace),Ct=ie(_);O&&Kt(_)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ct,ut,_.width,_.height):Kt(_)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ct,ut,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,ut,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function St(E,_){if(_&&_.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,E),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const X=n.get(_.depthTexture);X.__renderTarget=_,(!X.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),st(_.depthTexture,0);const Q=X.__webglTexture,j=ie(_);if(_.depthTexture.format===Cs)Kt(_)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Q,0,j):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Q,0);else if(_.depthTexture.format===Ns)Kt(_)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Q,0,j):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function Vt(E){const _=n.get(E),O=E.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==E.depthTexture){const X=E.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),X){const Q=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,X.removeEventListener("dispose",Q)};X.addEventListener("dispose",Q),_.__depthDisposeCallback=Q}_.__boundDepthTexture=X}if(E.depthTexture&&!_.__autoAllocateDepthBuffer){if(O)throw new Error("target.depthTexture not supported in Cube render targets");St(_.__webglFramebuffer,E)}else if(O){_.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[X]),_.__webglDepthbuffer[X]===void 0)_.__webglDepthbuffer[X]=i.createRenderbuffer(),mt(_.__webglDepthbuffer[X],E,!1);else{const Q=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,j=_.__webglDepthbuffer[X];i.bindRenderbuffer(i.RENDERBUFFER,j),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,j)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),mt(_.__webglDepthbuffer,E,!1);else{const X=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Q=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Q),i.framebufferRenderbuffer(i.FRAMEBUFFER,X,i.RENDERBUFFER,Q)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function $t(E,_,O){const X=n.get(E);_!==void 0&&Et(X.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),O!==void 0&&Vt(E)}function fe(E){const _=E.texture,O=n.get(E),X=n.get(_);E.addEventListener("dispose",N);const Q=E.textures,j=E.isWebGLCubeRenderTarget===!0,Ft=Q.length>1;if(Ft||(X.__webglTexture===void 0&&(X.__webglTexture=i.createTexture()),X.__version=_.version,o.memory.textures++),j){O.__webglFramebuffer=[];for(let lt=0;lt<6;lt++)if(_.mipmaps&&_.mipmaps.length>0){O.__webglFramebuffer[lt]=[];for(let ut=0;ut<_.mipmaps.length;ut++)O.__webglFramebuffer[lt][ut]=i.createFramebuffer()}else O.__webglFramebuffer[lt]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){O.__webglFramebuffer=[];for(let lt=0;lt<_.mipmaps.length;lt++)O.__webglFramebuffer[lt]=i.createFramebuffer()}else O.__webglFramebuffer=i.createFramebuffer();if(Ft)for(let lt=0,ut=Q.length;lt<ut;lt++){const Ct=n.get(Q[lt]);Ct.__webglTexture===void 0&&(Ct.__webglTexture=i.createTexture(),o.memory.textures++)}if(E.samples>0&&Kt(E)===!1){O.__webglMultisampledFramebuffer=i.createFramebuffer(),O.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let lt=0;lt<Q.length;lt++){const ut=Q[lt];O.__webglColorRenderbuffer[lt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,O.__webglColorRenderbuffer[lt]);const Ct=r.convert(ut.format,ut.colorSpace),ot=r.convert(ut.type),gt=A(ut.internalFormat,Ct,ot,ut.colorSpace,E.isXRRenderTarget===!0),Ot=ie(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ot,gt,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+lt,i.RENDERBUFFER,O.__webglColorRenderbuffer[lt])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(O.__webglDepthRenderbuffer=i.createRenderbuffer(),mt(O.__webglDepthRenderbuffer,E,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(j){e.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture),Yt(i.TEXTURE_CUBE_MAP,_);for(let lt=0;lt<6;lt++)if(_.mipmaps&&_.mipmaps.length>0)for(let ut=0;ut<_.mipmaps.length;ut++)Et(O.__webglFramebuffer[lt][ut],E,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,ut);else Et(O.__webglFramebuffer[lt],E,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0);g(_)&&u(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Ft){for(let lt=0,ut=Q.length;lt<ut;lt++){const Ct=Q[lt],ot=n.get(Ct);e.bindTexture(i.TEXTURE_2D,ot.__webglTexture),Yt(i.TEXTURE_2D,Ct),Et(O.__webglFramebuffer,E,Ct,i.COLOR_ATTACHMENT0+lt,i.TEXTURE_2D,0),g(Ct)&&u(i.TEXTURE_2D)}e.unbindTexture()}else{let lt=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(lt=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(lt,X.__webglTexture),Yt(lt,_),_.mipmaps&&_.mipmaps.length>0)for(let ut=0;ut<_.mipmaps.length;ut++)Et(O.__webglFramebuffer[ut],E,_,i.COLOR_ATTACHMENT0,lt,ut);else Et(O.__webglFramebuffer,E,_,i.COLOR_ATTACHMENT0,lt,0);g(_)&&u(lt),e.unbindTexture()}E.depthBuffer&&Vt(E)}function Qt(E){const _=E.textures;for(let O=0,X=_.length;O<X;O++){const Q=_[O];if(g(Q)){const j=S(E),Ft=n.get(Q).__webglTexture;e.bindTexture(j,Ft),u(j),e.unbindTexture()}}}const de=[],k=[];function Ie(E){if(E.samples>0){if(Kt(E)===!1){const _=E.textures,O=E.width,X=E.height;let Q=i.COLOR_BUFFER_BIT;const j=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Ft=n.get(E),lt=_.length>1;if(lt)for(let ut=0;ut<_.length;ut++)e.bindFramebuffer(i.FRAMEBUFFER,Ft.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ut,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,Ft.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ut,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,Ft.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ft.__webglFramebuffer);for(let ut=0;ut<_.length;ut++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(Q|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(Q|=i.STENCIL_BUFFER_BIT)),lt){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Ft.__webglColorRenderbuffer[ut]);const Ct=n.get(_[ut]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ct,0)}i.blitFramebuffer(0,0,O,X,0,0,O,X,Q,i.NEAREST),c===!0&&(de.length=0,k.length=0,de.push(i.COLOR_ATTACHMENT0+ut),E.depthBuffer&&E.resolveDepthBuffer===!1&&(de.push(j),k.push(j),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,k)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,de))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),lt)for(let ut=0;ut<_.length;ut++){e.bindFramebuffer(i.FRAMEBUFFER,Ft.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ut,i.RENDERBUFFER,Ft.__webglColorRenderbuffer[ut]);const Ct=n.get(_[ut]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,Ft.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ut,i.TEXTURE_2D,Ct,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ft.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&c){const _=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function ie(E){return Math.min(s.maxSamples,E.samples)}function Kt(E){const _=n.get(E);return E.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function Tt(E){const _=o.render.frame;h.get(E)!==_&&(h.set(E,_),E.update())}function xe(E,_){const O=E.colorSpace,X=E.format,Q=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||O!==Bs&&O!==Mi&&(ce.getTransfer(O)===ve?(X!==_n||Q!==di)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",O)),_}function nt(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(l.width=E.naturalWidth||E.width,l.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(l.width=E.displayWidth,l.height=E.displayHeight):(l.width=E.width,l.height=E.height),l}this.allocateTextureUnit=V,this.resetTextureUnits=H,this.setTexture2D=st,this.setTexture2DArray=tt,this.setTexture3D=rt,this.setTextureCube=Y,this.rebindTextures=$t,this.setupRenderTarget=fe,this.updateRenderTargetMipmap=Qt,this.updateMultisampleRenderTarget=Ie,this.setupDepthRenderbuffer=Vt,this.setupFrameBufferTexture=Et,this.useMultisampledRTT=Kt}function U0(i,t){function e(n,s=Mi){let r;const o=ce.getTransfer(s);if(n===di)return i.UNSIGNED_BYTE;if(n===Ka)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Za)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Bl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Ol)return i.BYTE;if(n===zl)return i.SHORT;if(n===hr)return i.UNSIGNED_SHORT;if(n===$a)return i.INT;if(n===$i)return i.UNSIGNED_INT;if(n===Wn)return i.FLOAT;if(n===ur)return i.HALF_FLOAT;if(n===kl)return i.ALPHA;if(n===Hl)return i.RGB;if(n===_n)return i.RGBA;if(n===Gl)return i.LUMINANCE;if(n===Vl)return i.LUMINANCE_ALPHA;if(n===Cs)return i.DEPTH_COMPONENT;if(n===Ns)return i.DEPTH_STENCIL;if(n===Ja)return i.RED;if(n===ja)return i.RED_INTEGER;if(n===Wl)return i.RG;if(n===Qa)return i.RG_INTEGER;if(n===tc)return i.RGBA_INTEGER;if(n===qr||n===Yr||n===$r||n===Kr)if(o===ve)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===qr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Yr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===$r)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Kr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===qr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Yr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===$r)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Kr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ha||n===da||n===ua||n===fa)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===ha)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===da)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ua)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===fa)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===pa||n===ma||n===ga)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===pa||n===ma)return o===ve?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===ga)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===xa||n===_a||n===va||n===ya||n===Ma||n===Sa||n===wa||n===ba||n===Ea||n===Ta||n===Aa||n===Ca||n===Ra||n===Pa)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===xa)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===_a)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===va)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ya)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ma)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Sa)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===wa)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ba)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ea)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Ta)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Aa)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ca)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ra)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Pa)return o===ve?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Zr||n===La||n===Da)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===Zr)return o===ve?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===La)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Da)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Xl||n===Ia||n===Ua||n===Na)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Zr)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Ia)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ua)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Na)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Us?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}class N0 extends Sn{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class kt extends We{constructor(){super(),this.isGroup=!0,this.type="Group"}}const F0={type:"move"};class Vo{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new kt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new kt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new C,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new C),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new kt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new C,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new C),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null;const a=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){o=!0;for(const v of t.hand.values()){const g=e.getJointPose(v,n),u=this._getHandJoint(l,v);g!==null&&(u.matrix.fromArray(g.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,u.jointRadius=g.radius),u.visible=g!==null}const h=l.joints["index-finger-tip"],d=l.joints["thumb-tip"],m=h.position.distanceTo(d.position),p=.02,x=.005;l.inputState.pinching&&m>p+x?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&m<=p-x&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(F0)))}return a!==null&&(a.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new kt;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const O0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,z0=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class B0{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const s=new dn,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Pn({vertexShader:O0,fragmentShader:z0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new K(new Fe(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class k0 extends ks{constructor(t,e){super();const n=this;let s=null,r=1,o=null,a="local-floor",c=1,l=null,h=null,d=null,m=null,p=null,x=null;const v=new B0,g=e.getContextAttributes();let u=null,S=null;const A=[],w=[],B=new bt;let D=null;const N=new Sn;N.viewport=new Me;const F=new Sn;F.viewport=new Me;const T=[N,F],M=new N0;let I=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let pt=A[q];return pt===void 0&&(pt=new Vo,A[q]=pt),pt.getTargetRaySpace()},this.getControllerGrip=function(q){let pt=A[q];return pt===void 0&&(pt=new Vo,A[q]=pt),pt.getGripSpace()},this.getHand=function(q){let pt=A[q];return pt===void 0&&(pt=new Vo,A[q]=pt),pt.getHandSpace()};function V(q){const pt=w.indexOf(q.inputSource);if(pt===-1)return;const Et=A[pt];Et!==void 0&&(Et.update(q.inputSource,q.frame,l||o),Et.dispatchEvent({type:q.type,data:q.inputSource}))}function $(){s.removeEventListener("select",V),s.removeEventListener("selectstart",V),s.removeEventListener("selectend",V),s.removeEventListener("squeeze",V),s.removeEventListener("squeezestart",V),s.removeEventListener("squeezeend",V),s.removeEventListener("end",$),s.removeEventListener("inputsourceschange",st);for(let q=0;q<A.length;q++){const pt=w[q];pt!==null&&(w[q]=null,A[q].disconnect(pt))}I=null,H=null,v.reset(),t.setRenderTarget(u),p=null,m=null,d=null,s=null,S=null,Nt.stop(),n.isPresenting=!1,t.setPixelRatio(D),t.setSize(B.width,B.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){r=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){a=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(q){l=q},this.getBaseLayer=function(){return m!==null?m:p},this.getBinding=function(){return d},this.getFrame=function(){return x},this.getSession=function(){return s},this.setSession=async function(q){if(s=q,s!==null){if(u=t.getRenderTarget(),s.addEventListener("select",V),s.addEventListener("selectstart",V),s.addEventListener("selectend",V),s.addEventListener("squeeze",V),s.addEventListener("squeezestart",V),s.addEventListener("squeezeend",V),s.addEventListener("end",$),s.addEventListener("inputsourceschange",st),g.xrCompatible!==!0&&await e.makeXRCompatible(),D=t.getPixelRatio(),t.getSize(B),s.renderState.layers===void 0){const pt={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(s,e,pt),s.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),S=new Ki(p.framebufferWidth,p.framebufferHeight,{format:_n,type:di,colorSpace:t.outputColorSpace,stencilBuffer:g.stencil})}else{let pt=null,Et=null,mt=null;g.depth&&(mt=g.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,pt=g.stencil?Ns:Cs,Et=g.stencil?Us:$i);const St={colorFormat:e.RGBA8,depthFormat:mt,scaleFactor:r};d=new XRWebGLBinding(s,e),m=d.createProjectionLayer(St),s.updateRenderState({layers:[m]}),t.setPixelRatio(1),t.setSize(m.textureWidth,m.textureHeight,!1),S=new Ki(m.textureWidth,m.textureHeight,{format:_n,type:di,depthTexture:new ah(m.textureWidth,m.textureHeight,Et,void 0,void 0,void 0,void 0,void 0,void 0,pt),stencilBuffer:g.stencil,colorSpace:t.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:m.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(a),Nt.setContext(s),Nt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function st(q){for(let pt=0;pt<q.removed.length;pt++){const Et=q.removed[pt],mt=w.indexOf(Et);mt>=0&&(w[mt]=null,A[mt].disconnect(Et))}for(let pt=0;pt<q.added.length;pt++){const Et=q.added[pt];let mt=w.indexOf(Et);if(mt===-1){for(let Vt=0;Vt<A.length;Vt++)if(Vt>=w.length){w.push(Et),mt=Vt;break}else if(w[Vt]===null){w[Vt]=Et,mt=Vt;break}if(mt===-1)break}const St=A[mt];St&&St.connect(Et)}}const tt=new C,rt=new C;function Y(q,pt,Et){tt.setFromMatrixPosition(pt.matrixWorld),rt.setFromMatrixPosition(Et.matrixWorld);const mt=tt.distanceTo(rt),St=pt.projectionMatrix.elements,Vt=Et.projectionMatrix.elements,$t=St[14]/(St[10]-1),fe=St[14]/(St[10]+1),Qt=(St[9]+1)/St[5],de=(St[9]-1)/St[5],k=(St[8]-1)/St[0],Ie=(Vt[8]+1)/Vt[0],ie=$t*k,Kt=$t*Ie,Tt=mt/(-k+Ie),xe=Tt*-k;if(pt.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(xe),q.translateZ(Tt),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),St[10]===-1)q.projectionMatrix.copy(pt.projectionMatrix),q.projectionMatrixInverse.copy(pt.projectionMatrixInverse);else{const nt=$t+Tt,E=fe+Tt,_=ie-xe,O=Kt+(mt-xe),X=Qt*fe/E*nt,Q=de*fe/E*nt;q.projectionMatrix.makePerspective(_,O,X,Q,nt,E),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function yt(q,pt){pt===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(pt.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(s===null)return;let pt=q.near,Et=q.far;v.texture!==null&&(v.depthNear>0&&(pt=v.depthNear),v.depthFar>0&&(Et=v.depthFar)),M.near=F.near=N.near=pt,M.far=F.far=N.far=Et,(I!==M.near||H!==M.far)&&(s.updateRenderState({depthNear:M.near,depthFar:M.far}),I=M.near,H=M.far),N.layers.mask=q.layers.mask|2,F.layers.mask=q.layers.mask|4,M.layers.mask=N.layers.mask|F.layers.mask;const mt=q.parent,St=M.cameras;yt(M,mt);for(let Vt=0;Vt<St.length;Vt++)yt(St[Vt],mt);St.length===2?Y(M,N,F):M.projectionMatrix.copy(N.projectionMatrix),xt(q,M,mt)};function xt(q,pt,Et){Et===null?q.matrix.copy(pt.matrixWorld):(q.matrix.copy(Et.matrixWorld),q.matrix.invert(),q.matrix.multiply(pt.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(pt.projectionMatrix),q.projectionMatrixInverse.copy(pt.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=Oa*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(!(m===null&&p===null))return c},this.setFoveation=function(q){c=q,m!==null&&(m.fixedFoveation=q),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=q)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(M)};let Ut=null;function Yt(q,pt){if(h=pt.getViewerPose(l||o),x=pt,h!==null){const Et=h.views;p!==null&&(t.setRenderTargetFramebuffer(S,p.framebuffer),t.setRenderTarget(S));let mt=!1;Et.length!==M.cameras.length&&(M.cameras.length=0,mt=!0);for(let Vt=0;Vt<Et.length;Vt++){const $t=Et[Vt];let fe=null;if(p!==null)fe=p.getViewport($t);else{const de=d.getViewSubImage(m,$t);fe=de.viewport,Vt===0&&(t.setRenderTargetTextures(S,de.colorTexture,m.ignoreDepthValues?void 0:de.depthStencilTexture),t.setRenderTarget(S))}let Qt=T[Vt];Qt===void 0&&(Qt=new Sn,Qt.layers.enable(Vt),Qt.viewport=new Me,T[Vt]=Qt),Qt.matrix.fromArray($t.transform.matrix),Qt.matrix.decompose(Qt.position,Qt.quaternion,Qt.scale),Qt.projectionMatrix.fromArray($t.projectionMatrix),Qt.projectionMatrixInverse.copy(Qt.projectionMatrix).invert(),Qt.viewport.set(fe.x,fe.y,fe.width,fe.height),Vt===0&&(M.matrix.copy(Qt.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),mt===!0&&M.cameras.push(Qt)}const St=s.enabledFeatures;if(St&&St.includes("depth-sensing")){const Vt=d.getDepthInformation(Et[0]);Vt&&Vt.isValid&&Vt.texture&&v.init(t,Vt,s.renderState)}}for(let Et=0;Et<A.length;Et++){const mt=w[Et],St=A[Et];mt!==null&&St!==void 0&&St.update(mt,pt,l||o)}Ut&&Ut(q,pt),pt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:pt}),x=null}const Nt=new rh;Nt.setAnimationLoop(Yt),this.setAnimationLoop=function(q){Ut=q},this.dispose=function(){}}}const zi=new qn,H0=new he;function G0(i,t){function e(g,u){g.matrixAutoUpdate===!0&&g.updateMatrix(),u.value.copy(g.matrix)}function n(g,u){u.color.getRGB(g.fogColor.value,nh(i)),u.isFog?(g.fogNear.value=u.near,g.fogFar.value=u.far):u.isFogExp2&&(g.fogDensity.value=u.density)}function s(g,u,S,A,w){u.isMeshBasicMaterial||u.isMeshLambertMaterial?r(g,u):u.isMeshToonMaterial?(r(g,u),d(g,u)):u.isMeshPhongMaterial?(r(g,u),h(g,u)):u.isMeshStandardMaterial?(r(g,u),m(g,u),u.isMeshPhysicalMaterial&&p(g,u,w)):u.isMeshMatcapMaterial?(r(g,u),x(g,u)):u.isMeshDepthMaterial?r(g,u):u.isMeshDistanceMaterial?(r(g,u),v(g,u)):u.isMeshNormalMaterial?r(g,u):u.isLineBasicMaterial?(o(g,u),u.isLineDashedMaterial&&a(g,u)):u.isPointsMaterial?c(g,u,S,A):u.isSpriteMaterial?l(g,u):u.isShadowMaterial?(g.color.value.copy(u.color),g.opacity.value=u.opacity):u.isShaderMaterial&&(u.uniformsNeedUpdate=!1)}function r(g,u){g.opacity.value=u.opacity,u.color&&g.diffuse.value.copy(u.color),u.emissive&&g.emissive.value.copy(u.emissive).multiplyScalar(u.emissiveIntensity),u.map&&(g.map.value=u.map,e(u.map,g.mapTransform)),u.alphaMap&&(g.alphaMap.value=u.alphaMap,e(u.alphaMap,g.alphaMapTransform)),u.bumpMap&&(g.bumpMap.value=u.bumpMap,e(u.bumpMap,g.bumpMapTransform),g.bumpScale.value=u.bumpScale,u.side===xn&&(g.bumpScale.value*=-1)),u.normalMap&&(g.normalMap.value=u.normalMap,e(u.normalMap,g.normalMapTransform),g.normalScale.value.copy(u.normalScale),u.side===xn&&g.normalScale.value.negate()),u.displacementMap&&(g.displacementMap.value=u.displacementMap,e(u.displacementMap,g.displacementMapTransform),g.displacementScale.value=u.displacementScale,g.displacementBias.value=u.displacementBias),u.emissiveMap&&(g.emissiveMap.value=u.emissiveMap,e(u.emissiveMap,g.emissiveMapTransform)),u.specularMap&&(g.specularMap.value=u.specularMap,e(u.specularMap,g.specularMapTransform)),u.alphaTest>0&&(g.alphaTest.value=u.alphaTest);const S=t.get(u),A=S.envMap,w=S.envMapRotation;A&&(g.envMap.value=A,zi.copy(w),zi.x*=-1,zi.y*=-1,zi.z*=-1,A.isCubeTexture&&A.isRenderTargetTexture===!1&&(zi.y*=-1,zi.z*=-1),g.envMapRotation.value.setFromMatrix4(H0.makeRotationFromEuler(zi)),g.flipEnvMap.value=A.isCubeTexture&&A.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=u.reflectivity,g.ior.value=u.ior,g.refractionRatio.value=u.refractionRatio),u.lightMap&&(g.lightMap.value=u.lightMap,g.lightMapIntensity.value=u.lightMapIntensity,e(u.lightMap,g.lightMapTransform)),u.aoMap&&(g.aoMap.value=u.aoMap,g.aoMapIntensity.value=u.aoMapIntensity,e(u.aoMap,g.aoMapTransform))}function o(g,u){g.diffuse.value.copy(u.color),g.opacity.value=u.opacity,u.map&&(g.map.value=u.map,e(u.map,g.mapTransform))}function a(g,u){g.dashSize.value=u.dashSize,g.totalSize.value=u.dashSize+u.gapSize,g.scale.value=u.scale}function c(g,u,S,A){g.diffuse.value.copy(u.color),g.opacity.value=u.opacity,g.size.value=u.size*S,g.scale.value=A*.5,u.map&&(g.map.value=u.map,e(u.map,g.uvTransform)),u.alphaMap&&(g.alphaMap.value=u.alphaMap,e(u.alphaMap,g.alphaMapTransform)),u.alphaTest>0&&(g.alphaTest.value=u.alphaTest)}function l(g,u){g.diffuse.value.copy(u.color),g.opacity.value=u.opacity,g.rotation.value=u.rotation,u.map&&(g.map.value=u.map,e(u.map,g.mapTransform)),u.alphaMap&&(g.alphaMap.value=u.alphaMap,e(u.alphaMap,g.alphaMapTransform)),u.alphaTest>0&&(g.alphaTest.value=u.alphaTest)}function h(g,u){g.specular.value.copy(u.specular),g.shininess.value=Math.max(u.shininess,1e-4)}function d(g,u){u.gradientMap&&(g.gradientMap.value=u.gradientMap)}function m(g,u){g.metalness.value=u.metalness,u.metalnessMap&&(g.metalnessMap.value=u.metalnessMap,e(u.metalnessMap,g.metalnessMapTransform)),g.roughness.value=u.roughness,u.roughnessMap&&(g.roughnessMap.value=u.roughnessMap,e(u.roughnessMap,g.roughnessMapTransform)),u.envMap&&(g.envMapIntensity.value=u.envMapIntensity)}function p(g,u,S){g.ior.value=u.ior,u.sheen>0&&(g.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),g.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(g.sheenColorMap.value=u.sheenColorMap,e(u.sheenColorMap,g.sheenColorMapTransform)),u.sheenRoughnessMap&&(g.sheenRoughnessMap.value=u.sheenRoughnessMap,e(u.sheenRoughnessMap,g.sheenRoughnessMapTransform))),u.clearcoat>0&&(g.clearcoat.value=u.clearcoat,g.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(g.clearcoatMap.value=u.clearcoatMap,e(u.clearcoatMap,g.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,e(u.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(g.clearcoatNormalMap.value=u.clearcoatNormalMap,e(u.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===xn&&g.clearcoatNormalScale.value.negate())),u.dispersion>0&&(g.dispersion.value=u.dispersion),u.iridescence>0&&(g.iridescence.value=u.iridescence,g.iridescenceIOR.value=u.iridescenceIOR,g.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(g.iridescenceMap.value=u.iridescenceMap,e(u.iridescenceMap,g.iridescenceMapTransform)),u.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=u.iridescenceThicknessMap,e(u.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),u.transmission>0&&(g.transmission.value=u.transmission,g.transmissionSamplerMap.value=S.texture,g.transmissionSamplerSize.value.set(S.width,S.height),u.transmissionMap&&(g.transmissionMap.value=u.transmissionMap,e(u.transmissionMap,g.transmissionMapTransform)),g.thickness.value=u.thickness,u.thicknessMap&&(g.thicknessMap.value=u.thicknessMap,e(u.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=u.attenuationDistance,g.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(g.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(g.anisotropyMap.value=u.anisotropyMap,e(u.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=u.specularIntensity,g.specularColor.value.copy(u.specularColor),u.specularColorMap&&(g.specularColorMap.value=u.specularColorMap,e(u.specularColorMap,g.specularColorMapTransform)),u.specularIntensityMap&&(g.specularIntensityMap.value=u.specularIntensityMap,e(u.specularIntensityMap,g.specularIntensityMapTransform))}function x(g,u){u.matcap&&(g.matcap.value=u.matcap)}function v(g,u){const S=t.get(u).light;g.referencePosition.value.setFromMatrixPosition(S.matrixWorld),g.nearDistance.value=S.shadow.camera.near,g.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function V0(i,t,e,n){let s={},r={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(S,A){const w=A.program;n.uniformBlockBinding(S,w)}function l(S,A){let w=s[S.id];w===void 0&&(x(S),w=h(S),s[S.id]=w,S.addEventListener("dispose",g));const B=A.program;n.updateUBOMapping(S,B);const D=t.render.frame;r[S.id]!==D&&(m(S),r[S.id]=D)}function h(S){const A=d();S.__bindingPointIndex=A;const w=i.createBuffer(),B=S.__size,D=S.usage;return i.bindBuffer(i.UNIFORM_BUFFER,w),i.bufferData(i.UNIFORM_BUFFER,B,D),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,A,w),w}function d(){for(let S=0;S<a;S++)if(o.indexOf(S)===-1)return o.push(S),S;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function m(S){const A=s[S.id],w=S.uniforms,B=S.__cache;i.bindBuffer(i.UNIFORM_BUFFER,A);for(let D=0,N=w.length;D<N;D++){const F=Array.isArray(w[D])?w[D]:[w[D]];for(let T=0,M=F.length;T<M;T++){const I=F[T];if(p(I,D,T,B)===!0){const H=I.__offset,V=Array.isArray(I.value)?I.value:[I.value];let $=0;for(let st=0;st<V.length;st++){const tt=V[st],rt=v(tt);typeof tt=="number"||typeof tt=="boolean"?(I.__data[0]=tt,i.bufferSubData(i.UNIFORM_BUFFER,H+$,I.__data)):tt.isMatrix3?(I.__data[0]=tt.elements[0],I.__data[1]=tt.elements[1],I.__data[2]=tt.elements[2],I.__data[3]=0,I.__data[4]=tt.elements[3],I.__data[5]=tt.elements[4],I.__data[6]=tt.elements[5],I.__data[7]=0,I.__data[8]=tt.elements[6],I.__data[9]=tt.elements[7],I.__data[10]=tt.elements[8],I.__data[11]=0):(tt.toArray(I.__data,$),$+=rt.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,H,I.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function p(S,A,w,B){const D=S.value,N=A+"_"+w;if(B[N]===void 0)return typeof D=="number"||typeof D=="boolean"?B[N]=D:B[N]=D.clone(),!0;{const F=B[N];if(typeof D=="number"||typeof D=="boolean"){if(F!==D)return B[N]=D,!0}else if(F.equals(D)===!1)return F.copy(D),!0}return!1}function x(S){const A=S.uniforms;let w=0;const B=16;for(let N=0,F=A.length;N<F;N++){const T=Array.isArray(A[N])?A[N]:[A[N]];for(let M=0,I=T.length;M<I;M++){const H=T[M],V=Array.isArray(H.value)?H.value:[H.value];for(let $=0,st=V.length;$<st;$++){const tt=V[$],rt=v(tt),Y=w%B,yt=Y%rt.boundary,xt=Y+yt;w+=yt,xt!==0&&B-xt<rt.storage&&(w+=B-xt),H.__data=new Float32Array(rt.storage/Float32Array.BYTES_PER_ELEMENT),H.__offset=w,w+=rt.storage}}}const D=w%B;return D>0&&(w+=B-D),S.__size=w,S.__cache={},this}function v(S){const A={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(A.boundary=4,A.storage=4):S.isVector2?(A.boundary=8,A.storage=8):S.isVector3||S.isColor?(A.boundary=16,A.storage=12):S.isVector4?(A.boundary=16,A.storage=16):S.isMatrix3?(A.boundary=48,A.storage=48):S.isMatrix4?(A.boundary=64,A.storage=64):S.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",S),A}function g(S){const A=S.target;A.removeEventListener("dispose",g);const w=o.indexOf(A.__bindingPointIndex);o.splice(w,1),i.deleteBuffer(s[A.id]),delete s[A.id],delete r[A.id]}function u(){for(const S in s)i.deleteBuffer(s[S]);o=[],s={},r={}}return{bind:c,update:l,dispose:u}}class W0{constructor(t={}){const{canvas:e=Ld(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reverseDepthBuffer:m=!1}=t;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=o;const x=new Uint32Array(4),v=new Int32Array(4);let g=null,u=null;const S=[],A=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=ln,this.toneMapping=Ei,this.toneMappingExposure=1;const w=this;let B=!1,D=0,N=0,F=null,T=-1,M=null;const I=new Me,H=new Me;let V=null;const $=new Ht(0);let st=0,tt=e.width,rt=e.height,Y=1,yt=null,xt=null;const Ut=new Me(0,0,tt,rt),Yt=new Me(0,0,tt,rt);let Nt=!1;const q=new ec;let pt=!1,Et=!1;const mt=new he,St=new he,Vt=new C,$t=new Me,fe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Qt=!1;function de(){return F===null?Y:1}let k=n;function Ie(f,b){return e.getContext(f,b)}try{const f={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Ya}`),e.addEventListener("webglcontextlost",at,!1),e.addEventListener("webglcontextrestored",At,!1),e.addEventListener("webglcontextcreationerror",wt,!1),k===null){const b="webgl2";if(k=Ie(b,f),k===null)throw Ie(b)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(f){throw console.error("THREE.WebGLRenderer: "+f.message),f}let ie,Kt,Tt,xe,nt,E,_,O,X,Q,j,Ft,lt,ut,Ct,ot,gt,Ot,Gt,ht,Zt,Wt,pe,z;function vt(){ie=new Kp(k),ie.init(),Wt=new U0(k,ie),Kt=new Vp(k,ie,t,Wt),Tt=new L0(k,ie),Kt.reverseDepthBuffer&&m&&Tt.buffers.depth.setReversed(!0),xe=new jp(k),nt=new g0,E=new I0(k,ie,Tt,nt,Kt,Wt,xe),_=new Xp(w),O=new $p(w),X=new su(k),pe=new Hp(k,X),Q=new Zp(k,X,xe,pe),j=new tm(k,Q,X,xe),Gt=new Qp(k,Kt,E),ot=new Wp(nt),Ft=new m0(w,_,O,ie,Kt,pe,ot),lt=new G0(w,nt),ut=new _0,Ct=new b0(ie),Ot=new kp(w,_,O,Tt,j,p,c),gt=new R0(w,j,Kt),z=new V0(k,xe,Kt,Tt),ht=new Gp(k,ie,xe),Zt=new Jp(k,ie,xe),xe.programs=Ft.programs,w.capabilities=Kt,w.extensions=ie,w.properties=nt,w.renderLists=ut,w.shadowMap=gt,w.state=Tt,w.info=xe}vt();const J=new k0(w,k);this.xr=J,this.getContext=function(){return k},this.getContextAttributes=function(){return k.getContextAttributes()},this.forceContextLoss=function(){const f=ie.get("WEBGL_lose_context");f&&f.loseContext()},this.forceContextRestore=function(){const f=ie.get("WEBGL_lose_context");f&&f.restoreContext()},this.getPixelRatio=function(){return Y},this.setPixelRatio=function(f){f!==void 0&&(Y=f,this.setSize(tt,rt,!1))},this.getSize=function(f){return f.set(tt,rt)},this.setSize=function(f,b,R=!0){if(J.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}tt=f,rt=b,e.width=Math.floor(f*Y),e.height=Math.floor(b*Y),R===!0&&(e.style.width=f+"px",e.style.height=b+"px"),this.setViewport(0,0,f,b)},this.getDrawingBufferSize=function(f){return f.set(tt*Y,rt*Y).floor()},this.setDrawingBufferSize=function(f,b,R){tt=f,rt=b,Y=R,e.width=Math.floor(f*R),e.height=Math.floor(b*R),this.setViewport(0,0,f,b)},this.getCurrentViewport=function(f){return f.copy(I)},this.getViewport=function(f){return f.copy(Ut)},this.setViewport=function(f,b,R,L){f.isVector4?Ut.set(f.x,f.y,f.z,f.w):Ut.set(f,b,R,L),Tt.viewport(I.copy(Ut).multiplyScalar(Y).round())},this.getScissor=function(f){return f.copy(Yt)},this.setScissor=function(f,b,R,L){f.isVector4?Yt.set(f.x,f.y,f.z,f.w):Yt.set(f,b,R,L),Tt.scissor(H.copy(Yt).multiplyScalar(Y).round())},this.getScissorTest=function(){return Nt},this.setScissorTest=function(f){Tt.setScissorTest(Nt=f)},this.setOpaqueSort=function(f){yt=f},this.setTransparentSort=function(f){xt=f},this.getClearColor=function(f){return f.copy(Ot.getClearColor())},this.setClearColor=function(){Ot.setClearColor.apply(Ot,arguments)},this.getClearAlpha=function(){return Ot.getClearAlpha()},this.setClearAlpha=function(){Ot.setClearAlpha.apply(Ot,arguments)},this.clear=function(f=!0,b=!0,R=!0){let L=0;if(f){let P=!1;if(F!==null){const G=F.texture.format;P=G===tc||G===Qa||G===ja}if(P){const G=F.texture.type,W=G===di||G===$i||G===hr||G===Us||G===Ka||G===Za,ct=Ot.getClearColor(),it=Ot.getClearAlpha(),dt=ct.r,_t=ct.g,ft=ct.b;W?(x[0]=dt,x[1]=_t,x[2]=ft,x[3]=it,k.clearBufferuiv(k.COLOR,0,x)):(v[0]=dt,v[1]=_t,v[2]=ft,v[3]=it,k.clearBufferiv(k.COLOR,0,v))}else L|=k.COLOR_BUFFER_BIT}b&&(L|=k.DEPTH_BUFFER_BIT),R&&(L|=k.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),k.clear(L)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",at,!1),e.removeEventListener("webglcontextrestored",At,!1),e.removeEventListener("webglcontextcreationerror",wt,!1),ut.dispose(),Ct.dispose(),nt.dispose(),_.dispose(),O.dispose(),j.dispose(),pe.dispose(),z.dispose(),Ft.dispose(),J.dispose(),J.removeEventListener("sessionstart",Ws),J.removeEventListener("sessionend",ui),Tn.stop()};function at(f){f.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),B=!0}function At(){console.log("THREE.WebGLRenderer: Context Restored."),B=!1;const f=xe.autoReset,b=gt.enabled,R=gt.autoUpdate,L=gt.needsUpdate,P=gt.type;vt(),xe.autoReset=f,gt.enabled=b,gt.autoUpdate=R,gt.needsUpdate=L,gt.type=P}function wt(f){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",f.statusMessage)}function jt(f){const b=f.target;b.removeEventListener("dispose",jt),we(b)}function we(f){Le(f),nt.remove(f)}function Le(f){const b=nt.get(f).programs;b!==void 0&&(b.forEach(function(R){Ft.releaseProgram(R)}),f.isShaderMaterial&&Ft.releaseShaderCache(f))}this.renderBufferDirect=function(f,b,R,L,P,G){b===null&&(b=fe);const W=P.isMesh&&P.matrixWorld.determinant()<0,ct=me(f,b,R,L,P);Tt.setMaterial(L,W);let it=R.index,dt=1;if(L.wireframe===!0){if(it=Q.getWireframeAttribute(R),it===void 0)return;dt=2}const _t=R.drawRange,ft=R.attributes.position;let zt=_t.start*dt,ee=(_t.start+_t.count)*dt;G!==null&&(zt=Math.max(zt,G.start*dt),ee=Math.min(ee,(G.start+G.count)*dt)),it!==null?(zt=Math.max(zt,0),ee=Math.min(ee,it.count)):ft!=null&&(zt=Math.max(zt,0),ee=Math.min(ee,ft.count));const _e=ee-zt;if(_e<0||_e===1/0)return;pe.setup(P,L,ct,R,it);let tn,oe=ht;if(it!==null&&(tn=X.get(it),oe=Zt,oe.setIndex(tn)),P.isMesh)L.wireframe===!0?(Tt.setLineWidth(L.wireframeLinewidth*de()),oe.setMode(k.LINES)):oe.setMode(k.TRIANGLES);else if(P.isLine){let Dt=L.linewidth;Dt===void 0&&(Dt=1),Tt.setLineWidth(Dt*de()),P.isLineSegments?oe.setMode(k.LINES):P.isLineLoop?oe.setMode(k.LINE_LOOP):oe.setMode(k.LINE_STRIP)}else P.isPoints?oe.setMode(k.POINTS):P.isSprite&&oe.setMode(k.TRIANGLES);if(P.isBatchedMesh)if(P._multiDrawInstances!==null)oe.renderMultiDrawInstances(P._multiDrawStarts,P._multiDrawCounts,P._multiDrawCount,P._multiDrawInstances);else if(ie.get("WEBGL_multi_draw"))oe.renderMultiDraw(P._multiDrawStarts,P._multiDrawCounts,P._multiDrawCount);else{const Dt=P._multiDrawStarts,Ue=P._multiDrawCounts,ae=P._multiDrawCount,Dn=it?X.get(it).bytesPerElement:1,ss=nt.get(L).currentProgram.getUniforms();for(let vn=0;vn<ae;vn++)ss.setValue(k,"_gl_DrawID",vn),oe.render(Dt[vn]/Dn,Ue[vn])}else if(P.isInstancedMesh)oe.renderInstances(zt,_e,P.count);else if(R.isInstancedBufferGeometry){const Dt=R._maxInstanceCount!==void 0?R._maxInstanceCount:1/0,Ue=Math.min(R.instanceCount,Dt);oe.renderInstances(zt,_e,Ue)}else oe.render(zt,_e)};function Bt(f,b,R){f.transparent===!0&&f.side===le&&f.forceSinglePass===!1?(f.side=xn,f.needsUpdate=!0,Di(f,b,R),f.side=Ai,f.needsUpdate=!0,Di(f,b,R),f.side=le):Di(f,b,R)}this.compile=function(f,b,R=null){R===null&&(R=f),u=Ct.get(R),u.init(b),A.push(u),R.traverseVisible(function(P){P.isLight&&P.layers.test(b.layers)&&(u.pushLight(P),P.castShadow&&u.pushShadow(P))}),f!==R&&f.traverseVisible(function(P){P.isLight&&P.layers.test(b.layers)&&(u.pushLight(P),P.castShadow&&u.pushShadow(P))}),u.setupLights();const L=new Set;return f.traverse(function(P){if(!(P.isMesh||P.isPoints||P.isLine||P.isSprite))return;const G=P.material;if(G)if(Array.isArray(G))for(let W=0;W<G.length;W++){const ct=G[W];Bt(ct,R,P),L.add(ct)}else Bt(G,R,P),L.add(G)}),A.pop(),u=null,L},this.compileAsync=function(f,b,R=null){const L=this.compile(f,b,R);return new Promise(P=>{function G(){if(L.forEach(function(W){nt.get(W).currentProgram.isReady()&&L.delete(W)}),L.size===0){P(f);return}setTimeout(G,10)}ie.get("KHR_parallel_shader_compile")!==null?G():setTimeout(G,10)})};let Qe=null;function En(f){Qe&&Qe(f)}function Ws(){Tn.stop()}function ui(){Tn.start()}const Tn=new rh;Tn.setAnimationLoop(En),typeof self<"u"&&Tn.setContext(self),this.setAnimationLoop=function(f){Qe=f,J.setAnimationLoop(f),f===null?Tn.stop():Tn.start()},J.addEventListener("sessionstart",Ws),J.addEventListener("sessionend",ui),this.render=function(f,b){if(b!==void 0&&b.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(B===!0)return;if(f.matrixWorldAutoUpdate===!0&&f.updateMatrixWorld(),b.parent===null&&b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),J.enabled===!0&&J.isPresenting===!0&&(J.cameraAutoUpdate===!0&&J.updateCamera(b),b=J.getCamera()),f.isScene===!0&&f.onBeforeRender(w,f,b,F),u=Ct.get(f,A.length),u.init(b),A.push(u),St.multiplyMatrices(b.projectionMatrix,b.matrixWorldInverse),q.setFromProjectionMatrix(St),Et=this.localClippingEnabled,pt=ot.init(this.clippingPlanes,Et),g=ut.get(f,S.length),g.init(),S.push(g),J.enabled===!0&&J.isPresenting===!0){const G=w.xr.getDepthSensingMesh();G!==null&&is(G,b,-1/0,w.sortObjects)}is(f,b,0,w.sortObjects),g.finish(),w.sortObjects===!0&&g.sort(yt,xt),Qt=J.enabled===!1||J.isPresenting===!1||J.hasDepthSensing()===!1,Qt&&Ot.addToRenderList(g,f),this.info.render.frame++,pt===!0&&ot.beginShadows();const R=u.state.shadowsArray;gt.render(R,f,b),pt===!0&&ot.endShadows(),this.info.autoReset===!0&&this.info.reset();const L=g.opaque,P=g.transmissive;if(u.setupLights(),b.isArrayCamera){const G=b.cameras;if(P.length>0)for(let W=0,ct=G.length;W<ct;W++){const it=G[W];Xs(L,P,f,it)}Qt&&Ot.render(f);for(let W=0,ct=G.length;W<ct;W++){const it=G[W];Kn(g,f,it,it.viewport)}}else P.length>0&&Xs(L,P,f,b),Qt&&Ot.render(f),Kn(g,f,b);F!==null&&(E.updateMultisampleRenderTarget(F),E.updateRenderTargetMipmap(F)),f.isScene===!0&&f.onAfterRender(w,f,b),pe.resetDefaultState(),T=-1,M=null,A.pop(),A.length>0?(u=A[A.length-1],pt===!0&&ot.setGlobalState(w.clippingPlanes,u.state.camera)):u=null,S.pop(),S.length>0?g=S[S.length-1]:g=null};function is(f,b,R,L){if(f.visible===!1)return;if(f.layers.test(b.layers)){if(f.isGroup)R=f.renderOrder;else if(f.isLOD)f.autoUpdate===!0&&f.update(b);else if(f.isLight)u.pushLight(f),f.castShadow&&u.pushShadow(f);else if(f.isSprite){if(!f.frustumCulled||q.intersectsSprite(f)){L&&$t.setFromMatrixPosition(f.matrixWorld).applyMatrix4(St);const W=j.update(f),ct=f.material;ct.visible&&g.push(f,W,ct,R,$t.z,null)}}else if((f.isMesh||f.isLine||f.isPoints)&&(!f.frustumCulled||q.intersectsObject(f))){const W=j.update(f),ct=f.material;if(L&&(f.boundingSphere!==void 0?(f.boundingSphere===null&&f.computeBoundingSphere(),$t.copy(f.boundingSphere.center)):(W.boundingSphere===null&&W.computeBoundingSphere(),$t.copy(W.boundingSphere.center)),$t.applyMatrix4(f.matrixWorld).applyMatrix4(St)),Array.isArray(ct)){const it=W.groups;for(let dt=0,_t=it.length;dt<_t;dt++){const ft=it[dt],zt=ct[ft.materialIndex];zt&&zt.visible&&g.push(f,W,zt,R,$t.z,ft)}}else ct.visible&&g.push(f,W,ct,R,$t.z,null)}}const G=f.children;for(let W=0,ct=G.length;W<ct;W++)is(G[W],b,R,L)}function Kn(f,b,R,L){const P=f.opaque,G=f.transmissive,W=f.transparent;u.setupLightsView(R),pt===!0&&ot.setGlobalState(w.clippingPlanes,R),L&&Tt.viewport(I.copy(L)),P.length>0&&Pi(P,b,R),G.length>0&&Pi(G,b,R),W.length>0&&Pi(W,b,R),Tt.buffers.depth.setTest(!0),Tt.buffers.depth.setMask(!0),Tt.buffers.color.setMask(!0),Tt.setPolygonOffset(!1)}function Xs(f,b,R,L){if((R.isScene===!0?R.overrideMaterial:null)!==null)return;u.state.transmissionRenderTarget[L.id]===void 0&&(u.state.transmissionRenderTarget[L.id]=new Ki(1,1,{generateMipmaps:!0,type:ie.has("EXT_color_buffer_half_float")||ie.has("EXT_color_buffer_float")?ur:di,minFilter:Xi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ce.workingColorSpace}));const G=u.state.transmissionRenderTarget[L.id],W=L.viewport||I;G.setSize(W.z,W.w);const ct=w.getRenderTarget();w.setRenderTarget(G),w.getClearColor($),st=w.getClearAlpha(),st<1&&w.setClearColor(16777215,.5),w.clear(),Qt&&Ot.render(R);const it=w.toneMapping;w.toneMapping=Ei;const dt=L.viewport;if(L.viewport!==void 0&&(L.viewport=void 0),u.setupLightsView(L),pt===!0&&ot.setGlobalState(w.clippingPlanes,L),Pi(f,R,L),E.updateMultisampleRenderTarget(G),E.updateRenderTargetMipmap(G),ie.has("WEBGL_multisampled_render_to_texture")===!1){let _t=!1;for(let ft=0,zt=b.length;ft<zt;ft++){const ee=b[ft],_e=ee.object,tn=ee.geometry,oe=ee.material,Dt=ee.group;if(oe.side===le&&_e.layers.test(L.layers)){const Ue=oe.side;oe.side=xn,oe.needsUpdate=!0,Li(_e,R,L,tn,oe,Dt),oe.side=Ue,oe.needsUpdate=!0,_t=!0}}_t===!0&&(E.updateMultisampleRenderTarget(G),E.updateRenderTargetMipmap(G))}w.setRenderTarget(ct),w.setClearColor($,st),dt!==void 0&&(L.viewport=dt),w.toneMapping=it}function Pi(f,b,R){const L=b.isScene===!0?b.overrideMaterial:null;for(let P=0,G=f.length;P<G;P++){const W=f[P],ct=W.object,it=W.geometry,dt=L===null?W.material:L,_t=W.group;ct.layers.test(R.layers)&&Li(ct,b,R,it,dt,_t)}}function Li(f,b,R,L,P,G){f.onBeforeRender(w,b,R,L,P,G),f.modelViewMatrix.multiplyMatrices(R.matrixWorldInverse,f.matrixWorld),f.normalMatrix.getNormalMatrix(f.modelViewMatrix),P.onBeforeRender(w,b,R,L,f,G),P.transparent===!0&&P.side===le&&P.forceSinglePass===!1?(P.side=xn,P.needsUpdate=!0,w.renderBufferDirect(R,b,L,P,f,G),P.side=Ai,P.needsUpdate=!0,w.renderBufferDirect(R,b,L,P,f,G),P.side=le):w.renderBufferDirect(R,b,L,P,f,G),f.onAfterRender(w,b,R,L,P,G)}function Di(f,b,R){b.isScene!==!0&&(b=fe);const L=nt.get(f),P=u.state.lights,G=u.state.shadowsArray,W=P.state.version,ct=Ft.getParameters(f,P.state,G,b,R),it=Ft.getProgramCacheKey(ct);let dt=L.programs;L.environment=f.isMeshStandardMaterial?b.environment:null,L.fog=b.fog,L.envMap=(f.isMeshStandardMaterial?O:_).get(f.envMap||L.environment),L.envMapRotation=L.environment!==null&&f.envMap===null?b.environmentRotation:f.envMapRotation,dt===void 0&&(f.addEventListener("dispose",jt),dt=new Map,L.programs=dt);let _t=dt.get(it);if(_t!==void 0){if(L.currentProgram===_t&&L.lightsStateVersion===W)return zn(f,ct),_t}else ct.uniforms=Ft.getUniforms(f),f.onBeforeCompile(ct,w),_t=Ft.acquireProgram(ct,it),dt.set(it,_t),L.uniforms=ct.uniforms;const ft=L.uniforms;return(!f.isShaderMaterial&&!f.isRawShaderMaterial||f.clipping===!0)&&(ft.clippingPlanes=ot.uniform),zn(f,ct),L.needsLights=U(f),L.lightsStateVersion=W,L.needsLights&&(ft.ambientLightColor.value=P.state.ambient,ft.lightProbe.value=P.state.probe,ft.directionalLights.value=P.state.directional,ft.directionalLightShadows.value=P.state.directionalShadow,ft.spotLights.value=P.state.spot,ft.spotLightShadows.value=P.state.spotShadow,ft.rectAreaLights.value=P.state.rectArea,ft.ltc_1.value=P.state.rectAreaLTC1,ft.ltc_2.value=P.state.rectAreaLTC2,ft.pointLights.value=P.state.point,ft.pointLightShadows.value=P.state.pointShadow,ft.hemisphereLights.value=P.state.hemi,ft.directionalShadowMap.value=P.state.directionalShadowMap,ft.directionalShadowMatrix.value=P.state.directionalShadowMatrix,ft.spotShadowMap.value=P.state.spotShadowMap,ft.spotLightMatrix.value=P.state.spotLightMatrix,ft.spotLightMap.value=P.state.spotLightMap,ft.pointShadowMap.value=P.state.pointShadowMap,ft.pointShadowMatrix.value=P.state.pointShadowMatrix),L.currentProgram=_t,L.uniformsList=null,_t}function Zn(f){if(f.uniformsList===null){const b=f.currentProgram.getUniforms();f.uniformsList=Jr.seqWithValue(b.seq,f.uniforms)}return f.uniformsList}function zn(f,b){const R=nt.get(f);R.outputColorSpace=b.outputColorSpace,R.batching=b.batching,R.batchingColor=b.batchingColor,R.instancing=b.instancing,R.instancingColor=b.instancingColor,R.instancingMorph=b.instancingMorph,R.skinning=b.skinning,R.morphTargets=b.morphTargets,R.morphNormals=b.morphNormals,R.morphColors=b.morphColors,R.morphTargetsCount=b.morphTargetsCount,R.numClippingPlanes=b.numClippingPlanes,R.numIntersection=b.numClipIntersection,R.vertexAlphas=b.vertexAlphas,R.vertexTangents=b.vertexTangents,R.toneMapping=b.toneMapping}function me(f,b,R,L,P){b.isScene!==!0&&(b=fe),E.resetTextureUnits();const G=b.fog,W=L.isMeshStandardMaterial?b.environment:null,ct=F===null?w.outputColorSpace:F.isXRRenderTarget===!0?F.texture.colorSpace:Bs,it=(L.isMeshStandardMaterial?O:_).get(L.envMap||W),dt=L.vertexColors===!0&&!!R.attributes.color&&R.attributes.color.itemSize===4,_t=!!R.attributes.tangent&&(!!L.normalMap||L.anisotropy>0),ft=!!R.morphAttributes.position,zt=!!R.morphAttributes.normal,ee=!!R.morphAttributes.color;let _e=Ei;L.toneMapped&&(F===null||F.isXRRenderTarget===!0)&&(_e=w.toneMapping);const tn=R.morphAttributes.position||R.morphAttributes.normal||R.morphAttributes.color,oe=tn!==void 0?tn.length:0,Dt=nt.get(L),Ue=u.state.lights;if(pt===!0&&(Et===!0||f!==M)){const An=f===M&&L.id===T;ot.setState(L,f,An)}let ae=!1;L.version===Dt.__version?(Dt.needsLights&&Dt.lightsStateVersion!==Ue.state.version||Dt.outputColorSpace!==ct||P.isBatchedMesh&&Dt.batching===!1||!P.isBatchedMesh&&Dt.batching===!0||P.isBatchedMesh&&Dt.batchingColor===!0&&P.colorTexture===null||P.isBatchedMesh&&Dt.batchingColor===!1&&P.colorTexture!==null||P.isInstancedMesh&&Dt.instancing===!1||!P.isInstancedMesh&&Dt.instancing===!0||P.isSkinnedMesh&&Dt.skinning===!1||!P.isSkinnedMesh&&Dt.skinning===!0||P.isInstancedMesh&&Dt.instancingColor===!0&&P.instanceColor===null||P.isInstancedMesh&&Dt.instancingColor===!1&&P.instanceColor!==null||P.isInstancedMesh&&Dt.instancingMorph===!0&&P.morphTexture===null||P.isInstancedMesh&&Dt.instancingMorph===!1&&P.morphTexture!==null||Dt.envMap!==it||L.fog===!0&&Dt.fog!==G||Dt.numClippingPlanes!==void 0&&(Dt.numClippingPlanes!==ot.numPlanes||Dt.numIntersection!==ot.numIntersection)||Dt.vertexAlphas!==dt||Dt.vertexTangents!==_t||Dt.morphTargets!==ft||Dt.morphNormals!==zt||Dt.morphColors!==ee||Dt.toneMapping!==_e||Dt.morphTargetsCount!==oe)&&(ae=!0):(ae=!0,Dt.__version=L.version);let Dn=Dt.currentProgram;ae===!0&&(Dn=Di(L,b,P));let ss=!1,vn=!1,qs=!1;const Ce=Dn.getUniforms(),Bn=Dt.uniforms;if(Tt.useProgram(Dn.program)&&(ss=!0,vn=!0,qs=!0),L.id!==T&&(T=L.id,vn=!0),ss||M!==f){Tt.buffers.depth.getReversed()?(mt.copy(f.projectionMatrix),Id(mt),Ud(mt),Ce.setValue(k,"projectionMatrix",mt)):Ce.setValue(k,"projectionMatrix",f.projectionMatrix),Ce.setValue(k,"viewMatrix",f.matrixWorldInverse);const fi=Ce.map.cameraPosition;fi!==void 0&&fi.setValue(k,Vt.setFromMatrixPosition(f.matrixWorld)),Kt.logarithmicDepthBuffer&&Ce.setValue(k,"logDepthBufFC",2/(Math.log(f.far+1)/Math.LN2)),(L.isMeshPhongMaterial||L.isMeshToonMaterial||L.isMeshLambertMaterial||L.isMeshBasicMaterial||L.isMeshStandardMaterial||L.isShaderMaterial)&&Ce.setValue(k,"isOrthographic",f.isOrthographicCamera===!0),M!==f&&(M=f,vn=!0,qs=!0)}if(P.isSkinnedMesh){Ce.setOptional(k,P,"bindMatrix"),Ce.setOptional(k,P,"bindMatrixInverse");const An=P.skeleton;An&&(An.boneTexture===null&&An.computeBoneTexture(),Ce.setValue(k,"boneTexture",An.boneTexture,E))}P.isBatchedMesh&&(Ce.setOptional(k,P,"batchingTexture"),Ce.setValue(k,"batchingTexture",P._matricesTexture,E),Ce.setOptional(k,P,"batchingIdTexture"),Ce.setValue(k,"batchingIdTexture",P._indirectTexture,E),Ce.setOptional(k,P,"batchingColorTexture"),P._colorsTexture!==null&&Ce.setValue(k,"batchingColorTexture",P._colorsTexture,E));const Ys=R.morphAttributes;if((Ys.position!==void 0||Ys.normal!==void 0||Ys.color!==void 0)&&Gt.update(P,R,Dn),(vn||Dt.receiveShadow!==P.receiveShadow)&&(Dt.receiveShadow=P.receiveShadow,Ce.setValue(k,"receiveShadow",P.receiveShadow)),L.isMeshGouraudMaterial&&L.envMap!==null&&(Bn.envMap.value=it,Bn.flipEnvMap.value=it.isCubeTexture&&it.isRenderTargetTexture===!1?-1:1),L.isMeshStandardMaterial&&L.envMap===null&&b.environment!==null&&(Bn.envMapIntensity.value=b.environmentIntensity),vn&&(Ce.setValue(k,"toneMappingExposure",w.toneMappingExposure),Dt.needsLights&&Ze(Bn,qs),G&&L.fog===!0&&lt.refreshFogUniforms(Bn,G),lt.refreshMaterialUniforms(Bn,L,Y,rt,u.state.transmissionRenderTarget[f.id]),Jr.upload(k,Zn(Dt),Bn,E)),L.isShaderMaterial&&L.uniformsNeedUpdate===!0&&(Jr.upload(k,Zn(Dt),Bn,E),L.uniformsNeedUpdate=!1),L.isSpriteMaterial&&Ce.setValue(k,"center",P.center),Ce.setValue(k,"modelViewMatrix",P.modelViewMatrix),Ce.setValue(k,"normalMatrix",P.normalMatrix),Ce.setValue(k,"modelMatrix",P.matrixWorld),L.isShaderMaterial||L.isRawShaderMaterial){const An=L.uniformsGroups;for(let fi=0,pi=An.length;fi<pi;fi++){const fc=An[fi];z.update(fc,Dn),z.bind(fc,Dn)}}return Dn}function Ze(f,b){f.ambientLightColor.needsUpdate=b,f.lightProbe.needsUpdate=b,f.directionalLights.needsUpdate=b,f.directionalLightShadows.needsUpdate=b,f.pointLights.needsUpdate=b,f.pointLightShadows.needsUpdate=b,f.spotLights.needsUpdate=b,f.spotLightShadows.needsUpdate=b,f.rectAreaLights.needsUpdate=b,f.hemisphereLights.needsUpdate=b}function U(f){return f.isMeshLambertMaterial||f.isMeshToonMaterial||f.isMeshPhongMaterial||f.isMeshStandardMaterial||f.isShadowMaterial||f.isShaderMaterial&&f.lights===!0}this.getActiveCubeFace=function(){return D},this.getActiveMipmapLevel=function(){return N},this.getRenderTarget=function(){return F},this.setRenderTargetTextures=function(f,b,R){nt.get(f.texture).__webglTexture=b,nt.get(f.depthTexture).__webglTexture=R;const L=nt.get(f);L.__hasExternalTextures=!0,L.__autoAllocateDepthBuffer=R===void 0,L.__autoAllocateDepthBuffer||ie.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),L.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(f,b){const R=nt.get(f);R.__webglFramebuffer=b,R.__useDefaultFramebuffer=b===void 0},this.setRenderTarget=function(f,b=0,R=0){F=f,D=b,N=R;let L=!0,P=null,G=!1,W=!1;if(f){const it=nt.get(f);if(it.__useDefaultFramebuffer!==void 0)Tt.bindFramebuffer(k.FRAMEBUFFER,null),L=!1;else if(it.__webglFramebuffer===void 0)E.setupRenderTarget(f);else if(it.__hasExternalTextures)E.rebindTextures(f,nt.get(f.texture).__webglTexture,nt.get(f.depthTexture).__webglTexture);else if(f.depthBuffer){const ft=f.depthTexture;if(it.__boundDepthTexture!==ft){if(ft!==null&&nt.has(ft)&&(f.width!==ft.image.width||f.height!==ft.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");E.setupDepthRenderbuffer(f)}}const dt=f.texture;(dt.isData3DTexture||dt.isDataArrayTexture||dt.isCompressedArrayTexture)&&(W=!0);const _t=nt.get(f).__webglFramebuffer;f.isWebGLCubeRenderTarget?(Array.isArray(_t[b])?P=_t[b][R]:P=_t[b],G=!0):f.samples>0&&E.useMultisampledRTT(f)===!1?P=nt.get(f).__webglMultisampledFramebuffer:Array.isArray(_t)?P=_t[R]:P=_t,I.copy(f.viewport),H.copy(f.scissor),V=f.scissorTest}else I.copy(Ut).multiplyScalar(Y).floor(),H.copy(Yt).multiplyScalar(Y).floor(),V=Nt;if(Tt.bindFramebuffer(k.FRAMEBUFFER,P)&&L&&Tt.drawBuffers(f,P),Tt.viewport(I),Tt.scissor(H),Tt.setScissorTest(V),G){const it=nt.get(f.texture);k.framebufferTexture2D(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_CUBE_MAP_POSITIVE_X+b,it.__webglTexture,R)}else if(W){const it=nt.get(f.texture),dt=b||0;k.framebufferTextureLayer(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,it.__webglTexture,R||0,dt)}T=-1},this.readRenderTargetPixels=function(f,b,R,L,P,G,W){if(!(f&&f.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ct=nt.get(f).__webglFramebuffer;if(f.isWebGLCubeRenderTarget&&W!==void 0&&(ct=ct[W]),ct){Tt.bindFramebuffer(k.FRAMEBUFFER,ct);try{const it=f.texture,dt=it.format,_t=it.type;if(!Kt.textureFormatReadable(dt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Kt.textureTypeReadable(_t)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}b>=0&&b<=f.width-L&&R>=0&&R<=f.height-P&&k.readPixels(b,R,L,P,Wt.convert(dt),Wt.convert(_t),G)}finally{const it=F!==null?nt.get(F).__webglFramebuffer:null;Tt.bindFramebuffer(k.FRAMEBUFFER,it)}}},this.readRenderTargetPixelsAsync=async function(f,b,R,L,P,G,W){if(!(f&&f.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ct=nt.get(f).__webglFramebuffer;if(f.isWebGLCubeRenderTarget&&W!==void 0&&(ct=ct[W]),ct){const it=f.texture,dt=it.format,_t=it.type;if(!Kt.textureFormatReadable(dt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Kt.textureTypeReadable(_t))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(b>=0&&b<=f.width-L&&R>=0&&R<=f.height-P){Tt.bindFramebuffer(k.FRAMEBUFFER,ct);const ft=k.createBuffer();k.bindBuffer(k.PIXEL_PACK_BUFFER,ft),k.bufferData(k.PIXEL_PACK_BUFFER,G.byteLength,k.STREAM_READ),k.readPixels(b,R,L,P,Wt.convert(dt),Wt.convert(_t),0);const zt=F!==null?nt.get(F).__webglFramebuffer:null;Tt.bindFramebuffer(k.FRAMEBUFFER,zt);const ee=k.fenceSync(k.SYNC_GPU_COMMANDS_COMPLETE,0);return k.flush(),await Dd(k,ee,4),k.bindBuffer(k.PIXEL_PACK_BUFFER,ft),k.getBufferSubData(k.PIXEL_PACK_BUFFER,0,G),k.deleteBuffer(ft),k.deleteSync(ee),G}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(f,b=null,R=0){f.isTexture!==!0&&(sr("WebGLRenderer: copyFramebufferToTexture function signature has changed."),b=arguments[0]||null,f=arguments[1]);const L=Math.pow(2,-R),P=Math.floor(f.image.width*L),G=Math.floor(f.image.height*L),W=b!==null?b.x:0,ct=b!==null?b.y:0;E.setTexture2D(f,0),k.copyTexSubImage2D(k.TEXTURE_2D,R,0,0,W,ct,P,G),Tt.unbindTexture()},this.copyTextureToTexture=function(f,b,R=null,L=null,P=0){f.isTexture!==!0&&(sr("WebGLRenderer: copyTextureToTexture function signature has changed."),L=arguments[0]||null,f=arguments[1],b=arguments[2],P=arguments[3]||0,R=null);let G,W,ct,it,dt,_t,ft,zt,ee;const _e=f.isCompressedTexture?f.mipmaps[P]:f.image;R!==null?(G=R.max.x-R.min.x,W=R.max.y-R.min.y,ct=R.isBox3?R.max.z-R.min.z:1,it=R.min.x,dt=R.min.y,_t=R.isBox3?R.min.z:0):(G=_e.width,W=_e.height,ct=_e.depth||1,it=0,dt=0,_t=0),L!==null?(ft=L.x,zt=L.y,ee=L.z):(ft=0,zt=0,ee=0);const tn=Wt.convert(b.format),oe=Wt.convert(b.type);let Dt;b.isData3DTexture?(E.setTexture3D(b,0),Dt=k.TEXTURE_3D):b.isDataArrayTexture||b.isCompressedArrayTexture?(E.setTexture2DArray(b,0),Dt=k.TEXTURE_2D_ARRAY):(E.setTexture2D(b,0),Dt=k.TEXTURE_2D),k.pixelStorei(k.UNPACK_FLIP_Y_WEBGL,b.flipY),k.pixelStorei(k.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),k.pixelStorei(k.UNPACK_ALIGNMENT,b.unpackAlignment);const Ue=k.getParameter(k.UNPACK_ROW_LENGTH),ae=k.getParameter(k.UNPACK_IMAGE_HEIGHT),Dn=k.getParameter(k.UNPACK_SKIP_PIXELS),ss=k.getParameter(k.UNPACK_SKIP_ROWS),vn=k.getParameter(k.UNPACK_SKIP_IMAGES);k.pixelStorei(k.UNPACK_ROW_LENGTH,_e.width),k.pixelStorei(k.UNPACK_IMAGE_HEIGHT,_e.height),k.pixelStorei(k.UNPACK_SKIP_PIXELS,it),k.pixelStorei(k.UNPACK_SKIP_ROWS,dt),k.pixelStorei(k.UNPACK_SKIP_IMAGES,_t);const qs=f.isDataArrayTexture||f.isData3DTexture,Ce=b.isDataArrayTexture||b.isData3DTexture;if(f.isRenderTargetTexture||f.isDepthTexture){const Bn=nt.get(f),Ys=nt.get(b),An=nt.get(Bn.__renderTarget),fi=nt.get(Ys.__renderTarget);Tt.bindFramebuffer(k.READ_FRAMEBUFFER,An.__webglFramebuffer),Tt.bindFramebuffer(k.DRAW_FRAMEBUFFER,fi.__webglFramebuffer);for(let pi=0;pi<ct;pi++)qs&&k.framebufferTextureLayer(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,nt.get(f).__webglTexture,P,_t+pi),f.isDepthTexture?(Ce&&k.framebufferTextureLayer(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,nt.get(b).__webglTexture,P,ee+pi),k.blitFramebuffer(it,dt,G,W,ft,zt,G,W,k.DEPTH_BUFFER_BIT,k.NEAREST)):Ce?k.copyTexSubImage3D(Dt,P,ft,zt,ee+pi,it,dt,G,W):k.copyTexSubImage2D(Dt,P,ft,zt,ee+pi,it,dt,G,W);Tt.bindFramebuffer(k.READ_FRAMEBUFFER,null),Tt.bindFramebuffer(k.DRAW_FRAMEBUFFER,null)}else Ce?f.isDataTexture||f.isData3DTexture?k.texSubImage3D(Dt,P,ft,zt,ee,G,W,ct,tn,oe,_e.data):b.isCompressedArrayTexture?k.compressedTexSubImage3D(Dt,P,ft,zt,ee,G,W,ct,tn,_e.data):k.texSubImage3D(Dt,P,ft,zt,ee,G,W,ct,tn,oe,_e):f.isDataTexture?k.texSubImage2D(k.TEXTURE_2D,P,ft,zt,G,W,tn,oe,_e.data):f.isCompressedTexture?k.compressedTexSubImage2D(k.TEXTURE_2D,P,ft,zt,_e.width,_e.height,tn,_e.data):k.texSubImage2D(k.TEXTURE_2D,P,ft,zt,G,W,tn,oe,_e);k.pixelStorei(k.UNPACK_ROW_LENGTH,Ue),k.pixelStorei(k.UNPACK_IMAGE_HEIGHT,ae),k.pixelStorei(k.UNPACK_SKIP_PIXELS,Dn),k.pixelStorei(k.UNPACK_SKIP_ROWS,ss),k.pixelStorei(k.UNPACK_SKIP_IMAGES,vn),P===0&&b.generateMipmaps&&k.generateMipmap(Dt),Tt.unbindTexture()},this.copyTextureToTexture3D=function(f,b,R=null,L=null,P=0){return f.isTexture!==!0&&(sr("WebGLRenderer: copyTextureToTexture3D function signature has changed."),R=arguments[0]||null,L=arguments[1]||null,f=arguments[2],b=arguments[3],P=arguments[4]||0),sr('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(f,b,R,L,P)},this.initRenderTarget=function(f){nt.get(f).__webglFramebuffer===void 0&&E.setupRenderTarget(f)},this.initTexture=function(f){f.isCubeTexture?E.setTextureCube(f,0):f.isData3DTexture?E.setTexture3D(f,0):f.isDataArrayTexture||f.isCompressedArrayTexture?E.setTexture2DArray(f,0):E.setTexture2D(f,0),Tt.unbindTexture()},this.resetState=function(){D=0,N=0,F=null,Tt.reset(),pe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ri}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=ce._getDrawingBufferColorSpace(t),e.unpackColorSpace=ce._getUnpackColorSpace()}}class ic{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new Ht(t),this.near=e,this.far=n}clone(){return new ic(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class X0 extends We{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new qn,this.environmentIntensity=1,this.environmentRotation=new qn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class q0{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=Fa,this.updateRanges=[],this.version=0,this.uuid=Ti()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let s=0,r=this.stride;s<r;s++)this.array[t+s]=e.array[n+s];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Ti()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Ti()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const fn=new C;class to{constructor(t,e,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)fn.fromBufferAttribute(this,e),fn.applyMatrix4(t),this.setXYZ(e,fn.x,fn.y,fn.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)fn.fromBufferAttribute(this,e),fn.applyNormalMatrix(t),this.setXYZ(e,fn.x,fn.y,fn.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)fn.fromBufferAttribute(this,e),fn.transformDirection(t),this.setXYZ(e,fn.x,fn.y,fn.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=Gn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=ye(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=ye(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=ye(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=ye(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=ye(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=Gn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=Gn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=Gn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=Gn(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=ye(e,this.array),n=ye(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=ye(e,this.array),n=ye(n,this.array),s=ye(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=ye(e,this.array),n=ye(n,this.array),s=ye(s,this.array),r=ye(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=s,this.data.array[t+3]=r,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[s+r])}return new un(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new to(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class je extends es{static get type(){return"SpriteMaterial"}constructor(t){super(),this.isSpriteMaterial=!0,this.color=new Ht(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let vs;const js=new C,ys=new C,Ms=new C,Ss=new bt,Qs=new bt,uh=new he,Or=new C,tr=new C,zr=new C,hl=new bt,Wo=new bt,dl=new bt;class en extends We{constructor(t=new je){if(super(),this.isSprite=!0,this.type="Sprite",vs===void 0){vs=new qe;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new q0(e,5);vs.setIndex([0,1,2,0,2,3]),vs.setAttribute("position",new to(n,3,0,!1)),vs.setAttribute("uv",new to(n,2,3,!1))}this.geometry=vs,this.material=t,this.center=new bt(.5,.5)}raycast(t,e){t.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),ys.setFromMatrixScale(this.matrixWorld),uh.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),Ms.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&ys.multiplyScalar(-Ms.z);const n=this.material.rotation;let s,r;n!==0&&(r=Math.cos(n),s=Math.sin(n));const o=this.center;Br(Or.set(-.5,-.5,0),Ms,o,ys,s,r),Br(tr.set(.5,-.5,0),Ms,o,ys,s,r),Br(zr.set(.5,.5,0),Ms,o,ys,s,r),hl.set(0,0),Wo.set(1,0),dl.set(1,1);let a=t.ray.intersectTriangle(Or,tr,zr,!1,js);if(a===null&&(Br(tr.set(-.5,.5,0),Ms,o,ys,s,r),Wo.set(0,1),a=t.ray.intersectTriangle(Or,zr,tr,!1,js),a===null))return;const c=t.ray.origin.distanceTo(js);c<t.near||c>t.far||e.push({distance:c,point:js.clone(),uv:Rn.getInterpolation(js,Or,tr,zr,hl,Wo,dl,new bt),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function Br(i,t,e,n,s,r){Ss.subVectors(i,e).addScalar(.5).multiply(n),s!==void 0?(Qs.x=r*Ss.x-s*Ss.y,Qs.y=s*Ss.x+r*Ss.y):Qs.copy(Ss),i.copy(t),i.x+=Qs.x,i.y+=Qs.y,i.applyMatrix4(uh)}class co extends dn{constructor(t=null,e=1,n=1,s,r,o,a,c,l=Ve,h=Ve,d,m){super(null,o,a,c,l,h,s,r,d,m),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class ul extends un{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const ws=new he,fl=new he,kr=[],pl=new ts,Y0=new he,er=new K,nr=new Hs;class bs extends K{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new ul(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Y0)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new ts),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,ws),pl.copy(t.boundingBox).applyMatrix4(ws),this.boundingBox.union(pl)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Hs),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,ws),nr.copy(t.boundingSphere).applyMatrix4(ws),this.boundingSphere.union(nr)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=t*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(t,e){const n=this.matrixWorld,s=this.count;if(er.geometry=this.geometry,er.material=this.material,er.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),nr.copy(this.boundingSphere),nr.applyMatrix4(n),t.ray.intersectsSphere(nr)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,ws),fl.multiplyMatrices(n,ws),er.matrixWorld=fl,er.raycast(t,kr);for(let o=0,a=kr.length;o<a;o++){const c=kr[o];c.instanceId=r,c.object=this,e.push(c)}kr.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new ul(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new co(new Float32Array(s*this.count),s,this.count,Ja,Wn));const r=this.morphTexture.source.data.data;let o=0;for(let l=0;l<n.length;l++)o+=n[l];const a=this.geometry.morphTargetsRelative?1:1-o,c=s*t;r[c]=a,r.set(n,c+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class eo extends es{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new Ht(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const ml=new he,Ba=new Jl,Hr=new Hs,Gr=new C;class ka extends We{constructor(t=new qe,e=new eo){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Hr.copy(n.boundingSphere),Hr.applyMatrix4(s),Hr.radius+=r,t.ray.intersectsSphere(Hr)===!1)return;ml.copy(s).invert(),Ba.copy(t.ray).applyMatrix4(ml);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=n.index,d=n.attributes.position;if(l!==null){const m=Math.max(0,o.start),p=Math.min(l.count,o.start+o.count);for(let x=m,v=p;x<v;x++){const g=l.getX(x);Gr.fromBufferAttribute(d,g),gl(Gr,g,c,s,t,e,this)}}else{const m=Math.max(0,o.start),p=Math.min(d.count,o.start+o.count);for(let x=m,v=p;x<v;x++)Gr.fromBufferAttribute(d,x),gl(Gr,x,c,s,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function gl(i,t,e,n,s,r,o){const a=Ba.distanceSqToPoint(i);if(a<e){const c=new C;Ba.closestPointToPoint(i,c),c.applyMatrix4(n);const l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class ns extends dn{constructor(t,e,n,s,r,o,a,c,l){super(t,e,n,s,r,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class $n{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,s=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let s=0;const r=n.length;let o;e?o=e:o=t*n[r-1];let a=0,c=r-1,l;for(;a<=c;)if(s=Math.floor(a+(c-a)/2),l=n[s]-o,l<0)a=s+1;else if(l>0)c=s-1;else{c=s;break}if(s=c,n[s]===o)return s/(r-1);const h=n[s],m=n[s+1]-h,p=(o-h)/m;return(s+p)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);const o=this.getPoint(s),a=this.getPoint(r),c=e||(o.isVector2?new bt:new C);return c.copy(a).sub(o).normalize(),c}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new C,s=[],r=[],o=[],a=new C,c=new he;for(let p=0;p<=t;p++){const x=p/t;s[p]=this.getTangentAt(x,new C)}r[0]=new C,o[0]=new C;let l=Number.MAX_VALUE;const h=Math.abs(s[0].x),d=Math.abs(s[0].y),m=Math.abs(s[0].z);h<=l&&(l=h,n.set(1,0,0)),d<=l&&(l=d,n.set(0,1,0)),m<=l&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let p=1;p<=t;p++){if(r[p]=r[p-1].clone(),o[p]=o[p-1].clone(),a.crossVectors(s[p-1],s[p]),a.length()>Number.EPSILON){a.normalize();const x=Math.acos(nn(s[p-1].dot(s[p]),-1,1));r[p].applyMatrix4(c.makeRotationAxis(a,x))}o[p].crossVectors(s[p],r[p])}if(e===!0){let p=Math.acos(nn(r[0].dot(r[t]),-1,1));p/=t,s[0].dot(a.crossVectors(r[0],r[t]))>0&&(p=-p);for(let x=1;x<=t;x++)r[x].applyMatrix4(c.makeRotationAxis(s[x],p*x)),o[x].crossVectors(s[x],r[x])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class sc extends $n{constructor(t=0,e=0,n=1,s=1,r=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(t,e=new bt){const n=e,s=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);const a=this.aStartAngle+t*r;let c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){const h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),m=c-this.aX,p=l-this.aY;c=m*h-p*d+this.aX,l=m*d+p*h+this.aY}return n.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class $0 extends sc{constructor(t,e,n,s,r,o){super(t,e,n,n,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}}function rc(){let i=0,t=0,e=0,n=0;function s(r,o,a,c){i=r,t=a,e=-3*r+3*o-2*a-c,n=2*r-2*o+a+c}return{initCatmullRom:function(r,o,a,c,l){s(o,a,l*(a-r),l*(c-o))},initNonuniformCatmullRom:function(r,o,a,c,l,h,d){let m=(o-r)/l-(a-r)/(l+h)+(a-o)/h,p=(a-o)/h-(c-o)/(h+d)+(c-a)/d;m*=h,p*=h,s(o,a,m,p)},calc:function(r){const o=r*r,a=o*r;return i+t*r+e*o+n*a}}}const Vr=new C,Xo=new rc,qo=new rc,Yo=new rc;class K0 extends $n{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new C){const n=e,s=this.points,r=s.length,o=(r-(this.closed?0:1))*t;let a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:c===0&&a===r-1&&(a=r-2,c=1);let l,h;this.closed||a>0?l=s[(a-1)%r]:(Vr.subVectors(s[0],s[1]).add(s[0]),l=Vr);const d=s[a%r],m=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(Vr.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Vr),this.curveType==="centripetal"||this.curveType==="chordal"){const p=this.curveType==="chordal"?.5:.25;let x=Math.pow(l.distanceToSquared(d),p),v=Math.pow(d.distanceToSquared(m),p),g=Math.pow(m.distanceToSquared(h),p);v<1e-4&&(v=1),x<1e-4&&(x=v),g<1e-4&&(g=v),Xo.initNonuniformCatmullRom(l.x,d.x,m.x,h.x,x,v,g),qo.initNonuniformCatmullRom(l.y,d.y,m.y,h.y,x,v,g),Yo.initNonuniformCatmullRom(l.z,d.z,m.z,h.z,x,v,g)}else this.curveType==="catmullrom"&&(Xo.initCatmullRom(l.x,d.x,m.x,h.x,this.tension),qo.initCatmullRom(l.y,d.y,m.y,h.y,this.tension),Yo.initCatmullRom(l.z,d.z,m.z,h.z,this.tension));return n.set(Xo.calc(c),qo.calc(c),Yo.calc(c)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new C().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function xl(i,t,e,n,s){const r=(n-t)*.5,o=(s-e)*.5,a=i*i,c=i*a;return(2*e-2*n+r+o)*c+(-3*e+3*n-2*r-o)*a+r*i+e}function Z0(i,t){const e=1-i;return e*e*t}function J0(i,t){return 2*(1-i)*i*t}function j0(i,t){return i*i*t}function cr(i,t,e,n){return Z0(i,t)+J0(i,e)+j0(i,n)}function Q0(i,t){const e=1-i;return e*e*e*t}function tg(i,t){const e=1-i;return 3*e*e*i*t}function eg(i,t){return 3*(1-i)*i*i*t}function ng(i,t){return i*i*i*t}function lr(i,t,e,n,s){return Q0(i,t)+tg(i,e)+eg(i,n)+ng(i,s)}class fh extends $n{constructor(t=new bt,e=new bt,n=new bt,s=new bt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new bt){const n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(lr(t,s.x,r.x,o.x,a.x),lr(t,s.y,r.y,o.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class ig extends $n{constructor(t=new C,e=new C,n=new C,s=new C){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new C){const n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(lr(t,s.x,r.x,o.x,a.x),lr(t,s.y,r.y,o.y,a.y),lr(t,s.z,r.z,o.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class ph extends $n{constructor(t=new bt,e=new bt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new bt){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new bt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class sg extends $n{constructor(t=new C,e=new C){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new C){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new C){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class mh extends $n{constructor(t=new bt,e=new bt,n=new bt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new bt){const n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(cr(t,s.x,r.x,o.x),cr(t,s.y,r.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class rg extends $n{constructor(t=new C,e=new C,n=new C){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new C){const n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(cr(t,s.x,r.x,o.x),cr(t,s.y,r.y,o.y),cr(t,s.z,r.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class gh extends $n{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new bt){const n=e,s=this.points,r=(s.length-1)*t,o=Math.floor(r),a=r-o,c=s[o===0?o:o-1],l=s[o],h=s[o>s.length-2?s.length-1:o+1],d=s[o>s.length-3?s.length-1:o+2];return n.set(xl(a,c.x,l.x,h.x,d.x),xl(a,c.y,l.y,h.y,d.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new bt().fromArray(s))}return this}}var _l=Object.freeze({__proto__:null,ArcCurve:$0,CatmullRomCurve3:K0,CubicBezierCurve:fh,CubicBezierCurve3:ig,EllipseCurve:sc,LineCurve:ph,LineCurve3:sg,QuadraticBezierCurve:mh,QuadraticBezierCurve3:rg,SplineCurve:gh});class og extends $n{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new _l[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),s=this.getCurveLengths();let r=0;for(;r<s.length;){if(s[r]>=n){const o=s[r]-n,a=this.curves[r],c=a.getLength(),l=c===0?0:1-o/c;return a.getPointAt(l,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let s=0,r=this.curves;s<r.length;s++){const o=r[s],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,c=o.getPoints(a);for(let l=0;l<c.length;l++){const h=c[l];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(new _l[s.type]().fromJSON(s))}return this}}class ag extends og{constructor(t){super(),this.type="Path",this.currentPoint=new bt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new ph(this.currentPoint.clone(),new bt(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){const r=new mh(this.currentPoint.clone(),new bt(t,e),new bt(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,o){const a=new fh(this.currentPoint.clone(),new bt(t,e),new bt(n,s),new bt(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new gh(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,o){const a=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(t+a,e+c,n,s,r,o),this}absarc(t,e,n,s,r,o){return this.absellipse(t,e,n,n,s,r,o),this}ellipse(t,e,n,s,r,o,a,c){const l=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+l,e+h,n,s,r,o,a,c),this}absellipse(t,e,n,s,r,o,a,c){const l=new sc(t,e,n,s,r,o,a,c);if(this.curves.length>0){const d=l.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(l);const h=l.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class oc extends qe{constructor(t=[new bt(0,-.5),new bt(.5,0),new bt(0,.5)],e=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:s},e=Math.floor(e),s=nn(s,0,Math.PI*2);const r=[],o=[],a=[],c=[],l=[],h=1/e,d=new C,m=new bt,p=new C,x=new C,v=new C;let g=0,u=0;for(let S=0;S<=t.length-1;S++)switch(S){case 0:g=t[S+1].x-t[S].x,u=t[S+1].y-t[S].y,p.x=u*1,p.y=-g,p.z=u*0,v.copy(p),p.normalize(),c.push(p.x,p.y,p.z);break;case t.length-1:c.push(v.x,v.y,v.z);break;default:g=t[S+1].x-t[S].x,u=t[S+1].y-t[S].y,p.x=u*1,p.y=-g,p.z=u*0,x.copy(p),p.x+=v.x,p.y+=v.y,p.z+=v.z,p.normalize(),c.push(p.x,p.y,p.z),v.copy(x)}for(let S=0;S<=e;S++){const A=n+S*h*s,w=Math.sin(A),B=Math.cos(A);for(let D=0;D<=t.length-1;D++){d.x=t[D].x*w,d.y=t[D].y,d.z=t[D].x*B,o.push(d.x,d.y,d.z),m.x=S/e,m.y=D/(t.length-1),a.push(m.x,m.y);const N=c[3*D+0]*w,F=c[3*D+1],T=c[3*D+0]*B;l.push(N,F,T)}}for(let S=0;S<e;S++)for(let A=0;A<t.length-1;A++){const w=A+S*t.length,B=w,D=w+t.length,N=w+t.length+1,F=w+1;r.push(B,D,F),r.push(N,F,D)}this.setIndex(r),this.setAttribute("position",new Se(o,3)),this.setAttribute("uv",new Se(a,2)),this.setAttribute("normal",new Se(l,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new oc(t.points,t.segments,t.phiStart,t.phiLength)}}class Si extends oc{constructor(t=1,e=1,n=4,s=8){const r=new ag;r.absarc(0,-e/2,t,Math.PI*1.5,0),r.absarc(0,e/2,t,0,Math.PI*.5),super(r.getPoints(n),s),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:n,radialSegments:s}}static fromJSON(t){return new Si(t.radius,t.length,t.capSegments,t.radialSegments)}}class ci extends qe{constructor(t=1,e=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:s},e=Math.max(3,e);const r=[],o=[],a=[],c=[],l=new C,h=new bt;o.push(0,0,0),a.push(0,0,1),c.push(.5,.5);for(let d=0,m=3;d<=e;d++,m+=3){const p=n+d/e*s;l.x=t*Math.cos(p),l.y=t*Math.sin(p),o.push(l.x,l.y,l.z),a.push(0,0,1),h.x=(o[m]/t+1)/2,h.y=(o[m+1]/t+1)/2,c.push(h.x,h.y)}for(let d=1;d<=e;d++)r.push(d,d+1,0);this.setIndex(r),this.setAttribute("position",new Se(o,3)),this.setAttribute("normal",new Se(a,3)),this.setAttribute("uv",new Se(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ci(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class Jt extends qe{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:c};const l=this;s=Math.floor(s),r=Math.floor(r);const h=[],d=[],m=[],p=[];let x=0;const v=[],g=n/2;let u=0;S(),o===!1&&(t>0&&A(!0),e>0&&A(!1)),this.setIndex(h),this.setAttribute("position",new Se(d,3)),this.setAttribute("normal",new Se(m,3)),this.setAttribute("uv",new Se(p,2));function S(){const w=new C,B=new C;let D=0;const N=(e-t)/n;for(let F=0;F<=r;F++){const T=[],M=F/r,I=M*(e-t)+t;for(let H=0;H<=s;H++){const V=H/s,$=V*c+a,st=Math.sin($),tt=Math.cos($);B.x=I*st,B.y=-M*n+g,B.z=I*tt,d.push(B.x,B.y,B.z),w.set(st,N,tt).normalize(),m.push(w.x,w.y,w.z),p.push(V,1-M),T.push(x++)}v.push(T)}for(let F=0;F<s;F++)for(let T=0;T<r;T++){const M=v[T][F],I=v[T+1][F],H=v[T+1][F+1],V=v[T][F+1];(t>0||T!==0)&&(h.push(M,I,V),D+=3),(e>0||T!==r-1)&&(h.push(I,H,V),D+=3)}l.addGroup(u,D,0),u+=D}function A(w){const B=x,D=new bt,N=new C;let F=0;const T=w===!0?t:e,M=w===!0?1:-1;for(let H=1;H<=s;H++)d.push(0,g*M,0),m.push(0,M,0),p.push(.5,.5),x++;const I=x;for(let H=0;H<=s;H++){const $=H/s*c+a,st=Math.cos($),tt=Math.sin($);N.x=T*tt,N.y=g*M,N.z=T*st,d.push(N.x,N.y,N.z),m.push(0,M,0),D.x=st*.5+.5,D.y=tt*.5*M+.5,p.push(D.x,D.y),x++}for(let H=0;H<s;H++){const V=B+H,$=I+H;w===!0?h.push($,$+1,V):h.push($+1,$,V),F+=3}l.addGroup(u,F,w===!0?1:2),u+=F}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Jt(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Ae extends Jt{constructor(t=1,e=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new Ae(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class fr extends qe{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};const r=[],o=[];a(s),l(n),h(),this.setAttribute("position",new Se(r,3)),this.setAttribute("normal",new Se(r.slice(),3)),this.setAttribute("uv",new Se(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(S){const A=new C,w=new C,B=new C;for(let D=0;D<e.length;D+=3)p(e[D+0],A),p(e[D+1],w),p(e[D+2],B),c(A,w,B,S)}function c(S,A,w,B){const D=B+1,N=[];for(let F=0;F<=D;F++){N[F]=[];const T=S.clone().lerp(w,F/D),M=A.clone().lerp(w,F/D),I=D-F;for(let H=0;H<=I;H++)H===0&&F===D?N[F][H]=T:N[F][H]=T.clone().lerp(M,H/I)}for(let F=0;F<D;F++)for(let T=0;T<2*(D-F)-1;T++){const M=Math.floor(T/2);T%2===0?(m(N[F][M+1]),m(N[F+1][M]),m(N[F][M])):(m(N[F][M+1]),m(N[F+1][M+1]),m(N[F+1][M]))}}function l(S){const A=new C;for(let w=0;w<r.length;w+=3)A.x=r[w+0],A.y=r[w+1],A.z=r[w+2],A.normalize().multiplyScalar(S),r[w+0]=A.x,r[w+1]=A.y,r[w+2]=A.z}function h(){const S=new C;for(let A=0;A<r.length;A+=3){S.x=r[A+0],S.y=r[A+1],S.z=r[A+2];const w=g(S)/2/Math.PI+.5,B=u(S)/Math.PI+.5;o.push(w,1-B)}x(),d()}function d(){for(let S=0;S<o.length;S+=6){const A=o[S+0],w=o[S+2],B=o[S+4],D=Math.max(A,w,B),N=Math.min(A,w,B);D>.9&&N<.1&&(A<.2&&(o[S+0]+=1),w<.2&&(o[S+2]+=1),B<.2&&(o[S+4]+=1))}}function m(S){r.push(S.x,S.y,S.z)}function p(S,A){const w=S*3;A.x=t[w+0],A.y=t[w+1],A.z=t[w+2]}function x(){const S=new C,A=new C,w=new C,B=new C,D=new bt,N=new bt,F=new bt;for(let T=0,M=0;T<r.length;T+=9,M+=6){S.set(r[T+0],r[T+1],r[T+2]),A.set(r[T+3],r[T+4],r[T+5]),w.set(r[T+6],r[T+7],r[T+8]),D.set(o[M+0],o[M+1]),N.set(o[M+2],o[M+3]),F.set(o[M+4],o[M+5]),B.copy(S).add(A).add(w).divideScalar(3);const I=g(B);v(D,M+0,S,I),v(N,M+2,A,I),v(F,M+4,w,I)}}function v(S,A,w,B){B<0&&S.x===1&&(o[A]=S.x-1),w.x===0&&w.z===0&&(o[A]=B/2/Math.PI+.5)}function g(S){return Math.atan2(S.z,-S.x)}function u(S){return Math.atan2(-S.y,Math.sqrt(S.x*S.x+S.z*S.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new fr(t.vertices,t.indices,t.radius,t.details)}}class no extends fr{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,s=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-n,0,-s,n,0,s,-n,0,s,n,-s,-n,0,-s,n,0,s,-n,0,s,n,0,-n,0,-s,n,0,-s,-n,0,s,n,0,s],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new no(t.radius,t.detail)}}class Zi extends fr{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Zi(t.radius,t.detail)}}class He extends fr{constructor(t=1,e=0){const n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new He(t.radius,t.detail)}}class On extends qe{constructor(t=.5,e=1,n=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:o},n=Math.max(3,n),s=Math.max(1,s);const a=[],c=[],l=[],h=[];let d=t;const m=(e-t)/s,p=new C,x=new bt;for(let v=0;v<=s;v++){for(let g=0;g<=n;g++){const u=r+g/n*o;p.x=d*Math.cos(u),p.y=d*Math.sin(u),c.push(p.x,p.y,p.z),l.push(0,0,1),x.x=(p.x/e+1)/2,x.y=(p.y/e+1)/2,h.push(x.x,x.y)}d+=m}for(let v=0;v<s;v++){const g=v*(n+1);for(let u=0;u<n;u++){const S=u+g,A=S,w=S+n+1,B=S+n+2,D=S+1;a.push(A,w,D),a.push(w,B,D)}}this.setIndex(a),this.setAttribute("position",new Se(c,3)),this.setAttribute("normal",new Se(l,3)),this.setAttribute("uv",new Se(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new On(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class ue extends qe{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const c=Math.min(o+a,Math.PI);let l=0;const h=[],d=new C,m=new C,p=[],x=[],v=[],g=[];for(let u=0;u<=n;u++){const S=[],A=u/n;let w=0;u===0&&o===0?w=.5/e:u===n&&c===Math.PI&&(w=-.5/e);for(let B=0;B<=e;B++){const D=B/e;d.x=-t*Math.cos(s+D*r)*Math.sin(o+A*a),d.y=t*Math.cos(o+A*a),d.z=t*Math.sin(s+D*r)*Math.sin(o+A*a),x.push(d.x,d.y,d.z),m.copy(d).normalize(),v.push(m.x,m.y,m.z),g.push(D+w,1-A),S.push(l++)}h.push(S)}for(let u=0;u<n;u++)for(let S=0;S<e;S++){const A=h[u][S+1],w=h[u][S],B=h[u+1][S],D=h[u+1][S+1];(u!==0||o>0)&&p.push(A,w,D),(u!==n-1||c<Math.PI)&&p.push(w,B,D)}this.setIndex(p),this.setAttribute("position",new Se(x,3)),this.setAttribute("normal",new Se(v,3)),this.setAttribute("uv",new Se(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ue(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class li extends qe{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);const o=[],a=[],c=[],l=[],h=new C,d=new C,m=new C;for(let p=0;p<=n;p++)for(let x=0;x<=s;x++){const v=x/s*r,g=p/n*Math.PI*2;d.x=(t+e*Math.cos(g))*Math.cos(v),d.y=(t+e*Math.cos(g))*Math.sin(v),d.z=e*Math.sin(g),a.push(d.x,d.y,d.z),h.x=t*Math.cos(v),h.y=t*Math.sin(v),m.subVectors(d,h).normalize(),c.push(m.x,m.y,m.z),l.push(x/s),l.push(p/n)}for(let p=1;p<=n;p++)for(let x=1;x<=s;x++){const v=(s+1)*p+x-1,g=(s+1)*(p-1)+x-1,u=(s+1)*(p-1)+x,S=(s+1)*p+x;o.push(v,g,S),o.push(g,u,S)}this.setIndex(o),this.setAttribute("position",new Se(a,3)),this.setAttribute("normal",new Se(c,3)),this.setAttribute("uv",new Se(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new li(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class an extends es{static get type(){return"MeshToonMaterial"}constructor(t){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.color=new Ht(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ht(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=ql,this.normalScale=new bt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.gradientMap=t.gradientMap,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.alphaMap=t.alphaMap,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}class lo extends We{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Ht(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class cg extends lo{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(We.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ht(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const $o=new he,vl=new C,yl=new C;class xh{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new bt(512,512),this.map=null,this.mapPass=null,this.matrix=new he,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ec,this._frameExtents=new bt(1,1),this._viewportCount=1,this._viewports=[new Me(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;vl.setFromMatrixPosition(t.matrixWorld),e.position.copy(vl),yl.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(yl),e.updateMatrixWorld(),$o.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix($o),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply($o)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const Ml=new he,ir=new C,Ko=new C;class lg extends xh{constructor(){super(new Sn(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new bt(4,2),this._viewportCount=6,this._viewports=[new Me(2,1,1,1),new Me(0,1,1,1),new Me(3,1,1,1),new Me(1,1,1,1),new Me(3,0,1,1),new Me(1,0,1,1)],this._cubeDirections=[new C(1,0,0),new C(-1,0,0),new C(0,0,1),new C(0,0,-1),new C(0,1,0),new C(0,-1,0)],this._cubeUps=[new C(0,1,0),new C(0,1,0),new C(0,1,0),new C(0,1,0),new C(0,0,1),new C(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,s=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),ir.setFromMatrixPosition(t.matrixWorld),n.position.copy(ir),Ko.copy(n.position),Ko.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(Ko),n.updateMatrixWorld(),s.makeTranslation(-ir.x,-ir.y,-ir.z),Ml.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ml)}}class kn extends lo{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new lg}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class hg extends xh{constructor(){super(new oh(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class _h extends lo{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(We.DEFAULT_UP),this.updateMatrix(),this.target=new We,this.shadow=new hg}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class dg extends lo{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}class ug{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Sl(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=Sl();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function Sl(){return performance.now()}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ya}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ya);function fg(){const i=new Uint8Array([80,80,80,255,145,145,145,255,210,210,210,255,255,255,255,255]),t=new co(i,4,1,_n);return t.minFilter=Ve,t.magFilter=Ve,t.needsUpdate=!0,t}const pg=fg(),be=(i,t={})=>new an({color:i,gradientMap:pg,...t}),si=(i,t={})=>new re({color:i,...t});function It(i,t,e=!0){const n=new K(i,t);return n.castShadow=e,n.receiveShadow=e,n}const Fn={skin:16767428,hair:15399167,hairShade:12179951,outfit:1911894,outfitLight:3098494,gold:16765818,scarf:16736126,boot:1383734,blade:12582143};function mg(){const i=new kt;i.name="Astra";const t=new kt;t.position.y=.92,i.add(t);const e=be(Fn.skin),n=be(Fn.hair),s=be(Fn.hairShade),r=be(Fn.outfit),o=be(Fn.outfitLight),a=be(Fn.gold,{emissive:7160588,emissiveIntensity:.35}),c=be(Fn.scarf,{side:le}),l=be(Fn.boot),h=be(Fn.blade,{emissive:2872294,emissiveIntensity:.9}),d=new kt;t.add(d);const m=It(new Jt(.22,.25,.2,8),r);m.position.y=0,d.add(m);const p=It(new Jt(.265,.265,.09,8),a);p.position.y=.12,d.add(p);const x=It(new Lt(.16,.13,.06),be(10119967));x.position.set(0,.12,.25),d.add(x);const v=It(new He(.055,0),si(16774080));v.position.set(0,.12,.29),d.add(v);const g=new kt;g.position.y=.16,d.add(g);const u=It(new Jt(.29,.23,.52,8),r);u.position.y=.24,g.add(u);const S=It(new Lt(.32,.3,.12),o);S.position.set(0,.3,.22),g.add(S);const A=It(new Jt(.22,.28,.14,8),be(16054527));A.position.y=.5,g.add(A);const w=It(new He(.075,0),si(8255999));w.position.set(0,.31,.3),g.add(w);const B=It(new Lt(.44,.05,.05),a);B.position.set(0,.08,.22),g.add(B);for(const nt of[-1,1]){const E=It(new ue(.17,8,6,0,Math.PI*2,0,Math.PI/2),o);E.scale.set(1.1,.75,1.1),E.position.set(nt*.3,.47,0),g.add(E);const _=It(new li(.14,.025,5,12),a);_.rotation.x=Math.PI/2,_.position.set(nt*.3,.44,0),g.add(_)}for(let nt=0;nt<4;nt++){const E=nt/4*Math.PI*2+Math.PI/4,_=It(new Fe(.25,.42),be(nt%2?Fn.outfitLight:Fn.outfit,{side:le}));_.position.set(Math.cos(E)*.2,-.12,Math.sin(E)*.2),_.rotation.y=-E+Math.PI/2,_.rotation.x=.08,d.add(_)}const D=new kt;D.position.y=.72,g.add(D);const N=It(new ue(.235,12,10),e);N.scale.set(.96,1.04,.96),D.add(N);const F=It(new ue(.16,10,8),e);F.scale.set(.82,.7,.9),F.position.set(0,-.11,.06),D.add(F);const T=It(new Jt(.09,.1,.18,6),e);T.position.y=-.24,D.add(T);const M=It(new ue(.26,10,8),n);M.scale.set(1.02,1.02,1.04),M.position.set(0,.02,-.035),D.add(M);const I=It(new ue(.245,10,8,0,Math.PI*2,0,Math.PI*.52),n);I.scale.set(1.04,1,1.06),I.position.set(0,.04,.03),D.add(I);for(const[nt,E,_]of[[-.13,.3,.22],[-.04,.05,.25],[.07,-.12,.22],[.16,-.3,.18]]){const O=It(new Ae(.055,_,4),s);O.position.set(nt,.13,.22),O.rotation.z=E,O.rotation.x=.12,D.add(O)}for(const nt of[-1,1]){const E=It(new Si(.045,.34,3,6),n);E.position.set(nt*.21,-.12,.03),E.rotation.z=nt*.08,D.add(E)}const H=It(new Ae(.22,.7,6),n);H.position.set(0,-.23,-.13),H.rotation.x=-.1,D.add(H);for(const nt of[-1,1]){const E=It(new ue(.045,8,6),si(1384507),!1);E.scale.set(.8,1.25,.35),E.position.set(nt*.085,-.015,.222),D.add(E);const _=It(new ue(.026,8,6),si(8255999),!1);_.scale.set(.9,1.15,.3),_.position.set(nt*.085,-.012,.242),D.add(_);const O=It(new Lt(.07,.014,.02),be(9419216),!1);O.position.set(nt*.085,.055,.226),O.rotation.z=nt*-.1,D.add(O)}const V=It(new Lt(.045,.008,.01),be(13204868),!1);V.position.set(0,-.09,.215),D.add(V);const $=It(new li(.225,.018,5,18),a);$.rotation.x=Math.PI/2,$.position.y=.1,D.add($);const st=It(new He(.04,0),si(8255999));st.position.set(0,.11,.24),D.add(st);const tt=It(new li(.14,.05,6,12),c);tt.rotation.x=Math.PI/2,tt.position.set(0,-.23,0),g.add(tt);const rt=[];for(let nt=0;nt<3;nt++){const E=It(new Fe(.2-nt*.035,.78-nt*.12),c,!1);E.position.set(-.09+nt*.09,.26,-.23-nt*.012),E.rotation.x=.28,E.rotation.z=.16-nt*.16,g.add(E),rt.push(E)}const Y=new kt;Y.position.set(0,.42,-.22);const yt=be(1581898,{side:le});for(const nt of[-1,1]){const E=It(new Fe(.27,.88),yt,!1);E.position.set(nt*.14,-.42,0),E.rotation.y=nt*.22,Y.add(E);const _=It(new Fe(.2,.76),be(8255999,{side:le,emissive:1731450,emissiveIntensity:.25}),!1);_.position.set(nt*.145,-.43,.012),_.rotation.y=nt*.22,Y.add(_)}g.add(Y);const xt=new kt;xt.position.set(0,.02,-.2);for(let nt=0;nt<3;nt++){const E=It(new Ae(.13-nt*.025,.38,5),nt===2?s:n,!1);E.position.set(0,-.16-nt*.26,-.06-nt*.035),E.rotation.x=-.18-nt*.06,xt.add(E)}const Ut=It(new Lt(.22,.08,.06),c,!1);Ut.position.set(0,-.02,-.04),xt.add(Ut),D.add(xt);function Yt(nt){const E=new kt;E.position.set(nt*.33,.44,0),g.add(E);const _=It(new Si(.07,.26,4,7),r);_.position.y=-.19,E.add(_);const O=new kt;O.position.y=-.38,E.add(O);const X=It(new Si(.06,.24,4,7),e);X.position.y=-.17,O.add(X);const Q=It(new Jt(.075,.085,.18,6),o);Q.position.y=-.2,O.add(Q);const j=It(new ue(.065,7,6),e);return j.position.y=-.35,O.add(j),{shoulder:E,elbow:O,hand:j}}const Nt=Yt(-1),q=Yt(1);function pt(nt){const E=new kt;E.position.set(nt*.13,-.06,0),d.add(E);const _=It(new Si(.09,.3,4,7),r);_.position.y=-.22,E.add(_);const O=new kt;O.position.y=-.44,E.add(O);const X=It(new Si(.075,.27,4,7),r);X.position.y=-.18,O.add(X);const Q=It(new Lt(.16,.18,.28),l);Q.position.set(0,-.38,.045),O.add(Q);const j=It(new Lt(.17,.04,.29),a);return j.position.set(0,-.3,.045),O.add(j),{hip:E,knee:O}}const Et=pt(-1),mt=pt(1),St=new kt,Vt=It(new Jt(.028,.032,.22,6),be(2759192));Vt.position.y=-.08,St.add(Vt);const $t=It(new He(.045,0),a);$t.position.y=-.2,St.add($t);const fe=It(new Lt(.3,.045,.07),a);fe.position.y=.03,St.add(fe);const Qt=It(new Lt(.075,1,.035),h);Qt.position.y=-.55,St.add(Qt);const de=It(new Ae(.052,.2,4),h);de.position.y=-1.13,de.rotation.z=Math.PI,St.add(de);const k=It(new Lt(.018,.85,.042),si(16777215));k.position.y=-.55,St.add(k);const Ie=new en(new je({map:ie(),color:8255999,transparent:!0,opacity:.5,blending:ge,depthWrite:!1}));Ie.position.y=-.6,Ie.scale.set(.5,1.5,1),St.add(Ie),St.position.y=-.34,St.rotation.x=-.15,q.elbow.add(St);function ie(){const nt=document.createElement("canvas");nt.width=nt.height=64;const E=nt.getContext("2d"),_=E.createRadialGradient(32,32,1,32,32,32);return _.addColorStop(0,"rgba(255,255,255,1)"),_.addColorStop(.3,"rgba(125,249,255,.55)"),_.addColorStop(1,"rgba(125,249,255,0)"),E.fillStyle=_,E.fillRect(0,0,64,64),new ns(nt)}const Kt=new K(new ci(.42,20),new re({color:660768,transparent:!0,opacity:.22,depthWrite:!1}));Kt.rotation.x=-Math.PI/2,Kt.position.y=.02,i.add(Kt);const Tt={name:"idle",time:0,speed:0,grounded:!0,phase:0,lean:0,hurt:0};return{root:i,model:t,hips:d,torso:g,head:D,leftArm:Nt,rightArm:q,leftLeg:Et,rightLeg:mt,sword:St,scarfTails:rt,cape:Y,ponytail:xt,shadow:Kt,state:Tt,setState(nt){Tt.name!==nt&&(Tt.name=nt,Tt.time=0)},setSwordLevel(nt){const E=[12582143,12582143,14140415,16770216],_=[2872294,2872294,8080895,16751164];Qt.material.color.setHex(E[nt]||E[0]),Qt.material.emissive.setHex(_[nt]||_[0]),de.material.color.setHex(E[nt]||E[0]),de.material.emissive.setHex(_[nt]||_[0]),Ie.material.color.setHex(nt>=2?11824127:(nt>=1,8255999))},update(nt,E,_){Tt.time+=nt,Tt.speed=E,Tt.grounded=_;const O=Tt.time,X=Tt.name,Q=Math.min(1,E/9);Tt.phase+=nt*(3+E*.85),t.position.y=.92,t.rotation.x=0,t.rotation.z=0,g.rotation.set(0,0,0),D.rotation.set(0,0,0),Nt.shoulder.rotation.set(0,0,0),q.shoulder.rotation.set(0,0,0),Nt.elbow.rotation.set(0,0,0),q.elbow.rotation.set(0,0,0),Et.hip.rotation.set(0,0,0),mt.hip.rotation.set(0,0,0),Et.knee.rotation.set(0,0,0),mt.knee.rotation.set(0,0,0),rt.forEach((lt,ut)=>{lt.rotation.x=.2,lt.rotation.z=(ut-1)*.16}),Y.rotation.x=.04,Y.rotation.z=0,xt.rotation.x=0,xt.rotation.z=0;const j=Math.sin(O*2.1)*.015,Ft=Math.sin(Tt.phase*2)*(.02+Q*.05);if(X==="idle"||X==="dialogue")t.position.y=.92+j,g.rotation.x=-.02+j,D.rotation.y=Math.sin(O*.5)*.08,Nt.shoulder.rotation.z=-.08,q.shoulder.rotation.z=.08,Nt.elbow.rotation.x=-.15,q.elbow.rotation.x=-.18,St.rotation.x=-.15,rt.forEach((lt,ut)=>{lt.rotation.x=.2+Math.sin(O*2.3+ut)*.08,lt.rotation.z=(ut-1)*.16+Math.sin(O*1.7+ut)*.05}),Y.rotation.x=.04+Math.sin(O*1.6)*.03,xt.rotation.x=.02+Math.sin(O*1.9)*.04,xt.rotation.z=Math.sin(O*1.2)*.05;else if(X==="walk"||X==="run"){const lt=.42+Q*.38,ut=Math.sin(Tt.phase)*lt;t.position.y=.92+Ft,g.rotation.x=-.06-Q*.12,g.rotation.y=Math.sin(Tt.phase)*.07,D.rotation.x=.04+Q*.04,Et.hip.rotation.x=ut,mt.hip.rotation.x=-ut,Et.knee.rotation.x=Math.max(0,-Math.sin(Tt.phase))*(.4+Q*.5),mt.knee.rotation.x=Math.max(0,Math.sin(Tt.phase))*(.4+Q*.5),Nt.shoulder.rotation.x=-ut*.8,q.shoulder.rotation.x=ut*.6-.15,Nt.elbow.rotation.x=-.25-Q*.25,q.elbow.rotation.x=-.3,Nt.shoulder.rotation.z=-.05,q.shoulder.rotation.z=.1,St.rotation.x=-.25,rt.forEach((Ct,ot)=>{Ct.rotation.x=.55+Q*.7+Math.sin(O*5+ot)*.15,Ct.rotation.z=(ot-1)*(.16+Q*.22)}),Y.rotation.x=.08+Q*.22+Math.sin(O*5)*.05,xt.rotation.x=.12+Q*.3+Math.sin(O*5)*.08,xt.rotation.z=Math.sin(O*3.4)*.1}else if(X==="jump")t.position.y=.92+.04,g.rotation.x=-.1,Et.hip.rotation.x=.75,mt.hip.rotation.x=-.2,Et.knee.rotation.x=.7,mt.knee.rotation.x=.45,Nt.shoulder.rotation.x=-.7,q.shoulder.rotation.x=.5,Nt.shoulder.rotation.z=-.6,q.shoulder.rotation.z=.5,Nt.elbow.rotation.x=-.5,q.elbow.rotation.x=-.4,St.rotation.x=-.5,rt.forEach((lt,ut)=>{lt.rotation.x=.9,lt.rotation.z=(ut-1)*.2});else if(X==="dodge"){const lt=Math.min(1,O/.46);t.position.y=.92-Math.sin(lt*Math.PI)*.4,t.rotation.x=lt*Math.PI*2,g.rotation.x=.35,Et.hip.rotation.x=1,mt.hip.rotation.x=1,Et.knee.rotation.x=1.4,mt.knee.rotation.x=1.4,Nt.shoulder.rotation.x=1,q.shoulder.rotation.x=.8,Nt.elbow.rotation.x=-1.2,q.elbow.rotation.x=-1.2,St.rotation.x=.5,rt.forEach((ut,Ct)=>{ut.rotation.x=1.2,ut.rotation.z=(Ct-1)*.3})}else if(X==="hurt")t.rotation.x=-.15,g.rotation.x=.25,D.rotation.x=.2,Nt.shoulder.rotation.x=-.5,q.shoulder.rotation.x=-.3,Nt.shoulder.rotation.z=-.5,q.shoulder.rotation.z=.6,Nt.elbow.rotation.x=-.5,q.elbow.rotation.x=-.5;else if(X.startsWith("attack")){const lt=Number(X.slice(6))||0,Ct=Math.min(1,O/(lt===2?.56:.44)),ot=Math.min(1,Ct/.3),gt=Ct<.3?0:Math.min(1,(Ct-.3)/.3),Ot=Math.max(0,(Ct-.62)/.38),ht=Math.sin((Zt=>Zt*Zt*(3-2*Zt))(gt)*Math.PI*.9)*(1-Ot*.7);t.position.y=.92+Math.sin(Ct*Math.PI)*.04,g.rotation.y=(lt===1?.55:-.55)*ot-(lt===1?1.2:-1.2)*ht,g.rotation.x=-.1+ht*.2,D.rotation.y=-g.rotation.y*.4,lt===0?(q.shoulder.rotation.x=-.5-ht*1.5,q.shoulder.rotation.z=.5+ht*.5,q.elbow.rotation.x=-.4-ht*.4,Nt.shoulder.rotation.x=.3,Nt.shoulder.rotation.z=-.4,St.rotation.x=-.2-ht*.7):lt===1?(q.shoulder.rotation.x=-1.5+ht*1.6,q.shoulder.rotation.z=.2-ht*.4,q.elbow.rotation.x=-.9+ht*.6,Nt.shoulder.rotation.x=-.2,Nt.shoulder.rotation.z=-.5,St.rotation.x=-.8+ht*.8):(q.shoulder.rotation.x=-.8-ht*.8,q.shoulder.rotation.z=-.3-ht*1.2,q.elbow.rotation.x=-.5,Nt.shoulder.rotation.x=-.4,Nt.shoulder.rotation.z=-.7,St.rotation.x=-.5-ht*.4,t.rotation.y=ht*.5),rt.forEach((Zt,Wt)=>{Zt.rotation.x=.5+ht*.5,Zt.rotation.z=(Wt-1)*.25})}else if(X==="heavy"){const lt=Math.min(1,O/.78),ut=Math.min(1,lt/.38),Ct=lt<.38?0:Math.min(1,(lt-.38)/.22),ot=Math.max(0,(lt-.6)/.4),gt=Ot=>Ot*Ot*(3-2*Ot);t.position.y=.92+Math.sin(lt*Math.PI)*.05,g.rotation.x=-.15-ut*.25+Ct*.55-ot*.2,g.rotation.y=-ut*.3,q.shoulder.rotation.x=-2.6*ut+3*gt(Ct),q.shoulder.rotation.z=.3,q.elbow.rotation.x=-1.1+ut*.4,Nt.shoulder.rotation.x=-1.8*ut+2.2*gt(Ct),Nt.shoulder.rotation.z=-.2,Nt.elbow.rotation.x=-.8,St.rotation.x=-.8+gt(Ct)*.6,Et.hip.rotation.x=.25,mt.hip.rotation.x=-.25,Et.knee.rotation.x=.25,mt.knee.rotation.x=.15,rt.forEach((Ot,Gt)=>{Ot.rotation.x=.9,Ot.rotation.z=(Gt-1)*.25})}else if(X==="magic"){const lt=Math.min(1,O/.9),ut=Math.min(1,lt/.4);t.position.y=.92+Math.sin(lt*Math.PI)*.1,g.rotation.x=-.2,D.rotation.x=-.15,Nt.shoulder.rotation.x=-2.5*ut,Nt.shoulder.rotation.z=-.4,q.shoulder.rotation.x=-1.2*ut,q.shoulder.rotation.z=.5,Nt.elbow.rotation.x=-.4,q.elbow.rotation.x=-.6,St.rotation.x=-.4,rt.forEach((Ct,ot)=>{Ct.rotation.x=.8+Math.sin(O*6+ot)*.15,Ct.rotation.z=(ot-1)*.3})}else X==="dead"&&(t.rotation.z=Math.min(1.5,O*2.2),t.position.y=.5);Ie.material.opacity=.35+Math.sin(O*4)*.1,Kt.material.opacity=_?.22:.08,Kt.scale.setScalar(_?1:.7)},getSwordWorld(){const nt=new C;return Qt.getWorldPosition(nt),nt}}}function gg(i={}){const t=new kt,e=new kt;e.position.y=.9,t.add(e);const n=be(i.robe??3890554),s=be(2505300),r=be(16766653),o=be(i.hair??3811876),a=be(i.accent??16765818,{emissive:i.accent??16765818,emissiveIntensity:.2}),c=It(new Ae(.36,1.05,8),n);c.position.y=.12,e.add(c);const l=It(new Jt(.24,.32,.26,8),s);l.position.y=.66,e.add(l);const h=It(new li(.24,.035,5,14),a);h.rotation.x=Math.PI/2,h.position.y=.18,e.add(h);const d=new kt;d.position.y=1.03,e.add(d);const m=It(new ue(.19,10,8),r);m.scale.set(.95,1.03,.95),d.add(m);const p=It(new ue(.205,10,8),o);if(p.scale.set(1,1.02,1.04),p.position.set(0,.03,-.03),d.add(p),i.hood){const u=It(new ue(.25,10,8,0,Math.PI*2,0,Math.PI*.7),n);u.position.set(0,.03,-.03),d.add(u);const S=It(new Ae(.13,.4,6),n);S.position.set(0,.22,-.15),S.rotation.x=-.6,d.add(S)}for(const u of[-1,1]){const S=It(new ue(.027,6,5),si(1778744),!1);S.scale.set(.8,1.2,.4),S.position.set(u*.07,0,.175),d.add(S)}if(i.apron){const u=It(new Ae(.12,.28,5),o);u.position.set(0,-.16,.12),d.add(u)}const x=[];for(const u of[-1,1]){const S=new kt;S.position.set(u*.25,.6,0),e.add(S);const A=It(new Si(.055,.32,3,6),n);A.position.y=-.2,S.add(A);const w=It(new ue(.055,6,5),r);w.position.y=-.42,S.add(w),x.push({arm:S,hand:w,sx:u})}if(i.apron){const u=It(new Fe(.42,.7),be(5978666,{side:le}));u.position.set(0,.05,.28),e.add(u);const S=new kt,A=It(new Jt(.025,.03,.6,5),be(7031347));S.add(A);const w=It(new Lt(.22,.12,.12),be(5989744));w.position.y=.3,S.add(w),S.position.set(.34,.35,.15),S.rotation.z=-.3,e.add(S)}let v=null;if(i.staff){const u=new kt,S=It(new Jt(.025,.035,1.8,5),be(5913640));S.position.y=.2,u.add(S),v=It(new He(.09,0),si(16765818)),v.position.y=1.15,u.add(v);const A=new en(new je({map:xg(),color:16765818,transparent:!0,opacity:.7,blending:ge,depthWrite:!1}));A.position.y=1.15,A.scale.set(.8,.8,1),u.add(A),u.position.set(-.38,.15,.05),e.add(u)}if(i.bow){const u=new kt,S=new K(new li(.42,.025,4,14,Math.PI*1.1),be(8015147));S.rotation.z=Math.PI*.45,u.add(S);const A=new K(new Jt(.004,.004,.8,3),si(14280426));A.position.x=.16,u.add(A),u.position.set(0,.55,-.28),u.rotation.y=.2,e.add(u)}for(const u of[-1,1]){const S=It(new Lt(.13,.12,.2),s);S.position.set(u*.11,-.76,.03),e.add(S)}const g=Math.random()*10;return{group:t,update(u,S){e.position.y=.9+Math.sin(S*1.4+g)*.012,d.rotation.y=Math.sin(S*.5+g)*.12,x[0].arm.rotation.z=-.06+Math.sin(S*1.2+g)*.02,x[1].arm.rotation.z=.06,v&&(v.rotation.y+=u*1.2,v.position.y=1.15+Math.sin(S*1.8+g)*.04)}}}function xg(){const i=document.createElement("canvas");i.width=i.height=64;const t=i.getContext("2d"),e=t.createRadialGradient(32,32,1,32,32,32);return e.addColorStop(0,"rgba(255,255,255,1)"),e.addColorStop(.3,"rgba(255,211,122,.6)"),e.addColorStop(1,"rgba(255,211,122,0)"),t.fillStyle=e,t.fillRect(0,0,64,64),new ns(i)}function _g(i=1337){let t=i>>>0;return function(){t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}const Ha=(i,t,e)=>Math.max(t,Math.min(e,i)),Wr=(i,t,e)=>i+(t-i)*e;function Bi(i,t,e){const n=Ha((e-i)/(t-i),0,1);return n*n*(3-2*n)}const Ne=(i,t,e,n)=>Math.hypot(i-e,t-n),Re=Math.PI*2,mn={grass:7319116,grassLight:10211170,grassDark:4161346,sand:14270603,stone:10132892,stoneDark:5989229,wood:7031347,woodDark:4074016,roof:2579560,roofLight:3832964,plaster:15918022,gold:16765818};function vg(){const i=new Uint8Array([95,95,95,255,150,150,150,255,215,215,215,255,255,255,255,255]),t=new co(i,4,1,_n);return t.minFilter=Ve,t.magFilter=Ve,t.needsUpdate=!0,t}function yg(i){const t=(e,n={})=>new an({color:e,gradientMap:i,...n});return{gradient:i,grass:t(16777215,{vertexColors:!0}),trunk:t(mn.woodDark),trunkLight:t(mn.wood),leaf:t(16777215,{flatShading:!0}),leaf2:t(8242012,{flatShading:!0}),pine:t(16777215,{flatShading:!0}),rock:t(9278876,{flatShading:!0}),rockDark:t(6055280,{flatShading:!0}),sand:t(mn.sand),stone:t(mn.stone,{flatShading:!0}),stoneDark:t(mn.stoneDark,{flatShading:!0}),plaster:t(mn.plaster),wood:t(mn.wood),woodDark:t(mn.woodDark),roof:t(mn.roof,{flatShading:!0}),roofLight:t(mn.roofLight,{flatShading:!0}),red:t(12076107,{flatShading:!0}),gold:t(mn.gold,{emissive:9067026,emissiveIntensity:.35}),cyan:t(10484735,{emissive:2872294,emissiveIntensity:.9}),purple:t(10181887,{emissive:4922762,emissiveIntensity:.8}),dark:t(1908784,{flatShading:!0}),flame:t(16757575,{emissive:16738816,emissiveIntensity:1.6})}}function ho(i,t,e){const n=document.createElement("canvas");n.width=i,n.height=t;const s=n.getContext("2d");e(s,i,t);const r=new ns(n);return r.colorSpace=ln,r.anisotropy=4,r}function Mg(){return ho(256,160,(i,t,e)=>{i.clearRect(0,0,t,e);const n=[[70,95,58],[125,70,66],[185,92,52],[110,105,72],[160,108,46]];for(const[s,r,o]of n){const a=i.createRadialGradient(s,r,2,s,r,o);a.addColorStop(0,"rgba(255,255,255,.95)"),a.addColorStop(.55,"rgba(244,251,255,.72)"),a.addColorStop(1,"rgba(220,242,255,0)"),i.fillStyle=a,i.beginPath(),i.arc(s,r,o,0,Re),i.fill()}})}function ni(){return ho(128,128,(i,t,e)=>{const n=i.createRadialGradient(t/2,e/2,1,t/2,e/2,t/2);n.addColorStop(0,"rgba(255,255,255,1)"),n.addColorStop(.2,"rgba(235,253,255,.85)"),n.addColorStop(.55,"rgba(190,240,255,.28)"),n.addColorStop(1,"rgba(120,220,255,0)"),i.fillStyle=n,i.fillRect(0,0,t,e)})}function Sg(i="!",t="#ffd37a"){return ho(128,128,(e,n,s)=>{e.clearRect(0,0,n,s),e.shadowColor=t,e.shadowBlur=20,e.fillStyle=t,e.font="bold 92px Georgia, serif",e.textAlign="center",e.textBaseline="middle",e.fillText(i,n/2,s/2+4),e.shadowBlur=0,e.strokeStyle="rgba(10,16,38,.6)",e.lineWidth=3,e.strokeText(i,n/2,s/2+4)})}function wg(){return ho(512,512,(i,t,e)=>{i.fillStyle="#171022",i.fillRect(0,0,t,e);for(let r=0;r<2600;r++){const o=Math.random()*.1;i.fillStyle=`rgba(${120+Math.random()*60},${90+Math.random()*50},${150+Math.random()*60},${o})`,i.fillRect(Math.random()*t,Math.random()*e,2+Math.random()*9,2+Math.random()*9)}const n=t/2,s=e/2;i.strokeStyle="rgba(180,105,255,.55)",i.lineWidth=5,i.shadowColor="#b46bff",i.shadowBlur=18;for(const r of[78,122,190])i.beginPath(),i.arc(n,s,r,0,Re),i.stroke();i.beginPath(),i.arc(n,s,155,0,Re),i.stroke();for(let r=0;r<12;r++){const o=r/12*Re,a=n+Math.cos(o)*122,c=s+Math.sin(o)*122,l=n+Math.cos(o+.26)*190,h=s+Math.sin(o+.26)*190;i.beginPath(),i.moveTo(a,c),i.lineTo(l,h),i.stroke()}for(let r=0;r<6;r++){const o=r/6*Re+.2,a=n+Math.cos(o)*78,c=s+Math.sin(o)*78;i.save(),i.translate(a,c),i.rotate(o),i.beginPath(),i.moveTo(-9,0),i.lineTo(0,-12),i.lineTo(9,0),i.lineTo(0,12),i.closePath(),i.stroke(),i.restore()}i.shadowBlur=0})}function bg(i){const t=vg(),e=yg(t),n=_g(20261031),s=[],r=new kt;r.name="island",i.add(r);const o={x:0,z:38},a={x:0,z:-64},c={x:52,z:14},l={x:-48,z:-46},h=new C(0,0,-220),d=250,m=118;function p(U,f){let b=1.55*Math.sin(U*.054)*Math.cos(f*.048)+.9*Math.sin((U+f)*.108)+.5*Math.cos(U*.155-f*.09);b+=4.2*Math.exp(-((U+38)**2+(f+20)**2)/950),b+=5.8*Math.exp(-((U-66)**2+(f+38)**2)/820),b+=2.8*Math.exp(-((U-20)**2+(f-72)**2)/900),b=Wr(b,2.45,1-Bi(16,30,Ne(U,f,o.x,o.z))),b=Wr(b,11,1-Bi(12,25,Ne(U,f,a.x,a.z))),b=Wr(b,-3.4,1-Bi(9,26,Ne(U,f,c.x,c.z))),b=Wr(b,4.4,1-Bi(10,21,Ne(U,f,l.x,l.z)));const R=Math.hypot(U,f);return b+=Bi(97,126,R)*25,b}const x=(U,f)=>p(U,f),v=new Fe(d,d,m,m);v.rotateX(-Math.PI/2);const g=v.attributes.position,u=new Float32Array(g.count*3),S=new Ht(mn.grass),A=new Ht(mn.grassLight),w=new Ht(mn.grassDark),B=new Ht(mn.sand),D=new Ht(9277583),N=new Ht(6975609),F=new Ht(13019514),T=new Ht(4861795),M=new Ht,I=[[0,48,0,38],[0,38,3,10],[3,10,0,-20],[0,-20,0,-48],[0,38,22,30],[22,30,40,20],[0,38,-24,32],[-24,32,-40,4],[3,10,-28,-10],[-28,-10,-44,-34],[-44,-34,-48,-46]];function H(U,f){let b=1e9;for(const[R,L,P,G]of I){const W=P-R,ct=G-L,it=Ha(((U-R)*W+(f-L)*ct)/(W*W+ct*ct),0,1);b=Math.min(b,Math.hypot(U-(R+W*it),f-(L+ct*it)))}return b}for(let U=0;U<g.count;U++){const f=g.getX(U),b=g.getZ(U),R=p(f,b);g.setY(U,R);const L=Math.abs(p(f+1.2,b)-R)+Math.abs(p(f,b+1.2)-R),P=Ne(f,b,o.x,o.z),G=Ne(f,b,a.x,a.z),W=Ne(f,b,c.x,c.z),ct=Ne(f,b,l.x,l.z),it=H(f,b),dt=Math.sin(f*.32)*Math.cos(b*.27)*.5+.5;M.copy(S).lerp(A,dt*.55),W<30&&R<1.4&&M.lerp(B,Bi(1.4,-.4,R)*.9),(G<15||it<2.3&&P<36)&&M.lerp(D,G<15?.72:.4),it<1.9&&M.lerp(F,.65),(L>1.1||R>16)&&M.lerp(N,Ha((L-.8)*.7+(R-16)*.04,0,.8)),ct<17&&M.lerp(T,(1-Bi(8,17,ct))*.78),R<-1.2&&M.lerp(w,.35);const _t=.92+dt*.12;u[U*3]=M.r*_t,u[U*3+1]=M.g*_t,u[U*3+2]=M.b*_t}v.setAttribute("color",new un(u,3)),v.computeVertexNormals();const V=new K(v,e.grass);V.receiveShadow=!0,V.name="terrain",r.add(V);const $=new K(new ue(380,32,20),new Pn({side:xn,depthWrite:!1,fog:!1,uniforms:{top:{value:new Ht(5224944)},horizon:{value:new Ht(16768233)},bottom:{value:new Ht(12578815)},sunDir:{value:new C(.55,.45,-.7).normalize()}},vertexShader:"varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",fragmentShader:`
        uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform vec3 sunDir; varying vec3 vDir;
        void main(){
          float h = normalize(vDir).y;
          vec3 col = h > 0.0 ? mix(horizon, top, pow(clamp(h,0.0,1.0), 0.62)) : mix(horizon, bottom, pow(clamp(-h,0.0,1.0), 0.7));
          float sun = pow(max(dot(normalize(vDir), sunDir), 0.0), 220.0);
          float halo = pow(max(dot(normalize(vDir), sunDir), 0.0), 9.0);
          col += vec3(1.0,0.82,0.62) * sun * 1.4;
          col += vec3(1.0,0.72,0.55) * halo * 0.18;
          gl_FragColor = vec4(col, 1.0);
        }`}));$.name="sky",$.renderOrder=-20,i.add($);const st=new en(new je({map:ni(),color:16773840,transparent:!0,blending:ge,depthWrite:!1,fog:!1}));st.position.set(170,150,-240),st.scale.set(80,80,1),i.add(st);const tt=new je({map:Mg(),transparent:!0,opacity:.62,depthWrite:!1,fog:!1}),rt=[];for(let U=0;U<20;U++){const f=new en(tt.clone()),b=n()*Re,R=80+n()*120;f.position.set(Math.cos(b)*R,38+n()*36,Math.sin(b)*R);const L=24+n()*40;f.scale.set(L,L*(.45+n()*.2),1),f.material.opacity=.28+n()*.4,f.userData.speed=.35+n()*.5,i.add(f),rt.push(f)}const Y=[new an({color:9021896,gradientMap:t,fog:!0}),new an({color:10468308,gradientMap:t,fog:!0})];for(let U=0;U<26;U++){const f=U/26*Re+n()*.12,b=150+n()*60,R=22+n()*36,L=new K(new Ae(16+n()*22,R,5+U%3),Y[U%2]);L.position.set(Math.cos(f)*b,R*.35,Math.sin(f)*b),L.rotation.y=n()*Re,r.add(L)}const yt={time:{value:0},deep:{value:new Ht(1142156)},shallow:{value:new Ht(6284264)}},xt=new Pn({transparent:!0,depthWrite:!1,uniforms:yt,vertexShader:`
      uniform float time; varying vec2 vUv; varying float vWave;
      void main(){ vUv = uv; vec3 p = position;
        float w = sin(p.x*0.6 + time*1.4)*0.12 + cos(p.y*0.5 + time*1.1)*0.1;
        p.z += w; vWave = w;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }`,fragmentShader:`
      uniform float time; uniform vec3 deep; uniform vec3 shallow; varying vec2 vUv; varying float vWave;
      void main(){
        vec2 c = vUv - 0.5; float r = length(c)*2.0;
        vec3 col = mix(shallow, deep, smoothstep(0.15,1.0,r));
        float ripple = sin((vUv.x+vUv.y)*70.0 + time*2.0)*0.5+0.5;
        col += vec3(0.16,0.2,0.2) * pow(ripple,6.0) * 0.5;
        float edge = smoothstep(0.82,1.0,r);
        col = mix(col, vec3(0.85,0.97,1.0), edge*0.55);
        gl_FragColor = vec4(col, 0.78 + edge*0.18);
      }`}),Ut=new K(new ci(25.5,72),xt);Ut.rotation.x=-Math.PI/2,Ut.position.set(c.x,-.55,c.z),Ut.renderOrder=3,r.add(Ut);const Yt=new K(new On(24.1,25.6,72),new re({color:15335423,transparent:!0,opacity:.32,side:le,depthWrite:!1}));Yt.rotation.x=-Math.PI/2,Yt.position.set(c.x,-.5,c.z),r.add(Yt);const Nt=new kt;Nt.position.set(58,0,-22);const q=new no(1,0);for(let U=0;U<11;U++){const f=new K(q,U%3?e.rock:e.rockDark),b=4+n()*7;f.scale.set(b,b*(.7+n()*.7),b),f.position.set((n()-.5)*15,1+n()*8,(n()-.5)*12),f.rotation.set(n()*2,n()*2,n()*2),f.castShadow=!0,f.receiveShadow=!0,Nt.add(f)}r.add(Nt);const pt={time:{value:0}},Et=new Pn({transparent:!0,depthWrite:!1,side:le,uniforms:pt,vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
      uniform float time; varying vec2 vUv;
      void main(){
        float streak = sin(vUv.y*42.0 - time*7.0 + sin(vUv.x*18.0)*2.0)*0.5+0.5;
        streak = pow(streak, 1.7);
        vec3 col = mix(vec3(0.42,0.85,0.95), vec3(0.95,1.0,1.0), streak);
        float edge = smoothstep(0.0,0.16,vUv.x)*smoothstep(1.0,0.84,vUv.x);
        gl_FragColor = vec4(col, (0.42+streak*0.5)*edge);
      }`}),mt=new K(new Fe(5.4,13,1,8),Et);mt.position.set(51.5,5,-5.8),mt.rotation.y=-.12,r.add(mt);const St=new en(new je({map:ni(),color:14680063,transparent:!0,opacity:.35,blending:ge,depthWrite:!1}));St.position.set(51.5,-.3,-5.4),St.scale.set(9,4,1),r.add(St);const Vt=new K(new Fe(4.2,16),new re({color:5231583,transparent:!0,opacity:.55,depthWrite:!1}));Vt.rotation.x=-Math.PI/2,Vt.position.set(51.6,-.35,2),r.add(Vt);const $t=[],fe=[],Qt=(U,f)=>Math.hypot(U,f)>96||Ne(U,f,o.x,o.z)<26||Ne(U,f,a.x,a.z)<18||Ne(U,f,c.x,c.z)<29||Ne(U,f,l.x,l.z)<17||H(U,f)<4.2||p(U,f)<.2||p(U,f)>17;let de=0;for(;$t.length<118&&de++<3e3;){const U=(n()-.5)*190,f=(n()-.5)*190;if(Qt(U,f))continue;const b=Math.exp(-((U+40)**2+(f+12)**2)/1800)+Math.exp(-((U+20)**2+(f+60)**2)/1400)+.35;n()>b||$t.push({x:U,z:f,y:p(U,f),s:.75+n()*.75,r:n()*Re})}for(de=0;fe.length<66&&de++<2500;){const U=(n()-.5)*185,f=(n()-.5)*185;if(Qt(U,f))continue;const b=Math.exp(-((U-58)**2+(f+30)**2)/1300)+Math.exp(-((U+56)**2+(f+42)**2)/1e3)+.18;n()>b||fe.push({x:U,z:f,y:p(U,f),s:.7+n()*.85,r:n()*Re})}function k(U,f=!1){const b=new Jt(.16,.28,2.4,6);b.translate(0,1.2,0);const R=new bs(b,e.trunk,U.length);R.castShadow=!0,R.receiveShadow=!0;const L=new he,P=new oi,G=new C,W=new C,ct=new Ht;if(U.forEach((it,dt)=>{W.set(it.x,it.y,it.z),P.setFromAxisAngle(new C(0,1,0),it.r),G.set(it.s,it.s,it.s),L.compose(W,P,G),R.setMatrixAt(dt,L),s.push({x:it.x,z:it.z,r:.5*it.s,type:"tree"})}),r.add(R),f){const it=new Ae(1.45,3,7),dt=new bs(it,e.pine,U.length*3);dt.castShadow=!0,dt.receiveShadow=!0;let _t=0;U.forEach(ft=>{for(let zt=0;zt<3;zt++){W.set(ft.x,ft.y+(1.8+zt*1.25)*ft.s,ft.z),P.setFromAxisAngle(new C(0,1,0),ft.r+zt);const ee=(1.2-zt*.24)*ft.s;G.set(ee,(.95-zt*.1)*ft.s,ee),L.compose(W,P,G),dt.setMatrixAt(_t,L),ct.setHex([3109717,3902051,5218160][zt]),dt.setColorAt(_t,ct),_t++}}),dt.instanceColor.needsUpdate=!0,r.add(dt)}else{const it=new Zi(1.35,0),dt=new bs(it,e.leaf,U.length*2);dt.castShadow=!0,dt.receiveShadow=!0;let _t=0;U.forEach(ft=>{for(let zt=0;zt<2;zt++){W.set(ft.x+(zt?.35:-.2)*ft.s,ft.y+(2.5+zt*1)*ft.s,ft.z+(zt?-.2:.25)*ft.s),P.setFromAxisAngle(new C(0,1,0),ft.r+zt);const ee=(1-zt*.18)*ft.s;G.set(ee,ee*(.9+n()*.2),ee),L.compose(W,P,G),dt.setMatrixAt(_t,L),ct.setHex(zt?8242012:6070090),ct.offsetHSL(n()*.03,0,(n()-.5)*.08),dt.setColorAt(_t,ct),_t++}}),dt.instanceColor.needsUpdate=!0,r.add(dt)}}k($t),k(fe,!0);function Ie(U,f){const b=new Ae(.09,.55,3);b.translate(0,.27,0);const R=new bs(b,new an({color:f,gradientMap:t,flatShading:!0}),U),L=new he,P=new oi,G=new C,W=new C;let ct=0,it=0;for(;ct<U&&it++<U*12;){const dt=(n()-.5)*185,_t=(n()-.5)*185;if(Math.hypot(dt,_t)>92)continue;const ft=p(dt,_t);if(ft<.2||ft>16||Ne(dt,_t,o.x,o.z)<10||H(dt,_t)<1.4||Ne(dt,_t,c.x,c.z)<22||Ne(dt,_t,l.x,l.z)<10)continue;W.set(dt,ft,_t),P.setFromAxisAngle(new C(0,1,0),n()*Re);const zt=.7+n()*1.3;G.set(zt,.7+n()*1.2,zt),L.compose(W,P,G),R.setMatrixAt(ct++,L)}R.count=ct,r.add(R)}Ie(1900,7648084),Ie(900,9423462);const ie=new He(.11,0),Kt=[16761309,16773296,13944063,16777215];for(let U=0;U<4;U++){const b=new bs(ie,new an({color:Kt[U],gradientMap:t,emissive:Kt[U],emissiveIntensity:.12}),95),R=new he,L=new C,P=new oi,G=new C;let W=0,ct=0;for(;W<95&&ct++<95*20;){const it=(n()-.5)*170,dt=(n()-.5)*170;if(Math.hypot(it,dt)>88)continue;const _t=p(it,dt);if(_t<.3||_t>14||Ne(it,dt,c.x,c.z)<22||Ne(it,dt,l.x,l.z)<11||H(it,dt)<1.6||Ne(it,dt,o.x,o.z)<9)continue;L.set(it,_t+.3,dt),P.setFromAxisAngle(new C(0,1,0),n()*Re);const ft=.7+n()*1.1;G.set(ft,ft,ft),R.compose(L,P,G),b.setMatrixAt(W++,R)}b.count=W,r.add(b)}const Tt=new bs(new no(1,0),e.rock,70);{const U=new he,f=new C,b=new oi,R=new C;let L=0,P=0;for(;L<70&&P++<900;){const G=(n()-.5)*180,W=(n()-.5)*180;if(Math.hypot(G,W)>94)continue;const ct=p(G,W);if(ct<.4||Ne(G,W,o.x,o.z)<18||Ne(G,W,a.x,a.z)<13||Ne(G,W,l.x,l.z)<12||H(G,W)<3)continue;const it=.5+n()*1.7;f.set(G,ct+it*.2,W),b.setFromEuler(new qn(n(),n()*Re,n()*.4)),R.set(it,it*(.6+n()*.5),it),U.compose(f,b,R),Tt.setMatrixAt(L++,U),it>1&&s.push({x:G,z:W,r:it*.8,type:"rock"})}Tt.count=L,Tt.castShadow=!0,Tt.receiveShadow=!0,r.add(Tt)}const xe=new qe,nt=620,E=new Float32Array(nt*3);for(let U=0;U<nt;U++){const f=n()*Re,b=n()*100;E[U*3]=Math.cos(f)*b,E[U*3+1]=2+n()*18,E[U*3+2]=Math.sin(f)*b}xe.setAttribute("position",new un(E,3));const _=new ka(xe,new eo({color:16774344,size:.22,transparent:!0,opacity:.72,blending:ge,depthWrite:!1}));r.add(_);const O=new kt;O.position.set(o.x,0,o.z),r.add(O);const X=e;function Q(U,f,b,R,L,P,G=!1){const W=new kt,ct=p(o.x+U,o.z+f);W.position.set(U,ct,f),W.rotation.y=b;const it=new K(new Lt(R,P,L),X.plaster);it.position.y=P/2,it.castShadow=!0,it.receiveShadow=!0,W.add(it);const dt=X.woodDark;for(const Dt of[-R/2+.12,R/2-.12]){const Ue=new K(new Lt(.16,P,.16),dt);Ue.position.set(Dt,P/2,L/2+.01),W.add(Ue)}const _t=new K(new Lt(R+.1,.18,.18),dt);_t.position.set(0,P-.25,L/2+.01),W.add(_t);const ft=new K(new Lt(R+.06,.12,.12),dt);ft.position.set(0,P*.55,L/2+.01),W.add(ft);const zt=new K(new Ae(Math.max(R,L)*.82,2.5,4),X.roof);zt.position.y=P+1.1,zt.rotation.y=Math.PI/4,zt.castShadow=!0,zt.receiveShadow=!0,W.add(zt);const ee=new K(new Ae(Math.max(R,L)*.9,.3,4),X.roofLight);ee.position.y=P+.1,ee.rotation.y=Math.PI/4,W.add(ee);const _e=new K(new Lt(1.05,1.9,.12),X.woodDark);_e.position.set(0,.95,L/2+.06),W.add(_e);const tn=new K(new ue(.06,8,6),X.gold);tn.position.set(.32,1,L/2+.14),W.add(tn);for(const Dt of[-R*.3,R*.3]){const Ue=new K(new Fe(.72,.72),new re({color:16766346}));Ue.position.set(Dt,P*.58,L/2+.07),W.add(Ue);const ae=new K(new Lt(.9,.9,.08),X.woodDark);ae.position.set(Dt,P*.58,L/2+.02),W.add(ae),Ue.renderOrder=1}if(G){const Dt=new K(new Lt(R*.72,2.1,L*.72),X.plaster);Dt.position.y=P+2,Dt.castShadow=!0,W.add(Dt);const Ue=new K(new Ae(Math.max(R,L)*.6,1.8,4),X.roofLight);Ue.position.y=P+3.9,Ue.rotation.y=Math.PI/4,Ue.castShadow=!0,W.add(Ue)}const oe=new K(new Lt(.55,1.4,.55),X.stoneDark);return oe.position.set(R*.28,P+1.7,-L*.15),W.add(oe),O.add(W),s.push({x:o.x+U,z:o.z+f,r:Math.max(R,L)*.58,type:"house"}),W}Q(-13.5,-2,.12,6.2,5.2,3.2),Q(13,0,-.2,5.8,5,3),Q(-11.5,9.5,1.55,5.6,4.8,3),Q(12.2,10,-1.55,6,5,3.2,!0),Q(0,16.5,Math.PI,7,5.4,3.4),Q(-22,15,2.2,5.2,4.6,2.8);{const U=new kt,f=p(o.x,o.z);U.position.set(0,f,0);const b=new K(new Jt(1.15,1.25,.9,12),X.stone);b.position.y=.45,b.castShadow=!0,U.add(b);const R=new K(new ci(.95,16),new re({color:1727342}));R.rotation.x=-Math.PI/2,R.position.y=.86,U.add(R);for(const P of[-.85,.85]){const G=new K(new Lt(.16,2.1,.16),X.woodDark);G.position.set(P,1.5,0),U.add(G)}const L=new K(new Ae(1.5,.8,4),X.roof);L.position.y=2.75,L.rotation.y=Math.PI/4,U.add(L),O.add(U),s.push({x:o.x,z:o.z,r:1.35,type:"well"})}{const U=new kt,f=p(o.x+8.5,o.z+12.5);U.position.set(8.5,f,12.5),U.rotation.y=-.7;const b=new K(new Lt(3.4,.5,2.6),X.stoneDark);b.position.y=.25,b.receiveShadow=!0,U.add(b);const R=new K(new Lt(.7,.55,.5),X.woodDark);R.position.set(0,.72,0),U.add(R);const L=new K(new Lt(1,.28,.5),new an({color:3950160,gradientMap:t,metalness:.1}));L.position.set(0,1.1,0),U.add(L);const P=new K(new ue(.32,8,6),X.flame);P.position.set(-1.2,.75,-.6),P.scale.y=1.5,U.add(P);const G=new kn(16747068,7,8,2);G.position.copy(P.position),U.add(G);const W=new K(new Lt(.18,2.8,.18),X.woodDark);W.position.set(1.4,1.4,-1.1),U.add(W);const ct=new K(new Fe(.9,1.7),new re({color:12076107,side:le}));ct.position.set(1.4,2,-1),U.add(ct),O.add(U),s.push({x:o.x+8.5,z:o.z+12.5,r:2,type:"forge"}),O.userData.forgeFire=P,O.userData.forgeLight=G}function j(U,f,b){const R=new kt;R.position.set(U,p(o.x+U,o.z+f),f),R.rotation.y=b;const L=new K(new Lt(2.4,.12,1.5),X.red);L.position.y=2.1,L.rotation.z=.04,R.add(L);for(const G of[-1,1])for(const W of[-.55,.55]){const ct=new K(new Lt(.1,2.1,.1),X.woodDark);ct.position.set(G,1.05,W),R.add(ct)}const P=new K(new Lt(2.2,.12,1.1),X.wood);P.position.y=.9,R.add(P);for(let G=0;G<5;G++){const W=new K(new ue(.12,6,5),new an({color:[16751222,16765818,10354639][G%3],gradientMap:t}));W.position.set(-.7+G*.35,1.05,0),R.add(W)}O.add(R)}j(-6.5,3.5,.25),j(6.5,4.2,-.3);const Ft=new Lt(.12,1.1,.12);for(let U=0;U<24;U++){const f=U/24*Re,b=19.5,R=Math.cos(f)*b,L=Math.sin(f)*b;if(L>8&&Math.abs(R)<4)continue;const P=p(o.x+R,o.z+L),G=new K(Ft,X.woodDark);if(G.position.set(o.x+R,P+.55,o.z+L),r.add(G),U%2===0){const W=new K(new Lt(2.6,.09,.09),X.wood);W.position.set(o.x+R,P+.75,o.z+L),W.rotation.y=-f+Math.PI/2,r.add(W)}}const lt=[],ut=[[-4.5,-4],[4.5,-4],[-4.5,12],[4.5,12],[-15,5],[15,6]];for(const[U,f]of ut){const b=p(o.x+U,o.z+f),R=new K(new Jt(.07,.1,2.5,5),X.woodDark);R.position.set(o.x+U,b+1.25,o.z+f),r.add(R);const L=new K(new Lt(.3,.4,.3),new re({color:16764794}));L.position.set(o.x+U,b+2.55,o.z+f),r.add(L);const P=new en(new je({map:ni(),color:16760410,transparent:!0,opacity:.5,blending:ge,depthWrite:!1}));P.position.copy(L.position),P.scale.set(1.4,1.4,1),r.add(P),lt.push({glow:P,phase:n()*Re})}for(let U=0;U<5;U++){const f=U/5*Re,b=Math.cos(f)*10,R=Math.sin(f)*10,L=p(o.x+b,o.z+R),P=new K(new Jt(.06,.08,4.2,5),X.woodDark);P.position.set(o.x+b,L+2.1,o.z+R),r.add(P);const G=new K(new Fe(1.2,.7),new re({color:U%2?3112330:12076107,side:le}));G.position.set(o.x+b+.6,L+3.9,o.z+R),r.add(G)}const Ct=new kt;Ct.position.set(a.x,0,a.z),r.add(Ct);const ot=11;{const U=new K(new Jt(13.5,14.5,.8,8),e.stone);U.position.y=ot-.4,U.receiveShadow=!0,U.castShadow=!0,Ct.add(U);for(let f=0;f<4;f++){const b=new K(new Lt(7.2-f*.4,.35,1.25),e.stone);b.position.set(0,ot-.15-f*.34,13.5+f*1.15),b.receiveShadow=!0,Ct.add(b)}for(let f=0;f<14;f++){const b=n()*Re,R=4+n()*9,L=new K(new ci(.6+n()*1.4,7),new re({color:5212746,transparent:!0,opacity:.6}));L.rotation.x=-Math.PI/2,L.position.set(Math.cos(b)*R,ot+.26,Math.sin(b)*R),Ct.add(L)}}{const U=new kt;U.position.set(0,ot+.25,15.5);for(const L of[-4.1,4.1]){const P=new K(new Jt(.42,.55,7.2,8),e.red);P.position.set(L,3.6,0),P.castShadow=!0,U.add(P);const G=new K(new Jt(.75,.85,.5,8),e.stoneDark);G.position.set(L,.25,0),U.add(G)}const f=new K(new Lt(11,.55,.75),e.red);f.position.y=7.15,U.add(f);const b=new K(new Lt(9.2,.35,.55),e.red);b.position.y=6.55,U.add(b);const R=new K(new Lt(11.8,.24,.9),e.woodDark);R.position.y=7.5,U.add(R),Ct.add(U),s.push({x:a.x-4.1,z:a.z+15.5,r:.7,type:"temple"}),s.push({x:a.x+4.1,z:a.z+15.5,r:.7,type:"temple"})}for(const[U,f]of[[-7,6],[7,6],[-7,-4],[7,-4],[-9.5,1],[9.5,1]]){const b=new K(new Jt(.55,.68,6.6,8),e.stone);b.position.set(U,ot+3.3,f),b.castShadow=!0,b.receiveShadow=!0,Ct.add(b);const R=new K(new Lt(1.5,.4,1.5),e.stoneDark);R.position.set(U,ot+6.65,f),Ct.add(R),s.push({x:a.x+U,z:a.z+f,r:.75,type:"temple"})}const gt=new kt;gt.position.set(0,ot+3.3,-7);{const U=new K(new Jt(1.7,2.2,1.1,8),e.stoneDark);U.position.y=ot+.55,U.castShadow=!0,Ct.add(U);const f=new K(new li(1.55,.16,8,24),e.gold);f.rotation.x=Math.PI/2,f.position.y=ot+1.15,Ct.add(f);const b=new K(new He(.8,0),e.cyan);b.position.copy(gt.position),Ct.add(b),gt.userData.orb=b;const R=new en(new je({map:ni(),color:8255999,transparent:!0,opacity:.85,blending:ge,depthWrite:!1}));R.position.copy(gt.position),R.scale.set(5,5,1),Ct.add(R),gt.userData.glow=R;const L=new kn(8255999,10,16,2);L.position.copy(gt.position),Ct.add(L),gt.userData.light=L,Ct.add(gt),s.push({x:a.x,z:a.z-7,r:2,type:"temple"})}const Ot=[];for(const U of[-5.4,5.4]){const f=new kt;f.position.set(U,ot+.25,-4);const b=new K(new Jt(.6,.4,.5,8),e.stoneDark);b.position.y=.9,f.add(b);const R=new K(new Jt(.16,.3,.9,6),e.stoneDark);R.position.y=.45,f.add(R);const L=new K(new ue(.3,8,6),e.flame);L.position.y=1.35,L.scale.y=1.6,f.add(L);const P=new kn(16751180,6,9,2);P.position.y=1.5,f.add(P),Ct.add(f),Ot.push({fire:L,light:P,phase:n()*Re})}const Gt=[];for(let U=0;U<18;U++){const f=new K(new He(.06+n()*.1,0),new re({color:10484735,transparent:!0,opacity:.8}));f.position.set(a.x+(n()-.5)*12,ot+2+n()*5,a.z+(n()-.5)*12),f.userData.phase=n()*Re,f.userData.base=f.position.clone(),r.add(f),Gt.push(f)}const ht=new kt;ht.position.set(l.x,0,l.z),r.add(ht);const Zt=p(l.x,l.z);{const U=new K(new Jt(7,8,.7,8),e.stoneDark);U.position.y=Zt+.1,U.receiveShadow=!0,ht.add(U);for(const L of[-3.5,3.5]){const P=new K(new Lt(1.5,7.5,1.5),e.stoneDark);P.position.set(L,3.9,0),P.rotation.z=L<0?.05:-.05,P.castShadow=!0,ht.add(P);const G=new K(new Ae(.9,2.2,5),e.stoneDark);G.position.set(L,8.7,0),ht.add(G)}const f=new K(new Lt(9,1,1.8),e.stoneDark);f.position.y=7,ht.add(f);const b=new K(new Fe(5.2,6.4),new Pn({transparent:!0,depthWrite:!1,side:le,uniforms:{time:{value:0}},vertexShader:"varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",fragmentShader:`uniform float time; varying vec2 vUv;
        void main(){ vec2 c=vUv-0.5; float r=length(c)*2.0;
          float swirl=sin(atan(c.y,c.x)*5.0 + r*10.0 - time*2.5)*0.5+0.5;
          vec3 col=mix(vec3(0.08,0.01,0.14),vec3(0.55,0.18,0.95),swirl);
          col += vec3(0.5,0.2,1.0)*pow(1.0-r,3.0)*0.8;
          gl_FragColor=vec4(col, smoothstep(1.0,0.75,r)*0.92);
        }`}));b.position.set(0,3.7,.1),ht.add(b),ht.userData.portal=b;const R=new kn(10181887,14,20,2);R.position.set(0,3.8,1.5),ht.add(R),ht.userData.glow=R;for(let L=0;L<8;L++){const P=new K(new He(.35+n()*.5,0),e.purple);P.position.set((n()-.5)*11,.6+n()*2.5,(n()-.5)*9),ht.add(P)}s.push({x:l.x-3.5,z:l.z,r:1.1,type:"gate"}),s.push({x:l.x+3.5,z:l.z,r:1.1,type:"gate"})}const Wt=[];function pe(U,f,b,R,L,P,G){const W=p(R,L),ct=gg({...P});ct.group.position.set(R,W,L),ct.group.rotation.y=P.rot??0,r.add(ct.group);let it=null;it=new en(new je({map:Sg(G,P.markerColor||"#ffd37a"),transparent:!0,depthWrite:!1,depthTest:!1})),it.position.set(R,W+2.6,L),it.scale.set(.65,.65,1),it.renderOrder=5,r.add(it);const dt={type:"npc",id:U,name:f,role:b,pos:new C(R,W,L),model:ct,marker:it,baseY:W,phase:n()*Re};return Wt.push(dt),s.push({x:R,z:L,r:.55,type:"npc"}),dt}pe("mira","Elder Mira","Keeper of Dawn",o.x-3.8,o.z-3.5,{robe:2910840,hair:14280426,accent:16765818,staff:!0,rot:.3},"!"),pe("rook","Rook","Island Blacksmith",o.x+8.2,o.z+14.6,{robe:7027242,hair:2824723,accent:16751180,apron:!0,rot:-2.5},"!"),pe("kael","Kael","Scout of the Vale",-26,3,{robe:3824702,hair:8015147,accent:10354639,hood:!0,bow:!0,rot:1.2},"!");const z=[];function vt(U,f,b,R,L=!1){const P=p(b,R),G=new kt;G.position.set(b,P,R);const W=new K(new Jt(1.15,1.35,.45,8),e.stoneDark);W.position.y=.22,W.receiveShadow=!0,G.add(W);const ct=new K(new Jt(.38,.55,1.5,6),e.stone);ct.position.y=1.1,G.add(ct);const it=new K(new He(.42,0),L?e.gold:e.cyan);it.position.y=2.15,G.add(it);const dt=new en(new je({map:ni(),color:L?16765818:8255999,transparent:!0,opacity:L?.8:.5,blending:ge,depthWrite:!1}));dt.position.y=2.15,dt.scale.set(3,3,1),G.add(dt);const _t=new K(new On(1.5,1.8,24),new re({color:L?16765818:8255999,transparent:!0,opacity:.55,side:le,depthWrite:!1}));_t.rotation.x=-Math.PI/2,_t.position.y=.47,G.add(_t),r.add(G);const ft={type:"shrine",id:U,name:f,pos:new C(b,P,R),group:G,crystal:it,glow:dt,ring:_t,active:L,phase:n()*Re};return z.push(ft),s.push({x:b,z:R,r:.7,type:"shrine"}),ft}vt("village","Dawn Shrine",6.2,31.5,!0),vt("forest","Verdant Shrine",-31,-9),vt("temple","Temple Shrine",10.5,-58),vt("gate","Sealed Shrine",-42,-40);const J=[[4.5,27.5],[-17,20],[-31,-2],[-41,-27],[-21,-42],[19,-29],[37,-6],[30,23],[62,-2],[16,-52],[-57,-59],[66,-26]],at=[],At=new He(.46,0),wt=new an({color:11141119,gradientMap:t,emissive:2872294,emissiveIntensity:1.1}),jt=new je({map:ni(),color:8255999,transparent:!0,opacity:.7,blending:ge,depthWrite:!1});J.forEach(([U,f],b)=>{const R=p(U,f),L=new kt;L.position.set(U,R+1.15,f);const P=new K(At,wt);P.castShadow=!0,L.add(P);const G=new K(new He(.24,0),new re({color:16777215}));L.add(G);const W=new en(jt.clone());W.scale.set(2.2,2.2,1),L.add(W);const ct=new K(new On(.7,.85,16),new re({color:8255999,transparent:!0,opacity:.4,side:le,depthWrite:!1}));ct.rotation.x=-Math.PI/2,ct.position.y=-.95,L.add(ct),r.add(L),at.push({id:`crystal${b}`,pos:new C(U,R,f),group:L,mesh:P,glow:W,ring:ct,collected:!1,phase:n()*Re})});const we=[];function Le(U,f,b,R=60,L=!1){const P=p(f,b),G=new kt;G.position.set(f,P,b);const W=new K(new Lt(1.25,.65,.8),e.wood);W.position.y=.32,W.castShadow=!0,G.add(W);const ct=new kt;ct.position.set(0,.66,-.4);const it=new K(new Lt(1.3,.35,.85),e.woodDark);it.position.set(0,.1,.4),it.castShadow=!0,ct.add(it),G.add(ct);for(const zt of[-.4,.4]){const ee=new K(new Lt(.12,.72,.86),e.gold);ee.position.set(zt,.34,0),G.add(ee)}const dt=new K(new Lt(.25,.3,.1),e.gold);dt.position.set(0,.5,.44),G.add(dt);const _t=new en(new je({map:ni(),color:16765818,transparent:!0,opacity:L?.3:.18,blending:ge,depthWrite:!1}));_t.position.set(0,1,0),_t.scale.set(2.4,2.4,1),G.add(_t),r.add(G);const ft={type:"chest",id:U,pos:new C(f,P,b),group:G,lid:ct,glow:_t,opened:!1,reward:R,phase:n()*Re};return we.push(ft),s.push({x:f,z:b,r:.8,type:"chest"}),ft}Le("chest-village",-20,48,80),Le("chest-forest",-42,14,100),Le("chest-temple",17,-72,140),Le("chest-waterfall",61,-9,120),Le("chest-gate",-60,-58,180);const Bt=new kt;Bt.position.copy(h),Bt.name="dungeon",i.add(Bt);const Qe=[],En=[],Ws=[];{const U=new an({color:16777215,gradientMap:t,map:wg()}),f=new K(new Fe(34,54),U);f.rotation.x=-Math.PI/2,f.position.set(0,0,-223),f.receiveShadow=!0,Bt.add(f);const b=new K(new Fe(38,58),new an({color:1314080,gradientMap:t}));b.rotation.x=Math.PI/2,b.position.set(0,17,-223),Bt.add(b);const R=new an({color:2366003,gradientMap:t,flatShading:!0});for(const G of[-17,17]){const W=new K(new Lt(1.6,17,56),R);W.position.set(G,8.5,-223),W.receiveShadow=!0,Bt.add(W),Qe.push({x:G,z:-223,r:1.4,type:"wall"})}const L=new K(new Lt(36,17,1.6),R);L.position.set(0,8.5,-250),Bt.add(L);const P=new K(new Lt(36,17,1.6),R);P.position.set(0,8.5,-196),Bt.add(P);for(const G of[-16.4,16.4]){const W=new K(new Lt(.5,.12,54),new re({color:9129440}));W.position.set(G,.1,-223),Bt.add(W)}}{const U=new kt;U.position.set(0,0,-199.5);for(const R of[-3.2,3.2]){const L=new K(new Lt(1.2,8,1.2),e.stoneDark);L.position.set(R,4,0),U.add(L)}const f=new K(new Lt(8,1.2,1.4),e.stoneDark);f.position.y=8,U.add(f),Bt.add(U);const b=new K(new Fe(4.2,6),new re({color:8255999,transparent:!0,opacity:.22,side:le,depthWrite:!1}));b.position.set(0,3.2,-198.7),Bt.add(b),Bt.userData.exitPortal=b}const ui=new an({color:3220290,gradientMap:t,flatShading:!0});for(let U=0;U<8;U++){const f=U%2?1:-1,b=-204-Math.floor(U/2)*12,R=7+U%3*2.2,L=new K(new Jt(.9,1.15,R,6),ui);L.position.set(f*11.5,R/2,b),L.castShadow=!0,Bt.add(L);const P=new K(new Lt(2.2,.5,2.2),ui);if(P.position.set(f*11.5,R+.25,b),Bt.add(P),Qe.push({x:f*11.5,z:b,r:1.2,type:"pillar"}),U%2===0){const G=new K(new Jt(.04,.04,5,4),new an({color:5063512,gradientMap:t}));G.position.set(f*8,12,b+4),Bt.add(G)}}{const U=new kt;U.position.set(0,0,-244);const f=new K(new Lt(7,1.2,5),ui);f.position.y=.6,U.add(f);const b=new K(new Lt(5,5,1.6),ui);b.position.set(0,3.2,-1.5),U.add(b);for(const L of[-2.9,2.9]){const P=new K(new Lt(.8,3.2,3.8),ui);P.position.set(L,2,-.4),U.add(P)}const R=new K(new Ae(.8,2.2,4),e.purple);R.position.set(0,7,-1.5),U.add(R),Bt.add(U),Qe.push({x:0,z:-244,r:3.2,type:"throne"})}for(let U=0;U<16;U++){const f=U%2?1:-1,b=new K(new He(.4+n()*.9,0),e.purple);b.position.set(f*(12+n()*3),.6+n()*2.2,-202-n()*44),b.scale.y=1.5+n()*1.8,b.rotation.z=(n()-.5)*.4,Bt.add(b)}for(let U=0;U<6;U++){const f=U%2?1:-1,b=-203-Math.floor(U/2)*14,R=new K(new Lt(.4,.5,.4),e.woodDark);R.position.set(f*15.7,6,b),Bt.add(R);const L=new K(new ue(.38,8,6),e.flame);L.position.set(f*15.4,6.5,b),L.scale.y=1.5,Bt.add(L);const P=new kn(16747068,16,22,2);P.position.set(f*14.8,6.5,b),Bt.add(P),En.push(P),Ws.push({fire:L,light:P,phase:n()*Re})}const Tn=new kn(10181887,40,36,2);Tn.position.set(0,9,-236),Bt.add(Tn);const is=new kn(8255999,18,20,2);is.position.set(0,6,-199),Bt.add(is);{const U=new K(new Jt(4,6,22,16,1,!0),new re({color:10190079,transparent:!0,opacity:.07,side:le,depthWrite:!1,blending:ge}));U.position.set(0,10,-232),Bt.add(U)}const Kn=new K(new Fe(32,16),new re({color:8006360,transparent:!0,opacity:.22,side:le,depthWrite:!1,blending:ge}));Kn.position.set(0,8,-209),Kn.visible=!1,Bt.add(Kn);const Xs=new qe,Pi=220,Li=new Float32Array(Pi*3);for(let U=0;U<Pi;U++)Li[U*3]=(n()-.5)*30,Li[U*3+1]=n()*14,Li[U*3+2]=-200-n()*46;Xs.setAttribute("position",new un(Li,3));const Di=new ka(Xs,new eo({color:11824127,size:.18,transparent:!0,opacity:.65,blending:ge,depthWrite:!1}));Bt.add(Di);const Zn={type:"shrine",id:"dungeon",name:"Echo Shrine",pos:new C(5.5,0,-202.5),active:!1,inDungeon:!0};{const U=new kt;U.position.set(5.5,0,-202.5);const f=new K(new Jt(.9,1.1,.4,8),e.stoneDark);f.position.y=.2,U.add(f);const b=new K(new He(.35,0),e.cyan);b.position.y=1.4,U.add(b);const R=new en(new je({map:ni(),color:8255999,transparent:!0,opacity:.6,blending:ge,depthWrite:!1}));R.position.y=1.4,R.scale.set(2.5,2.5,1),U.add(R),Bt.add(U),Zn.group=U,Zn.crystal=b,Zn.glow=R,Zn.phase=1}z.push(Zn),Qe.push({x:5.5,z:-202.5,r:.6,type:"shrine"});const zn=[];Wt.forEach(U=>zn.push(U)),we.forEach(U=>zn.push(U)),z.forEach(U=>zn.push(U)),zn.push({type:"temple",id:"temple-orb",name:"Dawn Shrine",pos:new C(a.x,ot+1.4,a.z-7),inTemple:!0}),zn.push({type:"dungeon-gate",id:"dungeon-gate",name:"Shadow Gate",pos:new C(l.x,Zt+1,l.z+2),inIsland:!0}),zn.push({type:"dungeon-exit",id:"dungeon-exit",name:"Return to the Isle",pos:new C(0,0,-200.5),inDungeon:!0});let me=0;const Ze={heightAt:x,terrain:V,island:r,colliders:s,interactables:zn,crystals:at,chests:we,checkpoints:z,npcs:Wt,gate:ht,temple:Ct,shrineOrb:gt,dungeon:Bt,dungeonColliders:Qe,dungeonOrigin:h.clone(),dungeonShrine:Zn,bossLight:Tn,fogWall:Kn,dungeonLights:En,waterfall:mt,water:Ut,mats:e,gradient:t,zone:"island",templeLit:!1,dungeonEntered:!1,bossActive:!1,bossDefeated:!1,update(U){me+=U,yt.time.value=me,pt.time.value=me,ht.userData.portal&&(ht.userData.portal.material.uniforms.time.value=me);for(const f of rt)f.position.x+=f.userData.speed*U,f.position.x>220&&(f.position.x=-220);for(const f of at){if(f.collected)continue;f.group.position.y=f.pos.y+1.15+Math.sin(me*1.7+f.phase)*.18,f.mesh.rotation.y+=U*1.4,f.ring.rotation.z+=U*.7;const b=.9+Math.sin(me*2.4+f.phase)*.12;f.glow.scale.set(2.2*b,2.2*b,1)}gt.userData.orb&&(gt.userData.orb.rotation.y+=U*.9,gt.userData.orb.position.y=ot+3.3+Math.sin(me*1.5)*.16,gt.userData.glow.position.y=gt.userData.orb.position.y,gt.userData.glow.material.opacity=Ze.templeLit?.95:.5+Math.sin(me*2)*.1,gt.userData.light.intensity=(Ze.templeLit?18:8)+Math.sin(me*2.2)*2);for(const f of Ot)f.fire.scale.y=1.3+Math.sin(me*9+f.phase)*.25,f.light.intensity=5+Math.sin(me*8+f.phase)*1.2;for(const f of lt)f.glow.material.opacity=.4+Math.sin(me*2+f.phase)*.1;O.userData.forgeLight&&(O.userData.forgeLight.intensity=6+Math.sin(me*9)*1.5);for(const f of Wt)f.model.group.position.y=f.baseY+Math.sin(me*1.6+f.phase)*.025,f.marker&&(f.marker.position.y=f.baseY+2.65+Math.sin(me*2+f.phase)*.12,f.marker.material.rotation=Math.sin(me*1.2+f.phase)*.06),f.model.update&&f.model.update(U,me);for(const f of z)f.crystal&&(f.crystal.rotation.y+=U*.8),f.glow&&(f.glow.material.opacity=(f.active?.85:.45)+Math.sin(me*2.2+(f.phase||0))*.1);for(const f of we)f.opened||(f.glow.material.opacity=.16+Math.sin(me*1.8+f.phase)*.06);ht.userData.glow&&(ht.userData.glow.intensity=12+Math.sin(me*3)*4),_.rotation.y+=U*.012,_.position.y=Math.sin(me*.4)*.4;for(const f of Gt)f.position.y=f.userData.base.y+Math.sin(me*.8+f.userData.phase)*.35,f.rotation.y+=U*1.2;for(const f of Ws)f.fire.scale.y=1.3+Math.sin(me*10+f.phase)*.28,f.light.intensity=14+Math.sin(me*9+f.phase)*4;Tn.intensity=30+Math.sin(me*1.6)*8,Kn.material.opacity=.18+Math.sin(me*1.4)*.05,Ze.bossActive&&(Kn.visible=!0),Di.rotation.y+=U*.01,Bt.userData.exitPortal&&(Bt.userData.exitPortal.material.opacity=.18+Math.sin(me*2)*.06),St.material.opacity=.28+Math.sin(me*2.3)*.08},setZone(U,f){Ze.zone=U,U==="dungeon"?(f.fog.color.setHex(1510692),f.fog.near=8,f.fog.far=60,f.background=new Ht(788244),Ze.island.visible=!1,Ze.dungeon.visible=!0,st.visible=!1,$.visible=!1,rt.forEach(b=>b.visible=!1)):(f.fog.color.setHex(13625583),f.fog.near=80,f.fog.far=300,f.background=new Ht(12578815),Ze.island.visible=!0,Ze.dungeon.visible=!0,st.visible=!0,$.visible=!0,rt.forEach(b=>b.visible=!0))},activateTemple(){Ze.templeLit=!0,Ze.shrineOrb.userData.orb.material=e.gold,Ze.shrineOrb.userData.glow.material.map=ni(),Ze.shrineOrb.userData.glow.material.needsUpdate=!0,Ze.shrineOrb.userData.light.color.setHex(16765818)}};return Ze.setZone("island",i),Ze.dungeon.visible=!0,Ze}function Eg(){const i=new Uint8Array([70,70,70,255,135,135,135,255,205,205,205,255,255,255,255,255]),t=new co(i,4,1,_n);return t.minFilter=Ve,t.magFilter=Ve,t.needsUpdate=!0,t}const Tg=Eg(),Ge=(i,t={})=>new an({color:i,gradientMap:Tg,...t}),Ps=(i,t={})=>new re({color:i,...t}),se=(i,t)=>{const e=new K(i,t);return e.castShadow=!0,e.receiveShadow=!0,e},io=(i,t,e)=>Math.max(t,Math.min(e,i));function Ag(){const i=document.createElement("canvas");i.width=i.height=64;const t=i.getContext("2d"),e=t.createRadialGradient(32,32,1,32,32,32);return e.addColorStop(0,"rgba(255,255,255,1)"),e.addColorStop(.35,"rgba(190,120,255,.5)"),e.addColorStop(1,"rgba(190,120,255,0)"),t.fillStyle=e,t.fillRect(0,0,64,64),new ns(i)}const vh=Ag();function Cg(){const i=new kt,t=new kt;i.add(t);const e=Ge(6991948,{flatShading:!0}),n=Ge(4161346,{flatShading:!0}),s=se(new Zi(.62,1),e);s.scale.set(1,.92,.95),s.position.y=.62,t.add(s);const r=se(new Zi(.42,1),Ge(10211435,{flatShading:!0}));r.scale.set(.8,.7,.5),r.position.set(0,.52,.36),t.add(r);for(let l=0;l<5;l++){const h=se(new Ae(.13,.55,4),l%2?Ge(8374618):Ge(5216840)),d=l/5*Math.PI*2;h.position.set(Math.cos(d)*.26,1.1,Math.sin(d)*.26),h.rotation.z=Math.cos(d)*.5,h.rotation.x=-Math.sin(d)*.5,t.add(h)}const o=se(new Jt(.035,.05,.35,4),Ge(4161346));o.position.y=1.2,t.add(o);for(const l of[-1,1]){const h=se(new ue(.1,8,6),Ps(16774876));h.scale.set(.9,1.15,.55),h.position.set(l*.18,.72,.52),t.add(h);const d=se(new ue(.048,7,5),Ps(1515571));d.position.set(l*.18,.72,.6),t.add(d)}const a=se(new Lt(.16,.035,.03),Ps(1980965));a.position.set(0,.52,.59),t.add(a);for(const l of[-1,1]){const h=se(new ue(.16,6,5),n);h.scale.set(1.1,.5,1.3),h.position.set(l*.25,.08,.05),t.add(h)}const c=new K(new ci(.55,16),new re({color:463888,transparent:!0,opacity:.25,depthWrite:!1}));return c.rotation.x=-Math.PI/2,c.position.y=.015,i.add(c),{group:i,body:t,height:1.35,radius:.55}}function Rg(){const i=new kt,t=new kt;t.position.y=.65,i.add(t);const e=Ge(2431549,{flatShading:!0}),n=Ge(3876960,{flatShading:!0}),s=se(new Ae(.48,1.45,7,1,!0),e);s.position.y=.1,s.rotation.y=.2,t.add(s);const r=se(new ue(.3,8,7,0,Math.PI*2,0,Math.PI*.75),n);r.position.y=.62,r.rotation.x=-.2,t.add(r);const o=se(new ue(.2,8,6),Ge(920088));o.scale.set(.9,1,.5),o.position.set(0,.58,.2),t.add(o);for(const l of[-1,1]){const h=se(new ue(.045,6,5),Ps(16731517));h.scale.set(1.1,.7,.5),h.position.set(l*.08,.61,.34),t.add(h);const d=se(new Ae(.055,.38,5),Ge(7294101));d.position.set(l*.2,.82,0),d.rotation.z=l*-.5,d.rotation.x=-.3,t.add(d);const m=se(new Ae(.09,.55,5),n);m.position.set(l*.34,.2,.1),m.rotation.z=l*.6,m.rotation.x=.2,t.add(m);const p=se(new Ae(.04,.16,4),Ge(14268159));p.position.set(l*.48,-.02,.18),p.rotation.z=l*.2,t.add(p)}const a=new en(new je({map:vh,transparent:!0,opacity:.3,blending:ge,depthWrite:!1}));a.scale.set(2,2.2,1),a.position.y=.4,t.add(a);const c=new K(new ci(.5,16),new re({color:393996,transparent:!0,opacity:.2,depthWrite:!1}));return c.rotation.x=-Math.PI/2,c.position.y=.02,i.add(c),{group:i,body:t,height:1.9,radius:.5,aura:a}}function Pg(){const i=new kt,t=new kt;i.add(t);const e=Ge(2759487,{flatShading:!0}),n=Ge(4926827,{flatShading:!0}),s=Ge(9395158,{emissive:4922762,emissiveIntensity:.55}),r=Ge(13089238,{flatShading:!0}),o=[];for(const M of[-1,1]){const I=new kt;I.position.set(M*.55,1.2,0),t.add(I);const H=se(new Jt(.28,.36,1.05,6),e);H.position.y=-.5,I.add(H);const V=se(new Jt(.3,.42,.95,6),n);V.position.y=-1.35,I.add(V);const $=se(new Lt(.7,.35,1),e);$.position.set(0,-1.85,.18),I.add($),o.push(I)}const a=se(new Jt(.7,.55,.7,6),e);a.position.y=1.5,t.add(a);const c=se(new Jt(.95,.65,1.5,6),n);c.position.y=2.35,t.add(c);const l=se(new Lt(1.5,1,.6),e);l.position.set(0,2.55,.55),t.add(l);const h=se(new He(.3,0),s);h.position.set(0,2.55,.9),t.add(h);const d=new kn(11824127,14,8,2);d.position.set(0,2.6,1.1),t.add(d);for(const M of[-1,1]){const I=se(new ue(.55,7,6,0,Math.PI*2,0,Math.PI/2),e);I.scale.set(1.2,.8,1.1),I.position.set(M*1.05,2.95,0),t.add(I);for(let H=0;H<3;H++){const V=se(new Ae(.12,.65+H*.1,4),r);V.position.set(M*(.85+H*.22),3.35,-.15+H*.15),V.rotation.z=M*(.2+H*.1),t.add(V)}}const m=[];for(const M of[-1,1]){const I=new kt;I.position.set(M*1.3,2.85,0),t.add(I);const H=se(new Jt(.22,.3,1,6),e);H.position.y=-.5,I.add(H);const V=se(new Jt(.25,.3,.9,6),n);V.position.y=-1.25,I.add(V);const $=se(new ue(.24,6,5),r);$.position.y=-1.75,I.add($),m.push({arm:I,hand:$,sx:M})}const p=new kt;p.position.y=3.35,t.add(p);const x=se(new ue(.48,8,7),r);x.scale.set(1,1.05,.92),p.add(x);const v=se(new Lt(.5,.22,.42),r);v.position.set(0,-.36,.08),p.add(v);for(const M of[-1,1]){const I=se(new ue(.09,7,5),Ps(12872703));I.scale.set(1.1,.8,.5),I.position.set(M*.18,.06,.42),p.add(I)}const g=se(new Jt(.55,.45,.22,8,1,!0),s);g.position.y=.5,p.add(g);for(let M=0;M<6;M++){const I=M/6*Math.PI*2,H=se(new Ae(.09,.55,4),s);H.position.set(Math.cos(I)*.45,.75,Math.sin(I)*.45),p.add(H)}const u=se(new Fe(2.2,2.9),Ge(1708073,{side:le}));u.position.set(0,2.25,-.7),u.rotation.x=.12,t.add(u);const S=new kt,A=se(new Jt(.08,.09,.6,6),Ge(2759192));S.add(A);const w=se(new Lt(.7,.12,.16),s);w.position.y=.28,S.add(w);const B=se(new Lt(.3,2.3,.09),Ge(3811914,{emissive:2756420,emissiveIntensity:.4}));B.position.y=-1.15,S.add(B);const D=se(new Ae(.18,.5,4),Ge(3811914));D.position.y=-2.5,D.rotation.z=Math.PI,S.add(D);const N=se(new Lt(.045,2.1,.11),Ps(11824127));N.position.set(.14,-1.15,0),S.add(N),S.position.set(0,-1.7,0),S.rotation.x=.2,m[1].arm.add(S);const F=new K(new On(1.5,2,32),new re({color:10181887,transparent:!0,opacity:.3,side:le,depthWrite:!1,blending:ge}));F.rotation.x=-Math.PI/2,F.position.y=.06,i.add(F);const T=new en(new je({map:vh,transparent:!0,opacity:.18,blending:ge,depthWrite:!1}));return T.position.y=2.4,T.scale.set(7,7,1),i.add(T),{group:i,model:t,legs:o,arms:m,head:p,sword:S,core:h,coreLight:d,aura:F,auraSprite:T,height:4.2,radius:1.6}}function Lg(i=1.15){const t=document.createElement("canvas");t.width=128,t.height=24;const e=new ns(t);e.colorSpace=ln;const n=new je({map:e,transparent:!0,depthWrite:!1,depthTest:!0}),s=new en(n);return s.scale.set(i,i*.1875,1),s.renderOrder=8,{sprite:s,canvas:t,ctx:t.getContext("2d"),tex:e,width:i}}function Xr(i,t,e=!1){const{ctx:n,canvas:s,tex:r}=i;n.clearRect(0,0,s.width,s.height),n.fillStyle="rgba(4,6,14,.85)",n.fillRect(0,0,s.width,s.height),n.strokeStyle=e?"rgba(190,120,255,.9)":"rgba(220,240,255,.65)",n.lineWidth=2,n.strokeRect(1,1,s.width-2,s.height-2);const o=n.createLinearGradient(0,0,s.width,0);e?(o.addColorStop(0,"#7c2bc4"),o.addColorStop(1,"#e2a5ff")):(o.addColorStop(0,"#ff4668"),o.addColorStop(.7,"#ff8a9e"),o.addColorStop(1,"#ffc0c9")),n.fillStyle=o,n.fillRect(4,4,(s.width-8)*io(t,0,1),s.height-8),n.fillStyle="rgba(255,255,255,.4)",n.fillRect(4,4,(s.width-8)*io(t,0,1),3),r.needsUpdate=!0}class Dg{constructor(t,e,n,s,r={}){this.scene=t,this.world=e,this.vfx=n,this.audio=s,this.callbacks=r,this.enemies=[],this.boss=null,this.bossActive=!1,this.bossDefeated=!1,this.spawnTimer=0,this.spawns=[],this.dungeonSpawns=[],this.resetTimer=0,this._createSpawns(),this._spawnInitial()}_createSpawns(){const t=(s,r)=>this.world.heightAt(s,r),e=[[-25,-5],[-34,-19],[-19,-29],[18,10],[31,-15],[25,-40],[26,4],[10,-27],[-8,-47],[28,40],[-45,22],[58,-18]],n=[[-46,-16],[48,-31],[24,-52],[-20,-46],[82,2],[22,42],[-33,30]];for(const[s,r]of e)this.spawns.push({type:"moss",x:s,z:r,y:t(s,r),timer:0,alive:!1});for(const[s,r]of n)this.spawns.push({type:"shade",x:s,z:r,y:t(s,r),timer:0,alive:!1})}_spawnInitial(){for(const t of this.spawns)this.spawnFromSpawn(t)}spawnFromSpawn(t){const e=t.type==="moss"?this._createMoss(t):this._createShade(t);return t.alive=!0,t.enemy=e,this.enemies.push(e),e}_base(t,e,n,s){n.group.position.set(e.x,e.y,e.z),n.group.rotation.y=Math.random()*Math.PI*2,this.scene.add(n.group);const r=Lg(t==="boss"?4:1.15);r.sprite.position.y=n.height+.35,n.group.add(r.sprite),Xr(r,1,t==="boss"),r.sprite.visible=!1;const o={type:t,spawn:e,group:n.group,model:n,bar:r,hp:s.hp,maxHp:s.hp,speed:s.speed,damage:s.damage,aggro:s.aggro,attackRange:s.attackRange,attackCooldown:s.attackCooldown,xp:s.xp,coins:s.coins,state:"idle",stateTime:0,cooldown:Math.random()*1.5,stun:0,invuln:0,flash:0,dead:!1,deathTime:0,kb:new C,wander:new C,wanderTimer:Math.random()*2,home:new C(e.x,e.y,e.z),engaged:!1,hurtTimer:0,phase:1,inDungeon:!1,radius:n.radius,height:n.height,name:s.name};return o.wander.copy(o.home),o}_createMoss(t){const e=Cg();return this._base("moss",t,e,{hp:58,speed:3.4,damage:9,aggro:14,attackRange:1.7,attackCooldown:1.5,xp:28,coins:8,name:"Mossling"})}_createShade(t){const e=Rg();return this._base("shade",t,e,{hp:42,speed:6.2,damage:7,aggro:18,attackRange:2,attackCooldown:1,xp:40,coins:13,name:"Shade Fang"})}spawnBoss(){if(this.boss)return this.boss;const t={type:"boss",x:0,y:.3,z:-232},e=Pg(),n=this._base("boss",t,e,{hp:620,speed:3,damage:20,aggro:30,attackRange:4,attackCooldown:2.2,xp:700,coins:500,name:"The Hollow King"});return n.inDungeon=!0,n.home.set(0,.3,-232),n.wander.copy(n.home),n.bar.sprite.visible=!1,n.model.group.scale.setScalar(1.05),this.boss=n,this.enemies.push(n),n}startBoss(){var e,n,s,r;if(this.bossActive||this.bossDefeated)return;const t=this.spawnBoss();this.bossActive=!0,t.engaged=!0,t.state="roar",t.stateTime=0,(n=(e=this.callbacks).onBossStart)==null||n.call(e,t),(s=this.audio)==null||s.bossRoar(),(r=this.vfx)==null||r.shockwave(t.group.position,6,10181887,1)}enemyZone(t){return t.inDungeon?"dungeon":"island"}get zone(){var t,e;return((e=(t=this.callbacks).getZone)==null?void 0:e.call(t))??"island"}_damagePlayer(t){var n,s,r,o;const e=t.damage+(t.type==="boss"&&t.phase===2?5:0);(s=(n=this.callbacks).onPlayerHit)==null||s.call(n,e,t.group.position,t),t.type==="boss"?(r=this.vfx)==null||r.shockwave(t.group.position,5.2,10181887,.8):(o=this.vfx)==null||o.hitSpark(new C(t.group.position.x,t.group.position.y+.8,t.group.position.z),16733559,10)}update(t,e,n=!1){this.zone==="dungeon"&&!this.bossActive&&!this.bossDefeated&&e.z<-213&&this.startBoss(),this.spawnTimer+=t;for(const r of this.spawns)r.alive||(r.timer-=t,r.timer<=0&&this.zone==="island"&&(Math.hypot(e.x-r.x,e.z-r.z)>18?this.spawnFromSpawn(r):r.timer=3));for(const r of[...this.enemies]){if(r.dead){r.deathTime+=t;const o=Math.min(1,r.deathTime/1.1);if(r.group.rotation.z=o*1.2,r.group.position.y=r.spawn.y-o*.8,r.group.scale.setScalar(1-o*.55),r.bar.sprite.visible=!1,r.deathTime>1.25){this.scene.remove(r.group);const a=this.enemies.indexOf(r);a>=0&&this.enemies.splice(a,1),r.spawn&&(r.spawn.alive=!1)}continue}r.inDungeon&&this.zone!=="dungeon"||!r.inDungeon&&this.zone!=="island"||this._updateEnemy(r,t,e,n)}const s=this.enemies.filter(r=>!r.dead);for(let r=0;r<s.length;r++)for(let o=r+1;o<s.length;o++){const a=s[r],c=s[o],l=c.group.position.x-a.group.position.x,h=c.group.position.z-a.group.position.z,d=Math.hypot(l,h),m=(a.radius+c.radius)*.75;if(d>.001&&d<m){const p=(m-d)*.5;a.group.position.x-=l/d*p,a.group.position.z-=h/d*p,c.group.position.x+=l/d*p,c.group.position.z+=h/d*p}}}_updateEnemy(t,e,n,s){var d,m,p,x,v,g,u,S,A,w,B,D,N,F,T,M;const r=t.group.position,o=n.x-r.x,a=n.z-r.z,c=Math.hypot(o,a),l=Math.atan2(o,a);t.stateTime+=e,t.cooldown=Math.max(0,t.cooldown-e),t.stun=Math.max(0,t.stun-e),t.invuln=Math.max(0,t.invuln-e),t.flash=Math.max(0,t.flash-e),t.flash<=0&&t._flashed&&this._setFlash(t,!1),t.kb.lengthSq()>1e-4&&(r.x+=t.kb.x*e,r.z+=t.kb.z*e,t.kb.multiplyScalar(Math.max(0,1-e*8)),this._collide(t));const h=t.model;if(t.type==="moss"){const I=performance.now()*.003+t.home.x;h.body.position.y=Math.abs(Math.sin(I*2))*.12,h.body.rotation.z=Math.sin(I)*.04}else if(t.type==="shade"){const I=performance.now()*.003+t.home.z;h.body.position.y=.72+Math.sin(I*1.6)*.12,h.body.rotation.y+=e*.3,h.aura.material.opacity=.22+Math.sin(I*2.4)*.08}else if(t.type==="boss"){const I=performance.now()*.001;h.core.rotation.y+=e*1.1,h.aura.rotation.z+=e*.35,h.aura.material.opacity=t.phase===2?.4+Math.sin(I*3)*.15:.26+Math.sin(I*2)*.08,h.coreLight.intensity=(t.phase===2?24:12)+Math.sin(I*4)*3,(t.state==="idle"||t.state==="chase")&&(h.model.position.y=Math.sin(I*2.2)*.06,h.arms[0].arm.rotation.x=Math.sin(I*1.5)*.06,h.arms[1].arm.rotation.x=-.2+Math.sin(I*1.5)*.06,h.legs[0].rotation.x=0,h.legs[1].rotation.x=0)}if(t.stun>0){t.type==="boss"&&(h.model.rotation.x=Math.sin(t.stun*25)*.03);return}if(t.state==="hurt"&&(t.state="chase",t.stateTime=0,t.type==="moss"&&(h.body.scale.y=1)),t.type==="boss"&&!t.engaged){this.zone==="dungeon"&&n.z<-213&&this.startBoss();return}if(t.state==="idle"){if(t.wanderTimer-=e,t.wanderTimer<=0){t.wanderTimer=2+Math.random()*3;const $=Math.random()*Math.PI*2;t.wander.set(t.home.x+Math.cos($)*3,t.home.y,t.home.z+Math.sin($)*3)}const I=t.wander.x-r.x,H=t.wander.z-r.z,V=Math.hypot(I,H);V>.4&&(r.x+=I/V*t.speed*.28*e,r.z+=H/V*t.speed*.28*e,t.group.rotation.y=Math.atan2(I,H)),t.type==="moss"&&(h.body.rotation.y=Math.sin(performance.now()*.002+t.home.x)*.2),c<t.aggro&&!s&&(t.state="chase",t.stateTime=0,t.engaged=!0,t.bar.sprite.visible=!0,t.type==="boss"&&((m=(d=this.callbacks).onBossEngage)==null||m.call(d,t)))}else if(t.state==="chase"){t.group.rotation.y=l;const I=t.speed*(t.type==="boss"&&t.phase===2?1.35:1);c>t.attackRange*.85&&(r.x+=Math.sin(l)*I*e,r.z+=Math.cos(l)*I*e,this._collide(t),t.type==="boss"?(h.legs[0].rotation.x=Math.sin(performance.now()*.006)*.28,h.legs[1].rotation.x=-Math.sin(performance.now()*.006)*.28,h.model.position.y=Math.abs(Math.sin(performance.now()*.006))*.1):t.type==="shade"&&(h.body.rotation.z=Math.sin(performance.now()*.006)*.12)),t.cooldown<=0&&c<t.attackRange&&(t.state="windup",t.stateTime=0,t.attackKind=t.type==="boss"?c<4.5?"slam":"cleave":"melee",(p=this.vfx)==null||p.telegraph(new C(r.x,r.y+.05,r.z),t.type==="boss"?5:t.attackRange+.6,t.type==="boss"?16727178:16735346,t.type==="boss"?.85:.42),t.type==="boss"?((x=this.audio)==null||x.bossGrowl(),h.arms[1].arm.rotation.x=-2.6):(v=this.audio)==null||v.enemyWindup())}else if(t.state==="windup"){t.group.rotation.y=l;const I=t.type==="boss"?.85:.42,H=t.stateTime/I;t.type==="boss"?(h.arms[1].arm.rotation.x=-2.6+H*1.2,h.model.rotation.x=-.1*Math.sin(H*Math.PI)):t.type==="moss"?h.body.scale.y=1+Math.sin(H*Math.PI)*.25:h.body.position.y=.65+H*.3,t.stateTime>=I&&(c<t.attackRange+(t.type==="boss"?2:1.1)&&this._damagePlayer(t),t.type==="boss"?((g=this.vfx)==null||g.shockwave(new C(r.x,r.y+.2,r.z),5.4,10181887,.9),(u=this.vfx)==null||u.slash(new C(r.x,r.y+1.4,r.z),t.group.rotation.y,!0,11824127),(A=(S=this.callbacks).onBossSlam)==null||A.call(S,t),h.arms[1].arm.rotation.x=.6):(w=this.vfx)==null||w.slash(new C(r.x,r.y+.8,r.z),t.group.rotation.y,!1,t.type==="shade"?16731517:10354570),(B=this.audio)==null||B.enemyAttack(),t.state="recover",t.stateTime=0,t.cooldown=t.attackCooldown*(.75+Math.random()*.5))}else t.state==="recover"?t.stateTime>.35&&(t.state="chase",t.stateTime=0,t.type==="moss"&&(h.body.scale.y=1)):t.state==="roar"&&t.stateTime>1.2&&(t.state="chase",t.stateTime=0,t.cooldown=.8);t.type==="boss"&&t.phase===1&&t.hp<t.maxHp*.5&&(t.phase=2,t.speed*=1.2,t.attackCooldown*=.75,(N=(D=this.callbacks).onBossPhase)==null||N.call(D,t),(F=this.audio)==null||F.bossRoar(),(T=this.vfx)==null||T.shockwave(new C(r.x,r.y+.3,r.z),8,14126079,1.2),(M=this.vfx)==null||M.hitSpark(new C(r.x,r.y+2.5,r.z),14126079,28),t.group.scale.setScalar(1.1)),t.bar.sprite.visible=t.engaged||t.hp<t.maxHp,t.bar.sprite.visible&&(t.bar.sprite.position.y=t.height+.35)}_collide(t){const e=t.group.position,n=t.inDungeon?this.world.dungeonColliders:this.world.colliders;for(const s of n){const r=e.x-s.x,o=e.z-s.z,a=Math.hypot(r,o),c=s.r+t.radius*.55;a<c&&a>.001&&(e.x=s.x+r/a*c,e.z=s.z+o/a*c)}if(t.inDungeon)e.x=io(e.x,-14.5,14.5),e.z=io(e.z,-246,-199);else{const s=Math.hypot(e.x,e.z);s>94&&(e.x*=94/s,e.z*=94/s)}e.y=t.inDungeon?.3:this.world.heightAt(e.x,e.z)}_setFlash(t,e){t._flashed=e,t.group.traverse(n=>{if(!n.isMesh||!n.material)return;const s=Array.isArray(n.material)?n.material:[n.material];for(const r of s)r.emissive&&(e?(r.userData._origEmissive||(r.userData._origEmissive=r.emissive.getHex(),r.userData._origIntensity=r.emissiveIntensity??1),r.emissive.setHex(16777215),r.emissiveIntensity=1.4):r.userData._origEmissive!==void 0&&(r.emissive.setHex(r.userData._origEmissive),r.emissiveIntensity=r.userData._origIntensity))})}damage(t,e,n,s=2,r=!1,o="sword"){var c,l,h,d,m;if(!t||t.dead||t.invuln>0)return!1;t.hp-=e,t.engaged=!0,t.invuln=.06,t.flash=.13,t._flashed=!1,this._setFlash(t,!0),t.stun=r?.42:.2,t.state="hurt",t.stateTime=0,t.type!=="boss"?(t.kb.set(n.x,0,n.z).normalize().multiplyScalar(s),t.bar.sprite.visible=!0):t.kb.set(n.x,0,n.z).normalize().multiplyScalar(s*.08),Xr(t.bar,Math.max(0,t.hp/t.maxHp),t.type==="boss");const a=new C(t.group.position.x,t.group.position.y+t.height*.6,t.group.position.z);return(c=this.vfx)==null||c.hitSpark(a,r?16765818:12582143,r?22:13),(l=this.vfx)==null||l.damageNumber(a,Math.round(e),r?"gold":"white"),(h=this.audio)==null||h.hit(r),t.type==="boss"&&((m=(d=this.callbacks).onBossDamage)==null||m.call(d,t,e)),t.hp<=0&&this._kill(t),!0}_kill(t){var e,n,s,r,o,a;t.dead=!0,t.hp=0,t.deathTime=0,t.kb.set(0,0,0),(e=this.vfx)==null||e.deathBurst(t.group.position.clone().add(new C(0,t.height*.5,0)),t.type==="boss"?14126079:t.type==="shade"?11824127:10354570),(n=this.audio)==null||n.enemyDeath(t.type==="boss"),t.type==="boss"?(this.bossActive=!1,this.bossDefeated=!0,(r=(s=this.callbacks).onBossDefeated)==null||r.call(s,t)):((a=(o=this.callbacks).onEnemyDeath)==null||a.call(o,t),t.spawn&&(t.spawn.timer=26+Math.random()*8))}enemiesInArc(t,e,n,s){const r=[];for(const o of this.enemies){if(o.dead||o.inDungeon&&this.zone!=="dungeon"||!o.inDungeon&&this.zone!=="island")continue;const a=o.group.position.x-t.x,c=o.group.position.z-t.z;if(Math.hypot(a,c)>n+o.radius)continue;const h=Math.atan2(a,c);let d=Math.abs(h-e);for(;d>Math.PI;)d=Math.abs(d-Math.PI*2);d>s*.5||r.push(o)}return r}enemiesInRadius(t,e){return this.enemies.filter(n=>n.dead||n.inDungeon&&this.zone!=="dungeon"||!n.inDungeon&&this.zone!=="island"?!1:Math.hypot(n.group.position.x-t.x,n.group.position.z-t.z)<e+n.radius)}resetBoss(){if(!this.boss||this.bossDefeated)return;const t=this.boss;t.hp=t.maxHp,t.dead=!1,t.engaged=!1,t.state="idle",t.phase=1,t.group.position.set(0,.3,-232),t.group.scale.setScalar(1.05),t.group.rotation.set(0,0,0),t.bar.sprite.visible=!1,Xr(t.bar,1,!0),this.bossActive=!1}resetMinions(){for(const t of this.enemies)t.type==="boss"||t.dead||(t.hp=t.maxHp,t.state="idle",t.engaged=!1,t.group.position.copy(t.home),t.group.rotation.set(0,0,0),t.bar.sprite.visible=!1,Xr(t.bar,1,!1))}}const Ig=Math.PI*2;function Ug(){const i=document.createElement("canvas");i.width=i.height=128;const t=i.getContext("2d"),e=t.createRadialGradient(64,64,1,64,64,64);return e.addColorStop(0,"rgba(255,255,255,1)"),e.addColorStop(.22,"rgba(210,250,255,.8)"),e.addColorStop(.55,"rgba(125,249,255,.25)"),e.addColorStop(1,"rgba(125,249,255,0)"),t.fillStyle=e,t.fillRect(0,0,128,128),new ns(i)}const wl=Ug(),Ng=new He(.07,0),bl=new On(.8,1,40);class Fg{constructor(t){this.scene=t,this.effects=[],this.projectiles=[],this.time=0}_add(t,e,n){this.scene.add(t);const s={mesh:t,life:e,age:0,update:n};return this.effects.push(s),s}update(t){var e,n,s,r,o,a;this.time+=t;for(let c=this.effects.length-1;c>=0;c--){const l=this.effects[c];l.age+=t;const h=l.age/l.life;if(h>=1){this.scene.remove(l.mesh),(n=(e=l.mesh).traverse)==null||n.call(e,d=>{var m,p,x,v,g,u;d.geometry&&d.geometry!==bl&&d.geometry!==Ng&&((p=(m=d.geometry).dispose)==null||p.call(m)),d.material&&(d.material.map&&d.material.map!==wl&&((v=(x=d.material.map).dispose)==null||v.call(x)),(u=(g=d.material).dispose)==null||u.call(g))}),this.effects.splice(c,1);continue}(s=l.update)==null||s.call(l,h,l,t)}for(let c=this.projectiles.length-1;c>=0;c--){const l=this.projectiles[c];l.age+=t,l.pos.addScaledVector(l.dir,l.speed*t),l.mesh.position.copy(l.pos),l.mesh.rotation.y+=t*6,l.light&&l.light.position.copy(l.pos),l.trailTimer-=t,l.trailTimer<=0&&(l.trailTimer=.035,this.hitSpark(l.pos.clone(),l.color,3,.3,.6)),(((r=l.hitTest)==null?void 0:r.call(l,l.pos))||l.age>l.life||l.pos.y<-1)&&(this.explode(l.pos.clone(),l.color,l.onExplode),this.scene.remove(l.mesh),l.light&&this.scene.remove(l.light),(a=(o=l.mesh).traverse)==null||a.call(o,d=>{var m,p;(p=(m=d.material)==null?void 0:m.dispose)==null||p.call(m)}),this.projectiles.splice(c,1))}}slash(t,e,n=!1,s=8255999){const r=new kt;r.position.copy(t),r.rotation.y=e;const o=new re({color:s,transparent:!0,opacity:n?.95:.8,side:le,blending:ge,depthWrite:!1}),a=new K(new On(.7,1.75,26,1,Math.PI/2-1,2),o);if(a.rotation.x=Math.PI/2,r.add(a),n){const c=new K(new On(1.15,2.2,26,1,Math.PI/2-1.2,2.4),o.clone());c.material.opacity=.45,c.rotation.x=Math.PI/2,c.rotation.z=.1,r.add(c)}this._add(r,n?.38:.26,(c,l)=>{const h=.75+c*(n?.9:.65);r.scale.set(h,h,h),r.rotation.y=e+(n?0:(c-.5)*.4),r.position.y=t.y+Math.sin(c*Math.PI)*.06,r.traverse(d=>{d.material&&d.material.opacity!==void 0&&(d.material.opacity=(n?.95:.8)*(1-c)**1.4)})})}hitSpark(t,e=16777215,n=12,s=1,r=.55){const o=new qe,a=new Float32Array(n*3),c=[];for(let m=0;m<n;m++){a[m*3]=t.x,a[m*3+1]=t.y,a[m*3+2]=t.z;const p=Math.random()*Ig,x=Math.random()*Math.PI-Math.PI/2,v=(1.5+Math.random()*4)*s;c.push(new C(Math.cos(p)*Math.cos(x)*v,Math.sin(x)*v+1,Math.sin(p)*Math.cos(x)*v))}o.setAttribute("position",new un(a,3));const l=new eo({color:e,size:.12*s,transparent:!0,opacity:1,blending:ge,depthWrite:!1}),h=new ka(o,l),d=t.clone();this._add(h,r,m=>{const p=o.attributes.position.array;for(let x=0;x<n;x++){const v=c[x];p[x*3]=d.x+v.x*m*r,p[x*3+1]=d.y+(v.y-3.5*m*r)*m*r,p[x*3+2]=d.z+v.z*m*r}o.attributes.position.needsUpdate=!0,l.opacity=1-m,l.size=.12*s*(1-m*.5)})}shockwave(t,e=4,n=8255999,s=.7){const r=new re({color:n,transparent:!0,opacity:.75,side:le,blending:ge,depthWrite:!1}),o=new K(bl,r);o.rotation.x=-Math.PI/2,o.position.copy(t),o.position.y+=.08,this._add(o,s,l=>{const h=.3+l*e;o.scale.set(h,h,h),r.opacity=.75*(1-l)**1.5});const a=new re({color:n,transparent:!0,opacity:.25,side:le,blending:ge,depthWrite:!1}),c=new K(new Jt(.5,1.2,3,12,1,!0),a);c.position.copy(t),c.position.y+=1.5,this._add(c,s*.7,l=>{c.scale.set(1+l*e*.35,1,1+l*e*.35),a.opacity=.25*(1-l)})}telegraph(t,e,n=16729704,s=.5){const r=new re({color:n,transparent:!0,opacity:.55,side:le,depthWrite:!1,blending:ge}),o=new K(new On(.72,1,40),r);o.rotation.x=-Math.PI/2,o.position.copy(t),o.position.y+=.04,this._add(o,s,l=>{const h=e*(.3+l*.7);o.scale.set(h,h,h),r.opacity=.25+Math.sin(l*Math.PI*5)*.2+l*.15});const a=new re({color:n,transparent:!0,opacity:.12,side:le,depthWrite:!1}),c=new K(new ci(1,32),a);c.rotation.x=-Math.PI/2,c.position.copy(t),c.position.y+=.03,this._add(c,s,l=>{const h=e*l;c.scale.set(h,h,h),a.opacity=.16*(1-l)})}damageNumber(t,e,n="white"){const s=n==="gold"?"#ffd37a":n==="heal"?"#9dffcf":"#e9fbff",r=document.createElement("canvas");r.width=160,r.height=80;const o=r.getContext("2d");o.font='bold 54px "Trebuchet MS", sans-serif',o.textAlign="center",o.textBaseline="middle",o.lineWidth=7,o.strokeStyle="rgba(4,8,20,.85)",o.strokeText(String(e),80,42),o.fillStyle=s,o.shadowColor=s,o.shadowBlur=14,o.fillText(String(e),80,42);const a=new ns(r);a.colorSpace=ln;const c=new je({map:a,transparent:!0,depthWrite:!1,depthTest:!1}),l=new en(c);l.position.copy(t),l.position.y+=.7,l.scale.set(1.2,.6,1),l.renderOrder=20;const h=l.position.clone();this._add(l,.85,d=>{l.position.y=h.y+d*1.1,l.position.x=h.x+Math.sin(d*8)*.08,l.material.opacity=1-d*d;const m=1.2*(.7+Math.min(.5,d*2));l.scale.set(m,m*.5,1)})}deathBurst(t,e=10354570){this.shockwave(t,2.4,e,.6),this.hitSpark(t,e,26,1.4,.9);const n=new re({color:e,transparent:!0,opacity:.8,blending:ge,depthWrite:!1}),s=new K(new He(.2,0),n);s.position.copy(t),this._add(s,.9,r=>{s.position.y=t.y+r*2.2,s.scale.setScalar(1+r*.8),n.opacity=.8*(1-r)})}pickupBurst(t,e=16765818){this.hitSpark(t,e,12,.8,.6)}heal(t){this.shockwave(t,2.2,10354639,.8),this.hitSpark(t.clone().add(new C(0,.8,0)),10354639,18,.9,.9)}levelUp(t){this.shockwave(t,4.5,16765818,1),this.hitSpark(t.clone().add(new C(0,1,0)),16770985,34,1.4,1.2);const e=new re({color:16765818,transparent:!0,opacity:.8,side:le,blending:ge,depthWrite:!1}),n=new K(new Jt(1,1,.1,32,1,!0),e);n.position.copy(t),n.position.y+=.4,this._add(n,1,s=>{n.position.y=t.y+.3+s*2.4,n.scale.set(1+s*.8,1,1+s*.8),e.opacity=.8*(1-s)})}magicBolt(t,e,n,s,r=8255999){const o=new kt,a=new K(new Zi(.22,1),new re({color:16777215}));o.add(a);const c=new en(new je({map:wl,color:r,transparent:!0,opacity:.95,blending:ge,depthWrite:!1}));c.scale.set(1.8,1.8,1),o.add(c);const l=new K(new li(.38,.035,6,18),new re({color:r,transparent:!0,opacity:.9,blending:ge,depthWrite:!1}));l.rotation.x=Math.PI/2,o.add(l);const h=new kn(r,18,12,2);o.position.copy(t),h.position.copy(t),this.scene.add(o),this.scene.add(h),this.projectiles.push({mesh:o,light:h,pos:t.clone(),dir:e.clone().normalize(),speed:23,age:0,life:1.6,trailTimer:0,color:r,hitTest:n,onExplode:s})}explode(t,e=8255999,n){this.shockwave(t,5,e,.8),this.hitSpark(t,e,34,1.6,.9);const s=new kn(e,35,16,2);s.position.copy(t),this.scene.add(s);const r=new re({color:e,transparent:!0,opacity:1,blending:ge,depthWrite:!1}),o=new K(new Zi(.5,1),r);o.position.copy(t),this._add(o,.5,a=>{o.scale.setScalar(1+a*9),r.opacity=1-a,s.intensity=35*(1-a),a>.9&&this.scene.remove(s)}),n==null||n(t)}swordTrail(t,e,n=8255999){const s=new re({color:n,transparent:!0,opacity:.5,side:le,blending:ge,depthWrite:!1}),r=new K(new On(.9,1.45,18,1,Math.PI/2-.65,1.3),s);r.rotation.x=Math.PI/2,r.rotation.y=e,r.position.copy(t),r.position.y+=1.05,this._add(r,.18,o=>{s.opacity=.5*(1-o),r.scale.setScalar(1+o*.4)})}}class Og{constructor(){this.ctx=null,this.master=null,this.musicGain=null,this.sfxGain=null,this.noiseBuffer=null,this.muted=!1,this.mood="island",this.nextChord=0,this.nextArp=0,this.nextBass=0,this.chordIndex=0,this.arpIndex=0,this.ready=!1,this.timer=0,this.combatHeat=0}init(){if(this.ready)return;const t=window.AudioContext||window.webkitAudioContext;if(!t)return;this.ctx=new t,this.master=this.ctx.createGain(),this.master.gain.value=this.muted?0:.7,this.master.connect(this.ctx.destination),this.musicGain=this.ctx.createGain(),this.musicGain.gain.value=.16;const e=this.ctx.createBiquadFilter();e.type="lowpass",e.frequency.value=5200,this.musicGain.connect(e),e.connect(this.master),this.sfxGain=this.ctx.createGain(),this.sfxGain.gain.value=.32,this.sfxGain.connect(this.master),this.delay=this.ctx.createDelay(1.2),this.delay.delayTime.value=.34,this.delayFeedback=this.ctx.createGain(),this.delayFeedback.gain.value=.28,this.delayWet=this.ctx.createGain(),this.delayWet.gain.value=.3,this.delay.connect(this.delayFeedback),this.delayFeedback.connect(this.delay),this.delay.connect(this.delayWet),this.delayWet.connect(this.musicGain);const n=this.ctx.sampleRate*1.2;this.noiseBuffer=this.ctx.createBuffer(1,n,this.ctx.sampleRate);const s=this.noiseBuffer.getChannelData(0);for(let r=0;r<n;r++)s[r]=Math.random()*2-1;this.nextChord=this.ctx.currentTime+.2,this.nextArp=this.ctx.currentTime+1.2,this.nextBass=this.ctx.currentTime+.2,this.ready=!0}resume(){var t;this.ctx||this.init(),((t=this.ctx)==null?void 0:t.state)==="suspended"&&this.ctx.resume()}setMuted(t){this.muted=t,this.master&&this.master.gain.setTargetAtTime(t?0:.7,this.ctx.currentTime,.05)}setMood(t){this.mood!==t&&(this.mood=t,this.chordIndex=0,this.nextChord=this.ctx?this.ctx.currentTime+.1:0,this.nextArp=this.ctx?this.ctx.currentTime+.8:0)}_note(t,e,n="sine",s=.1,r=0,o=null,a=.03,c=.3,l=0){if(!this.ready)return;const h=r||this.ctx.currentTime,d=this.ctx.createOscillator(),m=this.ctx.createGain();return d.type=n,d.frequency.value=t,d.detune.value=l,m.gain.setValueAtTime(1e-4,h),m.gain.exponentialRampToValueAtTime(Math.max(2e-4,s),h+a),m.gain.exponentialRampToValueAtTime(1e-4,h+Math.max(a+.05,e)),d.connect(m),m.connect(o||this.musicGain),d.start(h),d.stop(h+e+.08),m}_noise(t,e=.2,n=0,s=1800,r=1,o="bandpass"){if(!this.ready)return;const a=n||this.ctx.currentTime,c=this.ctx.createBufferSource();c.buffer=this.noiseBuffer;const l=this.ctx.createBiquadFilter();l.type=o,l.frequency.value=s,l.Q.value=r;const h=this.ctx.createGain();h.gain.setValueAtTime(e,a),h.gain.exponentialRampToValueAtTime(1e-4,a+t),c.connect(l),l.connect(h),h.connect(this.sfxGain),c.start(a),c.stop(a+t+.02)}update(t){if(!this.ready)return;this.timer+=t;const e=this.ctx.currentTime,n=this.mood==="boss",s=this.mood==="dungeon";if(e>=this.nextChord){const a=n||s?[[110,164.81,220,261.63],[98,146.83,196,233.08],[87.31,130.81,174.61,220],[103.83,155.56,207.65,246.94]]:[[146.83,220,293.66,369.99],[130.81,196,261.63,329.63],[174.61,261.63,349.23,440],[164.81,246.94,329.63,415.3]],c=a[this.chordIndex%a.length];this.chordIndex++;const l=n?3.2:4.4;c.forEach((h,d)=>{this._note(h,l,d===0?"triangle":"sine",d===0?.055:.035,e,null,.8,l*.8,d%2?3:-3)}),this._note(c[2]*2,l*.9,"sine",.018,e+.2,null,1.2,l),this.nextChord=e+l}if(e>=this.nextArp){const r=n?[220,261.63,311.13,369.99,440,523.25]:[293.66,369.99,440,523.25,587.33,739.99,880],o=r[(this.arpIndex*3+this.chordIndex)%r.length],a=this._note(o,n?.5:.9,"sine",n?.035:.045,e,null,.005,n?.4:.8);a&&a.connect(this.delay),this.arpIndex++,this.nextArp=e+(n?.46:s?1.1:.72)}if(e>=this.nextBass){const r=n?55:73.42;this._note(r,n?.55:1.6,n?"sawtooth":"triangle",n?.03:.045,e,null,.02,n?.5:1.4),this.nextBass=e+(n?.75:2.8)}this.timer>7&&(this.timer=0,this._noise(s||n?3.2:4.5,.012,e,s?260:900,.6,"lowpass"))}swing(t=!1){if(!this.ready)return;this._noise(t?.32:.18,t?.25:.16,0,t?700:1400,1.4);const e=t?180:320,n=this.ctx.currentTime,s=this.ctx.createOscillator(),r=this.ctx.createGain();s.type="triangle",s.frequency.setValueAtTime(e,n),s.frequency.exponentialRampToValueAtTime(e*.5,n+.2),r.gain.setValueAtTime(.08,n),r.gain.exponentialRampToValueAtTime(.001,n+.22),s.connect(r),r.connect(this.sfxGain),s.start(n),s.stop(n+.25)}hit(t=!1){if(!this.ready)return;this._noise(t?.16:.09,t?.3:.2,0,t?500:1100,.9);const e=this.ctx.currentTime,n=this.ctx.createOscillator(),s=this.ctx.createGain();n.type="sine",n.frequency.setValueAtTime(t?120:200,e),n.frequency.exponentialRampToValueAtTime(55,e+.16),s.gain.setValueAtTime(t?.24:.15,e),s.gain.exponentialRampToValueAtTime(.001,e+.18),n.connect(s),s.connect(this.sfxGain),n.start(e),n.stop(e+.2)}enemyWindup(){this._noise(.14,.06,0,420,2.5)}enemyAttack(){this._noise(.14,.12,0,900,1.2)}enemyDeath(t=!1){var r;this._noise(t?1.4:.4,t?.3:.14,0,t?200:600,.7,"lowpass");const e=(r=this.ctx)==null?void 0:r.currentTime;if(!e)return;const n=this.ctx.createOscillator(),s=this.ctx.createGain();n.type="sine",n.frequency.setValueAtTime(t?90:260,e),n.frequency.exponentialRampToValueAtTime(t?35:90,e+(t?1.2:.3)),s.gain.setValueAtTime(.18,e),s.gain.exponentialRampToValueAtTime(.001,e+(t?1.3:.35)),n.connect(s),s.connect(this.sfxGain),n.start(e),n.stop(e+(t?1.4:.4))}magic(){if(!this.ready)return;const t=this.ctx.currentTime;for(let e=0;e<3;e++){const n=this.ctx.createOscillator(),s=this.ctx.createGain();n.type="sine",n.frequency.setValueAtTime(240+e*80,t),n.frequency.exponentialRampToValueAtTime(960+e*240,t+.5),s.gain.setValueAtTime(1e-4,t),s.gain.exponentialRampToValueAtTime(.07,t+.08),s.gain.exponentialRampToValueAtTime(.001,t+.7),n.connect(s),s.connect(this.sfxGain),n.start(t),n.stop(t+.75)}this._noise(.5,.12,0,2600,.8)}pickup(){if(!this.ready)return;const t=this.ctx.currentTime;[880,1174.66,1567.98].forEach((e,n)=>{this._note(e,.35,"sine",.09,t+n*.06,this.sfxGain,.005,.3)})}coin(){if(!this.ready)return;const t=this.ctx.currentTime;this._note(1318.5,.12,"triangle",.05,t,this.sfxGain,.005,.1),this._note(1760,.18,"triangle",.04,t+.05,this.sfxGain,.005,.14)}chest(){if(!this.ready)return;this._noise(.3,.16,0,500,.8);const t=this.ctx.currentTime;[392,523.25,659.25,783.99].forEach((e,n)=>this._note(e,.5,"sine",.08,t+.08+n*.08,this.sfxGain,.01,.4))}quest(){if(!this.ready)return;const t=this.ctx.currentTime;[523.25,659.25,783.99,1046.5].forEach((e,n)=>this._note(e,.7,"triangle",.1,t+n*.12,this.sfxGain,.01,.55))}levelUp(){if(!this.ready)return;const t=this.ctx.currentTime;[392,523.25,659.25,783.99,1046.5].forEach((e,n)=>{this._note(e,.9,"sine",.1,t+n*.09,this.sfxGain,.01,.8),this._note(e*2,.6,"sine",.03,t+n*.09,this.sfxGain,.01,.5)})}jump(){this._noise(.16,.08,0,1200,1.5)}dodge(){this._noise(.24,.12,0,700,1.2)}hurt(){this.ready&&(this._noise(.24,.22,0,500,.7,"lowpass"),this._note(120,.3,"sawtooth",.08,0,this.sfxGain,.005,.25))}heal(){if(!this.ready)return;const t=this.ctx.currentTime;[523.25,659.25,880].forEach((e,n)=>this._note(e,.6,"sine",.07,t+n*.1,this.sfxGain,.02,.5))}checkpoint(){if(!this.ready)return;const t=this.ctx.currentTime;[440,554.37,659.25,880].forEach((e,n)=>this._note(e,1.1,"sine",.08,t+n*.14,this.sfxGain,.02,.9))}click(){this.ready&&this._note(620,.09,"triangle",.06,0,this.sfxGain,.003,.07)}bossRoar(){if(!this.ready)return;const t=this.ctx.currentTime;this._noise(1.6,.4,t,180,.8,"lowpass"),[55,73.42,110].forEach((e,n)=>{const s=this.ctx.createOscillator(),r=this.ctx.createGain();s.type="sawtooth",s.frequency.setValueAtTime(e,t),s.frequency.exponentialRampToValueAtTime(e*.7,t+1.4),r.gain.setValueAtTime(1e-4,t),r.gain.exponentialRampToValueAtTime(.09,t+.2),r.gain.exponentialRampToValueAtTime(.001,t+1.5),s.connect(r),r.connect(this.sfxGain),s.start(t),s.stop(t+1.6)})}bossGrowl(){this.ready&&(this._noise(.5,.16,0,220,1,"lowpass"),this._note(82,.45,"sawtooth",.06,0,this.sfxGain,.02,.4))}victory(){if(!this.ready)return;const t=this.ctx.currentTime;[392,523.25,659.25,783.99,1046.5,1318.5].forEach((e,n)=>{this._note(e,1.8,"triangle",.1,t+n*.16,this.sfxGain,.02,1.5),this._note(e*.5,1.8,"sine",.05,t+n*.16,this.sfxGain,.05,1.4)})}}const Rt=i=>document.getElementById(i),Xn=Rt("game-canvas"),zg=Rt("title-screen"),Bg=Rt("hud"),yh=Rt("loading"),pr=Rt("pause-menu"),Mh=Rt("gameover"),Sh=Rt("victory"),wh=Rt("dialogue"),mr=Rt("controls-modal"),qi=Rt("interact-prompt"),kg=Rt("interact-text"),El=Rt("fade"),bh=Rt("mobile-controls"),Ga=Rt("mobile-sprint"),Zo=Rt("toasts"),Tl=Rt("damage-flash"),Ji=Rt("boss-panel"),Eh=Rt("boss-fill"),Va=Rt("boss-phase"),Al=Rt("boss-sub"),Cl=Rt("compass"),Hg=Rt("compass-arrow"),Gg=Rt("compass-label"),Vg=Rt("compass-dist"),Wa=Rt("minimap"),et=Wa.getContext("2d"),Yn=new W0({canvas:Xn,antialias:!0,powerPreference:"high-performance"});Yn.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));Yn.setSize(window.innerWidth,window.innerHeight);Yn.outputColorSpace=ln;Yn.toneMapping=Nl;Yn.toneMappingExposure=1.04;Yn.shadowMap.enabled=!0;Yn.shadowMap.type=Il;const Ke=new X0;Ke.background=new Ht(12578815);Ke.fog=new ic(13625583,80,300);const sn=new Sn(56,window.innerWidth/window.innerHeight,.1,700);sn.position.set(0,24,62);const ji=new cg(14217983,6126146,1.25);Ke.add(ji);const Qi=new dg(10471679,.18);Ke.add(Qi);const ke=new _h(16773583,2.15);ke.position.set(58,92,46);ke.castShadow=!0;ke.shadow.mapSize.set(2048,2048);ke.shadow.camera.left=-82;ke.shadow.camera.right=82;ke.shadow.camera.top=82;ke.shadow.camera.bottom=-82;ke.shadow.camera.near=1;ke.shadow.camera.far=240;ke.shadow.bias=-25e-5;ke.shadow.normalBias=.035;ke.target.position.set(0,0,0);Ke.add(ke);Ke.add(ke.target);const Ci=new _h(10475263,.35);Ci.position.set(-50,35,-30);Ke.add(Ci);const Pt=bg(Ke),Pe=new Fg(Ke),Xt=new Og,Th=new C(0,Pt.heightAt(0,44),44),y={pos:Th.clone(),vel:new C,yaw:Math.PI,vy:0,grounded:!0,hp:100,maxHp:100,mana:100,maxMana:100,level:1,xp:0,xpNext:120,coins:0,crystals:0,weaponLevel:0,attack:null,lastCombo:-1,comboTimer:0,dodgeTimer:0,dodgeCd:0,dodgeDir:new C,invuln:0,hurtTimer:0,lastDamage:99,magicTimer:0,magicCd:0,magicDelay:0,magicDir:new C(0,0,-1),dead:!1,jumpRequested:!1,enemiesDefeated:0,bossesDefeated:0},Ee=mg();Ke.add(Ee.root);Ee.root.position.copy(y.pos);Ee.root.rotation.y=y.yaw;const or=[],Wg=new Jt(.16,.16,.055,12),Xg=new an({color:16765818,emissive:16753434,emissiveIntensity:.75}),Z={mode:"title",started:!1,zone:"island",playTime:0,titleTime:0,hudTimer:0,minimapTimer:0,shake:0,hitStop:0,hintTimer:0,victoryTimer:0,pendingVictory:!1,respawn:{pos:new C(6.2,Pt.heightAt(6.2,31.5),31.5),zone:"island",name:"Dawn Shrine"},respawnIsland:{pos:new C(6.2,Pt.heightAt(6.2,31.5),31.5),zone:"island",name:"Dawn Shrine"},controlsReturn:"title",currentInteract:null,coinSoundCooldown:0},Xe=[{id:"crystals",title:"Shards of Dawn",giver:"Elder Mira",state:"active",progress:0,target:5,reward:{coins:120,xp:260},objective:"Collect 5 dawn crystals",hint:"Speak with Elder Mira"},{id:"beasts",title:"Beasts of the Vale",giver:"Rook",state:"locked",progress:0,target:6,reward:{coins:180,xp:340},objective:"Defeat 6 beasts of the isle",hint:"Speak with Rook at the forge"},{id:"king",title:"The Hollow King",giver:"Kael",state:"locked",stage:0,progress:0,target:3,reward:{coins:500,xp:1e3},objective:"Light the Dawn Shrine at the temple",hint:"Speak with Kael in the forest"}],qt=new Dg(Ke,Pt,Pe,Xt,{getZone:()=>Z.zone,onPlayerHit:(i,t)=>tx(i,t),onEnemyDeath:i=>{y.enemiesDefeated++,zs(i.xp),Kg(i.group.position.clone(),i.coins,i.type==="shade"?5:4);const t=Xe.find(e=>e.id==="beasts");t.state==="active"&&(t.progress=Math.min(t.target,t.progress+1),t.progress>=t.target?so(t):bn())},onBossStart:i=>{Pt.bossActive=!0,Pt.fogWall.visible=!0,Ji.classList.remove("hidden"),Va.textContent="I",Al.textContent="Ancient sovereign of the deep",Eh.style.width="100%",Xt.setMood("boss"),Z.shake=.65,Te("THE HOLLOW KING AWAKENS","purple","☠",5e3);const t=Xe.find(e=>e.id==="king");t.state==="active"&&t.stage<2&&(t.stage=2,t.objective="Defeat the Hollow King",bn()),fo()},onBossDamage:()=>{Fh()},onBossPhase:()=>{Va.textContent="II",Al.textContent="The seal is breaking — fury unbound",Te("The Hollow King enters his second phase","purple","☠",3800),Z.shake=.7},onBossSlam:()=>{Z.shake=Math.max(Z.shake,.5)},onBossDefeated:()=>{Pt.bossActive=!1,Pt.bossDefeated=!0,Pt.fogWall.visible=!1,Ji.classList.add("hidden"),y.bossesDefeated++;const i=Xe.find(t=>t.id==="king");i.state==="active"?so(i,!0):i.state!=="done"&&(i.state="done",i.progress=i.target,bn(),dr()),zs(700),Vs(300),Xt.setMood("dungeon"),Z.pendingVictory=!0,Z.victoryTimer=3,Te("The Hollow King falls. The seal breaks.","gold","✦",4200),dr()}}),wn=new Set,hn={x:0,y:0,active:!1,pointerId:null};let De=0,gn=.24,Ln=7.8,hi=!0,Yi=!1,Os=!1,cn=null,Rl=0,Ah=!0;const Pl={light:[{damage:16,duration:.44,hitTime:.14,range:2.9,arc:2,knockback:2.4,lunge:1.2,heavy:!1},{damage:18,duration:.44,hitTime:.14,range:3,arc:2.1,knockback:2.6,lunge:1.2,heavy:!1},{damage:26,duration:.56,hitTime:.2,range:3.3,arc:2.5,knockback:4.2,lunge:1.8,heavy:!1}],heavy:{damage:36,duration:.78,hitTime:.4,range:3.3,arc:2.2,knockback:6.5,lunge:2.4,heavy:!0}},Be=(i,t,e)=>Math.max(t,Math.min(e,i)),qg=(i,t,e)=>i+(t-i)*e;function Ll(i,t,e,n){return qg(i,t,1-Math.exp(-e*n))}function Yg(i,t,e,n){let s=t-i;for(;s>Math.PI;)s-=Math.PI*2;for(;s<-Math.PI;)s+=Math.PI*2;return i+s*(1-Math.exp(-14*n))}function uo(i){return new C(Math.sin(i),0,Math.cos(i))}function Ch(){return(1+.08*(y.level-1))*(1+.22*y.weaponLevel)}function Te(i,t="",e="✦",n=3200){const s=document.createElement("div");s.className=`toast ${t}`;const r=document.createElement("span");r.className="t-ico",r.textContent=e;const o=document.createElement("span");for(o.textContent=i,s.append(r,o),Zo.appendChild(s);Zo.children.length>4;)Zo.firstChild.remove();setTimeout(()=>{s.classList.add("out"),setTimeout(()=>s.remove(),380)},n)}function $g(){Tl.classList.add("on"),setTimeout(()=>Tl.classList.remove("on"),130)}function ac(i){El.classList.add("on"),setTimeout(()=>{i(),setTimeout(()=>El.classList.remove("on"),90)},380)}function Xa(){const i=y.level;return i>=7?"Star Sovereign":i>=5?"Dawnblade":i>=3?"Starwarden":"Wanderer"}function zs(i){y.xp+=i;let t=!1;for(;y.xp>=y.xpNext;)y.xp-=y.xpNext,y.level++,y.xpNext=Math.round(y.xpNext*1.48+45),y.maxHp+=18,y.hp=y.maxHp,y.maxMana+=5,y.mana=y.maxMana,t=!0;t&&(Xt.levelUp(),Pe.levelUp(y.pos.clone()),Te(`LEVEL ${y.level} — ${Xa()}`,"gold","✦",4200),Rt("hero-title").textContent=Xa()),Oe(0)}function Vs(i){y.coins+=i,Oe(0)}function Kg(i,t,e=5){const n=Math.max(1,Math.round(t/e));for(let s=0;s<e;s++){const r=new K(Wg,Xg);r.castShadow=!0;const o=Math.random()*Math.PI*2,a=1.5+Math.random()*2.4,c=i.clone();c.y+=.5,r.position.copy(c),Ke.add(r),or.push({mesh:r,value:n,age:0,vel:new C(Math.cos(o)*a,3+Math.random()*2,Math.sin(o)*a),ground:Z.zone==="dungeon"?.3:Pt.heightAt(c.x,c.z)})}}function Zg(i){Z.coinSoundCooldown=Math.max(0,Z.coinSoundCooldown-i);for(let t=or.length-1;t>=0;t--){const e=or[t];e.age+=i;const n=y.pos.clone().add(new C(0,.7,0)),s=e.mesh.position.distanceTo(n);if(e.age>.25&&s<7){const r=n.sub(e.mesh.position).normalize();e.vel.lerp(r.multiplyScalar(11+(7-s)*2.5),Math.min(1,i*7))}else e.vel.y-=18*i,e.mesh.position.y<e.ground+.15&&(e.mesh.position.y=e.ground+.15,e.vel.y*=-.35,e.vel.x*=.82,e.vel.z*=.82);e.mesh.position.addScaledVector(e.vel,i),e.mesh.rotation.y+=i*7,e.mesh.rotation.z=Math.PI/2,e.age>.25&&s<.85?(Vs(e.value),Z.coinSoundCooldown<=0&&(Xt.coin(),Z.coinSoundCooldown=.08),Pe.pickupBurst(e.mesh.position.clone(),16765818),Ke.remove(e.mesh),or.splice(t,1)):e.age>25&&(Ke.remove(e.mesh),or.splice(t,1))}}function bn(){const i=Rt("quest-list");i.innerHTML="";for(const t of Xe){const e=document.createElement("div");e.className=`quest-item ${t.state==="active"?"active":t.state==="done"?"done":"locked"}`;const n=document.createElement("div");n.className="quest-title";const s=document.createElement("span");s.textContent=t.title;const r=document.createElement("small");r.textContent=t.state==="done"?"COMPLETE":t.state==="active"?"ACTIVE":"LOCKED",n.append(s,r);const o=document.createElement("div");if(o.className="quest-obj",t.state==="done"?o.textContent="Quest complete · reward claimed":t.state==="active"?t.id==="king"?o.textContent=t.objective:o.textContent=`${t.objective} · ${t.progress}/${t.target}`:o.textContent=t.hint,e.append(n,o),t.state==="active"&&t.id!=="king"){const a=document.createElement("div");a.className="quest-progress";const c=document.createElement("i");c.style.width=`${Math.min(100,t.progress/t.target*100)}%`,a.appendChild(c),e.appendChild(a)}i.appendChild(e)}Ah=!1,dr(),fo()}function dr(){const i=Xe[0],t=Xe[1],e=Xe[2];for(const n of Pt.npcs)n.marker&&(n.id==="mira"&&(n.marker.visible=i.state==="active"),n.id==="rook"&&(n.marker.visible=t.state!=="done"),n.id==="kael"&&(n.marker.visible=i.state==="done"&&e.state!=="done"))}function so(i,t=!1){i.state!=="done"&&(i.state="done",i.progress=i.target,Vs(i.reward.coins),zs(i.reward.xp),t||(Te(`QUEST COMPLETE · ${i.title}`,"gold","✦",4600),Te(`Reward: ${i.reward.coins} coins · ${i.reward.xp} XP`,"gold","◈",4e3),Xt.quest()),bn(),dr())}function Jg(){const i=Xe[0];i.state==="active"&&(i.progress=Math.min(i.target,i.progress+1),i.progress>=i.target?so(i):bn())}function Rh(i,t){const e=Xe[2];e.state==="active"&&i>e.stage&&(e.stage=i,e.objective=t,bn(),i===1&&Te("New objective: Enter the Shadow Gate","purple","◈",3800),i===2&&Te("New objective: Defeat the Hollow King","purple","☠",3800))}function cc(i){let t=null,e=i;for(const n of qt.enemies){if(n.dead||n.inDungeon&&Z.zone!=="dungeon"||!n.inDungeon&&Z.zone!=="island")continue;const s=Math.hypot(n.group.position.x-y.pos.x,n.group.position.z-y.pos.z);s<e&&(e=s,t=n)}return t}function Ri(i="light",t=null){var o;if(Z.mode!=="playing"||y.dead||y.dodgeTimer>0)return;if(y.attack){i==="light"&&y.attack.type==="light"&&y.attack.comboIndex<2&&!y.attack.queued&&(y.attack.queued=!0,y.attack.queueAt=y.attack.time);return}let e=0;t!==null?e=t:i==="light"&&y.comboTimer>0&&(e=(y.lastCombo+1)%3);const n=i==="heavy"?Pl.heavy:Pl.light[e];y.attack={type:i,comboIndex:e,def:n,time:0,hitDone:!1,queued:!1,queueAt:0},y.comboTimer=0;const s=cc(4.6);s&&!((o=y.attack)!=null&&o.moving)&&(y.yaw=Math.atan2(s.group.position.x-y.pos.x,s.group.position.z-y.pos.z));const r=uo(y.yaw);y.vel.addScaledVector(r,n.lunge),Xt.swing(i==="heavy"),Pe.slash(y.pos.clone().add(new C(0,1,0)).addScaledVector(r,.55),y.yaw,i==="heavy",i==="heavy"?16765818:10484991),i==="heavy"&&(Z.shake=Math.max(Z.shake,.18)),Oe(0)}function jg(i){const t=i.def,e=t.damage*Ch(),n=qt.enemiesInArc(y.pos,y.yaw,t.range,t.arc);let s=!1;for(const o of n){const a=new C(o.group.position.x-y.pos.x,0,o.group.position.z-y.pos.z).normalize();qt.damage(o,e,a,t.knockback,t.heavy,"sword")&&(s=!0,y.mana=Math.min(y.maxMana,y.mana+5))}s&&(Z.hitStop=.04,Z.shake=Math.max(Z.shake,t.heavy?.42:.2));const r=uo(y.yaw);Pe.slash(y.pos.clone().add(new C(0,t.heavy?1.2:1,0)).addScaledVector(r,.75),y.yaw+(i.comboIndex===2?.3:0),t.heavy,t.heavy?16765818:10484991)}function lc(){if(Z.mode!=="playing"||y.dead||y.magicCd>0)return;if(y.mana<40){y.magicCd=.5,Te("Not enough starlight","","✦",1400);return}y.mana-=40,y.magicCd=1.1,y.magicTimer=.9,y.magicDelay=.24;const i=cc(7);i&&(y.yaw=Math.atan2(i.group.position.x-y.pos.x,i.group.position.z-y.pos.z)),y.magicDir=uo(y.yaw),Ee.setState("magic"),Xt.magic(),Pe.shockwave(y.pos.clone(),1.4,8255999,.5),Z.shake=Math.max(Z.shake,.12),Oe(0)}function Qg(){const i=y.pos.clone().add(new C(0,1.25,0)).addScaledVector(y.magicDir,.9);Pe.magicBolt(i,y.magicDir,t=>qt.enemiesInRadius(t,1.15).length>0,t=>{const e=qt.enemiesInRadius(t,4.4),n=52*Ch();for(const s of e){const r=new C(s.group.position.x-t.x,0,s.group.position.z-t.z).normalize();qt.damage(s,n,r,4,!0,"magic")}Z.shake=.55,Z.hitStop=.06},8255999)}function tx(i,t){if(y.invuln>0||y.dead||Z.mode!=="playing")return;y.hp=Math.max(0,y.hp-i),y.invuln=.85,y.hurtTimer=.35,y.lastDamage=0;const e=y.pos.clone().sub(t).setY(0);e.lengthSq()>.001&&y.vel.addScaledVector(e.normalize(),4.8),Ee.setState("hurt"),Xt.hurt(),Pe.damageNumber(y.pos.clone().add(new C(0,1.8,0)),i,"white"),$g(),Z.shake=Math.max(Z.shake,.5),Oe(0),y.hp<=0&&Ph()}function Ph(){y.dead||(y.dead=!0,Ee.setState("dead"),Xt.enemyDeath(!0),Z.mode="dying",qi.classList.add("hidden"),setTimeout(()=>{Z.mode==="dying"&&(Z.mode="gameover",Mh.classList.remove("hidden"))},1350))}function ex(){Mh.classList.add("hidden"),ac(()=>{const i=Z.respawn;Z.zone=i.zone,Pt.setZone(i.zone,Ke),i.zone==="dungeon"?(qt.resetBoss(),Pt.fogWall.visible=!1,Pt.bossActive=!1,Ji.classList.add("hidden"),Xt.setMood("dungeon"),ji.intensity=.3,ke.intensity=.4,Qi.intensity=.05,Ci.intensity=.08):(qt.resetMinions(),Xt.setMood("island"),ji.intensity=1.25,ke.intensity=2.15,Qi.intensity=.18,Ci.intensity=.35),qt.resetBoss(),y.pos.copy(i.pos),y.vel.set(0,0,0),y.vy=0,y.hp=y.maxHp,y.mana=y.maxMana,y.dead=!1,y.invuln=1.6,y.attack=null,y.dodgeTimer=0,y.magicTimer=0,y.yaw=(i.zone==="dungeon",Math.PI),De=0,gn=.24,Ln=7.8,hi=!0,Ee.root.position.copy(y.pos),Ee.setState("idle"),Z.mode="playing",Te(`Revived at ${i.name}`,"gold","✦",3200),Oe(0)})}function nx(){return Z.zone==="dungeon"?.3:Pt.heightAt(y.pos.x,y.pos.z)}function ix(){const i=Z.zone==="dungeon"?Pt.dungeonColliders:Pt.colliders,t=.42;for(const e of i){const n=y.pos.x-e.x,s=y.pos.z-e.z,r=Math.hypot(n,s),o=e.r+t;r<o&&r>1e-4&&(y.pos.x=e.x+n/r*o,y.pos.z=e.z+s/r*o)}if(Z.zone==="dungeon")y.pos.x=Be(y.pos.x,-14.5,14.5),y.pos.z=Be(y.pos.z,-246,-199.2);else{const e=Math.hypot(y.pos.x,y.pos.z);e>94&&(y.pos.x*=94/e,y.pos.z*=94/e),Pt.heightAt(y.pos.x,y.pos.z)<-.85&&(y.pos.x-=y.vel.x*.02,y.pos.z-=y.vel.z*.02)}}function sx(i){if(y.dead)return;if(y.invuln=Math.max(0,y.invuln-i),y.dodgeCd=Math.max(0,y.dodgeCd-i),y.magicCd=Math.max(0,y.magicCd-i),y.hurtTimer=Math.max(0,y.hurtTimer-i),y.comboTimer=Math.max(0,y.comboTimer-i),y.lastDamage+=i,y.mana=Math.min(y.maxMana,y.mana+i*9),y.lastDamage>9&&y.hp<y.maxHp&&(y.hp=Math.min(y.maxHp,y.hp+i*2.5)),y.attack){const v=y.attack;if(v.time+=i,!v.hitDone&&v.time>=v.def.hitTime&&(v.hitDone=!0,jg(v)),v.time>=v.def.duration){const g=v.comboIndex,u=v.queued,S=v.type;y.attack=null,y.comboTimer=.92,y.lastCombo=g,u&&S==="light"&&g<2&&Ri("light",g+1)}}y.magicDelay>0&&(y.magicDelay-=i,y.magicDelay<=0&&Qg()),y.magicTimer=Math.max(0,y.magicTimer-i);let t=0,e=0;wn.has("KeyD")&&(t+=1),wn.has("KeyA")&&(t-=1),wn.has("KeyW")&&(e+=1),wn.has("KeyS")&&(e-=1),t+=hn.x,e-=hn.y;const n=Math.hypot(t,e);n>1&&(t/=n,e/=n);const s=new C(-Math.sin(De),0,-Math.cos(De)),r=new C(Math.cos(De),0,-Math.sin(De)),o=new C().addScaledVector(s,e).addScaledVector(r,t);o.lengthSq()>1&&o.normalize();const a=o.lengthSq()>.01,c=(wn.has("ShiftLeft")||wn.has("ShiftRight")||Yi)&&a&&!y.attack&&y.magicTimer<=0;let l=c?9.2:5.7;if(y.attack&&(l*=.28),y.magicTimer>0&&(l*=.5),y.grounded||(l*=.92),y.dodgeTimer>0){y.dodgeTimer-=i;const v=Be(y.dodgeTimer/.42,0,1);y.vel.x=y.dodgeDir.x*13.5*(.55+v*.45),y.vel.z=y.dodgeDir.z*13.5*(.55+v*.45),y.dodgeTimer<=0&&(y.vel.multiplyScalar(.25),y.invuln=Math.max(y.invuln,.08))}else y.vel.x=Ll(y.vel.x,a?o.x*l:0,a?13:9,i),y.vel.z=Ll(y.vel.z,a?o.z*l:0,a?13:9,i);a&&!y.attack&&y.dodgeTimer<=0&&y.hurtTimer<=0&&(y.yaw=Yg(y.yaw,Math.atan2(o.x,o.z),14,i));const h=y.pos.x,d=y.pos.z;y.pos.x+=y.vel.x*i,y.pos.z+=y.vel.z*i,ix(),Z.zone==="island"&&Pt.heightAt(y.pos.x,y.pos.z)<-.9&&(y.pos.x=h,y.pos.z=d,y.vel.x*=.2,y.vel.z*=.2),y.jumpRequested&&y.grounded&&(y.vy=8.6,y.grounded=!1,Xt.jump(),Pe.hitSpark(y.pos.clone().add(new C(0,.1,0)),12582143,8,.7,.35),y.jumpRequested=!1),y.jumpRequested=!1;const m=nx();!y.grounded||y.pos.y>m+.06?(y.vy-=25.5*i,y.pos.y+=y.vy*i,y.grounded=!1,y.pos.y<=m&&(y.vy<-6&&(Z.shake=Math.max(Z.shake,.12),Pe.hitSpark(y.pos.clone().add(new C(0,.1,0)),13625583,10,.7,.35)),y.pos.y=m,y.vy=0,y.grounded=!0)):(y.pos.y=m,y.vy=0,y.grounded=!0);for(const v of Pt.crystals)v.collected||Math.hypot(v.pos.x-y.pos.x,v.pos.z-y.pos.z)<1.5&&Math.abs(v.pos.y-y.pos.y)<2.4&&qa(v);let p="idle";y.dead?p="dead":y.hurtTimer>0?p="hurt":y.dodgeTimer>0?p="dodge":y.attack?p=y.attack.type==="heavy"?"heavy":`attack${y.attack.comboIndex}`:y.magicTimer>0?p="magic":y.grounded?a&&(p=c?"run":"walk"):p="jump",Ee.setState(p),Ee.root.position.copy(y.pos),Ee.root.rotation.y=y.yaw;const x=Math.hypot(y.vel.x,y.vel.z);Ee.update(i,y.attack||y.dodgeTimer>0?0:x,y.grounded),y.hp<=0&&Ph(),Oe(i)}function hc(){if(Z.mode!=="playing"||y.dead||y.dodgeCd>0||y.attack)return;let i=new C;const t=(wn.has("KeyD")?1:0)-(wn.has("KeyA")?1:0)+hn.x,e=(wn.has("KeyW")?1:0)-(wn.has("KeyS")?1:0)-hn.y,n=new C(-Math.sin(De),0,-Math.cos(De)),s=new C(Math.cos(De),0,-Math.sin(De));i.addScaledVector(n,e).addScaledVector(s,t),i.lengthSq()<.01&&(i=uo(y.yaw)),y.dodgeDir.copy(i.normalize()),y.yaw=Math.atan2(y.dodgeDir.x,y.dodgeDir.z),y.dodgeTimer=.42,y.dodgeCd=1.05,y.invuln=.55,y.attack=null,Xt.dodge(),Pe.hitSpark(y.pos.clone().add(new C(0,.4,0)),12582143,12,.9,.45)}function Lh(){let i=null,t=3.7;for(const e of Pt.interactables){if(e.inDungeon&&Z.zone!=="dungeon"||e.inIsland&&Z.zone!=="island"||!e.inDungeon&&Z.zone==="dungeon"||e.type==="chest"&&e.opened||e.type==="dungeon-exit"&&Z.zone!=="dungeon")continue;const n=Math.hypot(e.pos.x-y.pos.x,e.pos.z-y.pos.z);n<t&&(t=n,i=e)}return i}function rx(i){return i?i.type==="npc"?`Talk to ${i.name}`:i.type==="chest"?"Open Treasure Chest":i.type==="shrine"?i.active?`Rest at ${i.name}`:`Activate ${i.name}`:i.type==="temple"?Pt.templeLit?"Dawn Shrine (rest)":"Light the Dawn Shrine":i.type==="dungeon-gate"?Pt.templeLit?"Enter the Shadow Gate":"Sealed Shadow Gate":i.type==="dungeon-exit"?qt.bossActive?"Sealed by the Hollow King":"Return to the Isle":i.name:""}function Dh(){if(Z.mode!=="playing"){qi.classList.add("hidden"),Z.currentInteract=null;return}const i=Lh();Z.currentInteract=i,i?(qi.classList.remove("hidden"),kg.textContent=rx(i)):qi.classList.add("hidden")}function dc(){if(Z.mode!=="playing")return;const i=Z.currentInteract||Lh();i&&(i.type==="npc"?lx(i):i.type==="chest"?ox(i):i.type==="shrine"?ax(i):i.type==="temple"?Ih():i.type==="dungeon-gate"?Uh():i.type==="dungeon-exit"&&Nh())}function ox(i){i.opened||(i.opened=!0,i.lid.rotation.x=-1.35,i.glow.visible=!1,Vs(i.reward),zs(Math.round(i.reward*.6)),Xt.chest(),Pe.pickupBurst(i.pos.clone().add(new C(0,.8,0)),16765818),Pe.shockwave(i.pos.clone(),1.8,16765818,.7),Te(`Treasure found · ${i.reward} coins`,"gold","◈",3600),Oe(0))}function ax(i){const t=i.active;i.active=!0,i.crystal&&(i.crystal.material=Pt.mats.gold),i.glow&&i.glow.material.color.setHex(16765818),i.ring&&i.ring.material.color.setHex(16765818),y.hp=y.maxHp,y.mana=y.maxMana,y.lastDamage=99;const e={pos:i.pos.clone(),zone:i.inDungeon?"dungeon":"island",name:i.name};Z.respawn=e,e.zone==="island"&&(Z.respawnIsland=e),Xt.checkpoint(),Pe.heal(y.pos.clone()),Te(`${i.name} ${t?"restores":"awakens"} — checkpoint set`,"gold","✦",3600),Oe(0)}function Ih(){if(Pt.templeLit)y.hp=y.maxHp,y.mana=y.maxMana,Xt.heal(),Pe.heal(y.pos.clone()),Te("The shrine's light restores you","gold","✦",2400);else{Pt.activateTemple(),Pt.templeLit=!0;const i=Pt.checkpoints.find(t=>t.id==="temple");i&&(i.active=!0,i.crystal.material=Pt.mats.gold,i.glow.material.color.setHex(16765818),i.ring.material.color.setHex(16765818),Z.respawnIsland={pos:new C(0,11,-55),zone:"island",name:"Temple Shrine"},Z.respawn=Z.respawnIsland),y.hp=y.maxHp,y.mana=y.maxMana,Xt.checkpoint(),Pe.shockwave(new C(0,11.2,-64),5,16765818,1.1),Pe.heal(y.pos.clone()),Te("THE DAWN SHRINE AWAKENS — the Shadow Gate is open","gold","✦",4800),Rh(1,"Enter the Shadow Gate"),bn()}Oe(0)}function Uh(){if(!Pt.templeLit){Te("A dark seal bars the way. Light the Dawn Shrine at the temple.","purple","☠",4200);return}ac(()=>{Z.zone="dungeon",Pt.setZone("dungeon",Ke),Pt.dungeonEntered=!0,ji.intensity=.3,ke.intensity=.4,Qi.intensity=.05,Ci.intensity=.08,y.pos.set(0,.3,-205.5),y.vel.set(0,0,0),y.vy=0,y.yaw=Math.PI,y.hp=y.maxHp,y.mana=y.maxMana,De=0,gn=.22,Ln=7.4,hi=!0,Ee.root.position.copy(y.pos),Ee.setState("idle"),Pt.dungeonShrine.active=!0,Pt.dungeonShrine.crystal&&(Pt.dungeonShrine.crystal.material=Pt.mats.gold),Pt.dungeonShrine.glow&&Pt.dungeonShrine.glow.material.color.setHex(16765818),Z.respawn={pos:new C(5.5,.3,-202.5),zone:"dungeon",name:"Echo Shrine"},qt.resetBoss(),qt.bossActive=!1,Pt.bossActive=!1,Pt.fogWall.visible=!1,Ji.classList.add("hidden"),Xt.setMood("dungeon"),Rh(2,"Defeat the Hollow King"),bn(),Te("THE SHADOW DUNGEON — the Hollow King waits below","purple","☠",4600),Oe(0)})}function Nh(){if(qt.bossActive){Te("The Hollow King's seal holds the gate. Defeat him.","purple","☠",3200);return}ac(()=>{Z.zone="island",Pt.setZone("island",Ke),ji.intensity=1.25,ke.intensity=2.15,Qi.intensity=.18,Ci.intensity=.35;const i=Z.respawnIsland;y.pos.copy(i.pos),y.vel.set(0,0,0),y.vy=0,y.yaw=Math.PI,y.hp=y.maxHp,y.mana=y.maxMana,De=0,gn=.24,Ln=7.8,hi=!0,Ee.root.position.copy(y.pos),Z.respawn=i,qt.resetBoss(),Ji.classList.add("hidden"),Xt.setMood("island"),Te("Back on the Isle of Echoes","gold","✦",2800),Oe(0)})}function cx(i,t,e=""){const n=document.createElement("button");return n.textContent=i,e&&(n.className=e),n.addEventListener("click",()=>{Xt.click(),t()}),Rt("dlg-actions").appendChild(n),n}function lx(i){Z.mode="dialogue",wh.classList.remove("hidden"),qi.classList.add("hidden"),Ee.setState("dialogue"),ar(i)}function Es(){wh.classList.add("hidden"),Z.mode="playing",Ee.setState("idle")}function ar(i){const t=Xe[0],e=Xe[1],n=Xe[2],s=Rt("dlg-name"),r=Rt("dlg-text"),o=Rt("dlg-actions"),a=Rt("dlg-portrait");o.innerHTML="",s.textContent=i.name,a.textContent=i.name.charAt(0);const c=(l,h,d)=>cx(l,h,d);if(c("Farewell",Es),i.id==="mira")t.state==="active"?(a.style.color="#7df9ff",r.textContent="Astra, the dawn crystals have scattered across the isle. Their light keeps the old seal sleeping. Gather five of them — the compass will guide you. The temple lies north, beyond the village path.",c("I will find them",Es,"primary")):t.state==="done"&&!Pt.templeLit?(r.textContent="You carry the dawn again. Now climb to the ancient temple in the north and light its shrine. Only then will the Shadow Gate open.",c("To the temple, then",Es,"primary")):Pt.templeLit&&!qt.bossDefeated?(r.textContent="The shrine burns, and the Shadow Gate stirs at the western edge of the isle. Kael knows the old paths. Go carefully — the Hollow King does not forgive.",c("I am ready",Es,"primary")):r.textContent="The dawn remembers you, Astra. The isle is free because you were brave enough to walk into the dark.";else if(i.id==="rook"){if(a.style.color="#ffd37a",e.state==="locked"?(r.textContent="Beasts have been bold since the crystals fell. Six of them prowl the vale. Thin the herd and I'll pay you well — and I can temper that blade of yours.",c("Accept quest: Beasts of the Vale",()=>{e.state="active",Te("QUEST STARTED · Beasts of the Vale","gold","✦",3600),Xt.quest(),bn(),ar(i)},"gold")):e.state==="active"?r.textContent=`The vale is quieter already. ${e.progress} of ${e.target} beasts felled. Keep that blade moving.`:r.textContent="The vale sleeps easy now. You've earned every coin, Astra.",y.weaponLevel<3){const l=[120,240,400][y.weaponLevel];c(`Temper blade · ${l} coins`,()=>{if(y.coins<l){Te("Not enough coins","gold","◈",1800);return}y.coins-=l,y.weaponLevel++,Ee.setSwordLevel(y.weaponLevel),Xt.quest(),Pe.levelUp(y.pos.clone()),Te("Blade tempered — +22% damage","gold","⚔",3600),Oe(0),ar(i)},y.coins>=l?"primary":"")}else c("Blade is already legendary",()=>{},"");y.hp<y.maxHp&&c("Restore health · 30 coins",()=>{if(y.coins<30){Te("Not enough coins","gold","◈",1800);return}y.coins-=30,y.hp=y.maxHp,Xt.heal(),Pe.heal(y.pos.clone()),Oe(0),ar(i)},"")}else i.id==="kael"&&(a.style.color="#9dffcf",t.state!=="done"?r.textContent="The temple will not answer while the dawn crystals lie scattered. Gather them first, and I will show you the way to the Shadow Gate.":n.state==="locked"?(r.textContent="You carry the dawn now. Light the shrine at the temple — then the Shadow Gate can be opened. Beyond it waits the Hollow King. I will mark the path.",c("Accept quest: The Hollow King",()=>{n.state="active",n.stage=0,n.objective="Light the Dawn Shrine at the temple",Te("QUEST STARTED · The Hollow King","purple","☠",3800),Xt.quest(),bn(),ar(i)},"gold")):n.state==="active"&&n.stage===0?r.textContent="The temple stands north of the village. Light the shrine at its heart, and the way below will open.":n.state==="active"&&n.stage===1?r.textContent="The Shadow Gate is open at the west edge of the isle. Take a breath at the shrine before you descend.":n.state==="active"?r.textContent="The Hollow King waits in the dark. Strike true, and do not let him corner you.":r.textContent="You did it. The vale has never been brighter.");o.children.length===0&&c("Close",Es,"primary")}function hx(i,t){const e=Z.zone==="dungeon"?Pt.dungeonColliders:Pt.colliders,n=t.x-i.x,s=t.z-i.z,r=n*n+s*s;if(r<.001)return;let o=1;for(const a of e){if(a.r<1)continue;const c=i.x-a.x,l=i.z-a.z,h=a.r+.42,d=r,m=2*(c*n+l*s),p=c*c+l*l-h*h,x=m*m-4*d*p;if(x<0)continue;const v=(-m-Math.sqrt(x))/(2*d);v>.06&&v<o&&(o=v)}if(o<1){const a=Math.max(.14,o-.04);if(t.x=i.x+n*a,t.z=i.z+s*a,t.y=i.y+(t.y-i.y)*a,Z.zone==="island"){const c=Pt.heightAt(t.x,t.z);t.y<c+.55&&(t.y=c+.55)}else t.y=Math.max(t.y,1)}}function dx(i){const t=y.pos.clone().add(new C(0,1.45,0)),e=Math.cos(gn),n=t.clone().add(new C(Math.sin(De)*e*Ln,Math.sin(gn)*Ln,Math.cos(De)*e*Ln));if(Z.zone==="island"){const r=Pt.heightAt(n.x,n.z);n.y<r+.6&&(n.y=r+.6);const o=Math.hypot(n.x,n.z);o>120&&(n.x*=120/o,n.z*=120/o)}else n.x=Be(n.x,-14.2,14.2),n.z=Be(n.z,-244.5,-198.2),n.y=Be(n.y,1.1,15.5);if(hx(t,n),hi?(sn.position.copy(n),hi=!1):sn.position.lerp(n,1-Math.exp(-9*i)),Z.shake>.001){const r=Z.shake;sn.position.x+=(Math.random()-.5)*r,sn.position.y+=(Math.random()-.5)*r*.7,sn.position.z+=(Math.random()-.5)*r,Z.shake*=Math.exp(-8*i)}const s=t.clone().add(new C(0,.15,0));sn.lookAt(s)}function ux(i){Z.titleTime+=i;const t=Z.titleTime*.1+.6,e=60;sn.position.set(Math.sin(t)*e,23+Math.sin(t*.7)*4,Math.cos(t)*e),sn.lookAt(0,5,0)}function Fh(){if(!qt.boss||qt.bossDefeated)return;const i=Be(qt.boss.hp/qt.boss.maxHp,0,1);Eh.style.width=`${i*100}%`,Va.textContent=qt.boss.phase===2?"II":"I"}function fx(){const i=Xe[0],t=Xe[1],e=Xe[2];if(i.state==="active"){let n=null,s=1/0;for(const r of Pt.crystals){if(r.collected)continue;const o=Math.hypot(r.pos.x-y.pos.x,r.pos.z-y.pos.z);o<s&&(s=o,n=r)}return n?{pos:n.pos,label:"Dawn Crystal"}:{pos:Pt.npcs.find(r=>r.id==="mira").pos,label:"Elder Mira"}}if(t.state==="active"){let n=null,s=1/0;for(const r of qt.enemies){if(r.dead||r.type==="boss")continue;const o=Math.hypot(r.group.position.x-y.pos.x,r.group.position.z-y.pos.z);o<s&&(s=o,n=r)}return n?{pos:n.group.position,label:"Vale Beast"}:{pos:Pt.npcs.find(r=>r.id==="rook").pos,label:"Rook"}}if(e.state==="active"){if(e.stage===0)return{pos:new C(0,12,-64),label:"Dawn Shrine"};if(e.stage===1)return{pos:new C(-48,5,-46),label:"Shadow Gate"};if(e.stage===2){const n=qt.boss;return{pos:n?n.group.position:new C(0,1,-232),label:"Hollow King"}}}return i.state==="done"&&t.state==="locked"?{pos:Pt.npcs.find(n=>n.id==="rook").pos,label:"Rook"}:t.state==="done"&&e.state==="locked"?{pos:Pt.npcs.find(n=>n.id==="kael").pos,label:"Kael"}:null}function fo(){const i=fx();if(!i){Cl.classList.add("hidden");return}Cl.classList.remove("hidden"),Gg.textContent=i.label;const t=i.pos.x-y.pos.x,e=i.pos.z-y.pos.z,n=Math.hypot(t,e);Vg.textContent=`${Math.round(n)}m`;let r=Math.atan2(t,e)-(De+Math.PI);for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;Hg.style.transform=`rotate(${r*180/Math.PI-90}deg)`}function Oe(i){Z.hudTimer-=i,!(Z.hudTimer>0)&&(Z.hudTimer=.1,Rt("hp-fill").style.width=`${Be(y.hp/y.maxHp,0,1)*100}%`,Rt("mana-fill").style.width=`${Be(y.mana/y.maxMana,0,1)*100}%`,Rt("xp-fill").style.width=`${Be(y.xp/y.xpNext,0,1)*100}%`,Rt("hp-text").textContent=`${Math.ceil(y.hp)} / ${y.maxHp}`,Rt("mana-text").textContent=`${Math.ceil(y.mana)} / ${y.maxMana}`,Rt("xp-text").textContent=`Lv ${y.level} · ${Math.floor(y.xp)} / ${y.xpNext} XP`,Rt("level-badge").textContent=y.level,Rt("coin-count").textContent=y.coins,Rt("crystal-count").textContent=`${y.crystals} / ${Pt.crystals.length}`,Rt("hero-title").textContent=Xa(),Ah&&bn(),fo(),Fh(),qt.bossActive&&qt.boss&&!qt.bossDefeated&&Ji.classList.remove("hidden"),Z.minimapTimer-=.1,Z.minimapTimer<=0&&(Z.minimapTimer=.18,Oh()),Z.started&&Z.hintTimer<30&&(Z.hintTimer+=.1,Z.hintTimer>=30&&(Rt("hud-hint").style.opacity="0")))}function Oh(){const i=Wa.width,t=Wa.height;et.clearRect(0,0,i,t),et.save(),et.beginPath(),et.arc(i/2,t/2,i/2-4,0,Math.PI*2),et.clip();const e=et.createRadialGradient(i/2,t/2,10,i/2,t/2,i/2);if(e.addColorStop(0,"#122a3a"),e.addColorStop(1,"#07121f"),et.fillStyle=e,et.fillRect(0,0,i,t),Z.zone==="island"){const s=i/2,r=t/2,o=c=>s+c*1.32,a=c=>r+c*1.32;et.fillStyle="#315a43",et.beginPath(),et.arc(s,r,96*1.32,0,Math.PI*2),et.fill(),et.strokeStyle="rgba(150,220,200,.25)",et.lineWidth=2,et.stroke(),et.fillStyle="rgba(42,102,66,.9)";for(const[c,l,h]of[[-38,-16,32],[-22,-52,24],[56,-34,22],[-45,20,20]])et.beginPath(),et.arc(o(c),a(l),h*1.32,0,Math.PI*2),et.fill();et.fillStyle="#1b8da8",et.beginPath(),et.arc(o(52),a(14),24*1.32,0,Math.PI*2),et.fill(),et.strokeStyle="rgba(160,240,255,.4)",et.lineWidth=1.5,et.stroke(),et.strokeStyle="rgba(210,190,140,.38)",et.lineWidth=4,et.beginPath(),et.moveTo(o(0),a(50)),et.lineTo(o(0),a(38)),et.lineTo(o(3),a(10)),et.lineTo(o(0),a(-20)),et.lineTo(o(0),a(-52)),et.stroke(),et.beginPath(),et.moveTo(o(3),a(10)),et.lineTo(o(-28),a(-10)),et.lineTo(o(-44),a(-34)),et.lineTo(o(-48),a(-46)),et.stroke(),et.fillStyle="rgba(255,211,122,.85)",et.beginPath(),et.arc(o(0),a(38),9*1.32,0,Math.PI*2),et.fill(),et.fillStyle="rgba(190,170,255,.9)",et.beginPath(),et.arc(o(0),a(-64),5*1.32,0,Math.PI*2),et.fill(),et.fillStyle="#a45cff",et.beginPath(),et.arc(o(-48),a(-46),4*1.32,0,Math.PI*2),et.fill();for(const c of Pt.crystals)c.collected||(et.fillStyle="#7df9ff",et.beginPath(),et.arc(o(c.pos.x),a(c.pos.z),2.4,0,Math.PI*2),et.fill());for(const c of Pt.npcs)et.fillStyle="#ffd37a",et.beginPath(),et.arc(o(c.pos.x),a(c.pos.z),2.8,0,Math.PI*2),et.fill();for(const c of qt.enemies)c.dead||c.inDungeon||(et.fillStyle=c.type==="shade"?"#d78bff":"#ff6f91",et.beginPath(),et.arc(o(c.group.position.x),a(c.group.position.z),2.6,0,Math.PI*2),et.fill());et.save(),et.translate(o(y.pos.x),a(y.pos.z)),et.rotate(Math.PI-y.yaw),et.fillStyle="#ffffff",et.beginPath(),et.moveTo(0,-8),et.lineTo(5.5,6),et.lineTo(0,3),et.lineTo(-5.5,6),et.closePath(),et.fill(),et.restore()}else{const n=i/2,s=t/2,r=a=>n+a*7.2,o=a=>s+(a+223)*4.6;et.fillStyle="#241431",et.fillRect(r(-17),o(-196),34*7.2,54*4.6),et.strokeStyle="rgba(180,105,255,.4)",et.lineWidth=3,et.strokeRect(r(-17),o(-196),34*7.2,54*4.6),et.fillStyle="rgba(180,105,255,.18)",et.beginPath(),et.arc(r(0),o(-232),9*7.2,0,Math.PI*2),et.fill(),et.fillStyle="#b46bff",qt.boss&&!qt.boss.dead&&(et.beginPath(),et.arc(r(qt.boss.group.position.x),o(qt.boss.group.position.z),7,0,Math.PI*2),et.fill()),et.fillStyle="#7df9ff",et.beginPath(),et.arc(r(5.5),o(-202.5),4,0,Math.PI*2),et.fill(),et.fillStyle="rgba(255,211,122,.8)",et.beginPath(),et.arc(r(0),o(-200),3,0,Math.PI*2),et.fill(),et.save(),et.translate(r(y.pos.x),o(y.pos.z)),et.rotate(Math.PI-y.yaw),et.fillStyle="#ffffff",et.beginPath(),et.moveTo(0,-8),et.lineTo(5.5,6),et.lineTo(0,3),et.lineTo(-5.5,6),et.closePath(),et.fill(),et.restore()}et.restore(),et.strokeStyle="rgba(180,230,255,.18)",et.lineWidth=2,et.beginPath(),et.arc(i/2,t/2,i/2-5,0,Math.PI*2),et.stroke(),et.fillStyle="rgba(220,245,255,.75)",et.font='bold 14px "Trebuchet MS", sans-serif',et.textAlign="center",et.fillText("N",i/2,20)}function qa(i){i.collected||(i.collected=!0,i.group.visible=!1,y.crystals++,Vs(15),zs(38),y.hp=Math.min(y.maxHp,y.hp+6),Xt.pickup(),Pe.pickupBurst(i.pos.clone().add(new C(0,1.2,0)),8255999),Pe.shockwave(i.pos.clone(),1.6,8255999,.55),Te(`Dawn Crystal · ${y.crystals} / ${Pt.crystals.length}`,"gold","◆",2400),Jg(),Oe(0))}function zh(){Z.started||(Z.started=!0,Z.mode="playing",Xt.init(),Xt.resume(),Xt.setMood("island"),Xt.click(),zg.classList.add("gone"),Bg.classList.remove("hidden"),bh.classList.remove("hidden"),y.pos.copy(Th),y.yaw=Math.PI,Ee.root.position.copy(y.pos),Ee.root.rotation.y=y.yaw,Ee.setState("idle"),De=0,gn=.24,Ln=7.8,hi=!0,Z.respawn={pos:new C(6.2,Pt.heightAt(6.2,31.5),31.5),zone:"island",name:"Dawn Shrine"},Z.respawnIsland=Z.respawn,bn(),Oe(0),dr(),Dh(),Te("Elder Mira: Astra, the dawn crystals have scattered across the isle.","gold","✦",6200),setTimeout(()=>{Z.mode!=="title"&&Te("Quest started · Shards of Dawn","","◈",3800)},1300))}function Bh(){Z.mode==="playing"&&(Z.mode="paused",pr.classList.remove("hidden"),Rt("pause-level").textContent=y.level,Rt("pause-coins").textContent=y.coins,Rt("pause-crystals").textContent=`${y.crystals} / ${Pt.crystals.length}`,Rt("pause-quests").textContent=`${Xe.filter(i=>i.state==="done").length} / 3`,qi.classList.add("hidden"),Xt.click())}function uc(){Z.mode==="paused"&&(Z.mode="playing",pr.classList.add("hidden"),mr.classList.add("hidden"),Os=!1,Xt.click())}function kh(){Z.mode="victory",Z.pendingVictory=!1,Sh.classList.remove("hidden"),qi.classList.add("hidden"),Ji.classList.add("hidden"),Xt.victory(),Rt("victory-stats").innerHTML="";const i=[["Level",y.level],["Coins",y.coins],["Crystals",`${y.crystals}/${Pt.crystals.length}`],["Time",`${Math.floor(Z.playTime/60)}:${String(Math.floor(Z.playTime%60)).padStart(2,"0")}`]];for(const[t,e]of i){const n=document.createElement("div"),s=document.createElement("span");s.textContent=t;const r=document.createElement("b");r.textContent=e,n.append(s,r),Rt("victory-stats").appendChild(n)}}Rt("play-btn").addEventListener("click",zh);Rt("controls-btn").addEventListener("click",()=>{Z.controlsReturn="title",Os=!0,mr.classList.remove("hidden"),Xt.click()});Rt("controls-close").addEventListener("click",()=>{mr.classList.add("hidden"),Os=!1,Z.controlsReturn==="pause"&&pr.classList.remove("hidden"),Xt.click()});Rt("resume-btn").addEventListener("click",uc);Rt("pause-controls-btn").addEventListener("click",()=>{Z.controlsReturn="pause",Os=!0,pr.classList.add("hidden"),mr.classList.remove("hidden"),Xt.click()});Rt("mute-btn").addEventListener("click",()=>{Xt.setMuted(!Xt.muted),Rt("mute-btn").textContent=`Sound: ${Xt.muted?"Off":"On"}`,Xt.click()});Rt("menu-btn").addEventListener("click",()=>location.reload());Rt("retry-btn").addEventListener("click",ex);Rt("gameover-menu-btn").addEventListener("click",()=>location.reload());Rt("continue-btn").addEventListener("click",()=>{Sh.classList.add("hidden"),Z.mode="playing",Xt.setMood(Z.zone==="dungeon"?"dungeon":"island"),Te("The isle is yours to explore","gold","✦",3200),Xt.click()});Rt("victory-menu-btn").addEventListener("click",()=>location.reload());Rt("quest-collapse").addEventListener("click",()=>{Rt("quest-tracker").classList.toggle("collapsed"),Rt("quest-collapse").textContent=Rt("quest-tracker").classList.contains("collapsed")?"+":"–",Xt.click()});window.addEventListener("keydown",i=>{if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(i.code)&&i.preventDefault(),wn.add(i.code),i.code==="Escape"){if(Os){mr.classList.add("hidden"),Os=!1,Z.controlsReturn==="pause"&&Z.mode==="paused"&&pr.classList.remove("hidden");return}if(Z.mode==="dialogue"){Es();return}if(Z.mode==="paused"){uc();return}if(Z.mode==="playing"){Bh();return}}if(i.code==="KeyM"){Xt.setMuted(!Xt.muted),Rt("mute-btn").textContent=`Sound: ${Xt.muted?"Off":"On"}`;return}Z.mode==="playing"&&(i.repeat||(i.code==="Space"&&(y.jumpRequested=!0),i.code==="KeyC"&&hc(),i.code==="KeyQ"&&lc(),i.code==="KeyE"&&dc(),i.code==="KeyJ"&&Ri("light"),i.code==="KeyK"&&Ri("heavy"),i.code==="ArrowLeft"&&(De+=.18),i.code==="ArrowRight"&&(De-=.18),i.code==="ArrowUp"&&(gn=Be(gn+.1,-.12,1.15)),i.code==="ArrowDown"&&(gn=Be(gn-.1,-.12,1.15))))});window.addEventListener("keyup",i=>wn.delete(i.code));window.addEventListener("blur",()=>wn.clear());Xn.addEventListener("contextmenu",i=>i.preventDefault());Xn.addEventListener("pointerdown",i=>{var t;if(Z.mode==="playing"){if(i.pointerType==="mouse"&&i.button===2){Ri("heavy");return}cn={id:i.pointerId,x:i.clientX,y:i.clientY,sx:i.clientX,sy:i.clientY,moved:!1,type:i.pointerType},(t=Xn.setPointerCapture)==null||t.call(Xn,i.pointerId)}});Xn.addEventListener("pointermove",i=>{if(!cn||cn.id!==i.pointerId)return;const t=i.clientX-cn.x,e=i.clientY-cn.y;cn.x=i.clientX,cn.y=i.clientY,Math.abs(i.clientX-cn.sx)+Math.abs(i.clientY-cn.sy)>5&&(cn.moved=!0),De-=t*.0055,gn=Be(gn+e*.0042,-.12,1.15)});Xn.addEventListener("pointerup",i=>{!cn||cn.id!==i.pointerId||(!cn.moved&&cn.type==="mouse"&&i.button===0&&Ri("light"),cn=null)});Xn.addEventListener("pointercancel",()=>{cn=null});Xn.addEventListener("wheel",i=>{Z.mode==="playing"&&(Ln=Be(Ln+i.deltaY*.007,4.2,13.5))},{passive:!0});const wi=Rt("joystick"),Hh=Rt("joystick-knob");function Gh(i){const t=wi.getBoundingClientRect(),e=t.left+t.width/2,n=t.top+t.height/2;let s=i.clientX-e,r=i.clientY-n;const o=t.width*.32,a=Math.hypot(s,r);a>o&&(s*=o/a,r*=o/a),hn.x=s/o,hn.y=r/o,Hh.style.transform=`translate(${s}px, ${r}px)`}function Vh(){hn.x=0,hn.y=0,hn.active=!1,hn.pointerId=null,Hh.style.transform="translate(0px, 0px)"}wi.addEventListener("pointerdown",i=>{var e;i.preventDefault();const t=performance.now();t-Rl<320&&(Yi=!Yi,Ga.classList.toggle("on",Yi)),Rl=t,hn.active=!0,hn.pointerId=i.pointerId,(e=wi.setPointerCapture)==null||e.call(wi,i.pointerId),Gh(i)});wi.addEventListener("pointermove",i=>{!hn.active||hn.pointerId!==i.pointerId||Gh(i)});wi.addEventListener("pointerup",Vh);wi.addEventListener("pointercancel",Vh);Ga.addEventListener("pointerdown",i=>{i.preventDefault(),Yi=!Yi,Ga.classList.toggle("on",Yi)});document.querySelectorAll(".mbtn").forEach(i=>{i.addEventListener("pointerdown",t=>{if(t.preventDefault(),Z.mode!=="playing")return;const e=i.dataset.action;e==="attack"&&Ri("light"),e==="heavy"&&Ri("heavy"),e==="jump"&&(y.jumpRequested=!0),e==="dodge"&&hc(),e==="magic"&&lc(),e==="interact"&&dc()})});const px=new ug;function Wh(){requestAnimationFrame(Wh);const i=Math.min(px.getDelta(),.05);let t=i;Z.hitStop>0&&(Z.hitStop-=i,t*=.16),Pt.update(i),Xt.update(i),Z.mode==="playing"?(Z.playTime+=i,sx(t),qt.update(t,y.pos,y.invuln>0),Zg(t),Dh(),dx(t),Oe(i),Z.pendingVictory&&(Z.victoryTimer-=i,Z.victoryTimer<=0&&kh())):Z.mode==="title"?(ux(i),Ee.root.position.copy(y.pos),Ee.update(i,0,!0),fo()):Z.mode==="dying"?(Ee.update(i,0,y.grounded),Z.shake>0&&(Z.shake*=Math.exp(-4*i))):(Z.mode==="dialogue"||Z.mode==="gameover"||Z.mode==="victory")&&Ee.update(i,0,y.grounded),Pe.update(t),Yn.render(Ke,sn)}window.addEventListener("resize",()=>{sn.aspect=window.innerWidth/window.innerHeight,sn.updateProjectionMatrix(),Yn.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65)),Yn.setSize(window.innerWidth,window.innerHeight)});bn();Oe(0);Oh();Wh();setTimeout(()=>yh.classList.add("gone"),420);setTimeout(()=>yh.remove(),1300);window.__ASTRA__={player:y,world:Pt,quests:Xe,manager:qt,vfx:Pe,game:Z,api:{startGame:zh,startAttack:Ri,castMagic:lc,interact:dc,dodgeRoll:hc,teleport(i,t,e="island"){Z.zone=e,Pt.setZone(e,Ke),y.pos.set(i,e==="dungeon"?.3:Pt.heightAt(i,t),t),y.vel.set(0,0,0),y.vy=0,De=0,hi=!0,Ee.root.position.copy(y.pos),e==="dungeon"?(ji.intensity=.3,ke.intensity=.4,Qi.intensity=.05,Ci.intensity=.08):(ji.intensity=1.25,ke.intensity=2.15,Qi.intensity=.18,Ci.intensity=.35)},enterDungeon:Uh,exitDungeon:Nh,lightTemple:Ih,startBoss(){qt.startBoss()},damageBoss(i=100){qt.boss||qt.startBoss(),qt.boss&&qt.damage(qt.boss,i,new C(0,0,1),0,!0,"debug")},damageNearest(i=50){const t=cc(50);t&&qt.damage(t,i,new C(0,0,1),2,!0,"debug")},killAllMinions(){for(const i of[...qt.enemies])i.type!=="boss"&&!i.dead&&qt.damage(i,9999,new C(0,0,1),2,!0,"debug")},collectCrystal(i=0){Pt.crystals[i]&&qa(Pt.crystals[i])},collectCrystals(i=5){for(const t of Pt.crystals){if(i<=0)break;t.collected||(qa(t),i--)}},completeQuest(i){const t=Xe.find(e=>e.id===i);t&&so(t)},giveCoins(i){Vs(i)},addXP(i){zs(i)},setHp(i){y.hp=Be(i,0,y.maxHp),Oe(0)},setMana(i){y.mana=Be(i,0,y.maxMana),Oe(0)},heal(){y.hp=y.maxHp,y.mana=y.maxMana,Oe(0)},pause:Bh,resume:uc,showVictory:kh,orbit(i=0,t=0,e=null){De+=i,gn=Be(gn+t,-.12,1.15),e!=null&&(Ln=Be(e,4.2,13.5)),hi=!0},setCamera(i={}){i.yaw!=null&&(De=i.yaw),i.pitch!=null&&(gn=Be(i.pitch,-.12,1.15)),i.dist!=null&&(Ln=Be(i.dist,4.2,13.5)),i.fov!=null&&(sn.fov=i.fov,sn.updateProjectionMatrix()),hi=!0},getState(){return{mode:Z.mode,zone:Z.zone,started:Z.started,hp:y.hp,maxHp:y.maxHp,mana:y.mana,level:y.level,xp:y.xp,coins:y.coins,crystals:y.crystals,weaponLevel:y.weaponLevel,pos:{x:y.pos.x,y:y.pos.y,z:y.pos.z},yaw:y.yaw,camera:{x:sn.position.x,y:sn.position.y,z:sn.position.z,yaw:De,dist:Ln},quests:Xe.map(i=>({id:i.id,state:i.state,progress:i.progress,stage:i.stage})),enemies:qt.enemies.filter(i=>!i.dead).length,bossHp:qt.boss?qt.boss.hp:null,bossActive:qt.bossActive,bossDefeated:qt.bossDefeated,templeLit:Pt.templeLit,respawn:Z.respawn.name,controls:{mobile:!bh.classList.contains("hidden"),joystick:{x:hn.x,y:hn.y}}}}}};
