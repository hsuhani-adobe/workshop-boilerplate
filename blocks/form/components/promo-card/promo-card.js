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
 */import { createOptimizedPicture } from '../../../../scripts/aem.js';
/**
 * Decorates Promo Card component
 */
const FALLBACK_IMAGE = 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_2.jpeg';

export default async function decorate(fieldDiv, fieldJson) {
  fieldDiv.classList.add('promo-card-container');

  const titleText = fieldJson?.title || '';
  const smallTextValue = fieldJson?.smallText || '';

  // Use image from fieldJson if explicitly set, else fallback to image_2
  const imageUrl = fieldJson?.image?.trim()
    ? fieldJson.image.trim()
    : FALLBACK_IMAGE;

  const image = document.createElement('img');
  image.className = 'promo-card-image';
  image.src = imageUrl;
  image.alt = titleText || 'Promo Card';
  image.loading = 'eager';

  const smallText = document.createElement('p');
  smallText.className = 'promo-card-small-text';
  smallText.textContent = smallTextValue;

  const title = document.createElement('h3');
  title.className = 'promo-card-title';
  title.textContent = titleText;

  fieldDiv.innerHTML = '';
  fieldDiv.append(image, smallText, title);

  return fieldDiv;
}