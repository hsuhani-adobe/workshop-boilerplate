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

(function () {
    'use strict';

    const RATE_ANNUAL = 10.97;
    const TAXES_FLAT = 4000;

    const TENURE = {
        min: 12,
        max: 84,
        step: 1,
        defaultValue: 84
    };

    const AMOUNT = {
        min: 50000,
        max: 1500000,
        step: 10000,
        defaultValue: 1500000
    };

    function formatINR(v) {
        return '₹' + Number(v).toLocaleString('en-IN');
    }

    function parseNumber(val) {
        return Number(String(val).replace(/[^0-9]/g, '')) || 0;
    }

    function calcEMI(P, annualRate, n) {
        const r = annualRate / 12 / 100;
        return Math.round(
            (P * r * Math.pow(1 + r, n)) /
            (Math.pow(1 + r, n) - 1)
        );
    }

    function updateSummary(amount, tenure) {
        const emi = calcEMI(amount, RATE_ANNUAL, tenure);

        const emiInput = document.querySelector('[name="emi_amount"]');
        const roiInput = document.querySelector('[name="rate_of_interest"]');
        const taxInput = document.querySelector('[name="taxes"]');

        if (emiInput) emiInput.value = formatINR(emi);
        if (roiInput) roiInput.value = RATE_ANNUAL + '%';
        if (taxInput) taxInput.value = formatINR(TAXES_FLAT);

        const heading = document.querySelector('.field-offer-summary-heading p');
        if (heading) {
            heading.innerHTML =
                'Avail XPRESS Personal Loan of <span class="lo-amount-large">' +
                formatINR(amount) +
                '</span>';
        }
    }

    function init() {
        const amountField = document.querySelector('.field-loan-amount-slider[data-component-status="loaded"]');
        const tenureField = document.querySelector('.field-loan-tenure-slider[data-component-status="loaded"]');

        if (!amountField || !tenureField) {
            setTimeout(init, 300);
            return;
        }

        const bannerInput = document.querySelector('[name="loan_offer_banner"]');

        const amountInput = document.querySelector('[name="loan_amount_inr"]');
        const tenureInput = document.querySelector('[name="loan_tenure_months"]');

        const amountSlider = amountField.querySelector('input[type="range"]');
        const tenureSlider = tenureField.querySelector('input[type="range"]');

        let offerAmount = parseNumber(bannerInput?.value);

        if (offerAmount > 0) {
            AMOUNT.max = offerAmount;
            AMOUNT.defaultValue = offerAmount;
        }

        let currentAmount = AMOUNT.defaultValue;
        let currentTenure = TENURE.defaultValue;

        amountSlider.min = AMOUNT.min;
        amountSlider.max = AMOUNT.max;
        amountSlider.step = AMOUNT.step;
        amountSlider.value = currentAmount;

        tenureSlider.min = TENURE.min;
        tenureSlider.max = TENURE.max;
        tenureSlider.step = TENURE.step;
        tenureSlider.value = currentTenure;

        if (amountInput) amountInput.value = currentAmount;
        if (tenureInput) tenureInput.value = currentTenure;

        updateSummary(currentAmount, currentTenure);

        amountSlider.addEventListener('input', function () {
            currentAmount = parseNumber(this.value);
            if (amountInput) amountInput.value = currentAmount;
            updateSummary(currentAmount, currentTenure);
        });

        tenureSlider.addEventListener('input', function () {
            currentTenure = parseNumber(this.value);
            if (tenureInput) tenureInput.value = currentTenure;
            updateSummary(currentAmount, currentTenure);
        });

        if (bannerInput) {
            const observer = new MutationObserver(() => {
                let val = parseNumber(bannerInput.value);
                if (val > 0) {
                    AMOUNT.max = val;
                    currentAmount = val;
                    amountSlider.max = val;
                    amountSlider.value = val;
                    if (amountInput) amountInput.value = val;
                    updateSummary(currentAmount, currentTenure);
                }
            });

            observer.observe(bannerInput, {
                attributes: true,
                childList: true,
                subtree: true
            });
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();