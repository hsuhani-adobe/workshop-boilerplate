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
    let amountMax     = AMOUNT_DEFAULT;   /* set from API offer value */

    /* ══════════════════════════════════════
       INTEREST RATE FORMULA
       Uses your exact logic — called fresh on every slider/input change.
    ══════════════════════════════════════ */
    function calculateInterest(loanAmount, maxOffer, tenure) {
        const baseRate    = 9;
        const utilization = loanAmount / maxOffer;
        const rate        = baseRate + (utilization * 2) + ((tenure / 12) * 0.1);
        return parseFloat(rate.toFixed(2));   /* returns number, not string */
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
       EDS BUBBLE SYNC  — fixed
       Correctly positions bubble using 0→1 fraction of the track.
    ══════════════════════════════════════ */
    function syncEDSBubble(rangeInput, wrapperEl, displayText) {
        const min      = parseFloat(rangeInput.min)   || 0;
        const max      = parseFloat(rangeInput.max)   || 100;
        const step     = parseFloat(rangeInput.step)  || 1;
        const value    = parseFloat(rangeInput.value);

        const totalSteps   = Math.ceil((max - min) / step);
        const currentSteps = Math.ceil((value - min) / step);

        wrapperEl.style.setProperty('--total-steps',   totalSteps);
        wrapperEl.style.setProperty('--current-steps', currentSteps);

        const bubble = wrapperEl.querySelector('.range-bubble');
        if (bubble) {
            const fraction = max > min ? (value - min) / (max - min) : 0;
            const bw       = bubble.getBoundingClientRect().width || 31;
            bubble.style.left  = `calc(${fraction * 100}% - ${fraction * bw}px)`;
            bubble.textContent = displayText;
        }
    }

    /* ══════════════════════════════════════
       DYNAMIC TICK GENERATOR
       Builds ~6 evenly-spaced ticks for any min→max.
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
       Rate recalculated fresh from formula on every call.
    ══════════════════════════════════════ */
    function updateSummary() {
        const rate = calculateInterest(currentAmount, amountMax, currentTenure);
        const emi  = calcEMI(currentAmount, rate, currentTenure);

        /* Offer heading */
        const heading = document.querySelector('.field-offer-summary-heading p');
        if (heading) {
            heading.innerHTML =
                'Avail XPRESS Personal Loan of' +
                '<span class="lo-amount-large">' + formatINR(currentAmount) + '</span>';
        }

        /* EMI */
        const emiInput = document.querySelector('input[name="emi_amount"]');
        if (emiInput) emiInput.value = formatINR(emi);

        /* Rate of interest — from formula */
        const roiInput = document.querySelector('input[name="rate_of_interest"]');
        if (roiInput) roiInput.value = rate + '%';

        /* Taxes */
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

        /* Apply attrs */
        rangeInput.min   = AMOUNT_MIN;
        rangeInput.max   = amountMax;
        rangeInput.step  = AMOUNT_STEP;
        rangeInput.value = clamp(currentAmount, AMOUNT_MIN, amountMax, AMOUNT_STEP);

        /* Min / max labels */
        const minLabel = wrapper.querySelector('.range-min');
        const maxLabel = wrapper.querySelector('.range-max');
        if (minLabel) minLabel.textContent = amountBubbleLabel(AMOUNT_MIN);
        if (maxLabel) maxLabel.textContent = amountBubbleLabel(amountMax);

        rebuildAmountTicks(wrapper);
        syncEDSBubble(rangeInput, wrapper, amountBubbleLabel(parseFloat(rangeInput.value)));

        /* Reflect slider value into input box immediately */
        if (amountInr) amountInr.value = formatINR(currentAmount);

        /* Slider → input box + summary */
        rangeInput.addEventListener('input', () => {
            currentAmount = clamp(parseFloat(rangeInput.value), AMOUNT_MIN, amountMax, AMOUNT_STEP);
            syncEDSBubble(rangeInput, wrapper, amountBubbleLabel(currentAmount));
            /* Always update input box to match slider */
            if (amountInr) amountInr.value = formatINR(currentAmount);
            updateSummary();
        });

        /* Setter: called by input box / public API to drive the slider */
        return function setAmountSlider(val) {
            val = clamp(val, AMOUNT_MIN, amountMax, AMOUNT_STEP);
            currentAmount    = val;
            rangeInput.value = val;
            syncEDSBubble(rangeInput, wrapper, amountBubbleLabel(val));
            if (amountInr) amountInr.value = formatINR(val);
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

        /* Static tenure ticks */
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

        /* Reflect slider value into input box immediately */
        if (tenureInp) tenureInp.value = TENURE_DEFAULT + ' months';

        /* Slider → input box + summary */
        rangeInput.addEventListener('input', () => {
            currentTenure = clamp(parseFloat(rangeInput.value), TENURE_MIN, TENURE_MAX, TENURE_STEP);
            syncEDSBubble(rangeInput, wrapper, currentTenure + 'm');
            /* Always update input box to match slider */
            if (tenureInp) tenureInp.value = currentTenure + ' months';
            updateSummary();
        });

        /* Setter: called by input box to drive the slider */
        return function setTenureSlider(val) {
            val = clamp(val, TENURE_MIN, TENURE_MAX, TENURE_STEP);
            currentTenure    = val;
            rangeInput.value = val;
            syncEDSBubble(rangeInput, wrapper, val + 'm');
            if (tenureInp) tenureInp.value = val + ' months';
        };
    }

    /* ══════════════════════════════════════
       WIRE AMOUNT NUMBER INPUT
       Typing → slider + summary.
    ══════════════════════════════════════ */
    function wireAmountInput(setAmountSlider) {
        const input = document.querySelector('input[name="loan_amount_inr"]');
        if (!input) return;

        /* Focus: strip ₹ formatting so user can type cleanly */
        input.addEventListener('focus', () => {
            input.value = currentAmount > 0 ? String(currentAmount) : '';
        });

        /* Live typing → update slider + summary */
        input.addEventListener('input', () => {
            const raw = stripToNumber(input.value);
            if (raw >= AMOUNT_MIN && raw <= amountMax) {
                if (setAmountSlider) setAmountSlider(raw);
                updateSummary();
            }
        });

        /* Blur: clamp + reformat */
        input.addEventListener('blur', () => {
            let raw = stripToNumber(input.value);
            if (!raw || raw < AMOUNT_MIN) raw = AMOUNT_MIN;
            if (raw > amountMax)          raw = amountMax;
            if (setAmountSlider) setAmountSlider(raw);
            input.value = formatINR(currentAmount);
            updateSummary();
        });

        input.addEventListener('wheel', e => e.preventDefault(), { passive: false });
    }

    /* ══════════════════════════════════════
       WIRE TENURE NUMBER INPUT
       Typing → slider + summary.
    ══════════════════════════════════════ */
    function wireTenureInput(setTenureSlider) {
        const input = document.querySelector('input[name="loan_tenure_months"]');
        if (!input) return;

        /* Focus: strip " months" so user can type cleanly */
        input.addEventListener('focus', () => {
            input.value = currentTenure > 0 ? String(currentTenure) : '';
        });

        /* Live typing → update slider + summary */
        input.addEventListener('input', () => {
            const raw = parseInt(input.value, 10);
            if (raw >= TENURE_MIN && raw <= TENURE_MAX) {
                if (setTenureSlider) setTenureSlider(raw);
                updateSummary();
            }
        });

        /* Blur: clamp + reformat */
        input.addEventListener('blur', () => {
            let raw = parseInt(stripToNumber(input.value), 10);
            if (!raw || raw < TENURE_MIN) raw = TENURE_MIN;
            if (raw > TENURE_MAX)         raw = TENURE_MAX;
            if (setTenureSlider) setTenureSlider(raw);
            input.value = currentTenure + ' months';
            updateSummary();
        });

        input.addEventListener('wheel', e => e.preventDefault(), { passive: false });
    }

    /* ══════════════════════════════════════
       WATCH BANNER FIELD
       Fires when API sets loan_offer_banner value.
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

            /* Clamp currentAmount to new max if needed */
            if (currentAmount > amountMax) {
                if (setAmountSlider) setAmountSlider(amountMax);
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
        currentAmount = clamp(Math.min(amountMax, AMOUNT_DEFAULT), AMOUNT_MIN, amountMax, AMOUNT_STEP);
        currentTenure = TENURE_DEFAULT;

        const setAmountSlider = setupAmountSlider();
        const setTenureSlider = setupTenureSlider();

        wireAmountInput(setAmountSlider);
        wireTenureInput(setTenureSlider);
        watchBannerField(setAmountSlider);

        updateSummary();

        /* Re-sync bubble positions after layout paint */
        requestAnimationFrame(() => {
            if (setAmountSlider) setAmountSlider(currentAmount);
            if (setTenureSlider) setTenureSlider(currentTenure);
            updateSummary();
        });
    }

    /* ══════════════════════════════════════
       PUBLIC API
       Call from your API success handler:
         window.loanOffer.setOfferAmount(140000)
    ══════════════════════════════════════ */
    window.loanOffer = {
        setOfferAmount: function (amount) {
            amountMax     = typeof amount === 'number' ? amount : stripToNumber(amount);
            currentAmount = clamp(Math.min(currentAmount, amountMax), AMOUNT_MIN, amountMax, AMOUNT_STEP);

            /* Update banner */
            const bannerInput = document.querySelector('input[name="loan_offer_banner"]');
            if (bannerInput) {
                bannerInput.value = amountMax;
                bannerInput.dispatchEvent(new Event('change'));
            }

            /* Update slider + input box */
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

            const amountInr = document.querySelector('input[name="loan_amount_inr"]');
            if (amountInr) amountInr.value = formatINR(currentAmount);

            updateSummary();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();