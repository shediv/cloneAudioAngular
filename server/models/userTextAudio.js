/*
 |--------------------------------------
 | userTextAudio Model
 |--------------------------------------
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userTextAudioSchema = new Schema({
  userId: { type: String, required: true },
  text: { type: String, required: true },
  audioUrl: { type: String },
  isAudioReady: { type: Boolean },
  textSubmittedForProcessing: { type: Boolean },  
  createdAt: { type: Date },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('usertextaudio', userTextAudioSchema);
