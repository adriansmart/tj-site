import { MongoClient } from 'mongodb'
import type { Plugin } from 'vite'

const MONGO_URI = 'mongodb://100.109.18.78:27017'
const DB_NAME = 'combined_price_data_v2'
const COLLECTION_NAME = '2025-02-14'

export function apiPlugin(): Plugin {
  return {
    name: 'api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/symbol-counts' || req.method !== 'GET') {
          return next()
        }

        let client: MongoClient | undefined
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

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(results))
        } catch (err) {
          console.error('MongoDB query error:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Failed to fetch symbol counts' }))
        } finally {
          await client?.close()
        }
      })
    },
  }
}
