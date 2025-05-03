# Subscriber Import Tool

This tool allows you to import subscribers from a CSV file into the OTT platform. It's useful for:

- Migrating customers from another platform
- Adding internal team members for QA/testing
- Offering access to VIPs without checkout

## CSV Format

Your CSV file should have the following columns:

| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| email | Subscriber's email address | Yes | user@example.com |
| fullName | Subscriber's full name | Yes | John Doe |
| subscriptionStatus | Subscription status | No | active, trialing, past_due, canceled, none |
| hasManualSubscription | Whether to grant full access without billing | No | true, false |
| notes | Administrative notes | No | "Imported from legacy system" |
| activePlans | Comma-separated plan IDs | No | plan-id-1,plan-id-2 |
| purchasedPPV | Comma-separated PPV event IDs | No | event-id-1,event-id-2 |

See `sample-subscribers.csv` for an example.

## Running the Import

To import subscribers from a CSV file:

```bash
# From the project root directory
npx ts-node scripts/importSubscribers.ts ./path/to/your/subscribers.csv
```

## Manual Subscriber Creation

You can also create subscribers manually through the Admin panel:

1. Go to Subscribers in the Admin panel
2. Click "+ Create Subscriber"
3. Fill out the required fields:
   - Email
   - Full Name
4. Set access options:
   - Check "Manual Subscription Override" for full access
   - Or select specific subscription plans
   - Add PPV events or rentals as needed
5. Click "Save" to create the subscriber

## Notes

- The import script will skip subscribers that already exist (based on email)
- For large imports, consider running the script in batches
- After import, verify that subscribers have the correct access
