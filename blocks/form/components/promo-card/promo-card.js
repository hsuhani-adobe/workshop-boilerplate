const FALLBACK_IMAGE = 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_1.jpeg';

const CARD_CONFIG = {
  'textinput-9fda00af06': {
    smallText: 'Open a new',
    title: 'Recurring Deposit',
    image: 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_1.jpeg'
  },
  'textinput-c11a1f0f56': {
    smallText: 'Buy a new',
    title: 'Health Insurance',
    image: 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_2.jpeg'
  }
};

export default async function decorate(fieldDiv, fieldJson) {
  fieldDiv.classList.add('promo-card-container');

  const cardId = fieldDiv.getAttribute('data-id');

  // 🔥 Use config based on actual DOM card
  const config = CARD_CONFIG[cardId] || {};

  const titleText = config.title || fieldJson?.title || '';
  const smallTextValue = config.smallText || fieldJson?.smallText || '';
  const imageUrl = config.image || fieldJson?.image || FALLBACK_IMAGE;

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