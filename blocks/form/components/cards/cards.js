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
 * Card data — maps radio value to image URL, subtitle, and title.
 * Update these to match your actual content and image paths.
 */
const CARD_DATA = [
  {
    value: '1',
    imageUrl: "https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_2.jpeg"
            ,   // ← replace with your image path
    imageAlt: 'Recurring Deposit illustration',
    subtitle: 'Open a new',
    title: 'Recurring Deposit',
  },
  {
    value: '2',
    imageUrl: "https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_2.jpeg",
          // ← replace with your image path
    imageAlt: 'Health Insurance illustration',
    subtitle: 'Buy a new',
    title: 'Health Insurance',
  },
];

/**
 * Decorates the Cards component.
 * @param {HTMLElement} element      – the fieldset wrapper (.radio-group-wrapper)
 * @param {Object}      fieldJson    – form JSON for the field
 * @param {HTMLElement} container    – parent container element
 * @param {string}      formId       – unique form ID
 */
export default function decorate(element, fieldJson, container, formId) {
  // Add the base CSS class so our stylesheet applies
  element.classList.add('card');

  element.querySelectorAll('.radio-wrapper').forEach((radioWrapper) => {
    const input = radioWrapper.querySelector('input[type="radio"]');
    const cardValue = input ? input.value : null;

    // Find matching card data by radio value
    const data = CARD_DATA.find((c) => c.value === cardValue) || {};

    // ── 1. Build the illustration area ──────────────────────────────────────
    const imageWrap = document.createElement('div');
    imageWrap.className = 'card-image-wrapper';

    if (data.imageUrl) {
      const picture = createOptimizedPicture(data.imageUrl, data.imageAlt || 'card-image', false, [
        { width: '400' },
      ]);
      imageWrap.appendChild(picture);
    } else {
      // Fallback: reuse any <picture> already in the wrapper (from AEM authoring)
      const existingPicture = radioWrapper.querySelector('picture');
      if (existingPicture) {
        imageWrap.appendChild(existingPicture);
      }
    }

    // ── 2. Build the text area ───────────────────────────────────────────────
    const textWrap = document.createElement('div');
    textWrap.className = 'card-text';

    const subtitle = document.createElement('p');
    subtitle.className = 'card-subtitle';
    subtitle.textContent = data.subtitle || '';

    const title = document.createElement('p');
    title.className = 'card-title';
    title.textContent = data.title || '';

    textWrap.appendChild(subtitle);
    textWrap.appendChild(title);

    // ── 3. Clear existing content & assemble ────────────────────────────────
    // Keep the hidden radio input, remove everything else
    Array.from(radioWrapper.children).forEach((child) => {
      if (child.tagName !== 'INPUT') child.remove();
    });

    radioWrapper.appendChild(imageWrap);
    radioWrapper.appendChild(textWrap);

    // ── 4. Make the whole card clickable ────────────────────────────────────
    radioWrapper.addEventListener('click', () => {
      if (input) input.click();
    });
  });

  return element;
}



