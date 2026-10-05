const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)'); // usada pelas animações abaixo

// Mídia abaixo da dobra ([data-perto]): quando o bloco chega a ~1500px da tela, ganha .perto e o CSS libera a foto
// de fundo (--foto) e as fotos do carrossel. As imagens lazy lá dentro viram eager e já decodificam — no carrossel,
// os cards fora da área visível do trilho não entram em branco no meio do deslize.
// A classe .js (posta no <head> só se houver IntersectionObserver) é o que ativa essa espera no CSS.
if (document.documentElement.classList.contains('js')) {
  const perto = new IntersectionObserver(entradas => entradas.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting) return;
    perto.unobserve(target);
    target.classList.add('perto');
    target.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; img.decode().catch(() => {}); });
  }), { rootMargin: '1500px 0px' });
  document.querySelectorAll('[data-perto]').forEach(el => perto.observe(el));
}

// Header: vira pílula de vidro após rolar; no mobile abre/fecha o menu
const header = document.querySelector('.header');
const toggle = header.querySelector('.header__toggle');
const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 10);
const setMenu = open => {
  header.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();
toggle.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
header.querySelector('.header__nav').addEventListener('click', e => e.target.closest('a') && setMenu(false));
document.addEventListener('click', e => header.contains(e.target) || setMenu(false));
addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

// "Por que a Aziz" (pilha de cards no celular): todos os cards com a altura do maior — sem isso a pilha solta
// fora de ordem. A variável só é usada no CSS abaixo de 600px.
const whySection = document.querySelector('.why');
if (whySection) {
  const whyCards = [...whySection.querySelectorAll('.why-card')];
  const igualarCards = () => {
    whySection.style.removeProperty('--altura-card');
    const maior = Math.max(...whyCards.map(c => c.offsetHeight));
    whySection.style.setProperty('--altura-card', `${maior}px`);
  };
  // mede com a fonte final e numa tarefa própria (fora da tarefa do carregamento); idem nos blocos abaixo
  document.fonts.ready.then(() => setTimeout(igualarCards));
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(igualarCards, 150); });
}

// Megamenu de Serviços: montado a partir dos cards do carrossel (mesmo título, descrição e ícone — a copy fica
// num lugar só). Desktop: abre no hover ou no clique (o clique "fixa" o painel). Celular: acordeão dentro do menu.
const navMega = document.querySelector('.nav-mega');
if (navMega) {
  const btn = navMega.querySelector('.nav-mega__toggle');
  const list = navMega.querySelector('[data-mega-list]');
  [...document.querySelectorAll('.svc-card[data-index]:not([aria-hidden])')]
    .sort((a, b) => a.dataset.index - b.dataset.index)
    .forEach(card => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="#servicos" data-service="${card.dataset.index}"><span class="mega__icon"></span><div class="mega__text"><strong></strong><small></small></div></a>`;
      li.querySelector('.mega__icon').append(card.querySelector('.svc-card__icon svg').cloneNode(true));
      li.querySelector('strong').textContent = card.querySelector('h3').textContent;
      li.querySelector('small').textContent = card.querySelector('.svc-card__more p').textContent;
      list.append(li);
    });

  const desktop = matchMedia('(min-width: 1101px)');
  let timer, pinned = false;
  const setMega = open => {
    clearTimeout(timer);
    if (!open) pinned = false;
    navMega.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open);
  };
  btn.addEventListener('click', () => {
    const open = navMega.classList.contains('is-open');
    if (open && !pinned && desktop.matches) { pinned = true; return; } // aberto pelo hover: o clique fixa
    pinned = !open;
    setMega(!open);
  });
  navMega.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse' || !desktop.matches) return;
    clearTimeout(timer);
    timer = setTimeout(() => setMega(true), 60);
  });
  navMega.addEventListener('pointerleave', e => {
    if (e.pointerType !== 'mouse' || !desktop.matches || pinned) return;
    clearTimeout(timer);
    timer = setTimeout(() => setMega(false), 200);
  });
  // teclado: fecha quando o foco sai do menu (Tab), e Esc devolve o foco ao botão
  navMega.addEventListener('focusout', e => desktop.matches && e.relatedTarget && !navMega.contains(e.relatedTarget) && setMega(false));
  navMega.querySelector('.mega').addEventListener('click', e => e.target.closest('a') && setMega(false));
  document.addEventListener('click', e => navMega.contains(e.target) || setMega(false));
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && navMega.classList.contains('is-open')) { setMega(false); btn.focus(); }
  });
  desktop.addEventListener('change', () => setMega(false));
}

// Experiência: no layout 2×2 (≤1100px) as linhas saem do centro e entram de lado em cada ícone.
// Os caminhos dependem da altura real dos textos, por isso são calculados aqui; no desktop volta o traçado do Figma.
const map = document.querySelector('.experience__map');
if (map) {
  const svg = map.querySelector('svg');
  const paths = map.querySelectorAll('.track path');
  const dots = map.querySelectorAll('.dots-top circle');
  const icons = map.querySelectorAll('.icon-anim');
  const figma = { box: svg.getAttribute('viewBox'), d: [...paths].map(p => p.getAttribute('d')), cx: [...dots].map(c => c.getAttribute('cx')) };
  const grid = matchMedia('(max-width: 1100px)');
  const OFFSET = [-17.25, 17.25, -5.75, 5.75]; // Experiência, Grandes operações, CREA-SP, Normas
  const DOT_Y = 8;

  const layout = () => {
    if (!grid.matches) {
      svg.setAttribute('viewBox', figma.box);
      paths.forEach((p, i) => p.setAttribute('d', figma.d[i]));
      dots.forEach((c, i) => c.setAttribute('cx', figma.cx[i]) || c.setAttribute('cy', 4));
      return;
    }
    // posição do item pelo layout (li.offset*, relativa ao mapa — ignora o translate da entrada) + posição do
    // ícone dentro do item (diferença de retângulos, que também se anula com o translate)
    // (mede os 4 ícones antes de mexer no SVG: ler e escrever intercalado recalcula o layout a cada ícone)
    const W = map.offsetWidth, H = map.offsetHeight;
    const pos = [...icons].map(icon => {
      const li = icon.parentElement, r = icon.getBoundingClientRect(), lr = li.getBoundingClientRect();
      return { r, top: li.offsetTop + r.top - lr.top, leftPos: li.offsetLeft + r.left - lr.left };
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    pos.forEach(({ r, top, leftPos }, i) => {
      const left = OFFSET[i] < 0;
      const x = W / 2 + OFFSET[i];
      const y = top + r.height / 2;
      const edge = left ? leftPos + r.width : leftPos;
      const rad = Math.min(16, Math.abs(x - edge));
      paths[i].setAttribute('d', `M${x} ${DOT_Y}V${y - rad}A${rad} ${rad} 0 0 ${left ? 1 : 0} ${left ? x - rad : x + rad} ${y}H${edge}`);
      dots[i].setAttribute('cx', x);
      dots[i].setAttribute('cy', DOT_Y);
    });
  };
  addEventListener('resize', layout);
  document.fonts.ready.then(() => setTimeout(layout));
}

// Linhas que "desenham" conforme a rolagem: --p vai de 0 (topo do elemento a 85% da tela) a 1 (a 45%)
const draws = document.querySelectorAll('[data-scroll-draw]');
if (draws.length && !reduceMotion.matches) {
  const update = () => draws.forEach(el => {
    const top = el.getBoundingClientRect().top / innerHeight;
    const items = el.parentElement.querySelectorAll('li');
    // enquanto algum ícone ainda está surgindo (entrada ao rolar), a linha para a 90% do caminho, antes dele
    const visiveis = [...items].every(li => !li.classList.contains('entra') || getComputedStyle(li).opacity === '1');
    const p = Math.min(visiveis ? 1 : .9, Math.max(0, (.85 - top) / .4));
    el.style.setProperty('--p', p.toFixed(3));
    // linhas completas: os ícones "recebem" o traço (pulso no CSS)
    items.forEach(li => li.classList.toggle('is-reached', p >= .98));
  });
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  // quando a entrada de um ícone termina, a linha completa mesmo sem rolar
  document.addEventListener('transitionend', e => e.propertyName === 'opacity' && e.target.closest('.experience__list') && update());
  setTimeout(update);
}

// Serviços: carrossel em loop. O conjunto é duplicado para sempre haver cards dos dois lados.
// O ativo fica numa posição fixa do trilho (A); depois de cada deslize, os cards que saíram da tela
// são movidos para a outra ponta e o trilho volta para A sem animação — o card ativo nunca é trocado.
const carousel = document.querySelector('[data-carousel]');
if (carousel) {
  const track = carousel.querySelector('.carousel__track');
  // nas <img> dos cards, loading="lazy" vem ANTES do src no HTML: na cópia os atributos entram nessa ordem, e com
  // src primeiro o Chrome baixaria a foto na hora (a cópia ainda está fora da página)
  [...track.children].forEach(card => {
    const c = card.cloneNode(true);
    c.classList.remove('is-active');
    c.setAttribute('aria-hidden', 'true');
    c.tabIndex = -1;
    c.querySelectorAll('a').forEach(a => a.tabIndex = -1);
    track.append(c);
  });

  const A = 3; // cards à esquerda do ativo (cobre telas de até ~2560px)
  const cards = () => [...track.children];
  const place = to => {
    track.classList.add('is-instant');
    carousel.style.setProperty('--i', to);
    void track.offsetWidth;
    track.classList.remove('is-instant');
  };
  for (let k = 0; k < A; k++) track.prepend(track.lastElementChild);
  let pos = A;
  place(A);

  const go = to => {
    const list = cards();
    pos = Math.max(0, Math.min(list.length - 1, to));
    list.forEach((c, k) => c.classList.toggle('is-active', k === pos));
    carousel.style.setProperty('--i', pos);
  };
  track.addEventListener('transitionend', e => {
    if (e.target !== track || e.propertyName !== 'margin-left' || pos === A) return;
    for (; pos > A; pos--) track.append(track.firstElementChild);
    for (; pos < A; pos++) track.prepend(track.lastElementChild);
    place(A);
  });

  // Altura real de cada título nos dois estados, medida com uma cópia invisível dentro de um card ativo e de um
  // compacto (herdam as mesmas regras de CSS). Com a escala do compacto já aplicada: é a altura que se vê.
  // Todas as cópias entram de uma vez e são lidas juntas: um recálculo de layout só (e não um por card).
  const titleHeights = () => {
    const active = track.querySelector('.svc-card.is-active');
    const titles = cards().map(card => card.querySelector('h3'));
    const probes = [active, active.nextElementSibling].map(card => titles.map(h3 => {
      const p = h3.cloneNode(true);
      p.style.cssText = 'position:absolute;visibility:hidden;height:auto;transition:none';
      card.append(p);
      return p;
    }));
    const [ha, hc] = probes.map(list => list.map(p => p.getBoundingClientRect().height));
    probes.flat().forEach(p => p.remove());
    titles.forEach((h3, k) => {
      h3.style.setProperty('--ha', ha[k] + 'px');
      h3.style.setProperty('--hc', hc[k] + 'px');
    });
  };
  document.fonts.ready.then(() => setTimeout(titleHeights));
  addEventListener('resize', titleHeights);

  // autoplay: quem manda é a barra de progresso do card ativo (CSS). Pausar a barra pausa a troca.
  track.addEventListener('animationend', e => e.animationName === 'svc-progress' && go(pos + 1));
  new IntersectionObserver(([e]) => carousel.classList.toggle('is-paused', !e.isIntersecting)).observe(carousel);

  // links do megamenu (data-service = data-index do card): abrem aquele serviço no carrossel
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-service]');
    if (!link) return;
    let best = pos, dist = Infinity;
    cards().forEach((c, k) => {
      if (c.dataset.index === link.dataset.service && Math.abs(k - pos) < dist) { best = k; dist = Math.abs(k - pos); }
    });
    go(best);
  });

  // clique/Enter num card ativa; setas navegam; arrastar no touch troca
  let startX = null, swiped = false;
  track.addEventListener('pointerdown', e => { startX = e.clientX; swiped = false; });
  track.addEventListener('pointerup', e => {
    const dx = startX === null ? 0 : e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) { swiped = true; go(pos + (dx < 0 ? 1 : -1)); }
  });
  track.addEventListener('click', e => {
    const card = e.target.closest('.svc-card');
    if (swiped || !card || card.classList.contains('is-active')) return;
    go(cards().indexOf(card));
  });
  carousel.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') go(pos + (e.key === 'ArrowRight' ? 1 : -1));
    else if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('svc-card') && !e.target.classList.contains('is-active')) {
      e.preventDefault();
      go(cards().indexOf(e.target));
    }
  });
}

// Serviços: "Saiba mais" abre o detalhe do serviço num <dialog> (o texto já está no HTML e é indexável).
// Fecha no ×, no Esc (nativo) ou no fundo escuro; o botão do modal leva ao formulário com o serviço já escolhido.
document.addEventListener('click', e => {
  const abrir = e.target.closest('[data-modal]');
  if (abrir) {
    e.preventDefault(); // sem JS o link segue para o formulário
    document.getElementById(abrir.dataset.modal)?.showModal();
    return;
  }
  const modal = e.target.closest('.svc-modal');
  if (!modal) return;
  if (e.target === modal || e.target.closest('.svc-modal__close')) modal.close();
  const cta = e.target.closest('[data-servico]');
  if (cta) {
    modal.close();
    const select = document.querySelector('[data-wa-form] [name="servico"]');
    if (select) select.value = cta.dataset.servico;
  }
});

// Mapa: MapLibre (open source) + tiles do OpenFreeMap (grátis, sem chave, sem limite), estilo "dark" — o mesmo
// do Figma. A biblioteca (~280KB) só é baixada quando o mapa chega perto da tela; até lá aparece o pôster.
const mapBox = document.querySelector('.visits__map');
if (mapBox) {
  const VIEW = { center: [-46.585, -23.670], zoom: 12.35 }; // enquadramento do Figma
  const PIN = [-46.5855, -23.672]; // posição do pino no Figma (a Av. do Taboão, 2700 não tem número no OpenStreetMap)
  const LIB = 'https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl';
  const load = (tag, attrs) => new Promise((ok, fail) =>
    document.head.append(Object.assign(document.createElement(tag), attrs, { onload: ok, onerror: fail })));

  new IntersectionObserver(async ([entry], io) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    try {
      await Promise.all([load('link', { rel: 'stylesheet', href: LIB + '.css' }), load('script', { src: LIB + '.js' })]);
    } catch { return; } // sem internet/CDN: fica o pôster
    const map = new maplibregl.Map({
      container: mapBox, style: 'https://tiles.openfreemap.org/styles/dark', ...VIEW,
      cooperativeGestures: true, // rolar a página não dá zoom sem querer (Ctrl + rolagem / dois dedos)
      locale: {
        'Map.Title': 'Mapa',
        'NavigationControl.ZoomIn': 'Aproximar', 'NavigationControl.ZoomOut': 'Afastar',
        'CooperativeGesturesHandler.WindowsHelpText': 'Use Ctrl + rolagem para dar zoom no mapa',
        'CooperativeGesturesHandler.MacHelpText': 'Use ⌘ + rolagem para dar zoom no mapa',
        'CooperativeGesturesHandler.MobileHelpText': 'Use dois dedos para mover o mapa',
      },
    });
    map.on('styleimagemissing', e => map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) })); // textura que o estilo cita mas não traz
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    const pin = document.createElement('div');
    pin.className = 'map-pin';
    pin.innerHTML = '<span>São Bernardo do Campo</span><img src="assets/icon-bolt.svg" alt="">';
    new maplibregl.Marker({ element: pin }).setLngLat(PIN).addTo(map);
    map.once('load', () => mapBox.classList.add('is-ready'));
  }, { rootMargin: '400px' }).observe(mapBox);
}

// Timeline (Como funciona): cada trecho da linha enche quando cruza a linha de leitura (60% da altura da tela);
// quando um trecho completa, o ícone seguinte recebe is-reached (pulso no CSS)
const steps = [...document.querySelectorAll('.how__steps li')];
const segments = steps.slice(0, -1);
if (segments.length && !reduceMotion.matches) {
  const fillTimeline = () => {
    const end = scrollY + innerHeight >= document.documentElement.scrollHeight - 2; // fim da página: completa
    const line = end ? Infinity : innerHeight * .6;
    segments.forEach((li, k) => {
      const top = li.firstElementChild.getBoundingClientRect().bottom; // base do ícone
      const bottom = li.nextElementSibling.getBoundingClientRect().top; // topo do próximo ícone
      const fill = Math.min(1, Math.max(0, (line - top) / (bottom - top)));
      li.style.setProperty('--fill', fill.toFixed(3));
      if (k === 0) li.classList.toggle('is-reached', fill > 0); // o 1º ícone acende quando a linha sai dele
      steps[k + 1].classList.toggle('is-reached', fill >= 1);
    });
  };
  addEventListener('scroll', fillTimeline, { passive: true });
  addEventListener('resize', fillTimeline);
  // a entrada dos passos (translate) mexe na posição medida: recalcula quando ela termina
  document.addEventListener('transitionend', e => e.propertyName === 'translate' && e.target.closest('.how__steps') && fillTimeline());
  fillTimeline();
}

// WhatsApp flutuante: some quando a barra final do rodapé aparece (lá já tem o contato e não cobre o texto)
const waFloat = document.querySelector('.wa-float');
const footerBottom = document.querySelector('.footer__bottom');
if (waFloat && footerBottom) {
  new IntersectionObserver(([e]) => waFloat.classList.toggle('is-hidden', e.isIntersecting)).observe(footerBottom);
}

// Portfólio: filtros por categoria (data-filter do botão × data-cat da foto)
const pfFilters = document.querySelector('.pf-filters');
if (pfFilters) {
  const items = document.querySelectorAll('.pf-grid li');
  pfFilters.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn || btn.getAttribute('aria-pressed') === 'true') return;
    pfFilters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === btn));
    items.forEach(li => {
      li.hidden = btn.dataset.filter !== 'todos' && li.dataset.cat !== btn.dataset.filter;
      li.classList.remove('is-in');
      void li.offsetWidth; // reinicia a entrada
      li.classList.add('is-in');
    });
  });
}

// Contato: o formulário abre o WhatsApp (número em data-phone) com a mensagem já montada
const waForm = document.querySelector('[data-wa-form]');
if (waForm) {
  waForm.addEventListener('submit', e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(waForm));
    const text = [
      `Olá! Meu nome é ${f.nome}.`,
      f.servico && `Serviço: ${f.servico}`,
      f.urgencia && `Urgência: ${f.urgencia}`,
      f.email && `E-mail: ${f.email}`,
      `WhatsApp: ${f.whatsapp}`,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${waForm.dataset.phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
}

// Hero: alterna as 3 fotos; a linha após o número ativo preenche durante o tempo do slide
const slider = document.querySelector('[data-slider]');
if (slider && !reduceMotion.matches) {
  const TIME = 4000;
  const imgs = slider.querySelectorAll('.hero__thumb img');
  const lines = slider.querySelectorAll('.hero__steps i');
  slider.style.setProperty('--slide-time', TIME + 'ms');
  let step = 0;

  const show = () => {
    imgs.forEach((img, i) => img.classList.toggle('is-active', i === step));
    lines.forEach(l => l.classList.remove('is-full', 'is-filling'));
    void slider.offsetWidth; // reinicia a transição da linha
    lines.forEach((l, i) => i < step ? l.classList.add('is-full') : i === step && l.classList.add('is-filling'));
    step = (step + 1) % imgs.length;
  };

  show();
  setInterval(show, TIME);
}

// Entrada dos cards ao rolar: fade + sobe 28px, em cascata de 90ms dentro de cada grupo, uma vez só.
// A classe .entra é posta aqui (não no HTML): sem JS, sem IntersectionObserver ou com "reduzir movimento",
// os cards aparecem normalmente. O carrossel de Serviços fica de fora (tem animação própria e clones).
const gruposEntrada = [
  // Experiência: os ícones entram junto com o card (gatilho), bem antes de as linhas animadas chegarem neles
  { itens: '.experience__list > li', gatilho: '.experience__card' },
  '.problems__list > li',        // Problemas, lista com ícones (4)
  '.why__row--top .why-card',    // Por que a Aziz, linha de cima (3)
  '.why__row--bottom .why-card', // Por que a Aziz, linha de baixo (3)
  '.how__steps > li',            // Como funciona (5)
  '.pf-grid > li',               // Portfólio (8)
  '.about__chips > li',          // Sobre, selos (4)
  '.faq__list > .faq__item',     // Dúvidas frequentes (6)
];
if (!reduceMotion.matches && 'IntersectionObserver' in window) {
  const alvos = new Map(); // elemento observado -> itens que ele faz entrar
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      alvos.get(entrada.target).forEach(el => el.classList.add('entrou'));
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  gruposEntrada.forEach(grupo => {
    const { itens, gatilho } = typeof grupo === 'string' ? { itens: grupo } : grupo;
    const els = [...document.querySelectorAll(itens)];
    els.forEach((el, i) => {
      el.classList.add('entra');
      el.style.setProperty('--entra-i', i); // escalona a entrada dentro do grupo (não é --i: a pilha já usa)
    });
    // com gatilho, um elemento só faz o grupo todo entrar; sem gatilho (ou se ele não existir), cada item se observa
    const g = gatilho && document.querySelector(gatilho);
    (g ? [[g, els]] : els.map(el => [el, [el]])).forEach(([alvo, lista]) => { alvos.set(alvo, lista); observador.observe(alvo); });
  });
}
