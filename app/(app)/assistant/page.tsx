
import type { Metadata } from "next";
import { ChatUI } from "@/features/assistant/components/chat-ui";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { ConversationModel, MessageModel } from "@/models/chat";

export const metadata: Metadata = {
  title: "AI Assistant",
};

type AssistantPageProps = {
  searchParams: Promise<{
    id?: string;
    new?: string;
  }>;
};

type InitialMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  fileName?: string;
};

export default async function AssistantPage({
  searchParams,
}: AssistantPageProps) {
  const user = await requireUser();
  await connectToDatabase();

  const params = await searchParams;

  // Only load conversations owned by the signed-in user.
  const allConvs = await ConversationModel.find({
    userId: user.id,
  })
    .sort({ updatedAt: -1 })
    .lean();

  const conversations = allConvs.map((conversation) => ({
    id: conversation._id.toString(),
    title: conversation.title || "New conversation",
  }));

  // Explicitly starting a new chat must not reopen the latest chat.
  const requestedId = params.id;
  const isNewChat = params.new === "1";

  const activeConvId = isNewChat
    ? undefined
    : requestedId || conversations[0]?.id;

  let initialMessages: InitialMessage[] = [];

  if (activeConvId) {
    // Validate ownership before reading messages.
    const ownedConversation = await ConversationModel.findOne({
      _id: activeConvId,
      userId: user.id,
    })
      .select("_id")
      .lean();

    if (ownedConversation) {
      const dbMessages = await MessageModel.find({
        conversationId: ownedConversation._id,
      })
        .sort({ createdAt: 1 })
        .lean();

      initialMessages = dbMessages.map((message) => ({
        id: message._id.toString(),
        role:
          message.role === "user" ? "user" : "assistant",
        content: message.content,
        fileName: message.fileName || undefined,
      }));
    }
  }

  const displayName =
    user.name || user.email.split("@")[0] || "User";

  return (
    <main className="h-[calc(100dvh-4rem)] w-full overflow-hidden">
      <ChatUI
        key={activeConvId ?? "new-chat"}
        userName={displayName}
        initialMessages={initialMessages}
        conversationId={activeConvId}
        conversations={conversations}
      />
    </main>
  );
}
