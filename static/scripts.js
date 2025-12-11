// IntersectionObserver to add 'in-view' for animation
document.addEventListener('DOMContentLoaded', ()=>{
  const io = new IntersectionObserver((entries)=>{
    entries.forEach((e)=>{
      if(e.isIntersecting){
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    })
  },{threshold:0.12});

  document.querySelectorAll('.fade-up, .stagger').forEach(el=>io.observe(el));

  // Modal open/close delegation
  document.body.addEventListener('click',(ev)=>{
    if(ev.target && ev.target.id==='openModal') document.getElementById('bookingModal')?.classList.add('show');
    if(ev.target && ev.target.id==='closeModal') document.getElementById('bookingModal')?.classList.remove('show');
  });

  // Theme toggle: persist in localStorage and respect prefers-color-scheme
  const THEME_KEY = 'gatician_theme';
  function applyTheme(theme){
    if(!theme) return;
    document.documentElement.setAttribute('data-theme', theme);
    if(theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  }

  function initTheme(){
    const saved = localStorage.getItem(THEME_KEY);
    if(saved){ applyTheme(saved); return; }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
  initTheme();
  const toggles = Array.from(document.querySelectorAll('.theme-toggle'));
  function updateToggleStates(){
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    toggles.forEach(btn=>btn.setAttribute('data-state', current));
  }
  updateToggleStates();
  toggles.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
      updateToggleStates();
    });
  });

  // Simple testimonials carousel
  (function initCarousel(){
    const carousel = document.getElementById('testimonialsCarousel');
    if(!carousel) return;
    const slidesWrap = carousel.querySelector('.slides');
    const slides = Array.from(slidesWrap.children);
    const dotsWrap = document.getElementById('testDots');
    let idx = 0;

    function show(i){
      i = (i + slides.length) % slides.length;
      slides.forEach((s,si)=>{ s.style.transform = `translateX(${(si - i) * 100}%)`; });
      updateDots(i);
      idx = i;
    }

    function updateDots(i){
      if(!dotsWrap) return;
      dotsWrap.innerHTML = '';
      slides.forEach((_,si)=>{
        const b = document.createElement('button');
        b.addEventListener('click', ()=>show(si));
        if(si===i) b.classList.add('active');
        dotsWrap.appendChild(b);
      });
    }

    // initial placement
    slides.forEach((s,si)=>{ s.style.transition='transform .5s ease'; s.style.transform = `translateX(${si * 100}%)`; });
    show(0);

    // auto-advance
    let auto = setInterval(()=> show(idx+1), 4500);
    carousel.addEventListener('mouseenter', ()=> clearInterval(auto));
    carousel.addEventListener('mouseleave', ()=> auto = setInterval(()=> show(idx+1), 4500));
  })();

  // Header lookup widget (home page) toggle and behavior
  (function initHeaderLookup(){
    const lookupLink = document.getElementById('lookupLink');
    if(!lookupLink) return;

    // create widget HTML and insert into body
    const widget = document.createElement('div');
    widget.id = 'headerLookup';
    widget.className = 'header-lookup';
    widget.innerHTML = `
      <div class="title">Quick Transporter Lookup</div>
      <div class="subtitle">Search by company, location, or phone.</div>
      <div class="row">
        <div class="inputs">
          <input id="header_q" class="search-input" placeholder="Search company, location or mobile" />
          <input id="header_mobile" class="phone-input" placeholder="Enter mobile or landline" />
        </div>
        <div class="stacked">
          <button id="header_search" class="btn">Search</button>
          <button id="header_lookup" class="btn secondary">Lookup</button>
        </div>
      </div>
      <div id="header_results" class="results"></div>
    `;
    document.body.appendChild(widget);

    function showWidget(){ widget.classList.add('show'); }
    function hideWidget(){ widget.classList.remove('show'); }

    // clicking the nav link: on home page toggle widget, otherwise follow link
    lookupLink.addEventListener('click', (ev)=>{
      if(window.location.pathname === '/' || window.location.pathname === ''){
        ev.preventDefault();
        if(widget.classList.contains('show')) hideWidget(); else showWidget();
      }
      // else allow navigation to /lookup
    });

    // close when clicking outside
    document.addEventListener('click', (ev)=>{
      if(!widget.classList.contains('show')) return;
      if(ev.target.closest('.header-lookup') || ev.target.closest('#lookupLink')) return;
      hideWidget();
    });

    // search handlers
    async function headerDoSearch(){
      const q = (document.getElementById('header_q')||{}).value || '';
      if(!q) return;
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=30`);
      const data = await res.json(); renderHeaderResults(data);
    }
    async function headerDoLookup(){
      const m = (document.getElementById('header_mobile')||{}).value || '';
      if(!m) return;
      const res = await fetch(`/api/lookup?mobile=${encodeURIComponent(m)}`);
      if(res.status===200){ renderHeaderResults([await res.json()]); } else { renderHeaderResults([]); }
    }
    function renderHeaderResults(items){
      const out = document.getElementById('header_results'); if(!out) return;
      if(!items || items.length===0){ out.innerHTML = '<div class="small muted">No results</div>'; return; }
      let html = '<div style="display:grid;gap:8px">';
      items.slice(0,6).forEach(it=>{
        html += `<div style="padding:8px;border-radius:8px;background:#fbfdff;border:1px solid rgba(11,103,208,0.04)"><div style="font-weight:700">${escapeHtml(it.name)}</div><div class="small muted">${escapeHtml(it.category)} • ${escapeHtml(it.region)}</div><div class="small" style="margin-top:6px">${escapeHtml(it.contact_person)} • <strong>${formatPhone(it.mobile)}</strong></div></div>`;
      });
      html += '</div>';
      out.innerHTML = html;
    }

    document.addEventListener('click', (ev)=>{
      if(ev.target && ev.target.id==='header_search') headerDoSearch();
      if(ev.target && ev.target.id==='header_lookup') headerDoLookup();
    });
  })();

  // Nav toggle for mobile
  (function initNavToggle(){
    const toggles = Array.from(document.querySelectorAll('.nav-toggle'));
    toggles.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        // find sibling nav-list
        const nav = btn.parentElement.querySelector('.nav-list');
        if(!nav) return;
        nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', nav.classList.contains('open'));
      });
    });
    // close nav when clicking outside on mobile
    document.addEventListener('click', (ev)=>{
      if(window.innerWidth > 860) return;
      const navs = document.querySelectorAll('.nav-list.open');
      navs.forEach(nav=>{
        if(ev.target.closest('.site-nav') !== nav.parentElement){
          nav.classList.remove('open');
        }
      });
    });
  })();
});
