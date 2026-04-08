SET DEFINE OFF

-- =============================================================
-- SEED DATA: 25 Restaurants in Indiranagar/Bengaluru
-- 20 good + 5 poorly-rated for realistic data
-- =============================================================

DELETE FROM ADMIN_INVITES;
DELETE FROM UPDATE_REQUESTS;
DELETE FROM EVENTS;
DELETE FROM REVIEWS;
DELETE FROM FAVORITES;
DELETE FROM RESTAURANT_CUISINE;
DELETE FROM RESTAURANTS;
DELETE FROM CUISINES;
DELETE FROM USERS;

DROP SEQUENCE SEQ_USER_ID;
DROP SEQUENCE SEQ_RESTAURANT_ID;
DROP SEQUENCE SEQ_REVIEW_ID;
DROP SEQUENCE SEQ_CUISINE_ID;
DROP SEQUENCE SEQ_FAVORITE_ID;
DROP SEQUENCE SEQ_REQUEST_ID;
DROP SEQUENCE SEQ_EVENT_ID;
DROP SEQUENCE SEQ_INVITE_ID;

CREATE SEQUENCE SEQ_USER_ID       START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_RESTAURANT_ID START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_REVIEW_ID     START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_CUISINE_ID    START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_FAVORITE_ID   START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_REQUEST_ID    START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_EVENT_ID      START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_INVITE_ID     START WITH 1 INCREMENT BY 1 NOCACHE;

COMMIT;

-- =============================================================
-- USERS (admin + owner + 10 reviewers)
-- =============================================================
INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (1, 'admin', 'admin@restaurant.com', 'YWRtaW4xMjM=', 'ADMIN');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (2, 'priya_m', 'priya@example.com', 'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (3, 'rahul_k', 'rahul@example.com', 'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (4, 'ananya_s', 'ananya@example.com', 'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (5, 'kiran_g', 'kiran@example.com', 'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (6, 'meera_v', 'meera@example.com', 'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (7, 'suresh_r', 'suresh@example.com', 'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (8, 'deepa_n', 'deepa@example.com', 'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (9, 'arjun_p', 'arjun@example.com', 'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (10, 'lakshmi_b', 'lakshmi@example.com', 'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (11, 'vijay_t', 'vijay@example.com', 'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE, LICENSE_NUMBER, STATUS)
VALUES (12, 'owner_demo', 'owner@restaurant.com', 'cGFzc3dvcmQ=', 'OWNER', 'LIC-BLR-2024-001', 'APPROVED');

COMMIT;

-- =============================================================
-- CUISINES
-- =============================================================
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (1, 'South Indian');
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (2, 'North Indian');
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (3, 'Chinese');
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (4, 'Fast Food');
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (5, 'Bakery & Cafe');
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (6, 'Continental');
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (7, 'Biryani');
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (8, 'Italian');
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (9, 'Mexican');
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (10, 'American');
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (11, 'Japanese');
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (12, 'Thai');
INSERT INTO CUISINES (CUISINE_ID, NAME) VALUES (13, 'Mediterranean');

COMMIT;

-- =============================================================
-- RESTAURANTS (25 total — 20 good, 5 bad)
-- =============================================================
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (1, 'Taaza Thindi', 12.9821, 77.6442, '100 Feet Rd, Indiranagar, Bengaluru 560038', '$', '080-25205000', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (2, 'Brahmin''s Coffee Bar', 12.9743, 77.6369, '11th Main, Indiranagar, Bengaluru 560038', '$', '080-25208888', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (3, 'The Black Pearl', 12.9779, 77.6482, 'CMH Road, Indiranagar, Bengaluru 560038', '$$$', '080-41694169', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (4, 'Meghana Foods', 12.9856, 77.6415, '80 Feet Rd, Indiranagar, Bengaluru 560038', '$$', '080-25201234', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (5, 'Truffles', 12.9749, 77.6402, '100 Feet Rd, HAL 2nd Stage, Bengaluru 560008', '$$', '080-41693940', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (6, 'Smoke House Deli', 12.9851, 77.6358, '12th Main, Indiranagar, Bengaluru 560038', '$$$', '080-40960049', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (7, 'Shivaji Military Hotel', 12.9751, 77.6458, 'CMH Rd, Indiranagar, Bengaluru 560038', '$', '080-25200976', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (8, 'Koshy''s Restaurant', 12.9782, 77.6322, '39 St Marks Rd, Bengaluru 560001', '$$', '080-22213793', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (9, 'Fatty Bao', 12.9872, 77.6471, '80 Feet Rd, Indiranagar, Bengaluru 560038', '$$$', '080-41504150', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (10, 'Empire Restaurant', 12.9692, 77.6395, 'Church St, Bengaluru 560001', '$$', '080-22204523', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (11, 'Toit Brewpub', 12.9786, 77.6513, 'CMH Road, Indiranagar, Bengaluru 560038', '$$$', '080-41714242', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (12, 'Vidyarthi Bhavan', 12.9678, 77.6281, 'Gandhi Bazaar, Bengaluru 560004', '$', '080-26674977', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (13, 'Punjabi Dhaba', 12.9895, 77.6420, 'Old Airport Rd, Indiranagar, Bengaluru 560017', '$$', '080-25221212', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (14, 'Karavalli', 12.9787, 77.6273, 'Taj Gateway Hotel, Residency Rd, Bengaluru 560025', '$$$$', '080-66604545', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (15, 'Biryani Zone', 12.9714, 77.6463, 'Domlur, Bengaluru 560071', '$$', '080-41235678', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (16, 'Cafe Coffee Day - Ulsoor', 12.9891, 77.6309, 'Ulsoor Rd, Bengaluru 560042', '$', '1800-123-3444', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (17, 'Barbeque Nation', 12.9812, 77.6541, 'Domlur Layout, Bengaluru 560071', '$$$', '1800-1039-444', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (18, 'MTR (Mavalli Tiffin Room)', 12.9647, 77.6368, 'Lalbagh Rd, Basavanagudi, Bengaluru 560004', '$', '080-22220022', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (19, 'Mojo Pizza', 12.9903, 77.6508, 'Old Airport Rd, Domlur, Bengaluru 560017', '$$', '080-47114711', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (20, 'The Permit Room', 12.9668, 77.6309, 'Richmond Rd, Bengaluru 560025', '$$$', '080-41132323', 'APPROVED', 1);

-- 5 bad restaurants
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (21, 'Quickbyte Canteen', 12.9805, 77.6380, '3rd Cross, Indiranagar, Bengaluru 560038', '$', '080-11223344', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (22, 'Royal Mess', 12.9760, 77.6440, '5th Main, HAL 2nd Stage, Bengaluru 560008', '$', '080-22334455', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (23, 'Dragon Palace', 12.9830, 77.6490, 'CMH Road, Indiranagar, Bengaluru 560038', '$$', '080-33445566', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (24, 'Fusion Fiesta', 12.9720, 77.6350, '80 Feet Rd, Koramangala, Bengaluru 560034', '$$$', '080-44556677', 'APPROVED', 1);

INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (25, 'Spice Garden', 12.9870, 77.6335, 'Ulsoor Rd, Bengaluru 560042', '$$', '080-55667788', 'APPROVED', 1);

COMMIT;

-- =============================================================
-- CUISINE LINKS
-- =============================================================
INSERT INTO RESTAURANT_CUISINE VALUES (1, 1);
INSERT INTO RESTAURANT_CUISINE VALUES (2, 1);
INSERT INTO RESTAURANT_CUISINE VALUES (3, 6); 
INSERT INTO RESTAURANT_CUISINE VALUES (3, 4);
INSERT INTO RESTAURANT_CUISINE VALUES (4, 7); 
INSERT INTO RESTAURANT_CUISINE VALUES (4, 2);
INSERT INTO RESTAURANT_CUISINE VALUES (5, 6); 
INSERT INTO RESTAURANT_CUISINE VALUES (5, 4);
INSERT INTO RESTAURANT_CUISINE VALUES (6, 6); 
INSERT INTO RESTAURANT_CUISINE VALUES (6, 5);
INSERT INTO RESTAURANT_CUISINE VALUES (7, 1); 
INSERT INTO RESTAURANT_CUISINE VALUES (7, 2);
INSERT INTO RESTAURANT_CUISINE VALUES (8, 6); 
INSERT INTO RESTAURANT_CUISINE VALUES (8, 5);
INSERT INTO RESTAURANT_CUISINE VALUES (9, 3);
INSERT INTO RESTAURANT_CUISINE VALUES (10, 2); 
INSERT INTO RESTAURANT_CUISINE VALUES (10, 7);
INSERT INTO RESTAURANT_CUISINE VALUES (11, 6);
INSERT INTO RESTAURANT_CUISINE VALUES (12, 1);
INSERT INTO RESTAURANT_CUISINE VALUES (13, 2);
INSERT INTO RESTAURANT_CUISINE VALUES (14, 1); 
INSERT INTO RESTAURANT_CUISINE VALUES (14, 6);
INSERT INTO RESTAURANT_CUISINE VALUES (15, 7);
INSERT INTO RESTAURANT_CUISINE VALUES (16, 5);
INSERT INTO RESTAURANT_CUISINE VALUES (17, 2); 
INSERT INTO RESTAURANT_CUISINE VALUES (17, 6);
INSERT INTO RESTAURANT_CUISINE VALUES (18, 1);
INSERT INTO RESTAURANT_CUISINE VALUES (19, 4);
INSERT INTO RESTAURANT_CUISINE VALUES (20, 1); 
INSERT INTO RESTAURANT_CUISINE VALUES (20, 6);
-- bad restaurants
INSERT INTO RESTAURANT_CUISINE VALUES (21, 1); 
INSERT INTO RESTAURANT_CUISINE VALUES (21, 4);
INSERT INTO RESTAURANT_CUISINE VALUES (22, 2); 
INSERT INTO RESTAURANT_CUISINE VALUES (22, 1);
INSERT INTO RESTAURANT_CUISINE VALUES (23, 3);
INSERT INTO RESTAURANT_CUISINE VALUES (24, 6); 
INSERT INTO RESTAURANT_CUISINE VALUES (24, 4);
INSERT INTO RESTAURANT_CUISINE VALUES (25, 2); 
INSERT INTO RESTAURANT_CUISINE VALUES (25, 1);

COMMIT;

-- =============================================================
-- REVIEWS — rich comments, all APPROVED, unique per user+restaurant
-- =============================================================

-- Taaza Thindi (1) — great: ~4.7
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (1,  1, 2, 5, 'Best idli-vada in Indiranagar! Fresh, fluffy and the coconut chutney is divine.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (2,  1, 3, 5, 'Authentic South Indian breakfast done right. Queue is long but absolutely worth it.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (3,  1, 4, 4, 'Love this place every morning. The filter coffee pairs perfectly with the vada.', 'APPROVED');

-- Brahmin''s Coffee Bar (2) — great: ~4.5
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (4,  2, 5, 5, 'The crispy dosa here has no equal in Bangalore. Period. Go before 9am.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (5,  2, 6, 4, 'Cash only, very simple setup, but the dosa is extraordinary. A true institution.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (6,  2, 7, 5, 'Legendary spot. Filter coffee is heaven. Closes by 11am so plan ahead!', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (7,  2, 8, 4, 'No frills, just excellent dosa. Been coming here for 10 years and it never disappoints.', 'APPROVED');

-- The Black Pearl (3) — good: ~4.0
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (8,  3, 2, 4, 'Great vibes and solid cocktails. The pasta carbonara is genuinely excellent.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (9,  3, 9, 5, 'Perfect for a date night on CMH Road. Lovely ambiance, good music.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (10, 3, 10, 3, 'Good food but pricey for what you get. Service was a bit slow on a Saturday.', 'APPROVED');

-- Meghana Foods (4) — great: ~4.7
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (11, 4, 3, 5, 'Best Andhra biryani in Bangalore. The chicken is melt-in-mouth with perfect spice.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (12, 4, 11, 5, 'Packed on weekends for a very good reason. Biryani is top notch every single time.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (13, 4, 4, 4, 'Consistent quality across every visit. The raita portions are generous too.', 'APPROVED');

-- Truffles (5) — great: ~4.3
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (14, 5, 5, 5, 'The chicken burger is absolutely incredible. Always fresh, always juicy.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (15, 5, 6, 4, 'Comfort food done absolutely right. The fries are crispy and perfectly salted.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (16, 5, 7, 4, 'Queues can be long on weekends but the burger is worth every minute of the wait.', 'APPROVED');

-- Smoke House Deli (6) — good: ~4.3
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (17, 6, 8, 4, 'Sophisticated brunch place. Eggs benedict are superb. Great for a lazy Sunday.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (18, 6, 9, 5, 'Best continental breakfast in Bangalore. Quiet, classy, and very consistent.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (19, 6, 10, 4, 'Great for a work lunch. Good WiFi, calm ambiance, and excellent mushroom risotto.', 'APPROVED');

-- Shivaji Military Hotel (7) — good: ~4.3
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (20, 7, 2, 4, 'Military-style mutton curry is phenomenal. Very spicy but that is the point.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (21, 7, 11, 5, 'Best value non-veg meal in Indiranagar. The keema is outstanding.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (22, 7, 3, 4, 'Authentic and fiery. Very filling portions. Not for the spice-averse!', 'APPROVED');

-- Koshy''s Restaurant (8) — great: ~4.5
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (23, 8, 4, 5, 'Old Bangalore charm at its finest. The continental breakfast is iconic and timeless.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (24, 8, 5, 4, 'A heritage restaurant with consistent quality since 1940. The steak is excellent.', 'APPROVED');

-- Fatty Bao (9) — great: ~4.3
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (25, 9, 6, 5, 'Fatty Bao has the best Asian food in Bangalore. The steamed bao is absolutely unreal!', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (26, 9, 7, 4, 'Creative Asian fusion done with real skill. The ramen broth is deeply flavourful.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (27, 9, 8, 4, 'Trendy spot with excellent food. A bit pricey but the quality is outstanding.', 'APPROVED');

-- Empire Restaurant (10) — good: ~3.7
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (28, 10, 9, 4, 'Empire chicken is legendary in Bangalore. Great late night option when nothing else is open.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (29, 10, 10, 3, 'Good food but very crowded and noisy. Go at off-peak hours for a better experience.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (30, 10, 11, 4, 'A Bangalore classic. The butter naan and chicken tikka are solid every time.', 'APPROVED');

-- Toit Brewpub (11) — great: ~4.7
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (31, 11, 2, 5, 'Toit is Bangalore best microbrewery, no contest. The weiss beer is extraordinary!', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (32, 11, 3, 4, 'Great atmosphere and the food genuinely matches the quality of the drinks.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (33, 11, 4, 5, 'Fantastic craft beers brewed in-house. The nachos are perfect with a pint.', 'APPROVED');

-- Vidyarthi Bhavan (12) — great: ~4.7
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (34, 12, 5, 5, 'Vidyarthi Bhavan is a Bangalore legend. The masala dosa is perfect — crispy with just the right filling.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (35, 12, 6, 5, 'Crispy, buttery dosa with the best chutney combination in the city. Closed Mondays!', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (36, 12, 7, 4, 'Heritage place that has been serving perfect dosas since 1943. Still the best.', 'APPROVED');

-- Punjabi Dhaba (13) — decent: ~3.5
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (37, 13, 8, 4, 'Great dal makhani and garlic naan. Generous portions and reasonable prices.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (38, 13, 9, 3, 'Decent dhaba-style food. Nothing extraordinary but filling and good value.', 'APPROVED');

-- Karavalli (14) — excellent: ~4.7
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (39, 14, 10, 5, 'Karavalli is the finest coastal cuisine restaurant in India. Absolutely breathtaking food.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (40, 14, 11, 5, 'The seafood is outstanding. A non-negotiable special occasion visit in Bangalore.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (41, 14, 2, 4, 'Impeccable service and authentic Mangalorean food. Worth every rupee.', 'APPROVED');

-- Biryani Zone (15) — decent: ~3.5
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (42, 15, 3, 4, 'Really good Hyderabadi-style biryani in Domlur. The dum cooking shows.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (43, 15, 4, 3, 'Biryani is tasty but raita portions are tiny. Better for takeaway than dine-in.', 'APPROVED');

-- Cafe Coffee Day (16) — average: ~3.5
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (44, 16, 5, 3, 'Standard CCD experience. Cold coffee is decent, food is nothing to write home about.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (45, 16, 6, 4, 'Nice quiet spot to work with a cappuccino. WiFi is reliable and AC is cold.', 'APPROVED');

-- Barbeque Nation (17) — great: ~4.3
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (46, 17, 7, 5, 'BBQ Nation is always a fantastic time! Unlimited starters on the table grill are amazing.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (47, 17, 8, 4, 'Great for groups and birthday celebrations. Book a week in advance on weekends.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (48, 17, 9, 4, 'The live grill concept is so fun. Good dessert spread and the staff are attentive.', 'APPROVED');

-- MTR (18) — excellent: ~5.0
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (49, 18, 10, 5, 'MTR is a Bangalore institution. The rava idli here is world class — soft and flavourful.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (50, 18, 11, 5, 'Invented rava idli during WWII rationing. That legendary quality still lives on in every bite.', 'APPROVED');

-- Mojo Pizza (19) — decent: ~3.5
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (51, 19, 2, 4, 'Great pizza with unique Indian-fusion topping combos. Thin crust is excellent.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (52, 19, 3, 3, 'Decent pizza but can be very slow during peak hours. Better to order online.', 'APPROVED');

-- The Permit Room (20) — great: ~4.7
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (53, 20, 4, 5, 'The Permit Room nails South Indian-inspired cocktails. Totally unique concept in Bangalore!', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (54, 20, 5, 4, 'Creative drinks, beautiful appams, and a chic ambiance. A Richmond Road must-visit.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (55, 20, 6, 5, 'Best cocktail bar in Bangalore, hands down. The food menu is fantastic too.', 'APPROVED');

-- ============================================================
-- BAD RESTAURANTS — low ratings with honest negative reviews
-- =============================================================

-- Quickbyte Canteen (21) — terrible: ~1.7
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (56, 21, 7, 2, 'Stale rice and watery sambar. The canteen smells of old oil. Would not return.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (57, 21, 8, 1, 'Got food poisoning after eating here. The dal had clearly been sitting out all day. Avoid!', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (58, 21, 9, 2, 'Food was cold, staff was rude, and the place was filthy. Not worth even the low price.', 'APPROVED');

-- Royal Mess (22) — bad: ~2.0
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (59, 22, 10, 2, 'The name says it all — it is a royal mess. Tasteless food served in dirty plates.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (60, 22, 11, 2, 'Roti was so hard I could have tiled a floor with it. Paneer was sour and old.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (61, 22, 2, 2, 'Extremely unhygienic kitchen — I saw cockroaches near the counter. Reported to BBMP.', 'APPROVED');

-- Dragon Palace (23) — bad: ~2.0
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (62, 23, 3, 2, 'The Chinese food here is an insult to Chinese food. Noodles were a clumpy, oily mess.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (63, 23, 4, 1, 'Ordered schezwan fried rice, received plain rice with red chilli powder. Not kidding.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (64, 23, 5, 3, 'Not as bad as other reviews say but still very mediocre. The spring rolls were passable.', 'APPROVED');

-- Fusion Fiesta (24) — bad: ~2.0
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (65, 24, 6, 1, 'Charges fine dining prices for food that tastes like it was microwaved from a packet. Outrageous.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (66, 24, 7, 2, 'The fusion concept means nothing here. Dal mixed with pasta is not fusion, it is disaster.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (67, 24, 8, 3, 'Decent desserts saved it from being a complete disaster. Everything else was below par.', 'APPROVED');

-- Spice Garden (25) — bad: ~2.0
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (68, 25, 9, 2, 'Waited 45 minutes for food and it arrived cold. The chicken curry had no chicken in it.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (69, 25, 10, 2, 'Dirty tables, flies everywhere, and the staff ignored us for 20 minutes. Never again.', 'APPROVED');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS) VALUES (70, 25, 11, 2, 'The only spice here is the disappointment. Bland food at prices that do not reflect quality.', 'APPROVED');

COMMIT;

-- =============================================================
-- EVENTS — sample upcoming events for some restaurants
-- =============================================================
INSERT INTO EVENTS (EVENT_ID, RESTAURANT_ID, OWNER_ID, EVENT_NAME, DESCRIPTION, EVENT_DATE, STATUS)
VALUES (1, 11, 1, 'Craft Beer Festival', 'Sample 10 exclusive micro-brewed beers with live music and snacks.', DATE '2026-04-20', 'UPCOMING');

INSERT INTO EVENTS (EVENT_ID, RESTAURANT_ID, OWNER_ID, EVENT_NAME, DESCRIPTION, EVENT_DATE, STATUS)
VALUES (2, 17, 1, 'BBQ Night Special', 'Unlimited grilled meats and sides with a live DJ. Book your table now!', DATE '2026-04-15', 'UPCOMING');

INSERT INTO EVENTS (EVENT_ID, RESTAURANT_ID, OWNER_ID, EVENT_NAME, DESCRIPTION, EVENT_DATE, STATUS)
VALUES (3, 5, 1, 'Burger Eating Contest', 'Can you eat 5 Truffles burgers in 30 minutes? Free meals for a year for the winner!', DATE '2026-04-25', 'UPCOMING');

INSERT INTO EVENTS (EVENT_ID, RESTAURANT_ID, OWNER_ID, EVENT_NAME, DESCRIPTION, EVENT_DATE, STATUS)
VALUES (4, 14, 1, 'Coastal Cuisine Masterclass', 'Learn to cook Mangalorean fish curry with our head chef. Limited to 20 seats.', DATE '2026-04-18', 'UPCOMING');

INSERT INTO EVENTS (EVENT_ID, RESTAURANT_ID, OWNER_ID, EVENT_NAME, DESCRIPTION, EVENT_DATE, STATUS)
VALUES (5, 9, 1, 'Ramen Night', 'All-you-can-eat ramen bowls with sake pairings. One night only!', DATE '2026-04-22', 'UPCOMING');

INSERT INTO EVENTS (EVENT_ID, RESTAURANT_ID, OWNER_ID, EVENT_NAME, DESCRIPTION, EVENT_DATE, STATUS)
VALUES (6, 20, 1, 'Cocktail Tasting Evening', 'Try 6 new South Indian-inspired cocktails paired with small plates.', DATE '2026-04-19', 'UPCOMING');

COMMIT;

SELECT 'USERS'       AS TBL, COUNT(*) AS CNT FROM USERS
UNION ALL SELECT 'RESTAURANTS', COUNT(*) FROM RESTAURANTS
UNION ALL SELECT 'CUISINES',    COUNT(*) FROM CUISINES
UNION ALL SELECT 'RC_LINKS',    COUNT(*) FROM RESTAURANT_CUISINE
UNION ALL SELECT 'REVIEWS',     COUNT(*) FROM REVIEWS
UNION ALL SELECT 'EVENTS',      COUNT(*) FROM EVENTS;