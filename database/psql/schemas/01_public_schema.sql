-- ============================================================================
-- Stay API - Complete Database Schema
-- PostgreSQL 14+ with PostGIS Extension
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- 1. USER MANAGEMENT TABLES
-- ============================================================================

-- Users table (core authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth users
    is_verified BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    oauth_provider VARCHAR(50), -- 'google', 'facebook', 'apple', NULL for local
    oauth_provider_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'banned', 'deleted'
    last_login_time TIMESTAMPTZ,
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_time TIMESTAMPTZ, -- Soft delete
    CONSTRAINT unique_oauth UNIQUE (oauth_provider, oauth_provider_id)
);

-- User profiles (extended information)
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    phone_country_code VARCHAR(5),
    date_of_birth DATE,
    profile_photo_url VARCHAR(500),
    bio TEXT,
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    emergency_contact JSONB, -- {"name": "...", "phone": "...", "relationship": "..."}
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User roles (many-to-many: user can be both guest and host)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'guest', 'host', 'admin'
    granted_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    UNIQUE(user_id, role)
);

-- User settings (preferences and notifications)
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    marketing_email_consent BOOLEAN DEFAULT FALSE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    newsletter_subscription BOOLEAN DEFAULT FALSE,
    profile_visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'private', 'contacts'
    currency_preference VARCHAR(3) DEFAULT 'USD',
    measurement_unit VARCHAR(10) DEFAULT 'metric', -- 'metric', 'imperial'
    language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{}', -- Granular notification settings
    accessibility_settings JSONB DEFAULT '{}',
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_time TIMESTAMPTZ NOT NULL,
    verified_time TIMESTAMPTZ,
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Phone verification OTPs
CREATE TABLE phone_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_time TIMESTAMPTZ NOT NULL,
    verified_time TIMESTAMPTZ,
    attempts INT DEFAULT 0,
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. PROPERTY/ACCOMMODATION TABLES
-- ============================================================================

-- Properties (accommodations)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    property_type VARCHAR(50) NOT NULL, -- 'apartment', 'house', 'villa', 'room', 'hotel'

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    coordinates GEOGRAPHY(POINT, 4326), -- PostGIS geography type

    -- Property details
    bedrooms INT DEFAULT 0,
    beds INT DEFAULT 0,
    bathrooms DECIMAL(3,1) DEFAULT 0,
    max_guests INT NOT NULL,

    -- Check-in/out
    check_in_time TIME DEFAULT '15:00:00',
    check_out_time TIME DEFAULT '11:00:00',
    min_stay_nights INT DEFAULT 1,
    max_stay_nights INT,

    -- Booking settings
    instant_book BOOLEAN DEFAULT FALSE,
    advance_notice_hours INT DEFAULT 24,
    preparation_time_hours INT DEFAULT 2,

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'pending_approval', 'active', 'inactive', 'suspended'
    approved_time TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),

    -- Metadata
    view_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,

    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_time TIMESTAMPTZ
);

-- Create spatial index for coordinates
CREATE INDEX idx_properties_coordinates ON properties USING GIST(coordinates);
CREATE INDEX idx_properties_host_id ON properties(host_id);
CREATE INDEX idx_properties_status ON properties(status) WHERE status = 'active';

-- Property amenities
CREATE TABLE property_amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity_type VARCHAR(50) NOT NULL, -- 'wifi', 'parking', 'pool', 'ac', 'heating', 'kitchen', 'gym'
    is_available BOOLEAN DEFAULT TRUE,
    description TEXT,
    UNIQUE(property_id, amenity_type)
);

CREATE INDEX idx_property_amenities_property_id ON property_amenities(property_id);

-- Property media (photos, videos)
CREATE TABLE property_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL, -- 'photo', 'video', 'virtual_tour'
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    display_order INT DEFAULT 0,
    caption TEXT,
    uploaded_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_property_media_property_id ON property_media(property_id);

-- Property pricing
CREATE TABLE property_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID UNIQUE NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    base_price_per_night DECIMAL(10,2) NOT NULL,
    weekend_price DECIMAL(10,2), -- Friday-Saturday pricing
    cleaning_fee DECIMAL(10,2) DEFAULT 0,
    extra_guest_fee DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    weekly_discount_percent DECIMAL(5,2) DEFAULT 0, -- e.g., 10.00 = 10%
    monthly_discount_percent DECIMAL(5,2) DEFAULT 0,
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Property availability calendar
CREATE TABLE property_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    price_override DECIMAL(10,2), -- Seasonal/special pricing
    notes TEXT,
    UNIQUE(property_id, date)
);

CREATE INDEX idx_property_availability_property_date ON property_availability(property_id, date);

-- Property policies
CREATE TABLE property_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID UNIQUE NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    cancellation_policy VARCHAR(20) DEFAULT 'moderate', -- 'flexible', 'moderate', 'strict'
    house_rules JSONB DEFAULT '{}', -- {"no_smoking": true, "no_pets": false, "quiet_hours": "22:00-08:00"}
    additional_rules TEXT,
    advance_notice_hours INT DEFAULT 24,
    preparation_time_hours INT DEFAULT 2,
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. BOOKING TABLES
-- ============================================================================

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id),
    guest_id UUID NOT NULL REFERENCES users(id),

    -- Dates
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_guests INT NOT NULL,
    num_nights INT NOT NULL,

    -- Pricing
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'declined', 'expired'
    booking_type VARCHAR(20) NOT NULL, -- 'instant', 'request'

    -- Requests and notes
    special_requests TEXT,
    cancellation_reason TEXT,

    -- Timestamps
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    confirmed_time TIMESTAMPTZ,
    cancelled_time TIMESTAMPTZ,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,

    CONSTRAINT check_dates CHECK (check_out_date > check_in_date)
);

CREATE INDEX idx_bookings_property_id ON bookings(property_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);

-- Booking price breakdown
CREATE TABLE booking_price_breakdown (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    nightly_rate DECIMAL(10,2) NOT NULL,
    num_nights INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL, -- nightly_rate * num_nights
    cleaning_fee DECIMAL(10,2) DEFAULT 0,
    service_fee DECIMAL(10,2) DEFAULT 0,
    extra_guest_fee DECIMAL(10,2) DEFAULT 0,
    coupon_discount DECIMAL(10,2) DEFAULT 0,
    taxes DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. PAYMENT TABLES
-- ============================================================================

-- Payment outbox (Transaction Outbox Pattern)
CREATE TABLE payment_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL, -- 'card', 'paypal', 'bank_transfer'

    -- Status and processing
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'refunded'
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 5,
    last_retry_time TIMESTAMPTZ,
    next_retry_time TIMESTAMPTZ,

    -- Gateway information
    payment_gateway VARCHAR(20) DEFAULT 'stripe', -- 'stripe', 'paypal'
    payment_gateway_ref VARCHAR(100), -- Stripe payment_intent_id

    -- Error handling
    error_message TEXT,
    error_code VARCHAR(50),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_time TIMESTAMPTZ,
    updated_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_outbox_booking_id ON payment_outbox(booking_id);
CREATE INDEX idx_payment_outbox_status ON payment_outbox(status);
CREATE INDEX idx_payment_outbox_next_retry ON payment_outbox(next_retry_time) WHERE status = 'pending' OR status = 'processing';

-- Payments (successful transactions)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL,

    -- Gateway details
    payment_gateway VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL, -- Gateway transaction ID

    -- Status
    status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'refunded', 'partially_refunded'
    refund_amount DECIMAL(10,2) DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    refunded_time TIMESTAMPTZ
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- Payment methods (saved cards, etc.)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'card', 'paypal', 'bank_account'

    -- Card details (tokenized)
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20), -- 'visa', 'mastercard', 'amex'
    card_exp_month INT,
    card_exp_year INT,

    -- Gateway token
    payment_gateway VARCHAR(20) NOT NULL,
    gateway_payment_method_id VARCHAR(100) NOT NULL,

    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);

-- Host payouts
CREATE TABLE host_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES users(id),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'

    -- Payout details
    payout_method VARCHAR(50), -- 'bank_transfer', 'paypal', 'stripe_connect'
    payout_gateway_ref VARCHAR(100),

    -- Metadata
    service_fee DECIMAL(10,2) DEFAULT 0, -- Platform fee
    net_amount DECIMAL(10,2) NOT NULL, -- Amount after fees

    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_time TIMESTAMPTZ
);

CREATE INDEX idx_host_payouts_host_id ON host_payouts(host_id);
CREATE INDEX idx_host_payouts_booking_id ON host_payouts(booking_id);

-- ============================================================================
-- 5. COUPON TABLES
-- ============================================================================

-- Coupons
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,

    -- Discount details
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount', 'free_cleaning', 'service_fee_waiver'
    discount_value DECIMAL(10,2) NOT NULL,
    max_discount_amount DECIMAL(10,2), -- Cap for percentage discounts
    currency VARCHAR(3) DEFAULT 'USD',

    -- Validity
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,

    -- Usage limits
    usage_limit INT, -- NULL = unlimited
    usage_count INT DEFAULT 0,
    per_user_limit INT DEFAULT 1, -- How many times one user can use

    -- Restrictions
    min_booking_amount DECIMAL(10,2) DEFAULT 0,
    user_restrictions JSONB DEFAULT '{}', -- {"new_users_only": true, "user_ids": ["uuid1", "uuid2"]}
    property_restrictions JSONB DEFAULT '{}', -- {"property_types": ["apartment"], "host_ids": ["uuid"]}
    cannot_combine BOOLEAN DEFAULT FALSE, -- Cannot be combined with other coupons

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'expired'

    -- Metadata
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_code ON coupons(code) WHERE status = 'active';
CREATE INDEX idx_coupons_valid_dates ON coupons(valid_from, valid_until) WHERE status = 'active';

-- Coupon usage history
CREATE TABLE coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    user_id UUID NOT NULL REFERENCES users(id),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    applied_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'applied', -- 'applied', 'refunded'
    usage_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    refunded_time TIMESTAMPTZ
);

CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user_id ON coupon_usage(user_id);

-- ============================================================================
-- 6. REVIEW TABLES
-- ============================================================================

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id), -- Host or guest
    property_id UUID REFERENCES properties(id),

    -- Review type
    review_type VARCHAR(20) NOT NULL, -- 'guest_to_host', 'host_to_guest'

    -- Ratings (1-5 scale)
    overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    cleanliness_rating INT CHECK (cleanliness_rating BETWEEN 1 AND 5),
    accuracy_rating INT CHECK (accuracy_rating BETWEEN 1 AND 5),
    communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
    location_rating INT CHECK (location_rating BETWEEN 1 AND 5),
    checkin_rating INT CHECK (checkin_rating BETWEEN 1 AND 5),
    value_rating INT CHECK (value_rating BETWEEN 1 AND 5),

    -- Review text
    review_text TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'published', 'hidden', 'flagged'

    -- Publishing (mutual release)
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_time TIMESTAMPTZ, -- When both reviews submitted or 14 days passed

    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    moderated_by UUID REFERENCES users(id),
    moderated_time TIMESTAMPTZ,

    UNIQUE(booking_id, reviewer_id) -- One review per user per booking
);

CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_property_id ON reviews(property_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);

-- Review responses (host can respond to guest reviews)
CREATE TABLE review_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID UNIQUE NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. MESSAGING TABLES
-- ============================================================================

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    guest_id UUID NOT NULL REFERENCES users(id),
    host_id UUID NOT NULL REFERENCES users(id),
    property_id UUID REFERENCES properties(id),

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'blocked'

    -- Metadata
    last_message_time TIMESTAMPTZ,
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(booking_id) -- One conversation per booking
);

CREATE INDEX idx_conversations_guest_id ON conversations(guest_id);
CREATE INDEX idx_conversations_host_id ON conversations(host_id);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),

    -- Message content
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'system', 'media'

    -- Media attachment
    attachment_url VARCHAR(500),
    attachment_type VARCHAR(20), -- 'image', 'document'

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,

    sent_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    read_time TIMESTAMPTZ,
    deleted_time TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, sent_time DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- ============================================================================
-- 8. FAVORITES/WISHLIST TABLES
-- ============================================================================

-- Wishlists
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);

-- Wishlist items
CREATE TABLE wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    added_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wishlist_id, property_id)
);

CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);

-- ============================================================================
-- 9. NOTIFICATION TABLES
-- ============================================================================

-- Notifications (in-app)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'booking_confirmed', 'message_received', 'review_received', etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    -- Related entities
    related_booking_id UUID REFERENCES bookings(id),
    related_message_id UUID REFERENCES messages(id),
    related_review_id UUID REFERENCES reviews(id),

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    read_time TIMESTAMPTZ,
    deleted_time TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, created_time DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

-- ============================================================================
-- 10. ADMIN & MODERATION TABLES
-- ============================================================================

-- Admin actions log
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL, -- 'user_suspended', 'property_approved', 'review_hidden'
    target_type VARCHAR(50) NOT NULL, -- 'user', 'property', 'review', 'booking'
    target_id UUID NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_type, target_id);

-- ============================================================================
-- 11. INITIAL DATA / SEED DATA
-- ============================================================================

-- Insert default admin user (password: admin123 - change in production!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (id, email, password_hash, is_verified, is_email_verified, status)
VALUES (
    uuid_generate_v4(),
    'admin@stay.com',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    TRUE,
    TRUE,
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Grant admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM users WHERE email = 'admin@stay.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================