import mongoose, { model } from "mongoose";

export interface IInterest {
  userId: string;
  leagueIds?: string[];
  clubIds?: string[];
}

interface InterestDoc extends mongoose.Document {
  userId: string;
  leagueIds?: string[];
  clubIds?: string[];
}

interface InterestModel extends mongoose.Model<InterestDoc> {
  build(attrs: IInterest): InterestDoc;
}

const interestsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true
    },
    leagueIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Leagues"
      }
    ],
    clubIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clubs"
      }
    ]
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

interestsSchema.statics.build = (interest: IInterest) => {
  return new InterestsSchema(interest);
};

const InterestsSchema = model<InterestDoc, InterestModel>(
  "Interests",
  interestsSchema
);
export { InterestsSchema };
