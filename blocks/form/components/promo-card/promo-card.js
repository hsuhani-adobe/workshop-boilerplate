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

export default async function decorate(fieldDiv, fieldJson) {
  fieldDiv.classList.add('promo-card-container');

  const titleText = fieldJson?.title || '';
  const lowerTitle = titleText.toLowerCase();

  // ✅ Correct asset URLs — no ui#/aem/assetdetails.html
  let imageUrl = 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_2.jpeg';
  if (fieldJson?.image) {
    imageUrl = fieldJson.image;
  } else if (lowerTitle.includes('recurring')) {
    imageUrl = 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_1.jpeg';
  } else if (lowerTitle.includes('health')) {
    imageUrl = 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_2.jpeg';
  }

  const image = document.createElement('img');
  image.className = 'promo-card-image';
  image.src = imageUrl;
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