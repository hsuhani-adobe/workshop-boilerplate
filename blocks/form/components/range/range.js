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
 */
(function () {
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

    /**
     * RATE SLAB TABLE
     * upTo   : offer amount upper bound (inclusive), in INR
     * rate   : annual interest rate in %
     * Rows must be in ascending order of upTo.
     * The last row acts as the catch-all for any amount above it.
     */
    const RATE_SLABS = [
        { upTo:  100000, rate: 16.00 },   // up to ₹1L
        { upTo:  300000, rate: 14.50 },   // ₹1L – ₹3L
        { upTo:  500000, rate: 13.50 },   // ₹3L – ₹5L
        { upTo:  750000, rate: 12.50 },   // ₹5L – ₹7.5L
        { upTo: 1000000, rate: 11.75 },   // ₹7.5L – ₹10L
        { upTo: 1250000, rate: 11.25 },   // ₹10L – ₹12.5L
        { upTo: 1500000, rate: 10.97 },   // ₹12.5L – ₹15L
    ];

    /* ══════════════════════════════════════
       STATE
    ══════════════════════════════════════ */
    let currentAmount = AMOUNT_DEFAULT;
    let currentTenure = TENURE_DEFAULT;
    let amountMax     = AMOUNT_DEFAULT;
    let rateAnnual    = 10.97;   /* recalculated on every offer update */

    /* ══════════════════════════════════════
       RATE LOOKUP FROM SLAB TABLE
       Pass the API offer amount → returns correct annual rate.
    ══════════════════════════════════════ */
    function getRateForAmount(amount) {
        for (let i = 0; i < RATE_SLABS.length; i++) {
            if (amount <= RATE_SLABS[i].upTo) {
                return RATE_SLABS[i].rate;
            }
        }
        /* Fallback: return rate of highest slab */
        return RATE_SLABS[RATE_SLABS.length - 1].rate;
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

    /* ══════════════════════════════════════
       AMOUNT BUBBLE LABEL
    ══════════════════════════════════════ */
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
       READ OFFER AMOUNT FROM BANNER
    ══════════════════════════════════════ */
    function getOfferAmountFromBanner() {
        const bannerInput = document.querySelector('input[name="loan_offer_banner"]');
        if (!bannerInput) return AMOUNT_DEFAULT;
        const val = stripToNumber(bannerInput.value);
        return val >= AMOUNT_MIN ? val : AMOUNT_DEFAULT;
    }

    /* ══════════════════════════════════════
       EDS BUBBLE SYNC  (fixed positioning)
       Uses getBoundingClientRect width of the TRACK,
       not the bubble, so left% maps correctly.
    ══════════════════════════════════════ */
    function syncEDSBubble(rangeInput, wrapperEl, displayText) {
        const min   = parseFloat(rangeInput.min)   || 0;
        const max   = parseFloat(rangeInput.max)   || 100;
        const step  = parseFloat(rangeInput.step)  || 1;
        const value = parseFloat(rangeInput.value);

        const totalSteps   = Math.ceil((max - min) / step);
        const currentSteps = Math.ceil((value - min) / step);

        wrapperEl.style.setProperty('--total-steps',   totalSteps);
        wrapperEl.style.setProperty('--current-steps', currentSteps);

        const bubble = wrapperEl.querySelector('.range-bubble');
        if (bubble) {
            /* Fraction 0→1 along the track */
            const fraction = max > min ? (value - min) / (max - min) : 0;
            const bw = bubble.getBoundingClientRect().width || 31;
            /*
             * Standard range-thumb formula:
             *   left = fraction * (trackWidth - thumbWidth) / trackWidth * 100%
             * Since we only have % here, a good approximation is:
             *   left = fraction * 100% minus a pixel correction proportional to fraction.
             */
            bubble.style.left  = `calc(${fraction * 100}% - ${fraction * bw}px)`;
            bubble.textContent = displayText;
        }
    }

    /* ══════════════════════════════════════
       DYNAMIC TICK GENERATOR
       Builds ~6 evenly-spaced ticks for any min→max range.
    ══════════════════════════════════════ */
    function buildAmountTicks(min, max) {
        const ticks    = [];
        const range    = max - min;
        const rawStep  = range / 6;
        const mag      = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const niceStep = Math.ceil(rawStep / mag) * mag;

        for (let v = min + niceStep; v < max; v += niceStep) {
            const rounded = Math.round(v / niceStep) * niceStep;
            if (rounded > min && rounded < max) {
                ticks.push({ value: rounded, label: amountBubbleLabel(rounded) });
            }
        }
        return ticks;
    }

    /* ══════════════════════════════════════
       REBUILD AMOUNT TICKS IN DOM
    ══════════════════════════════════════ */
    function rebuildAmountTicks(wrapper) {
        wrapper.querySelectorAll('.rs-tick').forEach(el => el.remove());
        buildAmountTicks(AMOUNT_MIN, amountMax).forEach(t => {
            const pct  = ((t.value - AMOUNT_MIN) / (amountMax - AMOUNT_MIN)) * 100;
            const span = document.createElement('span');
            span.className   = 'rs-tick';
            span.textContent = t.label;
            span.style.left  = pct + '%';
            wrapper.appendChild(span);
        });
    }

    /* ══════════════════════════════════════
       UPDATE SUMMARY CARD
       Rate is always derived fresh from currentAmount via slab table.
    ══════════════════════════════════════ */
    function updateSummary() {
        /* Derive rate from offer amount (amountMax = offer amount from API) */
        rateAnnual = getRateForAmount(amountMax);

        const emi = calcEMI(currentAmount, rateAnnual, currentTenure);

        const heading = document.querySelector('.field-offer-summary-heading p');
        if (heading) {
            heading.innerHTML =
                'Avail XPRESS Personal Loan of' +
                '<span class="lo-amount-large">' + formatINR(currentAmount) + '</span>';
        }

        const emiInput = document.querySelector('input[name="emi_amount"]');
        if (emiInput) emiInput.value = formatINR(emi);

        const roiInput = document.querySelector('input[name="rate_of_interest"]');
        if (roiInput) roiInput.value = rateAnnual + '%';

        const taxInput = document.querySelector('input[name="taxes"]');
        if (taxInput) taxInput.value = formatINR(TAXES_FLAT);
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
        const amountInr  = document.querySelector('input[name="loan_amount_inr"]');
        if (!rangeInput) return null;

        amountMax = getOfferAmountFromBanner();

        rangeInput.min   = AMOUNT_MIN;
        rangeInput.max   = amountMax;
        rangeInput.step  = AMOUNT_STEP;
        rangeInput.value = Math.min(currentAmount, amountMax);

        const minLabel = wrapper.querySelector('.range-min');
        const maxLabel = wrapper.querySelector('.range-max');
        if (minLabel) minLabel.textContent = amountBubbleLabel(AMOUNT_MIN);
        if (maxLabel) maxLabel.textContent = amountBubbleLabel(amountMax);

        rebuildAmountTicks(wrapper);
        syncEDSBubble(rangeInput, wrapper, amountBubbleLabel(parseFloat(rangeInput.value)));

        if (amountInr) amountInr.value = formatINR(currentAmount);

        rangeInput.addEventListener('input', () => {
            const val     = clamp(parseFloat(rangeInput.value), AMOUNT_MIN, amountMax, AMOUNT_STEP);
            currentAmount = val;
            syncEDSBubble(rangeInput, wrapper, amountBubbleLabel(val));
            if (amountInr && document.activeElement !== amountInr) {
                amountInr.value = formatINR(val);
            }
            updateSummary();
        });

        return function setAmountSlider(val) {
            val = clamp(val, AMOUNT_MIN, amountMax, AMOUNT_STEP);
            rangeInput.value = val;
            syncEDSBubble(rangeInput, wrapper, amountBubbleLabel(val));
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
        const tenureInp  = document.querySelector('input[name="loan_tenure_months"]');
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
            const pct  = ((v - TENURE_MIN) / (TENURE_MAX - TENURE_MIN)) * 100;
            const span = document.createElement('span');
            span.className   = 'rs-tick';
            span.textContent = v + 'm';
            span.style.left  = pct + '%';
            wrapper.appendChild(span);
        });

        syncEDSBubble(rangeInput, wrapper, TENURE_DEFAULT + 'm');
        if (tenureInp) tenureInp.value = TENURE_DEFAULT + ' months';

        rangeInput.addEventListener('input', () => {
            const val     = clamp(parseFloat(rangeInput.value), TENURE_MIN, TENURE_MAX, TENURE_STEP);
            currentTenure = val;
            syncEDSBubble(rangeInput, wrapper, val + 'm');
            if (tenureInp && document.activeElement !== tenureInp) {
                tenureInp.value = val + ' months';
            }
            updateSummary();
        });

        return function setTenureSlider(val) {
            val = clamp(val, TENURE_MIN, TENURE_MAX, TENURE_STEP);
            rangeInput.value = val;
            syncEDSBubble(rangeInput, wrapper, val + 'm');
        };
    }

    /* ══════════════════════════════════════
       WIRE AMOUNT NUMBER INPUT
    ══════════════════════════════════════ */
    function wireAmountInput(setAmountSlider) {
        const input = document.querySelector('input[name="loan_amount_inr"]');
        if (!input) return;

        input.addEventListener('focus', () => {
            const raw = stripToNumber(input.value);
            input.value = raw > 0 ? String(raw) : '';
            input.type  = 'text';
        });

        input.addEventListener('input', () => {
            const raw = stripToNumber(input.value);
            if (raw >= AMOUNT_MIN && raw <= amountMax) {
                currentAmount = clamp(raw, AMOUNT_MIN, amountMax, AMOUNT_STEP);
                if (setAmountSlider) setAmountSlider(currentAmount);
                updateSummary();
            }
        });

        input.addEventListener('blur', () => {
            let raw = stripToNumber(input.value);
            if (!raw || raw < AMOUNT_MIN) raw = AMOUNT_MIN;
            if (raw > amountMax)          raw = amountMax;
            currentAmount = clamp(raw, AMOUNT_MIN, amountMax, AMOUNT_STEP);
            input.value   = formatINR(currentAmount);
            input.type    = 'text';
            if (setAmountSlider) setAmountSlider(currentAmount);
            updateSummary();
        });

        input.addEventListener('wheel', e => e.preventDefault(), { passive: false });
    }

    /* ══════════════════════════════════════
       WIRE TENURE NUMBER INPUT
    ══════════════════════════════════════ */
    function wireTenureInput(setTenureSlider) {
        const input = document.querySelector('input[name="loan_tenure_months"]');
        if (!input) return;

        input.addEventListener('focus', () => {
            const raw = stripToNumber(input.value);
            input.value = raw > 0 ? String(raw) : '';
            input.type  = 'text';
        });

        input.addEventListener('input', () => {
            const raw = parseInt(input.value, 10);
            if (raw >= TENURE_MIN && raw <= TENURE_MAX) {
                currentTenure = clamp(raw, TENURE_MIN, TENURE_MAX, TENURE_STEP);
                if (setTenureSlider) setTenureSlider(currentTenure);
                updateSummary();
            }
        });

        input.addEventListener('blur', () => {
            let raw = parseInt(stripToNumber(input.value), 10);
            if (!raw || raw < TENURE_MIN) raw = TENURE_MIN;
            if (raw > TENURE_MAX)         raw = TENURE_MAX;
            currentTenure = clamp(raw, TENURE_MIN, TENURE_MAX, TENURE_STEP);
            input.value   = currentTenure + ' months';
            input.type    = 'text';
            if (setTenureSlider) setTenureSlider(currentTenure);
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

            /* Recalculate rate for new offer amount */
            rateAnnual = getRateForAmount(amountMax);

            const rangeInput = document.querySelector('.field-loan-amount-slider input[type="range"]');
            const wrapper    = document.querySelector('.field-loan-amount-slider .range-widget-wrapper.decorated');
            if (!rangeInput || !wrapper) return;

            rangeInput.max = amountMax;

            const maxLabel = wrapper.querySelector('.range-max');
            if (maxLabel) maxLabel.textContent = amountBubbleLabel(amountMax);

            rebuildAmountTicks(wrapper);

            if (currentAmount > amountMax) {
                currentAmount = amountMax;
                if (setAmountSlider) setAmountSlider(currentAmount);
                const amountInr = document.querySelector('input[name="loan_amount_inr"]');
                if (amountInr) amountInr.value = formatINR(currentAmount);
            }
            updateSummary();
        }

        new MutationObserver(applyNewMax).observe(bannerInput, {
            attributes: true,
            attributeFilter: ['value']
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
        rateAnnual    = getRateForAmount(amountMax);   /* ← rate set at init too */
        currentAmount = Math.min(amountMax, AMOUNT_DEFAULT);
        currentTenure = TENURE_DEFAULT;

        const setAmountSlider = setupAmountSlider();
        const setTenureSlider = setupTenureSlider();

        wireAmountInput(setAmountSlider);
        wireTenureInput(setTenureSlider);
        watchBannerField(setAmountSlider);

        updateSummary();

        requestAnimationFrame(() => {
            if (setAmountSlider) setAmountSlider(currentAmount);
            if (setTenureSlider) setTenureSlider(currentTenure);
        });
    }

    /* ══════════════════════════════════════
       PUBLIC API
       Call from your previous API success handler:
         window.loanOffer.setOfferAmount(140000)
       Rate is auto-calculated internally from the slab table.
    ══════════════════════════════════════ */
    window.loanOffer = {
        setOfferAmount: function (amount) {
            amountMax  = typeof amount === 'number' ? amount : stripToNumber(amount);

            /* Derive rate from slab table — no API needed */
            rateAnnual = getRateForAmount(amountMax);

            currentAmount = Math.min(currentAmount, amountMax);

            /* Update banner input */
            const bannerInput = document.querySelector('input[name="loan_offer_banner"]');
            if (bannerInput) {
                bannerInput.value = amountMax;
                bannerInput.dispatchEvent(new Event('change'));
            }

            /* Update slider */
            const rangeInput = document.querySelector('.field-loan-amount-slider input[type="range"]');
            const wrapper    = document.querySelector('.field-loan-amount-slider .range-widget-wrapper.decorated');
            if (rangeInput && wrapper) {
                rangeInput.max   = amountMax;
                rangeInput.value = currentAmount;

                const maxLabel = wrapper.querySelector('.range-max');
                if (maxLabel) maxLabel.textContent = amountBubbleLabel(amountMax);

                rebuildAmountTicks(wrapper);
                syncEDSBubble(rangeInput, wrapper, amountBubbleLabel(currentAmount));
            }

            /* Update amount input display */
            const amountInr = document.querySelector('input[name="loan_amount_inr"]');
            if (amountInr) amountInr.value = formatINR(currentAmount);

            /* Recalculate EMI with new rate */
            updateSummary();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();