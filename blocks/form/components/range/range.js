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

    const RATE = 10.97;
    const TAX = 4000;

    function formatINR(v) {
        return '₹' + Number(v).toLocaleString('en-IN');
    }

    function parseNum(v) {
        return Number(String(v).replace(/[^0-9]/g, '')) || 0;
    }

    function calcEMI(P, n) {
        const r = RATE / 12 / 100;
        return Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    }

    function syncBubble(rangeInput, wrapper, text) {
        const step = parseFloat(rangeInput.step) || 1;
        const max = parseFloat(rangeInput.max) || 100;
        const min = parseFloat(rangeInput.min) || 1;
        const value = parseFloat(rangeInput.value) || min;

        const current = Math.ceil((value - min) / step);
        const total = Math.ceil((max - min) / step);

        const bubble = wrapper.querySelector('.range-bubble');
        if (bubble) bubble.textContent = text;

        wrapper.style.setProperty('--total-steps', total);
        wrapper.style.setProperty('--current-steps', current);
    }

    function updateSummary(amount, tenure) {
        const emi = calcEMI(amount, tenure);

        document.querySelector('[name="emi_amount"]').value = formatINR(emi);
        document.querySelector('[name="rate_of_interest"]').value = RATE + '%';
        document.querySelector('[name="taxes"]').value = formatINR(TAX);

        const heading = document.querySelector('.field-offer-summary-heading p');
        heading.innerHTML =
            'Avail XPRESS Personal Loan of <span class="lo-amount-large">' +
            formatINR(amount) +
            '</span>';
    }

    function init() {
        const amountWrapper = document.querySelector('.field-loan-amount-slider .range-widget-wrapper');
        const tenureWrapper = document.querySelector('.field-loan-tenure-slider .range-widget-wrapper');

        if (!amountWrapper || !tenureWrapper) {
            setTimeout(init, 200);
            return;
        }

        const amountSlider = amountWrapper.querySelector('input[type="range"]');
        const tenureSlider = tenureWrapper.querySelector('input[type="range"]');

        const amountInput = document.querySelector('[name="loan_amount_inr"]');
        const tenureInput = document.querySelector('[name="loan_tenure_months"]');
        const bannerInput = document.querySelector('[name="loan_offer_banner"]');

        function applyOffer() {
            let offer = parseNum(bannerInput.value);
            if (!offer) return;

            amountSlider.min = 50000;
            amountSlider.max = offer;
            amountSlider.step = 10000;
            amountSlider.value = offer;

            amountInput.value = offer;

            syncBubble(amountSlider, amountWrapper, Math.round(offer / 100000) + 'L');
            updateSummary(offer, parseNum(tenureInput.value || 84));
        }

        tenureSlider.min = 12;
        tenureSlider.max = 84;
        tenureSlider.step = 1;
        tenureSlider.value = 84;
        tenureInput.value = 84;

        syncBubble(tenureSlider, tenureWrapper, '84m');

        applyOffer();

        amountSlider.addEventListener('input', () => {
            let val = parseNum(amountSlider.value);
            amountInput.value = val;
            syncBubble(amountSlider, amountWrapper, Math.round(val / 100000) + 'L');
            updateSummary(val, parseNum(tenureInput.value));
        });

        tenureSlider.addEventListener('input', () => {
            let val = parseNum(tenureSlider.value);
            tenureInput.value = val;
            syncBubble(tenureSlider, tenureWrapper, val + 'm');
            updateSummary(parseNum(amountInput.value), val);
        });

        const observer = new MutationObserver(applyOffer);
        observer.observe(bannerInput, { attributes: true, childList: true, subtree: true });
    }

    document.addEventListener('DOMContentLoaded', init);
})();