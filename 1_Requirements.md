# Accommodation Service Requirements

## 1. User Management

### 1.1 Guest Access (Unregistered Users)
- Browse available accommodations without authentication
- View accommodation details (photos, amenities, pricing)
- View host profiles and reviews
- Search and filter accommodations
- Cannot make reservations or save favorites
- Prompted to sign up when attempting to book

### 1.2 User Registration & Authentication
**Sign-up Information:**
- **Required Fields:**
  - Email address (unique, verified)
  - Password (min 8 chars, complexity requirements)
  - Full name (first name, last name)
  - Phone number (with country code)
  - Date of birth (18+ age verification)
  
- **Optional Profile Information:**
  - Profile photo
  - Preferred language (default: browser language)
  - Timezone (auto-detected, editable)
  - Country of residence
  - City
  - Bio/About me
  - Emergency contact

**Sign-up Flow:**
- Email verification required
- Phone number verification (SMS OTP)
- Option to sign up via OAuth (Google, Facebook, Apple)
- Accept Terms of Service and Privacy Policy (required)

### 1.3 User Roles
**Two distinct user types:**

#### 1.3.1 Guest/Reserver
- Can search and book accommodations
- View booking history
- Write reviews for stayed accommodations
- Manage payment methods
- Communicate with hosts
- Save favorite accommodations
- Receive booking confirmations and reminders

#### 1.3.2 Host/Accommodator
- All guest privileges +
- List accommodations (multiple properties allowed)
- Set pricing and availability calendars
- Manage bookings and reservations
- Respond to guest inquiries
- Access host dashboard with analytics
- Set house rules and cancellation policies
- Verify identity (government ID required)
- Provide payout account information

**Role Switching:**
- Users can be both guest and host simultaneously
- Separate dashboards for each role
- Easy toggle between roles in UI

### 1.4 User Settings & Preferences
**Stored in `user_settings` table:**
- Marketing email consent (opt-in/opt-out)
- SMS notification preferences
- Push notification settings
- Newsletter subscription
- Privacy settings (profile visibility)
- Communication preferences
- Currency preference
- Measurement units (metric/imperial)
- Accessibility settings

**Settings are:**
- Updatable at any time
- Granular (separate toggles for different notification types)
- GDPR compliant (easy opt-out, data export/deletion)

### 1.5 Post-Registration Events
**Welcome Flow:**
- Send welcome email
- Issue welcome coupon (e.g., 10% off first booking)
- Guide through profile completion
- Suggest popular destinations
- Optional onboarding tour

**Coupon Distribution Triggers:**
- New user sign-up: 10% off first booking (30-day expiry)
- Email verification: Additional $10 credit
- Profile completion (80%+): $5 credit
- First booking as host: Reduced service fee
- Referral program: Credits for referrer and referee
- Seasonal promotions
- Birthday coupon (automatic on birthdate)

## 2. Accommodation Listings

### 2.1 Property Information
**Basic Details:**
- Property title and description
- Property type (apartment, house, villa, room, etc.)
- Address and location (coordinates)
- Number of bedrooms, beds, bathrooms
- Maximum guest capacity
- Check-in/check-out times
- Minimum/maximum stay duration

**Amenities:**
- Essential (WiFi, heating, AC)
- Kitchen facilities
- Parking availability
- Pet-friendly status
- Accessibility features
- Safety features (smoke detector, first aid, fire extinguisher)

**Media:**
- Photos (minimum 5, max 50)
- Virtual tour (optional)
- Video walkthrough (optional)

**Pricing:**
- Base price per night
- Weekend pricing
- Seasonal pricing rules
- Weekly/monthly discounts
- Extra guest fees
- Cleaning fees
- Service fees

**Availability:**
- Calendar management
- Blocked dates
- Instant booking vs. request to book
- Advance notice period
- Preparation time between bookings

### 2.2 House Rules & Policies
- Cancellation policy (flexible, moderate, strict)
- House rules (quiet hours, smoking, parties, etc.)
- Additional rules and notes

## 3. Search & Discovery

### 3.1 Search Capabilities
**Search Parameters:**
- **Location:** City, neighborhood, landmark, address, map area
- **Dates:** Check-in and check-out dates
- **Guests:** Number of adults, children, infants, pets
- **Price range:** Min/max per night
- **Property type:** Entire place, private room, shared room
- **Instant book:** Available now without host approval

**Advanced Filters:**
- Amenities (WiFi, kitchen, pool, gym, etc.)
- Accessibility features
- Host language
- Cancellation policy
- Property features (beachfront, mountain view, etc.)
- Number of bedrooms/bathrooms
- Star rating (guest reviews)

**Search Results:**
- Display on map view and list view
- Sort by: relevance, price (low/high), rating, distance
- Pagination or infinite scroll
- Save searches functionality

### 3.2 Recommendation Engine
- Based on user browsing history
- Similar properties
- Popular in your area
- Trending destinations
- Personalized suggestions

## 4. Booking & Reservations

### 4.1 Booking Flow
**For Guests:**
1. Select dates and guest count
2. View total price breakdown (nightly rate + fees + taxes)
3. Review cancellation policy
4. Choose payment method
5. Apply coupon codes
6. Confirm booking

**Instant Book vs. Request:**
- Instant book: Immediate confirmation
- Request to book: Host has 24h to accept/decline

### 4.2 Booking Statuses
- Pending (awaiting host approval)
- Confirmed
- In Progress (guest checked in)
- Completed
- Cancelled (by guest/host)
- Declined (by host)
- Expired (no response from host)

### 4.3 Booking Management
- View upcoming and past bookings
- Modify booking (if allowed by policy)
- Cancel booking (with policy enforcement)
- Contact host/guest
- Special requests and notes
- Guest count modifications
- Early check-in/late check-out requests

## 5. Payment System

### 5.1 Payment Methods
- Credit/Debit cards (Visa, Mastercard, Amex)
- Digital wallets (Apple Pay, Google Pay, PayPal)
- Bank transfers (for specific regions)
- Cryptocurrency (optional)
- Split payment (multiple cards)

### 5.2 Transaction Outbox Pattern
**Implementation for reliability:**
- All payment operations stored in `payment_outbox` table
- Status tracking: pending, processing, completed, failed, refunded
- Idempotency keys for duplicate prevention
- Retry mechanism with exponential backoff
- Dead letter queue for failed transactions
- Webhook handling for payment gateway responses

**Outbox Table Structure:**
```sql
payment_outbox (
  id, booking_id, user_id, amount, currency,
  payment_method, status, idempotency_key,
  retry_count, last_retry_at, created_at, processed_at
)
```

**Payment Flow:**
1. Create booking and payment_outbox entry (atomic transaction)
2. Background worker processes outbox entries
3. Call payment gateway API
4. Update outbox status based on response
5. Trigger confirmation emails/notifications
6. Handle webhooks for async payment updates

### 5.3 Payment Scenarios
- Full payment upfront
- Deposit + remaining balance (for long stays)
- Split payments among multiple guests
- Payment holds (auth before check-in, capture after)
- Refunds with cancellation policy enforcement
- Host payouts (released after check-in + grace period)
- Service fee collection

### 5.4 Pricing Calculation
```
Total = (Nightly Rate × Nights) 
        + Cleaning Fee 
        + Service Fee (guest)
        + Extra Guest Fees
        - Coupon Discount
        + Taxes
```

## 6. Coupon System

### 6.1 Coupon Types
- Percentage discount (e.g., 10% off)
- Fixed amount discount (e.g., $20 off)
- Free cleaning fee
- Service fee waiver
- First booking only
- Minimum spend requirements
- Maximum discount caps

### 6.2 Coupon Attributes
- Unique coupon code
- Discount type and value
- Validity period (start/end date)
- Usage limit (single use, multi-use, unlimited)
- User restrictions (new users only, specific users)
- Property restrictions (specific hosts, types)
- Minimum booking amount
- Cannot combine with other offers (flag)

### 6.3 Coupon Usage History
**Track in `coupon_usage` table:**
- Coupon ID
- User ID
- Booking ID
- Applied amount
- Usage timestamp
- Status (applied, refunded)

**Validation Rules:**
- Check expiration
- Verify usage count
- Validate minimum requirements
- Check user eligibility
- Ensure not already used (if single-use)
- Apply maximum discount caps

### 6.4 Coupon Management
**For Admins:**
- Create bulk coupons
- Generate unique codes
- Set distribution rules
- Track coupon performance
- Deactivate coupons
- Create targeted campaigns

**For Users:**
- View available coupons in wallet
- Apply at checkout
- See savings in booking breakdown
- Receive coupon notifications

## 7. Reviews & Ratings

### 7.1 Review System
- Guests can review hosts/properties after checkout
- Hosts can review guests
- 5-star rating with categories:
  - Cleanliness
  - Accuracy (vs. listing description)
  - Communication
  - Location
  - Check-in process
  - Value for money
- Written review (optional, encouraged)
- Review period: 14 days after checkout
- Mutual reviews released simultaneously

### 7.2 Rating Impact
- Overall property rating (average)
- Host rating and response rate
- Guest rating (for hosts to see)
- Superhost badge eligibility
- Search ranking influence

## 8. Communication

### 8.1 Messaging System
- In-app chat between guest and host
- Pre-booking inquiries
- Booking-related messages
- Automated booking confirmations
- Check-in instructions
- Review reminders
- Push notifications and emails

### 8.2 Customer Support
- Help center with FAQs
- Live chat support
- Phone support (priority for active bookings)
- Dispute resolution
- Emergency hotline (24/7)

## 9. Additional Features

### 9.1 Wishlist/Favorites
- Save properties for later
- Create multiple lists (categories)
- Share wishlists with others
- Price tracking alerts

### 9.2 Calendar Synchronization
- iCal integration
- Sync with other booking platforms
- Prevent double bookings
- Block personal dates

### 9.3 Host Dashboard
- Booking calendar view
- Earnings summary and analytics
- Performance metrics
- Guest messages inbox
- Review management
- Pricing optimization suggestions

### 9.4 Safety & Trust
- Identity verification (government ID)
- Background checks (optional, region-specific)
- Property verification photos
- Secure payments (held in escrow)
- $1M host guarantee insurance
- 24/7 safety line
- Two-factor authentication

### 9.5 Referral Program
- Invite friends via email/link
- Earn credits for successful referrals
- Track referral status
- Referral leaderboard

## 10. Admin & Moderation

### 10.1 Admin Capabilities
- User management (suspend, ban)
- Property approval workflow
- Review moderation
- Dispute resolution
- Coupon management
- Pricing rule configuration
- Analytics and reporting
- Fraud detection

### 10.2 Compliance
- GDPR compliance (data export, deletion)
- Local tax collection and remittance
- Short-term rental regulations
- Accessibility compliance
- Payment security (PCI-DSS)

## Database Schema Highlights

```
users (id, email, role, verified, created_at)
user_profiles (user_id, name, phone, language, timezone, residence)
user_settings (user_id, marketing_consent, notification_prefs)
properties (id, host_id, title, description, location, pricing)
bookings (id, property_id, guest_id, check_in, check_out, status)
payments (id, booking_id, amount, method, status)
payment_outbox (id, booking_id, amount, status, retry_count)
coupons (id, code, discount_type, discount_value, validity)
coupon_usage (id, coupon_id, user_id, booking_id, applied_at)
reviews (id, booking_id, reviewer_id, rating, comment)
```