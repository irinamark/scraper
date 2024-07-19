# Product Scraper

This project is a scraper for detailed product pages from [2cent.ru](https://2cent.ru/) using Node.js.

## Installation

1. Clone the repository.
```bash
   git clone <repository-url>
   cd <repository-directory>
```
2. Install the dependencies:
```bash
npm install
```

## Usage
Run the script with the URLs of the products you want to scrape. URLs should be provided as command-line arguments
```bash
node script.js <product-url-1> <product-url-2> ...
```
Example:
```bash
node script.js https://2cent.ru/product/noutbuk-apple-macbook-air-2022-13-m2-8c-cpu-8c-gpu-8gb-256gb-ssd-mly13-starlight/
```

## Output
`products.zip`: The final zip archive containing all scraped product data and images.

## Data Structure

The ZIP archive will contain:

- **`data.json`** - A file with product information:
    - `URL` - The URL of the product page
    - `Name` - The name of the product
    - `Rating` - The product rating
    - `Reviews` - Reviews of the product
    - `Gallery` - Local path to the product images
    - `Description` - Description of the product
    - `Specifications` - Product specifications (key-value pairs)
    - `Price` - The product price:
        - `Cash` - Price when paying in cash
        - `Card` - Price when paying by card
    - `Availability` - Availability of the product
    - `Variants` - Variants of the product (e.g., color)

- **`gallery`** - Directory containing downloaded product images.
