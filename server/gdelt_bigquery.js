// server/gdelt_bigquery.js
// Example: query GDELT export tables in BigQuery.
// Requires: npm install @google-cloud/bigquery and GOOGLE_APPLICATION_CREDENTIALS env var set.
const { BigQuery } = require('@google-cloud/bigquery')
const bq = new BigQuery()

async function queryGdeltSample() {
  // Sample: top themes for 'Kenya' in the last 30 days from GDELT v2 events (example dataset/table names)
  const sql = `
  SELECT Actor1Name, COUNT(1) as mentions
  FROM \`gdelt-bq.full.events\`
  WHERE (Actor1Name LIKE '%Kenya%' OR Actor2Name LIKE '%Kenya%') AND DATE(TIMESTAMP_MILLIS(GLOBALEVENTID)) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) AND CURRENT_DATE()
  GROUP BY Actor1Name
  ORDER BY mentions DESC
  LIMIT 20`

  const [job] = await bq.createQueryJob({ query: sql, location: 'US' })
  const [rows] = await job.getQueryResults()
  return rows
}

module.exports = { queryGdeltSample }
