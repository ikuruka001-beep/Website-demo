-- GDELT BigQuery sample queries (save as server/gdelt_queries.sql)
-- 1) Top themes mentioning 'Kenya' in last 30 days (events table)
SELECT Actor1Name, COUNT(1) as mentions
FROM `gdelt-bq.full.events`
WHERE (LOWER(Actor1Name) LIKE '%kenya%' OR LOWER(Actor2Name) LIKE '%kenya%')
  AND DATE(TIMESTAMP_MILLIS(GLOBALEVENTID)) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) AND CURRENT_DATE()
GROUP BY Actor1Name
ORDER BY mentions DESC
LIMIT 50;

-- 2) Top locations (mentioned) for 'island' related tourism stories (mentions table)
SELECT LocationName, COUNT(1) as hits
FROM `gdelt-bq.full.mentions`
WHERE LOWER(MentionDocTone) LIKE '%tourism%' OR LOWER(MentionDocTone) LIKE '%island%'
GROUP BY LocationName
ORDER BY hits DESC
LIMIT 50;

-- 3) Time series of event mentions for a keyword (last 90 days)
SELECT DATE(TIMESTAMP_MILLIS(EventTimeDate)) as day, COUNT(1) as events
FROM `gdelt-bq.full.events`
WHERE LOWER(Actor1Name) LIKE '%maldives%' OR LOWER(Actor2Name) LIKE '%maldives%'
  AND DATE(TIMESTAMP_MILLIS(EventTimeDate)) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY) AND CURRENT_DATE()
GROUP BY day ORDER BY day;
