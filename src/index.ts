import { app } from './app'
import { connectDB } from './config/database'

connectDB()

app.listen(3001, () => {
  console.log('Listening on port 3001')
})
