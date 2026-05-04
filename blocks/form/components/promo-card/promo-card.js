const FALLBACK_IMAGE = 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_1.jpeg';

const IMAGE_BY_ID = {
  'textinput-4a65bf8dd8': 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_1.jpeg',
  'textinput-7423f9feac': 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_2.jpeg',
};

export default async function decorate(fieldDiv, fieldJson) {
  fieldDiv.classList.add('promo-card-container');

  const titleText = fieldJson?.title || '';
  const smallTextValue = fieldJson?.smallText || '';

  // Target by data-id to assign the correct image per card
  const cardId = fieldDiv.getAttribute('data-id');
  const imageUrl = IMAGE_BY_ID[cardId] || fieldJson?.image?.trim() || FALLBACK_IMAGE;

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