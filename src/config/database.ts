import mongoose from 'mongoose'
import 'dotenv/config'

export const connectDB = async () => {
  // if (!process.env.jwt_key) {
  //   throw new Error('jwt_key must be defined');
  // }

  try {
      await mongoose.connect(`${process.env.mongoURI}`, {})
      console.log('connected to db')
  } catch (err) {
    console.log(err, 'mongo fail')
  }
}
