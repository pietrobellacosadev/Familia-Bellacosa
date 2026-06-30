/* =====================================================
   FAMÍLIA BELLACOSA — APP UNIFICADO
   Todos os módulos em um único arquivo.
===================================================== */

(function () {
  "use strict";

  /* ===================================================
     UTILS
  ================================================== */
  const Utils = {
    qs: (selector, scope = document) => scope.querySelector(selector),
    qsa: (selector, scope = document) =>
      Array.from(scope.querySelectorAll(selector)),

    formatBRL(value) {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    },

    debounce(fn, wait = 120) {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
      };
    },

    escapeHTML(str) {
      const div = document.createElement("div");
      div.textContent = String(str ?? "");
      return div.innerHTML;
    },

    onReady(fn) {
      if (document.readyState !== "loading") fn();
      else document.addEventListener("DOMContentLoaded", fn);
    },
  };

  /* ===================================================
     TOAST (feedback visual)
  ================================================== */
  const Toast = (() => {
    const container = Utils.qs("#toastContainer");

    function show(message, type = "info", duration = 4200) {
      if (!container) return;

      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.setAttribute("role", "alert");

      const iconName =
        type === "error"
          ? "alert-circle"
          : type === "success"
            ? "check-circle"
            : "info";

      toast.innerHTML = `
        <i data-lucide="${iconName}" aria-hidden="true"></i>
        <span>${Utils.escapeHTML(message)}</span>
        <button class="toast-close" aria-label="Fechar notificação">
          <i data-lucide="x" aria-hidden="true"></i>
        </button>
      `;

      container.appendChild(toast);
      if (window.lucide) window.lucide.createIcons();

      requestAnimationFrame(() => toast.classList.add("show"));

      const remove = () => {
        toast.classList.remove("show");
        toast.addEventListener("transitionend", () => toast.remove(), {
          once: true,
        });
      };

      const timeoutId = setTimeout(remove, duration);
      toast.querySelector(".toast-close")?.addEventListener("click", () => {
        clearTimeout(timeoutId);
        remove();
      });
    }

    return {
      info: (msg) => show(msg, "info"),
      success: (msg) => show(msg, "success"),
      error: (msg) => show(msg, "error"),
    };
  })();

  /* ===================================================
     UI — interações globais
  ================================================== */
  const UI = {
    initLoader() {
      // Removido
    },

    initIcons() {
      if (window.lucide) window.lucide.createIcons();
    },

    initMobileMenu() {
      const toggle = Utils.qs(".mobile-toggle");
      const menu = Utils.qs(".mobile-menu");
      if (!toggle || !menu) return;

      const close = () => {
        toggle.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("active");
        document.body.classList.remove("menu-open");
      };

      toggle.addEventListener("click", () => {
        const isActive = toggle.classList.toggle("active");
        toggle.setAttribute("aria-expanded", String(isActive));
        menu.classList.toggle("active", isActive);
        document.body.classList.toggle("menu-open", isActive);
      });

      Utils.qsa("a", menu).forEach((link) =>
        link.addEventListener("click", close),
      );

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menu.classList.contains("active")) close();
      });
    },

    initHeaderAndActiveNav() {
      const header = Utils.qs(".header");
      const navLinks = Utils.qsa(".menu a");
      const sections = Utils.qsa("section[id]");

      if (header) {
        const onScroll = Utils.debounce(() => {
          header.classList.toggle("scrolled", window.scrollY > 50);
        }, 10);
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      }

      if (
        sections.length &&
        navLinks.length &&
        "IntersectionObserver" in window
      ) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const id = entry.target.getAttribute("id");
              navLinks.forEach((link) => {
                link.classList.toggle(
                  "active",
                  link.getAttribute("href") === `#${id}`,
                );
              });
            });
          },
          { rootMargin: "-45% 0px -50% 0px" },
        );
        sections.forEach((section) => observer.observe(section));
      }

      const logo = Utils.qs(".logo");
      logo?.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    },

    initSmoothScroll() {
      if (typeof Lenis === "undefined") return;
      const lenis = new Lenis({ smoothWheel: true, duration: 1.2 });
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    },

    initScrollAnimations() {
      if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined")
        return;
      gsap.registerPlugin(ScrollTrigger);

      if (Utils.qs(".hero")) {
        gsap.to(".hero-overlay", {
          scale: 1.05,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      const revealItems = gsap.utils.toArray(`
        .authority-card,
        .product-card,
        .testimonial-card,
        .process article,
        .about-content,
        .about-image,
        .contact-grid
      `);

      revealItems.forEach((item, index) => {
        gsap.from(item, {
          opacity: 0,
          y: 70,
          duration: 1.1,
          ease: "power3.out",
          delay: (index % 4) * 0.05,
          scrollTrigger: {
            trigger: item,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });

      gsap.utils.toArray(".section-heading").forEach((heading) => {
        gsap.from(heading, {
          opacity: 0,
          y: 40,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: heading, start: "top 80%" },
        });
      });
    },

    initMagneticButtons() {
      if (typeof gsap === "undefined") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.matchMedia("(pointer: coarse)").matches) return;

      Utils.qsa(".btn-primary, .btn-secondary").forEach((button) => {
        button.addEventListener("mousemove", (e) => {
          const rect = button.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          gsap.to(button, {
            x: x * 0.15,
            y: y * 0.15,
            duration: 0.3,
            ease: "power2.out",
          });
        });
        button.addEventListener("mouseleave", () => {
          gsap.to(button, { x: 0, y: 0, duration: 0.4, ease: "power2.out" });
        });
      });
    },

    shakeCartIcon() {
      const icon = Utils.qs(".cart-toggle i");
      if (!icon) return;
      icon.style.animation = "shake 0.4s ease";
      icon.addEventListener("animationend", () => {
        icon.style.animation = "";
      }, { once: true });
    },

    initSwiperCarousels() {
      if (typeof Swiper === "undefined") return;

      // Depoimentos (carrossel apenas mobile)
      new Swiper(".testimonial-swiper", {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: true,
        autoplay: {
          delay: 5000,
          disableOnInteraction: true,
        },
        pagination: {
          el: ".testimonial-pagination",
          clickable: true,
        },
        // Sem navegação (setas)
      });

      // Autoridade (diferenciais) - carrossel apenas mobile
      new Swiper(".authority-swiper", {
        slidesPerView: 1,
        spaceBetween: 16,
        loop: true,
        autoplay: {
          delay: 4000,
          disableOnInteraction: true,
        },
        pagination: {
          el: ".authority-pagination",
          clickable: true,
        },
      });

      // Processo - carrossel apenas mobile
      new Swiper(".process-swiper", {
        slidesPerView: 1,
        spaceBetween: 16,
        loop: true,
        autoplay: {
          delay: 4000,
          disableOnInteraction: true,
        },
        pagination: {
          el: ".process-pagination",
          clickable: true,
        },
      });
    },
  };

  /* ===================================================
     PRODUTOS (catálogo)
  ================================================== */
  const produtos = [
    {
      id: 1,
      nome: "Misto Quente",
      descricao: "Mussarela, presunto, tomate fresco e requeijão cremoso.",
      preco: 49.0,
      tag: "Artesanal",
      imagem:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 2,
      nome: "Frango",
      descricao: "Frango desfiado temperado, mussarela e requeijão cremoso.",
      preco: 49.0,
      tag: "Especial",
      imagem:
        "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 3,
      nome: "Hot Dog",
      descricao:
        "Mussarela, molho de tomate, salsicha, tomate e requeijão cremoso.",
      preco: 51.0,
      tag: "Vegetariano",
      imagem:
        "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 4,
      nome: "Calabresa",
      descricao:
        "Calabresa defumada, mussarela, cebola, tomate e requeijão cremoso.",
      preco: 51.0,
      tag: "Premium",
      imagem:
        "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 5,
      nome: "Carne",
      descricao: "Carne moída temperada, tomate, cebola e requeijão cremoso.",
      preco: 52.0,
      tag: "Premium",
      imagem:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 6,
      nome: "Carne com Ovo",
      descricao: "Carne temperada com limão, ovo, tomate e requeijão cremoso.",
      preco: 52.0,
      tag: "Premium",
      imagem:
        "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 7,
      nome: "Dois Queijos",
      descricao: "Mussarela, provolone, tomate fresco, manjericão e requeijão.",
      preco: 51.0,
      tag: "Especial",
      imagem:
        "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 8,
      nome: "Portuguesa",
      descricao:
        "Presunto, mussarela, tomate, cebola, ovo e requeijão cremoso.",
      preco: 52.0,
      tag: "Premium",
      imagem:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  function findProduto(id) {
    return produtos.find((p) => p.id === id);
  }

  function renderProducts() {
    const grid = Utils.qs("#productsGrid");
    if (!grid) return;

    grid.innerHTML = produtos
      .map(
        (p) => `
      <article class="product-card" data-id="${p.id}">
        <div class="product-image">
          <img src="${p.imagem}" alt="${Utils.escapeHTML(p.nome)}" loading="lazy" width="600" height="450" />
        </div>
        <div class="product-content">
          <span class="product-tag">${Utils.escapeHTML(p.tag)}</span>
          <h3>${Utils.escapeHTML(p.nome)}</h3>
          <div class="product-price">${Utils.formatBRL(p.preco)}</div>
          <p>${Utils.escapeHTML(p.descricao)}</p>
          <button class="btn-add" data-id="${p.id}" type="button">Adicionar ao Carrinho</button>
        </div>
      </article>
    `,
      )
      .join("");
  }

  /* ===================================================
     CARRINHO (estado + UI)
  ================================================== */
  const Cart = (() => {
    const STORAGE_KEY = "bellacosa:cart";
    let items = loadFromStorage();
    const els = {};

    function loadFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Fallback silencioso
      }
    }

    function getTotal() {
      return items.reduce((sum, item) => sum + item.preco * item.quantity, 0);
    }

    function getItemCount() {
      return items.reduce((sum, item) => sum + item.quantity, 0);
    }

    function cacheElements() {
      Object.assign(els, {
        toggle: Utils.qs("#cartToggle"),
        close: Utils.qs("#cartClose"),
        overlay: Utils.qs("#cartOverlay"),
        sidebar: Utils.qs("#cartSidebar"),
        list: Utils.qs("#cartItems"),
        total: Utils.qs("#cartTotal"),
        count: Utils.qs("#cartCount"),
        checkoutBtn: Utils.qs("#checkoutBtn"),
      });
    }

    function render() {
      persist();

      const count = getItemCount();
      if (els.count) els.count.textContent = String(count);
      if (els.total) els.total.textContent = Utils.formatBRL(getTotal());

      if (!els.list) return;

      if (items.length === 0) {
        els.list.innerHTML = `
          <div class="cart-empty">
            <i data-lucide="shopping-cart" aria-hidden="true"></i>
            <p>Seu carrinho está vazio</p>
            <p class="cart-empty-hint">Adicione produtos para começar</p>
          </div>
        `;
      } else {
        els.list.innerHTML = items
          .map(
            (item) => `
          <div class="cart-item">
            <div class="cart-item-image">
              <img src="${item.imagem}" alt="${Utils.escapeHTML(item.nome)}" width="60" height="60" />
            </div>
            <div class="cart-item-info">
              <h4>${Utils.escapeHTML(item.nome)}</h4>
              <div class="cart-item-price">${Utils.formatBRL(item.preco)}</div>
              <div class="cart-item-actions">
                <button class="qty-dec" data-id="${item.id}" type="button" aria-label="Diminuir quantidade">−</button>
                <span aria-live="polite">${item.quantity}</span>
                <button class="qty-inc" data-id="${item.id}" type="button" aria-label="Aumentar quantidade">+</button>
                <button class="cart-item-remove" data-id="${item.id}" type="button" aria-label="Remover">✕</button>
              </div>
            </div>
          </div>
        `,
          )
          .join("");

        Utils.qsa(".qty-inc", els.list).forEach((btn) =>
          btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            const item = items.find((i) => i.id === id);
            if (item) setQuantity(id, item.quantity + 1);
          }),
        );
        Utils.qsa(".qty-dec", els.list).forEach((btn) =>
          btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            const item = items.find((i) => i.id === id);
            if (item) setQuantity(id, item.quantity - 1);
          }),
        );
        Utils.qsa(".cart-item-remove", els.list).forEach((btn) =>
          btn.addEventListener("click", () => remove(Number(btn.dataset.id))),
        );
      }

      UI.initIcons();
      Checkout.syncWithCart();
    }

    function add(id, sourceButton) {
      const produto = findProduto(id);
      if (!produto) return;

      const existing = items.find((item) => item.id === id);
      if (existing) {
        existing.quantity += 1;
      } else {
        items.push({ ...produto, quantity: 1 });
      }

      if (sourceButton) {
        const originalText = sourceButton.textContent;
        sourceButton.textContent = "✓ Adicionado!";
        sourceButton.classList.add("added");
        setTimeout(() => {
          sourceButton.textContent = originalText;
          sourceButton.classList.remove("added");
        }, 1200);
      }

      render();
      UI.shakeCartIcon();
      Toast.success(`${produto.nome} adicionado ao carrinho.`);
    }

    function setQuantity(id, quantity) {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      if (quantity <= 0) {
        items = items.filter((i) => i.id !== id);
      } else {
        item.quantity = quantity;
      }
      render();
    }

    function remove(id) {
      items = items.filter((i) => i.id !== id);
      render();
    }

    function clear() {
      items = [];
      render();
    }

    function open() {
      if (!els.overlay || !els.sidebar) return;
      els.overlay.classList.add("active");
      els.sidebar.classList.add("active");
      document.body.style.overflow = "hidden";
      els.close?.focus();
    }

    function close() {
      if (!els.overlay || !els.sidebar) return;
      els.overlay.classList.remove("active");
      els.sidebar.classList.remove("active");
      document.body.style.overflow = "";
    }

    function isOpen() {
      return els.sidebar?.classList.contains("active") ?? false;
    }

    function init() {
      cacheElements();
      render();

      els.toggle?.addEventListener("click", open);
      els.close?.addEventListener("click", close);
      els.overlay?.addEventListener("click", close);

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen()) close();
      });

      document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-add");
        if (btn) {
          const id = Number(btn.dataset.id);
          if (id) add(id, btn);
        }
      });
    }

    return {
      init,
      add,
      remove,
      setQuantity,
      clear,
      open,
      close,
      isOpen,
      get items() {
        return items;
      },
      getTotal,
      getItemCount,
    };
  })();

  /* ===================================================
     CHECKOUT (stepper + envio WhatsApp)
  ================================================== */
  const Checkout = (() => {
    const WHATSAPP_NUMBER = "551936292378";
    let currentStep = 1;
    const els = {};

    function cacheElements() {
      Object.assign(els, {
        overlay: Utils.qs("#checkoutOverlay"),
        modal: Utils.qs("#checkoutModal"),
        close: Utils.qs("#checkoutClose"),
        openBtn: Utils.qs("#checkoutBtn"),
        steps: Utils.qsa(".checkout-step"),
        stepperSteps: Utils.qsa(".stepper .step"),
        nextButtons: Utils.qsa(".next-step"),
        prevButtons: Utils.qsa(".prev-step"),
        confirmBtn: Utils.qs("#confirmOrder"),
        items: Utils.qs("#checkoutItems"),
        subtotal: Utils.qs("#checkoutSubtotal"),
        summary: Utils.qs("#confirmationSummary"),
        nomeInput: Utils.qs("#checkoutNome"),
        nomeError: Utils.qs("#checkoutNomeError"),
        cep: Utils.qs("#cep"),
        cepError: Utils.qs("#cepError"),
        cepSearch: Utils.qs("#cepSearch"),
        endereco: Utils.qs("#endereco"),
        enderecoError: Utils.qs("#enderecoError"),
        numero: Utils.qs("#numero"),
        numeroError: Utils.qs("#numeroError"),
        bairro: Utils.qs("#bairro"),
        bairroError: Utils.qs("#bairroError"),
        cidade: Utils.qs("#cidade"),
        complemento: Utils.qs("#complemento"),
      });
    }

    // Campos obrigatórios de endereço, com seu respectivo span de erro
    const ADDRESS_FIELDS = [
      { key: "cep", message: "Informe o CEP." },
      { key: "endereco", message: "Informe a rua." },
      { key: "numero", message: "Informe o número." },
      { key: "bairro", message: "Informe o bairro." },
    ];

    function setFieldError(input, errorEl, message) {
      const valid = !message;
      input?.setAttribute("aria-invalid", String(!valid));
      if (errorEl) errorEl.textContent = message || "";
      return valid;
    }

    function open() {
      if (Cart.getItemCount() === 0) {
        Toast.info(
          "Seu carrinho está vazio. Adicione produtos antes de finalizar.",
        );
        return;
      }
      if (!els.overlay || !els.modal) return;

      els.overlay.classList.add("active");
      els.modal.classList.add("active");
      document.body.style.overflow = "hidden";
      currentStep = 1;
      showStep(1);
      renderItems();

      els.close?.focus();
    }

    function close() {
      els.overlay?.classList.remove("active");
      els.modal?.classList.remove("active");
      document.body.style.overflow = Cart.isOpen() ? "hidden" : "";
    }

    function showStep(step) {
      els.steps.forEach((s, index) =>
        s.classList.toggle("active", index + 1 === step),
      );
      els.stepperSteps.forEach((s, index) => {
        const num = index + 1;
        const reachable = num <= step;
        s.classList.toggle("active", num === step);
        s.classList.toggle("done", num < step);
        if (num === step) s.setAttribute("aria-current", "step");
        else s.removeAttribute("aria-current");

        // Permite voltar para etapas já concluídas com clique/teclado
        if (reachable) {
          s.setAttribute("tabindex", "0");
          s.setAttribute("role", "button");
        } else {
          s.removeAttribute("tabindex");
          s.removeAttribute("role");
        }
      });
      currentStep = step;

      const activeStep = els.steps[step - 1];
      const heading = activeStep?.querySelector("h3");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }

      if (step === 3) updateSummary();
    }

    function renderItems() {
      if (!els.items) return;
      const items = Cart.items;

      if (items.length === 0) {
        els.items.innerHTML = "<p>Carrinho vazio</p>";
        if (els.subtotal) els.subtotal.textContent = Utils.formatBRL(0);
        return;
      }

      els.items.innerHTML = items
        .map(
          (item) => `
        <div class="checkout-item">
          <span>${Utils.escapeHTML(item.nome)} x ${item.quantity}</span>
          <span>${Utils.formatBRL(item.preco * item.quantity)}</span>
        </div>
      `,
        )
        .join("");

      if (els.subtotal)
        els.subtotal.textContent = Utils.formatBRL(Cart.getTotal());
    }

    function syncWithCart() {
      if (els.modal?.classList.contains("active")) renderItems();
    }

    function validateName() {
      const value = els.nomeInput?.value.trim() ?? "";
      const valid = value.length >= 3;
      els.nomeInput?.setAttribute("aria-invalid", String(!valid));
      if (els.nomeError) {
        els.nomeError.textContent = valid ? "" : "Digite seu nome completo.";
      }
      return valid;
    }

    function validateDelivery() {
      const delivery = Utils.qs('input[name="delivery"]:checked');
      if (!delivery) {
        Toast.error("Selecione uma opção de entrega.");
        return false;
      }
      // Retirada: limpa eventuais erros pendentes do formulário de entrega
      if (delivery.value !== "entrega") {
        ADDRESS_FIELDS.forEach(({ key }) =>
          setFieldError(els[key], els[`${key}Error`], ""),
        );
        return true;
      }

      let valid = true;
      ADDRESS_FIELDS.forEach(({ key, message }) => {
        const filled = (els[key]?.value.trim() ?? "") !== "";
        if (!setFieldError(els[key], els[`${key}Error`], filled ? "" : message))
          valid = false;
      });

      if (!valid) Toast.error("Preencha os campos obrigatórios de entrega.");
      return valid;
    }

    function validatePayment() {
      const payment = Utils.qs('input[name="payment"]:checked');
      if (!payment) {
        Toast.error("Selecione um método de pagamento.");
        return false;
      }
      return true;
    }

    async function searchCEP() {
      const raw = els.cep?.value.replace(/\D/g, "") ?? "";
      if (raw.length !== 8) {
        setFieldError(els.cep, els.cepError, "CEP inválido. Digite 8 números.");
        return;
      }

      els.cepSearch?.setAttribute("aria-busy", "true");
      try {
        const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await response.json();

        if (data.erro) {
          setFieldError(els.cep, els.cepError, "CEP não encontrado.");
          return;
        }

        setFieldError(els.cep, els.cepError, "");
        if (els.endereco) els.endereco.value = data.logradouro || "";
        if (els.bairro) els.bairro.value = data.bairro || "";
        if (els.cidade) els.cidade.value = data.localidade || "";
        els.numero?.focus();
        Toast.success("CEP encontrado com sucesso.");
      } catch {
        setFieldError(els.cep, els.cepError, "Erro ao buscar CEP. Tente novamente.");
      } finally {
        els.cepSearch?.removeAttribute("aria-busy");
      }
    }

    function buildWhatsAppMessage(nomeCliente) {
      const produtosText = Cart.items
        .map(
          (item) =>
            `${item.nome} x ${item.quantity} = ${Utils.formatBRL(item.preco * item.quantity)}`,
        )
        .join("\n");

      const isDelivery =
        Utils.qs('input[name="delivery"]:checked')?.value === "entrega";
      let enderecoBloco = "";
      if (isDelivery) {
        enderecoBloco = `
Endereço: ${els.endereco?.value || "Não informado"}, ${els.numero?.value || "S/N"}
Bairro: ${els.bairro?.value || "Não informado"}
Cidade: ${els.cidade?.value || "Não informado"}
CEP: ${els.cep?.value || "Não informado"}
Complemento: ${els.complemento?.value || "N/A"}`;
      }

      const payment = Utils.qs('input[name="payment"]:checked');
      const paymentLabel = payment
        ? { pix: "PIX", cartao: "Cartão", dinheiro: "Dinheiro" }[
            payment.value
          ] || payment.value
        : "Não definido";

      return `🍽️ NOVO PEDIDO - FAMÍLIA BELLACOSA

👤 Cliente: ${nomeCliente}

📦 Produtos:
${produtosText}

💰 Total: ${Utils.formatBRL(Cart.getTotal())}

📦 Entrega: ${isDelivery ? "Entrega" : "Retirada"}${enderecoBloco}

💳 Pagamento: ${paymentLabel}

✅ Pedido confirmado! Aguardamos seu contato.`;
    }

    let isSubmitting = false;

    function submitOrder() {
      if (isSubmitting) return;
      if (!validateName()) {
        els.nomeInput?.focus();
        Toast.error("Por favor, digite seu nome completo.");
        return;
      }
      if (!validateDelivery()) return;
      if (!validatePayment()) return;

      isSubmitting = true;
      els.confirmBtn?.setAttribute("disabled", "true");

      const nomeCliente = els.nomeInput.value.trim();
      const mensagem = buildWhatsAppMessage(nomeCliente);
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;

      window.open(url, "_blank", "noopener,noreferrer");

      Cart.clear();
      close();
      Toast.success("Pedido enviado! Você será redirecionado ao WhatsApp.");
      isSubmitting = false;
      els.confirmBtn?.removeAttribute("disabled");
    }

    function updateSummary() {
      if (!els.summary) return;
      const delivery = Utils.qs('input[name="delivery"]:checked');
      const isDelivery = delivery?.value === "entrega";
      const total = Cart.getTotal();

      const payment = Utils.qs('input[name="payment"]:checked');
      const paymentLabel = payment
        ? { pix: "PIX", cartao: "Cartão", dinheiro: "Dinheiro" }[
            payment.value
          ] || payment.value
        : "Não definido";

      els.summary.innerHTML = `
        <p><span>Produtos</span> <span>${Cart.getItemCount()} itens</span></p>
        <p><span>Subtotal</span> <span>${Utils.formatBRL(total)}</span></p>
        <p><span>Entrega</span> <span>${isDelivery ? "Entrega" : "Retirada"}</span></p>
        ${
          isDelivery
            ? `<p><span>Endereço</span> <span class="address-line">${Utils.escapeHTML(
                `${els.endereco?.value || ""}, ${els.numero?.value || "S/N"} - ${els.bairro?.value || ""}, ${els.cidade?.value || ""} - CEP: ${els.cep?.value || ""}`,
              )}</span></p>`
            : ""
        }
        <p><span>Pagamento</span> <span>${paymentLabel}</span></p>
        <p><strong>Total</strong> <strong>${Utils.formatBRL(total)}</strong></p>
      `;
    }

    function bindEvents() {
      els.openBtn?.addEventListener("click", open);
      els.close?.addEventListener("click", close);
      els.overlay?.addEventListener("click", close);

      els.prevButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          showStep(Number(btn.dataset.prev));
        });
      });

      els.nextButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const next = Number(btn.dataset.next);

          if (currentStep === 2 && !validateName()) {
            els.nomeInput?.focus();
            return;
          }
          if (currentStep === 2 && !validateDelivery()) return;

          showStep(next);
        });
      });

      // Stepper clicável: só permite voltar para etapas já concluídas
      els.stepperSteps.forEach((stepEl, index) => {
        const num = index + 1;
        const goToStep = () => {
          if (num <= currentStep) showStep(num);
        };
        stepEl.addEventListener("click", goToStep);
        stepEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToStep();
          }
        });
      });

      els.confirmBtn?.addEventListener("click", submitOrder);

      els.nomeInput?.addEventListener("blur", validateName);

      // Limpa erro inline ao digitar nos campos de entrega
      ADDRESS_FIELDS.forEach(({ key }) => {
        els[key]?.addEventListener("input", () => {
          if (els[key].getAttribute("aria-invalid") === "true") {
            setFieldError(els[key], els[`${key}Error`], "");
          }
        });
      });

      // Auto-busca CEP ao pressionar Enter
      els.cep?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          searchCEP();
        }
      });

      els.cep?.addEventListener("input", () => {
        let value = els.cep.value.replace(/\D/g, "").slice(0, 8);
        if (value.length > 5) value = `${value.slice(0, 5)}-${value.slice(5)}`;
        els.cep.value = value;
      });

      els.cepSearch?.addEventListener("click", searchCEP);

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && els.modal?.classList.contains("active"))
          close();
      });

      // Atualizar resumo quando mudar opção de entrega ou pagamento
      document.addEventListener("change", (e) => {
        if (
          e.target.matches('input[name="delivery"]') ||
          e.target.matches('input[name="payment"]')
        ) {
          if (currentStep === 3) updateSummary();
        }
      });
    }

    function init() {
      cacheElements();
      bindEvents();
    }

    return {
      init,
      syncWithCart,
    };
  })();

  /* ===================================================
     INICIALIZAÇÃO
  ================================================== */
  function init() {
    UI.initIcons();
    UI.initMobileMenu();
    UI.initHeaderAndActiveNav();
    UI.initSmoothScroll();
    UI.initScrollAnimations();
    UI.initMagneticButtons();
    UI.initSwiperCarousels();
    renderProducts();
    Cart.init();
    Checkout.init();

    console.log(
      "%cFamília Bellacosa",
      "color:#c99a1e;font-size:20px;font-weight:bold;font-family:Fraunces, serif;",
    );
    console.log(
      "%cPremium Experience • Artesanal • Momentos que ficam",
      "color:#1a4731;font-size:13px;font-weight:400;",
    );
  }

  Utils.onReady(init);
})();