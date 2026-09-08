type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function createPost(content: string, img: File | null, token: string): Promise<ApiResult<Post>> {

  // 1. construire un FormData
    const formData = new FormData();
    formData.append("content", content);
  // 2. y ajouter "content" et éventuellement "image"
    if (img) {
        formData.append("image", img);
    }
  // 3. faire le fetch en POST vers /posts, avec le header Authorization
    const res = await fetch("/posts",{
        method: "POST",
        headers: {
        Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
  // 4. gérer le cas où res.ok est false
    if (!res.ok) {
        return {
        ok: false,
        error: "Erreur lors de la création du post",
        };
    }
  // 5. retourner { ok: true, data } ou { ok: false, error }
    const data: Post = await res.json();

    return {
        ok: true,
        data,
    };
}