import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userVerificationSchema = mongoose.Schema({
  userId: {
    type: String,
  },
  uniqueString: {
    type: String,
  },
  createAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
});

userVerificationSchema.methods.matchUniqueString = async function (
  uniqueString
) {
  return await bcrypt.compare(uniqueString, this.uniqueString);
};

const userVerification = mongoose.model(
  "userVerification",
  userVerificationSchema
);

export default userVerification;
