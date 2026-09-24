  (function(){
    "use strict";

    /* ---------- 1. Шапка: тень при скролле ---------- */
    var header = document.getElementById('site-header');
    var toTopBtn = document.getElementById('to-top');

    function onScroll(){
      var scrolled = window.scrollY > 20;
      header.classList.toggle('scrolled', scrolled);
      toTopBtn.classList.toggle('show', window.scrollY > 480);
    }
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    toTopBtn.addEventListener('click', function(){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* ---------- 2. Мобильное меню ---------- */
    var burger = document.getElementById('burger');
    var navList = document.getElementById('nav-list');

    burger.addEventListener('click', function(){
      var isOpen = navList.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
    });

    navList.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', function(){
        navList.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });

    /* ---------- 3. Подсветка активного пункта меню при скролле ---------- */
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
    var sections = navLinks
      .map(function(link){ return document.querySelector(link.getAttribute('href')); })
      .filter(Boolean);

    var sectionObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          var id = '#' + entry.target.id;
          navLinks.forEach(function(link){
            link.classList.toggle('active', link.getAttribute('href') === id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function(section){ sectionObserver.observe(section); });

    /* ---------- 4. Появление блоков при скролле ---------- */
    var revealObserver = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(function(el){ revealObserver.observe(el); });

    /* ---------- 5. Анимация чисел в блоке «О нас» ---------- */
    var counters = document.querySelectorAll('.counter');
    var countersObserver = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-target'));
        var decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
        var duration = 1200;
        var start = null;

        function step(ts){
          if (start === null) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var value = target * progress;
          el.textContent = value.toFixed(decimals);
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target.toFixed(decimals);
        }
        requestAnimationFrame(step);
        obs.unobserve(el);
      });
    }, { threshold: 0.6 });

    counters.forEach(function(el){ countersObserver.observe(el); });

    /* ---------- 6. Меню: калькулятор суммы заказа + добавление позиции из карточки ---------- */
    var orderItemSelect = document.getElementById('order-item');
    var orderQtyInput = document.getElementById('order-qty');
    var orderTotalValue = document.getElementById('order-total-value');
    var qtyMinus = document.getElementById('qty-minus');
    var qtyPlus = document.getElementById('qty-plus');

    function updateOrderTotal(){
      var price = parseFloat(orderItemSelect.selectedOptions[0].getAttribute('data-price')) || 0;
      var qty = parseInt(orderQtyInput.value, 10) || 1;
      orderTotalValue.textContent = (price * qty) + ' ₽';
    }

    orderItemSelect.addEventListener('change', updateOrderTotal);
    orderQtyInput.addEventListener('input', updateOrderTotal);

    qtyMinus.addEventListener('click', function(){
      var val = Math.max(1, (parseInt(orderQtyInput.value, 10) || 1) - 1);
      orderQtyInput.value = val;
      updateOrderTotal();
    });
    qtyPlus.addEventListener('click', function(){
      var val = (parseInt(orderQtyInput.value, 10) || 1) + 1;
      orderQtyInput.value = val;
      updateOrderTotal();
    });

    updateOrderTotal();

    document.querySelectorAll('.menu-card-add').forEach(function(btn){
      btn.addEventListener('click', function(){
        var card = btn.closest('.menu-card');
        var name = card.getAttribute('data-name');

        Array.prototype.forEach.call(orderItemSelect.options, function(opt){
          if (opt.textContent.indexOf(name) === 0){ opt.selected = true; }
        });

        updateOrderTotal();

        btn.classList.add('added');
        btn.textContent = 'Добавлено ✓';
        setTimeout(function(){
          btn.classList.remove('added');
          btn.textContent = 'В заказ';
        }, 1400);

        document.getElementById('order').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    /* ---------- 7. Валидация и отправка форм (демо, без реального бэкенда) ---------- */
    function validateForm(form){
      var valid = true;
      form.querySelectorAll('[required]').forEach(function(input){
        var field = input.closest('.field') || input.parentElement;
        var ok = input.value.trim().length > 0;

        if (input.type === 'tel' && ok){
          var digits = input.value.replace(/\D/g, '');
          ok = digits.length >= 10;
        }

        if (field && field.classList.contains('field')){
          field.classList.toggle('has-error', !ok);
        }
        if (!ok) valid = false;
      });
      return valid;
    }

    function handleSubmit(formId, successId){
      var form = document.getElementById(formId);
      var success = document.getElementById(successId);

      form.addEventListener('submit', function(e){
        e.preventDefault();
        success.classList.remove('show');

        if (!validateForm(form)) return;

        success.classList.add('show');
        var submitBtn = form.querySelector('button[type="submit"]');
        var originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправляем…';

        setTimeout(function(){
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          form.reset();
          if (formId === 'order-form') updateOrderTotal();
          form.querySelectorAll('.field.has-error').forEach(function(f){ f.classList.remove('has-error'); });
        }, 900);
      });

      form.querySelectorAll('input[required]').forEach(function(input){
        input.addEventListener('input', function(){
          var field = input.closest('.field');
          if (field) field.classList.remove('has-error');
        });
      });
    }

    handleSubmit('order-form', 'order-success');
    handleSubmit('booking-form', 'booking-success');

    /* ---------- 8. Слайдер отзывов ---------- */
    var slidesWrap = document.getElementById('reviews-slides');
    var slides = Array.prototype.slice.call(slidesWrap.children);
    var dotsWrap = document.getElementById('reviews-dots');
    var prevBtn = document.getElementById('review-prev');
    var nextBtn = document.getElementById('review-next');
    var current = 0;
    var autoTimer;

    slides.forEach(function(_, i){
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Отзыв ' + (i + 1));
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', function(){ goTo(i); resetAuto(); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function goTo(index){
      current = (index + slides.length) % slides.length;
      slidesWrap.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.forEach(function(d, i){ d.classList.toggle('active', i === current); });
    }

    prevBtn.addEventListener('click', function(){ goTo(current - 1); resetAuto(); });
    nextBtn.addEventListener('click', function(){ goTo(current + 1); resetAuto(); });

    function resetAuto(){
      clearInterval(autoTimer);
      autoTimer = setInterval(function(){ goTo(current + 1); }, 6000);
    }
    resetAuto();

    /* ---------- 9. Переключатель тёмной темы (сохраняется в localStorage) ---------- */
    var themeToggle = document.getElementById('theme-toggle');
    var root = document.documentElement;
    var THEME_KEY = 'michelle-coffee-theme';

    function applyTheme(theme){
      if (theme === 'dark'){ root.setAttribute('data-theme', 'dark'); }
      else { root.removeAttribute('data-theme'); }
    }

    var savedTheme = null;
    try { savedTheme = localStorage.getItem(THEME_KEY); } catch (e) { /* localStorage недоступен — используем тему по умолчанию */ }

    if (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
      savedTheme = 'dark';
    }
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', function(){
      var isDark = root.getAttribute('data-theme') === 'dark';
      var next = isDark ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* тема просто не сохранится между визитами */ }
    });

    /* ---------- 10. Фильтр меню по категориям ---------- */
    var filterButtons = document.querySelectorAll('.menu-filter');
    var menuCards = document.querySelectorAll('#menu-grid .menu-card');

    filterButtons.forEach(function(btn){
      btn.addEventListener('click', function(){
        filterButtons.forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');

        var filter = btn.getAttribute('data-filter');
        menuCards.forEach(function(card){
          var match = filter === 'all' || card.getAttribute('data-category') === filter;
          card.classList.toggle('is-hidden', !match);
        });
      });
    });

  })();
  
