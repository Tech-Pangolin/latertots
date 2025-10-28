# Stripe Products Import

Simple script to import products from CSV to Stripe.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set your Stripe API key:
```bash
export STRIPE_SECRET_KEY=sk_test_your_key_here
```

3. Run the import:
```bash
npm start
```

## CSV Format

The script reads `products.csv` with columns:
- `Name` (required)
- `Description` 
- `Tax Code`
- `minAge (metadata)`, `ageCutoff (metadata)`, `endTime (metadata)`, `daysOfWeek (metadata)`, `startTime (metadata)`

Metadata fields are stored as Stripe product metadata.
