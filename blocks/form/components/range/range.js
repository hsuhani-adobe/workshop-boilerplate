function updateBubble(input, element) {
  const step = input.step || 1;
  const max = input.max || 0;
  const min = input.min || 1;
  const value = input.value || 1;
  const current = Math.ceil((value - min) / step);
  const total = Math.ceil((max - min) / step);
  const bubble = element.querySelector('.range-bubble');
  // during initial render the width is 0. Hence using a default here.
  const bubbleWidth = bubble.getBoundingClientRect().width || 31;
  const left = `${(current / total) * 100}% - ${(current / total) * bubbleWidth}px`;
  bubble.innerText = `${value}`;
  const steps = {
    '--total-steps': Math.ceil((max - min) / step),
    '--current-steps': Math.ceil((value - min) / step),
  };
  const style = Object.entries(steps).map(([varName, varValue]) => `${varName}:${varValue}`).join(';');
  bubble.style.left = `calc(${left})`;
  element.setAttribute('style', style);
}
export default async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');
  // modify the type in case it is not range.
  input.type = 'range';
  input.min = input.min || 1;
  input.max = input.max || 100;
  input.step = fieldJson?.properties?.stepValue || 1;
  // create a wrapper div to provide the min/max and current value
  const div = document.createElement('div');
  div.className = 'range-widget-wrapper decorated';
  input.after(div);
  const hover = document.createElement('span');
  hover.className = 'range-bubble';
  const rangeMinEl = document.createElement('span');
  rangeMinEl.className = 'range-min';
  const rangeMaxEl = document.createElement('span');
  rangeMaxEl.className = 'range-max';
  rangeMinEl.innerText = `${input.min || 1}`;
  rangeMaxEl.innerText = `${input.max}`;
  div.appendChild(hover);
  // move the input element within the wrapper div
  div.appendChild(input);
  div.appendChild(rangeMinEl);
  div.appendChild(rangeMaxEl);
  input.addEventListener('input', (e) => {
    updateBubble(e.target, div);
  });
  updateBubble(input, div);
  return fieldDiv;
}

/**
 * range-slider.js
 *
 * Handles:
 *  1. Custom range slider rendering (orange fill, tick labels, bubble)
 *  2. Loan Amount slider ↔ INR number input sync
 *  3. Loan Tenure slider ↔ months number input sync
 *  4. Live EMI calculation → summary card update
 */(function () {
    'use strict';

    /* ══════════════════════════════════════
       STATIC CONFIG
    ══════════════════════════════════════ */
    const AMOUNT_MIN     = 50000;
    const AMOUNT_STEP    = 10000;
    const AMOUNT_DEFAULT = 1500000;

    const TENURE_MIN     = 12;
    const TENURE_MAX     = 84;
    const TENURE_STEP    = 1;
    const TENURE_DEFAULT = 84;

    const TAXES_FLAT     = 4000;

    /* ══════════════════════════════════════
       STATE
    ══════════════════════════════════════ */
    let currentAmount = AMOUNT_DEFAULT;
    let currentTenure = TENURE_DEFAULT;
    let amountMax     = AMOUNT_DEFAULT;

    /* ══════════════════════════════════════
       INTEREST RATE FORMULA
    ══════════════════════════════════════ */
    function calculateInterest(loanAmount, maxOffer, tenure) {
        const baseRate    = 9;
        const utilization = loanAmount / maxOffer;
        const rate        = baseRate + (utilization * 2) + ((tenure / 12) * 0.1);
        return parseFloat(rate.toFixed(2));
    }

    /* ══════════════════════════════════════
       UTILITIES
    ══════════════════════════════════════ */
    function formatINR(v) {
        return '₹' + Number(Math.round(v)).toLocaleString('en-IN');
    }

    function stripToNumber(str) {
        return parseFloat(String(str).replace(/[^0-9.]/g, '')) || 0;
    }

    function clamp(val, min, max, step) {
        const snapped = Math.round((val - min) / step) * step + min;
        return Math.max(min, Math.min(max, snapped));
    }

    function calcEMI(principal, annualRate, months) {
        const r = annualRate / 12 / 100;
        if (!r) return Math.round(principal / months);
        return Math.round(
            principal * r * Math.pow(1 + r, months) /
            (Math.pow(1 + r, months) - 1)
        );
    }

    function amountBubbleLabel(v) {
        if (v >= 100000) {
            const l = v / 100000;
            return (Number.isInteger(l) ? l : parseFloat(l.toFixed(1))) + 'L';
        }
        if (v >= 1000) {
            const k = v / 1000;
            return (Number.isInteger(k) ? k : parseFloat(k.toFixed(1))) + 'K';
        }
        return String(Math.round(v));
    }

    /* ══════════════════════════════════════
       WRITE TO INPUT BOXES
       Always writes — called after every
       state change so boxes stay in sync
       with slider bubble at all times.
    ══════════════════════════════════════ */
function writeAmountBox() {
    const el = document.querySelector('input[name="loan_amount_inr"]');
    if (el && el.dataset.editing !== 'true') el.value = formatINR(currentAmount);
}

function writeTenureBox() {
    const el = document.querySelector('input[name="loan_tenure_months"]');
    if (el && el.dataset.editing !== 'true') el.value = currentTenure + ' months';
}
    /* ══════════════════════════════════════
       READ OFFER AMOUNT FROM BANNER
    ══════════════════════════════════════ */
    function getOfferAmountFromBanner() {
        const el = document.querySelector('input[name="loan_offer_banner"]');
        if (!el) return AMOUNT_DEFAULT;
        const val = stripToNumber(el.value);
        return val >= AMOUNT_MIN ? val : AMOUNT_DEFAULT;
    }

    /* ══════════════════════════════════════
       EDS BUBBLE SYNC
    ══════════════════════════════════════ */
    function syncEDSBubble(rangeInput, wrapperEl, displayText) {
        const min  = parseFloat(rangeInput.min)  || 0;
        const max  = parseFloat(rangeInput.max)  || 100;
        const step = parseFloat(rangeInput.step) || 1;
        const val  = parseFloat(rangeInput.value);

        wrapperEl.style.setProperty('--total-steps',   Math.ceil((max - min) / step));
        wrapperEl.style.setProperty('--current-steps', Math.ceil((val - min) / step));

        const bubble = wrapperEl.querySelector('.range-bubble');
        if (!bubble) return;

        bubble.textContent = displayText;

        const applyPosition = () => {
            const fraction = max > min ? (val - min) / (max - min) : 0;
            const bw       = bubble.getBoundingClientRect().width || 36;
            bubble.style.left = `calc(${fraction * 100}% - ${fraction * bw}px)`;
        };

        applyPosition();
        requestAnimationFrame(applyPosition);
    }

    /* ══════════════════════════════════════
       DYNAMIC TICK GENERATOR
    ══════════════════════════════════════ */
    function buildAmountTicks(min, max) {
        const ticks    = [];
        const rawStep  = (max - min) / 6;
        const mag      = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const niceStep = Math.ceil(rawStep / mag) * mag;
        for (let v = min + niceStep; v < max; v += niceStep) {
            const r = Math.round(v / niceStep) * niceStep;
            if (r > min && r < max) ticks.push({ value: r, label: amountBubbleLabel(r) });
        }
        return ticks;
    }

    function rebuildAmountTicks(wrapper) {
        wrapper.querySelectorAll('.rs-tick').forEach(el => el.remove());
        buildAmountTicks(AMOUNT_MIN, amountMax).forEach(t => {
            const span       = document.createElement('span');
            span.className   = 'rs-tick';
            span.textContent = t.label;
            span.style.left  = ((t.value - AMOUNT_MIN) / (amountMax - AMOUNT_MIN) * 100) + '%';
            wrapper.appendChild(span);
        });
    }

    /* ══════════════════════════════════════
       UPDATE SUMMARY CARD
    ══════════════════════════════════════ */
    function updateSummary() {
        const rate = calculateInterest(currentAmount, amountMax, currentTenure);
        const emi  = calcEMI(currentAmount, rate, currentTenure);

        const heading = document.querySelector('.field-offer-summary-heading p');
        if (heading) {
            heading.innerHTML =
                'Avail XPRESS Personal Loan of' +
                '<span class="lo-amount-large">' + formatINR(currentAmount) + '</span>';
        }

        const emiEl = document.querySelector('input[name="emi_amount"]');
        if (emiEl) emiEl.value = formatINR(emi);

        const roiEl = document.querySelector('input[name="rate_of_interest"]');
        if (roiEl) roiEl.value = rate + '%';

        const taxEl = document.querySelector('input[name="taxes"]');
        if (taxEl) taxEl.value = formatINR(TAXES_FLAT);
    }

    /* ══════════════════════════════════════
       SETUP AMOUNT SLIDER
    ══════════════════════════════════════ */
    function setupAmountSlider() {
        const fieldDiv   = document.querySelector('.field-loan-amount-slider');
        if (!fieldDiv) return null;
        const wrapper    = fieldDiv.querySelector('.range-widget-wrapper.decorated');
        if (!wrapper) return null;
        const rangeInput = wrapper.querySelector('input[type="range"]');
        if (!rangeInput) return null;

        rangeInput.min   = AMOUNT_MIN;
        rangeInput.max   = amountMax;
        rangeInput.step  = AMOUNT_STEP;
        rangeInput.value = clamp(currentAmount, AMOUNT_MIN, amountMax, AMOUNT_STEP);

        const minLabel = wrapper.querySelector('.range-min');
        const maxLabel = wrapper.querySelector('.range-max');
        if (minLabel) minLabel.textContent = amountBubbleLabel(AMOUNT_MIN);
        if (maxLabel) maxLabel.textContent = amountBubbleLabel(amountMax);

        rebuildAmountTicks(wrapper);
        syncEDSBubble(rangeInput, wrapper, amountBubbleLabel(currentAmount));
        writeAmountBox();

        rangeInput.addEventListener('input', () => {
            currentAmount = clamp(parseFloat(rangeInput.value), AMOUNT_MIN, amountMax, AMOUNT_STEP);
            syncEDSBubble(rangeInput, wrapper, amountBubbleLabel(currentAmount));
            writeAmountBox();
            updateSummary();
        });

        return function setAmountSlider(val) {
            currentAmount    = clamp(val, AMOUNT_MIN, amountMax, AMOUNT_STEP);
            rangeInput.value = currentAmount;
            syncEDSBubble(rangeInput, wrapper, amountBubbleLabel(currentAmount));
            writeAmountBox();
        };
    }

    /* ══════════════════════════════════════
       SETUP TENURE SLIDER
    ══════════════════════════════════════ */
    function setupTenureSlider() {
        const fieldDiv   = document.querySelector('.field-loan-tenure-slider');
        if (!fieldDiv) return null;
        const wrapper    = fieldDiv.querySelector('.range-widget-wrapper.decorated');
        if (!wrapper) return null;
        const rangeInput = wrapper.querySelector('input[type="range"]');
        if (!rangeInput) return null;

        rangeInput.min   = TENURE_MIN;
        rangeInput.max   = TENURE_MAX;
        rangeInput.step  = TENURE_STEP;
        rangeInput.value = TENURE_DEFAULT;

        const minLabel = wrapper.querySelector('.range-min');
        const maxLabel = wrapper.querySelector('.range-max');
        if (minLabel) minLabel.textContent = '12m';
        if (maxLabel) maxLabel.textContent = '84m';

        wrapper.querySelectorAll('.rs-tick').forEach(el => el.remove());
        [24, 36, 48, 60, 72].forEach(v => {
            const span       = document.createElement('span');
            span.className   = 'rs-tick';
            span.textContent = v + 'm';
            span.style.left  = ((v - TENURE_MIN) / (TENURE_MAX - TENURE_MIN) * 100) + '%';
            wrapper.appendChild(span);
        });

        syncEDSBubble(rangeInput, wrapper, TENURE_DEFAULT + 'm');
        writeTenureBox();

        rangeInput.addEventListener('input', () => {
            currentTenure = clamp(parseFloat(rangeInput.value), TENURE_MIN, TENURE_MAX, TENURE_STEP);
            syncEDSBubble(rangeInput, wrapper, currentTenure + 'm');
            writeTenureBox();
            updateSummary();
        });

        return function setTenureSlider(val) {
            currentTenure    = clamp(val, TENURE_MIN, TENURE_MAX, TENURE_STEP);
            rangeInput.value = currentTenure;
            syncEDSBubble(rangeInput, wrapper, currentTenure + 'm');
            writeTenureBox();
        };
    }

    /* ══════════════════════════════════════
       WIRE AMOUNT NUMBER INPUT
       No focus handler — box always shows
       live formatted value.
       User types raw digits; ₹ prefix and
       existing digits handled via stripToNumber.
    ══════════════════════════════════════ */
    function wireAmountInput(setAmountSlider) {
        const input = document.querySelector('input[name="loan_amount_inr"]');
        if (!input) return;

        input.addEventListener('keydown', (e) => {
            /* On first meaningful key, clear the box so user types fresh */
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                if (input.dataset.editing !== 'true') {
                    input.value          = '';
                    input.dataset.editing = 'true';
                }
            }
        });

        input.addEventListener('input', () => {
            const raw = stripToNumber(input.value);
            if (raw >= AMOUNT_MIN && raw <= amountMax) {
                if (setAmountSlider) setAmountSlider(raw);
                updateSummary();
            }
        });

        input.addEventListener('blur', () => {
            input.dataset.editing = 'false';
            let raw = stripToNumber(input.value);
            if (!raw || raw < AMOUNT_MIN) raw = AMOUNT_MIN;
            if (raw > amountMax)          raw = amountMax;
            if (setAmountSlider) setAmountSlider(raw);
            updateSummary();
        });

        input.addEventListener('wheel', e => e.preventDefault(), { passive: false });
    }

    /* ══════════════════════════════════════
       WIRE TENURE NUMBER INPUT
       No focus handler — box always shows
       live formatted value.
    ══════════════════════════════════════ */
    function wireTenureInput(setTenureSlider) {
        const input = document.querySelector('input[name="loan_tenure_months"]');
        if (!input) return;

        input.addEventListener('keydown', (e) => {
            /* On first meaningful key, clear the box so user types fresh */
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                if (input.dataset.editing !== 'true') {
                    input.value          = '';
                    input.dataset.editing = 'true';
                }
            }
        });

        input.addEventListener('input', () => {
            const raw = parseInt(stripToNumber(input.value), 10);
            if (raw >= TENURE_MIN && raw <= TENURE_MAX) {
                if (setTenureSlider) setTenureSlider(raw);
                updateSummary();
            }
        });

        input.addEventListener('blur', () => {
            input.dataset.editing = 'false';
            let raw = parseInt(stripToNumber(input.value), 10);
            if (!raw || raw < TENURE_MIN) raw = TENURE_MIN;
            if (raw > TENURE_MAX)         raw = TENURE_MAX;
            if (setTenureSlider) setTenureSlider(raw);
            updateSummary();
        });

        input.addEventListener('wheel', e => e.preventDefault(), { passive: false });
    }

    /* ══════════════════════════════════════
       WATCH BANNER FIELD
    ══════════════════════════════════════ */
    function watchBannerField(setAmountSlider) {
        const bannerInput = document.querySelector('input[name="loan_offer_banner"]');
        if (!bannerInput) return;

        function applyNewMax() {
            const newMax = getOfferAmountFromBanner();
            if (newMax === amountMax) return;
            amountMax = newMax;

            const rangeInput = document.querySelector('.field-loan-amount-slider input[type="range"]');
            const wrapper    = document.querySelector('.field-loan-amount-slider .range-widget-wrapper.decorated');
            if (!rangeInput || !wrapper) return;

            rangeInput.max = amountMax;
            const maxLabel = wrapper.querySelector('.range-max');
            if (maxLabel) maxLabel.textContent = amountBubbleLabel(amountMax);

            rebuildAmountTicks(wrapper);

            if (currentAmount > amountMax) {
                if (setAmountSlider) setAmountSlider(amountMax);
            }

            writeAmountBox();
            updateSummary();
        }

        new MutationObserver(applyNewMax).observe(bannerInput, {
            attributes: true, attributeFilter: ['value']
        });
        bannerInput.addEventListener('change', applyNewMax);
    }

    /* ══════════════════════════════════════
       INIT
    ══════════════════════════════════════ */
    function init() {
        const amountLoaded = document.querySelector('.field-loan-amount-slider[data-component-status="loaded"]');
        const tenureLoaded = document.querySelector('.field-loan-tenure-slider[data-component-status="loaded"]');
        if (!amountLoaded || !tenureLoaded) { setTimeout(init, 100); return; }

        amountMax     = getOfferAmountFromBanner();
        currentAmount = clamp(Math.min(amountMax, AMOUNT_DEFAULT), AMOUNT_MIN, amountMax, AMOUNT_STEP);
        currentTenure = TENURE_DEFAULT;

        const setAmountSlider = setupAmountSlider();
        const setTenureSlider = setupTenureSlider();

        wireAmountInput(setAmountSlider);
        wireTenureInput(setTenureSlider);
        watchBannerField(setAmountSlider);

        writeAmountBox();
        writeTenureBox();
        updateSummary();

        requestAnimationFrame(() => {
            if (setAmountSlider) setAmountSlider(currentAmount);
            if (setTenureSlider) setTenureSlider(currentTenure);
            writeAmountBox();
            writeTenureBox();
            updateSummary();
        });
    }

    /* ══════════════════════════════════════
       PUBLIC API
    ══════════════════════════════════════ */
    window.loanOffer = {
        setOfferAmount: function (amount) {
            amountMax     = typeof amount === 'number' ? amount : stripToNumber(amount);
            currentAmount = clamp(Math.min(currentAmount, amountMax), AMOUNT_MIN, amountMax, AMOUNT_STEP);

            const bannerInput = document.querySelector('input[name="loan_offer_banner"]');
            if (bannerInput) {
                bannerInput.value = amountMax;
                bannerInput.dispatchEvent(new Event('change'));
            }

            const rangeInput = document.querySelector('.field-loan-amount-slider input[type="range"]');
            const wrapper    = document.querySelector('.field-loan-amount-slider .range-widget-wrapper.decorated');
            if (rangeInput && wrapper) {
                rangeInput.max   = amountMax;
                rangeInput.value = currentAmount;
                const maxLabel   = wrapper.querySelector('.range-max');
                if (maxLabel) maxLabel.textContent = amountBubbleLabel(amountMax);
                rebuildAmountTicks(wrapper);
                syncEDSBubble(rangeInput, wrapper, amountBubbleLabel(currentAmount));
            }

            writeAmountBox();
            updateSummary();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();