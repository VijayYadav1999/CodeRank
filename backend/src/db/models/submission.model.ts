/**
 * Code Submission Schema
 * Stores code snippets and execution results
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ICodeSubmission extends Document {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  input?: string;
  output?: string;
  error?: string;
  executionTime: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const codeSubmissionSchema = new Schema<ICodeSubmission>(
  {
    userId: {
      type: Schema.Types.ObjectId as any,
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

export const CodeSubmission = mongoose.model<ICodeSubmission>(
  'CodeSubmission',
  codeSubmissionSchema,
);
