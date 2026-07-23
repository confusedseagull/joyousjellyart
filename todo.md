# Joyous Jelly Art - Project TODO

## Database & Backend
- [x] Design and implement orders table schema
- [x] Create tRPC procedures for order creation
- [x] Create tRPC procedures for order retrieval (list and detail)
- [x] Create tRPC procedures for order updates
- [x] Create tRPC procedures for order status management
- [x] Implement admin authentication procedures

## Customer-Facing Features
- [x] Build customization tool UI with shape selection
- [x] Build theme selection with hierarchical options (Floral sub-options, Cartoon character input)
- [x] Build color picker (1 primary, 2 optional secondary colors)
- [x] Build text on cake input with language selection (English/Chinese)
- [x] Build flavour selection with conditional logic (1 for large shapes, 3 for Set of 9)
- [x] Build customer details form (Name, Phone Number)
- [x] Build delivery/pickup toggle
- [x] Build conditional address field for delivery option
- [x] Integrate Google Maps for pickup location display
- [x] Build date and time picker for order fulfillment
- [x] Create order confirmation page
- [x] Ensure mobile-responsive design throughout

## Admin Features
- [x] Create admin login page
- [x] Build admin dashboard with order overview (Completed, Past Orders, In Progress)
- [x] Build admin order detail view
- [x] Implement order editing functionality
- [x] Implement mark as complete functionality
- [x] Ensure admin role-based access control

## Design & Styling
- [x] Integrate brand color #84CECF throughout the application
- [x] Apply Figtree font as primary typeface
- [x] Implement clean, minimalist Scandinavian aesthetic
- [x] Ensure full mobile responsiveness

## Testing & Deployment
- [x] Write vitest tests for backend procedures
- [x] Test customer order flow end-to-end
- [x] Test admin dashboard and order management
- [x] Create final checkpoint

## Bug Fixes
- [x] Fix duplicate color key #6C5CE7 in COLORS array causing React warning
- [x] Fix flavour selection not working on customization page
- [x] Update Google Maps link to https://maps.app.goo.gl/QxsyoNaTnYSz4fqu5
- [x] Update "Your Details" to "Contact Details" in customer form
- [x] Update "Phone Number *" to "Phone Number (WhatsApp) *" to clarify communication method
- [x] Fix Floral theme sub-options reverting to default when selected
- [x] Fix React rendering error in AdminDashboard (setState during render)
- [x] Fix React hooks violation in AdminDashboard (early return before hooks)
- [x] Fix setState during render in AdminOrderDetail component
- [x] Fix /admin route to show admin login page instead of home page
- [x] Fix admin authentication - user routed to home page instead of dashboard after login
- [x] Fix OAuth callback error "code and state are required" after login
- [x] Fix admin login redirect loop - user sent back to /admin/login after completing authentication
- [x] Add image display functionality to show visual examples for each customization option (shapes, themes, colors)
- [x] Update Set of 9 shape image with actual product photo
- [x] Replace all placeholder images with actual product photos (Numbers, Cartoon, Mahjong, Under the Sea, Floral)
- [x] Add Instagram reference section after Flavours with up to 3 link inputs and optional description fields
- [x] Update UI to match joyousjellyart.com design (header, logo, font, border radius)
- [x] Remove admin link from header and replace text logo with image logo
- [x] Remove customize your cake navigation link from header
- [x] Remove gradient/ombre color effects from homepage
- [x] Replace header logo with new JJA_logo.png
- [x] Remove black background from logo to make it transparent
- [x] Add sub-header navigation with Customised Order and 2026 CNY Collection buttons
- [x] Create 2026 CNY Collection page
- [x] Remove Start Customizing button from homepage
- [x] Remove header border lines and add scroll effect to change background color
- [x] Populate CNY designs from 2026 CNY Designs Excel sheet
- [x] Change Order This Design button to Add to Cart
- [x] Create popup modal for size and flavor selection before adding to cart
- [x] Make price on CNY design cards bigger and bolder
- [x] Make From text smaller and unbolded while keeping price large and bold
- [x] Change Year of the Snake to Year of the Horse and remove card borders
- [x] Add shopping cart icon with item count badge to header
- [x] Create cart page with order summary and quantity controls
- [x] Add delivery method selection (pickup/delivery) and checkout form to cart page
- [x] Update backend to handle cart checkout orders
- [x] Reorganize cart checkout form with special instructions as separate card
- [x] Copy delivery details card design from customized order page to cart
- [x] Remove borders from all cards and update heading font on cart page
- [x] Combine order summary and cart items into one card, remove Your Items heading
- [x] Remove item count badge from cart icon in header
- [x] Add item count badge back to cart icon in header
- [x] Remove success message div from CNY2026 page
- [x] Reduce card size to fit images and remove white borders from CNY cards
- [x] Remove shadow effects from all CNY collection cards
- [x] Standardize all CNY cards to same size with fixed-height images and no white space
- [x] Remove space between top of card and top of image
- [x] Add subtle shadow to Add to Cart buttons
- [x] Add shadow-sm back to CNY product cards
- [x] Update cart page cards to use shadow-sm
- [x] Add email address field to Contact Details
- [x] Change time input to time range selection (1hr delivery, 2hr pickup)
- [x] Remove description from Additional Notes card
- [x] Update Special Instructions title to Additional Notes
- [x] Swap cart page columns: Order Summary and Additional Notes to right, Contact and Delivery Details to left
- [x] Change Place Order button text to Confirm order and pay
- [x] Add admin users table to database schema
- [x] Create backend authentication procedures (login, signup, session)
- [x] Create admin login page
- [x] Create admin signup page
- [x] Update admin dashboard to use email/password authentication
- [x] Remove card backgrounds from Order Summary and Additional Notes
- [x] Adjust cart column widths so right column is narrower than left
- [x] Move product price to the far right in cart items
- [x] Remove unnecessary div elements from cart page
- [x] Fix admin sign-in not working
- [x] Fix admin login redirect to go to /admin/dashboard
- [x] Add logout button to admin dashboard header
- [x] Integrate CNY Collection cart orders into admin dashboard
- [x] Add order search and filtering functionality
- [x] Remove completed tab from admin dashboard
- [x] Add Collection Orders and Custom Orders subcategories
- [x] Add back statistics cards for all order statuses
- [x] Update order statuses to: Pending Confirmation, In Progress, Completed, Delivered
- [x] Add tabs for all four statuses
- [x] Update database schema to support new status values
- [x] Fix order type filtering so CNY orders only appear under Collection Orders
- [x] Add auto-rotating hero image carousel to home page
- [x] Change header text from "Customised Order" to "Custom Order"
- [x] Remove manual navigation arrows from hero carousel
- [x] Update carousel hero text to CNY theme
- [x] Move hero text closer to bottom of carousel
- [x] Add Order Now button linking to CNY collection
- [x] Increase carousel height to accommodate firecracker image
- [x] Apply typography changes to all CNY product cards
- [x] Change all button colors to #8CB9BC
- [x] Change shopping cart icon back to brown color
- [x] Change cart price and link text back to brown color
- [x] Connect cart checkout to database to create CNY orders
- [x] Add tRPC mutation for creating CNY orders from cart
- [x] Update Cart page to call mutation on confirm order
- [x] Show success message and redirect after order creation
- [x] Add localStorage persistence to cart to prevent items from being lost
- [x] Move hero text and button up on carousel for immediate visibility
- [x] Fix "Please fill in all required fields" error on checkout button
- [x] Fix "Order not found" error on admin order detail pages by adding order type to URL routing
## Date Picker Issues

- [x] Fix date picker dropdown positioning to appear above field instead of below (currently cut off)
- [x] Enforce 24-hour minimum lead time - disable dates/times less than 24 hours from current time

## Time Range Validation
- [x] Enhance time range validation to ensure date + time combination is at least 24 hours from current time

## Delivery Fee
- [x] Add delivery method and fee to order summary (pickup: free, delivery: $20)

## Order Confirmation Page
- [x] Create order confirmation page with order number and order summary

## Bug Fixes
- [x] Fix TypeError in OrderConfirmation: item.price.toFixed is not a function

## Order Number Improvements
- [x] Add orderNumber field to database schema (both orders and cnyOrders tables)
- [x] Generate order numbers on backend for consistency
- [x] Display order numbers in admin dashboard

## Order Number Format Update
- [x] Change CNY order numbers from CNY000001 to CNY0001 (4-digit padding)
- [x] Change custom order numbers from ORD000001 to CST0001 (4-digit padding)

## Order Number Reset
- [x] Reset order numbers to start from CNY0001 and CST0001

## Product Card Alignment
- [x] Fix product card spacing so Add to Cart buttons align at same position

## Product Card Padding Adjustment
- [x] Ensure equal bottom padding between Add to Cart button and card edge
- [x] Reduce padding between product image and title

## Product Card Image Padding
- [x] Remove padding between card container and product image

## Price Color Update
- [x] Change all price colors from blue back to brown

## Base Flavor Updates
- [x] Add pineapple flavor for all products
- [x] Remove earl grey black tea flavor
- [x] Remove cappuccino flavor

## Product Dimensions and Pricing
- [x] Add dimensions to all CNY collection products
- [x] Update Fortune Ingot with new pricing options ($88, $128, $168 for 6, 8, 10 inch bases)

## Modal Dimensions Display
- [x] Add dimensions to product detail modals/popups

## Time Slots Update
- [x] Update delivery time slots to: 10-1pm, 2-5pm, 5-7pm
- [x] Update pickup time slots to: 11-1pm, 1-3pm, 3-5pm, 5-7pm

## Minimum Lead Time Update
- [x] Update minimum order lead time from 24 hours to 4 days (96 hours)

## HitPay Payment Integration
- [x] Store HitPay sandbox credentials securely in environment variables
- [x] Create backend payment request API endpoint
- [x] Create webhook endpoint for payment confirmation
- [x] Update Cart checkout to integrate HitPay payment flow
- [x] Update database schema to track payment status
- [x] Write tests for webhook handler and payment request creation
- [x] Add payment status display to admin dashboard
- [x] Add payment status display to admin order detail pages
- [ ] Test complete payment flow with sandbox (PayNow and cards)
- [ ] Add website footer with contact information

## Bug Fixes - Payment Flow
- [x] Fix cart clearing timing - cart should only be cleared after payment is confirmed and order confirmation page is displayed
- [x] Order confirmation page should only be shown after payment is confirmed by HitPay
- [x] Enable credit card payment option in HitPay payment page

## Bug - Order Confirmation Page
- [x] Fix order confirmation page not displaying after payment is confirmed

## Cart Drawer Feature
- [x] Create slide-out cart drawer component using shadcn Sheet
- [x] Show cart items with thumbnails, quantities, and prices
- [x] Add "Go to Checkout" button in drawer
- [x] Trigger drawer to open when items are added to cart

## Visual Editor Changes
- [x] Change all "inch/inches" to " symbol in product dimensions
- [x] Add padding and reduce size of checkout buttons in cart drawer
- [x] Ensure consistent Add to Cart button positioning across all product cards

## Cart Drawer Fixes
- [x] Fix product card button positioning to be exactly the same height across all cards
- [x] Increase padding in cart drawer for better spacing (less cramped)
- [x] Fix cart drawer price calculation showing $NaN
- [x] Make header cart icon open cart drawer instead of navigating to cart page

## Visual Editor Changes - Product Dimensions
- [x] Add dimension text "8\" or 10\"" to products with 8" and 10" size options
- [x] Add dimension text "6\" or 8\" or 10\"" to Fortune Ingot
- [x] Add dimension text "3\" each" to products with Standard size in Fortune Edition
- [x] Simplify "10\" radius" to "10\"" for Joyful Koi Lux Platter
- [x] Simplify "10\" length" to "10\"" for Firecracker
- [x] Adjust cart drawer footer width to match content area

## UI Modernization
- [x] Update typography and font system for modern appearance
- [x] Enhance layout spacing and white space throughout the site
- [x] Add modern visual effects, shadows, and transitions
- [x] Refine product card design with contemporary styling
- [x] Update color palette while retaining brand teal color

## Cart Drawer Layout Refinement
- [x] Reduce Shopping Cart title font size
- [x] Improve header layout and spacing
- [x] Refine empty state positioning and balance

## Bug - Payment Redirect to Login Page
- [x] Fix order confirmation page requiring authentication after HitPay payment
- [x] Make order confirmation page publicly accessible without login
- [x] Test complete payment flow in production

## UI Polish - Cart Drawer
- [x] Remove focus outline from cart icon when drawer opens
- [x] Remove focus outline from delete button in cart drawer

## Product Card Layout
- [x] Fix uneven vertical padding - make top and bottom padding equal

## Product Card Padding Fine-tuning
- [x] Reduce top padding in product cards
- [x] Increase bottom padding in product cards

## Input Validation
- [x] Add phone number validation - only allow integers (no letters or special characters)
- [x] Add email address validation - ensure format follows x@y.com pattern

## Logo Size Adjustment
- [x] Reduce logo size by 20% in header

## Calendar Default Month Fix
- [x] Fix calendar to display month of next available date (4 days from now) instead of current month

## HitPay Redirect URL Fix
- [x] Update HitPay redirect URL to use custom domain (joyousjellyart.manus.space) instead of internal run.app URL
- [x] Add environment variable for custom domain URL

## Order Confirmation Page Updates
- [x] Change header text to "Order Confirmed!" with subtitle "Thank you for your order. We'll be in touch once your order is ready!"
- [x] Group fulfillment date and time together (e.g., "6 February 2026, 11:00 - 13:00")
- [x] Use order number as Order Summary section header (e.g., "Order CNY210009")
- [x] Remove separate order number card above order summary
- [x] Remove "What's Next" section
- [x] Hide notes field when it only contains time range information

## Favicon Update
- [x] Remove black background from logo image
- [x] Set processed logo as website favicon

## Website Footer
- [x] Create Footer component with Instagram link
- [x] Add WhatsApp deeplink button
- [x] Add location with Google Maps link
- [x] Integrate Footer into main layout

## Footer Updates
- [x] Update WhatsApp phone number to +65 8299 9559
- [x] Remove operating hours from footer

## Google Maps Button
- [x] Update Google Maps link to https://maps.app.goo.gl/TvuRcXYAm97F7q6c9
- [x] Add prominent button for viewing location on Google Maps
- [x] Change "Pick-up Location" to "Location"

## Footer Visual Edit
- [x] Remove map pin icon from address text line (keep only in button)
- [x] Fix: Actually removed the MapPin component from address line

## Footer Address Formatting
- [x] Add line break in address - move "Singapore 548182" to second line

## Footer Spacing Adjustment
- [x] Reduce gap between footer sections - bring "Get in Touch" and "Location" closer together

## Footer Visual Edits
- [x] Replace About section text with half-size logo
- [x] Reduce Contact section width to hug contents
- [x] Reduce Location section width to hug contents

## Footer Logo Update
- [x] Replace favicon with full logo from header (half size)

## Footer Layout Reorganization
- [x] Move "Get in Touch" and "Location" to the right, grouped together
- [x] Keep logo on the left side

## Product Flavor Updates
- [x] Remove jujube, chocolate, and berries flavors from Prosperity Koi
- [x] Remove jujube, chocolate, and berries flavors from Fortune Koi

## Bug Fixes
- [x] Fix order confirmation page not displaying after payment on mobile - redirects to home page instead
  - Added localStorage fallback for order number
  - Added backend fetch as additional fallback
  - Improved error handling and logging

## Cart Page Scroll Issue
- [x] Fix cart page to scroll to top on mobile - improved with multiple fallbacks

## Product Dimension Updates
- [x] Update Fortune Koi dimensions to 9"
- [x] Update Prosperity Koi dimensions to 9"

## Dimension Format Update
- [x] Add dimensions in cm to all product listings (format: 9" / 23 cm, rounded to nearest whole number)

## HitPay Production Migration
- [ ] Switch from HitPay sandbox to live production environment
- [ ] Update API credentials (API key and salt)
- [ ] Update API endpoint URLs to production
- [ ] Test live payment flow

## Address Entry Format Update
- [x] Update delivery address to separate fields: Address Line 1 (required), Line 2, Unit Number, Postal Code (required)
- [x] Mark required fields with asterisk
- [x] Update database schema to store structured address
- [x] Update validation logic for new address format

## Hero Image Update
- [x] Replace hero section image with new CNY jelly art photo

## Hero Section Simplification
- [x] Remove carousel functionality and use only the new CNY image

## Hero Text Readability Enhancement
- [x] Add dark gradient overlay to hero image for better text contrast

## Product Image Update
- [ ] Replace all CNY 2026 product listing images with new photos

## Product Image Replacement
- [x] Replace product images with new high-quality photos

## Image Aspect Ratio Update
- [x] Change all product image sections to 3:4 aspect ratio

## Homepage Subsections
- [x] Add product showcase subsections with new images to homepage

## Remove Showcase Section Buttons
- [x] Remove CTA buttons from product showcase sections below hero

## Homepage Content Rewrite
- [x] Rewrite subsection content to focus on artisan qualities instead of product names

## Auspicious Edition Products
- [x] Create product listings for 9-piece prosperity platter (2 versions)
- [x] Create product listings for 4-piece blessing set
- [x] Create product listing for prosperity character cake
- [x] Add all products to CNY 2026 collection page

## UI Size Reduction
- [x] Reduce product card dimensions and spacing
- [x] Reduce font sizes for better visual hierarchy
- [x] Improve information density across the site

## Layout Improvements
- [x] Increase spacing between product cards
- [x] Move cart button to far right in navigation (already positioned)
- [x] Reduce text and image sizes on homepage

## Product Card Minimal Design
- [x] Remove borders from product cards
- [x] Remove background from product cards

## Header Size Reduction
- [x] Reduce logo size by 20%
- [x] Reduce header height/padding

## Multi-Flavor Selection
- [ ] Allow up to 3 flavor selections for 3" designs
- [ ] Allow up to 2 flavor selections for 4" designs
- [ ] Update product modal UI for multi-flavor selection
- [ ] Update cart logic to store and display multiple flavors

## Multi-Flavor Selection
- [x] Allow up to 3 flavors for 3" designs
- [x] Allow up to 2 flavors for 4" designs
- [x] Update cart to display multiple flavors
- [x] Update order confirmation to display multiple flavors

## Cart Form Updates
- [x] Remove spacing before asterisks in all required field labels
- [x] Remove unit number field from address entry

## UI Updates
- [x] Remove cart icons from all "Add to Cart" buttons

## Dietary Requirements
- [x] Add optional "No Dairy" dietary requirement checkbox to product selection modal
- [x] Store dietary requirements with cart items
- [x] Display dietary requirements in cart, order confirmation, and admin dashboard

## Admin Dashboard Redesign
- [x] Reorganize dashboard tabs to Past, Today, and Upcoming based on delivery date
- [x] Update order detail layout to match the order form structure with sections for Collection/Delivery, Product Descriptions, and totals
- [x] Implement date-based filtering logic for Past/Today/Upcoming orders

## Dashboard Tab Order
- [x] Reorder tabs: Upcoming (left), Today (middle), Past (right)

## Order Detail UI Redesign
- [x] Convert order detail from form-style to modern dashboard layout
- [x] Keep same content positioning but use cards and modern styling

## Order Detail Page Restructure
- [x] Add order number and delivery date at top
- [x] Section 1: Customer Details (name, phone, email)
- [x] Section 2: Delivery/Collection Details (method, address, date/time)
- [x] Section 3: Order Details with large product images, Size subsection, Flavours subsection

## Order Detail Layout Adjustments
- [x] Move time range to delivery details section
- [x] Reformat additional notes section to match size/flavours style
- [x] Arrange product image and details side-by-side to save vertical space
- [x] Reorder dashboard statistics: Upcoming (left), Today (middle), Past (right)

## Time Range Field Fix
- [x] Add timeRange field to cnyOrders database schema
- [x] Update cart form to capture time range input and pass to backend
- [x] Display time range in Delivery/Collection Details section (not in Additional Notes)
- [x] Remove time range from appearing in Additional Notes

## Remove Status Field
- [x] Remove status field from cnyOrders and orders database schema
- [x] Remove status management UI from AdminOrderDetail page
- [x] Remove status badge display from admin pages
- [x] Remove status update mutations from backend

## Fix Database Query Error
- [x] Fix persistent "Failed query" error when loading orders list in admin dashboard
- [x] Changed list endpoints from adminProcedure to publicProcedure since admin auth is handled client-side

## OAuth Authentication Status
- [x] Verified that customer-facing features are already public (no login required)
- [x] Confirmed admin authentication works independently via email/password
- [x] OAuth infrastructure kept in place but not used by customers

## HitPay Sandbox Integration
- [x] Add HitPay sandbox API key and secret as environment variables
- [x] Update HitPay configuration to use sandbox endpoint (https://api.sandbox.hit-pay.com)
- [x] Test payment flow with sandbox credentials (vitest validation passed)

## Email Notifications
- [ ] Implement email notification system for order confirmations
- [ ] Send email to customer when payment is confirmed
- [ ] Include order details, delivery info, and product customizations in email
- [ ] Set up email template for order confirmation

## Delivery Cost Calculator
- [x] Create backend function to calculate distance from shop (2 Jln Lokam, #01-27 KENSINGTON SQUARE, Singapore 537846)
- [x] Implement delivery fee calculation based on distance tiers (5km=$18, 5-10km=$19, 10-20km=$22, >20km=$25)
- [x] Add tRPC procedure to get delivery cost for customer address
- [x] Update cart page to show delivery cost dynamically with distance
- [x] Include delivery fee in total order amount

## Remove Redundant Time Field
- [x] Remove time field from AdminOrderDetail display (keep only timeRange)
- [x] Verified database schema only uses fulfillmentDate (no separate time field)
- [x] Cart.tsx already sends only date and timeRange (no separate time field)

## Remove Distance Display from Cart
- [x] Remove distance (km) from delivery line in cart order summary

## Reorganize Delivery Details Layout
- [x] Move Date, Time Range, and Day to display in one row
- [x] Add time range to the delivery date display at the top of the order detail page

## Add Time Range to Order Confirmation
- [x] Display time range on order confirmation screen under "Fulfillment Date and Time"

## Fix Delivery Fee Display on Order Confirmation
- [x] Update OrderConfirmation to use actual delivery fee from database instead of hardcoded $20

## Payment Status Display
- [x] Display payment status badge on admin order detail page (Paid/Pending/Failed/Refunded)
- [x] HitPay webhook automatically updates payment status to "paid" when payment completes

## Simplify Admin Dashboard Order Cards
- [x] Remove customer name from order card body
- [x] Remove payment status from order card body
- [x] Keep only: Order Items (count and total), Delivery date and time range, Delivery Method
- [x] Keep order number, collection type badge, and payment status in card header

## Fix Payment Status Display Bug
- [ ] Investigate why order CNY450004 shows "Payment Pending" when payment is completed
- [ ] Check if HitPay webhook is being triggered and received
- [ ] Verify webhook signature validation is working correctly
- [ ] Add logging to webhook handler to debug payment confirmation
- [ ] Test complete payment flow and verify database update

## Fix Order Confirmation Page Display Issues
- [x] Fix double dollar sign on item price (showing "$$128" instead of "$128")
- [x] Add missing delivery fee row in price breakdown
- [x] Ensure price breakdown shows: Subtotal, Delivery Fee, Total

## Fix NaN Price Display Bug
- [x] Investigate why item.price shows as NaN after parseFloat
- [x] Fix price display logic to properly handle numeric and string prices
- [x] Test with actual order data to ensure prices display correctly

## Re-add Customize Page to Navigation
- [x] Add Customize link to Header navigation bar
- [x] Ensure navigation is visible and functional

## Update HitPay to Production Credentials
- [x] Update HITPAY_API_KEY to production key
- [x] Update HITPAY_API_SECRET to production secret
- [x] Update HITPAY_API_URL to production URL (https://api.hit-pay.com)
- [x] Verify credentials are properly configured

## CRITICAL: Fix Payment Verification Before Order Confirmation
- [x] Investigate current payment flow and redirect logic
- [x] Add payment status verification when user returns from HitPay
- [x] Only show order confirmation page if payment status is "completed"
- [x] Show pending payment message if payment is not yet completed
- [x] Show payment failed message if payment failed
- [x] Prevent cart from being cleared until payment is confirmed
- [ ] Test complete payment flow with HitPay production

## Verify Visual Edits and Favicon Configuration
- [x] Verify CNY product name changes with Chinese translations
- [x] Check if favicon logo is uploaded and located
- [x] Configure favicon in HTML to use uploaded logo
- [x] Test favicon displays correctly in browser

## Replace Favicon with Joyous Jelly Art Logo
- [x] Process uploaded logo to remove black background
- [x] Save processed logo as favicon.png
- [x] Replace current Manus favicon with new logo
- [x] Verify favicon displays correctly in browser

## Fix Favicon Colors
- [x] Convert black strokes to white strokes in favicon
- [x] Ensure brown/golden shapes remain with transparent background
- [x] Match the reference design exactly (brown + white, no black)
- [x] Test corrected favicon in browser

## Reorganize Custom Order Flow
- [x] Review PDF specification for new customization flow
- [x] Implement new step sequence: Theme → Design → Color (floral only) → Shape/Size → Base Flavour → Add Text → Reference Photos → Dietary Requirements
- [x] Make color selection conditional (only show for floral bouquet theme)
- [x] Implement dynamic cost estimation based on theme and shape/size
- [x] Ensure other selections (flavor, text, photos, dietary) don't affect price
- [x] Update database schema to match new customization structure
- [x] Test complete customization flow with pricing

## Apply Visual Edits to Customize Page
- [x] Change "Describe Your Hand-Drawn Design" to "Custom Hand Drawn Design"
- [x] Fix spacing to be even throughout the form
- [x] Change "Dairy free" to "Dairy Free" (capitalize F)
- [x] Change "Reference Links (Instagram, Pinterest, etc.)" to "Reference Links from our Instagram"
- [x] Add photo upload option for reference images

## Improve Field Label Spacing
- [x] Increase spacing between field labels and input fields throughout Customize page

## Add Individual Shape Selection for Platters
- [x] Add step after size selection for "Platter of 9" and "Platter of 4"
- [x] Allow customers to choose individual shapes (square, heart, circle, clover) for each piece
- [x] Update UI to show shape selection grid for platters
- [x] Store individual shape selections in order data
- [x] Update database schema to include platterShapes field
- [x] Test platter customization flow

## Reorganize Numbers as Separate Shape
- [x] Remove "2numbers_8_8" size from octagon shape
- [x] Add "Numbers" as its own shape option
- [x] Add size "8" + 8" / 20.3 cm 2 Numbers (0-9)" to Numbers shape
- [x] Show number input field when Numbers shape and size are selected
- [x] Test Numbers shape selection flow

## Simplify Numbers Size Label
- [x] Update Numbers size label from '8" + 8" / 20.3 cm 2 Numbers (0-9)' to '8" + 8" / 20.3 cm'

## Add Platter of 4 Size Options
- [x] Add 6cm size option for Platter of 4 (choose 2 shapes: square, heart, clover, round)
- [x] Add 10cm size option for Platter of 4 (square only, no shape selection)
- [x] Update shape selection to show only for 6cm size
- [x] Limit shape selection to 2 shapes for 6cm platter of 4
- [x] Test both size options with correct shape selection behavior

## Fix Size Label and Next Step Issues
- [x] Add 25.4 cm measurement to 10cm size labels
- [x] Add 25.4 cm x 17.8 cm measurement to rectangle size labels
- [x] Fix issue where next step doesn't appear after selecting certain size options

## Improve Shape Selection UX
- [x] Make entire shape selection card clickable instead of just the radio button

## Fix Missing Price for Platter of 4 10cm
- [x] Add price configuration for Platter of 4 10cm size option

## Add Quantity Input for Individual Items
- [x] Add quantity input field for Individual Mini Gift Box
- [x] Add quantity input field for Individual Cupcake
- [x] Update pricing calculation to multiply by quantity
- [x] Test quantity input with different values

## Optimize Customize Page UI Spacing
- [x] Optimize spacing between major sections (cards)
- [x] Refine spacing within cards (padding, margins)
- [x] Improve spacing for form elements (labels, inputs, checkboxes)
- [x] Enhance spacing for selection grids (themes, shapes, sizes)
- [x] Test responsive spacing on mobile and desktop

## Add Progress Indicator to Customization Form
- [x] Design progress bar structure with step labels
- [x] Implement step tracking logic based on form completion
- [x] Add progress bar component at top of form
- [x] Style progress bar with visual feedback for completed/current/upcoming steps
- [x] Test progress indicator with different customization paths

## Make Progress Bar Sticky
- [x] Add sticky positioning to progress indicator
- [x] Ensure progress bar stays visible when scrolling
- [x] Test sticky behavior on mobile and desktop

## Update Fulfillment Timing to Match Checkout Time Slots
- [x] Find checkout time slots configuration
- [x] Update fulfillment timing options to match exactly
- [x] Test that time slots are consistent across checkout and fulfillment

## Change Circle Labels to Round
- [x] Find all instances of "Circle" in shape labels
- [x] Update "Circle" to "Round" for consistency
- [x] Test that all labels display correctly

## Remove Progress Indicator Background
- [x] Remove background color from progress indicator component
- [x] Test visual appearance without background

## Redesign Custom Order Flow with Grid-Based Selection
- [x] Redesign theme selection as visual grid with CNY card styling
- [x] Redesign shape selection as visual grid with product images
- [x] Redesign size selection as grid of option cards
- [x] Redesign flavor selection as grid of clickable tiles
- [x] Apply CNY typography, spacing, and button styling throughout
- [x] Update progress indicator to match CNY aesthetic
- [x] Test complete grid-based customization flow

## Fix Progress Bar Overlapping Header
- [x] Adjust z-index to ensure header stays on top of progress indicator
- [x] Test that header navigation is fully accessible

## Adjust Progress Bar Height
- [x] Reduce progress bar height for better visual balance
- [x] Test visual consistency with step indicators

## Adjust Progress Bar Width
- [x] Reduce progress bar horizontal width to match step indicators section
- [x] Test width alignment with step indicators

## Adjust Header Font Size and Progress Indicator Position
- [x] Reduce main header font size from 60px to 44px
- [x] Move progress indicator below the "Create Your Custom Jelly Cake" header
- [x] Test new layout arrangement

## Add Theme Images to Customization Page
- [x] Crop 9 uploaded theme images to 1:1 ratio (800x800px)
- [x] Optimize images for web (under 200KB each)
- [x] Upload processed images to S3
- [x] Integrate image URLs into theme selection cards
- [x] Test image display on customization page

## Update Theme Card Aspect Ratio
- [x] Change theme cards from 3:4 to 1:1 square format
- [x] Test card layout with square images

## Replace Space Theme Image
- [x] Crop new Space image to 1:1 ratio (800x800px)
- [x] Upload processed image to S3
- [x] Replace Space image URL in Customize.tsx
- [x] Test updated Space card display

## Implement Lego Theme Carousel
- [x] Crop 4 Lego images to 1:1 ratio (800x800px)
- [x] Upload processed Lego images to S3
- [x] Create auto-rotating carousel component for theme cards
- [x] Integrate carousel into Lego theme card
- [x] Test carousel auto-rotation functionality

## Add 4 New Theme Images
- [x] Crop Hand Drawn, Cactus, Mahjong, Koi Pond images to 1:1 ratio (800x800px)
- [x] Upload processed images to S3
- [x] Update theme card URLs for Hand Drawn, Cactus, Mahjong, Koi Pond
- [x] Test updated theme cards display

## Add Butterflies and Cars Theme Images
- [x] Crop Butterflies and Cars images to 1:1 ratio (800x800px)
- [x] Upload processed images to S3
- [x] Update theme card URLs for Butterflies and Cars
- [x] Test updated theme cards display

## Add Golf Theme Image and Unicorn Carousel
- [x] Crop Golf image to 1:1 ratio (800x800px)
- [x] Crop 3 new Unicorn images to 1:1 ratio (800x800px)
- [x] Upload Golf and Unicorn images to S3
- [x] Update Golf theme card with image URL
- [x] Convert Unicorn card from single image to carousel with 4 images
- [x] Test Golf card and Unicorn carousel display

## Add Shape Selection Images
- [x] Crop 14 shape images to 1:1 ratio (800x800px)
- [x] Upload processed shape images to S3
- [x] Integrate images into shape selection cards
- [x] Test shape images display

## Add Cartoon Characters Swipeable Carousel
- [x] Crop 4 cartoon character images to 1:1 ratio (800x800px)
- [x] Upload processed images to S3
- [x] Convert Cartoon Characters card from single image to swipeable carousel
- [x] Add touch/swipe support for mobile users
- [x] Test carousel swipe functionality on desktop and mobile

## Replace Platter of 4 Shape Image
- [x] Crop new Platter of 4 image to 1:1 ratio (800x800px)
- [x] Upload processed image to S3
- [x] Replace Platter of 4 image URL in Customize.tsx
- [x] Test updated Platter of 4 card display

## Convert Platter of 4 to Carousel
- [x] Convert Platter of 4 from single image to carousel with 2 images (old + new)
- [x] Test Platter of 4 carousel functionality

## Expand Platter of 4 Carousel with 2 More Images
- [x] Crop 2 new Platter of 4 images to 1:1 ratio (800x800px)
- [x] Upload processed images to S3
- [x] Add 2 new images to Platter of 4 carousel (expand from 2 to 4 images)
- [x] Test expanded Platter of 4 carousel with 4 images

## Expand Platter of 4 Carousel to 6 Images
- [x] Crop 2 more Platter of 4 images to 1:1 ratio (800x800px)
- [x] Upload processed images to S3
- [x] Add 2 more images to Platter of 4 carousel (expand from 4 to 6 images)
- [x] Test expanded Platter of 4 carousel with 6 images

## Replace Platter of 4 Carousel with 2 New Images Only
- [x] Replace existing Platter of 4 carousel with ONLY the 2 newly uploaded images
- [x] Debug carousel display issues
- [x] Test carousel with 2 images

## Expand Cartoon Characters Carousel with 2 More Images
- [x] Crop 2 new cartoon character images to 1:1 ratio (800x800px)
- [x] Upload processed images to S3
- [x] Add 2 new images to Cartoon Characters carousel (expand from 4 to 6 images)
- [x] Test expanded Cartoon Characters carousel with 6 images

## Create Carousels for Floral Bouquet, Under the Sea, and Hand Drawn
- [x] Crop 4 Floral Bouquet images to 1:1 ratio (800x800px)
- [x] Crop 3 Under the Sea images to 1:1 ratio (800x800px)
- [x] Crop 2 Hand Drawn images to 1:1 ratio (800x800px)
- [x] Upload all 8 processed images to S3 (note: Hand Drawn already has 1 image, will have 3 total)
- [x] Convert Floral Bouquet from single image to carousel with 4 images
- [x] Convert Under the Sea from single image to carousel with 4 images
- [x] Convert Hand Drawn from single image to carousel with 3 images
- [x] Test all 3 new carousels functionality

## Expand Existing Carousels and Add New Theme Images
- [x] Crop 3 more Floral Bouquet images to 1:1 ratio (800x800px)
- [x] Crop 2 Koi Pond images to 1:1 ratio (800x800px)
- [x] Crop 3 Mahjong images to 1:1 ratio (800x800px)
- [x] Crop 1 Under the Sea image to 1:1 ratio (800x800px)
- [x] Crop 1 Hand Drawn image to 1:1 ratio (800x800px)
- [x] Crop 1 Poker image to 1:1 ratio (800x800px)
- [x] Crop 1 Star shape image to 1:1 ratio (800x800px)
- [x] Upload all 11 processed images to S3
- [x] Expand Floral Bouquet carousel from 4 to 7 images
- [x] Create Koi Pond carousel with 2 images
- [x] Create Mahjong carousel with 4 images
- [x] Expand Under the Sea carousel from 4 to 5 images
- [x] Expand Hand Drawn carousel from 3 to 4 images
- [x] Create Poker carousel with 2 images
- [x] Add Star shape image to shape selection
- [x] Test all updated carousels functionality

## Visual Editor Adjustments
- [x] Reduce hero section padding on Customize page (py-16 md:py-20)
- [x] Add bottom padding to quantity label (pb-12px)
- [x] Further reduce hero section padding (py-24)
- [x] Delete subtitle paragraph in hero section

## Bug Fixes
- [x] Fix price calculation showing floating-point precision error (e.g., $56.699999999999996)

## Bug Fixes (Padding)
- [x] Remove Tailwind padding classes that conflict with visual editor inline styles

## New Customization Features
- [x] Allow users to select up to 3 colors for Floral Bouquet theme
- [x] Add 7 new pastel colors: white, pastel pink, pastel red, pastel orange, pastel yellow, pastel blue, pastel purple
- [x] Remove "Pastels" from color options
- [x] Ensure 12px minimum padding between form field labels and input boxes
- [x] Add Number shape quantity selection (1 number vs 2 numbers)
- [x] Implement Number shape pricing: 1 number = $118 (floral) / $118 (custom/hand drawn), 2 numbers = $158
- [x] Update pricing logic to handle Number shape tiers

## UI Improvements - Numbers Section
- [x] Combine "Select Size" and "Configure Your Numbers" sections into one unified section
- [x] Add dimensions to number count cards (1 Number: 8"/20.3cm, 2 Numbers: 8"+8"/20.3cm)
- [x] Display price and dimensions together in each number option card

## Order Fulfillment Settings
- [x] Change advance notice requirement to at least 3 days
- [x] Update calendar date picker to disable dates less than 3 days from today
- [x] Update any text/labels mentioning advance notice period

## Octagon Shape Updates
- [x] Add three size options for Octagon: 6"/15.2cm, 8"/20.3cm, 2 Tier 6"+8"
- [x] Implement theme-based pricing for Octagon (Floral Bouquet vs Hand Drawn/Custom)
- [x] Update pricing logic to handle Octagon size variations

## Font Update
- [x] Change Google Fonts import to Figtree in index.html
- [x] Update CSS font-family to use Figtree

## Heart Shape Pricing Fix
- [x] Change Heart shape from 6" to 7" to match existing pricing configuration

## Visual Editor Adjustments (Latest)
- [x] Add padding to hero section container (py-24)
- [x] Change hero heading from "Create Your Custom Jelly Cake" to "Build Your Own Jelly"
