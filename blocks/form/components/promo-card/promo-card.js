/**
 * Custom promo-card component
 * Based on: Radio Group
 */

/**
 * Decorates a custom form field component
 * @param {HTMLElement} fieldDiv - The DOM element containing the field wrapper. Refer to the documentation for its structure for each component.
 * @param {Object} fieldJson - The form json object for the component.
 * @param {HTMLElement} parentElement - The parent container element of the field.
 * @param {string} formId - The unique identifier of the form.
 */
/**
 * Decorates Promo Card component
 */
import { createOptimizedPicture } from '../../../../scripts/aem.js';
export default async function decorate(fieldDiv, fieldJson) {
  console.log('⚙️ Decorating promo-card:', fieldJson);

  fieldDiv.classList.add('promo-card-container');

  const image = document.createElement('img');
  image.className = 'promo-card-image';

  const titleText = fieldJson?.title || '';
  const lowerTitle = titleText.toLowerCase();

  if (fieldJson?.image) {
    image.src = fieldJson.image;
  } else if (lowerTitle.includes('recurring')) {
    image.src = '/icons/image_1.jpeg';
  } else if (lowerTitle.includes('health')) {
    image.src = '/icons/image_2.jpeg';
  } else {
    image.src = '/icons/image_1.jpeg';
  }

  image.alt = titleText || 'Promo Card';

  const smallText = document.createElement('p');
  smallText.className = 'promo-card-small-text';
  smallText.textContent = fieldJson?.smallText || '';

  const title = document.createElement('h3');
  title.className = 'promo-card-title';
  title.textContent = titleText;

  fieldDiv.innerHTML = '';
  fieldDiv.append(image, smallText, title);

  return fieldDiv;
}
