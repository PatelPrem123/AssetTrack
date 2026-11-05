import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    campus: {
      type: String,
      required: [true, 'Campus is required'],
      trim: true,
      default: 'Main Campus',
    },
    building: {
      type: String,
      required: [true, 'Building is required'],
      trim: true,
    },
    floor: {
      type: String,
      required: [true, 'Floor is required'],
      trim: true,
    },
    room: {
      type: String,
      required: [true, 'Room or Lab name is required'],
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      description: 'Human-readable derived location label, e.g. "Tower A - Floor 3 - Lab 302"',
    },
    capacity: {
      type: Number,
      default: 30,
      min: 1,
    },
    isServerRoom: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

locationSchema.pre('save', function (next) {
  this.name = `${this.building} • ${this.floor} • ${this.room}`;
  next();
});

locationSchema.index({ organizationId: 1, building: 1, floor: 1, room: 1 }, { unique: true });

export const Location = mongoose.model('Location', locationSchema);
