import mongoose, { Schema, type Model, type Types } from "mongoose";

// Conversation Model
export interface IConversation {
  userId: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New Conversation" },
  },
  { timestamps: true }
);

export const ConversationModel: Model<IConversation> =
  (mongoose.models.Conversation as Model<IConversation>) ?? mongoose.model<IConversation>("Conversation", ConversationSchema);

// Message Model
export interface IMessage {
  conversationId: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  fileName?: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    fileName: { type: String },
  },
  { timestamps: true }
);

export const MessageModel: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) ?? mongoose.model<IMessage>("Message", MessageSchema);