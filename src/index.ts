import { app } from './app'
import { connectDB } from './config/database'

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

connectDB()

app.listen(process.env.PORT || 3001, () => {
  console.log('Listening on port 3001')
})
