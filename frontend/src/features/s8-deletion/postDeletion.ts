import { z } from "zod";
import { DeleteResponseSchema } from "./postDeletion.schema";
import { notifyUnauthorized } from "../../shared/auth/unauthorized";

type DeleteResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export default async function Delete(
  postId: string,
  token: string,
): Promise<DeleteResult> {
  if (!postId || !token) {
    return {
      success: false,
      error: "Impossible de supprimer le post.",
    };
  }

  try {
    const response = await fetch(`http://localhost:3000/posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      notifyUnauthorized();
      return { success: false, error: "Session expirée, reconnecte-toi." };
    }

    if (!response.ok) {
      if (
        data !== null &&
        typeof data === "object" &&
        "error" in data &&
        typeof data.error === "string"
      ) {
        return {
          success: false,
          error: data.error,
        };
      }

      return {
        success: false,
        error: "Une erreur est survenue lors de la suppression.",
      };
    }

    const parsed = DeleteResponseSchema.safeParse(data);

    if (!parsed.success || !parsed.data.success) {
      return {
        success: false,
        error: "Réponse invalide du serveur.",
      };
    }
    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      error: "Impossible de contacter le serveur.",
    };
  }
}
