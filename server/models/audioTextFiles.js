/*
 |--------------------------------------
 | AudioTextFiles Model
 |--------------------------------------
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const audioTextFilesSchema = new Schema({
  id: Number,
  text: { type: String, required: true }
});

module.exports = mongoose.model('audiotextfile', audioTextFilesSchema);
