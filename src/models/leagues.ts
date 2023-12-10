import mongoose, { model } from "mongoose";

export interface ILeague {
  name: string;
  country: string;
}

interface LeagueDoc extends mongoose.Document {
  name: string;
  country: string;
}

interface LeagueModel extends mongoose.Model<LeagueDoc> {
  build(attrs: ILeague): LeagueDoc;
}

const leagueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    country: { type: String, required: true }
  },

  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

leagueSchema.statics.build = (league: ILeague) => {
  return new LeaguesSchema(league);
};

const LeaguesSchema = model<LeagueDoc, LeagueModel>("Leagues", leagueSchema);
export { LeaguesSchema };
