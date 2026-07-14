import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ["user", "admin"], default: "user" },

  isAnonymous: { type: Boolean, default: false },

  profile: {
    name:    { type: String, default: "" },
    phone:   { type: String, default: "" },
    photo:   { type: String, default: "" },
    gender:  { type: String, default: "" },
    dob:     { type: String, default: "" },
    country: { type: String, default: "" },
    mobile:  { type: String, default: "" }
  },

  wallet: {
    ethAddress: { type: String, default: "" }
  },

  bankAccount: {
    accountNumber: { type: String, default: "" },
    ifsc:          { type: String, default: "" },
    bankName:      { type: String, default: "" },
    holderName:    { type: String, default: "" }
  }
}, { timestamps: true });

/* ---- Hash password before saving ---- */
userSchema.pre("save", async function () {
  // Only hash if the password field was modified (or is new)
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/* ---- Compare plain-text password against hash ---- */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ---- Never return the password field in JSON responses ---- */
userSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.password;
    return ret;
  }
});

userSchema.set("toObject", {
  transform(doc, ret) {
    delete ret.password;
    return ret;
  }
});

export default mongoose.model("User", userSchema);
