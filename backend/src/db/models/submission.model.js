/**
 * Code Submission Schema
 * Stores code snippets and execution results
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const codeSubmissionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ['python', 'javascript', 'java', 'cpp', 'csharp'],
      required: true,
    },
    input: {
      type: String,
    },
    output: {
      type: String,
    },
    error: {
      type: String,
    },
    executionTime: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'executing', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

const CodeSubmission = mongoose.model('CodeSubmission', codeSubmissionSchema);

module.exports = { CodeSubmission };
