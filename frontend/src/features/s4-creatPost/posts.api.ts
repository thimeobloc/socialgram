import { CreatePostResponseSchema, Post } from "./posts.types";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
  

async function dataPost(content: string, img: File | null, token: string): Promise<ApiResult<Post>> {
    const API_URL = import.meta.env.VITE_API_URL;
    const formData = new FormData();

    // add the image file to the form data if it exists
    formData.append("content", content);
    if (img) {
        formData.append("image", img);
    }

    const res = await fetch(`${API_URL}/posts`,{
        method: "POST",
        headers: {
        Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!res.ok) {
        return {
        ok: false,
        error: "Erreur lors de la création du post",
        };
    }

    const data: unknown = await res.json();
    const result = CreatePostResponseSchema.safeParse(data);

    if (!result.success) {
      return { ok: false, error: "Réponse du serveur invalide" };
    }

    return { ok: true, data: result.data };
}

export { dataPost };
