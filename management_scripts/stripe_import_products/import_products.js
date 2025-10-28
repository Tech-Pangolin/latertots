const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const csv = require('csv-parser');

function cleanMetadataValue(value) {
    return value && value.trim() ? value.trim() : null;
}

async function createStripeProduct(row) {
    const metadata = {};
    const metadataFields = ['minAge', 'ageCutoff', 'endTime', 'daysOfWeek', 'startTime'];
    
    for (const field of metadataFields) {
        const value = cleanMetadataValue(row[field]);
        if (value) {
            metadata[field] = value;
        }
    }
    
    if (row['Tax Code']) {
        metadata.tax_code = row['Tax Code'];
    }
    
    try {
        const product = await stripe.products.create({
            name: row['Name'],
            description: row['Description'] || '',
            active: true,
            metadata: metadata
        });
        
        console.log(`✅ Created product: ${product.name} (${product.id})`);
        return product;
    } catch (error) {
        console.log(`❌ Error creating product "${row['Name']}": ${error.message}`);
        return null;
    }
}

async function createStripePrice(priceRow, productMap) {
    const productName = priceRow['Product Name'];
    const product = productMap.get(productName);
    
    if (!product) {
        console.log(`❌ Product not found for price: ${productName}`);
        return null;
    }
    
    // Convert amount to cents (Stripe expects smallest currency unit)
    const amountInCents = Math.round(parseFloat(priceRow['Amount']) * 100);
    
    try {
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: amountInCents,
            currency: priceRow['Currency'] || 'usd',
            active: true,
            metadata: {
                original_price_id: priceRow['Price ID'],
                original_product_id: priceRow['Product ID'],
                product_name: productName
            }
        });
        
        console.log(`✅ Created price: $${priceRow['Amount']} for ${productName} (${price.id})`);
        return price;
    } catch (error) {
        console.log(`❌ Error creating price for "${productName}": ${error.message}`);
        return null;
    }
}

async function importProducts() {
    const products = new Map();
    let created = 0;
    let errors = 0;
    
    console.log('🚀 Importing products...\n');
    
    return new Promise((resolve, reject) => {
        const rows = [];
        
        fs.createReadStream('products.csv')
            .pipe(csv())
            .on('data', (row) => {
                rows.push(row);
            })
            .on('end', async () => {
                // Process products sequentially
                for (const row of rows) {
                    if (!row['Name'] || !row['Name'].trim()) continue;
                    
                    const product = await createStripeProduct(row);
                    if (product) {
                        products.set(product.name, product);
                        created++;
                    } else {
                        errors++;
                    }
                }
                
                console.log(`\n📊 Products: ${created} created, ${errors} errors\n`);
                resolve(products);
            })
            .on('error', reject);
    });
}

async function importPrices(productMap) {
    let created = 0;
    let errors = 0;
    
    console.log('💰 Importing prices...\n');
    
    return new Promise((resolve, reject) => {
        const rows = [];
        
        fs.createReadStream('prices.csv')
            .pipe(csv())
            .on('data', (row) => {
                rows.push(row);
            })
            .on('end', async () => {
                // Process prices sequentially
                for (const row of rows) {
                    if (!row['Product ID'] || !row['Amount']) continue;
                    
                    const price = await createStripePrice(row, productMap);
                    if (price) {
                        created++;
                    } else {
                        errors++;
                    }
                }
                
                console.log(`\n📊 Prices: ${created} created, ${errors} errors`);
                resolve();
            })
            .on('error', reject);
    });
}

async function clearExistingProducts() {
    console.log('🧹 Clearing existing products...\n');
    
    let deleted = 0;
    let errors = 0;
    
    try {
        // Get all products (active and inactive)
        const products = await stripe.products.list({ limit: 100 });
        
        if (products.data.length === 0) {
            console.log('   No existing products found\n');
            return;
        }
        
        console.log(`   Found ${products.data.length} existing products to delete`);
        
        // Delete each product
        for (const product of products.data) {
            try {
                await stripe.products.del(product.id);
                console.log(`   ✅ Deleted: ${product.name}`);
                deleted++;
            } catch (error) {
                console.log(`   ❌ Error deleting "${product.name}": ${error.message}`);
                errors++;
            }
        }
        
        console.log(`\n📊 Deletion: ${deleted} deleted, ${errors} errors\n`);
        
    } catch (error) {
        console.log(`❌ Error clearing products: ${error.message}`);
        throw error;
    }
}

async function main() {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.log('❌ Set STRIPE_SECRET_KEY environment variable');
        process.exit(1);
    }
    
    try {
        // Clear existing products first
        await clearExistingProducts();
        
        // Import products
        const productMap = await importProducts();
        
        // Then import prices using the product map
        await importPrices(productMap);
        
        console.log('\n🎉 Import completed successfully!');
    } catch (error) {
        console.log(`❌ Fatal error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}
