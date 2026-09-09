export default async function Delete(
  postId: string,
  token: string,
): Promise<boolean> {
  if (!postId || !token) {
    return false;
  }

  try {
    const response = await fetch(`http://localhost:3000/posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data: unknown = await response.json();

    if (typeof data !== "object" || data === null || !("success" in data)) {
      return false;
    }

    return data.success === true;
  } catch {
    return false;
  }
}
