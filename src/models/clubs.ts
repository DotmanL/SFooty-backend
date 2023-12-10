import mongoose, { model } from "mongoose";

export interface IClub {
  name: string;
  leagueId: string;
}

interface ClubDoc extends mongoose.Document {
  name: string;
  leagueId: string;
}

interface ClubModel extends mongoose.Model<ClubDoc> {
  build(attrs: IClub): ClubDoc;
}

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leagues",
      required: true
    }
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

clubSchema.statics.build = (club: IClub) => {
  return new ClubsSchema(club);
};

const ClubsSchema = model<ClubDoc, ClubModel>("Clubs", clubSchema);
export { ClubsSchema };
