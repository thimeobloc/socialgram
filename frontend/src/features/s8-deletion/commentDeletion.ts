import { DeleteResponseSchema } from "./postDeletion.schema";

const API_URL = import.meta.env.VITE_API_URL;

type DeleteResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteComment(
  commentId: string,
  token: string,
): Promise<DeleteResult> {
  if (!commentId || !token) {
    return { success: false, error: "Impossible de supprimer le commentaire." };
  }

  try {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      // on remonte le message du backend (403, 404…) tel quel s'il existe
      if (
        data !== null &&
        typeof data === "object" &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
      ) {
        return { success: false, error: (data as { error: string }).error };
      }
      return { success: false, error: "Une erreur est survenue lors de la suppression." };
    }

    const parsed = DeleteResponseSchema.safeParse(data);
    if (!parsed.success || !parsed.data.success) {
      return { success: false, error: "Réponse invalide du serveur." };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." };
  }
}
