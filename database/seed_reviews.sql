-- =============================================================
-- Seed fake users and reviews for all approved restaurants
-- Run AFTER schema.sql and after restaurants have been approved
-- =============================================================

-- Create fake reviewer accounts (password = base64 of 'password123')
-- These users are for seeding reviews only

DECLARE
  v_uid NUMBER;
  v_count NUMBER;
BEGIN
  -- Check if seed users already exist
  SELECT COUNT(*) INTO v_count FROM USERS WHERE USERNAME = 'foodie_maya';
  IF v_count = 0 THEN
    SELECT SEQ_USER_ID.NEXTVAL INTO v_uid FROM DUAL;
    INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
    VALUES (v_uid, 'foodie_maya', 'maya.foodie@example.com', 'cGFzc3dvcmQxMjM=', 'USER');
  END IF;

  SELECT COUNT(*) INTO v_count FROM USERS WHERE USERNAME = 'chef_raj';
  IF v_count = 0 THEN
    SELECT SEQ_USER_ID.NEXTVAL INTO v_uid FROM DUAL;
    INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
    VALUES (v_uid, 'chef_raj', 'raj.chef@example.com', 'cGFzc3dvcmQxMjM=', 'USER');
  END IF;

  SELECT COUNT(*) INTO v_count FROM USERS WHERE USERNAME = 'taste_explorer';
  IF v_count = 0 THEN
    SELECT SEQ_USER_ID.NEXTVAL INTO v_uid FROM DUAL;
    INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
    VALUES (v_uid, 'taste_explorer', 'explorer@example.com', 'cGFzc3dvcmQxMjM=', 'USER');
  END IF;

  SELECT COUNT(*) INTO v_count FROM USERS WHERE USERNAME = 'dining_diva';
  IF v_count = 0 THEN
    SELECT SEQ_USER_ID.NEXTVAL INTO v_uid FROM DUAL;
    INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
    VALUES (v_uid, 'dining_diva', 'diva@example.com', 'cGFzc3dvcmQxMjM=', 'USER');
  END IF;

  SELECT COUNT(*) INTO v_count FROM USERS WHERE USERNAME = 'spice_hunter';
  IF v_count = 0 THEN
    SELECT SEQ_USER_ID.NEXTVAL INTO v_uid FROM DUAL;
    INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
    VALUES (v_uid, 'spice_hunter', 'spice@example.com', 'cGFzc3dvcmQxMjM=', 'USER');
  END IF;

  SELECT COUNT(*) INTO v_count FROM USERS WHERE USERNAME = 'weekend_eater';
  IF v_count = 0 THEN
    SELECT SEQ_USER_ID.NEXTVAL INTO v_uid FROM DUAL;
    INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
    VALUES (v_uid, 'weekend_eater', 'weekend@example.com', 'cGFzc3dvcmQxMjM=', 'USER');
  END IF;

  COMMIT;
END;
/

-- Insert reviews for every approved restaurant
-- Each restaurant gets 3-5 reviews from random seed users
DECLARE
  TYPE t_comments IS TABLE OF VARCHAR2(500) INDEX BY PLS_INTEGER;
  TYPE t_usernames IS TABLE OF VARCHAR2(50) INDEX BY PLS_INTEGER;

  v_comments t_comments;
  v_usernames t_usernames;
  v_uid NUMBER;
  v_rid NUMBER;
  v_rvid NUMBER;
  v_rating NUMBER;
  v_comment_idx NUMBER;
  v_user_idx NUMBER;
  v_existing NUMBER;

  CURSOR cur_restaurants IS
    SELECT RESTAURANT_ID FROM RESTAURANTS WHERE STATUS = 'APPROVED';
BEGIN
  -- Positive comments (for ratings 4-5)
  v_comments(1) := 'Absolutely phenomenal! The flavors were perfectly balanced and the presentation was stunning. Will definitely come back.';
  v_comments(2) := 'One of the best dining experiences in the city. The staff was incredibly attentive and the food was top-notch.';
  v_comments(3) := 'Amazing ambiance and delicious food. The butter chicken here is to die for!';
  v_comments(4) := 'Great portion sizes and authentic flavors. This is my new go-to spot for weekend dinners.';
  v_comments(5) := 'The chef really knows what they are doing. Every dish was a masterpiece. Highly recommended!';
  v_comments(6) := 'Loved the cozy atmosphere and friendly staff. The biryani was fragrant and perfectly spiced.';
  v_comments(7) := 'Outstanding quality for the price. The tandoori platter is a must-try!';
  v_comments(8) := 'Perfect date night spot. Romantic lighting, excellent wine list, and the food was exquisite.';

  -- Neutral comments (for rating 3)
  v_comments(9) := 'Decent food but nothing extraordinary. The service was a bit slow during peak hours.';
  v_comments(10) := 'Good location and nice decor, but the food was average. Some dishes were better than others.';
  v_comments(11) := 'Its an okay place. The appetizers were great but the main course was underwhelming.';

  -- Slightly negative comments (for rating 2)
  v_comments(12) := 'Had higher expectations based on the reviews. Food was mediocre and overpriced for what you get.';

  -- Seed usernames
  v_usernames(1) := 'foodie_maya';
  v_usernames(2) := 'chef_raj';
  v_usernames(3) := 'taste_explorer';
  v_usernames(4) := 'dining_diva';
  v_usernames(5) := 'spice_hunter';
  v_usernames(6) := 'weekend_eater';

  FOR rec IN cur_restaurants LOOP
    v_rid := rec.RESTAURANT_ID;

    -- Insert 4 reviews per restaurant from different users
    FOR i IN 1..4 LOOP
      v_user_idx := i; -- Use users 1-4

      -- Look up user ID
      BEGIN
        SELECT USER_ID INTO v_uid
        FROM USERS WHERE USERNAME = v_usernames(v_user_idx);
      EXCEPTION WHEN NO_DATA_FOUND THEN
        CONTINUE;
      END;

      -- Skip if review already exists for this user+restaurant
      SELECT COUNT(*) INTO v_existing
      FROM REVIEWS WHERE RESTAURANT_ID = v_rid AND USER_ID = v_uid;
      IF v_existing > 0 THEN
        CONTINUE;
      END IF;

      -- Assign ratings: mix of 5, 4, 4, 3 for a realistic avg of ~4.0
      CASE i
        WHEN 1 THEN v_rating := 5; v_comment_idx := MOD(v_rid, 8) + 1;
        WHEN 2 THEN v_rating := 4; v_comment_idx := MOD(v_rid + 2, 8) + 1;
        WHEN 3 THEN v_rating := 4; v_comment_idx := MOD(v_rid + 4, 8) + 1;
        WHEN 4 THEN v_rating := 3; v_comment_idx := MOD(v_rid, 3) + 9;
        ELSE v_rating := 4; v_comment_idx := 1;
      END CASE;

      SELECT SEQ_REVIEW_ID.NEXTVAL INTO v_rvid FROM DUAL;

      INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS, CREATED_AT)
      VALUES (
        v_rvid,
        v_rid,
        v_uid,
        v_rating,
        v_comments(v_comment_idx),
        'APPROVED',
        SYSTIMESTAMP - NUMTODSINTERVAL(DBMS_RANDOM.VALUE(1, 30) * 86400, 'SECOND')
      );
    END LOOP;
  END LOOP;

  COMMIT;
END;
/

SELECT 'Seed reviews inserted successfully' AS STATUS FROM DUAL;
