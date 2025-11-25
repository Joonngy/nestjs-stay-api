const fs = require('fs');
const path = require('path');

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Read the SQL schema file
  const sqlPath = path.join(__dirname, '../schemas/01_public_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Execute the SQL file
  pgm.sql(sql);
};

exports.down = (pgm) => {
  // Drop all tables in reverse order
  const tables = [
    'admin_actions',
    'notifications',
    'wishlist_items',
    'wishlists',
    'messages',
    'conversations',
    'review_responses',
    'reviews',
    'coupon_usage',
    'coupons',
    'host_payouts',
    'payment_methods',
    'payments',
    'payment_outbox',
    'booking_price_breakdown',
    'bookings',
    'property_policies',
    'property_availability',
    'property_pricing',
    'property_media',
    'property_amenities',
    'properties',
    'phone_verifications',
    'email_verifications',
    'user_settings',
    'user_roles',
    'user_profiles',
    'users',
  ];

  tables.forEach((table) => {
    pgm.dropTable(table, { ifExists: true, cascade: true });
  });

  // Drop trigger function
  pgm.dropFunction('update_updated_time_column', [], { ifExists: true });

  // Drop extensions
  pgm.dropExtension('postgis', { ifExists: true });
  pgm.dropExtension('uuid-ossp', { ifExists: true });
};
