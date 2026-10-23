/* Chalet Althéa : interactions du site */
(function(){
  // Écran d'entrée : une photo et le logo, glisse vers le haut après 2 s
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  var loader=document.querySelector('.loader');
  if(loader){
    document.documentElement.style.overflow='hidden';
    setTimeout(function(){
      loader.classList.add('fini');
      document.documentElement.style.overflow='';
      setTimeout(function(){loader.remove();},1050);
    },2200);
  }

  // En-tête : transparent sur la photo, plein au défilement
  var entete=document.querySelector('.entete');
  var majEntete=function(){ if(entete) entete.classList.toggle('plein',window.scrollY>40); };
  majEntete(); window.addEventListener('scroll',majEntete,{passive:true});
  var burger=document.querySelector('.burger');
  if(burger){burger.addEventListener('click',function(){
    var o=entete.classList.toggle('menu-ouvert');
    burger.setAttribute('aria-expanded',o?'true':'false');
    document.documentElement.style.overflow=o?'hidden':'';
  });}

  // Hero : trois photos en fondu, avec les traits qui suivent
  var diapos=[].slice.call(document.querySelectorAll('.hero .diapos img'));
  var points=[].slice.call(document.querySelectorAll('.hero .points span'));
  if(diapos.length>1){var d=0;setInterval(function(){
    diapos[d].classList.remove('actif'); if(points[d]) points[d].classList.remove('actif');
    d=(d+1)%diapos.length;
    diapos[d].classList.add('actif'); if(points[d]) points[d].classList.add('actif');
  },6000);}

  // Apparition au défilement
  var els=document.querySelectorAll('[data-reveal]');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vu');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){io.observe(el);});
  } else els.forEach(function(el){el.classList.add('vu');});

  // Visionneuse : photo entière, jamais recadrée
  var boutons=[].slice.call(document.querySelectorAll('[data-galerie]'));
  if(boutons.length){
    var v=document.createElement('div');
    v.className='visionneuse';
    v.innerHTML='<button class="fermer" aria-label="Fermer">&times;</button><button class="prec" aria-label="Photo précédente">&#8249;</button><img alt=""><div class="legende"></div><button class="suiv" aria-label="Photo suivante">&#8250;</button>';
    document.body.appendChild(v);
    var img=v.querySelector('img'),leg=v.querySelector('.legende'),i=0;
    var montre=function(n){i=(n+boutons.length)%boutons.length;var b=boutons[i];img.src=b.getAttribute('data-galerie');img.alt=b.getAttribute('data-legende')||'';leg.textContent=(b.getAttribute('data-legende')||'')+'  ·  '+(i+1)+' / '+boutons.length;};
    boutons.forEach(function(b,n){b.addEventListener('click',function(){montre(n);v.classList.add('ouverte');});});
    v.querySelector('.fermer').onclick=function(){v.classList.remove('ouverte');};
    v.querySelector('.prec').onclick=function(e){e.stopPropagation();montre(i-1);};
    v.querySelector('.suiv').onclick=function(e){e.stopPropagation();montre(i+1);};
    v.addEventListener('click',function(e){if(e.target===v)v.classList.remove('ouverte');});
    document.addEventListener('keydown',function(e){if(!v.classList.contains('ouverte'))return;if(e.key==='Escape')v.classList.remove('ouverte');if(e.key==='ArrowLeft')montre(i-1);if(e.key==='ArrowRight')montre(i+1);});
  }

  // Carte Google Maps chargée au clic : aucun cookie avant que le visiteur la demande
  document.querySelectorAll('.carte-maps[data-src]').forEach(function(c){
    var b=c.querySelector('.ouvrir-carte');
    if(b) b.addEventListener('click',function(){
      var f=document.createElement('iframe');
      f.src=c.getAttribute('data-src'); f.title=c.getAttribute('data-titre')||'Carte'; f.loading='lazy';
      f.referrerPolicy='no-referrer-when-downgrade';
      c.innerHTML=''; c.appendChild(f);
    });
  });

  // Formulaire : la démonstration n'envoie rien
  document.querySelectorAll('form.formulaire').forEach(function(f){
    f.addEventListener('submit',function(e){e.preventDefault();f.classList.add('envoye');f.querySelector('.merci').scrollIntoView({block:'nearest',behavior:'smooth'});});
  });
})();
