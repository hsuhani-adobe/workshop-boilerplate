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


/**
 * loan-offer.js
 * Works alongside the existing EDS range decorate() function.
 */

(function () {
    'use strict';

    /* ══════════════════════════════════════
       CONFIG
    ══════════════════════════════════════ */
    const AMOUNT = {
        min:          50000,
        max:          1500000,
        step:         10000,
        defaultValue: 1500000,
        ticks:        [50000, 200000, 400000, 600000, 800000, 1000000, 1200000, 1500000],
        tickLabels:   ['50K', '2L', '4L', '6L', '8L', '10L', '12L', '15L'],
    };

    const TENURE = {
        min:          12,
        max:          84,
        step:         1,
        defaultValue: 84,
        ticks:        [12, 24, 36, 48, 60, 72, 84],
        tickLabels:   ['12m', '24m', '36m', '48m', '60m', '72m', '84m'],
    };

    const RATE_ANNUAL = 10.97;
    const TAXES_FLAT  = 4000;

    /* ══════════════════════════════════════
       UTILITIES
    ══════════════════════════════════════ */
    function formatINR(v) {
        return '₹' + Number(v).toLocaleString('en-IN');
    }

    function stripToNumber(str) {
        /* Remove ₹, commas, spaces, 'months', any non-digit except dot */
        return parseFloat(String(str).replace(/[^0-9.]/g, '')) || 0;
    }

    function calcEMI(principal, annualRate, months) {
        const r = annualRate / 12 / 100;
        if (r === 0) return Math.round(principal / months);
        return Math.round(
            principal * r * Math.pow(1 + r, months) /
            (Math.pow(1 + r, months) - 1)
        );
    }

    function clamp(val, min, max, step) {
        const snapped = Math.round((val - min) / step) * step + min;
        return Math.max(min, Math.min(max, snapped));
    }

    function toFraction(value, min, max) {
        return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }

    /* ══════════════════════════════════════
       EDS BUBBLE SYNC
       Mirrors EDS updateBubble() exactly so the
       orange fill gradient (--current-steps/--total-steps) updates
    ══════════════════════════════════════ */
    function syncEDSBubble(rangeInput, wrapperEl, displayText) {
        const step    = parseFloat(rangeInput.step)  || 1;
        const max     = parseFloat(rangeInput.max)   || 100;
        const min     = parseFloat(rangeInput.min)   || 1;
        const value   = parseFloat(rangeInput.value) || min;
        const current = Math.ceil((value - min) / step);
        const total   = Math.ceil((max - min) / step);

        const bubble = wrapperEl.querySelector('.range-bubble');
        if (bubble) {
            const bubbleWidth = bubble.getBoundingClientRect().width || 31;
            bubble.style.left = `calc(${(current / total) * 100}% - ${(current / total) * bubbleWidth}px)`;
            bubble.textContent = displayText;
        }

        wrapperEl.style.setProperty('--total-steps',   total);
        wrapperEl.style.setProperty('--current-steps', current);
    }

    /* ══════════════════════════════════════
       SETUP SLIDER
    ══════════════════════════════════════ */
    function setupSlider(wrapperEl, cfg, getBubbleLabel, onChangeFn) {
        if (!wrapperEl) return null;

        const rangeInput = wrapperEl.querySelector('input[type="range"]');
        if (!rangeInput) return null;

        const minLabel = wrapperEl.querySelector('.range-min');
        const maxLabel = wrapperEl.querySelector('.range-max');

        /* Override range attrs */
        rangeInput.min   = cfg.min;
        rangeInput.max   = cfg.max;
        rangeInput.step  = cfg.step;
        rangeInput.value = cfg.defaultValue;

        /* Fix min/max labels */
        if (minLabel) minLabel.textContent = cfg.tickLabels[0];
        if (maxLabel) maxLabel.textContent = cfg.tickLabels[cfg.tickLabels.length - 1];

        /* Inject mid-tick labels */
        wrapperEl.querySelectorAll('.rs-tick').forEach(el => el.remove());
        cfg.ticks.forEach((tick, i) => {
            if (i === 0 || i === cfg.ticks.length - 1) return;
            const pct  = toFraction(tick, cfg.min, cfg.max) * 100;
            const span = document.createElement('span');
            span.className   = 'rs-tick';
            span.textContent = cfg.tickLabels[i];
            span.style.left  = pct + '%';
            wrapperEl.appendChild(span);
        });

        function syncAll(val) {
            rangeInput.value = val;
            syncEDSBubble(rangeInput, wrapperEl, getBubbleLabel(val));
            onChangeFn(val);
        }

        rangeInput.addEventListener('input', () => {
            syncAll(parseFloat(rangeInput.value));
        });

        syncAll(cfg.defaultValue);

        /* Return setter for external use */
        return function setValue(val) {
            val = clamp(val, cfg.min, cfg.max, cfg.step);
            syncAll(val);
        };
    }

    /* ══════════════════════════════════════
       SUMMARY CARD
    ══════════════════════════════════════ */
    function buildSummaryGrid() {
        const panel = document.querySelector('.field-loan-summary-panel');
        if (!panel || panel.querySelector('.lo-fields-grid')) return;

        const emi   = panel.querySelector('.field-emi-amount');
        const roi   = panel.querySelector('.field-rate-of-interest');
        const taxes = panel.querySelector('.field-taxes');
        const note  = panel.querySelector('.field-principal-offer-note');

        if (!emi || !roi || !taxes) return;

        const grid = document.createElement('div');
        grid.className = 'lo-fields-grid';
        panel.insertBefore(grid, note || null);
        grid.appendChild(emi);
        grid.appendChild(roi);
        grid.appendChild(taxes);
    }

    function updateSummary(amount, tenure) {
        const emi = calcEMI(amount, RATE_ANNUAL, tenure);

        const heading = document.querySelector('.field-offer-summary-heading p');
        if (heading) {
            heading.innerHTML =
                'Avail XPRESS Personal Loan of' +
                '<span class="lo-amount-large">' + formatINR(amount) + '</span>';
        }

        const emiInput = document.querySelector('[name="emi_amount"]');
        const roiInput = document.querySelector('[name="rate_of_interest"]');
        const taxInput = document.querySelector('[name="taxes"]');

        if (emiInput) emiInput.value = formatINR(emi);
        if (roiInput) roiInput.value = RATE_ANNUAL + '%';
        if (taxInput) taxInput.value = formatINR(TAXES_FLAT);
    }

    /* ══════════════════════════════════════
       WIRE NUMBER INPUT
       Key fix: separate "display" from "raw" value.
       - While typing: input is plain number (no ₹/months)
       - On blur: format it back + sync slider + recalc
    ══════════════════════════════════════ */
    function wireNumberInput(inputEl, cfg, formatFn, setSlider, getCurrentOther, updateFn) {
        if (!inputEl) return;

        /* Show formatted value initially */
        inputEl.value = formatFn(cfg.defaultValue);

        /* On focus: strip formatting so user can type cleanly */
        inputEl.addEventListener('focus', () => {
            const raw = stripToNumber(inputEl.value);
            inputEl.value = raw > 0 ? raw : '';
            inputEl.type  = 'text'; /* switch to text so ₹ doesn't confuse number input */
        });

        /* On input (while typing): live update if value is a valid number */
        inputEl.addEventListener('input', () => {
            const raw = stripToNumber(inputEl.value);
            if (raw >= cfg.min && raw <= cfg.max) {
                const clamped = clamp(raw, cfg.min, cfg.max, cfg.step);
                if (setSlider) setSlider(clamped);
                updateFn(clamped, getCurrentOther());
            }
        });

        /* On blur: clamp, format, sync everything */
        inputEl.addEventListener('blur', () => {
            let raw = stripToNumber(inputEl.value);
            if (!raw || raw < cfg.min) raw = cfg.min;
            if (raw > cfg.max) raw = cfg.max;
            const clamped = clamp(raw, cfg.min, cfg.max, cfg.step);
            inputEl.value = formatFn(clamped);
            inputEl.type  = 'number'; /* restore */
            if (setSlider) setSlider(clamped);
            updateFn(clamped, getCurrentOther());
        });

        /* Prevent scroll-wheel from changing the number */
        inputEl.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
    }

    /* ══════════════════════════════════════
       INIT
    ══════════════════════════════════════ */
    function init() {
        const amountSliderField = document.querySelector('.field-loan-amount-slider[data-component-status="loaded"]');
        const tenureSliderField = document.querySelector('.field-loan-tenure-slider[data-component-status="loaded"]');

        if (!amountSliderField || !tenureSliderField) {
            setTimeout(init, 100);
            return;
        }

        const amountWrapper = amountSliderField.querySelector('.range-widget-wrapper.decorated');
        const tenureWrapper = tenureSliderField.querySelector('.range-widget-wrapper.decorated');
        const amountInput   = document.querySelector('[name="loan_amount_inr"]');
        const tenureInput   = document.querySelector('[name="loan_tenure_months"]');

        let currentAmount = AMOUNT.defaultValue;
        let currentTenure = TENURE.defaultValue;

        buildSummaryGrid();

        /* Amount bubble label: e.g. 1140000 → "11.4L" */
        function amountBubbleLabel(v) {
            if (v >= 100000) {
                const l = v / 100000;
                return (Number.isInteger(l) ? l : l.toFixed(1)) + 'L';
            }
            return (v / 1000).toFixed(0) + 'K';
        }

        /* Tenure bubble label: e.g. 84 → "84m" */
        function tenureBubbleLabel(v) { return v + 'm'; }

        /* Slider → update state + summary */
        const setAmountSlider = setupSlider(amountWrapper, AMOUNT, amountBubbleLabel, (val) => {
            currentAmount = val;
            /* Update input box display if not focused */
            if (amountInput && document.activeElement !== amountInput) {
                amountInput.value = formatINR(val);
            }
            updateSummary(currentAmount, currentTenure);
        });

        const setTenureSlider = setupSlider(tenureWrapper, TENURE, tenureBubbleLabel, (val) => {
            currentTenure = val;
            if (tenureInput && document.activeElement !== tenureInput) {
                tenureInput.value = val + ' months';
            }
            updateSummary(currentAmount, currentTenure);
        });

        /* Wire amount input */
        wireNumberInput(
            amountInput,
            AMOUNT,
            (v) => formatINR(v),
            (v) => {
                currentAmount = v;
                if (setAmountSlider) setAmountSlider(v);
            },
            () => currentTenure,
            (amount, tenure) => updateSummary(amount, tenure)
        );

        /* Wire tenure input */
        wireNumberInput(
            tenureInput,
            TENURE,
            (v) => v + ' months',
            (v) => {
                currentTenure = v;
                if (setTenureSlider) setTenureSlider(v);
            },
            () => currentAmount,
            (tenure, amount) => updateSummary(amount, tenure)
        );

        /* Initial summary render */
        updateSummary(currentAmount, currentTenure);

        /* Re-sync bubble positions after paint */
        requestAnimationFrame(() => {
            if (setAmountSlider) setAmountSlider(currentAmount);
            if (setTenureSlider) setTenureSlider(currentTenure);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();