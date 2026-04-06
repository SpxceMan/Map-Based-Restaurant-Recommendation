SET DEFINE OFF

-- =============================================================
-- SEED DATA: 20 Restaurants in Indiranagar, Bengaluru
-- User location hardcoded at 100 Feet Road, Indiranagar
-- Coordinates clustered ~1-2 km around: 12.9784, 77.6408
-- =============================================================

-- Clear existing data (safe re-run)
DELETE FROM REVIEWS;
DELETE FROM FAVORITES;
DELETE FROM RESTAURANT_CUISINE;
DELETE FROM RESTAURANTS;
DELETE FROM CUISINES;
DELETE FROM USERS;

-- Reset sequences
DROP SEQUENCE SEQ_USER_ID;
DROP SEQUENCE SEQ_RESTAURANT_ID;
DROP SEQUENCE SEQ_REVIEW_ID;
DROP SEQUENCE SEQ_CUISINE_ID;
DROP SEQUENCE SEQ_FAVORITE_ID;

CREATE SEQUENCE SEQ_USER_ID       START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_RESTAURANT_ID START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_REVIEW_ID     START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_CUISINE_ID    START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_FAVORITE_ID   START WITH 1 INCREMENT BY 1 NOCACHE;

COMMIT;

-- =============================================================
-- USERS (admin + 10 reviewers)
-- =============================================================
INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (1, 'admin',    'admin@restaurant.com',  'YWRtaW4xMjM=', 'ADMIN');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (2, 'priya_m',  'priya@example.com',     'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (3, 'rahul_k',  'rahul@example.com',     'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (4, 'ananya_s', 'ananya@example.com',    'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (5, 'kiran_g',  'kiran@example.com',     'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (6, 'meera_v',  'meera@example.com',     'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (7, 'suresh_r', 'suresh@example.com',    'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (8, 'deepa_n',  'deepa@example.com',     'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (9, 'arjun_p',  'arjun@example.com',     'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (10, 'lakshmi_b','lakshmi@example.com',   'cGFzc3dvcmQ=', 'USER');

INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
VALUES (11, 'vijay_t',  'vijay@example.com',     'cGFzc3dvcmQ=', 'USER');

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

COMMIT;

-- =============================================================
-- RESTAURANTS (20) — Indiranagar, Bengaluru
-- User is at 12.9784, 77.6408 (100 Feet Road, Indiranagar)
-- Restaurants spread 300m–1.8km in all directions
-- =============================================================

-- 1. North-east of user (~500m)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (1, 'Taaza Thindi', 12.9821, 77.6442, '100 Feet Rd, Indiranagar, Bengaluru 560038', '$', '080-25205000', 'APPROVED', 1);

-- 2. South-west of user (~600m)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (2, 'Brahmin''s Coffee Bar', 12.9743, 77.6369, '11th Main, Indiranagar, Bengaluru 560038', '$', '080-25208888', 'APPROVED', 1);

-- 3. East of user (~700m)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (3, 'The Black Pearl', 12.9779, 77.6482, 'CMH Road, Indiranagar, Bengaluru 560038', '$$$', '080-41694169', 'APPROVED', 1);

-- 4. North of user (~800m)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (4, 'Meghana Foods', 12.9856, 77.6415, '80 Feet Rd, Indiranagar, Bengaluru 560038', '$$', '080-25201234', 'APPROVED', 1);

-- 5. South of user (~400m)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (5, 'Truffles', 12.9749, 77.6402, '100 Feet Rd, HAL 2nd Stage, Bengaluru 560008', '$$', '080-41693940', 'APPROVED', 1);

-- 6. North-west of user (~900m)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (6, 'Smoke House Deli', 12.9851, 77.6358, '12th Main, Indiranagar, Bengaluru 560038', '$$$', '080-40960049', 'APPROVED', 1);

-- 7. South-east of user (~550m)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (7, 'Shivaji Military Hotel', 12.9751, 77.6458, 'CMH Rd, Indiranagar, Bengaluru 560038', '$', '080-25200976', 'APPROVED', 1);

-- 8. West of user (~1km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (8, 'Koshy''s Restaurant', 12.9782, 77.6322, '39 St Marks Rd, Bengaluru 560001', '$$', '080-22213793', 'APPROVED', 1);

-- 9. North-east (~1.1km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (9, 'Fatty Bao', 12.9872, 77.6471, '80 Feet Rd, Indiranagar, Bengaluru 560038', '$$$', '080-41504150', 'APPROVED', 1);

-- 10. South (~1km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (10, 'Empire Restaurant', 12.9692, 77.6395, 'Church St, Bengaluru 560001', '$$', '080-22204523', 'APPROVED', 1);

-- 11. East (~1.2km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (11, 'Toit Brewpub', 12.9786, 77.6513, 'CMH Road, Indiranagar, Bengaluru 560038', '$$$', '080-41714242', 'APPROVED', 1);

-- 12. South-west (~1.3km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (12, 'Vidyarthi Bhavan', 12.9678, 77.6281, 'Gandhi Bazaar, Bengaluru 560004', '$', '080-26674977', 'APPROVED', 1);

-- 13. North (~1.3km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (13, 'Punjabi Dhaba', 12.9895, 77.6420, 'Old Airport Rd, Indiranagar, Bengaluru 560017', '$$', '080-25221212', 'APPROVED', 1);

-- 14. West (~1.4km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (14, 'Karavalli', 12.9787, 77.6273, 'Taj Gateway Hotel, Residency Rd, Bengaluru 560025', '$$$$', '080-66604545', 'APPROVED', 1);

-- 15. South-east (~1.1km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (15, 'Biryani Zone', 12.9714, 77.6463, 'Domlur, Bengaluru 560071', '$$', '080-41235678', 'APPROVED', 1);

-- 16. North-west (~1.5km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (16, 'Cafe Coffee Day - Ulsoor', 12.9891, 77.6309, 'Ulsoor Rd, Bengaluru 560042', '$', '1800-123-3444', 'APPROVED', 1);

-- 17. East-north-east (~1.5km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (17, 'Barbeque Nation', 12.9812, 77.6541, 'Domlur Layout, Bengaluru 560071', '$$$', '1800-1039-444', 'APPROVED', 1);

-- 18. South (~1.6km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (18, 'MTR (Mavalli Tiffin Room)', 12.9647, 77.6368, 'Lalbagh Rd, Basavanagudi, Bengaluru 560004', '$', '080-22220022', 'APPROVED', 1);

-- 19. North-east (~1.8km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (19, 'Mojo Pizza', 12.9903, 77.6508, 'Old Airport Rd, Domlur, Bengaluru 560017', '$$', '080-47114711', 'APPROVED', 1);

-- 20. South-west (~1.7km)
INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, STATUS, ADDED_BY)
VALUES (20, 'The Permit Room', 12.9668, 77.6309, 'Richmond Rd, Bengaluru 560025', '$$$', '080-41132323', 'APPROVED', 1);

COMMIT;

-- =============================================================
-- RESTAURANT_CUISINE links
-- =============================================================
-- Taaza Thindi (1) - South Indian
INSERT INTO RESTAURANT_CUISINE VALUES (1, 1);
-- Brahmin's Coffee Bar (2) - South Indian
INSERT INTO RESTAURANT_CUISINE VALUES (2, 1);
-- The Black Pearl (3) - Continental, Fast Food
INSERT INTO RESTAURANT_CUISINE VALUES (3, 6);
INSERT INTO RESTAURANT_CUISINE VALUES (3, 4);
-- Meghana Foods (4) - Biryani, North Indian
INSERT INTO RESTAURANT_CUISINE VALUES (4, 7);
INSERT INTO RESTAURANT_CUISINE VALUES (4, 2);
-- Truffles (5) - Continental, Fast Food
INSERT INTO RESTAURANT_CUISINE VALUES (5, 6);
INSERT INTO RESTAURANT_CUISINE VALUES (5, 4);
-- Smoke House Deli (6) - Continental, Bakery & Cafe
INSERT INTO RESTAURANT_CUISINE VALUES (6, 6);
INSERT INTO RESTAURANT_CUISINE VALUES (6, 5);
-- Shivaji Military Hotel (7) - South Indian, North Indian
INSERT INTO RESTAURANT_CUISINE VALUES (7, 1);
INSERT INTO RESTAURANT_CUISINE VALUES (7, 2);
-- Koshy's (8) - Continental, Bakery & Cafe
INSERT INTO RESTAURANT_CUISINE VALUES (8, 6);
INSERT INTO RESTAURANT_CUISINE VALUES (8, 5);
-- Fatty Bao (9) - Chinese
INSERT INTO RESTAURANT_CUISINE VALUES (9, 3);
-- Empire Restaurant (10) - North Indian, Biryani
INSERT INTO RESTAURANT_CUISINE VALUES (10, 2);
INSERT INTO RESTAURANT_CUISINE VALUES (10, 7);
-- Toit Brewpub (11) - Continental
INSERT INTO RESTAURANT_CUISINE VALUES (11, 6);
-- Vidyarthi Bhavan (12) - South Indian
INSERT INTO RESTAURANT_CUISINE VALUES (12, 1);
-- Punjabi Dhaba (13) - North Indian
INSERT INTO RESTAURANT_CUISINE VALUES (13, 2);
-- Karavalli (14) - South Indian, Continental
INSERT INTO RESTAURANT_CUISINE VALUES (14, 1);
INSERT INTO RESTAURANT_CUISINE VALUES (14, 6);
-- Biryani Zone (15) - Biryani
INSERT INTO RESTAURANT_CUISINE VALUES (15, 7);
-- Cafe Coffee Day (16) - Bakery & Cafe
INSERT INTO RESTAURANT_CUISINE VALUES (16, 5);
-- Barbeque Nation (17) - North Indian, Continental
INSERT INTO RESTAURANT_CUISINE VALUES (17, 2);
INSERT INTO RESTAURANT_CUISINE VALUES (17, 6);
-- MTR (18) - South Indian
INSERT INTO RESTAURANT_CUISINE VALUES (18, 1);
-- Mojo Pizza (19) - Fast Food
INSERT INTO RESTAURANT_CUISINE VALUES (19, 4);
-- The Permit Room (20) - South Indian, Continental
INSERT INTO RESTAURANT_CUISINE VALUES (20, 1);
INSERT INTO RESTAURANT_CUISINE VALUES (20, 6);

COMMIT;

-- =============================================================
-- REVIEWS (55 total across all 20 restaurants)
-- =============================================================
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (1, 1, 2, 5, 'Best idli-vada in Indiranagar, fresh and fluffy every time!');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (2, 1, 3, 4, 'Authentic South Indian breakfast, queue is long but worth it.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (3, 1, 4, 5, 'Love this place! The coconut chutney is divine.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (4, 2, 2, 5, 'The crispy dosa here has no equal in Bangalore. Period.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (5, 2, 5, 4, 'Go early morning for the freshest experience. Cash only!');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (6, 2, 6, 5, 'Legendary spot. The filter coffee is heaven.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (7, 2, 7, 4, 'No frills, just excellent dosa. A Bengaluru institution.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (8, 3, 3, 4, 'Great vibes and solid cocktails. The pasta is excellent.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (9, 3, 8, 5, 'Lovely ambiance, perfect for a date night on CMH Road.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (10, 3, 9, 3, 'Good food but pricey. Service was a bit slow.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (11, 4, 2, 5, 'Best Andhra biryani in Bangalore. The chicken is melt-in-mouth!');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (12, 4, 10, 4, 'Packed on weekends for a reason. Biryani is top notch.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (13, 4, 11, 5, 'Consistent quality every single visit. A must try!');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (14, 5, 4, 5, 'The chicken burger is absolutely incredible. Always fresh.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (15, 5, 5, 4, 'Comfort food done right. The fries are perfect.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (16, 5, 6, 4, 'Queues can be long but the burger is worth every minute.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (17, 6, 3, 4, 'Sophisticated brunch place. Eggs benedict are superb.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (18, 6, 7, 5, 'Best continental breakfast in Bangalore. Quiet and classy.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (19, 6, 8, 4, 'Great for a work lunch. Good WiFi and calm ambiance.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (20, 7, 9, 4, 'Military-style mutton curry is phenomenal here.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (21, 7, 10, 5, 'Best value non-veg meal in Indiranagar. Highly recommended!');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (22, 7, 11, 4, 'Authentic and spicy. Very filling portions.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (23, 8, 2, 5, 'Old Bangalore charm. The continental breakfast is iconic.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (24, 8, 4, 4, 'A heritage restaurant with consistent quality since decades.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (25, 9, 3, 5, 'Fatty Bao has the best Asian food in Bangalore. The bao is unreal!');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (26, 9, 5, 4, 'Creative Asian fusion. The ramen is excellent.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (27, 9, 7, 4, 'Trendy spot. A bit pricey but quality is outstanding.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (28, 10, 8, 4, 'Empire chicken is legendary. Great late night option too.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (29, 10, 9, 3, 'Good food but very crowded and noisy. Go at off-peak hours.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (30, 10, 11, 4, 'A Bangalore classic. The butter naan and chicken are solid.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (31, 11, 2, 5, 'Toit is Bangalore''s best microbrewery. Craft beers are superb!');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (32, 11, 6, 4, 'Great atmosphere and the food matches the drinks.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (33, 11, 10, 5, 'The weiss beer is fantastic. Must visit for craft beer lovers.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (34, 12, 3, 5, 'Vidyarthi Bhavan is a Bangalore legend. The masala dosa is perfect.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (35, 12, 4, 5, 'Crispy, buttery dosa. The chutney combination is unbeatable.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (36, 12, 5, 4, 'Heritage place with great food. Closed on Mondays!');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (37, 13, 7, 4, 'Great dal makhani and naan. Generous portions!');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (38, 13, 8, 3, 'Decent dhaba-style food. Nothing extraordinary but filling.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (39, 14, 9, 5, 'Karavalli is the best coastal cuisine restaurant in India.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (40, 14, 10, 5, 'The seafood is outstanding. A special occasion must-visit.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (41, 14, 11, 4, 'Impeccable service, authentic Mangalorean food. Worth the price.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (42, 15, 2, 4, 'Really good Hyderabadi-style biryani in Domlur.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (43, 15, 3, 3, 'Biryani is tasty but raita portions are tiny. Go for takeaway.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (44, 16, 4, 3, 'Standard CCD. Good cold coffee, nothing special about the food.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (45, 16, 7, 4, 'Nice spot to sit and work with a cappuccino. WiFi is reliable.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (46, 17, 5, 5, 'BBQ Nation is always a good time! Unlimited starters are amazing.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (47, 17, 8, 4, 'Great for groups and celebrations. Book in advance!');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (48, 17, 11, 4, 'The live grill concept is so fun. Good dessert spread too.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (49, 18, 9, 5, 'MTR is an institution. The rava idli here is world class.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (50, 18, 10, 5, 'Invented rava idli during WWII. That legacy lives on in every bite.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (51, 19, 2, 4, 'Great pizza with unique topping combos. Thin crust is excellent.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (52, 19, 11, 3, 'Decent pizza but can be slow during peak hours. Order online.');

INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (53, 20, 3, 5, 'The Permit Room nails South Indian cocktails. Totally unique concept!');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (54, 20, 4, 4, 'Creative drinks, great appams. A must-visit on Richmond Road.');
INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT) VALUES (55, 20, 5, 5, 'Best cocktail bar in Bangalore. The food is fantastic too.');

COMMIT;

-- Verify counts
SELECT 'USERS'       AS TBL, COUNT(*) AS CNT FROM USERS
UNION ALL SELECT 'RESTAURANTS', COUNT(*) FROM RESTAURANTS
UNION ALL SELECT 'CUISINES',    COUNT(*) FROM CUISINES
UNION ALL SELECT 'RC_LINKS',    COUNT(*) FROM RESTAURANT_CUISINE
UNION ALL SELECT 'REVIEWS',     COUNT(*) FROM REVIEWS;
