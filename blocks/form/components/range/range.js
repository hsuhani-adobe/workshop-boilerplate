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
       CONFIG — update these to match your product
    ══════════════════════════════════════ */
    const CFG = {
        amount: {
            min:   50000,
            max:   1500000,
            step:  10000,
            ticks: [50000, 200000, 400000, 600000, 800000, 1000000, 1200000, 1500000],
            tickLabels: ['50K', '2L', '4L', '6L', '8L', '10L', '12L', '15L'],
            format: v => '₹' + Number(v).toLocaleString('en-IN'),
            bubbleFormat: v => {
                if (v >= 100000) return (v / 100000).toFixed(v % 100000 === 0 ? 0 : 1) + 'L';
                return (v / 1000).toFixed(0) + 'K';
            },
            defaultValue: 1500000,
        },
        tenure: {
            min:   12,
            max:   84,
            step:  1,
            ticks: [12, 24, 36, 48, 60, 72, 84],
            tickLabels: ['12m', '24m', '36m', '48m', '60m', '72m', '84m'],
            format: v => v + ' months',
            bubbleFormat: v => v + 'm',
            defaultValue: 84,
        },
    };

    const RATE_ANNUAL = 10.97;  /* % annual interest rate */
    const TAXES_FLAT  = 4000;   /* ₹ flat taxes */

    /* ══════════════════════════════════════
       UTILITIES
    ══════════════════════════════════════ */
    function formatINR(v) {
        return '₹' + Number(v).toLocaleString('en-IN');
    }

    function calcEMI(principal, annualRate, months) {
        const r = annualRate / 12 / 100;
        if (r === 0) return Math.round(principal / months);
        return Math.round(principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1));
    }

    /* Map real value → 0..1 fraction */
    function toFraction(value, min, max) {
        return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }

    /* Map 0..1 fraction → real value (snapped to step) */
    function fromFraction(frac, min, max, step) {
        const raw = min + frac * (max - min);
        return Math.round(raw / step) * step;
    }

    /* ══════════════════════════════════════
       SLIDER CLASS
    ══════════════════════════════════════ */
    class RangeSlider {
        constructor(wrapperEl, cfg, onChange) {
            this.wrapper   = wrapperEl;
            this.cfg       = cfg;
            this.onChange  = onChange;
            this.value     = cfg.defaultValue;

            this.input     = wrapperEl.querySelector('input[type="range"]');
            this.bubble    = wrapperEl.querySelector('.range-bubble');
            this.minLabel  = wrapperEl.querySelector('.range-min');
            this.maxLabel  = wrapperEl.querySelector('.range-max');

            this._setupDOM();
            this._setupRange();
            this._bindEvents();
            this.setValue(this.value);
        }

        _setupDOM() {
            /* Replace EDS min/max text with our labels */
            if (this.minLabel) this.minLabel.textContent = this.cfg.tickLabels[0];
            if (this.maxLabel) this.maxLabel.textContent = this.cfg.tickLabels[this.cfg.tickLabels.length - 1];

            /* Inject fill div */
            this.fillEl = document.createElement('div');
            this.fillEl.className = 'rs-track-fill';
            this.wrapper.appendChild(this.fillEl);

            /* Inject mid-point tick labels */
            const { ticks, tickLabels, min, max } = this.cfg;
            ticks.forEach((tick, i) => {
                if (i === 0 || i === ticks.length - 1) return; /* skip first/last — handled by min/max labels */
                const pct = toFraction(tick, min, max) * 100;
                const el = document.createElement('span');
                el.className = 'rs-tick';
                el.textContent = tickLabels[i];
                el.style.left = pct + '%';
                this.wrapper.appendChild(el);
            });
        }

        _setupRange() {
            /* Override EDS default range attrs */
            this.input.min   = 0;
            this.input.max   = 1000; /* high resolution */
            this.input.step  = 1;
        }

        _bindEvents() {
            this.input.addEventListener('input', () => {
                const frac  = parseInt(this.input.value) / 1000;
                const val   = fromFraction(frac, this.cfg.min, this.cfg.max, this.cfg.step);
                this._updateVisuals(val);
                if (this.onChange) this.onChange(val);
            });
        }

        setValue(val) {
            val = Math.max(this.cfg.min, Math.min(this.cfg.max, val));
            this.value = val;
            const frac = toFraction(val, this.cfg.min, this.cfg.max);
            this.input.value = Math.round(frac * 1000);
            this._updateVisuals(val);
        }

        _updateVisuals(val) {
            this.value = val;
            const frac   = toFraction(val, this.cfg.min, this.cfg.max);
            const pct    = frac * 100;

            /* Fill bar */
            this.fillEl.style.width = pct + '%';

            /* Bubble */
            if (this.bubble) {
                /* Offset so bubble stays inside track edges */
                const thumbHalf = 11; /* half of 22px thumb */
                const trackW    = this.input.offsetWidth || this.wrapper.offsetWidth;
                const thumbPos  = (trackW - 2 * thumbHalf) * frac + thumbHalf;
                this.bubble.style.left = thumbPos + 'px';
                this.bubble.textContent = this.cfg.bubbleFormat(val);
            }
        }
    }

    /* ══════════════════════════════════════
       SUMMARY CARD UPDATE
    ══════════════════════════════════════ */
    function updateSummary(amount, tenure) {
        const emi = calcEMI(amount, RATE_ANNUAL, tenure);

        /* Heading */
        const heading = document.querySelector('.field-offer-summary-heading p');
        if (heading) {
            heading.innerHTML =
                'Avail XPRESS Personal Loan of' +
                '<span class="lo-amount-large">' + formatINR(amount) + '</span>';
        }

        const emiInput  = document.querySelector('[name="emi_amount"]');
        const roiInput  = document.querySelector('[name="rate_of_interest"]');
        const taxInput  = document.querySelector('[name="taxes"]');

        if (emiInput)  emiInput.value  = formatINR(emi);
        if (roiInput)  roiInput.value  = RATE_ANNUAL + '%';
        if (taxInput)  taxInput.value  = formatINR(TAXES_FLAT);
    }

    /* ══════════════════════════════════════
       WRAP SUMMARY FIELDS IN GRID CONTAINER
    ══════════════════════════════════════ */
    function buildSummaryGrid() {
        const panel   = document.querySelector('.field-loan-summary-panel');
        if (!panel) return;

        const emi     = panel.querySelector('.field-emi-amount');
        const roi     = panel.querySelector('.field-rate-of-interest');
        const taxes   = panel.querySelector('.field-taxes');
        const note    = panel.querySelector('.field-principal-offer-note');

        if (!emi || !roi || !taxes) return;

        /* Create grid wrapper */
        const grid = document.createElement('div');
        grid.className = 'lo-fields-grid';

        /* Insert before the note strip */
        panel.insertBefore(grid, note || null);
        grid.appendChild(emi);
        grid.appendChild(roi);
        grid.appendChild(taxes);
    }

    /* ══════════════════════════════════════
       INIT
    ══════════════════════════════════════ */
    function init() {
        /* Build summary grid layout */
        buildSummaryGrid();

        /* Get DOM elements */
        const amountWrapper = document.querySelector('.field-loan-amount-slider .range-widget-wrapper');
        const tenureWrapper = document.querySelector('.field-loan-tenure-slider .range-widget-wrapper');
        const amountInput   = document.querySelector('[name="loan_amount_inr"]');
        const tenureInput   = document.querySelector('[name="loan_tenure_months"]');

        if (!amountWrapper || !tenureWrapper) {
            console.warn('range-slider.js: Could not find range widget wrappers.');
            return;
        }

        let currentAmount = CFG.amount.defaultValue;
        let currentTenure = CFG.tenure.defaultValue;

        /* Instantiate sliders */
        const amountSlider = new RangeSlider(amountWrapper, CFG.amount, (val) => {
            currentAmount = val;
            if (amountInput) amountInput.value = CFG.amount.format(val);
            updateSummary(currentAmount, currentTenure);
        });

        const tenureSlider = new RangeSlider(tenureWrapper, CFG.tenure, (val) => {
            currentTenure = val;
            if (tenureInput) tenureInput.value = CFG.tenure.format(val);
            updateSummary(currentAmount, currentTenure);
        });

        /* Number input → slider sync */
        if (amountInput) {
            amountInput.addEventListener('change', () => {
                const raw = parseFloat(amountInput.value.replace(/[^0-9]/g, '')) || CFG.amount.min;
                currentAmount = Math.max(CFG.amount.min, Math.min(CFG.amount.max, raw));
                amountInput.value = CFG.amount.format(currentAmount);
                amountSlider.setValue(currentAmount);
                updateSummary(currentAmount, currentTenure);
            });
        }

        if (tenureInput) {
            tenureInput.addEventListener('change', () => {
                const raw = parseInt(tenureInput.value) || CFG.tenure.min;
                currentTenure = Math.max(CFG.tenure.min, Math.min(CFG.tenure.max, raw));
                tenureInput.value = CFG.tenure.format(currentTenure);
                tenureSlider.setValue(currentTenure);
                updateSummary(currentAmount, currentTenure);
            });
        }

        /* Set initial display values */
        if (amountInput) amountInput.value = CFG.amount.format(currentAmount);
        if (tenureInput) tenureInput.value = CFG.tenure.format(currentTenure);
        updateSummary(currentAmount, currentTenure);

        /* Re-render bubble positions after fonts/layout settle */
        requestAnimationFrame(() => {
            amountSlider.setValue(currentAmount);
            tenureSlider.setValue(currentTenure);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();






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

    /* ══════════════════════════════════════
       STATE  (rate is now dynamic)
    ══════════════════════════════════════ */
    let currentAmount = AMOUNT_DEFAULT;
    let currentTenure = TENURE_DEFAULT;
    let amountMax     = AMOUNT_DEFAULT;
    let rateAnnual    = 10.97;          /* ← live variable; overwritten by API */

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
       DYNAMIC TICK GENERATOR
       Builds ~6 evenly-spaced ticks between MIN and MAX,
       so checkpoints always make sense for any offer value.
    ══════════════════════════════════════ */
    function buildAmountTicks(min, max) {
        const ticks = [];
        const range = max - min;

        /* Choose a "nice" step: nearest round number that gives 5-7 ticks */
        const rawStep = range / 6;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const niceStep = Math.ceil(rawStep / magnitude) * magnitude;

        for (let v = min + niceStep; v < max; v += niceStep) {
            const rounded = Math.round(v / niceStep) * niceStep;
            if (rounded <= min || rounded >= max) continue;
            ticks.push({ value: rounded, label: amountBubbleLabel(rounded) });
        }
        return ticks;
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
       EDS BUBBLE SYNC
    ══════════════════════════════════════ */
    function syncEDSBubble(rangeInput, wrapperEl, displayText) {
        const step    = parseFloat(rangeInput.step)  || 1;
        const max     = parseFloat(rangeInput.max)   || 100;
        const min     = parseFloat(rangeInput.min)   || 0;
        const value   = parseFloat(rangeInput.value);
        const current = Math.ceil((value - min) / step);
        const total   = Math.ceil((max - min) / step);

        wrapperEl.style.setProperty('--total-steps',   total);
        wrapperEl.style.setProperty('--current-steps', current);

        const bubble = wrapperEl.querySelector('.range-bubble');
        if (bubble) {
            const bw     = bubble.getBoundingClientRect().width || 31;
            const pct    = total > 0 ? (current / total) * 100 : 0;
            const offset = total > 0 ? (current / total) * bw  : 0;
            bubble.style.left  = `calc(${pct}% - ${offset}px)`;
            bubble.textContent = displayText;
        }
    }

    /* ══════════════════════════════════════
       REBUILD AMOUNT TICKS IN DOM
       Called on init AND whenever amountMax changes.
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
       Uses live rateAnnual — updates whenever amount/tenure/rate change.
    ══════════════════════════════════════ */
    function updateSummary() {
        const emi = calcEMI(currentAmount, rateAnnual, currentTenure);

        const heading = document.querySelector('.field-offer-summary-heading p');
        if (heading) {
            heading.innerHTML =
                'Avail XPRESS Personal Loan of' +
                '<span class="lo-amount-large">' + formatINR(currentAmount) + '</span>';
        }

        const emiInput = document.querySelector('input[name="emi_amount"]');
        if (emiInput) emiInput.value = formatINR(emi);

        /* Rate of interest — always reflects what the API sent */
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
       SETUP TENURE SLIDER  (unchanged logic)
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
       Handles API-driven updates after init.
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

            rebuildAmountTicks(wrapper);   /* ← uses dynamic tick generator */

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
       Your previous API's success handler should call:
         window.loanOffer.setOfferAmount(140000, 13.5)
                                         ↑ amount  ↑ rate from API
    ══════════════════════════════════════ */
    window.loanOffer = {
        setOfferAmount: function (amount, rate) {

            /* 1. Update live rate if API provides it */
            if (typeof rate === 'number' && rate > 0) {
                rateAnnual = rate;
            }

            /* 2. Update banner input */
            const bannerInput = document.querySelector('input[name="loan_offer_banner"]');
            if (bannerInput) {
                bannerInput.value = amount;
                bannerInput.dispatchEvent(new Event('change'));
            }

            /* 3. Update amountMax + clamp currentAmount */
            amountMax     = typeof amount === 'number' ? amount : stripToNumber(amount);
            currentAmount = Math.min(currentAmount, amountMax);

            /* 4. Update slider */
            const rangeInput = document.querySelector('.field-loan-amount-slider input[type="range"]');
            const wrapper    = document.querySelector('.field-loan-amount-slider .range-widget-wrapper.decorated');
            if (rangeInput && wrapper) {
                rangeInput.max   = amountMax;
                rangeInput.value = currentAmount;

                const maxLabel = wrapper.querySelector('.range-max');
                if (maxLabel) maxLabel.textContent = amountBubbleLabel(amountMax);

                rebuildAmountTicks(wrapper);   /* ← dynamic ticks for new MAX */
                syncEDSBubble(rangeInput, wrapper, amountBubbleLabel(currentAmount));
            }

            /* 5. Update amount input display */
            const amountInr = document.querySelector('input[name="loan_amount_inr"]');
            if (amountInr) amountInr.value = formatINR(currentAmount);

            /* 6. Recalculate EMI with new rate + amount */
            updateSummary();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();