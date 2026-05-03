/**
 * Custom cards component for Income e-Verification Method selection
 * Based on: Radio Group
 */






/**
 * Custom cards component
 * Based on: Radio Group
 */

/**
 * Decorates a custom form field component
 * @param {HTMLElement} fieldDiv - The DOM element containing the field wrapper. Refer to the documentation for its structure for each component.
 * @param {Object} fieldJson - The form json object for the component.
 * @param {HTMLElement} parentElement - The parent container element of the field.
 * @param {string} formId - The unique identifier of the form.
 */
// export default async function decorate(fieldDiv, fieldJson, parentElement, formId) {
//   console.log('⚙️ Decorating cards component:', fieldDiv, fieldJson, parentElement, formId);
  
//   // TODO: Implement your custom component logic here
//   // You can access the field properties via fieldJson.properties
//   // You can access the parent container via parentElement
//   // You can access the form ID via formId
  
//   return fieldDiv;
// }
import { createOptimizedPicture } from '../../../../scripts/aem.js';
/**
 * Custom cards component for Income e-Verification Method selection
 * Based on: Radio Group / AEM EDS Forms Universal Editor
 */

const CARD_DATA = {
  'Account Aggregator': {
    description: 'Instant & secure, processed via RBI-regulated partner.',
    badge: 'Recommended',
  },
  'Login to Salary Account': {
    description: 'Quick & hassle-free, processed via NetBanking.',
    badge: null,
  },
  'Upload Bank Statement': {
    description: 'Processed via uploading bank statement of the last 6 months.',
    badge: null,
  },
};

/**
 * @param {HTMLElement} element   – the fieldset wrapper (.radio-group-wrapper)
 * @param {Object}      fieldJson – form JSON for the field
 * @param {HTMLElement} container – parent container element
 * @param {string}      formId    – unique form ID
 */
export default function decorate(element, fieldJson, container, formId) {
  element.classList.add('verify-cards');

  element.querySelectorAll('.radio-wrapper').forEach((radioWrapper) => {
    const input = radioWrapper.querySelector('input[type="radio"]');
    if (!input) return;

    const value = input.value;
    const data = CARD_DATA[value];

    // ── Clear existing children except the input ──
    Array.from(radioWrapper.children).forEach((child) => {
      if (child.tagName !== 'INPUT') child.remove();
    });

    if (!data) return;

    // ── 1. Header row: radio circle + title ──
    const header = document.createElement('div');
    header.className = 'vc-header';

    const circle = document.createElement('span');
    circle.className = 'vc-radio-circle';

    const title = document.createElement('span');
    title.className = 'vc-title';
    title.textContent = value;

    header.appendChild(circle);
    header.appendChild(title);

    // ── 2. Description ──
    const desc = document.createElement('p');
    desc.className = 'vc-desc';
    desc.textContent = data.description;

    radioWrapper.appendChild(header);
    radioWrapper.appendChild(desc);

    // ── 3. Badge (Recommended) ──
    if (data.badge) {
      const badge = document.createElement('span');
      badge.className = 'vc-badge';
      badge.textContent = data.badge;
      radioWrapper.appendChild(badge);
    }

    // ── 4. Selected state sync ──
    function syncAll() {
      element.querySelectorAll('.radio-wrapper').forEach((rw) => {
        const inp = rw.querySelector('input[type="radio"]');
        rw.classList.toggle('is-selected', inp ? inp.checked : false);
      });
    }

    radioWrapper.addEventListener('click', () => {
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      syncAll();
    });

    input.addEventListener('change', syncAll);
    syncAll();
  });

  return element;
}


