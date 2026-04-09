-- =============================================================
-- Restaurant Recommendation System — PL/SQL Objects
-- Run AFTER schema.sql and BEFORE seed.sql
-- Contains: Views, Functions, Triggers, Procedures
-- =============================================================


-- =============================================================
-- VIEWS
-- =============================================================

-- VW_PENDING_OWNERS: Owners awaiting admin approval
CREATE OR REPLACE VIEW VW_PENDING_OWNERS AS
SELECT USER_ID, USERNAME, EMAIL, LICENSE_NUMBER, CREATED_AT
FROM USERS
WHERE ROLE = 'OWNER' AND STATUS = 'PENDING';

-- VW_PENDING_RESTAURANTS: Restaurants awaiting admin approval
CREATE OR REPLACE VIEW VW_PENDING_RESTAURANTS AS
SELECT r.RESTAURANT_ID, r.NAME, r.ADDRESS, r.LATITUDE, r.LONGITUDE,
       r.PRICE_RANGE, r.PHONE, r.WEBSITE, r.CREATED_AT,
       u.USERNAME AS SUBMITTED_BY
FROM RESTAURANTS r
LEFT JOIN USERS u ON r.ADDED_BY = u.USER_ID
WHERE r.STATUS = 'PENDING';

-- VW_PENDING_REVIEWS: Reviews awaiting admin moderation
CREATE OR REPLACE VIEW VW_PENDING_REVIEWS AS
SELECT rv.REVIEW_ID, rv.RATING, rv.REVIEW_TEXT, rv.CREATED_AT,
       rv.STATUS AS REVIEW_STATUS,
       u.USERNAME AS REVIEWER,
       r.NAME AS RESTAURANT_NAME, r.RESTAURANT_ID
FROM REVIEWS rv
JOIN USERS u ON rv.USER_ID = u.USER_ID
JOIN RESTAURANTS r ON rv.RESTAURANT_ID = r.RESTAURANT_ID
WHERE rv.STATUS = 'PENDING';

-- VW_PENDING_UPDATE_REQUESTS: Field-level update requests pending approval
CREATE OR REPLACE VIEW VW_PENDING_UPDATE_REQUESTS AS
SELECT ur.REQUEST_ID, ur.RESTAURANT_ID, ur.FIELD_NAME,
       ur.OLD_VALUE, ur.NEW_VALUE, ur.STATUS, ur.CREATED_AT,
       r.NAME AS RESTAURANT_NAME,
       u.USERNAME AS OWNER_NAME
FROM UPDATE_REQUESTS ur
JOIN RESTAURANTS r ON ur.RESTAURANT_ID = r.RESTAURANT_ID
JOIN USERS u ON ur.OWNER_ID = u.USER_ID
WHERE ur.STATUS = 'PENDING';

-- VW_RESTAURANTS_WITH_RATING: Approved restaurants with average rating
CREATE OR REPLACE VIEW VW_RESTAURANTS_WITH_RATING AS
SELECT r.RESTAURANT_ID, r.NAME, r.LATITUDE, r.LONGITUDE,
       r.ADDRESS, r.PRICE_RANGE, r.PHONE, r.WEBSITE,
       ROUND(NVL(AVG(rv.RATING), 0), 1) AS AVG_RATING,
       COUNT(rv.REVIEW_ID) AS REVIEW_COUNT
FROM RESTAURANTS r
LEFT JOIN REVIEWS rv ON r.RESTAURANT_ID = rv.RESTAURANT_ID AND rv.STATUS = 'APPROVED'
WHERE r.STATUS = 'APPROVED'
GROUP BY r.RESTAURANT_ID, r.NAME, r.LATITUDE, r.LONGITUDE,
         r.ADDRESS, r.PRICE_RANGE, r.PHONE, r.WEBSITE;

-- VW_RESTAURANT_REVIEWS: Approved reviews with reviewer info
CREATE OR REPLACE VIEW VW_RESTAURANT_REVIEWS AS
SELECT rv.REVIEW_ID, rv.RATING, rv.REVIEW_TEXT AS REVIEW_COMMENT, rv.CREATED_AT,
       rv.RESTAURANT_ID,
       u.USERNAME, u.USER_ID
FROM REVIEWS rv
JOIN USERS u ON rv.USER_ID = u.USER_ID
WHERE rv.STATUS = 'APPROVED';

-- VW_RESTAURANT_CUISINES: Restaurant-to-cuisine mapping with names
CREATE OR REPLACE VIEW VW_RESTAURANT_CUISINES AS
SELECT rc.RESTAURANT_ID, c.NAME
FROM RESTAURANT_CUISINE rc
JOIN CUISINES c ON rc.CUISINE_ID = c.CUISINE_ID;

-- VW_USER_FAVORITES: User favorites with restaurant details and avg rating
CREATE OR REPLACE VIEW VW_USER_FAVORITES AS
SELECT r.RESTAURANT_ID, r.NAME, r.ADDRESS, r.PRICE_RANGE,
       ROUND(NVL(AVG(rv.RATING), 0), 1) AS AVG_RATING,
       f.USER_ID, f.ADDED_AT
FROM FAVORITES f
JOIN RESTAURANTS r ON f.RESTAURANT_ID = r.RESTAURANT_ID
LEFT JOIN REVIEWS rv ON r.RESTAURANT_ID = rv.RESTAURANT_ID AND rv.STATUS = 'APPROVED'
GROUP BY r.RESTAURANT_ID, r.NAME, r.ADDRESS, r.PRICE_RANGE, f.USER_ID, f.ADDED_AT;

-- VW_ACTIVE_EVENTS: Upcoming/ongoing events with restaurant name
CREATE OR REPLACE VIEW VW_ACTIVE_EVENTS AS
SELECT e.EVENT_ID, e.RESTAURANT_ID, e.EVENT_NAME, e.DESCRIPTION,
       e.EVENT_DATE, e.STATUS,
       r.NAME AS RESTAURANT_NAME
FROM EVENTS e
JOIN RESTAURANTS r ON e.RESTAURANT_ID = r.RESTAURANT_ID
WHERE e.STATUS IN ('UPCOMING', 'ONGOING') AND r.STATUS = 'APPROVED';

-- VW_ALL_INVITES: Admin invites with invitee and inviter details
CREATE OR REPLACE VIEW VW_ALL_INVITES AS
SELECT ai.INVITE_ID, ai.STATUS, ai.CREATED_AT,
       u1.USERNAME AS INVITEE_NAME, u1.EMAIL AS INVITEE_EMAIL,
       u2.USERNAME AS INVITED_BY_NAME
FROM ADMIN_INVITES ai
JOIN USERS u1 ON ai.INVITEE_ID = u1.USER_ID
JOIN USERS u2 ON ai.INVITED_BY = u2.USER_ID;

-- VW_INVITABLE_USERS: Users eligible for admin invite
CREATE OR REPLACE VIEW VW_INVITABLE_USERS AS
SELECT u.USER_ID, u.USERNAME, u.EMAIL, u.ROLE, u.CREATED_AT
FROM USERS u
WHERE u.ROLE = 'USER' AND u.STATUS = 'APPROVED'
AND u.USER_ID NOT IN (
  SELECT INVITEE_ID FROM ADMIN_INVITES WHERE STATUS = 'PENDING'
);

-- VW_USER_PENDING_INVITES: Pending admin invites for a specific user
CREATE OR REPLACE VIEW VW_USER_PENDING_INVITES AS
SELECT ai.INVITE_ID, ai.STATUS, ai.CREATED_AT,
       ai.INVITEE_ID,
       u.USERNAME AS INVITED_BY_NAME
FROM ADMIN_INVITES ai
JOIN USERS u ON ai.INVITED_BY = u.USER_ID
WHERE ai.STATUS = 'PENDING';

-- VW_USER_LOGIN: User authentication view
CREATE OR REPLACE VIEW VW_USER_LOGIN AS
SELECT USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE, STATUS
FROM USERS;

-- VW_RESTAURANT_EVENTS: All events for restaurant detail pages
CREATE OR REPLACE VIEW VW_RESTAURANT_EVENTS AS
SELECT EVENT_ID, RESTAURANT_ID, EVENT_NAME, DESCRIPTION, EVENT_DATE, STATUS, CREATED_AT
FROM EVENTS;

-- VW_RESTAURANT_EDIT_INFO: Restaurant fields for owner update requests
CREATE OR REPLACE VIEW VW_RESTAURANT_EDIT_INFO AS
SELECT RESTAURANT_ID, NAME, ADDRESS, PHONE, WEBSITE, PRICE_RANGE, ADDED_BY
FROM RESTAURANTS
WHERE STATUS = 'APPROVED';

-- VW_USER_PROFILE: Public user profile data
CREATE OR REPLACE VIEW VW_USER_PROFILE AS
SELECT USER_ID, USERNAME, EMAIL, ROLE, STATUS
FROM USERS;


-- =============================================================
-- FUNCTIONS
-- =============================================================

-- FN_USER_EXISTS: Returns count of users matching email or username
CREATE OR REPLACE FUNCTION FN_USER_EXISTS(
  p_email    IN VARCHAR2,
  p_username IN VARCHAR2
) RETURN NUMBER IS
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM USERS
  WHERE EMAIL = p_email OR USERNAME = p_username;
  RETURN v_count;
END;
/

-- FN_GET_USER_ROLE: Returns role for a given user ID (NULL if not found)
CREATE OR REPLACE FUNCTION FN_GET_USER_ROLE(
  p_user_id IN NUMBER
) RETURN VARCHAR2 IS
  v_role VARCHAR2(20);
BEGIN
  SELECT ROLE INTO v_role FROM USERS WHERE USER_ID = p_user_id;
  RETURN v_role;
EXCEPTION
  WHEN NO_DATA_FOUND THEN RETURN NULL;
END;
/

-- FN_RESTAURANT_OWNER: Returns ADDED_BY for an approved restaurant (NULL if not found)
CREATE OR REPLACE FUNCTION FN_RESTAURANT_OWNER(
  p_restaurant_id IN NUMBER
) RETURN NUMBER IS
  v_added_by NUMBER;
BEGIN
  SELECT ADDED_BY INTO v_added_by
  FROM RESTAURANTS
  WHERE RESTAURANT_ID = p_restaurant_id AND STATUS = 'APPROVED';
  RETURN v_added_by;
EXCEPTION
  WHEN NO_DATA_FOUND THEN RETURN NULL;
END;
/

-- FN_RESTAURANT_STATUS: Returns status of a restaurant (NULL if not found)
CREATE OR REPLACE FUNCTION FN_RESTAURANT_STATUS(
  p_restaurant_id IN NUMBER
) RETURN VARCHAR2 IS
  v_status VARCHAR2(20);
BEGIN
  SELECT STATUS INTO v_status
  FROM RESTAURANTS
  WHERE RESTAURANT_ID = p_restaurant_id;
  RETURN v_status;
EXCEPTION
  WHEN NO_DATA_FOUND THEN RETURN NULL;
END;
/

-- FN_REVIEW_EXISTS: Returns REVIEW_ID if user already reviewed restaurant (0 if not)
CREATE OR REPLACE FUNCTION FN_REVIEW_EXISTS(
  p_restaurant_id IN NUMBER,
  p_user_id       IN NUMBER
) RETURN NUMBER IS
  v_review_id NUMBER;
BEGIN
  SELECT REVIEW_ID INTO v_review_id
  FROM REVIEWS
  WHERE RESTAURANT_ID = p_restaurant_id AND USER_ID = p_user_id;
  RETURN v_review_id;
EXCEPTION
  WHEN NO_DATA_FOUND THEN RETURN 0;
END;
/

-- FN_EVENT_OWNER: Returns OWNER_ID for an event (NULL if not found)
CREATE OR REPLACE FUNCTION FN_EVENT_OWNER(
  p_event_id IN NUMBER
) RETURN NUMBER IS
  v_owner_id NUMBER;
BEGIN
  SELECT OWNER_ID INTO v_owner_id
  FROM EVENTS
  WHERE EVENT_ID = p_event_id;
  RETURN v_owner_id;
EXCEPTION
  WHEN NO_DATA_FOUND THEN RETURN NULL;
END;
/

-- FN_INVITE_OWNER: Returns INVITEE_ID for a pending invite (NULL if not found/not pending)
CREATE OR REPLACE FUNCTION FN_INVITE_OWNER(
  p_invite_id IN NUMBER
) RETURN NUMBER IS
  v_invitee_id NUMBER;
BEGIN
  SELECT INVITEE_ID INTO v_invitee_id
  FROM ADMIN_INVITES
  WHERE INVITE_ID = p_invite_id AND STATUS = 'PENDING';
  RETURN v_invitee_id;
EXCEPTION
  WHEN NO_DATA_FOUND THEN RETURN NULL;
END;
/


-- =============================================================
-- TRIGGERS (Business Logic)
-- =============================================================

-- TRG_INVITE_VALIDATE_ROLE: Only regular USERs can be invited to admin
CREATE OR REPLACE TRIGGER TRG_INVITE_VALIDATE_ROLE
BEFORE INSERT ON ADMIN_INVITES
FOR EACH ROW
DECLARE
  v_role VARCHAR2(20);
BEGIN
  SELECT ROLE INTO v_role FROM USERS WHERE USER_ID = :NEW.INVITEE_ID;
  IF v_role != 'USER' THEN
    RAISE_APPLICATION_ERROR(-20001, 'Can only invite regular users to admin role');
  END IF;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE_APPLICATION_ERROR(-20002, 'Invitee user not found');
END;
/

-- TRG_REVIEW_VALIDATE_REST: Only approved restaurants can receive new reviews
CREATE OR REPLACE TRIGGER TRG_REVIEW_VALIDATE_REST
BEFORE INSERT ON REVIEWS
FOR EACH ROW
DECLARE
  v_status VARCHAR2(20);
BEGIN
  SELECT STATUS INTO v_status FROM RESTAURANTS WHERE RESTAURANT_ID = :NEW.RESTAURANT_ID;
  IF v_status != 'APPROVED' THEN
    RAISE_APPLICATION_ERROR(-20003, 'Cannot review a non-approved restaurant');
  END IF;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE_APPLICATION_ERROR(-20004, 'Restaurant not found');
END;
/


-- =============================================================
-- PROCEDURES
-- =============================================================

-- ============ USERS DOMAIN ============

-- SP_REGISTER_USER: Register a new user account
CREATE OR REPLACE PROCEDURE SP_REGISTER_USER(
  p_username       IN VARCHAR2,
  p_email          IN VARCHAR2,
  p_password_hash  IN VARCHAR2,
  p_role           IN VARCHAR2,
  p_license_number IN VARCHAR2,
  p_status         IN VARCHAR2,
  p_new_id         OUT NUMBER
) IS
BEGIN
  SELECT SEQ_USER_ID.NEXTVAL INTO p_new_id FROM DUAL;
  INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE, LICENSE_NUMBER, STATUS)
  VALUES (p_new_id, p_username, p_email, p_password_hash, p_role, p_license_number, p_status);
END;
/

-- SP_ADD_FAVORITE: Add a restaurant to user's favorites
CREATE OR REPLACE PROCEDURE SP_ADD_FAVORITE(
  p_user_id       IN NUMBER,
  p_restaurant_id IN NUMBER,
  p_new_id        OUT NUMBER
) IS
BEGIN
  SELECT SEQ_FAVORITE_ID.NEXTVAL INTO p_new_id FROM DUAL;
  INSERT INTO FAVORITES (FAVORITE_ID, USER_ID, RESTAURANT_ID)
  VALUES (p_new_id, p_user_id, p_restaurant_id);
END;
/

-- SP_ACCEPT_INVITE: Accept admin invite and promote user to ADMIN
CREATE OR REPLACE PROCEDURE SP_ACCEPT_INVITE(
  p_invite_id IN NUMBER,
  p_user_id   IN NUMBER
) IS
BEGIN
  UPDATE ADMIN_INVITES SET STATUS = 'ACCEPTED' WHERE INVITE_ID = p_invite_id;
  UPDATE USERS SET ROLE = 'ADMIN' WHERE USER_ID = p_user_id;
END;
/

-- SP_DECLINE_INVITE: Decline an admin invite
CREATE OR REPLACE PROCEDURE SP_DECLINE_INVITE(
  p_invite_id IN NUMBER
) IS
BEGIN
  UPDATE ADMIN_INVITES SET STATUS = 'DECLINED' WHERE INVITE_ID = p_invite_id;
END;
/

-- ============ RESTAURANTS DOMAIN ============

-- SP_ADD_RESTAURANT: Insert restaurant with cuisine links (comma-separated)
CREATE OR REPLACE PROCEDURE SP_ADD_RESTAURANT(
  p_name        IN VARCHAR2,
  p_latitude    IN NUMBER,
  p_longitude   IN NUMBER,
  p_address     IN VARCHAR2,
  p_price_range IN VARCHAR2,
  p_phone       IN VARCHAR2,
  p_website     IN VARCHAR2,
  p_added_by    IN NUMBER,
  p_cuisines    IN VARCHAR2,
  p_new_id      OUT NUMBER
) IS
  v_max_id     NUMBER;
  v_cuisine    VARCHAR2(100);
  v_cuisine_id NUMBER;
  v_start      NUMBER := 1;
  v_pos        NUMBER;
  v_cuisines   VARCHAR2(2000) := p_cuisines;
BEGIN
  -- Sync sequence past current max to avoid PK conflicts
  SELECT NVL(MAX(RESTAURANT_ID), 0) INTO v_max_id FROM RESTAURANTS;
  p_new_id := 0;
  WHILE p_new_id <= v_max_id LOOP
    SELECT SEQ_RESTAURANT_ID.NEXTVAL INTO p_new_id FROM DUAL;
  END LOOP;

  -- Insert restaurant
  INSERT INTO RESTAURANTS (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS,
                           PRICE_RANGE, PHONE, WEBSITE, ADDED_BY, STATUS)
  VALUES (p_new_id, p_name, p_latitude, p_longitude, p_address,
          NVL(p_price_range, '$$'), p_phone, p_website, p_added_by, 'PENDING');

  -- Link cuisines (comma-separated input)
  IF v_cuisines IS NOT NULL AND LENGTH(TRIM(v_cuisines)) > 0 THEN
    v_cuisines := TRIM(v_cuisines) || ',';
    LOOP
      v_pos := INSTR(v_cuisines, ',', v_start);
      EXIT WHEN v_pos = 0;
      v_cuisine := TRIM(SUBSTR(v_cuisines, v_start, v_pos - v_start));
      IF v_cuisine IS NOT NULL AND LENGTH(v_cuisine) > 0 THEN
        BEGIN
          SELECT CUISINE_ID INTO v_cuisine_id
          FROM CUISINES WHERE UPPER(NAME) = UPPER(v_cuisine);
          INSERT INTO RESTAURANT_CUISINE (RESTAURANT_ID, CUISINE_ID)
          VALUES (p_new_id, v_cuisine_id);
        EXCEPTION
          WHEN NO_DATA_FOUND THEN NULL; -- cuisine not found, skip
        END;
      END IF;
      v_start := v_pos + 1;
    END LOOP;
  END IF;
END;
/

-- SP_CREATE_UPDATE_REQUEST: Submit a per-field restaurant update request
CREATE OR REPLACE PROCEDURE SP_CREATE_UPDATE_REQUEST(
  p_restaurant_id IN NUMBER,
  p_owner_id      IN NUMBER,
  p_field_name    IN VARCHAR2,
  p_old_value     IN VARCHAR2,
  p_new_value     IN VARCHAR2,
  p_new_id        OUT NUMBER
) IS
BEGIN
  SELECT SEQ_REQUEST_ID.NEXTVAL INTO p_new_id FROM DUAL;
  INSERT INTO UPDATE_REQUESTS (REQUEST_ID, RESTAURANT_ID, OWNER_ID, FIELD_NAME, OLD_VALUE, NEW_VALUE, STATUS)
  VALUES (p_new_id, p_restaurant_id, p_owner_id, p_field_name, p_old_value, p_new_value, 'PENDING');
END;
/

-- ============ REVIEWS DOMAIN ============

-- SP_ADD_REVIEW: Insert a new review
CREATE OR REPLACE PROCEDURE SP_ADD_REVIEW(
  p_restaurant_id IN NUMBER,
  p_user_id       IN NUMBER,
  p_rating        IN NUMBER,
  p_review_text   IN VARCHAR2,
  p_new_id        OUT NUMBER
) IS
BEGIN
  SELECT SEQ_REVIEW_ID.NEXTVAL INTO p_new_id FROM DUAL;
  INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS)
  VALUES (p_new_id, p_restaurant_id, p_user_id, p_rating, p_review_text, 'APPROVED');
END;
/

-- SP_UPDATE_REVIEW: Update an existing review's rating and text
CREATE OR REPLACE PROCEDURE SP_UPDATE_REVIEW(
  p_restaurant_id IN NUMBER,
  p_user_id       IN NUMBER,
  p_rating        IN NUMBER,
  p_review_text   IN VARCHAR2
) IS
BEGIN
  UPDATE REVIEWS
  SET RATING = p_rating, REVIEW_TEXT = p_review_text,
      STATUS = 'APPROVED', CREATED_AT = SYSTIMESTAMP
  WHERE RESTAURANT_ID = p_restaurant_id AND USER_ID = p_user_id;
END;
/

-- ============ EVENTS DOMAIN ============

-- SP_ADD_EVENT: Create a new restaurant event
CREATE OR REPLACE PROCEDURE SP_ADD_EVENT(
  p_restaurant_id IN NUMBER,
  p_owner_id      IN NUMBER,
  p_event_name    IN VARCHAR2,
  p_description   IN VARCHAR2,
  p_event_date    IN VARCHAR2,
  p_new_id        OUT NUMBER
) IS
BEGIN
  SELECT SEQ_EVENT_ID.NEXTVAL INTO p_new_id FROM DUAL;
  INSERT INTO EVENTS (EVENT_ID, RESTAURANT_ID, OWNER_ID, EVENT_NAME, DESCRIPTION, EVENT_DATE, STATUS)
  VALUES (p_new_id, p_restaurant_id, p_owner_id, p_event_name, p_description,
          TO_DATE(p_event_date, 'YYYY-MM-DD'), 'UPCOMING');
END;
/

-- SP_DELETE_EVENT: Delete an event by ID
CREATE OR REPLACE PROCEDURE SP_DELETE_EVENT(
  p_event_id IN NUMBER
) IS
BEGIN
  DELETE FROM EVENTS WHERE EVENT_ID = p_event_id;
END;
/

-- ============ ADMIN DOMAIN ============

-- SP_APPROVE_OWNER: Set owner account status to APPROVED
CREATE OR REPLACE PROCEDURE SP_APPROVE_OWNER(
  p_user_id IN NUMBER
) IS
BEGIN
  UPDATE USERS SET STATUS = 'APPROVED'
  WHERE USER_ID = p_user_id AND ROLE = 'OWNER';
END;
/

-- SP_REJECT_OWNER: Set owner account status to REJECTED
CREATE OR REPLACE PROCEDURE SP_REJECT_OWNER(
  p_user_id IN NUMBER
) IS
BEGIN
  UPDATE USERS SET STATUS = 'REJECTED'
  WHERE USER_ID = p_user_id AND ROLE = 'OWNER';
END;
/

-- SP_DELETE_OWNER: Delete owner and cascade all associated data
CREATE OR REPLACE PROCEDURE SP_DELETE_OWNER(
  p_owner_id IN NUMBER
) IS
BEGIN
  DELETE FROM EVENTS WHERE OWNER_ID = p_owner_id;
  DELETE FROM UPDATE_REQUESTS WHERE OWNER_ID = p_owner_id;
  DELETE FROM FAVORITES WHERE RESTAURANT_ID IN
    (SELECT RESTAURANT_ID FROM RESTAURANTS WHERE ADDED_BY = p_owner_id);
  DELETE FROM REVIEWS WHERE RESTAURANT_ID IN
    (SELECT RESTAURANT_ID FROM RESTAURANTS WHERE ADDED_BY = p_owner_id);
  DELETE FROM RESTAURANT_CUISINE WHERE RESTAURANT_ID IN
    (SELECT RESTAURANT_ID FROM RESTAURANTS WHERE ADDED_BY = p_owner_id);
  DELETE FROM RESTAURANTS WHERE ADDED_BY = p_owner_id;
  DELETE FROM USERS WHERE USER_ID = p_owner_id AND ROLE = 'OWNER';
END;
/

-- SP_APPROVE_RESTAURANT: Set restaurant status to APPROVED
CREATE OR REPLACE PROCEDURE SP_APPROVE_RESTAURANT(
  p_restaurant_id IN NUMBER
) IS
BEGIN
  UPDATE RESTAURANTS SET STATUS = 'APPROVED'
  WHERE RESTAURANT_ID = p_restaurant_id;
END;
/

-- SP_REJECT_RESTAURANT: Set restaurant status to REJECTED
CREATE OR REPLACE PROCEDURE SP_REJECT_RESTAURANT(
  p_restaurant_id IN NUMBER
) IS
BEGIN
  UPDATE RESTAURANTS SET STATUS = 'REJECTED'
  WHERE RESTAURANT_ID = p_restaurant_id;
END;
/

-- SP_DELETE_RESTAURANT: Delete restaurant and cascade all related data
CREATE OR REPLACE PROCEDURE SP_DELETE_RESTAURANT(
  p_restaurant_id IN NUMBER
) IS
BEGIN
  DELETE FROM EVENTS WHERE RESTAURANT_ID = p_restaurant_id;
  DELETE FROM UPDATE_REQUESTS WHERE RESTAURANT_ID = p_restaurant_id;
  DELETE FROM FAVORITES WHERE RESTAURANT_ID = p_restaurant_id;
  DELETE FROM REVIEWS WHERE RESTAURANT_ID = p_restaurant_id;
  DELETE FROM RESTAURANT_CUISINE WHERE RESTAURANT_ID = p_restaurant_id;
  DELETE FROM RESTAURANTS WHERE RESTAURANT_ID = p_restaurant_id;
END;
/

-- SP_APPROVE_REVIEW: Set review status to APPROVED
CREATE OR REPLACE PROCEDURE SP_APPROVE_REVIEW(
  p_review_id IN NUMBER
) IS
BEGIN
  UPDATE REVIEWS SET STATUS = 'APPROVED'
  WHERE REVIEW_ID = p_review_id;
END;
/

-- SP_REJECT_REVIEW: Set review status to REJECTED
CREATE OR REPLACE PROCEDURE SP_REJECT_REVIEW(
  p_review_id IN NUMBER
) IS
BEGIN
  UPDATE REVIEWS SET STATUS = 'REJECTED'
  WHERE REVIEW_ID = p_review_id;
END;
/

-- SP_APPLY_UPDATE_REQUEST: Approve and apply a field-level update request
CREATE OR REPLACE PROCEDURE SP_APPLY_UPDATE_REQUEST(
  p_request_id IN NUMBER,
  p_status     OUT VARCHAR2,
  p_field_name OUT VARCHAR2
) IS
  v_restaurant_id NUMBER;
  v_field_name    VARCHAR2(50);
  v_new_value     VARCHAR2(500);
BEGIN
  -- Get request details
  BEGIN
    SELECT RESTAURANT_ID, FIELD_NAME, NEW_VALUE
    INTO v_restaurant_id, v_field_name, v_new_value
    FROM UPDATE_REQUESTS
    WHERE REQUEST_ID = p_request_id AND STATUS = 'PENDING';
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      p_status := 'NOT_FOUND';
      p_field_name := NULL;
      RETURN;
  END;

  -- Whitelist of updatable fields (prevents SQL injection)
  IF v_field_name NOT IN ('NAME', 'ADDRESS', 'PHONE', 'WEBSITE', 'PRICE_RANGE') THEN
    p_status := 'INVALID_FIELD';
    p_field_name := v_field_name;
    RETURN;
  END IF;

  -- Apply the update using dynamic SQL
  EXECUTE IMMEDIATE
    'UPDATE RESTAURANTS SET ' || v_field_name || ' = :val WHERE RESTAURANT_ID = :rsid'
    USING v_new_value, v_restaurant_id;

  -- Mark request as approved
  UPDATE UPDATE_REQUESTS SET STATUS = 'APPROVED'
  WHERE REQUEST_ID = p_request_id;

  p_status := 'SUCCESS';
  p_field_name := v_field_name;
END;
/

-- SP_REJECT_UPDATE_REQUEST: Reject a field-level update request
CREATE OR REPLACE PROCEDURE SP_REJECT_UPDATE_REQUEST(
  p_request_id IN NUMBER
) IS
BEGIN
  UPDATE UPDATE_REQUESTS SET STATUS = 'REJECTED'
  WHERE REQUEST_ID = p_request_id;
END;
/

-- SP_SEND_ADMIN_INVITE: Send an admin role invite to a user
CREATE OR REPLACE PROCEDURE SP_SEND_ADMIN_INVITE(
  p_invitee_id IN NUMBER,
  p_invited_by IN NUMBER,
  p_new_id     OUT NUMBER
) IS
BEGIN
  SELECT SEQ_INVITE_ID.NEXTVAL INTO p_new_id FROM DUAL;
  INSERT INTO ADMIN_INVITES (INVITE_ID, INVITEE_ID, INVITED_BY, STATUS)
  VALUES (p_new_id, p_invitee_id, p_invited_by, 'PENDING');
END;
/

-- ============ UTILITY ============

-- =============================================================
-- UTILITY (Continued from original code)
-- =============================================================

-- SP_SYNC_SEQUENCES: Advance all sequences past their current max ID
CREATE OR REPLACE PROCEDURE SP_SYNC_SEQUENCES IS
  TYPE t_seq_pair IS RECORD (
    seq_name VARCHAR2(30),
    tab_name VARCHAR2(30),
    col_name VARCHAR2(30)
  );
  TYPE t_pairs IS TABLE OF t_seq_pair INDEX BY PLS_INTEGER;
  v_pairs   t_pairs;
  v_max_id  NUMBER;
  v_cur_val NUMBER;
BEGIN
  v_pairs(1).seq_name := 'SEQ_USER_ID';       v_pairs(1).tab_name := 'USERS';           v_pairs(1).col_name := 'USER_ID';
  v_pairs(2).seq_name := 'SEQ_RESTAURANT_ID'; v_pairs(2).tab_name := 'RESTAURANTS';      v_pairs(2).col_name := 'RESTAURANT_ID';
  v_pairs(3).seq_name := 'SEQ_REVIEW_ID';     v_pairs(3).tab_name := 'REVIEWS';          v_pairs(3).col_name := 'REVIEW_ID';
  v_pairs(4).seq_name := 'SEQ_CUISINE_ID';    v_pairs(4).tab_name := 'CUISINES';         v_pairs(4).col_name := 'CUISINE_ID';
  v_pairs(5).seq_name := 'SEQ_FAVORITE_ID';   v_pairs(5).tab_name := 'FAVORITES';        v_pairs(5).col_name := 'FAVORITE_ID';
  v_pairs(6).seq_name := 'SEQ_REQUEST_ID';    v_pairs(6).tab_name := 'UPDATE_REQUESTS';  v_pairs(6).col_name := 'REQUEST_ID';
  v_pairs(7).seq_name := 'SEQ_EVENT_ID';      v_pairs(7).tab_name := 'EVENTS';           v_pairs(7).col_name := 'EVENT_ID';
  v_pairs(8).seq_name := 'SEQ_INVITE_ID';     v_pairs(8).tab_name := 'ADMIN_INVITES';    v_pairs(8).col_name := 'INVITE_ID';

  FOR i IN 1..v_pairs.COUNT LOOP
    EXECUTE IMMEDIATE
      'SELECT NVL(MAX(' || v_pairs(i).col_name || '), 0) FROM ' || v_pairs(i).tab_name
      INTO v_max_id;
    IF v_max_id > 0 THEN
      v_cur_val := 0;
      WHILE v_cur_val <= v_max_id LOOP
        EXECUTE IMMEDIATE
          'SELECT ' || v_pairs(i).seq_name || '.NEXTVAL FROM DUAL'
          INTO v_cur_val;
      END LOOP;
    END IF;
  END LOOP;
END;
/

-- =============================================================
-- ADDITIONAL REQUESTED OBJECTS
-- =============================================================

-- Query 5: Admin Dashboard - Count Pending Submissions
CREATE OR REPLACE VIEW VW_ADMIN_DASHBOARD_COUNTS AS
SELECT 
  (SELECT COUNT(*) FROM USERS WHERE ROLE = 'OWNER' AND STATUS = 'PENDING') AS PENDING_OWNERS,
  (SELECT COUNT(*) FROM RESTAURANTS WHERE STATUS = 'PENDING') AS PENDING_RESTAURANTS,
  (SELECT COUNT(*) FROM UPDATE_REQUESTS WHERE STATUS = 'PENDING') AS PENDING_UPDATES
FROM DUAL;

-- Function: GetAverageRating
CREATE OR REPLACE FUNCTION GetAverageRating(
  p_restaurant_id IN NUMBER
) RETURN NUMBER IS
  v_avg NUMBER;
BEGIN
  SELECT ROUND(NVL(AVG(RATING), 0), 1) INTO v_avg
  FROM REVIEWS 
  WHERE RESTAURANT_ID = p_restaurant_id AND STATUS = 'APPROVED';
  RETURN v_avg;
END;
/

-- Function: GetPriceLabel
CREATE OR REPLACE FUNCTION GetPriceLabel(
  p_price_range IN VARCHAR2
) RETURN VARCHAR2 IS
BEGIN
  CASE p_price_range
    WHEN '$' THEN RETURN 'Cheap Eats';
    WHEN '$$' THEN RETURN 'Moderately Priced';
    WHEN '$$$' THEN RETURN 'Expensive';
    WHEN '$$$$' THEN RETURN 'Very Expensive';
    ELSE RETURN 'Unknown';
  END CASE;
END;
/

-- Procedure: GetRestaurantStats
CREATE OR REPLACE PROCEDURE GetRestaurantStats(
  p_restaurant_id IN NUMBER,
  p_avg OUT NUMBER,
  p_count OUT NUMBER,
  p_max OUT NUMBER,
  p_min OUT NUMBER
) IS
BEGIN
  SELECT 
    ROUND(NVL(AVG(RATING), 0), 1),
    COUNT(*),
    NVL(MAX(RATING), 0),
    NVL(MIN(RATING), 0)
  INTO p_avg, p_count, p_max, p_min
  FROM REVIEWS
  WHERE RESTAURANT_ID = p_restaurant_id AND STATUS = 'APPROVED';
END;
/

-- Trigger 1: trg_no_duplicate_review
CREATE OR REPLACE TRIGGER trg_no_duplicate_review
BEFORE INSERT ON REVIEWS
FOR EACH ROW
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count 
  FROM REVIEWS 
  WHERE USER_ID = :NEW.USER_ID AND RESTAURANT_ID = :NEW.RESTAURANT_ID;
  
  IF v_count > 0 THEN
    RAISE_APPLICATION_ERROR(-20005, 'User has already reviewed this restaurant');
  END IF;
END;
/

-- Trigger 2: trg_approval_timestamp (Update CREATED_AT to approval time when status changes to APPROVED)
-- We use CREATED_AT here because the schema doesn't have an APPROVED_AT timestamp column.
CREATE OR REPLACE TRIGGER trg_approval_timestamp
BEFORE UPDATE OF STATUS ON RESTAURANTS
FOR EACH ROW
BEGIN
  IF :NEW.STATUS = 'APPROVED' AND :OLD.STATUS = 'PENDING' THEN
    :NEW.CREATED_AT := SYSTIMESTAMP;
  END IF;
END;
/

-- VW_ACTIVE_OWNERS: Owners already approved
CREATE OR REPLACE VIEW VW_ACTIVE_OWNERS AS
SELECT USER_ID, USERNAME, EMAIL, LICENSE_NUMBER, CREATED_AT
FROM USERS
WHERE ROLE = 'OWNER' AND STATUS = 'APPROVED';

-- VW_ALL_REGULAR_USERS: All regular users
CREATE OR REPLACE VIEW VW_ALL_REGULAR_USERS AS
SELECT USER_ID, USERNAME, EMAIL, CREATED_AT
FROM USERS
WHERE ROLE = 'USER' AND STATUS = 'APPROVED';

-- SP_DELETE_USER: Delete a regular user and their data
CREATE OR REPLACE PROCEDURE SP_DELETE_USER(
  p_user_id IN NUMBER
) IS
BEGIN
  DELETE FROM FAVORITES WHERE USER_ID = p_user_id;
  DELETE FROM REVIEWS WHERE USER_ID = p_user_id;
  DELETE FROM ADMIN_INVITES WHERE INVITEE_ID = p_user_id;
  DELETE FROM USERS WHERE USER_ID = p_user_id AND ROLE = 'USER';
END;
/
