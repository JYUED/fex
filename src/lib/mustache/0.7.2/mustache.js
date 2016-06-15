define([],function(b,a,c){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */
(function(d,e){if(typeof a==="object"&&a){e(a)}else{var f={};e(f);if(typeof define==="function"&&define.amd){define(f)}else{d.Mustache=f}}}(this,function(d){var h=/\s*/;var o=/\s+/;var m=/\S/;var k=/\s*=/;var q=/\s*\}/;var w=/#|\^|\/|>|\{|&|=|!/;var i=RegExp.prototype.test;function v(C,B){return i.call(C,B)}function j(B){return !v(m,B)}var y=Object.prototype.toString;var n=Array.isArray||function(B){return y.call(B)==="[object Array]"};function g(B){return B.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")}var f={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;"};function p(B){return String(B).replace(/[&<>"'\/]/g,function(C){return f[C]})}function x(B){this.string=B;this.tail=B;this.pos=0}x.prototype.eos=function(){return this.tail===""};x.prototype.scan=function(C){var B=this.tail.match(C);if(B&&B.index===0){this.tail=this.tail.substring(B[0].length);this.pos+=B[0].length;return B[0]}return""};x.prototype.scanUntil=function(C){var B,D=this.tail.search(C);switch(D){case -1:B=this.tail;this.pos+=this.tail.length;this.tail="";break;case 0:B="";break;default:B=this.tail.substring(0,D);this.tail=this.tail.substring(D);this.pos+=D}return B};function u(B,C){this.view=B||{};this.parent=C;this._cache={}}u.make=function(B){return(B instanceof u)?B:new u(B)};u.prototype.push=function(B){return new u(B,this)};u.prototype.lookup=function(B){var E=this._cache[B];if(!E){if(B=="."){E=this.view}else{var D=this;while(D){if(B.indexOf(".")>0){E=D.view;var F=B.split("."),C=0;while(E&&C<F.length){E=E[F[C++]]}}else{E=D.view[B]}if(E!=null){break}D=D.parent}}this._cache[B]=E}if(typeof E==="function"){E=E.call(this.view)}return E};function s(){this.clearCache()}s.prototype.clearCache=function(){this._cache={};this._partialCache={}};s.prototype.compile=function(D,B){var C=this._cache[D];if(!C){var E=d.parse(D,B);C=this._cache[D]=this.compileTokens(E,D)}return C};s.prototype.compilePartial=function(C,E,B){var D=this.compile(E,B);this._partialCache[C]=D;return D};s.prototype.getPartial=function(B){if(!(B in this._partialCache)&&this._loadPartial){this.compilePartial(B,this._loadPartial(B))}return this._partialCache[B]};s.prototype.compileTokens=function(D,C){var B=this;return function(E,G){if(G){if(typeof G==="function"){B._loadPartial=G}else{for(var F in G){B.compilePartial(F,G[F])}}}return r(D,B,u.make(E),C)}};s.prototype.render=function(D,B,C){return this.compile(D)(B,C)};function r(I,C,B,L){var F="";var D,J,K;for(var G=0,H=I.length;G<H;++G){D=I[G];J=D[1];switch(D[0]){case"#":K=B.lookup(J);if(typeof K==="object"){if(n(K)){for(var E=0,N=K.length;E<N;++E){F+=r(D[4],C,B.push(K[E]),L)}}else{if(K){F+=r(D[4],C,B.push(K),L)}}}else{if(typeof K==="function"){var M=L==null?null:L.slice(D[3],D[5]);K=K.call(B.view,M,function(O){return C.render(O,B)});if(K!=null){F+=K}}else{if(K){F+=r(D[4],C,B,L)}}}break;case"^":K=B.lookup(J);if(!K||(n(K)&&K.length===0)){F+=r(D[4],C,B,L)}break;case">":K=C.getPartial(J);if(typeof K==="function"){F+=K(B)}break;case"&":K=B.lookup(J);if(K!=null){F+=K}break;case"name":K=B.lookup(J);if(K!=null){F+=d.escape(K)}break;case"text":F+=J;break}}return F}function A(H){var C=[];var G=C;var I=[];var E;for(var D=0,B=H.length;D<B;++D){E=H[D];switch(E[0]){case"#":case"^":I.push(E);G.push(E);G=E[4]=[];break;case"/":var F=I.pop();F[5]=E[2];G=I.length>0?I[I.length-1][4]:C;break;default:G.push(E)}}return C}function e(G){var D=[];var F,C;for(var E=0,B=G.length;E<B;++E){F=G[E];if(F){if(F[0]==="text"&&C&&C[0]==="text"){C[1]+=F[1];C[3]=F[3]}else{C=F;D.push(F)}}}return D}function t(B){return[new RegExp(g(B[0])+"\\s*"),new RegExp("\\s*"+g(B[1]))]}function z(R,H){R=R||"";H=H||d.tags;if(typeof H==="string"){H=H.split(o)}if(H.length!==2){throw new Error("Invalid tags: "+H.join(", "))}var L=t(H);var D=new x(R);var J=[];var I=[];var G=[];var S=false;var Q=false;function P(){if(S&&!Q){while(G.length){delete I[G.pop()]}}else{G=[]}S=false;Q=false}var E,C,K,M,F;while(!D.eos()){E=D.pos;K=D.scanUntil(L[0]);if(K){for(var N=0,O=K.length;N<O;++N){M=K.charAt(N);if(j(M)){G.push(I.length)}else{Q=true}I.push(["text",M,E,E+1]);E+=1;if(M=="\n"){P()}}}if(!D.scan(L[0])){break}S=true;C=D.scan(w)||"name";D.scan(h);if(C==="="){K=D.scanUntil(k);D.scan(k);D.scanUntil(L[1])}else{if(C==="{"){K=D.scanUntil(new RegExp("\\s*"+g("}"+H[1])));D.scan(q);D.scanUntil(L[1]);C="&"}else{K=D.scanUntil(L[1])}}if(!D.scan(L[1])){throw new Error("Unclosed tag at "+D.pos)}F=[C,K,E,D.pos];I.push(F);if(C==="#"||C==="^"){J.push(F)}else{if(C==="/"){if(J.length===0){throw new Error('Unopened section "'+K+'" at '+E)}var B=J.pop();if(B[1]!==K){throw new Error('Unclosed section "'+B[1]+'" at '+E)}}else{if(C==="name"||C==="{"||C==="&"){Q=true}else{if(C==="="){H=K.split(o);if(H.length!==2){throw new Error("Invalid tags at "+E+": "+H.join(", "))}L=t(H)}}}}}var B=J.pop();if(B){throw new Error('Unclosed section "'+B[1]+'" at '+D.pos)}I=e(I);return A(I)}d.name="mustache.js";d.version="0.7.2";d.tags=["{{","}}"];d.Scanner=x;d.Context=u;d.Writer=s;d.parse=z;d.escape=p;var l=new s();d.clearCache=function(){return l.clearCache()};d.compile=function(C,B){return l.compile(C,B)};d.compilePartial=function(C,D,B){return l.compilePartial(C,D,B)};d.compileTokens=function(C,B){return l.compileTokens(C,B)};d.render=function(D,B,C){return l.render(D,B,C)};d.to_html=function(E,C,D,F){var B=d.render(E,C,D);if(typeof F==="function"){F(B)}else{return B}}}))});
;

;
