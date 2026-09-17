/* Pack switching: price, old price, discount, SKU and per-100 g rate. */

// Remember that the intro already played, so other views in this tab skip it.
try {
  sessionStorage.setItem("teaboom-intro", "1");
} catch (e) {}

(() => {
  "use strict";

  const root = document.querySelector(".product");
  if (!root) return;

  const packs = Array.from(root.querySelectorAll(".pack__input"));
  if (!packs.length) return;

  const out = {
    sku: root.querySelector('[data-out="sku"]'),
    price: root.querySelector('[data-out="price"]'),
    oldPrice: root.querySelector('[data-out="old-price"]'),
    discount: root.querySelector('[data-out="discount"]'),
    unitPrice: root.querySelector('[data-out="unit-price"]')
  };

  const form = root.querySelector(".buy");
  const cta = root.querySelector("[data-add-to-cart]");

  const wholeFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
  const centsFormat = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // 326.4 -> "326,40 ₽", 1432 -> "1 432 ₽"
  const formatPrice = (value) => {
    const amount = Math.round(value * 100) / 100;
    const formatter = amount % 1 === 0 ? wholeFormat : centsFormat;
    return `${formatter.format(amount)} ₽`;
  };

  const read = (input) => ({
    sku: input.dataset.sku,
    price: parseFloat(input.dataset.price),
    oldPrice: parseFloat(input.dataset.oldPrice),
    grams: parseFloat(input.dataset.grams)
  });

  const ratePer100g = (pack) => (pack.price / pack.grams) * 100;

  // Bigger packs cost less per 100 g — show that against the smallest one.
  const renderPacks = () => {
    const baseRate = ratePer100g(read(packs[0]));

    packs.forEach((input) => {
      const pack = read(input);
      const sum = input.parentNode.querySelector("[data-pack-sum]");
      const save = input.parentNode.querySelector("[data-pack-save]");

      if (sum) sum.textContent = formatPrice(pack.price);

      if (save) {
        const benefit = Math.round((1 - ratePer100g(pack) / baseRate) * 100);
        save.textContent = benefit > 0 ? `выгоднее на ${benefit}%` : "";
      }
    });
  };

  const render = (input) => {
    const pack = read(input);
    out.sku.textContent = pack.sku;
    out.price.textContent = formatPrice(pack.price);
    out.oldPrice.textContent = formatPrice(pack.oldPrice);
    out.discount.textContent = `−${Math.round((1 - pack.price / pack.oldPrice) * 100)}%`;
    out.unitPrice.textContent = formatPrice(ratePer100g(pack));
  };

  renderPacks();

  packs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) render(input);
    });
    if (input.checked) render(input);
  });

  const cartLink = document.querySelector("[data-cart]");
  const cartCount = document.querySelector("[data-cart-count]");
  const photo = root.querySelector(".shot__image");
  const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Send a copy of the photo along the arc into the cart icon.
  const flyToCart = () => {
    if (!cartLink || !photo || calmMotion.matches) return;

    const from = photo.getBoundingClientRect();
    const to = cartLink.getBoundingClientRect();
    const size = 120;

    const ghost = document.createElement("img");
    ghost.src = photo.currentSrc || photo.src;
    ghost.alt = "";
    ghost.className = "fly";
    ghost.style.left = `${from.left + from.width / 2 - size / 2}px`;
    ghost.style.top = `${from.top + from.height / 2 - size / 2}px`;
    ghost.style.width = `${size}px`;
    ghost.style.height = `${size}px`;
    document.body.append(ghost);

    const shiftX = to.left + to.width / 2 - (from.left + from.width / 2);
    const shiftY = to.top + to.height / 2 - (from.top + from.height / 2);

    const flight = ghost.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${shiftX * 0.6}px, ${shiftY * 0.45 - 60}px) scale(0.6)`, opacity: 0.9, offset: 0.55 },
        { transform: `translate(${shiftX}px, ${shiftY}px) scale(0.12)`, opacity: 0.2 }
      ],
      { duration: 720, easing: "cubic-bezier(0.4, 0, 0.3, 1)" }
    );

    flight.onfinish = () => ghost.remove();
  };

  const bumpCart = () => {
    if (!cartCount) return;

    cartCount.textContent = String(Number(cartCount.textContent) + 1);
    cartLink.classList.remove("is-filled");
    void cartLink.offsetWidth;
    cartLink.classList.add("is-filled");
  };

  let resetTimer = null;
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const label = cta.querySelector(".cta__label");
    cta.classList.add("is-added");
    label.textContent = "Добавлено";

    flyToCart();
    window.setTimeout(bumpCart, calmMotion.matches ? 0 : 620);

    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      cta.classList.remove("is-added");
      label.textContent = "В корзину";
    }, 1800);
  });
})();
