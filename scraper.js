const axios = require('axios');
const { parallelLimit } = require('async');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function sanitizeFileName(name) {
  const sanitized = name.replace(/[^a-zA-Z0-9а-яА-Я\s-_]/g, '');
  return sanitized.replace(/\s+/g, '_');
}

async function scrapeProduct(url) {
  console.info(`Starting to scrape product: ${url}`);
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const productName = $('.product-variant-second.product-variant-tab-first.rs-zoom.rs-product > div > div > div > div > h1').text().trim();

    const rating = parseFloat($('.product-rating__score').text().trim());

    const reviews = [];
    $('.product-review-item').each((i, elem) => {
      const review = $(elem).text().trim();
      const style = $(elem).find('.rating-stars__act').attr('style');
      const rating_percent = (style?.match(/width:\s*([0-9.]+)%/) || [])[1] || null;
      const rating = rating_percent ? rating_percent / 100 * 5 : null;
      reviews.push({
        review, rating,
      });
    });

    const gallery = [];
    $('div.product-gallery > div > .swiper-wrapper > .swiper-slide img').each((index, elem) => {
      const imageUrl = $(elem).attr('src');
      gallery.push(`https://2cent.ru${imageUrl}`);
    });

    const description = $('div[id="tab-description"]').text().trim();

    const specifications = {};
    $('div[id="tab-property"] > ul.product-chars > li').each((i, elem) => {
      const key = $(elem).find('div > div:nth-child(1)').contents().filter(function () {
          return this.nodeType === 3; // text nodes only
        })
        .text()
        .trim();
      const value = $(elem).find('div > div:nth-child(2)').text().trim();
      specifications[key] = value;
    });

    const priceCash = $('span.rs-price-new').html().trim();
    const priceCard = $('span.rs-price-old').html().trim();

    const availability = $('.available_item').text().trim() || $('.not_available_item').text().trim();

    const variants = [];
    $('ul.item-product-choose li').each((i, elem) => {
      const color = $(elem).find('div > input[data-property-id="Цвет"]').attr('value');
      if (color) variants.push(color.trim());
    });

    return {
      url,
      productName,
      rating,
      reviews,
      gallery,
      description,
      specifications,
      price: {
        cash: priceCash,
        card: priceCard,
      },
      availability,
      variants,
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
  }
}

async function createArchive(productsData) {
  console.info('Creating final archive...');
  const output = fs.createWriteStream(path.join(__dirname, 'products.zip'));
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });

  output.on('close', () => {
    console.info(`Archive created: ${archive.pointer()} total bytes`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  for (const productData of productsData) {
    const productDir = sanitizeFileName(productData.productName);

    const dataJson = JSON.stringify(productData, null, 2);
    archive.append(dataJson, { name: `${productDir}/data.json` });

    const async_queue = productData.gallery.map((imgUrl) => async () => {
      const imgName = path.basename(imgUrl);
      const response = await axios.get(imgUrl, { responseType: 'arraybuffer' }).catch((err) => console.error('Image error:', err.message));
      archive.append(response.data, { name: `${productDir}/gallery/${imgName}` });
    });
    await parallelLimit(async_queue, 5);
  }

  await archive.finalize();
}

async function main() {
  console.info('Product scraping process started...');
  const urls = process.argv.slice(2);
  const productsData = [];

  const async_queue = urls.map((url) => async () => {
    const productData = await scrapeProduct(url);
    if (productData) {
      productsData.push(productData);
    }
  });

  console.info(`Scraping ${urls.length} products...`);
  await parallelLimit(async_queue, 5);

  await createArchive(productsData);
  console.info('Process completed');
}

main()
