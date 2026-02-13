import express from 'express'
import { MongoClient } from 'mongodb'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PORT = process.env.PORT || 3000
const MONGO_URI = 'mongodb://100.109.18.78:27017'
const DB_NAME = 'combined_price_data_v2'
const COLLECTION_NAME = '2025-02-14'

const app = express()

// API route
app.get('/api/symbol-counts', async (_req, res) => {
  let client
  try {
    client = new MongoClient(MONGO_URI, {
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
    })
    await client.connect()

    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)

    const results = await collection.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$ts_event' } },
          },
          distinctSymbols: { $addToSet: '$symbol' },
          distinctPublishers: { $addToSet: '$publisher_id' },
          entries: { $sum: 1 },
        },
      },
      {
        $project: {
          date: '$_id',
          count: { $size: '$distinctSymbols' },
          publishers: { $size: '$distinctPublishers' },
          entries: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ], { allowDiskUse: true }).toArray()

    res.json(results)
  } catch (err) {
    console.error('MongoDB query error:', err)
    res.status(500).json({ error: 'Failed to fetch symbol counts' })
  } finally {
    await client?.close()
  }
})

// Serve static files from dist/
app.use(express.static(join(__dirname, 'dist')))

// SPA fallback — serve index.html for all other routes
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
